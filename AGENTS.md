# AGENTS.md — EM Carpentry & Home Maintenance

## Confirmed access-model update — 2 November 2026

The developer has confirmed that this is a **developer-managed website**. This update supersedes earlier requirements for the business owner to sign in or independently manage the website.

- The developer alone controls Supabase, hosting, source code and the website administration interface.
- The business owner/client requests changes from the developer and does not need a Supabase account, database access or a website admin account.
- Retain secure admin tools for the developer to maintain projects, photos, approved services/FAQs, business information, enquiries and moderated testimonials.
- Any administrator provisioned for the website must be the developer's explicitly identified account. Do not use the public business email or create/invite a client account by assumption.
- References below to owner/admin workflows or owner membership describe privileged website administration; the current intended operator is the developer.
- The business owner still supplies/approves business facts, photo rights and testimonial permission. Business content and customer data remain exportable.
- Public quotation/review submissions remain disabled until retention is agreed. All other cost, privacy, authentication and deployment constraints remain in force.


## Project overview

Build a modern, responsive, accessible, SEO-friendly business website for **EM Carpentry & Home Maintenance**, a carpentry and home maintenance business operating in Australia since 2018 and primarily serving Geelong, Victoria, and surrounding areas. The website must attract customers, showcase completed projects, build trust, collect quotation enquiries and customer feedback, and allow the business owner to manage projects and business information with minimal developer assistance.

This is a no-fee development project with a strong preference for **zero recurring operating costs**. Do not introduce paid infrastructure, subscriptions, APIs, or a custom domain without explicit approval. Free tiers are conditional and may change; document quotas, limitations, and migration options. The developer owns the hosting and source-code accounts initially, but business content and customer data must remain exportable.

## Confirmed business details

- Business name: **EM Carpentry & Home Maintenance**.
- Operating in Australia since **2018**.
- Preferred service area: **Geelong, VIC, Australia**, and nearby areas; do not invent a fixed radius.
- Customers: homeowners, landlords, businesses, contractors, and other prospective clients.
- Differentiators: neat workmanship, attention to detail, willingness to go the extra mile.
- Language: Australian English (`en-AU`); use Australian spelling.
- Telephone: **+61 497 175 163** (`tel:+61497175163`).
- Email: **emcarpentry.maintenance@gmail.com** (`mailto:emcarpentry.maintenance@gmail.com`).
- Business Facebook page: **https://www.facebook.com/EMscarpentryworks**.
- Personal Facebook profile: **https://www.facebook.com/marvil.y.quiambao**. Prefer the business page in public-facing CTAs; do not prominently publish the personal profile without confirmation.
- Brand asset supplied: `em-logo.jpg` (source attachment; place an optimised copy in the repository's public assets). The logo features gold lettering and carpentry/house imagery on a dark brown background.
- No approved tagline, complete services inventory, business hours, published prices, or project content yet. Do not present invented details as verified facts.
- Business owner expects to reply to enquiries personally, ideally within the day, but no response-time guarantee should be advertised.

## Product goals and scope

1. Showcase a rich portfolio of completed projects, including optional before/after photos.
2. Explain the business, its craftsmanship, and its services.
3. Convert visitors into enquiries through telephone, email, Facebook Messenger, and quotation requests.
4. Allow the owner to create, edit, publish, and archive projects and update business information independently, roughly weekly or twice monthly.
5. Allow customers to submit feedback, ratings, and testimonials without mandatory customer accounts, subject to moderation.
6. Keep maintenance, security exposure, vendor lock-in, and recurring costs low.

### Public pages

- `/` — Home: hero, key services, featured projects, trust indicators, strong contact CTA.
- `/about` — About the business, experience since 2018, workmanship and values.
- `/services` — Service categories and descriptions.
- `/projects` — Searchable/filterable project gallery; categories and project details.
- `/projects/[slug]` — Project detail with photos, description, optional before/after comparison, and enquiry CTA.
- `/reviews` — Approved customer reviews/testimonials and a feedback submission form.
- `/contact` — Contact options, service area, and quotation enquiry form.
- `/faq` — Common questions, editable by the owner when practical.
- Appropriate privacy notice and any other legally necessary disclosures.

### Suggested service categories (unverified placeholders)

Carpentry and joinery, cabinetry and storage, furniture repairs, doors and fittings, decking and outdoor timberwork, general home repairs, maintenance, and installations. **Confirm each offered service with the owner before publishing it as a claim.** Do not imply licensing or qualifications for regulated trades without verification.

### Essential features (initial release)

- Mobile-first responsive layout across phone, tablet, and desktop.
- Modern light-wood-inspired visual design, light mode by default, optional persistent dark mode.
- Accessible navigation, readable typography, keyboard support, semantic HTML, and sufficient contrast.
- Optimised portfolio images, descriptive alt text, project categories, and project detail pages.
- Featured projects and clear conversion paths to call, email, or business Facebook/Messenger.
- SEO metadata, semantic headings, sitemap, robots directives, canonical URLs, Open Graph metadata, and local-business structured data using only verified information.
- Admin-only project and business-content management with secure authentication.
- Quotation enquiry submission with name, contact method/details, project description, and optional location/photos only when supported; minimise personal data collected. Confirm the precise form fields with the owner.
- Public review submission with rating and written feedback; display **approved** reviews only.
- Basic abuse prevention, form validation, clear submission states, and accessible error messages.

### Enhancements after the core workflow works

- Before-and-after image slider for projects with suitable paired photos.
- Project filters by service/category.
- Featured testimonials on Home and Projects pages.
- Optional analytics without invasive tracking.
- More flexible owner-managed services and FAQs.

### Explicitly out of scope unless requested later

- Customer login/accounts or customer portal.
- Online appointment booking or availability calendar.
- Payments, checkout, invoicing, or public pricing.
- Real-time chat hosted by this application.
- A complex internal job-management/CRM workflow. Here, **project management** initially means managing public portfolio entries, not managing schedules, staff, costs, or customer jobs.

## Recommended technology and architecture

Use the following as a **proposed baseline**, not an already approved or installed stack. If an existing repository is supplied, inspect it first and preserve established conventions where sensible.

- **Frontend:** Next.js (App Router), React, TypeScript.
- **Styling:** Tailwind CSS, CSS variables/design tokens, mobile-first responsive layouts.
- **Content and backend:** Prefer a low-maintenance managed free-tier solution such as Supabase for database, admin authentication, and image storage, after verifying current quotas, pricing, and Australian privacy/data-hosting implications. Do not assume unlimited free hosting or storage.
- **Hosting:** Evaluate a free Next.js-compatible deployment platform and its commercial-use policy before selection. Do **not** assume a personal/hobby free plan permits a business website. Cloudflare-compatible deployment is a candidate only after confirming current framework support and terms.
- **Repository:** GitHub with meaningful commits at completed checkpoints.
- **Contact:** `tel:`, `mailto:`, and verified business Facebook/Messenger links. Never assume a Messenger deep link works without testing.
- **Email delivery:** Do not assume free transactional email or direct browser-to-email delivery. If a reliable zero-cost notification provider is unavailable, persist enquiries securely in the admin interface and expose a mailto/Messenger fallback; document notification limitations.
- **Forms:** Server-side validation and rate limiting where feasible; protect public write endpoints and secrets.
- **Images:** Responsive sizing, modern formats, lazy loading below the fold, upload limits, and deletion/cleanup controls.

Architecture decision gate: before implementing the backend, compare the selected provider's **current** free-tier limits, commercial-use terms, storage, email capabilities, inactivity policies, and export/migration paths. Prefer the simplest viable solution. Do not add a database solely to render static marketing content; dynamic storage is justified by owner-managed portfolio entries, enquiries, and moderated reviews.

## Suggested file structure

```text
em-carpentry/
├── AGENTS.md
├── README.md
├── .env.example
├── public/
│   ├── images/
│   │   ├── brand/
│   │   ├── projects/
│   │   └── placeholders/
│   └── icons/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── about/page.tsx
│   │   ├── services/page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── reviews/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── faq/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   ├── enquiries/page.tsx
│   │   │   ├── reviews/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── sections/
│   │   ├── projects/
│   │   ├── reviews/
│   │   └── forms/
│   ├── features/
│   │   ├── projects/
│   │   ├── enquiries/
│   │   ├── reviews/
│   │   └── business/
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── validation/
│   │   ├── seo/
│   │   └── utils/
│   ├── config/
│   │   ├── site.ts
│   │   └── navigation.ts
│   ├── types/
│   └── test/
├── docs/
│   ├── decisions/
│   ├── deployment.md
│   └── content-guide.md
└── package.json
```

The tree is a target layout, not a claim that these files already exist. Place server actions, route handlers, and migrations in framework/provider-appropriate locations when implemented. Avoid creating empty directories or abstractions without a real use case.

## Data model (proposed)

- `projects`: ID, slug, title, summary, description, service category, location (optional/generalised), completion date (optional), publication status, featured flag, timestamps.
- `project_images`: ID, project ID, image path, alt text, display order, before/after role (optional).
- `services`: ID, name, slug, description, visibility, display order.
- `reviews`: ID, reviewer display name, rating (1–5), review text, optional project reference, consent flag, moderation status, timestamps. Store private contact information separately if collected.
- `enquiries`: ID, customer name, email/phone, project description, approximate service location (optional), status, created timestamp; never expose publicly.
- `business_settings`: public business details, contact links, service-area copy, and approved content.
- `admin_users`: managed by the authentication provider; no public self-registration.

Use database-level access controls and storage permissions. Public users may read only published projects and approved reviews; they may submit validated enquiries/reviews but must not read others' submissions or moderate content. Admin-only operations require verified authorization on the server. Treat user-submitted text and image uploads as untrusted.

## Visual and content guidelines

- Use the provided logo as the main brand reference; preserve proportions and avoid distorting or redrawing it without approval.
- Palette direction: warm off-white/ivory, pale oak, natural tan, rich walnut brown, and restrained gold accents. Derive final tokens from the logo and test contrast in both themes.
- Light theme is default; theme switch respects user choice and ideally system preference when no choice is saved.
- Aim for a refined, modern tradesperson portfolio rather than a cluttered construction template.
- Prioritise authentic project photography over generic stock imagery. Until photos arrive, use clearly labelled placeholders; never pass stock photos off as completed work.
- Use Australian English and straightforward, credible copy. Do not invent awards, certifications, licenses, testimonials, customer counts, years of experience beyond verified facts, or guaranteed response times.
- No public pricing; direct visitors to request a quote.
- Prefer the business Facebook page over the personal profile for customer communications.

## Code style and engineering rules

1. **TypeScript:** Enable strict type checking; avoid `any`. Use `unknown` with narrowing for untrusted data.
2. **Components:** Prefer small, reusable, single-purpose functional React components. Use Server Components by default in Next.js; add `"use client"` only for interactive UI.
3. **Separation of concerns:** Keep data access, validation, business logic, and UI separate. Organise domain-specific code under `features/`; keep genuinely shared utilities in `lib/`.
4. **Naming:** PascalCase for React component files/types; camelCase for variables/functions; kebab-case for route segments; descriptive names rather than abbreviations.
5. **Styling:** Prefer Tailwind utilities and central design tokens. Avoid arbitrary one-off colours, unnecessary inline styles, and duplicated class combinations.
6. **Forms:** Validate on both client and server using shared schemas where practical. Show accessible success, loading, and error states; prevent duplicate submissions.
7. **Security:** Never commit secrets or expose service-role keys to the browser. Enforce server-side authorization, least privilege, storage restrictions, and safe upload types/sizes. Avoid logging customer PII.
8. **Accessibility:** Target WCAG 2.2 AA where feasible. Support keyboard navigation, focus indicators, accessible form labels, reduced motion, and meaningful image alternatives.
9. **Performance:** Minimise client-side JavaScript, optimise images, use appropriate caching, and avoid unnecessary dependencies. Measure performance rather than inventing scores.
10. **SEO:** Use unique metadata, canonical URLs, clean slugs, valid structured data, and index only intended public pages. Exclude admin and private endpoints.
11. **Tests:** Add unit tests for nontrivial utilities/validation and integration tests for permissions, project publishing, enquiry submissions, and review moderation. Cover critical public journeys with end-to-end tests when feasible.
12. **Quality gates:** Run available lint, typecheck, tests, and production build before calling a task complete. Do not claim tests passed unless executed.
13. **Dependencies:** Prefer maintained, lightweight packages; justify new dependencies. Use the repository's established package manager and lockfile.
14. **Commits:** Make focused, descriptive Git commits at meaningful working checkpoints. Never commit credentials, personal customer data, or unlicensed imagery.
15. **Changes:** Before editing, inspect existing files and conventions. When explaining manual edits, state exact paths and sections. Provide complete, working code where requested; do not silently change unrelated behaviour.
16. **Documentation:** Update README, `.env.example`, deployment instructions, and the owner content guide when features or configuration change.
17. **Privacy:** Collect only needed customer information, require consent where appropriate, document retention/deletion processes, and check relevant Australian privacy and consumer obligations before launch.

## Implementation order

1. Inspect repository and confirm framework, hosting eligibility, provider limits, and deployment architecture.
2. Establish design tokens, typography, logo assets, navigation, responsive shell, and theme switch.
3. Build public Home, About, Services, Projects, FAQ, and Contact pages with clearly marked temporary content.
4. Implement database schema, secure admin sign-in, access policies, and image storage.
5. Build owner project CRUD, publish/unpublish, photo upload, featured projects, and content/settings editing.
6. Connect live project listings and project detail pages; add filters and before/after comparisons.
7. Implement secure quotation enquiry intake and admin review workflow; provide direct phone/email/Messenger fallback.
8. Implement review submission, moderation, and public approved testimonials; no customer accounts required.
9. Add metadata, structured data, sitemap, privacy disclosures, accessibility refinements, and performance optimisation.
10. Test permissions, responsive layouts, form workflows, uploads, and production build; deploy on an eligible free plan.
11. Document owner handover, backup/export procedure, provider limits, and a low-effort update workflow.

## Open decisions and acceptance criteria

**Confirm before implementation:** final service inventory; logo source/usage rights; approved photos and consent; service-area wording; preferred Messenger URL; review authenticity/moderation policy; quotation form fields; hosting and backend providers; data retention; whether customer photo attachments are needed; business owner's admin access method; and the preferred public subdomain.

**Acceptance criteria:** A visitor can browse verified services and published projects on mobile, switch themes, view approved reviews, and contact the business. A visitor can submit an enquiry and review without creating an account. The owner can securely log in, manage projects/photos and relevant business information, inspect enquiries, and approve/reject reviews without editing source code. No unpublished project, unapproved review, private enquiry, or privileged credential is publicly accessible. The site deploys within a verified permitted free-tier configuration, and the README explains limits and recovery options.

## Instructions for Codex

Treat this document as the project's guiding specification. Do not interpret proposed vendors, routes, or data models as existing implementation. Before making architectural changes, inspect the repository and briefly identify conflicts with this plan. Implement incrementally, preserve working code, prefer maintainability over premature complexity, and ask only when an unresolved decision materially affects security, cost, user experience, or architecture. Do not purchase services, register domains, or deploy production changes without explicit authorisation.
