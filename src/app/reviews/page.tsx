import { getBusiness } from "@/features/business/data";
import { createPageMetadata } from "@/lib/seo/metadata";
import { PageIntro } from "@/components/sections/PageIntro";
import { getReviews } from "@/features/reviews/data";
export const metadata = createPageMetadata(
  "/reviews",
  "Reviews",
  "Approved customer feedback and attributed Facebook testimonials for EM Carpentry & Home Maintenance.",
);
export default async function ReviewsPage() {
  const [data, business] = await Promise.all([getReviews(), getBusiness()]);
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Customer feedback"
        title="Your experience matters."
        description="Customer feedback and selected Facebook testimonials, published with permission."
      />
      <p>
        <a className="text-link" href={business.contact.facebookHref}>
          Visit our business Facebook page for existing recommendations ↗
        </a>
      </p>
      {data.reviews.length ? (
        <div className="project-grid">
          {data.reviews.map((review) => (
            <figure key={review.id} className="empty-panel">
              <blockquote className="preserve-lines">{review.body}</blockquote>
              <figcaption>
                <strong>{review.display_name}</strong>
                {review.rating !== null && (
                  <p>{review.rating} out of 5 · Website review</p>
                )}
                {review.source === "facebook" && review.source_url && (
                  <p>
                    <a className="text-link" href={review.source_url}>
                      Originally shared on Facebook ↗
                    </a>
                  </p>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <section className="empty-panel">
          <h2>
            {data.unavailable
              ? "Reviews are temporarily unavailable."
              : "No reviews published yet."}
          </h2>
          <p>
            Only approved feedback with publication permission is displayed
            here.
          </p>
        </section>
      )}
      <section className="prose-block">
        <h2>Have feedback to share?</h2>
        <p>
          The online feedback form is disabled until the retention policy is
          agreed. You can{" "}
          <a
            className="text-link"
            href={
              business.unavailable ? "/contact" : business.contact.emailHref
            }
          >
            {business.unavailable
              ? "view contact options"
              : "email the business"}
          </a>{" "}
          to discuss your feedback. Feedback sent by email will not
          automatically be published.
        </p>
      </section>
    </div>
  );
}
