# Connected Supabase backend

Verified on 2 November 2026 (Asia/Manila).

- Project: em-carpentry-home-maintenance
- Organization: gbgabiola’s Dev Space (jqqvsvybcbwwhstwxucg), explicitly selected by the user
- Project reference: lllzqhfjrrtjavpvhmce
- Region: Sydney, ap-southeast-2
- Organization plan: Free; project creation quote was $0/month. No paid add-on or upgrade was enabled.
- [Project dashboard](https://supabase.com/dashboard/project/lllzqhfjrrtjavpvhmce)
- The local ignored .env.local contains the API URL and a publishable key only. Indexing remains disabled. No secret/service-role key was retrieved or written.

## Applied migrations and local history

The new project was empty before schema installation. These migrations were applied and confirmed in hosted history:

1. 20261101110949_foundation.sql
2. 20261101110955_owner_content.sql
3. 20261101111002_private_admin_lookup.sql

Supabase assigned the hosted versions. Local migration filenames were aligned to that history without changing the applied SQL so future CLI workflows can match the installed versions. New security migration files were initially generated using the pinned CLI 2.122.0.

The third migration keeps privileged membership lookup code in private.is_admin and exposes only an invoker-mode public wrapper. private.admin_users has RLS and no grants to public app roles. Its default-deny behaviour is intentional; the helper performs a narrow lookup for the current authenticated UID only.

20261101111154_explicit_owner_write_policies.sql is tested locally but NOT APPLIED to the hosted project. It replaces overlapping owner ALL policies with explicit insert/update/delete policies, retains the existing read predicates and adds an explicit membership-table deny policy. Supabase’s native confirmation expired on repeated attempts, including the follow-up on 2 November 2026; no bypass via raw SQL or CLI was attempted. Review and authorise this optional cleanup before applying it. Do not assume hosted policy layout is already identical to the pending local migration.

## Verified live

- All eight application tables, including private owner membership, have RLS enabled.
- project-images is private, restricted to WebP and limited to 5 MiB per file.
- Anonymous Data API reads work for published projects, approved reviews, confirmed services/FAQs and public business information.
- Anonymous SELECT on enquiries is denied and private membership is not exposed through the Data API.
- The public owner-check RPC returns false for an anonymous caller.
- Missing private photo downloads are denied.
- The read-only script created no users, records or files. Existing content is the verified business settings row and four private FAQ drafts; there are no real projects, reviews, enquiries or owner memberships.

These initial live checks run against empty public content tables. Full hosted publish/archive and Auth/Storage lifecycle tests with disposable fixtures still require the owner account. Local PostgreSQL tests exercise those policy transitions independently.

## Remaining Auth setup

The live Auth settings endpoint now confirms that public sign-ups are disabled. No Auth users/owner memberships existed at the latest account-setup check. The connected tools do not expose Auth configuration or account creation. The CLI is not authenticated either, so it cannot currently change that setting. Do not send passwords or access tokens in chat.

1. Keep new user sign-ups disabled in [Auth settings](https://supabase.com/dashboard/project/lllzqhfjrrtjavpvhmce/auth/providers); this setting has now passed live verification.
2. Create the intended confirmed owner email/password account through [Auth Users](https://supabase.com/dashboard/project/lllzqhfjrrtjavpvhmce/auth/users), using Create user rather than relying on an email invitation.
3. Confirm the intended email to the assistant/developer so only that exact existing account can be granted private.admin_users membership. Passwords stay in the provider’s supported UI.
4. Re-run npm run check:backend and complete sign-in, refresh, sign-out, revoked/non-owner access and photo lifecycle checks from backend-setup.md. This is not production-ready until those checks pass.

## Verification commands

npm run check, npm test and npm audit passed: lint, strict type checking, production build, 45 local tests and zero reported dependency vulnerabilities. The build was performed with the connected backend. The HTTP suite explicitly blanks Supabase configuration in its child server so automated tests never write to or depend on the real project.

npm run check:backend is a separate read-only check of the configured live project. It prints no keys or customer data. Exit 0 means read checks and disabled public sign-ups passed; exit 1 indicates failed read/config checks; exit 2 means the read checks passed but public sign-ups still require manual disabling. Its latest exit is now 0: read checks and disabled sign-ups pass. This does not verify that an owner Auth user exists or that the interactive sign-in lifecycle has been tested.

## Advisor findings

No security WARN/ERROR was reported. There is an informational [RLS enabled without policy notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) for the deliberately private, default-denied membership table. The pending cleanup adds an explicit deny policy.

Performance advice includes [overlapping permissive policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies) on five public content tables, addressed by the pending migration, and [unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index) on this new, empty project. The project/status and image foreign-key indexes are retained for their intended query paths; no fabricated performance benchmark is claimed.

Supabase’s current changelog was checked. The project uses Postgres 17.11.0.011, newer than the listed timezone fix. The upcoming old TLS cipher removal requires no legacy-compatibility downgrade for the Node 24 application. Relevant source: [TLS change](https://supabase.com/changelog/cbc-tls-ciphers-deprecated).

No website deployment, public intake activation, automated email delivery, owner account creation or paid service change was performed.

## Client onboarding and password self-service

The intended client login email was supplied privately and is not stored in this document or source configuration. No matching Auth user existed at the latest check, so no membership was granted. Follow [client onboarding](client-onboarding.md) for the one-time developer dashboard step; the client only receives a website login.

A protected Account security screen and reauthenticated password-change action are now implemented. Lint, typecheck, production build and all 52 local tests pass. Live password/session testing remains pending the initial account. No real password was read, stored in source or changed by the assistant.
