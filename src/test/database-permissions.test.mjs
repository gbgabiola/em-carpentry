import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

let db;
const owner = "11111111-1111-4111-8111-111111111111";
const outsider = "22222222-2222-4222-8222-222222222222";
const published = "33333333-3333-4333-8333-333333333333";
const draft = "44444444-4444-4444-8444-444444444444";
before(async () => {
  db = new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth,public to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
 create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 grant usage on schema storage to anon,authenticated; grant select,insert,update,delete on storage.objects to anon,authenticated;
 insert into auth.users values ('${owner}'),('${outsider}');`);
  await db.exec(
    await readFile(
      new URL(
        "../../supabase/migrations/202611010001_foundation.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.query("insert into private.admin_users values ($1)", [owner]);
  await db.query(
    "insert into projects(id,slug,title,summary,description,status) values ($1,'published','Published','Summary','Description','published'),($2,'draft','Secret draft','Summary','Description','draft')",
    [published, draft],
  );
  for (const project of [published, draft]) {
    const imageId =
      project === published
        ? "55555555-5555-4555-8555-555555555555"
        : "66666666-6666-4666-8666-666666666666";
    const path = `${project}/77777777-7777-4777-8777-777777777777.webp`;
    await db.query(
      "insert into project_images(id,project_id,path,alt) values($1,$2,$3,'Photo')",
      [imageId, project, path],
    );
    await db.query(
      "insert into storage.objects(bucket_id,name) values('project-images',$1)",
      [path],
    );
  }
  await db.exec(
    "insert into storage.objects(bucket_id,name) values('project-images','orphan.webp'); insert into reviews(display_name,rating,body,consent,status) values('Approved',5,'Feedback',true,'approved'),('Pending',4,'Private feedback',true,'pending'),('No consent',3,'Private feedback',false,'pending'); insert into enquiries(name,contact_method,contact_details,description) values('Private customer','email','private@example.test','Private customer request');",
  );
});
after(async () => {
  await db?.close();
});
async function asRole(role, uid, work) {
  assert.ok(["anon", "authenticated"].includes(role));
  await db.exec(`begin; set local role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
    uid || "",
  ]);
  try {
    return await work();
  } finally {
    await db.exec("rollback");
  }
}
const rows = async (sql, params = []) => (await db.query(sql, params)).rows;

test("anonymous and non-owner users cannot read drafts, private enquiries or pending reviews", async () => {
  for (const [role, uid] of [
    ["anon", null],
    ["authenticated", outsider],
  ])
    await asRole(role, uid, async () => {
      assert.equal((await rows("select * from projects")).length, 1);
      assert.equal((await rows("select * from project_images")).length, 1);
      assert.equal((await rows("select * from reviews")).length, 1);
      assert.equal((await rows("select * from business_settings")).length, 1);
      if (role === "authenticated")
        assert.equal((await rows("select * from enquiries")).length, 0);
      else
        await assert.rejects(
          rows("select * from enquiries"),
          /permission denied/,
        );
    });
});
test("owner membership is private and cannot be self-assigned", async () => {
  await asRole("authenticated", outsider, async () => {
    assert.equal(
      (await rows("select public.is_admin() as allowed"))[0].allowed,
      false,
    );
    await assert.rejects(
      rows("insert into private.admin_users values($1)", [outsider]),
      /permission denied/,
    );
  });
});
test("owner can inspect private records and non-owner cannot mutate content", async () => {
  await asRole("authenticated", owner, async () => {
    assert.equal(
      (await rows("select public.is_admin() as allowed"))[0].allowed,
      true,
    );
    assert.equal((await rows("select * from projects")).length, 2);
    assert.equal((await rows("select * from enquiries")).length, 1);
    assert.equal((await rows("select * from reviews")).length, 3);
  });
  await asRole("authenticated", outsider, async () => {
    assert.equal(
      (await rows("update projects set title='Attack' returning id")).length,
      0,
    );
    assert.equal((await rows("delete from reviews returning id")).length, 0);
    await assert.rejects(
      rows(
        "insert into projects(slug,title,summary,description) values('attack','Attack','Summary','Description')",
      ),
      /row-level security/,
    );
  });
});
test("all public submission paths remain denied at the database layer", async () => {
  for (const [role, uid] of [
    ["anon", null],
    ["authenticated", outsider],
  ]) {
    await asRole(role, uid, async () => {
      await assert.rejects(
        rows(
          "insert into enquiries(name,contact_method,contact_details,description) values('Attack','email','a@example.test','Unwanted message')",
        ),
        /permission denied/,
      );
    });
    await asRole(role, uid, async () => {
      await assert.rejects(
        rows(
          "insert into reviews(display_name,rating,body,consent) values('Attack',5,'Unwanted review',true)",
        ),
        /permission denied|row-level security/,
      );
    });
  }
});
test("publish and archive changes control visibility immediately", async () => {
  await asRole("authenticated", owner, async () => {
    await db.query("update projects set status='published' where id=$1", [
      draft,
    ]);
    await db.exec("set local role anon");
    await db.query("select set_config('request.jwt.claim.sub','',true)");
    assert.equal((await rows("select * from projects")).length, 2);
    await db.exec("set local role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
      owner,
    ]);
    await db.query("update projects set status='archived' where id=$1", [
      published,
    ]);
    await db.exec("set local role anon");
    await db.query("select set_config('request.jwt.claim.sub','',true)");
    const visible = await rows("select * from projects");
    assert.equal(visible.length, 1);
    assert.equal(visible[0].id, draft);
    assert.equal((await rows("select * from project_images")).length, 1);
  });
});
test("only approved consented reviews become public", async () => {
  await asRole("authenticated", owner, async () => {
    await db.exec(
      "update reviews set status='approved' where display_name='Pending'; set local role anon; select set_config('request.jwt.claim.sub','',true);",
    );
    assert.equal((await rows("select * from reviews")).length, 2);
  });
  await asRole("authenticated", owner, async () => {
    await assert.rejects(
      rows(
        "update reviews set status='approved' where display_name='No consent'",
      ),
      /check constraint/,
    );
  });
});
test("storage hides drafts and orphans, owner alone can upload or delete", async () => {
  await asRole("anon", null, async () => {
    assert.equal((await rows("select * from storage.objects")).length, 1);
  });
  await asRole("authenticated", owner, async () => {
    assert.equal((await rows("select * from storage.objects")).length, 3);
    await rows(
      "insert into storage.objects(bucket_id,name) values('project-images','owner.webp')",
    );
    assert.equal(
      (await rows("delete from storage.objects returning id")).length,
      4,
    );
  });
  await asRole("authenticated", outsider, async () => {
    assert.equal(
      (await rows("delete from storage.objects returning id")).length,
      0,
    );
    await assert.rejects(
      rows(
        "insert into storage.objects(bucket_id,name) values('project-images','attack.webp')",
      ),
      /row-level security/,
    );
  });
});
test("Facebook testimonials require attribution and do not need an invented rating", async () => {
  await asRole("authenticated", owner, async () => {
    await rows(
      "insert into reviews(display_name,body,source,source_url,consent,status) values('Reviewer','Genuine feedback','facebook','https://www.facebook.com/EMscarpentryworks',true,'approved')",
    );
    await db.exec("set local role anon");
    await db.query("select set_config('request.jwt.claim.sub','',true)");
    const result = await rows(
      "select rating from reviews where source='facebook'",
    );
    assert.equal(result[0].rating, null);
  });
  await asRole("authenticated", owner, async () => {
    await assert.rejects(
      rows(
        "insert into reviews(display_name,body,source,consent) values('Reviewer','Text','facebook',true)",
      ),
      /check constraint|not-null/,
    );
  });
});
