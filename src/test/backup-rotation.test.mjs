import assert from "node:assert/strict";
import { test } from "node:test";
import { getBackupRotation } from "../features/backups/rotation.ts";

test("backup rotation is due at exactly 30 elapsed days across month boundaries", () => {
  const exported = "2026-01-31T12:00:00+11:00";
  const due = "2026-03-02T01:00:00.000Z";
  assert.deepEqual(
    getBackupRotation(exported, new Date("2026-03-02T00:59:59.999Z")),
    {
      dueAt: due,
      status: "current",
    },
  );
  assert.equal(
    getBackupRotation(exported, new Date(due)).status,
    "rotation-due",
  );
  assert.equal(
    getBackupRotation(exported, new Date("2026-04-01T00:00:00Z")).status,
    "rotation-due",
  );
});

test("future exports flag clock problems rather than claiming freshness", () => {
  assert.equal(
    getBackupRotation("2026-11-03T00:00:00Z", new Date("2026-11-02T00:00:00Z"))
      .status,
    "future-dated",
  );
  assert.throws(() => getBackupRotation("invalid"), /invalid/);
  assert.throws(
    () => getBackupRotation("2026-11-02T00:00:00Z", new Date("invalid")),
    /invalid/,
  );
});
