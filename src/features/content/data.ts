import "server-only";
import { createPublicClient } from "@/lib/db/server";
import type { Service } from "@/types/database";
import { defaultFaqs } from "./defaults";
export async function getServices() {
  const client = createPublicClient();
  if (!client) return { services: [] as Service[], unavailable: false };
  const result = await client
    .from("services")
    .select("*")
    .eq("status", "published")
    .eq("publication_confirmed", true)
    .order("display_order")
    .order("name")
    .limit(100);
  return { services: result.data || [], unavailable: !!result.error };
}
export async function getFaqs() {
  const client = createPublicClient();
  if (!client) return { faqs: defaultFaqs, unavailable: false };
  const result = await client
    .from("faqs")
    .select("*")
    .eq("status", "published")
    .eq("publication_confirmed", true)
    .order("display_order")
    .order("created_at")
    .limit(100);
  return {
    faqs: result.data || [],
    unavailable: !!result.error,
  };
}
