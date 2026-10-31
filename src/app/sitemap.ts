import type { MetadataRoute } from "next";
import { publicRoutes } from "@/config/public-routes";
import { getSeoConfig } from "@/lib/seo/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const { origin, indexingEnabled } = getSeoConfig();
  if (!origin || !indexingEnabled) return [];
  return publicRoutes.map((path) => ({ url: new URL(path, origin).href }));
}
