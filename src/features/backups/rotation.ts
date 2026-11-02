import { retention } from "../../config/retention.ts";

// Use the export timestamp rather than the file's modified time.
export function getBackupRotation(exportedAt: string, now = new Date()) {
  const exported = Date.parse(exportedAt);
  const checked = now.getTime();
  const due = exported + retention.backupDays * 24 * 60 * 60 * 1000;
  if (!Number.isFinite(checked) || !Number.isFinite(due))
    throw new Error("Backup rotation dates are invalid.");
  return {
    dueAt: new Date(due).toISOString(),
    status:
      exported > checked
        ? "future-dated"
        : checked >= due
          ? "rotation-due"
          : "current",
  };
}
