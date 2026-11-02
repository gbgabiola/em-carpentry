import { stat, readFile } from "node:fs/promises";
import {
  inspectBackup,
  BackupValidationError,
  MAX_BACKUP_BYTES,
} from "../src/features/backups/inspect.ts";

const file = process.argv[2];
if (!file) {
  console.error(
    "Usage: npm run check:backup -- /private/path/em-carpentry-export.json",
  );
  process.exitCode = 2;
} else {
  try {
    const metadata = await stat(file);
    if (!metadata.isFile())
      throw new BackupValidationError("Select a regular JSON export file.");
    if (metadata.size > MAX_BACKUP_BYTES)
      throw new BackupValidationError(
        "Export exceeds the 64 MiB inspection limit; use database backup tooling for larger datasets.",
      );
    const bytes = await readFile(file);
    if (bytes.length > MAX_BACKUP_BYTES)
      throw new BackupValidationError(
        "Export exceeds the 64 MiB inspection limit.",
      );
    let input;
    try {
      input = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      );
    } catch {
      throw new BackupValidationError("Export is not valid UTF-8 JSON.");
    }
    console.log(JSON.stringify(inspectBackup(input), null, 2));
    console.log(
      "Structure and references passed. Photo bytes, Auth identities and a successful restore are separate checks.",
    );
  } catch (error) {
    // Never print raw parser/provider errors, file contents or customer values.
    console.error(
      error instanceof BackupValidationError
        ? error.message
        : "Could not inspect the selected backup file.",
    );
    process.exitCode = 1;
  }
}
