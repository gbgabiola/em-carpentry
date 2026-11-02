export function SubmissionDate({ createdAt }: { createdAt: string }) {
  return (
    <p className="text-sm text-muted">
      Received:{" "}
      <time dateTime={createdAt}>
        {new Date(createdAt).toLocaleString("en-AU", {
          timeZone: "Australia/Melbourne",
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </time>{" "}
      (Melbourne time)
    </p>
  );
}
