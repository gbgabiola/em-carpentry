import type { Metadata } from "next";
import { PageIntro } from "@/components/sections/PageIntro";
import { ContactCta } from "@/components/sections/ContactCta";
export const metadata: Metadata = {
  title: "Projects",
  description:
    "The EM Carpentry & Home Maintenance portfolio. Approved completed-project photographs and descriptions are coming soon.",
};
export default function ProjectsPage() {
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="The portfolio"
        title="See the details."
        description="A place for completed work, the spaces behind it and the details that make a difference."
      />
      <section className="empty-panel">
        <span className="placeholder-label">No projects published yet</span>
        <h2>Our portfolio is taking shape.</h2>
        <p>
          Authentic project photographs and descriptions will appear here after
          approval. In the meantime, ask the business about examples relevant to
          your enquiry.
        </p>
      </section>
      <ContactCta />
    </div>
  );
}
