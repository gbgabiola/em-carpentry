import { getBusiness } from "@/features/business/data";
import { createPageMetadata } from "@/lib/seo/metadata";
import { PageIntro } from "@/components/sections/PageIntro";
import { ContactCta } from "@/components/sections/ContactCta";
export const metadata = createPageMetadata(
  "/about",
  "About",
  "Meet EM Carpentry & Home Maintenance, operating in Australia since 2018 and serving Geelong and nearby areas.",
);
export default async function AboutPage() {
  const business = await getBusiness();
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
          <p className="preserve-lines">{business.about_text}</p>
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
