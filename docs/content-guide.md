# Owner content guide

The current scaffold has no admin interface. Verified details are temporarily maintained in src/config/site.ts. Source-based editing is an interim development arrangement; owner-managed content is planned after secure authentication and storage are chosen.

Before publishing, provide the approved service inventory, logo source and usage rights, authentic project photos and publication consent, descriptions and alt text, and any generalised locations suitable for public display. Avoid customer addresses and identifying details in project content. The supplied em-logo.jpg is now present; an optimised public copy is used without changing its proportions. Confirm publication rights before launch.

Only genuine, approved reviews with publication consent may be shown. No reviews or project examples are seeded. Confirm review moderation, quotation fields, retention/deletion periods and whether photo attachments are needed before these workflows are implemented.

Business hours, pricing, licensing, qualifications, awards and response guarantees have not been verified and must not be invented. Use Australian English and the business Facebook page. Confirm and test any Messenger deep link before adding it.

Later handover must explain secure owner sign-in, project/photo editing, publishing and archiving, review moderation, private enquiries, data deletion and independent exports. These workflows are not yet available.

Public pages now include About, Services, Projects, Reviews, Contact, FAQ and a preview Privacy notice. Service/project/review placeholders deliberately contain no unverified examples. Update FAQs in src/app/faq/page.tsx until an authenticated owner editor is implemented. The theme switch saves only the browser’s display preference and collects no enquiry data.

Search metadata and business structured data use the verified source details. When changing business information, update src/config/site.ts and the relevant page descriptions consistently. Do not add fabricated reviews, ratings, prices, opening hours or a street address to structured data. Search indexing stays disabled until approved content and launch checks are complete.

## Confirmed intake fields

The user approved the following fields on 1 November 2026, with submissions disabled until retention is agreed:

- Quotation enquiry: name, email or phone, project description and optional suburb. No photo attachments.
- Website review: display name, rating, written feedback and publication consent. No customer account or photo attachment.

The user clarified that most existing ratings, reviews and testimonials come from the business Facebook page. No Facebook content has been imported or approved for republication. Recommendation pending confirmation: link to the business page and allow owner-curated testimonials with permission and source attribution, rather than depending on automatic review synchronisation. This does not remove the planned website feedback workflow. Backend provider and owner sign-in are still awaiting confirmation.
