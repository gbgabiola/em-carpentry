import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type CountResult = { count: number | null; error: unknown };
function readCount(result: PromiseSettledResult<CountResult>): number | null {
  if (result.status !== "fulfilled" || result.value.error) return null;
  const count = result.value.count;
  return typeof count === "number" && Number.isSafeInteger(count) && count >= 0
    ? count
    : null;
}
// The caller must first obtain the owner-authorised session client.
export async function loadInboxSummary(client: SupabaseClient<Database>) {
  const results = await Promise.allSettled([
    client
      .from("enquiries")
      .select("id", { head: true, count: "exact" })
      .eq("status", "new")
      .abortSignal(AbortSignal.timeout(8000)),
    client
      .from("reviews")
      .select("id", { head: true, count: "exact" })
      .eq("status", "pending")
      .abortSignal(AbortSignal.timeout(8000)),
  ]);
  return {
    newEnquiries: readCount(results[0]),
    pendingReviews: readCount(results[1]),
  };
}
