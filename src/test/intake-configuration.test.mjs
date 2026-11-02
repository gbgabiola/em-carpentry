import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, stat, unlink, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
test("intake preparation creates a private disabled configuration without printing or overwriting its secret", async () => {
  const directory = await mkdtemp(join(tmpdir(), "em-intake-config-"));
  const script = fileURLToPath(
    new URL("../../scripts/prepare-intake-config.mjs", import.meta.url),
  );
  const run = () =>
    spawnSync(process.execPath, [script, "https://example.test"], {
      cwd: directory,
      encoding: "utf8",
      timeout: 15000,
    });
  const path = join(directory, ".verification", "intake.env");
  try {
    const result = run();
    assert.equal(result.status, 0);
    const content = await readFile(path, "utf8");
    const secret = content.match(/^INTAKE_SECRET=([a-f0-9]{64})$/m)?.[1];
    assert.ok(secret);
    assert.match(content, /INTAKE_ENABLED=false/);
    assert.ok(!result.stdout.includes(secret));
    assert.ok(!result.stderr.includes(secret));
    assert.equal(
      JSON.parse(result.stdout).credentialSha256,
      createHash("sha256").update(secret).digest("hex"),
    );
    if (process.platform !== "win32")
      assert.equal((await stat(path)).mode & 0o777, 0o600);
    const again = run();
    assert.notEqual(again.status, 0);
    assert.equal(await readFile(path, "utf8"), content);
    assert.ok(!again.stderr.includes(secret));
  } finally {
    await unlink(path).catch(() => {});
    await rmdir(join(directory, ".verification")).catch(() => {});
    await rmdir(directory);
  }
});
