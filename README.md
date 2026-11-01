# EM Carpentry & Home Maintenance

Next.js App Router, React, strict TypeScript and Tailwind CSS, with Biome for lint/formatting. Supabase-backed owner workflows are implemented; no hosted backend or production deployment has been created.

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

check runs lint, route type generation, strict TypeScript and a production build. Run it before tests: HTTP tests start/stop the production server automatically and expect an unconfigured backend. The suite also executes the real SQL migration in local PGlite PostgreSQL, validates schemas/SEO settings, and tests actual photo processing. No Docker or hosted Supabase credentials are needed for these tests. npm run format formats source.

## Implemented

- Home, About, Services, Projects/detail, Reviews, Contact, FAQ, Privacy and 404 pages. Unapproved inventory/photos/reviews are not invented.
- Responsive shell, optimised supplied logo, persistent theme choice, focus/skip navigation and tested text contrast.
- Canonical/sharing metadata, verified business JSON-LD, public sitemap and explicit indexing opt-in. Preview defaults stay noindex.
- Supabase migrations with project/photo, enquiry, review and business-content tables; private owner membership; database and private-bucket access policies.
- Owner email/password sign-in, token refresh, sign-out, no public registration route and server authorisation on each private operation.
- Project create/edit/publish/unpublish/archive, featured entries, approved photo upload/edit/removal, public title/category filters and paginated listings.
- Labelled before/after photos; no comparison slider yet.
- Manually curated Facebook testimonials with permission/source attribution and approval/rejection. No automatic Facebook import or invented ratings.
- Private enquiry review/status/deletion, About/service-area editing and owner-only JSON export with separate photo-download links.
- Server validation and bounded WebP re-encoding/metadata removal for owner photos. Public customer attachments are not supported.
- Public enquiry/review POST routes return 503 and database writes remain denied until retention and intake security are agreed.

## Configuration and organisation

.env.example documents SITE_URL and SITE_INDEXING_ENABLED plus server-only SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY. No secret/service-role key is required or accepted. See src/config/ for verified core business details; src/features/ for domain data/actions; src/lib/ for auth, database clients, validation, image processing and SEO; src/types/database.ts for current schema types; supabase/migrations/ for policies/schema; src/test/ for verification.

Business content/customer data remain exportable. Never put private data, tokens, backups or unapproved photos in public/ or Git. The owner editor currently manages About text and service area; core contact links, services and FAQs still use source configuration. Public approved reviews are limited to the latest 100; owner list views use the provider’s 1,000-row default. If these limits become relevant, add owner pagination before expanding usage.

## Remaining gates

Provision the approved Sydney project and owner, apply migrations, configure public keys and disable provider sign-ups. Complete the live Auth/Storage and browser checks in [backend setup](docs/backend-setup.md). Agree retention/deletion and finish durable rate limiting, abuse protection and accessible intake forms before enabling submissions. Confirm service inventory, photo rights and publication content. Hosting/runtime eligibility and a free-plan benchmark remain unresolved; the native Sharp upload pipeline is not verified on Cloudflare Workers. No deployment or paid upgrade is authorised by this checkpoint.

See [owner workflow](docs/owner-workflow.md), [provider comparison](docs/decisions/0002-provider-comparison.md), [architecture decision](docs/decisions/0004-supabase-owner-workflows.md), [deployment](docs/deployment.md) and [content guide](docs/content-guide.md).

## Backend checkpoint verification

Lint, strict type checking, production build, all 34 tests and the full dependency audit passed on 1 November 2026; npm audit reported zero vulnerabilities. Tests include the actual SQL migration in PGlite, publication/moderation transitions, denied public/private access, disabled intake handlers, HTTP routes, image re-encoding/metadata removal and validation. Real Supabase Auth/Storage, browser sessions and deployment/runtime compatibility remain unverified. No hosted migration, account or real customer data was created.
