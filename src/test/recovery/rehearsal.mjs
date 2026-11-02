import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import sharp from "sharp";
import { inspectBackup } from "../../features/backups/inspect.ts";
import {
  createRecoveryFixture,
  recoveryTables,
  fixtureId,
  sourceOwner,
  replacementOwner,
  outsider,
} from "./fixture.mjs";

// Auth, Storage metadata and Cron are local SQL stand-ins, not Supabase services.
async function createDatabase(owner) {
  const db = new PGlite();
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth,public to anon,authenticated;
      grant execute on function auth.uid() to anon,authenticated;
      create schema storage;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      grant usage on schema storage to anon,authenticated;
      grant select,insert,update,delete on storage.objects to anon,authenticated;
      create schema cron;
      create table cron.job(jobid bigserial primary key,jobname text unique,schedule text,command text);
      create table cron.job_run_details(jobid bigint,end_time timestamptz);
      create function cron.schedule(text,text,text) returns bigint language sql as $$
        insert into cron.job(jobname,schedule,command) values($1,$2,$3)
        on conflict(jobname) do update set schedule=excluded.schedule,command=excluded.command returning jobid $$;`);
    const directory = new URL("../../../supabase/migrations/", import.meta.url);
    const migrations = (await readdir(directory))
      .filter((file) => file.endsWith(".sql"))
      .sort();
    for (const file of migrations) {
      const sql = await readFile(new URL(file, directory), "utf8");
      await db.exec(
        sql.replace(
          "create extension if not exists pg_cron with schema pg_catalog;",
          "-- Cron worker is not available in this in-memory rehearsal.",
        ),
      );
    }
    await db.query("insert into auth.users values($1),($2)", [owner, outsider]);
    await db.query("insert into private.admin_users values($1)", [owner]);
    // Only migration-generated defaults exist in these newly created local databases.
    await db.exec(
      "delete from public.faqs; delete from public.business_settings",
    );
    return { db, migrations: migrations.length };
  } catch (error) {
    await db.close();
    throw error;
  }
}
async function insertRows(db, table, rows) {
  assert.ok(recoveryTables.includes(table));
  for (const row of rows) {
    const columns = Object.keys(row);
    assert.ok(columns.every((column) => /^[a-z_]+$/.test(column)));
    await db.query(
      `insert into public.${table} (${columns.map((column) => `"${column}"`).join(",")})
       values(${columns.map((_, index) => `$${index + 1}`).join(",")})`,
      Object.values(row),
    );
  }
}
async function restoreLocalRows(db, content, failConstraint = false) {
  await db.exec(`begin;
    alter table public.enquiries disable trigger enquiry_retention;
    alter table public.reviews disable trigger review_retention;`);
  try {
    for (const table of recoveryTables)
      await insertRows(db, table, content[table]);
    for (const image of content.project_images)
      await db.query(
        "insert into storage.objects(bucket_id,name) values('project-images',$1)",
        [image.path],
      );
    if (failConstraint) {
      const missing = fixtureId(9999);
      await db.query(
        "insert into project_images(project_id,path,alt) values($1,$2,'Synthetic rollback probe')",
        [missing, `${missing}/${fixtureId(9998)}.webp`],
      );
    }
    await db.exec(`alter table public.enquiries enable trigger enquiry_retention;
      alter table public.reviews enable trigger review_retention; commit;`);
  } catch (error) {
    await db.exec("rollback");
    throw error;
  }
}
async function exportSnapshot(db, now) {
  const content = {};
  for (const table of recoveryTables) {
    const result = await db.query(
      `select coalesce(jsonb_agg(to_jsonb(t) order by t.id),'[]'::jsonb) as rows from public.${table} t`,
    );
    content[table] = result.rows[0].rows;
  }
  return {
    schemaVersion: 3,
    exportedAt: new Date(now).toISOString(),
    containsPrivateCustomerData: true,
    photoDownloadNote: "Synthetic photo bytes are backed up separately.",
    content,
  };
}
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function preparePhotos(snapshot, downloads, manifest) {
  const restored = new Map();
  for (const image of snapshot.content.project_images) {
    const bytes = downloads.get(`${image.id}.webp`);
    if (!bytes || hash(bytes) !== manifest.get(image.path))
      throw new Error("Synthetic photo backup is missing or corrupt.");
    const info = await sharp(bytes).metadata();
    assert.equal(info.format, "webp");
    assert.equal(info.width, 32);
    assert.equal(info.height, 24);
    assert.equal(info.exif, undefined);
    // Decode the entire image, not just its header.
    await sharp(bytes).raw().toBuffer();
    restored.set(image.path, Buffer.from(bytes));
  }
  return restored;
}
async function asRole(db, role, user, work) {
  assert.ok(["anon", "authenticated"].includes(role));
  await db.exec(`begin; set local role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
    user ?? "",
  ]);
  try {
    return await work();
  } finally {
    await db.exec("rollback");
  }
}
async function checkClocksEnabled(db) {
  const result = await db.query(`select tgenabled from pg_trigger
    where tgname in ('enquiry_retention','review_retention') order by tgname`);
  assert.equal(result.rows.length, 2);
  assert.ok(result.rows.every((row) => row.tgenabled === "O"));
}

// No destination, input path, connection string or environment configuration is accepted.
export async function runRecoveryRehearsal() {
  const now = Date.now();
  const fixture = await createRecoveryFixture(now);
  const source = await createDatabase(sourceOwner);
  let serialized;
  try {
    await restoreLocalRows(source.db, fixture.content);
    serialized = JSON.stringify(await exportSnapshot(source.db, now));
  } finally {
    await source.db.close();
  }
  assert.ok(!serialized.includes(sourceOwner));
  const snapshot = JSON.parse(serialized);
  const inspected = inspectBackup(snapshot);
  assert.equal(inspected.schemaVersion, 3);

  const downloads = new Map(
    snapshot.content.project_images.map((image) => [
      `${image.id}.webp`,
      Buffer.from(fixture.photos.get(image.path)),
    ]),
  );
  const manifest = new Map(
    [...fixture.photos].map(([path, bytes]) => [path, hash(bytes)]),
  );
  const photos = await preparePhotos(snapshot, downloads, manifest);
  const missing = new Map(downloads);
  missing.delete(`${snapshot.content.project_images[0].id}.webp`);
  await assert.rejects(
    preparePhotos(snapshot, missing, manifest),
    /missing or corrupt/,
  );
  const corrupt = new Map(downloads);
  corrupt.set(
    `${snapshot.content.project_images[0].id}.webp`,
    Buffer.from("Synthetic corrupt image"),
  );
  await assert.rejects(
    preparePhotos(snapshot, corrupt, manifest),
    /missing or corrupt/,
  );

  // Keep original string timestamps; never reset deadlines from the restoration date.
  const content = structuredClone(snapshot.content);
  content.enquiries = content.enquiries.filter(
    (row) =>
      row.retention_expires_at === null ||
      Date.parse(row.retention_expires_at) > now,
  );
  content.reviews = content.reviews.filter(
    (row) =>
      row.consent &&
      (row.retention_expires_at === null ||
        Date.parse(row.retention_expires_at) > now),
  );
  const selected = { ...snapshot, content };
  inspectBackup(selected);
  const target = await createDatabase(replacementOwner);
  try {
    // Verify a SQL constraint failure rolls back rows and trigger changes together.
    await assert.rejects(
      restoreLocalRows(target.db, content, true),
      (error) => error.code === "23503",
    );
    for (const table of recoveryTables)
      assert.equal(
        (
          await target.db.query(
            `select count(*)::int as count from public.${table}`,
          )
        ).rows[0].count,
        0,
      );
    await checkClocksEnabled(target.db);
    await restoreLocalRows(target.db, content);
    await checkClocksEnabled(target.db);
    const recovered = await exportSnapshot(target.db, now);
    // JSON generated inside Postgres preserves the source's microsecond timestamps.
    assert.deepEqual(recovered.content, content);
    assert.equal(
      (
        await target.db.query(
          "select count(*)::int as count from private.intake_credentials",
        )
      ).rows[0].count,
      0,
    );
    assert.equal(
      (
        await target.db.query(
          "select count(*)::int as count from private.intake_requests",
        )
      ).rows[0].count,
      0,
    );
    assert.deepEqual(
      (await target.db.query("select user_id from private.admin_users")).rows,
      [{ user_id: replacementOwner }],
    );

    for (const [role, user] of [
      ["anon", null],
      ["authenticated", outsider],
      ["authenticated", sourceOwner],
    ]) {
      await asRole(target.db, role, user, async () => {
        assert.equal(
          (await target.db.query("select is_admin() as allowed")).rows[0]
            .allowed,
          false,
        );
        for (const table of [
          "projects",
          "project_images",
          "reviews",
          "services",
          "faqs",
        ])
          assert.equal(
            (await target.db.query(`select id from public.${table}`)).rows
              .length,
            1,
          );
        const visible = (
          await target.db.query("select name from storage.objects")
        ).rows.map((row) => row.name);
        assert.deepEqual(visible, [content.project_images[0].path]);
        assert.ok(photos.has(visible[0]));
        if (role === "anon")
          await assert.rejects(
            target.db.query("select id from enquiries"),
            /permission denied/,
          );
        else {
          assert.equal(
            (await target.db.query("select id from enquiries")).rows.length,
            0,
          );
          assert.equal(
            (
              await target.db.query(
                "update projects set title='Synthetic forbidden edit' returning id",
              )
            ).rows.length,
            0,
          );
        }
      });
    }
    await asRole(target.db, "authenticated", replacementOwner, async () => {
      assert.equal(
        (await target.db.query("select is_admin() as allowed")).rows[0].allowed,
        true,
      );
      for (const table of recoveryTables)
        assert.equal(
          (await target.db.query(`select * from public.${table}`)).rows.length,
          content[table].length,
        );
      const visible = (
        await target.db.query("select name from storage.objects")
      ).rows;
      assert.equal(visible.length, 3);
      for (const image of content.project_images)
        assert.equal(hash(photos.get(image.path)), manifest.get(image.path));
      assert.equal(
        (
          await target.db.query(
            "update projects set title='Synthetic authorised edit' where id=$1 returning id",
            [fixtureId(2)],
          )
        ).rows.length,
        1,
      );
      assert.equal(
        (
          await target.db.query(
            "delete from enquiries where id=$1 returning id",
            [fixtureId(51)],
          )
        ).rows.length,
        1,
      );
    });
    // Restored clock triggers must still reject attempts to extend old deadlines.
    const originalClock = content.enquiries.find(
      (row) => row.status === "closed",
    );
    await target.db.query(
      "update enquiries set closed_at=statement_timestamp() where id=$1",
      [originalClock.id],
    );
    assert.equal(
      (
        await target.db.query(
          "select closed_at=$1::timestamptz as preserved from enquiries where id=$2",
          [originalClock.closed_at, originalClock.id],
        )
      ).rows[0].preserved,
      true,
    );
    return {
      syntheticOnly: true,
      storage: "in-memory",
      schemaVersion: 3,
      migrationsApplied: target.migrations,
      sourceCounts: inspected.counts,
      restoredCounts: inspectBackup(recovered).counts,
      excluded: {
        expiredEnquiries: 1,
        expiredReviews: 1,
        withdrawnConsentReviews: 1,
      },
      verified: {
        sqlRollback: true,
        databaseConstraints: true,
        timestampsAndRetentionClocks: true,
        triggersReenabled: true,
        photoBytesAndObjectPaths: true,
        missingAndCorruptPhotoRejection: true,
        replacementOwnerMembership: true,
        anonymousAndNonOwnerVisibility: true,
        ownerReadsAndWrites: true,
        intakeHasNoCredential: true,
      },
      limits: [
        "Auth identities, Storage metadata and Cron are local SQL stand-ins.",
        "No provider login, sessions, Storage API, signed URL or Cron worker was exercised.",
        "Photo bytes and their checksum manifest are synthetic in-memory fixtures.",
        "This command does not accept or restore real exports, connect to providers or rotate backups.",
      ],
    };
  } finally {
    await target.db.close();
  }
}
