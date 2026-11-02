// Accepted only by the loopback fixture server; never valid at hosted Auth.
import { syntheticSession } from "../src/test/browser/owner-session.ts";
const ownerSession = syntheticSession();
const outsiderSession = syntheticSession(false);
const enquiries = Array.from({ length: 25 }, (_, index) => ({
  id: `40000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  name: `Synthetic enquiry ${String(index + 1).padStart(2, "0")}`,
  contact_method: "email",
  contact_details: "synthetic-visitor@example.test",
  description: "Synthetic private enquiry for isolated owner browser checks.",
  suburb: "",
  status: index < 21 ? "new" : index < 23 ? "reviewed" : "closed",
  created_at: "2026-01-01T00:00:00Z",
  closed_at: index >= 23 ? "2099-01-01T00:00:00Z" : null,
  retention_expires_at: index >= 23 ? "2099-04-01T00:00:00Z" : null,
}));
const reviews = Array.from({ length: 25 }, (_, index) => ({
  id: `50000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  display_name: `Synthetic reviewer ${String(index + 1).padStart(2, "0")}`,
  body: "Synthetic feedback, not a real customer testimonial.",
  rating: index % 2 ? 4 : null,
  source: index % 2 ? "website" : "facebook",
  source_url:
    index % 2
      ? null
      : "https://www.facebook.com/EMscarpentryworks/posts/synthetic-fixture",
  consent: true,
  status: index < 21 ? "pending" : index < 23 ? "approved" : "rejected",
  created_at: "2026-01-01T00:00:00Z",
  retention_started_at:
    index >= 21 && index < 23 ? null : "2099-01-01T00:00:00Z",
  retention_expires_at:
    index >= 21 && index < 23 ? null : "2099-01-31T00:00:00Z",
}));
function respond(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(value));
}
export function serveOwnerFixture(request, response, url) {
  const token = request.headers.authorization?.replace(/^Bearer /, "");
  const session =
    token === ownerSession.access_token
      ? ownerSession
      : token === outsiderSession.access_token
        ? outsiderSession
        : null;
  if (url.pathname === "/auth/v1/user" && request.method === "GET") {
    respond(
      response,
      session ? 200 : 401,
      session?.user ?? { message: "Synthetic unauthenticated request" },
    );
    return true;
  }
  if (url.pathname === "/rest/v1/rpc/is_admin" && request.method === "POST") {
    respond(response, session ? 200 : 401, session === ownerSession);
    return true;
  }
  if (
    !["/rest/v1/enquiries", "/rest/v1/reviews"].includes(url.pathname) ||
    request.method !== "GET"
  )
    return false;
  if (!session) {
    if (url.pathname.endsWith("/reviews")) return false;
    respond(response, 401, { message: "Synthetic owner membership required" });
    return true;
  }
  if (session !== ownerSession) {
    respond(response, 403, { message: "Synthetic owner membership required" });
    return true;
  }
  let rows = url.pathname.endsWith("/enquiries") ? enquiries : reviews;
  const status = url.searchParams.get("status");
  if (status) rows = rows.filter((row) => `eq.${row.status}` === status);
  rows = [...rows].sort((a, b) => b.id.localeCompare(a.id));
  const offset = Number(url.searchParams.get("offset") || 0);
  const limit = Number(url.searchParams.get("limit") || rows.length);
  respond(response, 200, rows.slice(offset, offset + limit));
  return true;
}
