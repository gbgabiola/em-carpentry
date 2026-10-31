import { createPageMetadata } from "@/lib/seo/metadata";
import { PageIntro } from "@/components/sections/PageIntro";
import { siteConfig } from "@/config/site";
export const metadata = createPageMetadata(
  "/reviews",
  "Reviews",
  "Customer feedback for EM Carpentry & Home Maintenance. Approved reviews will be published here.",
);
export default function ReviewsPage() {
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Customer feedback"
        title="Your experience matters."
        description="This page will share customer feedback that has been approved for publication."
      />
      <section className="empty-panel">
        <h2>No reviews published yet.</h2>
        <p>
          There are no published ratings or testimonials on this website at
          present.
        </p>
      </section>
      <section className="prose-block">
        <h2>Have feedback to share?</h2>
        <p>
          The online feedback form is not available yet. You can{" "}
          <a className="text-link" href={siteConfig.contact.emailHref}>
            email the business
          </a>{" "}
          directly. Feedback sent by email will not automatically be published
          here.
        </p>
      </section>
    </div>
  );
}
