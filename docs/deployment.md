# Deployment

## Hosting and environment

- Netlify project: em-carpentry
- Project ID: 6d20c1d7-b2c1-426b-94d8-49e61c2e9c2f
- Test URL: https://em-carpentry.netlify.app

netlify.toml selects Node 24, npm 11 and the pinned Next.js adapter. The native Sharp processor requires a compatible Node runtime. Review adapter/dependency updates regularly. GitHub quality checks do not deploy the site; continuous deployment has not been connected.

Configure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY for Builds and Functions. Pin Functions to Node 24 with AWS_LAMBDA_JS_RUNTIME=nodejs24.x in Netlify's environment settings. Keep SITE_INDEXING_ENABLED=false for previews. SITE_URL must be blank or an approved HTTPS origin without a path/query/fragment. Local .env.local is not automatically uploaded.

The approved test website uses INTAKE_ENABLED=true, INTAKE_ORIGIN, INTAKE_PLATFORM=netlify and a private INTAKE_SECRET in Builds and Functions, with its matching private database credential row enabled. Default both switches off on a new destination until collection is authorised. See [intake setup](backend-setup.md#website-intake). Enabling collection is separate from enabling search indexing.

Do not place credentials in shell arguments, source, build logs or public assets. Use Netlify's supported browser login and local credential store; renew expired sessions through its normal authorisation flow.

## Build and publish

```sh
npm ci
npm run check
npm test
npm run browser:install
npm run test:browser
npm run check:hosting
# Full build/plugin flow and a draft upload to the linked project:
npm run deploy:preview
# Only for an authorised base-URL update:
npm run deploy:preview -- --prod
```

Keep the complete adapter build/plugin stages enabled. They generate the public file manifest, image routing, Functions and Edge configuration. The .next value in netlify.toml is adapter input: uploading the raw directory with --no-build can expose build files and omit generated routes.

Read the returned deployment URL and verify it:

```sh
npm run check:preview -- https://em-carpentry.netlify.app --intake-enabled
npm run check:auth -- https://em-carpentry.netlify.app
```

Also test owner sessions, cookies over HTTPS, private photos, publication/archive transitions, uploads, responsive layouts and keyboard interactions. A local build is not proof of hosted behaviour. .netlify and .next are generated and ignored; do not commit or distribute them as source archives.

## Free-plan limits

Provider limits were verified on 2 November 2026 and must be rechecked before changing accounts or launching:

- The existing Netlify team uses legacy Free (free-is-free), with auto top-up and overage accumulation disabled. Its included limits were 100 GiB bandwidth, 300 build minutes, 125,000 Function invocations, 100 Function GB-hours, 1,000,000 Edge Function invocations and one concurrent build, shared across its projects. New accounts may instead use credit-based quotas. Check actual usage and suspension behaviour in the account dashboard.
- Supabase Free includes a 500 MB database, 1 GB file storage, 50,000 monthly active users, 5 GB uncached egress and 5 GB cached egress. Inactive projects can pause. Keep independent data/photo backups and a developer-managed recovery procedure.

See [Netlify pricing](https://www.netlify.com/pricing/) and [Supabase pricing](https://supabase.com/pricing). Free tiers can change. Do not enable paid plans, add-ons, recharge or custom domains without approval. Sydney database placement does not guarantee Australia-only processing by all providers.

## Launch and recovery

Public intake is separately approved on the test site. Keep search indexing disabled until content/photo rights, service claims and business launch approval are complete. Keep intake disabled on any new destination until privacy, retention, intake security and collection approval are checked. To enable indexing later, update both build and runtime values with the approved SITE_URL and rebuild. The sitemap includes only intended public routes and published projects.

For recovery, retain source/migrations and independent private exports plus photo bytes. Standard Next.js remains portable to another compatible Node host. [Owner workflow](owner-workflow.md) explains export inspection, photo-path mapping and restoration order. Test a separate destination, including Auth and Storage, before relying on it for disaster recovery.
