> Access model: developer-only administration. Do not provision or invite the business client. Any website Auth account and membership belong to the developer’s explicitly chosen identity; the Supabase dashboard account is separate. See decision 0006.

> Current project state: [connected backend](connected-backend.md). The project is already provisioned; do not create a duplicate or reapply installed migrations.

# Supabase setup and verification

This checkpoint implements Supabase-backed owner workflows. The hosted project and first three migrations are now installed; real owner provisioning and public intake remain incomplete. Use an eligible Free project in Sydney (ap-southeast-2); the developer owns the source/hosting accounts initially. Record the project reference, account custodian and recovery arrangements securely outside Git.

## Provisioning

1. Create or select the approved Supabase Free project in Sydney. Review decision 0002 and current terms/quotas again. Do not enable paid add-ons or upgrade billing without approval.
2. Disable new user sign-ups in the hosted Auth settings. The local supabase/config.toml also disables sign-ups; it does not configure a hosted project's Auth settings automatically.
3. Apply all pending SQL migrations in filename order using the CLI migration workflow or SQL editor. On a new project, apply 20261101110949_foundation.sql followed by 20261101110955_owner_content.sql. On an existing foundation installation, apply only the pending owner-content migration. Do not rerun the non-idempotent foundation. Read each migration first and back up existing content. No project/customer content or service inventory is seeded; the second migration adds four verified FAQ starters as private drafts for owner review.
4. Manually create the owner in Auth Users with email/password and confirmed email through the provider’s supported administrative UI. No password or auth token belongs in Git, .env.example, logs or customer-facing content. Do not rely on the default SMTP for production delivery or recovery.
5. In the SQL editor, grant that exact account owner membership:

```sql
insert into private.admin_users(user_id)
select id from auth.users where email = 'REPLACE_WITH_OWNER_EMAIL'
on conflict do nothing;
```

Verify that exactly the intended user is a member. Only an existing account is eligible; this query does not create a user. Membership is never editable from the public app. Revoke access with a targeted DELETE from private.admin_users and revoke the user's sessions through Auth. Every app action rechecks membership; JWT possession alone is insufficient.

6. Copy .env.example to .env.local and set SUPABASE_URL plus SUPABASE_PUBLISHABLE_KEY (or legacy anon key). Never use a secret/service-role key. These settings are server-side only. Both must be blank for unconfigured mode or both must be valid for connected mode. Restart/rebuild after changing them. The app refuses obvious privileged keys and malformed origins.
7. Keep SITE_INDEXING_ENABLED=false. Run npm run check and npm test before opening /login and completing the live checks below. No custom domain is required for this local setup.

## Local Supabase alternative

With a supported Docker runtime installed, use the official CLI: npx supabase start from this checkout. The tracked config defines local API/DB/Studio ports and disables sign-ups. Read the CLI output locally for its URL and public key; do not paste secret keys into chat or source. Apply migrations with npx supabase migration up --local. For a disposable local database only, npx supabase db reset recreates data; do not use reset against valuable data. Provision the local owner through Studio and the SQL membership step above.

Docker was unavailable in the implementation environment. This local CLI configuration and the full Auth/Storage services have not been exercised here. The permission tests instead run the actual application migration in PGlite PostgreSQL with explicitly defined Supabase auth/storage roles and table stubs. These tests verify SQL grants, RLS, constraints and transitions; they do not verify JWT cryptography, provider email, Storage HTTP behaviour or browser sessions.

## Live verification before using real content

Use disposable fixture content; do not use customer information for tests.

- Without a session, /admin and every child route including /admin/export must redirect to /login. Forged, expired and revoked credentials must never expose data. Authenticated non-members must be denied as well.
- Sign in as the owner, reload a protected page, exercise token refresh, sign out, and verify that protected data is no longer accessible. Session cookies must be HttpOnly, SameSite=Lax and Secure on HTTPS. Verify the actual hosted proxy/CDN respects private/no-store responses. Supabase Auth rate limits still need appropriate configuration; the app supplies generic error messages and no public sign-up or password-reset route.
- Create a draft project, upload a photo with alt text and permission confirmation, then publish. Anonymous requests must show the published project and photo; draft/archived project URLs, metadata and photo paths must remain inaccessible. Archive/unpublish and verify access disappears, including direct /media/id URLs and anonymous Storage requests.
- Update title, summary, description, category, approximate location and completion date. Verify search/category filters, featured Home entries, gallery order and before/after role labels. Enable comparison only for one Before and one After photo with matching framing; verify pointer and keyboard range control and the full gallery alternative. Remove/change a role and verify invalid pairs are omitted.
- Add a permitted Facebook testimonial with a source link and no fabricated rating. Pending/rejected reviews must be invisible; approved consented content must become visible. Reject it and verify it disappears.
- Update business About text and service area; verify About, Contact and footer content. Change telephone, email and the business Facebook page, then verify header/CTA/contact links, review/privacy links, Contact metadata and business structured data. The name/logo remain in src/config/site.ts. Simulate an unavailable backend and verify Contact labels fallback details, shortcuts route there and structured data omits stale contact details.
- Export data through /admin/export. Verify the JSON is complete, contains no tokens/passwords and is inaccessible after sign-out. Download photo files separately and test restoring into a separate disposable project.
- Both public POST endpoints must return 503. Direct anonymous database inserts must fail. Do not enable submissions until retention and the remaining intake security work are complete.

## Private photos and runtime compatibility

Uploads accept single JPEG/PNG/WebP files up to 5 MiB, at most 24 million decoded pixels. Sharp validates actual input, auto-orients, strips original EXIF/GPS metadata and converts to WebP within 1600 × 1600. The storage bucket allows only WebP up to 5 MiB. SVG/animated uploads are rejected. Next.js Server Actions permit a 6 MB multipart body; the smaller file limit is enforced separately on the server.

The bucket stays private. Anonymous read policies expose only files linked to published projects; the /media/id handler additionally checks metadata through RLS. Photo responses are no-store and Next Image optimisation is disabled for these private resources to avoid retaining unpublished images in the optimisation cache. Logo optimisation remains enabled. Removing uploaded metadata is not a substitute for checking identifying content visible in the photo.

This upload implementation requires a Node-compatible runtime with native Sharp support. It is not a verified Cloudflare Worker build. Cloudflare’s native-library/runtime and Free CPU limits remain a deployment blocker until an adapter-compatible image processing solution and realistic benchmark are established. No framework runtime or hosting provider has been silently changed.

## Submissions remain closed

The approved enquiry fields are name, email or phone, project description and optional suburb; review fields are display name, rating, feedback and consent. Shared schemas are implemented and tested, but customer-facing forms are not enabled. There is no enable flag: intake route handlers always reject without reading the body, anonymous inserts have neither grants nor policies, and authenticated non-owners cannot write either.

After retention is agreed, implement a separately reviewed migration and server intake workflow with durable rate limiting, anti-abuse controls, shared validation, accessible form states, consent handling and independent permission tests. Decide notification/recovery arrangements first. Do not add a service-role browser key or broad anonymous INSERT policy as a shortcut. No transactional notifications are configured.

## Owner-managed services and FAQs

After applying the second migration, open /admin/content. Review the initial private FAQ drafts, confirm each answer and publish only accurate content. Add only services the business actually offers; regulated-trade claims require verification. Confirm publication before choosing Published. Verify draft/archived entries and unconfirmed content remain invisible to visitors and non-owner accounts. Verify service ordering, Home summaries and FAQ ordering, edits, unpublishing and archive behaviour. New public content reads are capped at 100 services/FAQs; owner lists retain the provider’s 1,000-row default until pagination is needed.

Export schema version 2 includes these tables and contact settings. Apply both migrations in a restore destination before restoring public data. The PGlite suite now replays pending migrations after baseline fixture data to exercise upgrade preservation. Full hosted Auth/Storage and browser behaviour still require live verification.
