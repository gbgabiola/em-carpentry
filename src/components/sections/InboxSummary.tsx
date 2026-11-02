import Link from "next/link";

export function InboxSummary({
  newEnquiries,
  pendingReviews,
}: {
  newEnquiries: number | null;
  pendingReviews: number | null;
}) {
  return (
    <div className="project-grid">
      <section className="empty-panel" aria-labelledby="new-enquiries-heading">
        <h2 id="new-enquiries-heading">New enquiries</h2>
        <p>
          {newEnquiries === null
            ? "Count unavailable. Open the inbox to check."
            : `${newEnquiries} waiting for review`}
        </p>
        <Link className="text-link" href="/admin/enquiries?status=new">
          Review new enquiries
        </Link>
      </section>
      <section
        className="empty-panel"
        aria-labelledby="pending-reviews-heading"
      >
        <h2 id="pending-reviews-heading">Pending reviews</h2>
        <p>
          {pendingReviews === null
            ? "Count unavailable. Open the inbox to check."
            : `${pendingReviews} waiting for moderation`}
        </p>
        <Link className="text-link" href="/admin/reviews?status=pending">
          Moderate pending reviews
        </Link>
      </section>
    </div>
  );
}
