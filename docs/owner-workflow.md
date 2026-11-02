# Owner workflow

The approved test site is https://em-carpentry.netlify.app, with sign-in at /login. Hosted sign-in and reload persistence have been confirmed by the user. Complete the remaining live checks in backend-setup.md and hosted-preview.md before final handover.

1. Open /login and sign in with your provisioned owner account. There is no public registration. Use Sign out on shared devices.
2. Under Projects, create a draft. Use a short, unique lower-case slug; changing it later changes the public URL. Add only verified descriptions and a general suburb, not customer addresses.
3. Open Edit and manage photos. Upload approved JPEG, PNG or WebP photos up to 4 MiB (about 4.2 MB). Confirm permission and provide descriptive alt text. You can edit photo descriptions, order and Gallery/Before/After labels after upload. For a comparison, use exactly one Before photo and one After photo of the same view/framing. Enable comparison on the project and save. Visitors can drag or use arrow keys; full images remain in the gallery. Changing/removing a role so there is no unique pair hides the comparison until corrected.
4. Publish only after checking the photos and text. At least one photo is required by the publishing action. Use Draft to unpublish or Archived to hide an older entry; project deletion is intentionally not offered. Featured entries appear on Home. Remove photo permanently deletes the stored image and its metadata; keep backups before removal.
5. Under Reviews, manually copy feedback you have permission to republish, including a Facebook source link and agreed display name. Keep the original meaning. Facebook recommendations are not converted into stars. Pending and rejected content is private; only approved consented content appears publicly. Removing consent requires unpublishing/deleting the testimonial; contact the developer for any historical consent correction. No automatic Facebook import is used.
6. Under Business information, edit About text and service area. You can also update the Australian telephone, email and business Facebook page. Use the business page rather than a personal profile. The business name/logo remain in verified source configuration. Do not introduce unverified licensing, awards, prices or response guarantees.
7. Enquiries shows private records and their New/Reviewed/Closed state. Public intake remains closed until retention is agreed, so no new website enquiries are expected yet. No automatic email notification is configured. Use the contact fallbacks for now.
8. Permanent review/enquiry deletion requires typing DELETE. Handle access/correction/deletion requests manually and document completion. Agree retention before collecting new customer data; no automatic retention purge has been enabled.

For a private draft/upload → publication → archive/removal test and account-security checks, follow [owner acceptance checks](owner-acceptance-checks.md). Use synthetic fixtures before customer content.

## Export and recovery

Use the dashboard’s Download business and customer data link for a paginated JSON export of all projects, photo metadata, reviews, enquiries and business settings. It includes private information: save it outside the public website and source repository. It does not contain account passwords, cookies or tokens. Photo bytes are separate; use each photo’s Download photo for backup link and retain the mapping to project_images.path in the export. Export before significant changes and agree a recurring backup routine at handover.

After downloading the JSON, the developer can check its structure offline:

```sh
npm run check:backup -- /private/path/em-carpentry-export.json
```

This command reads only the selected file. It validates the current schema version, all seven content tables, unique IDs/slugs/photo paths, image-to-project references and publication/consent constraints. It prints a timestamp and counts, never customer text or contact details, and does not rewrite the file, contact a provider or follow image paths. Files above 64 MiB are rejected by this inspection tool; use supported database backup tooling for larger datasets. Unexpected fields are rejected rather than silently removed, so preserve any original export and ask the developer to review schema differences.

A passing inspection does not prove completeness or freshness: omitted records cannot be discovered from a file alone. It also does not verify separate photo bytes, Auth recovery or a successful restore. Keep an independent protected copy outside Git/public assets, retain the photo path mapping and include backup copies in the agreed retention/deletion policy. Do not paste private exports into chat. Automated tests use synthetic snapshots. On 2 November 2026, a separate owner-provided local schema-v2 export passed structural/reference inspection without printing record contents or modifying the file. It references one photo whose separate bytes are still needed; no successful restore is claimed.

For a full database restore, the developer should retain migrations in Git and export public content data with the Supabase CLI to a secure, off-repository path. Example after linking the intended project: npx supabase db dump --linked --data-only --schema public --file /secure/off-repo/content.sql. Do not place backups in public/ or commit them. SQL backups do not include photo bytes. Download the private bucket separately through authenticated Storage tooling, preserving object paths. Restoring user identities/sessions is separate: provision the owner account and membership in the destination project through the supported Auth workflow. Do not blindly restore old owner UUID memberships into a different Auth instance.

Test restoration into a disposable project before relying on a backup. Apply schema migrations, restore content respecting foreign keys, restore photo objects at their original paths, provision the destination owner, then verify drafts/reviews/enquiries remain private before publishing anything. JSON exports are portable source data; a one-click JSON importer has not been implemented.

Supabase Free can pause after inactivity. The developer checks the provider dashboard and restores the project; no artificial keep-alive has been added. Public pages fall back to direct contact options when portfolio/review data is unavailable. Never upgrade a plan without approval.

## Upload cleanup

If uploading an object succeeds but attaching its database record fails, the action attempts to remove the object. If cleanup also fails, the action reports it. The developer must compare private Storage object paths with project_images.path, verify an object has no reference, then remove that specific orphan through Storage. Do not bulk-delete guessed paths or directly delete storage.objects SQL rows. A metadata deletion failure after a photo has been removed is reported separately; retry the Remove photo action to remove the leftover record.

## Services and FAQs

Use Services & FAQs in the owner navigation. Create or edit an entry, set its display order, review the text and confirm accuracy before publishing. Draft and archived entries remain private. Archive old entries rather than deleting source copy. The four initial FAQ entries are drafts; none is automatically treated as owner-approved. No service inventory has been prefilled. Never publish unverified licensing, regulated-trade services, pricing or response guarantees. Published service summaries appear on Home and the full text appears on Services.

When the database is unavailable, current service/FAQ content may be hidden. Contact displays previously verified fallback details with an explicit notice; header/CTA call shortcuts route visitors there. Tell the developer about permanent contact changes so the verified source fallback can also be kept current.

Exports now use schema version 2 and include services, FAQs, contact settings and project comparison preferences in addition to the earlier tables. Keep separate photo bytes and restore all migrations before importing data.

## Your account and password

Use Account security in the admin navigation to change your website password. Enter the current password and a different new passphrase of at least 12 characters twice. The provider verifies the current password before the change. No Supabase dashboard or database access is needed by the client. Other devices may retain access until their current sign-in expires; contact the developer for urgent access revocation or forgotten-password recovery. One-time setup is described in [client onboarding](client-onboarding.md).
