import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/db/server";
import type { Project, ProjectImage } from "@/types/database";
export type PortfolioProject = Project & { images: ProjectImage[] };
export async function getProjects({
  query = "",
  category = "",
  page = 0,
  featured = false,
}: {
  query?: string;
  category?: string;
  page?: number;
  featured?: boolean;
} = {}) {
  const client = createPublicClient();
  if (!client)
    return {
      projects: [] as PortfolioProject[],
      unavailable: false,
      hasMore: false,
    };
  let request = client
    .from("projects")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (query) request = request.ilike("title", `%${query.slice(0, 100)}%`);
  if (category) request = request.eq("category", category.slice(0, 80));
  if (featured) request = request.eq("featured", true);
  const limit = featured ? 3 : 12;
  const result = await request.range(page * limit, page * limit + limit);
  if (result.error)
    return {
      projects: [] as PortfolioProject[],
      unavailable: true,
      hasMore: false,
    };
  const projects = result.data.slice(0, limit);
  if (!projects.length)
    return {
      projects: [] as PortfolioProject[],
      unavailable: false,
      hasMore: false,
    };
  const images = await client
    .from("project_images")
    .select("*")
    .in(
      "project_id",
      projects.map((p) => p.id),
    )
    .order("display_order");
  if (images.error)
    return {
      projects: [] as PortfolioProject[],
      unavailable: true,
      hasMore: false,
    };
  return {
    projects: projects.map((p) => ({
      ...p,
      images: images.data.filter((image) => image.project_id === p.id),
    })),
    unavailable: false,
    hasMore: result.data.length > limit,
  };
}
export const getProject = cache(
  async (slug: string): Promise<PortfolioProject | null> => {
    const client = createPublicClient();
    if (!client) return null;
    const result = await client
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (result.error || !result.data) return null;
    const images = await client
      .from("project_images")
      .select("*")
      .eq("project_id", result.data.id)
      .order("display_order");
    if (images.error) return null;
    return { ...result.data, images: images.data };
  },
);
export async function getPublishedProjectUrls() {
  const client = createPublicClient();
  if (!client) return [];
  const rows: Pick<Project, "slug" | "updated_at">[] = [];
  for (let page = 0; ; page++) {
    const result = await client
      .from("projects")
      .select("slug,updated_at")
      .eq("status", "published")
      .order("id")
      .range(page * 1000, page * 1000 + 999);
    if (result.error)
      throw new Error("Published project sitemap is unavailable");
    rows.push(...result.data);
    if (result.data.length < 1000) return rows;
  }
}
