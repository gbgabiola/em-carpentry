# Owner workflow acceptance checks

Prepared 2 November 2026 for the approved Free test site: https://em-carpentry.netlify.app. Hosted sign-in/reload persistence and HTTP access checks have passed. The user subsequently confirmed photo upload, publishing/archiving and password change. Remaining detailed checks are listed below. Public intake and indexing stay disabled.

Browser automation is unavailable. The owner/developer performs authenticated actions in their own browser; no password, session cookie, token or private export needs to be shared with the assistant. Report success/error messages only. The assistant can independently check the synthetic record's public visibility, media response, metadata and cleanup through read-only requests and narrowly scoped backend queries.

## Prepare synthetic images

Run npm run fixtures:owner in the checkout. It creates a new ignored .verification/owner-upload-* directory without overwriting existing files, with a small JPEG, an exactly 4 MiB JPEG and a 4 MiB-plus-one-byte JPEG. The generator also checks local WebP processing, metadata removal and rejection of the oversized fixture. It makes no network request or database change. Generated files must stay outside public/ and Git. If a boundary upload fails, the small file can help distinguish transport limits from a general upload failure; do not count a smaller upload as a successful boundary test.

## Stage 1: Create a private draft and upload

Open /admin/projects and create a project with these clearly synthetic values:

- Title: Website verification (temporary test)
- URL slug: website-upload-verification (choose a unique suffix if already used; never overwrite an existing project)
- Summary: Synthetic website workflow verification, not completed customer work.
- Description: Temporary technical test of photo upload and publication controls. This entry does not represent a customer project.
- Publication status: Draft
- Leave category, location, completion date, featured and before/after options blank/off.

Select Create project, then Edit and manage photos. Confirm the entry survives a reload. Use the separately supplied upload-test-4mib.jpg (4,194,304 bytes), with Image description set to Synthetic technical test image, not customer work. Leave order 0 and role Gallery. The image was generated for this test and contains no customer/third-party photography; confirm its publication permission and choose Upload photo.

Expected: the photo appears in the authenticated editor, the action reports a successful upload and the entry remains Draft. Public /projects/website-upload-verification and the direct /media/{image-id} URL must be inaccessible without a session. The actual stored object must be WebP with original metadata removed. Local processing alone does not prove hosted transport/Storage behaviour.

Optional boundary check: attempt upload-test-too-large.jpg (4,194,305 bytes) once. Expected: the 4 MiB validation error and no extra database row or stored object. The original valid photo must remain intact. If the host rejects the request before the friendly application error, record that as a transport issue rather than a pass.

## Stage 2: Publish and verify

After the private-draft checks pass, set Publication status to Published and save. This briefly exposes only a clearly labelled technical test on the unfinished, non-indexed preview. Do not use real customer information or present it as completed business work.

Expected: the test project appears in Projects, its detail URL and photo return 200 without authentication, and media is WebP with no-store caching. Check its title, description and photo alt text. The assistant can inspect only this synthetic public image for original EXIF metadata. If the slug changed, verify the current detail URL rather than assuming the old one redirects.

## Stage 3: Archive and remove the test image

Set Publication status to Archived and save. Reload the public gallery/detail/media URLs without a session; the project and direct image must become inaccessible, including the previously used URLs. Owner access must still work. Then use Remove photo permanently on this synthetic photo.

Expected: both its project_images record and Storage object are removed, with no orphan. Keep the technical entry archived until the developer has verified cleanup. The UI intentionally does not offer project deletion. A developer may remove only the exact verified disposable fixture after checking its ID and removing all associated Storage objects through the supported Storage API. Do not bulk-delete guessed paths or edit storage.objects directly.

## Account security

Open /admin/account privately. Optionally check one incorrect-current-password attempt and confirm the existing password still works; do not repeatedly provoke provider rate limits. Set a different passphrase of at least 12 characters using matching new/confirmation fields. The correct current password must be required.

Expected: sign out, protected pages redirect to /login, the new password signs in and the old password no longer does. Test actual token refresh over expiry separately from ordinary page reload. Do not promise instant invalidation of all existing access tokens after password change. Urgent revocation requires removing private membership and revoking provider sessions. Keep every password and recovery detail outside chat/source.

## Export and handover

Download business/customer data from /admin/export and keep the JSON outside public assets, Git and chat. Confirm schemaVersion 2 and the seven expected content tables: projects, project_images, reviews, enquiries, business_settings, services and faqs. Download photo bytes separately before deleting meaningful content. Auth credentials/sessions are not part of that export. Verify the export route is inaccessible after sign-out.

Inspect the saved JSON locally with npm run check:backup -- /private/path/em-carpentry-export.json. It prints counts only and does not alter the backup, follow photo paths or contact providers. A pass validates structure/references, not completeness or recoverability.

A complete restore test still needs an isolated destination, schema migrations, foreign-key-aware content restore, photo-object path preservation and separately provisioned owner identity. Do not treat a downloaded JSON file as a proven recoverable backup. See owner-workflow.md for recovery and backend-setup.md for remaining live checks.

## Results

Record each stage separately as pending, user-confirmed or independently verified. Zero existing projects/photos before this test is not proof that an owner workflow was tested. Do not mark password/session/upload/publication checks passed based only on the deployment's 54 local tests or synthetic invalid-session HTTP checks.

### Recorded checkpoint

On 2 November 2026 the user confirmed hosted photo upload, publishing/archiving and password change. A separate read-only snapshot found one archived project, one image record and one matching stored object, with zero orphaned/missing files. Anonymous Data API access to the archived image metadata returned no row and its direct website media URL returned 404. No photo bytes, password or session credentials were read. Photo deletion was not inferred from archival; the stored image remains attached to the archived entry. Size-boundary, metadata-removal, export/restore, timed expiry/revocation and visual checks are not marked passed solely from this confirmation.

After renewed Netlify authorisation, the media-header follow-up was deployed and independently checked: the archived image URL returns an empty 404 with private/no-store/max-age=0 and nosniff. All 33 hosted access checks and public preview checks passed. The actual backup inspection/restore remains pending a locally downloaded export and separate photo bytes.
