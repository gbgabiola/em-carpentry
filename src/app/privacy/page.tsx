import { createPageMetadata } from "@/lib/seo/metadata";
import { PageIntro } from "@/components/sections/PageIntro";
import { siteConfig } from "@/config/site";
export const metadata = createPageMetadata(
  "/privacy",
  "Privacy notice",
  "Privacy information for the current EM Carpentry & Home Maintenance website preview and direct contact options.",
);
export default function PrivacyPage() {
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
        <h2>Contacting the business</h2>
        <p>
          Telephone, email and Facebook links open external services. Those
          providers handle information under their own policies. Please share
          only what is needed to discuss your project.
        </p>
        <p>
          The business may receive the contact details and project information
          you choose to send directly. For questions about that information, or
          to request access, correction or deletion, email{" "}
          <a className="text-link" href={siteConfig.contact.emailHref}>
            {siteConfig.contact.email}
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
