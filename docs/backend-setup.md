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

Public enquiry/review endpoints return 503 and anonymous database writes are denied. The approved retention periods are documented in the [owner workflow](owner-workflow.md). Retention migrations add database-controlled clocks, expiry-update guards and a private hourly cleanup job. Enabling intake requires retention enforcement, reviewed policies, server validation, durable rate limiting, abuse prevention and accessible form states; there is no environment toggle that enables it. See [recovery](owner-workflow.md) and [deployment](deployment.md).
