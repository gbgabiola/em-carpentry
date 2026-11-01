# Owner workflow

Complete backend-setup.md and its live checks before handing over a real account.

1. Open /login and sign in with your provisioned owner account. There is no public registration. Use Sign out on shared devices.
2. Under Projects, create a draft. Use a short, unique lower-case slug; changing it later changes the public URL. Add only verified descriptions and a general suburb, not customer addresses.
3. Open Edit and manage photos. Upload approved JPEG, PNG or WebP photos up to 5 MB. Confirm permission and provide descriptive alt text. You can edit photo descriptions, order and Gallery/Before/After labels after upload. Before/after images are labelled in the gallery; there is no comparison slider yet.
4. Publish only after checking the photos and text. At least one photo is required by the publishing action. Use Draft to unpublish or Archived to hide an older entry; project deletion is intentionally not offered. Featured entries appear on Home. Remove photo permanently deletes the stored image and its metadata; keep backups before removal.
5. Under Reviews, manually copy feedback you have permission to republish, including a Facebook source link and agreed display name. Keep the original meaning. Facebook recommendations are not converted into stars. Pending and rejected content is private; only approved consented content appears publicly. Removing consent requires unpublishing/deleting the testimonial; contact the developer for any historical consent correction. No automatic Facebook import is used.
6. Under Business information, edit About text and service area. Core contact details, service inventory and FAQs still need a developer update. Do not introduce unverified licensing, awards, prices or response guarantees.
7. Enquiries shows private records and their New/Reviewed/Closed state. Public intake remains closed until retention is agreed, so no new website enquiries are expected yet. No automatic email notification is configured. Use the contact fallbacks for now.
8. Permanent review/enquiry deletion requires typing DELETE. Handle access/correction/deletion requests manually and document completion. Agree retention before collecting new customer data; no automatic retention purge has been enabled.

## Export and recovery

Use the dashboard’s Download business and customer data link for a paginated JSON export of all projects, photo metadata, reviews, enquiries and business settings. It includes private information: save it outside the public website and source repository. It does not contain account passwords, cookies or tokens. Photo bytes are separate; use each photo’s Download photo for backup link and retain the mapping to project_images.path in the export. Export before significant changes and agree a recurring backup routine at handover.

For a full database restore, the developer should retain migrations in Git and export public content data with the Supabase CLI to a secure, off-repository path. Example after linking the intended project: npx supabase db dump --linked --data-only --schema public --file /secure/off-repo/content.sql. Do not place backups in public/ or commit them. SQL backups do not include photo bytes. Download the private bucket separately through authenticated Storage tooling, preserving object paths. Restoring user identities/sessions is separate: provision the owner account and membership in the destination project through the supported Auth workflow. Do not blindly restore old owner UUID memberships into a different Auth instance.

Test restoration into a disposable project before relying on a backup. Apply schema migrations, restore content respecting foreign keys, restore photo objects at their original paths, provision the destination owner, then verify drafts/reviews/enquiries remain private before publishing anything. JSON exports are portable source data; a one-click JSON importer has not been implemented.

Supabase Free can pause after inactivity. The developer checks the provider dashboard and restores the project; no artificial keep-alive has been added. Public pages fall back to direct contact options when portfolio/review data is unavailable. Never upgrade a plan without approval.

## Upload cleanup

If uploading an object succeeds but attaching its database record fails, the action attempts to remove the object. If cleanup also fails, the action reports it. The developer must compare private Storage object paths with project_images.path, verify an object has no reference, then remove that specific orphan through Storage. Do not bulk-delete guessed paths or directly delete storage.objects SQL rows. A metadata deletion failure after a photo has been removed is reported separately; retry the Remove photo action to remove the leftover record.
