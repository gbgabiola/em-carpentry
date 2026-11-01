import type { BusinessSettings } from "@/types/database";
import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/db/server";
import { siteConfig } from "@/config/site";
import { businessSchema } from "@/lib/validation/schemas";
export const getBusiness = cache(async () => {
  const fallback: Omit<BusinessSettings, "id"> = {
    about_text:
      "Neat workmanship, attention to detail and a willingness to go the extra mile guide the business.",
    service_area: siteConfig.serviceArea,
    phone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    facebook_url: siteConfig.contact.facebookHref,
  };
  const client = createPublicClient();
  let business = fallback;
  let unavailable = false;
  if (client) {
    const result = await client
      .from("business_settings")
      .select("*")
      .eq("id", 1)
      .single();
    const parsed = businessSchema.safeParse(result.data);
    if (!result.error && parsed.success) business = parsed.data;
    else unavailable = true;
  }
  return {
    ...business,
    unavailable,
    contact: {
      phone: business.phone,
      phoneHref: `tel:${business.phone.replace(/[ ()-]/g, "")}`,
      email: business.email,
      emailHref: `mailto:${business.email}`,
      facebookHref: business.facebook_url,
    },
  };
});
