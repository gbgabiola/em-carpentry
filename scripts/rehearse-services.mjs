// Developer-only local services; never accept a hosted destination or real export.
if (process.argv.length !== 2) {
  console.error(
    "Usage: npm run rehearse:services (synthetic local services only; no arguments accepted).",
  );
  process.exitCode = 2;
} else {
  try {
    const { runServiceRecovery } = await import(
      "../src/test/recovery/services.mjs"
    );
    const report = await runServiceRecovery({
      phase: (phase) => console.log(JSON.stringify({ phase })),
    });
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    // The harness emits only controlled phase errors, never raw service output.
    console.error(
      error instanceof Error &&
        error.message.startsWith("Local service recovery failed at ")
        ? error.message
        : "Local service rehearsal failed or cleanup needs attention. Check Docker and the scoped local recovery projects.",
    );
    process.exitCode = 1;
  }
}
