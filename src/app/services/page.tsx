import { createPageMetadata } from "@/lib/seo/metadata";
import { PageIntro } from "@/components/sections/PageIntro";
import { ContactCta } from "@/components/sections/ContactCta";
import { getServices } from "@/features/content/data";
export const metadata = createPageMetadata(
  "/services",
  "Services",
  "Discuss carpentry and home maintenance needs in Geelong and nearby areas with EM Carpentry & Home Maintenance.",
);
export default async function ServicesPage() {
  const data = await getServices();
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Services"
        title="What does your space need?"
        description="Get in touch to discuss your carpentry or home maintenance project in Geelong and nearby areas."
      />
      {data.services.length ? (
        <div className="service-list">
          {data.services.map((service) => (
            <section
              id={service.slug}
              key={service.id}
              className="editorial-section"
            >
              <h2>{service.name}</h2>
              <p className="preserve-lines">{service.description}</p>
            </section>
          ))}
        </div>
      ) : (
        <section className="empty-panel">
          <h2>
            {data.unavailable
              ? "Service information is temporarily unavailable."
              : "Service information is being confirmed."}
          </h2>
          <p>
            Contact the business to check whether the work you need can be
            undertaken. Only services confirmed by the owner are published here.
          </p>
        </section>
      )}
      <ContactCta />
    </div>
  );
}
