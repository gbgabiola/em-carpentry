# 0005: Independent owner content and opt-in photo comparison

Status: implemented locally, 1 November 2026. No hosted schema or account was changed.

Extend the approved Supabase implementation with a second, additive migration. The owner can draft, edit, order, confirm, publish and archive offered services and FAQs at /admin/content. No service inventory is invented or seeded. Four verified FAQ starters are copied from the earlier public page as private drafts; the owner must confirm accuracy before publication. Database constraints and RLS enforce publication confirmation and owner-only mutation. Public reads are limited to confirmed published rows.

Business settings now include Australian telephone, email and the business Facebook URL. Bounded shared validation, database format constraints and derived tel/mailto links protect the public link surfaces. Header, footer, CTA, Contact, Reviews, Privacy, business JSON-LD and Contact metadata use the shared settings. The business name/logo stay in the verified brand configuration. Validated source defaults support unconfigured previews. A configured backend outage is explicitly labelled on Contact; direct call shortcuts route there, and structured data omits unavailable contact details. Configured FAQ failures display no answers rather than resurrecting archived default copy.

The project comparison flag defaults off. Enabling it through the owner action requires exactly one Before and one After photo, with owner confirmation of matching viewpoint/framing. Public rendering rechecks the pair and omits missing/ambiguous pairs. Native range input, associated labels/instructions and full gallery images provide keyboard controls and a non-comparison alternative. The component adds no new dependencies. Existing private photo RLS/no-store delivery remains unchanged.

Owner JSON exports advance to schema version 2 and include services, FAQs, extended settings and the comparison flag. Public intake remains disabled and no retention period has been invented. A connected Supabase project is still needed for real Auth/Storage verification; an available integration has been suggested, but no installation or connection is assumed.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [React useId](https://react.dev/reference/react/useId).
