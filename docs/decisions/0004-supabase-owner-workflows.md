# 0004: Supabase owner workflows

Status: approved for implementation by the user’s instruction to implement the recommended Supabase, manually created owner email/password and curated Facebook-testimonial approach. Date: 1 November 2026. No hosted resources or real accounts have been provisioned.

Keep Next.js App Router, React, strict TypeScript, Tailwind tokens and npm. Add the official Supabase client and SSR packages for provider-backed data and cookie sessions; Zod for bounded shared validation; server-only guards for privileged server modules; direct Sharp dependency for verified image processing; and PGlite as a development-only PostgreSQL engine for migration/RLS tests. No service-role key, paid service, custom domain or notification provider is introduced.

Authorisation has two layers: fresh getUser verification and database membership checks in every protected page/action/route, plus RLS/privileges for database and Storage access. Do not rely solely on the layout or Proxy; Proxy refreshes cookies and marks owner responses non-cacheable. Admin membership is a private schema table, manually provisioned through trusted administration. No public registration route exists; provider sign-ups must also be disabled during provisioning.

Public readers use an anonymous, non-session client with no-store data requests and explicit publication filters. Private photos use a non-public bucket and RLS-gated media handler; no public URLs or reusable signed URLs expose drafts. The Node/Sharp image path is not yet verified for Cloudflare Workers; hosting compatibility and CPU benchmarking remain unresolved and must precede deployment.

Enquiry/review fields have been approved, but retention is not agreed. Public handler and SQL write paths remain closed regardless of environment flags. Owner review creation is limited to manually curated Facebook excerpts with consent/source attribution. Reviews from Facebook may have a null rating; recommendations are never converted into a fabricated aggregate score.

PGlite tests execute the actual migration against Supabase-compatible role/schema fixtures. They prove the application’s SQL policy behaviour, not the real hosted Auth/Storage services. Hosted sign-in, refresh, logout, owner revocation, Storage HTTP behaviour and browser interactions require the setup guide’s live checks before production use.
