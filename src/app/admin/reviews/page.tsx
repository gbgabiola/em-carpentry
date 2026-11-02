import { facebookUrl } from "@/lib/validation/schemas";
import {
  InboxFilters,
  InboxPagination,
} from "@/components/forms/InboxNavigation";
import { SubmissionDate } from "@/components/ui/SubmissionDate";
import {
  parseInboxFilters,
  sliceInboxPage,
  type InboxSearchParams,
} from "@/lib/utils/inbox";
import { RetentionDeadline } from "@/components/ui/RetentionDeadline";
import { retention } from "@/config/retention";
import { requireAdmin } from "@/lib/auth/admin";
import { ActionForm } from "@/components/forms/ActionForm";
import { saveTestimonial, moderateReview } from "@/features/reviews/actions";
import { deletePrivateRecord } from "@/features/enquiries/actions";
export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<InboxSearchParams>;
}) {
  const client = await requireAdmin();
  const filters = parseInboxFilters(await searchParams, [
    "pending",
    "approved",
    "rejected",
  ] as const);
  let query = client
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status);
  const reviews = await query.range(filters.from, filters.to);
  if (reviews.error) throw new Error("Reviews unavailable");
  const { records, hasNext } = sliceInboxPage(reviews.data);
  return (
    <div className="page-stack">
      <h1>Reviews &amp; testimonials</h1>
      <section>
        <h2>Add a Facebook testimonial</h2>
        <p>
          Copy only feedback you have permission to republish, retaining its
          wording and attribution. Facebook recommendations are not converted
          into star ratings.
        </p>
        <ActionForm action={saveTestimonial} label="Save testimonial">
          <label>
            Reviewer display name
            <input name="display_name" required maxLength={100} />
          </label>
          <label>
            Feedback
            <textarea name="body" required maxLength={3000} rows={5} />
          </label>
          <label>
            Facebook source link
            <input
              name="source_url"
              type="url"
              required
              placeholder="https://www.facebook.com/…"
            />
          </label>
          <label className="checkbox-label">
            <input name="consent" type="checkbox" required />I have permission
            to republish this feedback and name.
          </label>
          <label>
            Status
            <select name="status">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </label>
        </ActionForm>
      </section>
      <section>
        <h2>All reviews</h2>
        <p>
          Pending/rejected reviews share a {retention.unpublishedReviewDays}-day
          deadline. Changing between these states does not restart it. Approved
          reviews are retained while displayed with valid consent. Withdraw
          consent below to hide a review immediately and prevent reapproval.
        </p>
        <InboxFilters
          path="/admin/reviews"
          status={filters.status}
          statuses={[
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ]}
        />
        {!records.length && (
          <p>
            No reviews on this page. Change the status filter or return to the
            first page.
          </p>
        )}
        <div className="record-list">
          {records.map((review) => (
            <article key={review.id} className="empty-panel">
              <h3>
                {review.display_name} · {review.status}
              </h3>
              <SubmissionDate createdAt={review.created_at} />
              <p>
                {review.rating === null
                  ? "No star rating supplied"
                  : `Rating: ${review.rating} out of 5`}
              </p>
              <p className="preserve-lines">{review.body}</p>
              {review.source === "facebook" &&
                facebookUrl.safeParse(review.source_url).success && (
                  <p>
                    <a
                      className="text-link"
                      href={review.source_url ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View original Facebook feedback (opens in a new tab)
                    </a>
                  </p>
                )}
              <p>
                {review.source} · Publication consent:{" "}
                {review.consent ? "recorded" : "not recorded"}
              </p>
              <RetentionDeadline expiresAt={review.retention_expires_at} />
              <ActionForm action={moderateReview} label="Update moderation">
                <input type="hidden" name="id" value={review.id} />
                <label>
                  Status
                  <select name="status" defaultValue={review.status}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdraw-consent">
                      Withdraw publication consent
                    </option>
                  </select>
                </label>
              </ActionForm>
              <details>
                <summary>Permanently delete this review</summary>
                <ActionForm
                  action={deletePrivateRecord}
                  label="Delete permanently"
                >
                  <input type="hidden" name="table" value="reviews" />
                  <input type="hidden" name="id" value={review.id} />
                  <label>
                    Type DELETE to confirm
                    <input name="confirmation" required pattern="DELETE" />
                  </label>
                </ActionForm>
              </details>
            </article>
          ))}
        </div>
        <InboxPagination
          path="/admin/reviews"
          status={filters.status}
          page={filters.page}
          hasNext={hasNext}
        />
      </section>
    </div>
  );
}
