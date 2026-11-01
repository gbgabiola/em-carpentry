# Deployment and recovery

## Current state

The Supabase Free backend is connected in Sydney, its first three migrations are applied and the manually created client account has website-admin membership. Public sign-ups are disabled. The user subsequently approved a publicly reachable Free test deployment, now live at https://em-carpentry.netlify.app. See [hosted preview](hosted-preview.md) for verified configuration, the actual legacy Free plan, corrective deployment details and remaining checks. No paid service or completed business launch was authorised. See [connected backend](connected-backend.md) and [Netlify decision](decisions/0006-netlify-free-hosting.md).

## Local Netlify compatibility check

The tracked netlify.toml sets npm run build, .next output, Node 24, npm 11.19.1 and indexing off. The pinned @netlify/plugin-nextjs adapter handles Next.js Functions, proxy integration, caching and static assets. Keep Sharp in server actions; no native image module belongs in the proxy. No SPA catch-all redirect, public bucket or blanket cache override is required.

```sh
npm ci
npm run check
npm test
npm run check:hosting
```

check:hosting invokes pinned Netlify CLI 27.16.1 with build --offline --context deploy-preview. The first invocation downloads CLI packages; offline refers to build features requiring the Netlify control plane, not initial npm installation. It does not deploy, link a site or require a login. Generated .netlify/ and .next/ output is ignored and may contain local environment configuration; never publish those as source archives or commit them. The adapter dependency is pinned for repeatability; review upstream security/compatibility updates regularly.

On 2 November 2026, the local build passed with Next.js 16.4.3, adapter 5.16.5, CLI 27.16.1 and Netlify Build 37.7.3; both server and Edge Functions bundled successfully.

The local Netlify serve smoke check on port 8888 served all eight marketing pages, returned the connected login form when requesting Accept-Encoding: identity, kept both intake POST routes at 503 and passed all 27 synthetic-session access checks. The owned smoke server was stopped afterwards; the existing developer preview was left running.

The default compressed /login response has a local emulator mismatch: it advertises Content-Encoding: gzip but its raw body lacks gzip bytes, so a normal fetch fails decompression. The ordinary Next.js preview returns actual gzip bytes for the same request. This narrows the observed failure to the local adapter/emulator path, but does not prove hosted behaviour. Do not suppress compression in the application to hide it. Verify compressed login responses and browser navigation on an explicitly approved hosted preview before handover.

To repeat the local serve check, use BROWSER=none npx --yes netlify-cli@27.16.1 serve --offline --context deploy-preview --port 8888. The CLI uses port 3999 internally for its static server, so do not also choose 3999 for the frontend. It rebuilds first and performs no deployment. Run npm run check:auth -- http://localhost:8888 while it is running.

A successful adapter build verifies local packaging only. It does not prove real CDN cache behaviour, Secure cookies, region placement, resource usage or upload transport. Complete the hosted checks on an explicitly approved deployment before launch.

## Configuration for an approved deployment

1. Verify the developer account is on Free with a hard credit cap and no paid add-ons. Recheck the current limits and repository/Git integration eligibility. The client does not need a hosting seat. Confirm the public subdomain before creating the site.
2. Use the repository's netlify.toml build settings and Node 24 runtime. For an explicit Functions runtime pin, set AWS_LAMBDA_JS_RUNTIME=nodejs24.x in the provider UI (not netlify.toml), following the [runtime guide](https://docs.netlify.com/build/functions/configuration/#nodejs-version-for-runtime). Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in the provider environment UI for both Builds and Functions. Values in a local .env.local are not uploaded automatically. Never add secret/service-role keys or passwords.
3. Set SITE_INDEXING_ENABLED=false in both build and runtime settings for every preview. Leave SITE_URL blank until an HTTPS origin is approved, or use exactly that approved origin. No credentials, path, query, fragment or custom port is accepted. Review runtime Functions region and privacy disclosures; Sydney database placement is not an Australia-only processing guarantee.
4. Choose a predictable recovery path and separate backups. No reliable transactional email has been configured. Continue direct phone/email/business-Facebook contact fallbacks; public intake remains disabled.
5. Only after explicit deployment approval, publish the reviewed commit using the provider's supported workflow. Do not create a paid plan, register a domain or enable recharge. Record the provider URL and actual adapter/runtime versions, then verify the deployed app before sharing it with the client.

netlify.toml deliberately defaults indexing off. When launch is approved, update that tracked default and the provider's build/runtime values together, set the approved SITE_URL and rebuild. Indexing must not be enabled merely to test hosting. No public submission enable flag exists; a separately reviewed migration and secure handler implementation are still required after retention agreement.

## Free-plan operating limits

The [Netlify decision](decisions/0006-netlify-free-hosting.md) records dated commercial-use evidence, credits, upload limits, inactivity/recovery risks and migration options. New credit-based Netlify Free accounts currently have 300 shared monthly credits and pause sites at the hard cap. This connected team instead has legacy Free quotas, verified separately in hosted-preview.md. Requests, bandwidth, compute and published deploys all consume that allowance. One site's usage can pause the account's other sites. Keep usage notifications enabled and inspect actual traffic/compute before deciding the plan fits. Do not upgrade automatically.

Supabase Free has separate quotas and inactivity pausing. The developer restores a paused backend through its dashboard; no artificial keep-alive is installed. Keep direct-contact fallbacks available, including if the website host itself pauses. No free-service uptime guarantee is advertised.

## Verification and launch gates

- Run lint, strict typecheck, tests, production build, the local adapter build and npm run check:backend. Against the running connected preview, npm run check:auth -- http://localhost:3000 checks anonymous, malformed and forged sessions across nine admin routes with synthetic cookies only. It performs no account writes and prints no credentials.
- Complete real sign-in, session refresh, sign-out, current-password verification/change and revoked/non-owner access checks. Confirm HttpOnly, SameSite=Lax and Secure cookies over HTTPS and private/no-store responses through the real CDN. Provider evidence of a sign-in is not proof of the whole browser lifecycle.
- Test draft/photo upload, publication, filters, featured projects, comparison keyboard/pointer controls, archive and photo removal. Uploads are capped at 4 MiB and output WebP. Test real multipart transport near that limit and legacy photos near the bucket's older 5 MiB ceiling. Verify direct private media and cached paths become inaccessible after unpublishing.
- Verify approved-only testimonials, confirmed services/FAQs, business-contact edits and export privacy. Test private JSON export and separate photo backup/restore. Large exports or legacy downloads can reach Function response limits; measure those before relying on the host for recovery.
- Confirm service inventory, business content, logo/photo rights and publication consent, service-area wording, review moderation, privacy disclosures, retention/deletion and public subdomain. Keep intake closed until its secure workflow is implemented and agreed.
- Verify mobile/tablet/desktop layouts, both themes, keyboard navigation, contrast and accessible form states. Measure performance rather than claiming scores. Browser automation is currently unavailable in this environment; HTTP and build checks do not replace visual/interaction verification.

The optional explicit-write-policy migration remains pending native confirmation; do not replay installed migrations or bypass provider approval. Existing hosted RLS checks passed; see connected-backend.md for the exact installed state.

## SEO

SITE_URL and SITE_INDEXING_ENABLED govern canonical/sharing metadata, robots and sitemap. With indexing off, robots disallows crawling and the sitemap is empty. With indexing enabled and an approved origin, the sitemap includes public marketing routes and published project URLs with their stored update times, never admin/API endpoints or invented dates. JSON-LD uses verified business details and omits unverified address, hours, pricing and ratings.

## Recovery and migration

Keep source and package-lock.json in Git. On another compatible Node 24 host, reinstall with npm ci, configure the same server-only publishable backend connection and run the quality gates. Standard Next.js remains in use; Netlify is an adapter, not a framework rewrite. Cloudflare remains unverified for the native Sharp upload path.

Keep private data exports and photo bytes outside Git/public assets. Follow [owner workflow](owner-workflow.md) for independent exports, restoration order, private membership reprovisioning and orphan cleanup. Database backups do not contain photo bytes or automatically migrate Auth sessions. Test restoration in an isolated environment before relying on backups. Preserve the provider's actual schema history and never reset a valuable hosted project.

## GitHub quality gate and current handoff

Verified on 2 November 2026: the hosted Supabase display name is em-carpentry, the project is healthy, and the GitHub repository is gbgabiola/em-carpentry (public, default branch main). Remote main matched local commit 8b490de before this preparation checkpoint.

The quality workflow runs npm ci, npm run check and npm test on main pushes, pull requests and manual dispatch. Actions are pinned to verified v6 commit SHAs; checkout retains no Git credentials. It uses a standard Ubuntu 24.04 runner, Node 24 from .nvmrc, read-only contents permission, cancellation of superseded runs and a 15-minute timeout. Backend variables are blank and indexing is disabled: CI never needs Supabase, Netlify or customer credentials. No caches/artifacts, live backend checks or deployment steps are included. Standard runners for a public repository are [free](https://docs.github.com/en/billing/concepts/product-billing/github-actions). The job skips private repositories until billing is reviewed; changing visibility does not silently enable paid compute.

The checkpoint was pushed and [Quality checks passed on GitHub](https://github.com/gbgabiola/em-carpentry/actions/runs/41336381208), including all 54 tests. Passing local commands does not prove a hosted workflow result, and a passing check does not itself enforce branch protection or prevent Netlify auto-deploys. Before connecting Netlify, decide how its deployment workflow will honour successful checks and keep unfinished content unindexed.

Netlify CLI was authorised through the supported browser flow, this checkout was linked to em-carpentry and the explicitly approved Free test preview was published. No Git continuous-deployment connection was created. Use npm run deploy:preview to retain the adapter build/plugin stages; a raw --no-build upload can omit generated routing and publish build files. See hosted-preview.md for verified results and the remaining manual checks. Account authentication must stay in the provider's supported UI; do not send access tokens or passwords in chat.
