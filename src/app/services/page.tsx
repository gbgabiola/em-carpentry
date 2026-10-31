import type { Metadata } from "next";
import { PageIntro } from "@/components/sections/PageIntro";
import { ContactCta } from "@/components/sections/ContactCta";
export const metadata: Metadata = {
  title: "Services",
  description:
    "Discuss carpentry and home maintenance needs in Geelong and nearby areas with EM Carpentry & Home Maintenance.",
};
export default function ServicesPage() {
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Services"
        title="What does your space need?"
        description="Get in touch to discuss your carpentry or home maintenance project in Geelong and nearby areas."
      />
      <section className="empty-panel">
        <h2>Service information is being confirmed.</h2>
        <p>
          A detailed list of offered services will be added once approved by the
          business owner. Please contact us to check whether the work you need
          can be undertaken.
        </p>
      </section>
      <ContactCta />
    </div>
  );
}
