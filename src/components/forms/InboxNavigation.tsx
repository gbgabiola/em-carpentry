import Link from "next/link";
import { inboxPageHref, inboxPageSize, inboxMaxPage } from "@/lib/utils/inbox";
type InboxPath = "/admin/enquiries" | "/admin/reviews";
export function InboxFilters({
  path,
  status,
  statuses,
}: {
  path: InboxPath;
  status: string;
  statuses: readonly { value: string; label: string }[];
}) {
  return (
    <form action={path} className="owner-form">
      <label htmlFor="inbox-status-filter">Filter by status</label>
      <select id="inbox-status-filter" name="status" defaultValue={status}>
        <option value="">All statuses</option>
        {statuses.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button type="submit" className="button button-primary">
        Apply filter
      </button>
    </form>
  );
}
export function InboxPagination({
  path,
  status,
  page,
  hasNext,
}: {
  path: InboxPath;
  status: string;
  page: number;
  hasNext: boolean;
}) {
  return (
    <nav aria-label="Inbox pages">
      <p className="text-sm text-muted">
        Page {page} · Up to {inboxPageSize} records per page · Newest first
      </p>
      <div className="button-row">
        {page > 1 && (
          <>
            <Link className="text-link" href={inboxPageHref(path, status, 1)}>
              First page
            </Link>
            <Link
              className="text-link"
              href={inboxPageHref(path, status, page - 1)}
            >
              Previous page
            </Link>
          </>
        )}
        {hasNext && page < inboxMaxPage && (
          <Link
            className="text-link"
            href={inboxPageHref(path, status, page + 1)}
          >
            Next page
          </Link>
        )}
      </div>
    </nav>
  );
}
