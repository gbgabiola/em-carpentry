import type { MetadataRoute } from "next";
import { getSeoConfig } from "@/lib/seo/config";

export default function robots(): MetadataRoute.Robots {
  const { origin, indexingEnabled } = getSeoConfig();
  if (!indexingEnabled || !origin)
    return { rules: { userAgent: "*", disallow: "/" } };
  // Crawling rules are not authentication or access control.
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: new URL("/sitemap.xml", origin).href,
  };
}
