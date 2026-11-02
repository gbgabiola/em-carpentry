import { connection } from "next/server";
import { retention } from "@/config/retention";
import { getBusiness } from "@/features/business/data";
import { isIntakeAvailable } from "@/features/intake/server";
import { createPageMetadata } from "@/lib/seo/metadata";
import { PageIntro } from "@/components/sections/PageIntro";
export const metadata = createPageMetadata(
  "/privacy",
  "Privacy notice",
  "How EM Carpentry & Home Maintenance handles website enquiries, feedback, security and direct contact information.",
);
export default async function PrivacyPage() {
  await connection();
  const business = await getBusiness();
  const intakeAvailable = isIntakeAvailable();
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Privacy"
        title="Your information."
        description="How information is used for project enquiries, customer feedback and running this website."
      />
      <div className="prose-block">
        <h2>Using this website</h2>
        <p>
          {intakeAvailable
            ? "Online enquiry and review submissions are enabled."
            : "Online enquiry and review submissions are currently switched off."}{" "}
          There are no customer accounts, advertising or analytics scripts. Your
          light or dark theme choice is stored in your browser as em-theme.
          Clear your browser’s site storage to remove it.
        </p>
        <h2>Enquiries and feedback</h2>
        <p>
          When enabled, the enquiry form collects your name, email address or
          phone number, a description of the work and an optional suburb. This
          is used to discuss your project and respond to your enquiry. Enquiries
          are private. No attachments are collected. Avoid sensitive information
          and full street addresses.
        </p>
        <p>
          The feedback form collects a display name, rating, written feedback
          and permission to publish. Only approved feedback with that permission
          is displayed. Your display name, rating and feedback become public if
          approved. You can withdraw permission by contacting the business.
          Feedback is not automatically published. Genuine Facebook testimonials
          are selected manually with permission and attribution; this website
          does not automatically import Facebook reviews or embed its tracking
          widgets.
        </p>
        <p>
          Providing form information is voluntary. Without contact details the
          business cannot respond to an enquiry. If you do not want to use a
          form or provide publication permission, you can contact the business
          directly instead. The owner checks submissions personally; automated
          email notifications are not configured.
        </p>
        <h2>Hosting, owner access and security</h2>
        <p>
          Netlify hosts the website and processes form requests. Supabase stores
          website content, enquiries, reviews and the owner’s account in the
          Sydney project. Provider support, network delivery and other
          processing can involve countries outside Australia. See{" "}
          <a className="text-link" href="https://www.netlify.com/privacy/">
            Netlify’s privacy information
          </a>{" "}
          and{" "}
          <a
            className="text-link"
            href="https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq"
          >
            Supabase’s data residency information
          </a>
          .
        </p>
        <p>
          The owner and authorised developer can access private website records
          to operate the site, handle requests and maintain backups. Owner
          sign-in uses Supabase with server-only session cookies; this is
          separate from customer accounts, which are not offered.
        </p>
        <p>
          To prevent abuse and duplicate submissions, requests use a signed form
          check and a keyed identifier derived from the network address. The
          application stores the identifier, a submission identifier and a
          one-way content fingerprint for up to 24 hours before the next
          successful hourly cleanup. It does not store the raw network address
          in its enquiry, review or security tables. Hosting providers may
          process network addresses and operational logs under their own
          policies. No third-party CAPTCHA service is used.
        </p>
        <h2>Retention of website copies</h2>
        <p>
          Closed enquiries are kept for {retention.closedEnquiryDays} days after
          closure. Reopening an enquiry before its deadline clears that
          deadline; closing it again starts a new period. Pending or rejected
          reviews are kept for {retention.unpublishedReviewDays} days from
          submission or removal from publication. Switching between pending and
          rejected does not restart that period. Published reviews are kept
          while displayed with valid consent.
        </p>
        <p>
          Cleanup runs hourly while the backend is active, removing expired
          records on its next successful run. A provider pause or outage can
          delay deletion. Downloaded website backup copies are rotated manually
          after {retention.backupDays} days. Contracts, invoices and other
          required business records follow separate retention rules.
        </p>
        <h2>Direct contact and information requests</h2>
        <p>
          Telephone, email and Facebook links open external services. Those
          providers handle information under their own policies. The business
          receives the contact details and project information you choose to
          send. Please share only what is needed to discuss your project.
        </p>
        <p>
          For questions or concerns about your information, access or correction
          requests, deletion requests or withdrawal of publication permission,{" "}
          <a
            className="text-link"
            href={
              business.unavailable ? "/contact" : business.contact.emailHref
            }
          >
            {business.unavailable
              ? "view contact options"
              : `email ${business.contact.email}`}
          </a>
          . The business will review your request and explain any separate
          recordkeeping requirements that affect it.
        </p>
      </div>
    </div>
  );
}
