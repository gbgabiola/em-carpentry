import { getPublishedProjectUrls } from "@/features/projects/data";
import type { MetadataRoute } from "next";
import { publicRoutes } from "@/config/public-routes";
import { getSeoConfig } from "@/lib/seo/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { origin, indexingEnabled } = getSeoConfig();
  if (!origin || !indexingEnabled) return [];
  const projects = await getPublishedProjectUrls();
  return [
    ...publicRoutes.map((path) => ({ url: new URL(path, origin).href })),
    ...projects.map((project) => ({
      url: new URL(`/projects/${project.slug}`, origin).href,
      lastModified: project.updated_at,
    })),
  ];
}
