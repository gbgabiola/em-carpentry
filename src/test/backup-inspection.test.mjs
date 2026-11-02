import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import {
  mkdtemp,
  readFile,
  writeFile,
  unlink,
  rmdir,
  open,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  inspectBackup,
  MAX_BACKUP_BYTES,
} from "../features/backups/inspect.ts";

const at = "2026-11-02T00:00:00.123456+00:00";
const projectId = "11111111-1111-4111-8111-111111111111";
const imageId = "22222222-2222-4222-8222-222222222222";
const identity = (id) => ({ id, created_at: at });
function fixture() {
  return {
    schemaVersion: 2,
    exportedAt: "2026-11-02T00:00:00Z",
    containsPrivateCustomerData: true,
    photoDownloadNote: "Download photo bytes separately.",
    content: {
      projects: [
        {
          ...identity(projectId),
          updated_at: at,
          slug: "synthetic-project",
          title: "Synthetic project",
          summary: "Summary",
          description: "Description",
          category: "",
          location: "",
          completion_date: null,
          status: "draft",
          featured: false,
          comparison_enabled: false,
        },
      ],
      project_images: [
        {
          ...identity(imageId),
          project_id: projectId,
          path: `${projectId}/${imageId}.webp`,
          alt: "Synthetic image",
          display_order: 0,
          role: "gallery",
        },
      ],
      reviews: [
        {
          ...identity("33333333-3333-4333-8333-333333333333"),
          display_name: "Synthetic reviewer",
          rating: 5,
          body: "Synthetic fixture feedback",
          source: "website",
          source_url: null,
          consent: true,
          status: "approved",
        },
      ],
      enquiries: [
        {
          ...identity("44444444-4444-4444-8444-444444444444"),
          name: "PRIVATE-FIXTURE-NAME",
          contact_method: "email",
          contact_details: "private-fixture@example.test",
          description: "PRIVATE-FIXTURE-DESCRIPTION",
          suburb: "",
          status: "new",
        },
      ],
      business_settings: [
        {
          id: 1,
          about_text: "Synthetic business",
          service_area: "Test area",
          phone: "+61000000000",
          email: "business@example.test",
          facebook_url: "https://www.facebook.com/example",
        },
      ],
      services: [
        {
          ...identity("55555555-5555-4555-8555-555555555555"),
          name: "Synthetic service",
          slug: "synthetic-service",
          description: "Description",
          display_order: 0,
          status: "draft",
          publication_confirmed: false,
        },
      ],
      faqs: [
        {
          ...identity("66666666-6666-4666-8666-666666666666"),
          question: "Synthetic question?",
          answer: "Synthetic answer",
          display_order: 0,
          status: "draft",
          publication_confirmed: false,
        },
      ],
    },
  };
}

test("backup inspection checks all seven tables without changing exported values", () => {
  const input = fixture();
  const original = JSON.stringify(input);
  const summary = inspectBackup(input);
  assert.equal(JSON.stringify(input), original);
  assert.equal(summary.schemaVersion, 2);
  assert.equal(Object.keys(summary.counts).length, 7);
  assert.ok(Object.values(summary.counts).every((count) => count === 1));
  assert.equal(summary.photoFilesRequired, 1);
  assert.doesNotMatch(
    JSON.stringify(summary),
    /PRIVATE-FIXTURE|private-fixture@example/,
  );
});

test("unsupported, incomplete and unexpected credential fields are rejected", () => {
  for (const mutate of [
    (data) => {
      data.schemaVersion = 3;
    },
    (data) => {
      delete data.content.project_images;
    },
    (data) => {
      data.access_token = "PRIVATE-FIXTURE-TOKEN";
    },
    (data) => {
      data.content.projects[0].password = "PRIVATE-FIXTURE-PASSWORD";
    },
    (data) => {
      data.content.business_settings = [];
    },
  ]) {
    const data = fixture();
    mutate(data);
    assert.throws(
      () => inspectBackup(data),
      /^Error: Backup structure, version or field format is invalid\.$/,
    );
  }
});

test("duplicate identities, slugs and photo paths cannot pass backup checks", () => {
  for (const mutate of [
    (data) => {
      data.content.projects.push({ ...data.content.projects[0] });
    },
    (data) => {
      data.content.projects.push({
        ...data.content.projects[0],
        id: "77777777-7777-4777-8777-777777777777",
      });
    },
    (data) => {
      data.content.project_images.push({
        ...data.content.project_images[0],
        id: "88888888-8888-4888-8888-888888888888",
      });
    },
    (data) => {
      data.content.services.push({
        ...data.content.services[0],
        id: "99999999-9999-4999-8999-999999999999",
      });
    },
  ]) {
    const data = fixture();
    mutate(data);
    assert.throws(() => inspectBackup(data), /duplicate/);
  }
});

test("dangling image references and unsafe object paths are rejected", () => {
  const missing = fixture();
  missing.content.projects = [];
  assert.throws(() => inspectBackup(missing), /missing project/);
  for (const path of [
    "../../private-file.webp",
    `${projectId}/../file.webp`,
    `${projectId}/not-a-uuid.webp`,
    `${imageId}/${imageId}.webp`,
  ]) {
    const data = fixture();
    data.content.project_images[0].path = path;
    assert.throws(() => inspectBackup(data), /storage path/);
  }
});

test("review and confirmed-publication constraints survive export inspection", () => {
  for (const mutate of [
    (data) => {
      data.content.reviews[0].consent = false;
    },
    (data) => {
      data.content.reviews[0].rating = null;
    },
    (data) => {
      data.content.reviews[0].source = "facebook";
    },
    (data) => {
      data.content.faqs[0].status = "published";
    },
    (data) => {
      data.content.services[0].status = "published";
    },
  ]) {
    const data = fixture();
    mutate(data);
    assert.throws(() => inspectBackup(data), /requirements|confirmation/);
  }
});

test("offline CLI reports counts and safe errors without printing private values", async () => {
  const directory = await mkdtemp(join(tmpdir(), "em-backup-inspection-"));
  const valid = join(directory, "valid.json"),
    malformed = join(directory, "malformed.json"),
    oversized = join(directory, "oversized.json");
  const run = (file) =>
    spawnSync(
      process.execPath,
      [
        fileURLToPath(
          new URL("../../scripts/check-backup.mjs", import.meta.url),
        ),
        file,
      ],
      { encoding: "utf8", timeout: 15000 },
    );
  try {
    await writeFile(valid, JSON.stringify(fixture()), {
      flag: "wx",
      mode: 0o600,
    });
    await writeFile(
      malformed,
      "PRIVATE-FIXTURE-NAME private-fixture@example.test",
      { flag: "wx", mode: 0o600 },
    );
    const handle = await open(oversized, "wx", 0o600);
    await handle.truncate(MAX_BACKUP_BYTES + 1);
    await handle.close();
    const pass = run(valid),
      invalid = run(malformed),
      large = run(oversized);
    assert.equal(pass.status, 0);
    assert.match(pass.stdout, /photoFilesRequired/);
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /valid UTF-8 JSON/);
    assert.equal(large.status, 1);
    assert.match(large.stderr, /64 MiB/);
    for (const result of [pass, invalid, large])
      assert.doesNotMatch(
        result.stdout + result.stderr,
        /PRIVATE-FIXTURE|private-fixture@example/,
      );
    assert.deepEqual(JSON.parse(await readFile(valid, "utf8")), fixture());
  } finally {
    for (const file of [valid, malformed, oversized])
      await unlink(file).catch(() => {});
    await rmdir(directory);
  }
});

test("schema-v3 backups preserve retention clocks and reject missing or inconsistent deadlines", () => {
  const data = fixture();
  data.schemaVersion = 3;
  data.content.reviews[0].retention_started_at = null;
  data.content.reviews[0].retention_expires_at = null;
  data.content.enquiries[0].closed_at = null;
  data.content.enquiries[0].retention_expires_at = null;
  assert.equal(inspectBackup(data).retentionClocksIncluded, true);
  assert.equal(inspectBackup(fixture()).retentionClocksIncluded, false);
  data.content.reviews[0].status = "pending";
  data.content.reviews[0].retention_started_at = at;
  data.content.reviews[0].retention_expires_at =
    "2026-12-02T00:00:00.123456+00:00";
  data.content.enquiries[0].status = "closed";
  data.content.enquiries[0].closed_at = at;
  data.content.enquiries[0].retention_expires_at =
    "2027-01-31T00:00:00.123456+00:00";
  const original = JSON.stringify(data);
  assert.equal(inspectBackup(data).schemaVersion, 3);
  assert.equal(JSON.stringify(data), original);
  for (const mutate of [
    (x) => {
      x.content.reviews[0].retention_expires_at = null;
    },
    (x) => {
      x.content.reviews[0].retention_expires_at = "2026-12-03T00:00:00Z";
    },
    (x) => {
      x.content.reviews[0].status = "approved";
    },
    (x) => {
      x.content.enquiries[0].status = "new";
    },
    (x) => {
      x.content.enquiries[0].closed_at = null;
    },
  ]) {
    const invalid = structuredClone(data);
    mutate(invalid);
    assert.throws(() => inspectBackup(invalid), /retention clock/);
  }
  const missing = structuredClone(data);
  delete missing.content.enquiries[0].closed_at;
  assert.throws(() => inspectBackup(missing), /structure/);
});
