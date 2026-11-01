import { getBusiness } from "@/features/business/data";
import { createPageMetadata } from "@/lib/seo/metadata";
import { PageIntro } from "@/components/sections/PageIntro";
export const metadata = createPageMetadata(
  "/privacy",
  "Privacy notice",
  "Privacy information for the current EM Carpentry & Home Maintenance website preview and direct contact options.",
);
export default async function PrivacyPage() {
  const business = await getBusiness();
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Privacy"
        title="Your information."
        description="This notice describes the current website preview. It will be reviewed before launch and before online forms are enabled."
      />
      <div className="prose-block">
        <h2>Using this website</h2>
        <p>
          This preview has no quotation forms, review submissions or customer
          accounts. It does not include advertising or analytics scripts. Your
          light or dark theme preference is stored in your browser as em-theme.
          Clear your browser’s site storage to remove it.
        </p>
        <h2>Owner sign-in and published content</h2>
        <p>
          Owner-only sign-in uses Supabase authentication when configured.
          Session cookies are restricted to server access; they are separate
          from customer accounts, which this website does not offer. Supabase
          stores the owner’s account, portfolio photos, business content and
          approved testimonials. Sydney is the intended project region, but
          provider support and related processing may involve other countries.
        </p>
        <p>
          Selected Facebook testimonials are published manually with permission
          and source attribution. Visiting a Facebook link opens Facebook; this
          website does not embed its tracking widgets or automatically import
          reviews.
        </p>
        <h2>Contacting the business</h2>
        <p>
          Telephone, email and Facebook links open external services. Those
          providers handle information under their own policies. Please share
          only what is needed to discuss your project.
        </p>
        <p>
          The business may receive the contact details and project information
          you choose to send directly. For questions about that information, or
          to request access, correction or deletion, contact us:{" "}
          <a
            className="text-link"
            href={
              business.unavailable ? "/contact" : business.contact.emailHref
            }
          >
            {business.unavailable
              ? "view contact options"
              : business.contact.email}
          </a>
          .
        </p>
        <h2>Before online submissions are introduced</h2>
        <p>
          The notice must be updated to explain the selected hosting and data
          providers, relevant overseas processing, retention periods, and how
          enquiries and publication consent are managed. No retention period has
          been agreed for future website submissions yet.
        </p>
      </div>
    </div>
  );
}
