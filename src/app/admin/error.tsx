"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <section role="alert">
      <h2>Owner data is unavailable.</h2>
      <p>
        Check the Supabase project is running and the migration has been
        applied. No private data is displayed while access cannot be verified.
      </p>
      <button type="button" onClick={reset} className="button button-primary">
        Try again
      </button>
    </section>
  );
}
