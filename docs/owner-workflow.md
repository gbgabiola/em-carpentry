# Owner workflow

Sign in at https://em-carpentry.netlify.app/login. Use Sign out on shared devices. [Client onboarding](client-onboarding.md) covers passwords and account recovery.

## Projects and photos

1. Create a draft project with a short unique lower-case slug, accurate descriptions and an optional general suburb. Changing a published slug changes its public URL.
2. Open Edit and manage photos. Upload approved JPEG, PNG or WebP files up to 4 MiB, confirm permission and add descriptive alt text. Images are resized/re-encoded to WebP with original metadata removed. Review identifying content visible in the photo.
3. Edit photo descriptions, order and Gallery/Before/After roles. A comparison needs exactly one Before and one After image with matching framing, plus the project comparison setting.
4. Review text/photos before publishing. At least one photo is required. Feature on Home controls featured entries. Draft and Archived hide the project and its images from visitors.
5. Remove photo permanently deletes its stored file and metadata; keep a backup first. Project deletion is not offered in the dashboard, so archive old entries.

## Business content and feedback

Use Services & FAQs to draft, order, confirm, publish or archive accurate content. Initial FAQs require review; no service inventory is prefilled. Under Business information, update About text, service area, Australian phone, email and the business Facebook page. Business name/logo remain developer-managed. Notify the developer of permanent contact changes to keep outage fallback details current.

Under Reviews, curate only genuine feedback you have permission to republish, with its Facebook source link and agreed display name. Preserve its meaning; do not turn recommendations into invented star ratings. Pending/rejected feedback stays private. Withdrawn permission requires unpublishing/deleting the testimonial.

Enquiries contains private New/Reviewed/Closed records. Public intake is currently disabled and email notifications are not configured. Permanent enquiry/review deletion requires typing DELETE. Follow the agreed retention and access/correction/deletion process before collecting new data.

## Backups

Use Download business and customer data for a schema-v2 JSON export of projects, photo metadata, reviews, enquiries, business settings, services and FAQs. Keep it in a protected location outside Git/public assets. It contains private content but no account passwords or sessions.

Download every photo separately with Download photo for backup. The downloaded filename uses project_images.id; the original Storage location is project_images.path in the JSON. Preserve that mapping: the image-record ID and Storage object filename can differ.

The developer can inspect a saved export locally:

```sh
npm run check:backup -- /private/path/em-carpentry-export.json
```

The command validates structure, unique IDs/slugs/paths, photo references and publication constraints. It prints counts only and does not alter files, follow photo paths or contact providers. Its inspection limit is 64 MiB. A pass does not prove freshness, completeness, photo integrity or a successful restore; use database backup tooling for larger datasets. Keep independent copies and include backups in the retention/deletion policy.

## Recovery and cleanup

For a separate recovery destination, apply schema migrations, restore public content respecting foreign keys, upload each photo at its original object path, provision the destination owner through Auth and grant the correct private membership. Verify private/public visibility and sessions before using the destination. Auth identities/sessions and photo bytes are separate from the JSON export; do not blindly restore old owner UUIDs.

A developer SQL export can supplement dashboard backups through the supported Supabase CLI. Save dumps outside Git/public assets. Test full provider Auth/Storage recovery, not only local SQL import. If the Free backend pauses, the developer restores it through the provider dashboard; keep direct contact fallbacks available and do not enable paid recovery options without approval.

If an upload succeeds but attaching its photo record fails, the application attempts cleanup and reports any remaining orphan. The developer must compare exact Storage paths with project_images.path before removing a verified orphan through the supported Storage API. Do not edit storage.objects directly or bulk-delete guessed paths. If the stored photo was removed but its metadata deletion failed, retry the dashboard removal action.
