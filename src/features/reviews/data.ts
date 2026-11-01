import "server-only";
import { createPublicClient } from "@/lib/db/server";
import type { Review } from "@/types/database";
export async function getReviews() {
  const client = createPublicClient();
  if (!client) return { reviews: [] as Review[], unavailable: false };
  const result = await client
    .from("reviews")
    .select("*")
    .eq("status", "approved")
    .eq("consent", true)
    .order("created_at", { ascending: false })
    .limit(100);
  return { reviews: result.data || [], unavailable: !!result.error };
}
