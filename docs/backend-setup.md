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

20261101111154_explicit_owner_write_policies.sql is a pending policy cleanup. Inspect hosted history and review pending SQL before applying it through the normal migration workflow. Do not rerun the non-idempotent foundation. A new empty destination uses all tracked migrations in filename order.

Public access is limited to published projects, approved consented reviews, confirmed published services/FAQs and public business settings. Enquiries and owner membership remain private. Server operations independently verify the authenticated user and private.admin_users membership; database and Storage policies enforce access as well.

The project-images bucket is private, WebP-only and limited to 5 MiB per object. Application uploads accept at most 4 MiB and 24 million decoded pixels, then re-encode within 1600 by 1600. Private media bypasses image optimisation and uses private/no-store responses so archived photos are not retained in an optimisation cache.

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

Public enquiry/review endpoints return 503 and anonymous database writes are denied. The approved retention periods are documented in the [owner workflow](owner-workflow.md). Automatic deletion and closure/moderation timestamps are not implemented yet. Enabling intake requires retention enforcement, reviewed policies, server validation, durable rate limiting, abuse prevention and accessible form states; there is no environment toggle that enables it. See [recovery](owner-workflow.md) and [deployment](deployment.md).
