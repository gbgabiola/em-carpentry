import { getBusiness } from "@/features/business/data";
import Link from "next/link";

export async function ContactCta() {
  const business = await getBusiness();
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
        {business.unavailable ? (
          <Link className="text-link" href="/contact">
            View contact options
          </Link>
        ) : (
          <a className="text-link" href={business.contact.phoneHref}>
            Call {business.contact.phone}
          </a>
        )}
      </div>
    </section>
  );
}
