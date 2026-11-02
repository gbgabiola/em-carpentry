import { randomBytes, createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolveIntakeConfig } from "../src/features/intake/config.ts";
const secret = randomBytes(32).toString("hex");
const config = resolveIntakeConfig({
  INTAKE_ENABLED: "true",
  INTAKE_SECRET: secret,
  INTAKE_ORIGIN: process.argv[2],
  INTAKE_PLATFORM: "netlify",
  NODE_ENV: "production",
});
await mkdir(".verification", { recursive: true, mode: 0o700 });
const path = ".verification/intake.env";
try {
  await writeFile(
    path,
    [
      "INTAKE_ENABLED=false",
      `INTAKE_ORIGIN=${config.origin}`,
      "INTAKE_PLATFORM=netlify",
      `INTAKE_SECRET=${secret}`,
      "",
    ].join("\n"),
    { flag: "wx", mode: 0o600 },
  );
} catch {
  throw new Error(
    "Could not create private intake configuration. Existing files are never overwritten.",
  );
}
console.log(
  JSON.stringify({
    privateEnvFile: path,
    credentialSha256: createHash("sha256").update(secret).digest("hex"),
    enabled: false,
  }),
);
