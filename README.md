# EM Carpentry & Home Maintenance

Business website built with Next.js App Router, React, strict TypeScript and Tailwind CSS. Supabase provides Postgres, website authentication and private image storage. Netlify runs the Node.js application and Sharp image processing.

- [Test website](https://em-carpentry.netlify.app)
- [Owner sign-in](https://em-carpentry.netlify.app/login)

The test site has search indexing and public enquiry/review submissions disabled. Database-controlled retention deadlines and an hourly cleanup migration are implemented. Secure intake, abuse controls and approved launch content are still required before enabling submissions. There is no public registration, automated email delivery or customer portal.

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

For a running connected preview:

```sh
npm run check:preview -- https://em-carpentry.netlify.app
npm run check:auth -- https://em-carpentry.netlify.app
```

Deploy through `npm run deploy:preview`, which keeps the complete Netlify adapter build enabled and creates a draft by default. Base-URL updates require `-- --prod` and deployment authorisation. See [deployment](docs/deployment.md).

## Owner tools and recovery

The dashboard manages projects/photos, services, FAQs, business details, curated testimonials and private enquiries. Photos accept JPEG/PNG/WebP up to 4 MiB and are converted to WebP with original metadata removed. Draft and archived content stays private.

Download the dashboard JSON export and photo files separately. Inspect an export locally with:

```sh
npm run check:backup -- /private/path/em-carpentry-export.json
```

The inspector validates schema, references and schema-v3 retention clocks, prints counts and a 30-day rotation deadline, and does not restore records, delete files or verify photo bytes. Legacy schema-v2 exports remain inspectable with a retention-clock warning. `npm run fixtures:owner` generates ignored synthetic images for upload testing.

## Documentation

- [Backend setup](docs/backend-setup.md)
- [Deployment and provider limits](docs/deployment.md)
- [Client onboarding](docs/client-onboarding.md)
- [Owner workflow and backups](docs/owner-workflow.md)
- [Content guide](docs/content-guide.md)

Application code is under `src/app`, domain logic under `src/features`, shared utilities under `src/lib`, and migrations under `supabase/migrations`. Package and local Supabase project identifiers are `em-carpentry`.
