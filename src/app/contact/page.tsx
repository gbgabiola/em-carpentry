import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/sections/PageIntro";
import { siteConfig } from "@/config/site";
export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a quote or discuss your project with EM Carpentry & Home Maintenance in Geelong. Call +61 497 175 163 or email the business.",
};
export default function ContactPage() {
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Contact & quotations"
        title="Let’s talk about your project."
        description="Tell us what you have in mind. The business owner will respond personally to your enquiry."
      />
      <div className="contact-grid">
        <section
          className="contact-options"
          aria-labelledby="contact-options-heading"
        >
          <h2 id="contact-options-heading">Get in touch</h2>
          <a href={siteConfig.contact.phoneHref}>
            <span>Call</span>
            {siteConfig.contact.phone}
          </a>
          <a href={siteConfig.contact.emailHref}>
            <span>Email</span>
            {siteConfig.contact.email}
          </a>
          <a href={siteConfig.contact.facebookHref}>
            <span>Facebook</span>Visit the business page{" "}
            <span aria-hidden="true">↗</span>
          </a>
        </section>
        <section className="contact-guidance">
          <p className="eyebrow">Geelong, Victoria</p>
          <h2>Local work. A personal conversation.</h2>
          <p>
            Serving Geelong and nearby areas. Ask about your location when you
            get in touch.
          </p>
          <h3>To help us understand your enquiry</h3>
          <p>
            Share a brief description of the work, your general suburb and your
            preferred way to be contacted. Avoid sending sensitive information
            or a full street address in your initial message.
          </p>
          <p className="text-sm text-muted">
            The online quotation form is not available yet. Use the contact
            options on this page to send your enquiry directly.
          </p>
          <Link href="/privacy" className="text-link">
            Read the privacy notice
          </Link>
        </section>
      </div>
    </div>
  );
}
