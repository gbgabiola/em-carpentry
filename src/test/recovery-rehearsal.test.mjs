import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runRecoveryRehearsal } from "./recovery/rehearsal.mjs";

test("synthetic recovery restores all tables and photo paths while preserving retention, permissions and owner remapping", async () => {
  const report = await runRecoveryRehearsal();
  assert.equal(report.syntheticOnly, true);
  assert.equal(report.storage, "in-memory");
  assert.ok(report.migrationsApplied >= 8);
  assert.deepEqual(report.restoredCounts, {
    projects: 3,
    project_images: 3,
    reviews: 2,
    enquiries: 2,
    business_settings: 1,
    services: 2,
    faqs: 2,
  });
  assert.ok(Object.values(report.verified).every((value) => value === true));
  assert.doesNotMatch(
    JSON.stringify(report),
    /SYNTHETIC-RECOVERY-CUSTOMER|recovery-fixture@example|70000000|access_token|refresh_token/,
  );
});
test("recovery CLI refuses real backup paths and connection arguments without echoing them", () => {
  const script = fileURLToPath(
    new URL("../../scripts/rehearse-recovery.mjs", import.meta.url),
  );
  const result = spawnSync(
    process.execPath,
    [script, "PRIVATE-PATH-DO-NOT-READ.json", "postgres://PRIVATE-CONNECTION"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.doesNotMatch(result.stderr, /PRIVATE-PATH|PRIVATE-CONNECTION/);
  assert.match(result.stderr, /no arguments accepted/);
});
