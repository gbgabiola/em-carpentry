# Deployment and recovery

## Current status

Local public-page checkpoint only. No hosting/backend provider or paid service has been selected, no domain has been registered and nothing has been deployed. npm run build verifies the Next.js production build; it does not deploy it.

## Provider decision gate

Before implementing a backend or selecting hosting, record a dated comparison with primary-source links covering:

- Commercial-use permission and framework/runtime compatibility.
- Current free quotas for compute, database, authentication, storage, uploads, bandwidth/egress and builds.
- Email delivery availability and limits; how the owner will learn about enquiries if notifications are unavailable.
- Inactivity pauses, retention/deletion policies, backups and overage behaviour.
- Data location and Australian privacy implications.
- Data/photo export, restoration and migration procedures.

Do not add paid infrastructure or register a domain without approval. Production deployment requires explicit authorisation. Provider quotas and migration steps cannot be documented as selected until a provider is selected.

## Launch gate

Confirm services, content/photo consent, service area wording, form fields, retention/deletion policy, review moderation, admin access and public subdomain. Implement and test server authorisation and database/storage permissions before enabling private data or uploads. No admin screen should be considered protected by robots directives.

Set the approved public origin, implement canonical/OG metadata and a sitemap for published routes, replace scaffold indexing restrictions and complete privacy disclosures. Verify responsive layouts, accessibility, permissions, form workflows, lint, typecheck, tests and production build. Review actual provider terms and quotas again before launch.

## Recovery at this checkpoint

Keep source and package-lock.json in Git. Reinstall with npm ci on Node 24 and run npm run check. Copy .env.example to .env.local for local configuration. No customer data exists in this scaffold. Once persistent storage is introduced, document independent exports, photo backups and a tested restore procedure before launch.

## Research and public-page checkpoint

See [dated provider comparison](decisions/0002-provider-comparison.md). Vercel Hobby is excluded for this commercial website. Cloudflare Workers plus Supabase Sydney is a conditional candidate, not a configured deployment. Resolve runtime/CPU compatibility, pause recovery and sign-in before adopting it. No Cloudflare adapter has been installed.

Run npm run check and npm test before deployment work. Keep noindex/robots restrictions until content, privacy and SEO are launch-ready. The supplied logo is now included; publication rights and project-photo consent remain launch gates.

## SEO configuration

Set SITE_URL to the approved HTTPS origin (no path, query, fragment, credentials or custom port). Leave SITE_INDEXING_ENABLED=false for previews and unfinished content. It defaults to false. Canonical and sharing tags require SITE_URL; they never fall back to localhost. Only after launch readiness is confirmed, set SITE_INDEXING_ENABLED=true and rebuild. Invalid settings fail the build. With indexing off, robots disallows crawling and sitemap.xml has no URLs. With indexing on, only the eight implemented public routes are listed; no fake project pages or admin/API URLs are included. Future project URLs must come only from published records. No fabricated last-modified dates are supplied.

JSON-LD uses verified business name, contact details, operating-since year, service city and business Facebook page. It omits unverified street address, business hours, pricing and ratings. Schema validity does not guarantee eligibility for Google rich results. No public origin or production deployment has been chosen at this checkpoint.

Reference implementation guidance: [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata), [sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap), [JSON-LD](https://nextjs.org/docs/app/guides/json-ld).

## Backend checkpoint

Supabase schema, RLS/private image storage and owner workflows are implemented. Follow [backend setup](backend-setup.md) to provision the approved Sydney project/owner and complete live tests. [Owner workflow](owner-workflow.md) covers export, separate image backups, pause recovery and orphan cleanup. No hosted migration or deployment has been applied.

The Node-native Sharp upload processor is not a verified Worker runtime feature. Do not deploy this build to Cloudflare merely because a Next.js adapter exists: resolve native image processing, memory/CPU limits and actual compatibility first. Do not silently migrate frameworks or enable billing. Public submissions require a new reviewed handler/policy migration after retention is agreed; changing an environment flag alone cannot enable them.

## Owner-content migration

Apply 202611010002_owner_content.sql after the foundation, once only. It preserves existing projects/enquiries and adds draft service/FAQ management, validated business contact settings and an opt-in comparison flag. Rebuild application code after applying schema updates. Verify publication constraints, RLS, contact metadata/JSON-LD and pointer/keyboard comparison behaviour against disposable live fixtures. This does not resolve the native Sharp/Cloudflare compatibility gate or enable customer submissions.
