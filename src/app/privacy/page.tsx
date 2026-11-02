import { retention } from "@/config/retention";
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
        <h2>Retention of website copies</h2>
        <p>
          The agreed policy keeps closed website enquiries for{" "}
          {retention.closedEnquiryDays} days after closure and pending or
          rejected reviews for {retention.unpublishedReviewDays} days from
          submission or removal from publication. Switching between pending and
          rejected does not restart that period. Published reviews are kept
          while displayed with valid publication consent. Permission can be
          withdrawn by contacting the business.
        </p>
        <p>
          Website backup copies are to be rotated after {retention.backupDays}{" "}
          days. These periods apply to website copies. Contracts, invoices and
          other required business records follow separate retention rules.
        </p>
        <h2>Before online submissions are introduced</h2>
        <p>
          Public enquiry and review submissions remain disabled while deletion
          controls are checked and secure intake is prepared. Database cleanup
          runs hourly while the backend is active, removing expired records on
          its next successful run. A provider pause or outage can delay
          deletion. Downloaded backup rotation is handled separately. Before
          forms are enabled, this notice will explain the information collected,
          consent and moderation, hosting providers and relevant overseas
          processing.
        </p>
      </div>
    </div>
  );
}
