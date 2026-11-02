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
import {
  updateEnquiry,
  deletePrivateRecord,
} from "@/features/enquiries/actions";
export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<InboxSearchParams>;
}) {
  const client = await requireAdmin();
  const filters = parseInboxFilters(await searchParams, [
    "new",
    "reviewed",
    "closed",
  ] as const);
  let query = client
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status);
  const enquiries = await query.range(filters.from, filters.to);
  if (enquiries.error) throw new Error("Enquiries unavailable");
  const { records, hasNext } = sliceInboxPage(enquiries.data);
  return (
    <div className="page-stack">
      <h1>Private enquiries</h1>
      <p>
        New website enquiries appear here when intake is enabled. No email
        notifications are configured. Check this inbox regularly and update each
        enquiry as you follow up.
      </p>
      <p>
        Closed enquiries are deleted after {retention.closedEnquiryDays} days.
        Cleanup runs hourly while the database is active. Reopening before the
        deadline clears it; closing again starts a new period.
      </p>
      <InboxFilters
        path="/admin/enquiries"
        status={filters.status}
        statuses={[
          { value: "new", label: "New" },
          { value: "reviewed", label: "Reviewed" },
          { value: "closed", label: "Closed" },
        ]}
      />
      {!records.length && (
        <p>
          No enquiries on this page. Change the status filter or return to the
          first page.
        </p>
      )}
      {records.map((enquiry) => (
        <article className="empty-panel" key={enquiry.id}>
          <h2>{enquiry.name}</h2>
          <SubmissionDate createdAt={enquiry.created_at} />
          <p>
            {enquiry.contact_method}: {enquiry.contact_details}
          </p>
          <p>Suburb: {enquiry.suburb || "Not supplied"}</p>
          <p className="preserve-lines">{enquiry.description}</p>
          <RetentionDeadline expiresAt={enquiry.retention_expires_at} />
          <ActionForm action={updateEnquiry} label="Update status">
            <input type="hidden" name="id" value={enquiry.id} />
            <label>
              Status
              <select name="status" defaultValue={enquiry.status}>
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="closed">Closed</option>
              </select>
            </label>
          </ActionForm>
          <details>
            <summary>Permanently delete this enquiry</summary>
            <ActionForm action={deletePrivateRecord} label="Delete permanently">
              <input type="hidden" name="table" value="enquiries" />
              <input type="hidden" name="id" value={enquiry.id} />
              <label>
                Type DELETE to confirm
                <input name="confirmation" required pattern="DELETE" />
              </label>
            </ActionForm>
          </details>
        </article>
      ))}
      <InboxPagination
        path="/admin/enquiries"
        status={filters.status}
        page={filters.page}
        hasNext={hasNext}
      />
    </div>
  );
}
