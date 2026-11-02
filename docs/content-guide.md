# Content guide

EM Carpentry & Home Maintenance operates in Australia since 2018 and serves Geelong, Victoria, and nearby areas. Public contacts are +61 497 175 163, emcarpentry.maintenance@gmail.com and https://www.facebook.com/EMscarpentryworks. Use Australian English and the business Facebook page.

## Publication

- Confirm the actual service inventory before publishing categories or descriptions. Do not invent hours, prices, qualifications, licensing, awards, customer counts or response guarantees.
- Use authentic completed-project photos with publication permission and descriptive alt text. Prefer a suburb over an address; check visible identifying details as well as metadata.
- Preserve the supplied logo's proportions and confirm usage rights. Source business name/logo and verified fallback details live in src/config/site.ts.
- Publish only genuine testimonials with permission and attribution. Facebook recommendations do not imply a star rating, and no automatic review import is configured.
- Review services and FAQs under /admin/content and confirm accuracy before publishing. Four starter FAQs are drafts, not automatically approved business content.

Update About text, service area, telephone, email and the business Facebook URL through the dashboard. Tell the developer about permanent contact changes so source fallback details and relevant metadata can stay consistent. Keep unsupported claims out of structured data.

## Customer submissions

Approved form fields are:

- Enquiry: name, email or phone, project description and optional suburb.
- Review: display name, rating, written feedback and publication consent.

Customer accounts and photo attachments are not required. The forms are active on the approved test website; search indexing remains disabled. Retention, validation, moderation, duplicate protection and durable submission limits are in place; follow [activation](backend-setup.md#website-intake) and the [retention policy](owner-workflow.md#retention-and-deletion) when operating intake or setting up another destination. No automatic enquiry-email delivery is configured. Direct phone, email and business Facebook links remain available.

## Maintenance

Keep projects/photos and business copy current through the [owner workflow](owner-workflow.md). Export data and save photo bytes before significant changes. The developer can inspect an export offline with npm run check:backup; a passing inspection does not prove a full restore. Include backup copies in the agreed deletion process and verify provider recovery separately.
