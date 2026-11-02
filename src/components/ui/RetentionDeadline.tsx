export function RetentionDeadline({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return null;
  const due = new Date(expiresAt);
  return (
    <p className="text-sm text-muted">
      Deletion deadline:{" "}
      <time dateTime={expiresAt}>
        {due.toLocaleString("en-AU", {
          timeZone: "Australia/Melbourne",
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </time>{" "}
      (Melbourne time).{" "}
      {due.getTime() <= Date.now()
        ? "Deletion is due; hourly cleanup is pending. This record cannot be reopened or published."
        : "Hourly cleanup removes the record once this deadline is reached."}
    </p>
  );
}
