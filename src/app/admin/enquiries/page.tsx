import { requireAdmin } from "@/lib/auth/admin";
import { ActionForm } from "@/components/forms/ActionForm";
import {
  updateEnquiry,
  deletePrivateRecord,
} from "@/features/enquiries/actions";
export default async function AdminEnquiriesPage() {
  const client = await requireAdmin();
  const enquiries = await client
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (enquiries.error) throw new Error("Enquiries unavailable");
  return (
    <div className="page-stack">
      <h1>Private enquiries</h1>
      <p>
        Website submissions are disabled until retention is agreed. No email
        notifications are configured. Check this inbox personally when intake is
        eventually enabled.
      </p>
      {!enquiries.data.length && <p>No enquiries.</p>}
      {enquiries.data.map((enquiry) => (
        <article className="empty-panel" key={enquiry.id}>
          <h2>{enquiry.name}</h2>
          <p>
            {enquiry.contact_method}: {enquiry.contact_details}
          </p>
          <p>Suburb: {enquiry.suburb || "Not supplied"}</p>
          <p className="preserve-lines">{enquiry.description}</p>
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
    </div>
  );
}
