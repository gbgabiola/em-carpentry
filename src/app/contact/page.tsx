import { PublicSubmissionForm } from "@/components/forms/PublicSubmissionForm";
import { isIntakeAvailable } from "@/features/intake/server";
import { getBusiness } from "@/features/business/data";
import { createPageMetadata } from "@/lib/seo/metadata";
import Link from "next/link";
import { PageIntro } from "@/components/sections/PageIntro";
export async function generateMetadata() {
  const business = await getBusiness();
  return createPageMetadata(
    "/contact",
    "Contact",
    business.unavailable
      ? "Contact EM Carpentry & Home Maintenance to discuss your project in Geelong and nearby areas."
      : `Request a quote or discuss your project with EM Carpentry & Home Maintenance. Call ${business.contact.phone} or email the business.`,
  );
}
export default async function ContactPage() {
  const business = await getBusiness();
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Contact & quotations"
        title="Let’s talk about your project."
        description="Tell us what you have in mind. The business owner will respond personally to your enquiry."
      />
      {business.unavailable && (
        <p role="status" className="form-message">
          We couldn’t load updated contact information. The details below are
          the previously verified site defaults. Check the business Facebook
          page for current details before sharing personal information.
        </p>
      )}
      <div className="contact-grid">
        <section
          className="contact-options"
          aria-labelledby="contact-options-heading"
        >
          <h2 id="contact-options-heading">Get in touch</h2>
          <a href={business.contact.phoneHref}>
            <span>Call</span>
            {business.contact.phone}
          </a>
          <a href={business.contact.emailHref}>
            <span>Email</span>
            {business.contact.email}
          </a>
          <a href={business.contact.facebookHref}>
            <span>Facebook</span>Visit the business page{" "}
            <span aria-hidden="true">↗</span>
          </a>
        </section>
        <section className="contact-guidance">
          <p className="eyebrow">Geelong, Victoria</p>
          <h2>Local work. A personal conversation.</h2>
          <p>
            {business.service_area}. Ask about your location when you get in
            touch.
          </p>
          <h3>To help us understand your enquiry</h3>
          <p>
            Share a brief description of the work, your general suburb and your
            preferred way to be contacted. Avoid sending sensitive information
            or a full street address in your initial message.
          </p>
          <p className="text-sm text-muted">
            You can also use the enquiry form below when available. No automated
            email notifications are configured; please call or email if you need
            to follow up.
          </p>
          <Link href="/privacy" className="text-link">
            Read the privacy notice
          </Link>
        </section>
      </div>
      <section aria-labelledby="enquiry-form-heading">
        <h2 id="enquiry-form-heading">Request a quote</h2>
        <PublicSubmissionForm kind="enquiry" available={isIntakeAvailable()} />
      </section>
    </div>
  );
}
