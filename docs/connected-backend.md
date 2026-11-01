# Connected Supabase backend

Verified on 2 November 2026 (Asia/Manila).

- Application slug: em-carpentry
- Hosted project display name: em-carpentry (verified through the provider API on 2 November 2026). The project reference remains unchanged.
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
- The read-only script created no users, records or files. The intended client Auth account was separately confirmed to have a verified email and a password, then granted website-admin membership through the trusted developer connection. No password or hash was read. Personal login details remain outside Git.

Hosted database lifecycle checks also passed using disposable fixtures inside a transaction that ended with ROLLBACK: owner draft creation and enquiry access, denied anonymous/private reads, denied non-owner updates, project publication/archiving, review approval/rejection, and confirmed-service publication/archiving. All fixture changes were rolled back. These checks simulated database roles and request claims; they do not verify real JWT login, browser cookies or Storage API uploads.

## Client account status and remaining verification

Public sign-ups are verified disabled. The intended client account exists, its email is confirmed, a password is set and private.admin_users membership is enabled. This grants website-dashboard access only; no Supabase organization invitation was sent. Do not recreate the account or share passwords/access tokens in chat.

The existing local preview serves /login with HTTP 200 and redirects anonymous /admin requests to /login with HTTP 307. Sign in privately using the agreed account. Then verify session refresh, sign-out, password change, revoked/non-owner access and actual photo upload/deletion using backend-setup.md. Interactive Auth/Storage and browser checks remain incomplete; the local preview is not a deployment.

## Verification commands

npm run check, npm test and npm audit passed: lint, strict type checking, production build, 52 local tests and zero reported dependency vulnerabilities. The build was performed with the connected backend. The HTTP suite explicitly blanks Supabase configuration in its child server so automated tests never write to or depend on the real project.

npm run check:backend is a separate read-only check of the configured live project. It prints no keys or customer data. Exit 0 means read checks and disabled public sign-ups passed; exit 1 indicates failed read/config checks; exit 2 means the read checks passed but public sign-ups still require manual disabling. Its latest exit is now 0: read checks and disabled sign-ups pass. This does not verify that an owner Auth user exists or that the interactive sign-in lifecycle has been tested.

## Advisor findings

No security WARN/ERROR was reported. There is an informational [RLS enabled without policy notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) for the deliberately private, default-denied membership table. The pending cleanup adds an explicit deny policy.

Performance advice includes [overlapping permissive policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies) on five public content tables, addressed by the pending migration, and [unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index) on this new, empty project. The project/status and image foreign-key indexes are retained for their intended query paths; no fabricated performance benchmark is claimed.

Supabase’s current changelog was checked. The project uses Postgres 17.11.0.011, newer than the listed timezone fix. The upcoming old TLS cipher removal requires no legacy-compatibility downgrade for the Node 24 application. Relevant source: [TLS change](https://supabase.com/changelog/cbc-tls-ciphers-deprecated).

This earlier backend checkpoint performed no website deployment, public intake activation, automated email delivery or paid service change. The later approved Free test deployment is recorded in hosted-preview.md. The client account was created manually before this verification; the assistant granted only its website-admin membership.

## Client onboarding and password self-service

The intended client login email was supplied privately and is not stored in this document or source configuration. Provisioning and membership are complete. Follow [client onboarding](client-onboarding.md) for the private sign-in check and handover; the client only receives a website login.

A protected Account security screen and reauthenticated password-change action are now implemented. Lint, typecheck, production build and all 52 local tests pass. Live password/session testing remains pending private interactive verification. No real password was read, stored in source or changed by the assistant.

## Connected-preview HTTP verification and hosting preparation

On 2 November 2026, a targeted provider query confirmed that the intended client has a recorded sign-in and still has website-admin membership. No session, password or private login address was read into source. npm run check:auth passed all 27 read-only checks across nine admin routes, including export, using anonymous requests, malformed cookies and forged sessions with invalid signatures. Every request redirected to sign-in with no-store. Real refresh, sign-out, password-change and photo-upload interaction checks remain pending; browser automation failed at initialisation.

The user approved preparing Netlify Free locally. Configuration, the pinned adapter and the safer 4 MiB application upload allowance are documented in deployment.md and decision 0006. The hosted bucket keeps its existing 5 MiB ceiling; no schema, storage object or customer record was changed by hosting preparation. Public intake/indexing remain disabled and nothing is deployed.

Local Netlify build verification passed on 2 November 2026 with adapter 5.16.5, CLI 27.16.1 and Next.js 16.4.3; server and Edge Functions packaged successfully. This is not a deployment or proof of actual hosted cookie/cache/upload behaviour.

The adapter-served local preview also passed all 27 access-denial checks, served eight public pages and kept both intake endpoints at 503. Login HTML passed with identity encoding, but its default compressed response had a header/body mismatch in the local emulator; the ordinary Next.js preview returned correct gzip bytes. See deployment.md. Hosted compression/browser verification remains a gate, not a claimed pass.

Final checkpoint gates passed: npm run check (lint, strict typecheck, production build), all 54 tests including upload boundary/transport cases, and npm audit with zero project dependency findings. Generated hosting/build output and .env.local remain ignored and untracked.

## Hosted test checkpoint

The authorised Netlify test URL is https://em-carpentry.netlify.app. The final native build/deploy pipeline and hosted page/assets/intake/indexing checks passed; 27 invalid-session scenarios and four private build/configuration paths also passed. The user confirmed hosted sign-in and dashboard persistence after reload. GitHub's hosted Quality checks passed all 54 tests. See [hosted preview](hosted-preview.md) for deployment IDs, actual legacy Free quotas, packaging correction/deletion and outstanding owner/Storage/session verification. Public submissions and indexing remain disabled.
