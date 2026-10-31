import Link from "next/link";
import { siteConfig } from "@/config/site";

export function ContactCta() {
  return (
    <section className="contact-band" aria-labelledby="enquiry-heading">
      <div>
        <p className="eyebrow">Let’s talk</p>
        <h2 id="enquiry-heading">Tell us what you have in mind.</h2>
        <p>Get in touch to discuss your project in Geelong or nearby areas.</p>
      </div>
      <div className="button-row">
        <Link className="button button-primary" href="/contact">
          Request a quote <span aria-hidden="true">↗</span>
        </Link>
        <a className="text-link" href={siteConfig.contact.phoneHref}>
          Call {siteConfig.contact.phone}
        </a>
      </div>
    </section>
  );
}
