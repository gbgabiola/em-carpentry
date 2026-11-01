# EM Carpentry & Home Maintenance

Next.js App Router, React, strict TypeScript and Tailwind CSS, with Biome for lint/formatting. Supabase-backed owner workflows are implemented. The Sydney Free backend has been provisioned and connected locally; the client Auth account has website-admin membership; interactive lifecycle checks and a pending policy cleanup remain. Netlify Free configuration is prepared for local evaluation. No website has been deployed.

## Local development

Use Node.js 24 LTS and npm 11 in WSL/Linux.

```sh
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. With both Supabase variables blank, public pages use honest empty/fallback states and /login explains setup. Private routes fail closed. For a connected backend, follow [backend setup](docs/backend-setup.md); rebuild after changing environment configuration.

## Checks

```sh
npm run check
npm test
npm audit
```

check runs lint, route type generation, strict TypeScript and a production build. Run it before tests: HTTP tests start/stop the production server automatically and expect an unconfigured backend. The suite also executes the real SQL migration in local PGlite PostgreSQL, validates schemas/SEO settings, and tests actual photo processing. No Docker or hosted Supabase credentials are needed for these tests. npm run format formats source. With the connected preview running, npm run check:auth -- http://localhost:3000 verifies denial of anonymous, malformed and forged sessions across nine admin routes using synthetic cookies. npm run check:hosting builds through the pinned Netlify adapter locally without deploying; see [deployment](docs/deployment.md).

## Implemented

- Home, About, Services, Projects/detail, Reviews, Contact, FAQ, Privacy and 404 pages. Unapproved inventory/photos/reviews are not invented.
- Responsive shell, optimised supplied logo, persistent theme choice, focus/skip navigation and tested text contrast.
- Canonical/sharing metadata, verified business JSON-LD, public sitemap and explicit indexing opt-in. Preview defaults stay noindex.
- Supabase migrations with project/photo, enquiry, review and business-content tables; private owner membership; database and private-bucket access policies.
- Owner email/password sign-in, token refresh, sign-out, protected current-password-verified password changes, no public registration route and server authorisation on each private operation.
- Project create/edit/publish/unpublish/archive, featured entries, approved photo upload/edit/removal, public title/category filters and paginated listings.
- Optional before/after comparison for one approved pair, with a native keyboard range control and full gallery alternatives.
- Manually curated Facebook testimonials with permission/source attribution and approval/rejection. No automatic Facebook import or invented ratings.
- Private enquiry review/status/deletion; About, service-area and contact editing; service/FAQ publication management; and owner-only JSON export with separate photo-download links.
- Server validation and bounded WebP re-encoding/metadata removal for owner photos. Public customer attachments are not supported.
- Public enquiry/review POST routes return 503 and database writes remain denied until retention and intake security are agreed.

## Configuration and organisation

.env.example documents SITE_URL and SITE_INDEXING_ENABLED plus server-only SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY. No secret/service-role key is required or accepted. See src/config/ for verified core business details; src/features/ for domain data/actions; src/lib/ for auth, database clients, validation, image processing and SEO; src/types/database.ts for current schema types; supabase/migrations/ for policies/schema; src/test/ for verification.

Business content/customer data remain exportable. Never put private data, tokens, backups or unapproved photos in public/ or Git. The owner editor now manages About text, service area, Australian telephone, email, business Facebook page, services and FAQs. The business name/logo stay in verified source configuration. Services have no seeded inventory; the second migration adds four FAQ drafts for owner review. JSON export schema version 2 includes the new content. Public approved reviews are limited to the latest 100; owner list views use the provider’s 1,000-row default. If these limits become relevant, add owner pagination before expanding usage.

## Remaining gates

The Sydney project and publishable configuration now exist; client website-admin membership is enabled and provider sign-ups are disabled. Resolve the pending policy cleanup. Complete the live Auth/Storage and browser checks in [backend setup](docs/backend-setup.md). Agree retention/deletion and finish durable rate limiting, abuse protection and accessible intake forms before enabling submissions. Confirm service inventory, photo rights and publication content. Netlify Free local preparation is approved; hosted runtime, transport, cache and credit-usage checks remain unresolved. See [hosting decision](docs/decisions/0006-netlify-free-hosting.md). Cloudflare remains unverified for the native Sharp upload path. No deployment or paid upgrade is authorised by this checkpoint.

See [owner workflow](docs/owner-workflow.md), [provider comparison](docs/decisions/0002-provider-comparison.md), [architecture decision](docs/decisions/0004-supabase-owner-workflows.md), [deployment](docs/deployment.md) and [content guide](docs/content-guide.md).

## Backend checkpoint verification

Lint, strict type checking, production build, all 34 tests and the full dependency audit passed on 1 November 2026; npm audit reported zero vulnerabilities. Tests include the actual SQL migration in PGlite, publication/moderation transitions, denied public/private access, disabled intake handlers, HTTP routes, image re-encoding/metadata removal and validation. Real Supabase Auth/Storage, browser sessions and deployment/runtime compatibility remain unverified. This earlier checkpoint created no hosted migration, account or real customer data; see the current connected-backend and onboarding status below.

## Owner-content checkpoint

Apply every pending migration in filename order, including 20261101110955_owner_content.sql. Existing installations apply the second migration without rerunning the foundation. Owner-confirmed published services appear on Home and Services; FAQs use published rows once connected. During a configured outage, FAQ answers are hidden and Contact identifies previously verified fallback contact details rather than claiming they are current.

The comparison is opt-in per project and needs one Before and one After photo. If roles/photos change and no unique pair remains, the public comparison is omitted while the gallery remains available. Matching viewpoint/framing requires owner review. Browser interaction and live Supabase checks remain outstanding.

Owner-content verification on 1 November 2026: lint, strict typecheck, production build and all 43 tests passed; npm audit reported zero vulnerabilities. Both migrations were replayed against existing PGlite fixture data, including approval/archiving policies and new contact constraints. Browser automation failed before opening a browser, so slider interaction/visual QA and live Supabase verification remain outstanding. The Supabase integration was available but not installed at the last check.

## Connected backend

See [current backend state](docs/connected-backend.md) for the project, applied migration versions, pending cleanup, live checks and manual Auth steps. The local .env.local is ignored and contains only the publishable configuration. npm run check:backend performs read-only live API checks and exits 2 until public provider sign-ups are disabled. The main HTTP suite explicitly uses unconfigured mode even when .env.local is connected.

The connected build, all 45 local tests and npm audit passed (zero dependency findings). Hosted anonymous access checks passed; owner sign-in, session refresh/logout, actual photo lifecycle and browser verification remain outstanding. Public submissions and indexing remain disabled.

## Client account onboarding

Provider public sign-ups are now verified disabled and read-only live checks pass. The client’s intended email has been supplied privately; the matching confirmed Auth account now has website-admin membership. Hosted database lifecycle checks passed with disposable fixtures rolled back. The local login page loads and anonymous dashboard requests redirect to sign-in. See [client onboarding](docs/client-onboarding.md) for the one-time developer step and client-only website login. Account security at /admin/account lets an authorised owner change their own password after current-password verification. Lint, typecheck, build and all 52 local tests pass; real hosted password/session and browser checks remain pending. No password or personal login address is committed to source.

## Hosting preparation and access verification

Netlify Free configuration retains the established stack and pins its adapter for reproducible local builds. Owner photo uploads are now capped at 4 MiB to leave room for multipart/Base64 overhead below the host's request ceiling; existing stored photos remain unchanged. Public intake and indexing stay disabled. No hosting account or website deployment is created by the local build command.

The provider confirms the client account has signed in and remains an admin. All 27 connected-preview HTTP checks passed for anonymous, malformed-cookie and forged-session denial, including export. These are not real password-change, session-refresh or upload interaction tests. See [current verification](docs/connected-backend.md) and the remaining deployment gates.

The local Netlify adapter build and its 27 access-denial checks passed. A compressed-login response mismatch remains in the local emulator; ordinary Next.js gzip output is valid. Verify this on an approved hosted preview before handover; see deployment.md.

Final preparation checks: lint, strict typecheck, production build, 54 tests and npm audit passed with zero project dependency findings.
