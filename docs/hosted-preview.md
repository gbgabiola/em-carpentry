# Hosted Free test preview

Verified: 2 November 2026 (Asia/Manila). The user explicitly approved a publicly reachable Free test deployment and authorised Netlify CLI through the provider's browser flow. This is a test site; indexing and customer submissions remain disabled.

## Location and configuration

- Website: https://em-carpentry.netlify.app
- Admin login: https://em-carpentry.netlify.app/login
- Netlify project: em-carpentry, ID 6d20c1d7-b2c1-426b-94d8-49e61c2e9c2f
- Current verified deploy: 6ae785fbe3cc67f647726d3c
- [Deploy log](https://app.netlify.com/projects/em-carpentry/deploys/6ae785fbe3cc67f647726d3c)
- Application baseline: Git commit 83986ca; deployment-command and verification refinements are recorded in the following Git checkpoint.
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

Use disposable private fixtures to verify actual owner project creation/editing, a photo upload near the 4 MiB limit, metadata removal, private and published media access, archival, photo removal, featured/filter/comparison behaviour, export/restore, password change, sign-out, timed token refresh and revoked/non-owner access. Confirm cookie flags and private responses through the actual browser/CDN. No real client password was disclosed to the assistant and no live password was changed.

Visual interaction checks remain manual because the browser/desktop automation runtimes failed to initialise. Complete responsive/theme/keyboard checks and a realistic resource/traffic assessment before handover. Agree retention and complete secure intake implementation before enabling public submissions. Final services, project photos, logo/publication rights, privacy copy and launch indexing approval are still needed.
