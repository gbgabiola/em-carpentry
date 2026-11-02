# Hosted Free test preview

Verified: 2 November 2026 (Asia/Manila). The user explicitly approved a publicly reachable Free test deployment and authorised Netlify CLI through the provider's browser flow. This is a test site; indexing and customer submissions remain disabled.

## Location and configuration

- Website: https://em-carpentry.netlify.app
- Admin login: https://em-carpentry.netlify.app/login
- Netlify project: em-carpentry, ID 6d20c1d7-b2c1-426b-94d8-49e61c2e9c2f
- Current verified deploy: 6ae82b4d93820ca655a794c2
- [Deploy log](https://app.netlify.com/projects/em-carpentry/deploys/6ae82b4d93820ca655a794c2)
- Deployed application source: Git commit 967cc912a5fc4edfffa8b3ea1ef46329c1b56580, including the media-response fix and offline backup tooling.
- Runtime: Next.js 16.4.3, Netlify adapter 5.16.5, CLI 27.16.1, build tooling 37.7.3 and Node 24.
- Website updates were uploaded manually. GitHub continuous deployment/webhooks were not configured by this task. No domain was purchased and no paid add-on or plan upgrade was enabled.

The provider environment was configured and read back to confirm the expected publishable Supabase connection, SITE_INDEXING_ENABLED=false, blank SITE_URL and AWS_LAMBDA_JS_RUNTIME=nodejs24.x. All apply to Functions and all contexts; backend values also reach builds. No password, Auth session or privileged backend key was supplied. CLI credentials stay in its supported local credential store outside Git; .env.local and .netlify state remain ignored. Netlify calls a base-URL update a production deploy; here that URL is explicitly approved for testing, not a completed business launch.

## Actual account plan

The gbgabiola team uses the existing legacy Free plan, API type free-is-free, rather than the newer 300-credit Free plan described in decision 0006. Before creation, the API confirmed auto_topup_enabled=false, accumulate_overages=false, paid add-on subscription disabled and no Pro/Enterprise trial.

The account's returned included limits were 100 GiB bandwidth, 300 build minutes, 125,000 Function invocations, 100 Function GB-hours, 1,000,000 Edge Function invocations and one concurrent build. These are the account's allowances at verification, not a guarantee or a measured workload benchmark. They are shared with its other projects. Do not migrate plans or enable paid features without explicit approval; recheck quotas and suspension/recovery behaviour before launch. A newly created account may receive credit-based limits instead.

## Verified results

- [GitHub Quality checks](https://github.com/gbgabiola/em-carpentry/actions/runs/41336381208) passed for commit 83986ca: clean install, lint, strict types, production build and all 54 tests on the hosted Ubuntu runner.
- The full Netlify build/deploy pipeline packaged and published server and Edge Functions successfully.
- npm run check:preview -- https://em-carpentry.netlify.app passed: all eight marketing pages plus login return 200 with en-AU and noindex; normal compressed login HTML loads; 11 referenced script/style/image assets return 200, including both optimised logo sizes; both intake POST endpoints return 503; robots disallows crawling and the sitemap is empty.
- npm run check:auth -- https://em-carpentry.netlify.app passed 27 protected-route scenarios (anonymous, malformed cookie and forged session across nine routes), plus four inaccessible build/config paths. Each private request redirected to login with no-store. /server/app/admin/page.js, /package.json, /.env.local and /.netlify/state.json return 404.
- The user confirmed that the website-admin account signs in on the hosted site and remains in the dashboard after reload. This is a user-performed sign-in/persistence check, not a timed token-refresh or cookie-flag inspection.

No real enquiry or customer review was submitted. Existing Supabase data and access policies were not changed by deployment. Content accuracy, photo rights and retention remain launch gates.

## Packaging correction and repeatable deployment

An initial --no-build upload used the raw .next directory and served build files publicly. It was superseded, deleted through the provider's deploy API and its immutable source-file URL was verified unavailable. A static-directory-only correction protected source files but omitted image routing. The final deployment uses the full native adapter build/deploy flow and passes both file-exposure and image-delivery checks. Do not use the initial deployment as a rollback target.

The npm deploy:preview command deliberately keeps the build/plugin stages enabled. They supply the generated file manifest, image routing, Functions and Edge configuration. netlify.toml's .next value is adapter input, not permission to upload the raw build tree with --no-build.

```sh
# Build and upload a draft preview by default, after linking the intended project.
npm run deploy:preview
# Only for an authorised update to this base test URL:
npm run deploy:preview -- --prod
# Validate the resulting URL:
npm run check:preview -- https://em-carpentry.netlify.app
npm run check:auth -- https://em-carpentry.netlify.app
```

Read the provider's actual success URL; do not infer publication from a successful local build. Keep environment values out of shell arguments/logs. Do not disable compression to conceal a local emulator issue: hosted compressed responses passed.

## Remaining hands-on checks

Follow [owner acceptance checks](owner-acceptance-checks.md) for the staged private upload, publishing, archive/removal and password workflow. On 2 November 2026, aggregate hosted counts showed zero projects, photo records and project-image Storage objects before fixture testing. Separately supplied synthetic JPEGs are exactly 4 MiB and 4 MiB plus one byte; local processing accepted the valid image as WebP and stripped metadata. Neither file has been uploaded by the assistant.

The user subsequently confirmed that photo upload, publishing/archiving and password change work on the hosted site. These are user-performed checks. A read-only consistency check found one archived project, one photo record and one matching Storage object, with zero missing objects or orphans; anonymous image metadata access was denied and the direct media URL returned 404. Exact 4 MiB boundary behaviour, metadata removal, photo removal, featured/filter/comparison behaviour, export/restore, sign-out, timed token refresh and revoked/non-owner access remain separate checks. Confirm cookie flags and private responses through the actual browser/CDN. No real client password was disclosed to or changed by the assistant; the user performed their own successful password-change test.

Visual interaction checks remain manual because the browser/desktop automation runtimes failed to initialise. Complete responsive/theme/keyboard checks and a realistic resource/traffic assessment before handover. Agree retention and complete secure intake implementation before enabling public submissions. Final services, project photos, logo/publication rights, privacy copy and launch indexing approval are still needed.

## Follow-up media response hardening

The archived-image privacy check correctly denied anonymous access, but its 404 response initially used no-cache instead of no-store. All media-handler 404 branches now share the explicit private/no-store/max-age=0 and nosniff headers used for photo responses. The HTTP suite covers invalid IDs and an unavailable backend, and check:auth adds two configured-host media checks. The local gates passed all 55 tests. No project, photo, password or access policy was modified by this fix.

The follow-up fix is committed and pushed as 3654ee8, and [GitHub CI passed all 55 tests](https://github.com/gbgabiola/em-carpentry/actions/runs/41341866406). Its first deployment attempt was rejected because the saved Netlify CLI session expired. The user subsequently renewed the connection through Netlify, and the fix was published in deployment 6ae82b4d93820ca655a794c2. The archived photo URL now returns an empty 404 with private/no-store/max-age=0 and nosniff. All 33 hosted access checks passed, including invalid/missing media, and the full public page/asset/intake/indexing checks passed. No credentials or authorisation tickets are stored in the repository.

## Offline recovery preparation

The repository now includes check:backup for locally inspecting a downloaded schema-v2 export. It reports only a timestamp, record counts and the required separate-photo count, and does not modify files, follow object paths, contact providers or prove a successful restore. Synthetic tests cover invalid structure, unexpected credential fields, duplicates, broken references, unsafe paths, publication constraints and safe CLI output. A subsequent owner-provided local export passed inspection on 2 November 2026; no record contents or contacts were printed or uploaded. The follow-up website deployment is now verified. The offline tool itself requires no provider connection or deployment.

The deployed source passed [GitHub CI with all 61 tests](https://github.com/gbgabiola/em-carpentry/actions/runs/41395214158). The owner-provided schema-v2 JSON passed offline inspection on 2 November 2026: one project, one photo record, business settings and four FAQs, with no review or enquiry rows. All seven tables were present and internal references were consistent. The original file stayed outside Git and was not modified. The owner subsequently supplied the one referenced photo separately. Its filename matched the exported image-record ID; local decoding confirmed a 1200 by 800 WebP of 16,894 bytes, with no EXIF, XMP, IPTC or orientation metadata. The original files were not modified. The SQL restore rehearsal below passed; completeness/freshness and full hosted Auth/Storage recovery remain separate checks.

## Local backup recovery rehearsal

On 2 November 2026, the owner-provided JSON was restored into a fresh, isolated, in-memory PGlite database using all tracked SQL migrations, including the policy cleanup still pending on the hosted project. Auth and Storage schemas were stand-ins for migration/policy execution, not running provider services. Fresh migration seed content was replaced only in that disposable database. All seven content tables and seven rows matched the export field-for-field using typed SQL comparisons, including timestamp precision and photo paths. Anonymous visibility matched publication/consent flags and private enquiry access was denied. No Auth users or private owner memberships were restored.

The separately supplied photo passed complete local decoding and metadata checks, but its bytes were not restored to a real Supabase Storage bucket. No live backend, public content, original backup or image file was modified, and no private record values or local paths were printed or committed. This is verified local SQL portability and a matching supplied image, not a completed cloud disaster-recovery test. Reprovisioning Auth, uploading objects at their original paths and checking a separate destination remain outstanding.
