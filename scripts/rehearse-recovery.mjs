// Synthetic-only rehearsal. Never load .env files or accept a destination/export.
if (process.argv.length !== 2) {
  console.error(
    "Usage: npm run rehearse:recovery (synthetic fixtures only; no arguments accepted).",
  );
  process.exitCode = 2;
} else {
  try {
    const { runRecoveryRehearsal } = await import(
      "../src/test/recovery/rehearsal.mjs"
    );
    console.log(JSON.stringify(await runRecoveryRehearsal(), null, 2));
  } catch {
    console.error(
      "Synthetic recovery rehearsal failed. No hosted service was accessed; run npm test for the failing check.",
    );
    process.exitCode = 1;
  }
}
