# Deployment

## Hosting and environment

- Netlify project: em-carpentry
- Project ID: 6d20c1d7-b2c1-426b-94d8-49e61c2e9c2f
- Test URL: https://em-carpentry.netlify.app

netlify.toml selects Node 24, npm 11 and the pinned Next.js adapter. The native Sharp processor requires a compatible Node runtime. Review adapter/dependency updates regularly. GitHub quality checks do not deploy the site; continuous deployment has not been connected.

Configure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY for Builds and Functions. Pin Functions to Node 24 with AWS_LAMBDA_JS_RUNTIME=nodejs24.x in Netlify's environment settings. Keep SITE_INDEXING_ENABLED=false for previews. SITE_URL must be blank or an approved HTTPS origin without a path/query/fragment. Local .env.local is not automatically uploaded.

The approved test website uses INTAKE_ENABLED=true, INTAKE_ORIGIN, INTAKE_PLATFORM=netlify and a private INTAKE_SECRET in Builds and Functions, with its matching private database credential row enabled. Default both switches off on a new destination until collection is authorised. See [intake setup](backend-setup.md#website-intake). Enabling collection is separate from enabling search indexing. Contact, Reviews and the privacy notice evaluate form availability at request time, including when the build had no backend configuration; valid runtime configuration and the database intake switch are still required.

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

On restricted Linux hosts, workspace-extracted libraries may be used instead of installing system packages. WebKit's cached launcher uses its own sys/lib directory, so its missing libraries must also be resolved there without replacing bundled files. Only after verifying real shared-library loading, PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 can bypass the system-registry-only preflight for that local run; it does not fix missing libraries. CI uses --with-deps and keeps normal host validation enabled. Browser binaries, local library links and results remain ignored.

Keep the complete adapter build/plugin stages enabled. They generate the public file manifest, image routing, Functions and Edge configuration. The .next value in netlify.toml is adapter input: uploading the raw directory with --no-build can expose build files and omit generated routes.

Read the returned deployment URL and verify it:

```sh
npm run check:preview -- https://em-carpentry.netlify.app --intake-enabled
npm run check:auth -- https://em-carpentry.netlify.app
```

The browser suite runs in Chromium desktop/phone, Firefox desktop and WebKit phone projects using isolated synthetic portfolio and form fixtures. WebKit emulation supplements real Safari/iPhone testing. It tests populated gallery journeys without publishing sample content or accessing hosted customer data. These checks do not verify live provider permissions or replace an owner-session check.

The auth probe includes filtered enquiry/review URLs. For an owner-session check, confirm overview counts and their filtered inbox links, then open both inboxes, apply a status filter, follow older-page navigation when records exist, and confirm received dates, ratings and source attribution. Inbox filtering/pagination requires no schema or environment changes.

Also test owner sessions, cookies over HTTPS, private photos, publication/archive transitions, uploads, responsive layouts and keyboard interactions. A local build is not proof of hosted behaviour. .netlify and .next are generated and ignored; do not commit or distribute them as source archives.

## Free-plan limits

Provider limits were verified on 2 November 2026 and must be rechecked before changing accounts or launching:

- The existing Netlify team uses legacy Free (free-is-free), with auto top-up and overage accumulation disabled. Its included limits were 100 GiB bandwidth, 300 build minutes, 125,000 Function invocations, 100 Function GB-hours, 1,000,000 Edge Function invocations and one concurrent build, shared across its projects. New accounts may instead use credit-based quotas. Check actual usage and suspension behaviour in the account dashboard.
- Supabase Free includes a 500 MB database, 1 GB file storage, 50,000 monthly active users, 5 GB uncached egress and 5 GB cached egress. Inactive projects can pause. Keep independent data/photo backups and a developer-managed recovery procedure.

See [Netlify pricing](https://www.netlify.com/pricing/) and [Supabase pricing](https://supabase.com/pricing). Free tiers can change. Do not enable paid plans, add-ons, recharge or custom domains without approval. Sydney database placement does not guarantee Australia-only processing by all providers.

## Launch and recovery

Public intake is separately approved on the test site. Keep search indexing disabled until content/photo rights, service claims and business launch approval are complete. Keep intake disabled on any new destination until privacy, retention, intake security and collection approval are checked. To enable indexing later, update both build and runtime values with the approved SITE_URL and rebuild. The sitemap includes only intended public routes and published projects.

For recovery, retain source/migrations and independent private exports plus photo bytes. Standard Next.js remains portable to another compatible Node host. [Owner workflow](owner-workflow.md) explains export inspection, photo-path mapping and restoration order. Test a separate destination, including Auth and Storage, before relying on it for disaster recovery.

### Recovery verification

Run npm run rehearse:recovery for the synthetic-only, in-memory rehearsal. It prints aggregate checks and limitations, accepts no arguments or real data, and needs no provider credentials. The same rehearsal runs in npm test and GitHub CI. It applies the repository migrations with local Auth/Storage/Cron stand-ins; the stand-in SQL must not be copied into managed provider schemas.

Run npm run rehearse:services separately for real local Supabase Auth, Storage and Cron. It requires WSL/Linux, Node 24, a working Docker daemon with WSL integration, network access for pinned Supabase CLI 2.122.0 and its service images, several GB of image storage and sufficient Docker memory (tested with 8 GB available). API ports 56521/56621 and database ports 56522/56622 must be free; the source is stopped before the destination starts. Do not run concurrent rehearsals.

The command accepts no arguments, hosted destinations, customer exports or provider credentials. It generates synthetic records and colour-block photos, copies the application migrations into ignored .verification/service-recovery directories and checks actual published bindings before creating actors/data. A private Unix-socket Docker adapter forces CLI-created ports to 127.0.0.1; never expose that adapter over TCP. Local keys/passwords remain in memory and raw CLI output is withheld. Application environment files are not loaded. Intake stays unconfigured.

The check provisions a replacement owner, preserves timestamps and retention deadlines, excludes expired/withdrawn records, verifies SQL rollback, restores photo bytes through Storage at their original paths, checks anonymous/non-owner isolation, refreshes and signs out the owner, and runs the real Cron worker using a temporary one-second probe of the retention function. It separately verifies the normal hourly schedule. This does not wait an hour or test provider availability guarantees; signed-out access tokens can remain valid until expiry.

Cleanup stops only the two randomly named em-carpentry-recovery projects with --no-backup and removes their labelled network. Cached Docker images and ignored configuration/manifests remain for reuse; other projects are untouched. If interrupted or cleanup fails, inspect the matching manifest and stop each exact project with npx --yes supabase@2.122.0 stop --project-id <exact-project-id> --no-backup --yes --workdir <matching-workdir>. Never use stop --all or global Docker pruning. Do not publish local configuration/status output.

A separately approved hosted destination is still required before claiming full disaster recovery:

1. Use a separately approved isolated destination and verify its cost/limits before provisioning. Keep intake disabled.
2. Apply migrations through the supported provider workflow. Provision a fresh owner privately through Auth, disable public registration and grant only the correct private website membership. Do not restore old session tokens or blindly reuse owner UUIDs.
3. Validate the export and photo set. Resolve legacy retention evidence, exclude expired/withdrawn records, and preserve original clocks through a controlled restore. Normal website inserts restart those clocks.
4. Upload photo bytes through the Storage API at the paths in project_images.path, preserving the mapping from downloaded image IDs. Database metadata is not the photo backup.
5. Check actual owner sign-in, reload/sign-out, owner changes, public published content and private draft/archive/enquiry/pending-review visibility over HTTPS.
6. Verify the real hourly retention worker, cleanup after recovery and the backup rotation process. Configure a fresh server-only intake credential only when collection at that destination is approved.

The Docker rehearsal tests local Auth sessions, Storage HTTP delivery and the Cron worker. It does not test hosted HTTPS application cookies/UI, encryption roots, account recovery emails, backup rotation, provider account access or platform recovery guarantees. Follow the [Supabase recovery guidance](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) for a provider migration; preserve independent photo backups and review any additional features used by the project.
