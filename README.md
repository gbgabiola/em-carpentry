# EM Carpentry & Home Maintenance

Business website built with Next.js App Router, React, strict TypeScript and Tailwind CSS. Supabase provides Postgres, website authentication and private image storage. Netlify runs the Node.js application and Sharp image processing.

- [Test website](https://em-carpentry.netlify.app)
- [Owner sign-in](https://em-carpentry.netlify.app/login)

The test site has active enquiry and review forms with validation, signed form checks, durable submission limits, duplicate protection and hourly retention cleanup. Enquiries stay private; website reviews require owner moderation and publication consent. Search indexing remains disabled until business launch is approved. There is no public registration, automated email delivery or customer portal.

## Development

Use Node.js 24 and npm 11 in WSL/Linux.

```sh
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Configure both Supabase variables to connect the backend, or leave both blank for local fallback content. Use a publishable key, never a secret/service-role key. Keep credentials, customer data and backups outside Git and public assets.

## Checks and deployment

```sh
npm run check
npm test
npm run check:hosting
```

`check` runs lint, strict type checking and a production build. Run it before the tests, which start a separate unconfigured production server and exercise validation, image processing and SQL permissions. GitHub Actions runs quality checks on public-repository pushes and pull requests with read-only permissions and no provider credentials.

Browser checks use pinned development-only [Playwright and axe](https://playwright.dev/docs/accessibility-testing) packages. Install the pinned Chromium, Firefox and WebKit browsers once, then run against the existing production build:

```sh
npm run browser:install
npm run test:browser
```

On Linux hosts missing Chromium system libraries, use npm run browser:install -- --with-deps with the appropriate system-package permissions. The runner also supports optional extracted libraries in .verification/browser-libraries/root/usr/lib/x86_64-linux-gnu on restricted x64 Linux hosts. Browser binaries, screenshots and traces stay in ignored .verification directories. The suite starts an isolated server on 127.0.0.1:3107, substitutes a read-only local backend and intercepts form submissions; it never reads hosted customer data or submits to the live site. It covers Chromium desktop/phone, Firefox desktop and WebKit phone viewports, both themes, keyboard journeys, enlarged text, automated WCAG checks and form states. Synthetic portfolio fixtures also cover search/category filters, pagination, project details, image delivery, keyboard before/after controls, incomplete comparisons and missing projects. Synthetic owner/non-owner sessions also cover private inbox filtering, pagination and review context. They are accepted only by the loopback fixture Auth endpoint and never use real accounts. These checks supplement the SQL permission tests; they do not prove hosted owner sessions. These entries and generated colour-block photos exist only in the loopback test server; they are never seeded into Supabase or published as business work. WebKit phone emulation does not certify Safari on a real iPhone. These engine checks do not replace real-device, assistive-technology or real owner-session testing. GitHub Actions runs the same suite on the existing public-repository runner without provider credentials or uploaded artifacts.

For a running connected preview:

```sh
npm run check:preview -- https://em-carpentry.netlify.app --intake-enabled
npm run check:auth -- https://em-carpentry.netlify.app
npm run check:backend -- --intake-ready
```

Deploy through `npm run deploy:preview`, which keeps the complete Netlify adapter build enabled and creates a draft by default. Base-URL updates require `-- --prod` and deployment authorisation. See [deployment](docs/deployment.md).

## Owner tools and recovery

The dashboard manages projects/photos, services, FAQs, business details, curated testimonials and private enquiries. The dashboard overview shows New enquiry and Pending review counts with links to the filtered inboxes. Unavailable counts are labelled rather than reported as zero. Enquiry and review inboxes have status filters and 20-record pages; received dates use Melbourne time, and moderation shows submitted ratings and Facebook attribution. Photos accept JPEG/PNG/WebP up to 4 MiB and are converted to WebP with original metadata removed. Draft and archived content stays private.

Download the dashboard JSON export and photo files separately. Inspect an export locally with:

```sh
npm run check:backup -- /private/path/em-carpentry-export.json
```

Run the developer's synthetic-only recovery rehearsal separately:

```sh
npm run rehearse:recovery
```

It creates fresh in-memory databases, applies the real migrations and checks JSON/retention round-tripping, photo byte/path mapping, SQL rollback and replacement-owner permissions. It accepts no real export paths, connection strings or credentials. Auth/Storage/Cron services are emulated; provider sign-in, Storage API and scheduler recovery remain separate checks. No customer backup files are read.

The inspector validates schema, references and schema-v3 retention clocks, prints counts and a 30-day rotation deadline, and does not restore records, delete files or verify photo bytes. Legacy schema-v2 exports remain inspectable with a retention-clock warning. `npm run fixtures:owner` generates ignored synthetic images for upload testing. Private intake configuration and activation are documented in [backend setup](docs/backend-setup.md#website-intake).

## Documentation

- [Backend setup](docs/backend-setup.md)
- [Deployment and provider limits](docs/deployment.md)
- [Client onboarding](docs/client-onboarding.md)
- [Owner workflow and backups](docs/owner-workflow.md)
- [Content guide](docs/content-guide.md)

Application code is under `src/app`, domain logic under `src/features`, shared utilities under `src/lib`, and migrations under `supabase/migrations`. Package and local Supabase project identifiers are `em-carpentry`.
