import { requireAdmin } from "@/lib/auth/admin";
import { ActionForm } from "@/components/forms/ActionForm";
import { saveTestimonial, moderateReview } from "@/features/reviews/actions";
import { deletePrivateRecord } from "@/features/enquiries/actions";
export default async function AdminReviewsPage() {
  const client = await requireAdmin();
  const reviews = await client
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (reviews.error) throw new Error("Reviews unavailable");
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
        <div className="record-list">
          {reviews.data.map((review) => (
            <article key={review.id} className="empty-panel">
              <h3>
                {review.display_name} · {review.status}
              </h3>
              <p className="preserve-lines">{review.body}</p>
              <p>
                {review.source} · Publication consent:{" "}
                {review.consent ? "recorded" : "not recorded"}
              </p>
              <ActionForm action={moderateReview} label="Update moderation">
                <input type="hidden" name="id" value={review.id} />
                <label>
                  Status
                  <select name="status" defaultValue={review.status}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
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
      </section>
    </div>
  );
}
