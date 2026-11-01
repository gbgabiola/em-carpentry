# 0006: Prepare Netlify Free for the existing Next.js application

Reviewed: 2 November 2026. The user initially approved local preparation, then separately approved a publicly reachable Free test deployment on 2 November 2026. See hosted-preview.md for the actual site and verification. No paid service or custom domain was approved.

## Recommendation and stack

Prepare Netlify Free with the existing Next.js App Router, React, TypeScript, Tailwind, Supabase Sydney and Node-native Sharp processor. This avoids a framework change or moving photo processing to a paid API. Cloudflare remains a possible future migration, but its Worker runtime has not been verified with this native upload pipeline.

Netlify documents App Router, Server Actions, streaming, revalidation and route handlers through its [OpenNext adapter](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/). New sites use [Node 24 for builds and Functions](https://www.netlify.com/changelog/2026-07-07-nodejs-24-default-new-sites/). Native Sharp stays in the server Function; the authentication proxy must not import it. This is documented compatibility, not proof of hosted behaviour.

TypeScript permits explicit .ts imports under noEmit so the shared upload constants also work in native Node test execution. Generated .netlify output is excluded from type checking and Git.

The adapter is pinned to @netlify/plugin-nextjs 5.16.5 and recorded in package-lock.json. This opts out of Netlify's recommended automatic adapter updates so this compatibility checkpoint is reproducible. Review adapter release/security updates with dependency maintenance. CLI 27.16.1 is invoked on demand for local checks rather than adding the large deployment CLI to application dependencies.

## Commercial use and free limits

Netlify explicitly permits commercial projects on its [Free plan](https://www.netlify.com/blog/introducing-netlify-free-plan/). Use its [current pricing](https://www.netlify.com/pricing/) and [credit-plan documentation](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/) for quotas; the older announcement's resource allowances do not apply to new credit-plan accounts.

New credit-based Free accounts currently have 300 credits/month, a hard cap and no recharge option. Published deploys cost 15 credits each, bandwidth 20 credits/GB, compute 10 credits/GB-hour and web requests 2 credits/10,000. These share the same allowance; they are not independent resource quotas. For illustration only, four published deploys, 4 GB bandwidth, 1 GB-hour compute and 100,000 requests consume 170 credits. This is arithmetic, not a traffic forecast or measured site usage. Owner content changes use the database and revalidation rather than requiring a source deployment.

At the cap, sites pause until the next billing cycle; one project can exhaust the account allowance and pause its other projects. Keep usage notifications enabled and account exposure understood. No paid upgrade or auto-recharge is authorised. Free does not provide additional team seats/private-organisation-repository access; verify repository ownership and Git integration eligibility before connecting. The client uses website authentication and needs no Netlify seat.

## Upload and delivery limits

The [Functions guide](https://www.netlify.com/knowledge-base/how-to-add-a-backend-api-endpoint-with-netlify-functions/) documents 6 MB buffered payloads and about 4.5 MB effective binary payloads after Base64 encoding. The previous 5 MiB photo allowance was too large for that transport.

Owner uploads now accept at most 4 MiB. Shared constants cover the action, processor and displayed limit. The Server Action body ceiling is 4256 KiB, leaving multipart room above a 4 MiB file while reserving space under a conservatively decimal 6 MB encoded event. Boundary and multipart tests verify this budget locally; real hosted uploads still require testing. Sharp continues to strip original metadata and output bounded WebP. The existing private bucket's 5 MiB ceiling remains valid and unchanged; older photos are not deleted or rewritten. Verify delivery of legacy photos near the former ceiling and large JSON exports before relying on this host; response streaming limits also apply.

## Privacy, cost and recovery

Sydney applies to the database/storage project; do not claim Australia-only processing for Netlify. Its [Functions configuration](https://docs.netlify.com/build/functions/configuration/) documents the default US region and configurable placement. Confirm available region, logging and privacy disclosures before launch. Keep secrets and customer information out of build logs and public assets. This host adds no email notifications, changes no Supabase quotas and does not resolve inactivity pausing.

Keep source/migrations, private JSON exports and separate photo backups portable. Standard Next.js plus Supabase remains runnable on another compatible Node host. Recheck commercial terms, credit rates, runtime limits and a realistic usage estimate immediately before deployment. See [deployment instructions](../deployment.md) for configuration and outstanding checks.

## Local verification result

The adapter build bundled server and Edge Functions successfully. Its local server served public pages and denied synthetic sessions on all private routes. Compressed login delivery has a local emulator header/body mismatch; identity encoding works and the direct Next.js preview returns valid gzip. This remains a hosted-preview verification gate. Configuration preparation is complete, but deployment readiness is not claimed.

## Connected account update

The existing gbgabiola team uses legacy Free (free-is-free) with overage accumulation and auto top-up disabled. It was not migrated to credit-based billing. Its actual included quotas and the authorised test deployment are recorded in ../hosted-preview.md; the credit arithmetic above remains a comparison for new credit-based accounts, not this account's billing model.
