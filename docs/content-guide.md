> Current workflow: the client supplies and approves business content; the developer performs all website administration. No client login is needed. References to owner editing below mean the protected tools used by the developer.

# Owner content guide

The owner interface is now implemented at /login and /admin. It requires a provisioned Supabase project and owner membership; follow backend-setup.md and owner-workflow.md. The business name/logo and verified fallback details remain in source configuration; About text, service area, telephone, email and the business Facebook URL can be edited through the owner interface once connected.

Before publishing, provide the approved service inventory, logo source and usage rights, authentic project photos and publication consent, descriptions and alt text, and any generalised locations suitable for public display. Avoid customer addresses and identifying details in project content. The supplied em-logo.jpg is now present; an optimised public copy is used without changing its proportions. Confirm publication rights before launch.

Only genuine, approved reviews with publication consent may be shown. No reviews or project examples are seeded. Confirm review moderation, quotation fields, retention/deletion periods and whether photo attachments are needed before these workflows are implemented.

Business hours, pricing, licensing, qualifications, awards and response guarantees have not been verified and must not be invented. Use Australian English and the business Facebook page. Confirm and test any Messenger deep link before adding it.

Later handover must explain secure owner sign-in, project/photo editing, publishing and archiving, review moderation, private enquiries, data deletion and independent exports. These workflows are implemented locally but still need live Auth/Storage verification before handover.

Public pages now include About, Services, Projects, Reviews, Contact, FAQ and a preview Privacy notice. Service/project/review placeholders deliberately contain no unverified examples. Manage services and FAQs under /admin/content once connected and after both migrations have been applied. Review and approve each draft before publishing. The theme switch saves only the browser’s display preference and collects no enquiry data.

Search metadata and business structured data use the verified source details. When changing business information, update src/config/site.ts and the relevant page descriptions consistently. Do not add fabricated reviews, ratings, prices, opening hours or a street address to structured data. Search indexing stays disabled until approved content and launch checks are complete.

## Confirmed intake fields

The user approved the following fields on 1 November 2026, with submissions disabled until retention is agreed:

- Quotation enquiry: name, email or phone, project description and optional suburb. No photo attachments.
- Website review: display name, rating, written feedback and publication consent. No customer account or photo attachment.

The user clarified that most existing ratings, reviews and testimonials come from the business Facebook page. No Facebook content has been imported or approved for republication. Recommendation pending confirmation: link to the business page and allow owner-curated testimonials with permission and source attribution, rather than depending on automatic review synchronisation. This does not remove the planned website feedback workflow. The user subsequently authorised the recommended Supabase and manually provisioned owner email/password approach; see decision 0004. Public submissions still await retention agreement.

## Current owner workflow

See [owner workflow](owner-workflow.md) for draft/publish/archive, photo uploads and metadata editing, manual Facebook curation, moderation, private enquiries, permanent deletion and export. No actual project/customer content has been seeded. Complete live verification before relying on the owner interface.

The second migration adds private FAQ drafts from the verified starter copy; no offered-service inventory is seeded. Owner approval is required for publishing both services and FAQs. Before/after comparison is optional and requires one suitable pair plus the project setting; visual alignment must be checked by the owner.
