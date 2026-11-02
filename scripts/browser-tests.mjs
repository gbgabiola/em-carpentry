import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const browserEnvironment = {
  ...process.env,
  PLAYWRIGHT_BROWSERS_PATH: join(root, ".verification/browsers"),
};
// Optional workspace-local libraries support restricted Linux development hosts.
const localLibraries = join(
  root,
  ".verification/browser-libraries/root/usr/lib/x86_64-linux-gnu",
);
if (
  process.platform === "linux" &&
  process.arch === "x64" &&
  existsSync(localLibraries)
)
  browserEnvironment.LD_LIBRARY_PATH = [
    localLibraries,
    process.env.LD_LIBRARY_PATH,
  ]
    .filter(Boolean)
    .join(":");
const child = spawn(
  process.execPath,
  [
    join(root, "node_modules/@playwright/test/cli.js"),
    ...process.argv.slice(2),
  ],
  {
    cwd: root,
    stdio: "inherit",
    env: browserEnvironment,
  },
);
child.on("error", () => {
  console.error("Could not start browser checks.");
  process.exitCode = 1;
});
child.on("close", (code) => {
  process.exitCode = code ?? 1;
});
