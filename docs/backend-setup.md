# Backend setup

## Existing project

- Supabase project: em-carpentry
- Reference: lllzqhfjrrtjavpvhmce
- Region: Sydney, ap-southeast-2
- API: https://lllzqhfjrrtjavpvhmce.supabase.co
- [Project dashboard](https://supabase.com/dashboard/project/lllzqhfjrrtjavpvhmce)

Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env.local for development and in Netlify for Builds and Functions. Leave both blank for unconfigured local mode. Never use a privileged key in browser code or commit credentials.

## Schema and access

The hosted project has these migrations applied:

1. 20261101110949_foundation.sql
2. 20261101110955_owner_content.sql
3. 20261101111002_private_admin_lookup.sql
4. 20261102093450_explicit_owner_write_policies.sql
5. 20261102093529_submission_retention.sql
6. 20261102093740_schedule_submission_retention.sql

20261102095500_secure_website_intake.sql is prepared and tested locally but is not applied to the hosted project. Do not enable intake or provision its credential row before that migration is approved and applied.

Do not rerun applied migrations or the non-idempotent foundation. Inspect hosted history before applying future changes through the normal migration workflow. A new empty destination uses all tracked migrations in filename order.

Public access is limited to published projects, approved consented reviews, confirmed published services/FAQs and public business settings. Enquiries and owner membership remain private. Server operations independently verify the authenticated user and private.admin_users membership; database and Storage policies enforce access as well.

The project-images bucket is private, WebP-only and limited to 5 MiB per object. Application uploads accept at most 4 MiB and 24 million decoded pixels, then re-encode within 1600 by 1600. Private media bypasses image optimisation and uses private/no-store responses so archived photos are not retained in an optimisation cache.

## Retention operations

The submission_retention migration adds closed_at to enquiries, retention_started_at to reviews and retention_expires_at to both. Pending/rejected reviews share 30 elapsed days; closed enquiries get 90 elapsed days. Triggers ignore client-supplied clocks, preserve creation timestamps on updates and reject updates to expired records. An existing legacy closed/rejected row stops the migration for date assessment; no dates are guessed.

The schedule_submission_retention migration enables pg_cron and installs only em-carpentry-submission-retention at 0 * * * * (hourly). Its private, security-invoker cleanup function has no anonymous/authenticated execution grant or public RPC. No web-server service-role key is required. It removes due closed enquiries and pending/rejected reviews and prunes only its own run history after seven days. Downloaded backups still require manual 30-day rotation.

After applying migrations, verify the schedule and run history through a trusted SQL connection:

```sql
select jobname, schedule, active
from cron.job where jobname = 'em-carpentry-submission-retention';
select status, start_time, end_time
from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'em-carpentry-submission-retention')
order by start_time desc limit 5;
```

After a pause, failed cleanup or private-data restore, run select private.purge_expired_submissions(); through the trusted database connection and verify expiry counts are zero before resuming use. The function returns counts only. Do not expose it as a public endpoint. A paused project cannot execute scheduled work, and the scheduler is not an exact-time deletion guarantee.

[Supabase Cron installation](https://supabase.com/docs/guides/cron/install) and [job operations](https://supabase.com/docs/guides/cron/quickstart) describe native scheduling and history. Local PGlite tests use scheduler stand-ins and exercise the actual scheduled SQL; actual worker runs must be verified on Supabase.

Supabase's [leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) advisor warning cannot be resolved on Free: the feature requires Pro or above. Do not upgrade the plan for this check. Use a unique password kept in a password manager.

## Website intake

The contact and feedback forms are implemented but remain switched off on the approved test deployment. No new provider or CAPTCHA subscription is required. Enabling collection requires its own release review, independent of search indexing.

The server validates origin, JSON content type, a 32 KiB streaming body limit, shared field schemas, a honeypot and a network-bound signed form token. Tokens require three seconds of form age and expire after 30 minutes. Browser retries keep their original request identity, so an uncertain response does not create a second record. The form displays accessible field errors, pending and success states; no customer login or attachments are offered.

The Netlify request header [X-Nf-Client-Connection-Ip](https://answers.netlify.com/t/upcoming-change-stripping-exposed-netlify-headers-from-function-and-proxy-requests/52665) supplies the network address. Do not substitute untrusted forwarding headers or enable the local platform in production. Missing/malformed trusted identity fails closed. Verify the native adapter preserves this header and cannot be made to trust a caller-supplied substitute during controlled activation.

A private security-definer gateway is owned by website_intake, a NOLOGIN/NOBYPASSRLS role with scoped INSERT permissions and no customer SELECT/UPDATE/DELETE access. Its public wrapper is security-invoker. The cookie-free server client must supply a separate high-entropy credential; the database stores only its SHA-256 hash. Authenticated browser sessions and direct anonymous table writes are not submission credentials. The gateway fixes enquiries to New and reviews to Pending with website attribution and recorded consent, Extra fields, including publication status, are rejected.

Atomic database checks and inserts enforce three accepted submissions per network per rolling hour, eight per rolling 24 hours and 40 globally per UTC day, shared across enquiries/reviews. Duplicate retries do not consume additional quota. Limits can affect shared networks; direct contact remains available. Basic controls reduce abuse but do not replace monitoring. Keep quotas and pause behaviour suitable for the Free plan.

Security identifiers and content fingerprints are private operational state, retained for 24 hours until the next hourly cleanup. They contain no raw network address and are excluded from business exports along with credential hashes. Customer records keep their independently approved retention clocks.

### Private configuration and activation

1. Run npm run prepare:intake -- https://em-carpentry.netlify.app. It creates ignored .verification/intake.env with mode 0600, a random server-only credential and INTAKE_ENABLED=false. It prints only the private path and SHA-256 digest. Existing files are never overwritten. Never copy the raw credential into source, browser code, logs or chat.
2. Through the trusted database connection, insert/update private.intake_credentials id=1 with key_hash=decode(the_generated_digest,'hex') and enabled=false. The digest is not the credential.
3. Import the private environment file through the supported Netlify CLI into the intended site, merging existing variables. Netlify import output can contain values: capture/suppress it and report only success/failure. Do not use --replace-existing. Ensure Builds and Functions receive INTAKE_SECRET, INTAKE_ORIGIN, INTAKE_PLATFORM=netlify and INTAKE_ENABLED=false.
4. Deploy and verify paused intake with npm run check:preview and npm run check:auth. Keep indexing disabled. Review the visible form fields and privacy notice before authorising collection.
5. Only after collection approval, set the exact credential row enabled=true and INTAKE_ENABLED=true in the hosting environment, then rebuild/deploy. Run npm run check:backend -- --intake-ready and npm run check:preview -- https://em-carpentry.netlify.app --intake-enabled. This sends invalid requests only and verifies token issuance without saving customer data.
6. Test one synthetic enquiry and review through the hosted path, retry each unchanged request and verify only one record per request. Confirm private enquiries, Pending reviews, owner moderation and retirement of the exact synthetic records. Test the provider-header anti-spoof boundary before leaving intake enabled. Record no customer values or credentials in source or logs.

To pause immediately, set enabled=false on the exact private credential row through the trusted connection; this blocks inserts without a deploy. Also set INTAKE_ENABLED=false and redeploy so forms visibly pause. Rotate a compromised credential in both destinations and invalidate old form tokens. Never enable a Supabase service-role key for this workflow.

Keep the generated private configuration in protected storage, never a public directory or source backup. It is not part of the schema-v3 business export. Disaster recovery needs a fresh credential and disabled intake until the destination is checked.

[OAIC collection guidance](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-3-app-3-collection-of-solicited-personal-information) and the [small-business checklist](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business) inform the collection notice and data minimisation. Privacy Act coverage depends on business circumstances; the website does not claim legal compliance or an Australia-only processing guarantee.

## Owner provisioning and recovery

The existing website owner is already provisioned. For a new or replacement account:

1. Keep hosted Auth public sign-ups disabled. Local supabase/config.toml does not change hosted settings.
2. Create the intended email/password user through Auth Users and confirm its email. Set and share credentials privately; reliable invitation/reset email is not configured.
3. Grant membership only to that confirmed account through a trusted administrative connection:

```sql
insert into private.admin_users(user_id)
select id from auth.users
where email = 'REPLACE_WITH_OWNER_EMAIL'
  and email_confirmed_at is not null
on conflict do nothing;
```

The client receives a website login, not organization/database-console access or API keys. For urgent revocation, remove the exact private membership and revoke provider sessions. Do not restore old membership UUIDs into a different Auth instance.

## Local verification

```sh
npm run check
npm test
npm run check:backend
```

The backend checker performs read-only live access/configuration checks. PostgreSQL tests use PGlite with Auth/Storage schema stand-ins; they do not replace actual provider login, refresh, revocation, upload or restore tests. Optional local Supabase CLI services require a supported Docker runtime.

Public enquiry/review endpoints return 503 and anonymous database writes are denied. The approved retention periods are documented in the [owner workflow](owner-workflow.md). Retention migrations add database-controlled clocks, expiry-update guards and a private hourly cleanup job. The prepared server gateway and forms require both a disabled-by-default application switch and an explicitly enabled private credential row. Follow Website intake above; an application switch alone cannot grant database writes. See [recovery](owner-workflow.md) and [deployment](deployment.md).
