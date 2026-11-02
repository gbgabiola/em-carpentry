export const inboxPageSize = 20;
export const inboxMaxPage = 10000;
export type InboxSearchParams = {
  status?: string | string[];
  page?: string | string[];
};
export function parseInboxFilters<S extends string>(
  params: InboxSearchParams,
  allowedStatuses: readonly S[],
): { status: S | ""; page: number; from: number; to: number } {
  const status =
    typeof params.status === "string" &&
    allowedStatuses.includes(params.status as S)
      ? (params.status as S)
      : "";
  const rawPage = params.page;
  const page =
    typeof rawPage === "string" && /^[1-9]\d{0,4}$/.test(rawPage)
      ? Math.min(Number(rawPage), inboxMaxPage)
      : 1;
  const from = (page - 1) * inboxPageSize;
  // One extra row identifies whether another page exists, without a full count.
  return { status, page, from, to: from + inboxPageSize };
}
export function inboxPageHref(
  path: "/admin/enquiries" | "/admin/reviews",
  status: string,
  page: number,
) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  return `${path}?${params}`;
}
export function sliceInboxPage<T>(rows: T[]) {
  return {
    records: rows.slice(0, inboxPageSize),
    hasNext: rows.length > inboxPageSize,
  };
}
