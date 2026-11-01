import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/db/server";
import { siteConfig } from "@/config/site";
export const getBusiness = cache(async () => {
  const fallback = {
    about_text:
      "Neat workmanship, attention to detail and a willingness to go the extra mile guide the business.",
    service_area: siteConfig.serviceArea,
  };
  const client = createPublicClient();
  if (!client) return fallback;
  const result = await client
    .from("business_settings")
    .select("*")
    .eq("id", 1)
    .single();
  return result.data || fallback;
});
