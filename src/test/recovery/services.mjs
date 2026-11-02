import { localDockerProxy } from "./docker-proxy.mjs";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile, readFile, cp, realpath } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { inspectBackup } from "../../features/backups/inspect.ts";
import {
  createRecoveryFixture,
  recoveryTables,
  fixtureId,
} from "./fixture.mjs";

const workspace = fileURLToPath(new URL("../../../", import.meta.url));
const excluded =
  "realtime,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor";
const npx = join(dirname(process.execPath), "npx");
export function validateServiceManifest(value, root = workspace) {
  assert.ok(
    value && /^[a-f0-9]{8}$/.test(value.nonce),
    "Invalid rehearsal manifest.",
  );
  const base = join(
    resolve(root),
    ".verification/service-recovery",
    value.nonce,
  );
  assert.equal(value.base, base);
  assert.equal(value.network, `em-carpentry-recovery-${value.nonce}`);
  assert.equal(value.stacks?.length, 2);
  for (const [index, name] of ["source", "target"].entries()) {
    const stack = value.stacks[index];
    assert.equal(stack.name, name);
    assert.equal(stack.workdir, join(base, name));
    assert.equal(stack.projectId, `${value.network}-${name}`);
    assert.equal(stack.port, index === 0 ? 56521 : 56621);
  }
  return value;
}
export function validateServiceUrl(value, port) {
  const url = new URL(value);
  assert.equal(url.protocol, "http:");
  assert.equal(url.hostname, "127.0.0.1");
  assert.equal(url.port, String(port));
  assert.equal(url.pathname, "/");
  assert.ok(!url.username && !url.password && !url.search && !url.hash);
  return url.origin;
}
function command(binary, args, input, onPhase, environment = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(binary, args, {
      env: {
        ...process.env,
        PATH: `${dirname(process.execPath)}:${process.env.PATH ?? ""}`,
        DO_NOT_TRACK: "1",
        DOCKER_HOST: "unix:///var/run/docker.sock",
        ...environment,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "";
    let diagnostics = "";
    const seen = new Set();
    const capture = (chunk, stdout) => {
      const text = chunk.toString();
      if (stdout) output += text;
      else diagnostics = (diagnostics + text).slice(-32000);
      if (onPhase)
        for (const [match, phase] of [
          [/Pulling|Downloading/, "downloading local images"],
          [
            /Starting containers|Starting database|Starting services/,
            "starting local services",
          ],
        ])
          if (match.test(text) && !seen.has(phase)) {
            seen.add(phase);
            onPhase(phase);
          }
    };
    child.stdout.on("data", (chunk) => capture(chunk, true));
    // Never emit or persist CLI output: local keys and passwords can appear there.
    child.stderr.on("data", (chunk) => capture(chunk, false));
    child.on("error", () =>
      reject(new Error("Local service command could not start.")),
    );
    child.on("close", (code) =>
      code === 0
        ? resolvePromise(output)
        : reject(
            new Error(
              `Local service command failed (${args[0]}): ${diagnostics
                .split(/\r?\n/)
                .filter(
                  (line) =>
                    /error|failed|denied|refused|closed|timeout/i.test(line) &&
                    !/secret|password|token|key\s*[:=]/i.test(line),
                )
                .slice(-3)
                .join(" ")
                .replace(/postgres(?:ql)?:\/\/\S+/g, "[connection redacted]")
                .replace(/eyJ[A-Za-z0-9_.-]+/g, "[token redacted]")
                .slice(0, 900)}`,
            ),
          ),
    );
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}
const docker = (args, input) => command("docker", args, input);
const cli = (stack, args, phase, environment) =>
  command(
    npx,
    ["--yes", "supabase@2.122.0", ...args, "--workdir", stack.workdir],
    undefined,
    phase,
    environment,
  );
async function ownedContainers(stack) {
  return (await docker(["ps", "-a", "--format", "{{.Names}}"]))
    .trim()
    .split("\n")
    .filter(
      (name) =>
        name.startsWith("supabase_") && name.endsWith(`_${stack.projectId}`),
    );
}
async function ensureNetwork(manifest) {
  try {
    const label = (
      await docker([
        "network",
        "inspect",
        "--format",
        '{{index .Labels "em-carpentry.rehearsal"}}',
        manifest.network,
      ])
    ).trim();
    assert.equal(label, manifest.nonce);
  } catch {
    await docker([
      "network",
      "create",
      "--driver",
      "bridge",
      "--opt",
      "com.docker.network.bridge.host_binding_ipv4=127.0.0.1",
      "--label",
      `em-carpentry.rehearsal=${manifest.nonce}`,
      manifest.network,
    ]);
  }
}
async function initialize() {
  const root = await realpath(workspace);
  await mkdir(join(root, ".verification"), { recursive: true });
  assert.equal(
    await realpath(join(root, ".verification")),
    join(root, ".verification"),
  );
  const nonce = randomBytes(4).toString("hex");
  const base = join(root, ".verification/service-recovery", nonce);
  const network = `em-carpentry-recovery-${nonce}`;
  const stacks = [];
  for (const [index, name] of ["source", "target"].entries()) {
    const workdir = join(base, name);
    const port = index === 0 ? 56521 : 56621;
    const projectId = `${network}-${name}`;
    await mkdir(join(workdir, "supabase"), { recursive: true });
    const config = `project_id = "${projectId}"
[api]
enabled = true
port = ${port}
schemas = ["public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000
[db]
port = ${port + 1}
shadow_port = ${port - 1}
major_version = 17
[db.seed]
enabled = false
[studio]
enabled = false
port = ${port + 2}
[auth]
enabled = true
site_url = "http://127.0.0.1:3119"
enable_signup = false
enable_anonymous_sign_ins = false
[auth.email]
# Keep email/password login available; auth.enable_signup blocks registration.
enable_signup = true
[storage]
enabled = true
file_size_limit = "5MiB"
[analytics]
enabled = false
`;
    await writeFile(join(workdir, "supabase/config.toml"), config, {
      mode: 0o600,
    });
    await cp(
      join(root, "supabase/migrations"),
      join(workdir, "supabase/migrations"),
      { recursive: true },
    );
    stacks.push({ name, workdir, projectId, port });
  }
  const manifest = validateServiceManifest(
    { nonce, base, network, stacks },
    root,
  );
  await writeFile(join(base, "manifest.json"), JSON.stringify(manifest), {
    mode: 0o600,
  });
  return manifest;
}
async function start(stack, manifest, onPhase) {
  await ensureNetwork(manifest);
  const proxy = await localDockerProxy(
    join(
      workspace,
      ".verification",
      `docker-${manifest.nonce}-${stack.name}.sock`,
    ),
    stack.projectId,
  );
  try {
    await cli(
      stack,
      ["start", "--network-id", manifest.network, "--exclude", excluded],
      onPhase,
      { DOCKER_HOST: proxy.host },
    );
  } finally {
    await proxy.close();
  }
  const names = await ownedContainers(stack);
  assert.ok(names.length >= 4, "Incomplete local stack.");
  for (const name of names) {
    const ports = JSON.parse(
      (
        await docker([
          "inspect",
          "--format",
          "{{json .NetworkSettings.Ports}}",
          name,
        ])
      ).trim(),
    );
    for (const bindings of Object.values(ports ?? {}))
      for (const binding of bindings ?? [])
        assert.equal(
          binding.HostIp,
          "127.0.0.1",
          "Test ports must be localhost-only.",
        );
  }
  const status = JSON.parse(await cli(stack, ["status", "-o", "json"]));
  const url = validateServiceUrl(status.API_URL, stack.port);
  assert.ok(status.ANON_KEY && status.SERVICE_ROLE_KEY);
  const db = names.filter((name) => name.startsWith("supabase_db_"));
  assert.equal(db.length, 1);
  const sql = async (text) => {
    const result = await docker(
      [
        "exec",
        "-i",
        db[0],
        "psql",
        "-X",
        "-q",
        "-A",
        "-t",
        "-v",
        "ON_ERROR_STOP=1",
        "-U",
        "postgres",
        "-d",
        "postgres",
      ],
      text,
    );
    return result.trim() ? JSON.parse(result.trim()) : null;
  };
  return {
    stack,
    url,
    key: status.ANON_KEY,
    adminKey: status.SERVICE_ROLE_KEY,
    sql,
  };
}
async function stop(stack) {
  const containers = await ownedContainers(stack);
  const volumes = (await docker(["volume", "ls", "--format", "{{.Name}}"]))
    .trim()
    .split("\n")
    .filter(
      (name) =>
        name.startsWith("supabase_") && name.endsWith(`_${stack.projectId}`),
    );
  if (!containers.length && !volumes.length) return;
  await cli(stack, [
    "stop",
    "--project-id",
    stack.projectId,
    "--no-backup",
    "--yes",
  ]);
  assert.equal((await ownedContainers(stack)).length, 0);
}
function jsonLiteral(value) {
  const delimiter = `$recovery_${randomBytes(8).toString("hex")}$`;
  const json = JSON.stringify(value);
  assert.ok(!json.includes(delimiter));
  return `${delimiter}${json}${delimiter}::jsonb`;
}
const uuid = (value) => {
  assert.match(
    value,
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
  );
  return `'${value}'::uuid`;
};
function snapshotSql(now) {
  const tables = recoveryTables
    .map(
      (table) =>
        `'${table}',(select coalesce(jsonb_agg(to_jsonb(t) order by t.id),'[]'::jsonb) from public.${table} t)`,
    )
    .join(",");
  return `select jsonb_build_object('schemaVersion',3,'exportedAt','${new Date(now).toISOString()}',
    'containsPrivateCustomerData',true,'photoDownloadNote','Synthetic service rehearsal photos are separate.',
    'content',jsonb_build_object(${tables}));`;
}
async function restore(runtime, content, now, fail = false) {
  let text = `begin; delete from public.faqs; delete from public.business_settings;
    alter table enquiries disable trigger enquiry_retention;
    alter table reviews disable trigger review_retention;`;
  for (const table of recoveryTables)
    text += `insert into public.${table} select * from jsonb_populate_recordset(null::public.${table},${jsonLiteral(content[table])});`;
  if (fail) {
    const id = fixtureId(9999);
    text += `insert into project_images(project_id,path,alt) values(${uuid(id)},'${id}/${fixtureId(9998)}.webp','Synthetic rollback probe');`;
  }
  text += `alter table enquiries enable trigger enquiry_retention;
    alter table reviews enable trigger review_retention;${snapshotSql(now)} commit;`;
  return runtime.sql(text);
}
const client = (runtime, key = runtime.key) =>
  createClient(runtime.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
async function actor(runtime, name) {
  const email = `${name}@example.test`;
  const password = randomBytes(24).toString("hex");
  const admin = client(runtime, runtime.adminKey);
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.equal(created.error, null, "Synthetic Auth user creation failed.");
  const sessionClient = client(runtime);
  const login = await sessionClient.auth.signInWithPassword({
    email,
    password,
  });
  const authCode = /^[a-z0-9_]{1,80}$/.test(login.error?.code ?? "")
    ? login.error.code
    : "unknown";
  assert.equal(
    login.error,
    null,
    `Synthetic Auth sign-in failed (code: ${authCode}).`,
  );
  assert.ok(login.data.session);
  return {
    id: created.data.user.id,
    email,
    password,
    sessionClient,
    session: login.data.session,
  };
}
async function membership(runtime, user) {
  await runtime.sql(
    `insert into private.admin_users(user_id) values(${uuid(user.id)});`,
  );
  const membershipResult = await user.sessionClient.rpc("is_admin");
  assert.equal(membershipResult.error, null);
  assert.equal(membershipResult.data, true);
}
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function upload(actorValue, content, photos) {
  for (const image of content.project_images) {
    const result = await actorValue.sessionClient.storage
      .from("project-images")
      .upload(image.path, photos.get(image.path), {
        contentType: "image/webp",
        upsert: false,
      });
    assert.equal(result.error, null, "Synthetic Storage upload failed.");
  }
}
async function checkViews(runtime, owner, oldSession, content, hashes) {
  const anon = client(runtime);
  const outsider = await actor(runtime, `non-owner-${runtime.stack.projectId}`);
  const old = client(runtime);
  await old.auth.setSession({
    access_token: oldSession.access_token,
    refresh_token: oldSession.refresh_token,
  });
  assert.ok(
    (await old.auth.getUser()).error,
    "Source Auth identity must not become a destination owner.",
  );
  for (const current of [anon, outsider.sessionClient]) {
    for (const table of [
      "projects",
      "project_images",
      "reviews",
      "services",
      "faqs",
    ]) {
      const result = await current.from(table).select("id");
      assert.equal(result.error, null);
      assert.equal(result.data.length, 1);
    }
    const enquiries = await current.from("enquiries").select("id");
    assert.ok(enquiries.error || enquiries.data.length === 0);
    const draft = content.project_images.find(
      (image) => image.project_id === fixtureId(2),
    );
    assert.ok(
      (await current.storage.from("project-images").download(draft.path)).error,
    );
  }
  for (const image of content.project_images) {
    const result = await owner.sessionClient.storage
      .from("project-images")
      .download(image.path);
    assert.equal(result.error, null);
    assert.equal(
      hash(Buffer.from(await result.data.arrayBuffer())),
      hashes.get(image.path),
    );
  }
  const published = content.project_images.find(
    (image) => image.project_id === fixtureId(1),
  );
  const publicPhoto = await anon.storage
    .from("project-images")
    .download(published.path);
  assert.equal(publicPhoto.error, null);
  assert.equal(
    hash(Buffer.from(await publicPhoto.data.arrayBuffer())),
    hashes.get(published.path),
  );
  const signup = await anon.auth.signUp({
    email: "blocked-signup@example.test",
    password: randomBytes(24).toString("hex"),
  });
  assert.ok(signup.error, "Public signup must remain disabled.");
  const refreshed = await owner.sessionClient.auth.refreshSession();
  assert.equal(refreshed.error, null);
  assert.equal(refreshed.data.user.id, owner.id);
}
async function checkCron(runtime, fixture) {
  const job = await runtime.sql(
    `select jsonb_build_object('active',active,'schedule',schedule) from cron.job where jobname='em-carpentry-submission-retention';`,
  );
  assert.equal(job.active, true);
  assert.equal(job.schedule, "0 * * * *");
  const expired = fixture.content.enquiries.find(
    (row) =>
      row.status === "closed" &&
      Date.parse(row.retention_expires_at) <= Date.now(),
  );
  const probe = {
    ...expired,
    id: fixtureId(8888),
    description: "Synthetic native scheduler probe.",
  };
  await runtime.sql(`begin; alter table enquiries disable trigger enquiry_retention;
    insert into enquiries select * from jsonb_populate_record(null::enquiries,${jsonLiteral(probe)});
    alter table enquiries enable trigger enquiry_retention; commit;`);
  const scheduled = await runtime.sql(
    `select jsonb_build_object('id',cron.schedule('em-carpentry-recovery-probe','1 second','select private.purge_expired_submissions();'));`,
  );
  try {
    const until = Date.now() + 45000;
    while (Date.now() < until) {
      const result = await runtime.sql(`select jsonb_build_object(
        'remaining',(select count(*) from enquiries where id=${uuid(probe.id)}),
        'succeeded',exists(select 1 from cron.job_run_details where jobid=${Number(scheduled.id)} and status='succeeded'));`);
      if (result.remaining === 0 && result.succeeded) return;
      await new Promise((done) => setTimeout(done, 1000));
    }
    throw new Error(
      "Local Cron worker did not complete the synthetic cleanup.",
    );
  } finally {
    await runtime.sql(
      `select to_jsonb(cron.unschedule(${Number(scheduled.id)}));`,
    );
  }
}

export async function runServiceRecovery({
  resumeManifest,
  phase = () => {},
} = {}) {
  assert.equal(
    process.platform,
    "linux",
    "Run this developer command in WSL/Linux.",
  );
  const root = await realpath(workspace);
  let manifest;
  if (resumeManifest) {
    const file = await realpath(resumeManifest);
    assert.ok(
      file.startsWith(`${join(root, ".verification/service-recovery")}/`),
    );
    manifest = validateServiceManifest(
      JSON.parse(await readFile(file, "utf8")),
      root,
    );
    assert.equal(file, join(manifest.base, "manifest.json"));
  } else manifest = await initialize();
  await ensureNetwork(manifest);
  const [sourceStack, targetStack] = manifest.stacks;
  let report;
  let failure;
  let stage = "source-start";
  try {
    phase("starting isolated source");
    const source = await start(sourceStack, manifest, phase);
    const sourceActor = await actor(source, `source-owner-${manifest.nonce}`);
    await membership(source, sourceActor);
    const now = Date.now();
    const fixture = await createRecoveryFixture(now);
    stage = "source-export";
    const exported = await restore(source, fixture.content, now);
    inspectBackup(exported);
    await upload(sourceActor, exported.content, fixture.photos);
    const downloads = new Map();
    const hashes = new Map();
    for (const image of exported.content.project_images) {
      const result = await sourceActor.sessionClient.storage
        .from("project-images")
        .download(image.path);
      assert.equal(result.error, null);
      const bytes = Buffer.from(await result.data.arrayBuffer());
      assert.equal(hash(bytes), hash(fixture.photos.get(image.path)));
      downloads.set(`${image.id}.webp`, bytes);
      hashes.set(image.path, hash(bytes));
    }
    const serialized = JSON.stringify(exported);
    assert.ok(!serialized.includes(sourceActor.id));
    await stop(sourceStack);
    phase("source backed up and stopped");
    stage = "destination-start";
    const target = await start(targetStack, manifest, phase);
    const targetActor = await actor(
      target,
      `replacement-owner-${manifest.nonce}`,
    );
    assert.notEqual(targetActor.id, sourceActor.id);
    await membership(target, targetActor);
    const snapshot = JSON.parse(serialized);
    const content = structuredClone(snapshot.content);
    content.enquiries = content.enquiries.filter(
      (row) =>
        !row.retention_expires_at ||
        Date.parse(row.retention_expires_at) > Date.now(),
    );
    content.reviews = content.reviews.filter(
      (row) =>
        row.consent &&
        (!row.retention_expires_at ||
          Date.parse(row.retention_expires_at) > Date.now()),
    );
    inspectBackup({ ...snapshot, content });
    stage = "destination-restore";
    await assert.rejects(restore(target, content, now, true));
    const recovered = await restore(target, content, now);
    assert.deepEqual(recovered.content, content);
    const restoredPhotos = new Map(
      content.project_images.map((image) => [
        image.path,
        downloads.get(`${image.id}.webp`),
      ]),
    );
    await upload(targetActor, content, restoredPhotos);
    stage = "destination-auth-storage";
    await checkViews(target, targetActor, sourceActor.session, content, hashes);
    phase("real Auth and Storage recovery passed");
    stage = "destination-cron";
    await checkCron(target, fixture);
    const finalSession = (await targetActor.sessionClient.auth.getSession())
      .data.session;
    assert.equal((await targetActor.sessionClient.auth.signOut()).error, null);
    assert.ok(
      (
        await targetActor.sessionClient.auth.refreshSession({
          refresh_token: finalSession.refresh_token,
        })
      ).error,
    );
    const security =
      await target.sql(`select jsonb_build_object('credentials',(select count(*) from private.intake_credentials),
      'triggers',(select count(*) from pg_trigger where tgname in ('enquiry_retention','review_retention') and tgenabled='O'));`);
    assert.equal(security.credentials, 0);
    assert.equal(security.triggers, 2);
    report = {
      syntheticOnly: true,
      localServices: true,
      localhostBindingsVerified: true,
      restoredCounts: inspectBackup(recovered).counts,
      verified: {
        realAuthProvisioning: true,
        replacementOwner: true,
        sessionRefresh: true,
        refreshRevokedAfterSignOut: true,
        publicSignupDisabled: true,
        originalTimestampsAndClocks: true,
        storageUploadDownloadAndChecksums: true,
        publicAndPrivateVisibility: true,
        realCronWorkerCleanup: true,
        hourlySchedulePresent: true,
        intakeUnconfigured: true,
      },
      limits: [
        "Local services only; no hosted disaster-recovery or provider account guarantees were exercised.",
        "No real exports, customer data, cloud credentials or application environment files were used.",
        "A signed-out access token may remain valid until expiry; refresh revocation is what this check verifies.",
      ],
    };
  } catch (error) {
    const detail =
      error instanceof Error
        ? error.message.split("\n")[0].slice(0, 160)
        : "unknown error";
    failure = new Error(
      `Local service recovery failed at ${stage} (${detail}); raw service output withheld.`,
    );
  } finally {
    phase("cleaning rehearsal containers and volumes");
    try {
      await cleanupManifest(manifest);
    } catch {
      failure = new Error(
        "Rehearsal cleanup needs attention; only the scoped local project IDs may be removed.",
      );
    }
  }
  if (failure) throw failure;
  return { ...report, rehearsalContainersAndVolumesRemoved: true };
}

async function cleanupManifest(manifest) {
  const cleanup = await Promise.allSettled(
    manifest.stacks.map((stack) => stop(stack)),
  );
  if (cleanup.some((result) => result.status === "rejected"))
    throw new Error(
      "Rehearsal cleanup needs attention; only the scoped local project IDs may be removed.",
    );
  const networks = (await docker(["network", "ls", "--format", "{{.Name}}"]))
    .trim()
    .split("\n");
  if (networks.includes(manifest.network)) {
    const label = (
      await docker([
        "network",
        "inspect",
        "--format",
        '{{index .Labels "em-carpentry.rehearsal"}}',
        manifest.network,
      ])
    ).trim();
    assert.equal(label, manifest.nonce);
    await docker(["network", "rm", manifest.network]);
  }
}
