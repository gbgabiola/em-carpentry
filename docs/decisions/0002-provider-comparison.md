# 0002: Hosting and backend comparison

Reviewed: 1 November 2026. Status: research complete for this checkpoint; no service provisioned. Recheck terms and quotas before implementation and launch.

## Recommendation

Keep the Next.js application provider-neutral while the public shell is built. Evaluate Cloudflare Workers Free for hosting and Supabase Free in Sydney for managed Postgres, authentication and portfolio storage. This is a conditional recommendation, not proof that the final dynamic application will fit a free plan. Benchmark the actual app and settle owner authentication, pause recovery and retention before backend implementation. No paid plan, billing account, domain, adapter or credentials have been added.

## Comparison

| Option                  | Current allowances and restrictions                                                                                                                                                                                              | Decision                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel Hobby            | Personal, non-commercial use only. Advertising this business makes this unsuitable regardless of development being unpaid.                                                                                                       | Excluded from a zero-cost commercial deployment. [Hobby terms](https://vercel.com/docs/plans/hobby).                                                                                                                                                                                                                      |
| Cloudflare Workers Free | 100,000 dynamic requests/day, 10 ms CPU per invocation, 128 MB memory. Static assets have separate free handling; 20,000 assets and 25 MiB per file on Free.                                                                     | Hosting candidate. CPU budget requires a realistic benchmark. [Limits](https://developers.cloudflare.com/workers/platform/limits/) and [pricing](https://developers.cloudflare.com/workers/platform/pricing/).                                                                                                            |
| Supabase Free           | 500 MB database, 1 GB file storage, 50,000 MAU, 5 GB egress plus 5 GB cached egress; two active free projects. Projects may pause after one week of inactivity.                                                                  | Simplest managed backend candidate, conditional on pause recovery and independent backups. [Pricing](https://supabase.com/pricing).                                                                                                                                                                                       |
| Cloudflare D1 + R2      | D1 Free: 5 million rows read/day, 100,000 rows written/day, 5 GB total storage, 500 MB per database. R2 Standard includes 10 GB-month storage, 1 million Class A and 10 million Class B operations/month; overages are billable. | Alternative with more custom authentication/authorisation work and billing exposure for object storage. Not selected. [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [limits](https://developers.cloudflare.com/d1/platform/limits/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/). |

Cloudflare’s [self-serve agreement](https://www.cloudflare.com/terms/) permits organisational customers and describes free services without a personal/non-commercial restriction. Supabase’s [terms](https://supabase.com/terms) similarly cover organisations; no hobby-only restriction was identified in the reviewed terms. This eligibility assessment is an inference from those terms, not a negotiated service guarantee. Free services can change or be withdrawn.

## Framework compatibility

Cloudflare’s current [Next.js guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) recommends vinext; OpenNext remains documented for existing applications with migration gaps, and Pages supports static exports. The local app remains standard Next.js as specified by AGENTS.md. Do not silently replace its framework runtime or assume next build alone produces a deployable Worker. Before selecting Cloudflare, run a separate compatibility/CPU spike against the exact Next.js version, image delivery, cookies/authentication and server writes. If this fails the Free CPU budget, keep the public app static and revisit the dynamic deployment architecture rather than enabling billing.

## Email and owner access

Workers/D1/R2 do not provide a turnkey admin authentication or notification workflow. Supabase’s [default SMTP](https://supabase.com/docs/guides/auth/auth-smtp) is for testing, restricted to team addresses and currently two messages/hour. It is not production transactional enquiry email. Prefer a manually provisioned owner account, no public registration, and an agreed sign-in/recovery method. If no reliable zero-cost sender is agreed, store enquiries privately for owner review with direct phone/email/Facebook fallbacks; do not promise notifications. No sign-in or form has been implemented yet.

## Pausing, data location and privacy

Supabase’s [regions](https://supabase.com/docs/guides/platform/regions) include Sydney (ap-southeast-2). A region choice is not an Australia-only processing guarantee: review [data residency and transfers](https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq), subprocessors and support access. Cloudflare executes globally by default; no Australia-only commitment is assumed for Workers, D1 or R2. Avoid putting customer information in access logs.

Weekly or twice-monthly owner updates may coincide with Supabase inactivity pauses. Document who restores the project, how visitors receive a fallback when unavailable and how pending enquiries are recovered. The [pausing/restoration guidance](https://supabase.com/docs/guides/platform/upgrading#restoring-a-paused-project) must be checked at provisioning; do not rely on indefinite paused-project retention. No equivalent one-week idle pause was identified in the reviewed Workers/D1 docs, but free-service termination and account policies still apply. Keep independent exports regardless.

Assess applicability using the OAIC [small-business guidance](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business); do not assume exemption. If applicable, review [APP 8 overseas disclosure](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-8-app-8-cross-border-disclosure-of-personal-information). Agree collection, publication consent, retention, deletion and breach handling before enabling submissions. The current preview privacy notice describes only current behaviour, not an approved launch policy.

## Export, recovery and migration

For Supabase, use versioned SQL migrations plus regular CLI database dumps, with separate storage-object downloads; database backups do not include stored photo objects. [Backup guidance](https://supabase.com/docs/guides/platform/backups) recommends independent exports for Free projects. Test restoring Postgres data and photo references into an isolated environment. Auth migration needs a deliberate identity/session plan; SQL portability alone does not migrate sign-in.

For D1, export SQL and restore into SQLite/D1, adapting SQLite-specific behaviour when migrating to Postgres. Free D1 [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) covers seven days, not an independent backup. Copy R2 objects via the S3-compatible API with a manifest of filenames, project references, rights and alt text. Keep private data and backups outside public assets and Git.

## Remaining implementation gates

- Confirm provider, public subdomain, owner sign-in/recovery and acceptance of inactivity limits.
- Benchmark a Cloudflare-compatible build with no paid-plan upgrade.
- Agree exact form fields, optional attachments and retention/deletion periods.
- Implement server-side authorisation, database/storage policies, rate limits and failure fallbacks before collecting data.
- Test independent export/restore and review the final provider disclosures before launch.
