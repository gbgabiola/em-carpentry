import { createPageMetadata } from "@/lib/seo/metadata";
import { PageIntro } from "@/components/sections/PageIntro";
import { ContactCta } from "@/components/sections/ContactCta";
export const metadata = createPageMetadata(
  "/about",
  "About",
  "Meet EM Carpentry & Home Maintenance, operating in Australia since 2018 and serving Geelong and nearby areas.",
);
export default function AboutPage() {
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="About the business"
        title="Attention to detail, from the start."
        description="EM Carpentry & Home Maintenance has operated in Australia since 2018, serving Geelong, Victoria, and nearby areas."
      />
      <section className="editorial-section">
        <h2>Workmanship with care.</h2>
        <div className="prose-block">
          <p>
            Neat workmanship, attention to detail and a willingness to go the
            extra mile guide the business.
          </p>
          <p>
            We welcome enquiries from homeowners, landlords, businesses,
            contractors and other prospective clients. Contact us to discuss the
            work you need and whether we can help.
          </p>
        </div>
      </section>
      <ContactCta />
    </div>
  );
}
