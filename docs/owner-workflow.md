# Owner workflow

Sign in at https://em-carpentry.netlify.app/login. Use Sign out on shared devices. [Client onboarding](client-onboarding.md) covers passwords and account recovery.

## Projects and photos

1. Create a draft project with a short unique lower-case slug, accurate descriptions and an optional general suburb. Changing a published slug changes its public URL.
2. Open Edit and manage photos. Upload approved JPEG, PNG or WebP files up to 4 MiB, confirm permission and add descriptive alt text. Images are resized/re-encoded to WebP with original metadata removed. Review identifying content visible in the photo.
3. Edit photo descriptions, order and Gallery/Before/After roles. A comparison needs exactly one Before and one After image with matching framing, plus the project comparison setting.
4. Review text/photos before publishing. At least one photo is required. Feature on Home controls featured entries. Draft and Archived hide the project and its images from visitors.
5. Remove photo permanently deletes its stored file and metadata; keep a backup first. Project deletion is not offered in the dashboard, so archive old entries.

## Inbox overview

The dashboard overview shows the number of New enquiries and Pending reviews, with links to those filtered inboxes. Counts refresh when you open or reload the page; there is no background polling or email alert. A zero means the count succeeded and found none. If a count is unavailable, open that inbox to check rather than assuming it is empty.

## Business content and feedback

Use Services & FAQs to draft, order, confirm, publish or archive accurate content. Initial FAQs require review; no service inventory is prefilled. Under Business information, update About text, service area, Australian phone, email and the business Facebook page. Business name/logo remain developer-managed. Notify the developer of permanent contact changes to keep outage fallback details current.

Under Reviews, curate only genuine feedback you have permission to republish, with its Facebook source link and agreed display name. Preserve its meaning; do not turn recommendations into invented star ratings. Pending/rejected feedback stays private. Use Withdraw publication consent under moderation to hide feedback immediately and clear its consent. It then follows the unpublished-review deadline and cannot be approved again without fresh permission. Permanent deletion remains available.

Enquiries contains private New/Reviewed/Closed records. Public intake is enabled on the approved test website. Check Enquiries and Reviews regularly because email notifications are not configured. Use Reviewed while following up, and Closed once finished; closure starts the 90-day retention period. New website reviews are Pending and stay private until approved. Approve only genuine relevant feedback with publication consent; reject spam, duplicate, abusive, unrelated or identifying content. Do not invent ratings or change the meaning of feedback. Use Withdraw publication consent immediately when requested. Permanent enquiry/review deletion requires typing DELETE.

Both inboxes show up to 20 records per page, newest first. Use Filter by status to focus on New enquiries or Pending reviews, and use Next/Previous page for older records. Applying a filter returns to page 1. If an update or deletion leaves a filtered page empty, use First page or change the filter. Received dates use Melbourne time. Reviews show the submitted rating, or explicitly state when no rating was supplied; Facebook entries include a safe source link for checking attribution.

The forms collect only the approved fields, require no customer accounts and accept no photo attachments. Submission limits or temporary outages leave direct phone, email and Facebook contact available. The developer can pause intake immediately if there is an abuse or availability problem.

## Backups

Use Download business and customer data for a schema-v3 JSON export of projects, photo metadata, reviews, enquiries, business settings, services and FAQs. Keep it in a protected location outside Git/public assets. It contains private content but no account passwords or sessions.

Download every photo separately with Download photo for backup. The downloaded filename uses project_images.id; the original Storage location is project_images.path in the JSON. Preserve that mapping: the image-record ID and Storage object filename can differ.

The developer can inspect a saved export locally:

```sh
npm run check:backup -- /private/path/em-carpentry-export.json
```

The command validates structure, unique IDs/slugs/paths, photo references and publication constraints. It prints counts and the export’s 30-day rotation deadline, with warnings for expired or future-dated exports. It does not alter/delete files, follow photo paths or contact providers. Its inspection limit is 64 MiB. A pass does not prove freshness, completeness, photo integrity or a successful restore; use database backup tooling for larger datasets. Keep independent copies and include backups in the retention/deletion policy.

## Retention and deletion

The approved periods apply to website copies, not contracts, invoices or other separately required business records:

| Website data | Retention |
| --- | --- |
| Closed enquiries | 90 days after closure |
| Pending or rejected reviews | 30 days |
| Published reviews | While displayed with valid publication consent |
| JSON exports and separate photo backup copies | Rotate after 30 days |

The database records closure times and review retention clocks; the dashboard shows deletion deadlines in Melbourne time. An enquiry gets 90 elapsed days on closure. Reopening before expiry clears its deadline; closing again starts a new period. Reviews get 30 elapsed days on submission or when an approved review becomes unpublished. Pending/rejected transitions and ordinary edits preserve that deadline. Approved reviews with valid consent have no timed expiry. Expired records can only be deleted, not reopened or approved.

Temporary anti-abuse identifiers and content fingerprints are retained for 24 hours before the next hourly cleanup; raw network addresses are not stored in these tables. Security state and credential hashes are excluded from business exports.

The private database cleanup runs hourly while Supabase is active, so physical deletion occurs on the next successful run after expiry. If the Free project pauses or cleanup fails, deletion can be delayed; after recovery the developer must run cleanup and verify the schedule before resuming use. This job does not rotate downloaded backups or remove records in external email/Facebook systems. Pause intake during recovery or a security/availability problem; re-enable only after the destination and controls are checked.

For existing curated testimonials, unpublish immediately if consent is withdrawn and use permanent deletion when appropriate. Handle access, correction and deletion requests through the published business contact. Do not republish withdrawn consent from a backup.

Keep backups in protected storage outside Git/public assets. Save and verify a replacement before the old copy reaches 30 days; securely remove expired JSON copies and their associated photo copies from every location you control, including synced folders and recycle bins where applicable. Renaming, copying or checking an export does not restart its age. The checker warns only; it cannot rotate backups or inspect separate photo files. Review retention and consent before any restoration, and remove records already due for deletion before reconnecting the destination.

## Recovery and cleanup

For a separate recovery destination, apply schema migrations, restore public content respecting foreign keys, upload each photo at its original object path, provision the destination owner through Auth and grant the correct private membership. Verify private/public visibility and sessions before using the destination. Auth identities/sessions and photo bytes are separate from the JSON export; do not blindly restore old owner UUIDs. Schema-v3 exports include retention clocks. Before restoring private records, exclude anything expired or with withdrawn publication permission. A trusted operator must preserve original clocks and validate constraints in a controlled restore transaction; normal application inserts set new clocks and must not be used for recovery. Legacy schema-v2 exports lack these dates: obtain reliable closure/moderation evidence or omit the affected private records rather than inventing dates.

A developer SQL export can supplement dashboard backups through the supported Supabase CLI. Save dumps outside Git/public assets. Test full provider Auth/Storage recovery, not only local SQL import. If the Free backend pauses, the developer restores it through the provider dashboard; keep direct contact fallbacks available and do not enable paid recovery options without approval.

If an upload succeeds but attaching its photo record fails, the application attempts cleanup and reports any remaining orphan. The developer must compare exact Storage paths with project_images.path before removing a verified orphan through the supported Storage API. Do not edit storage.objects directly or bulk-delete guessed paths. If the stored photo was removed but its metadata deletion failed, retry the dashboard removal action.
