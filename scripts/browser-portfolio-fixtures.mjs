import sharp from "sharp";

// Deliberately synthetic and available only through the isolated test server.
const projects = Array.from({ length: 13 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  return {
    id: `10000000-0000-4000-8000-0000000000${number}`,
    slug: `synthetic-project-${number}`,
    title: `Synthetic project ${number}`,
    summary: "Synthetic portfolio entry for browser checks; not business work.",
    description:
      "An isolated browser fixture. No customer data or real project photographs.",
    category: index < 8 ? "Synthetic interior" : "Synthetic outdoor",
    location: "Synthetic location",
    completion_date: "2026-01-15",
    status: "published",
    featured: index < 3,
    comparison_enabled: true,
    created_at: `2026-01-${String(31 - index).padStart(2, "0")}T00:00:00Z`,
    updated_at: "2026-02-01T00:00:00Z",
  };
});
const images = projects.flatMap((project, index) =>
  // The last project deliberately has no complete comparison pair.
  (index === 12 ? ["before"] : ["before", "after"]).map((role, imageIndex) => ({
    id: `20000000-0000-4000-8000-${String(index * 2 + imageIndex + 1).padStart(12, "0")}`,
    project_id: project.id,
    path: `${project.id}/synthetic-${role}.webp`,
    alt: `Synthetic ${role} image for ${project.title}`,
    display_order: imageIndex,
    role,
    created_at: "2026-02-01T00:00:00Z",
  })),
);
const photos = await Promise.all(
  ["#6b4c32", "#c6a466"].map((background) =>
    sharp({ create: { width: 800, height: 600, channels: 3, background } })
      .webp()
      .toBuffer(),
  ),
);
function json(response, rows, request) {
  const value = request.headers.accept?.includes(
    "application/vnd.pgrst.object+json",
  )
    ? (rows[0] ?? null)
    : rows;
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify(value));
}
export function servePortfolioFixture(request, response, url) {
  const params = url.searchParams;
  if (url.pathname.startsWith("/storage/v1/object/")) {
    const image = images.find((item) =>
      decodeURIComponent(url.pathname).endsWith(`/project-images/${item.path}`),
    );
    response.writeHead(image ? 200 : 404, {
      "Content-Type": "image/webp",
      "Cache-Control": "no-store",
    });
    response.end(image ? photos[image.role === "after" ? 1 : 0] : undefined);
    return true;
  }
  if (url.pathname === "/rest/v1/projects") {
    let rows = [];
    if (params.has("slug"))
      rows = projects.filter((row) => `eq.${row.slug}` === params.get("slug"));
    else if (params.has("title")) {
      const search = params
        .get("title")
        .replace(/^ilike\.%/, "")
        .replace(/%$/, "")
        .toLowerCase();
      rows = projects.filter((row) => row.title.toLowerCase().includes(search));
    }
    if (params.has("status"))
      rows = rows.filter((row) => `eq.${row.status}` === params.get("status"));
    if (params.has("category"))
      rows = rows.filter(
        (row) => `eq.${row.category}` === params.get("category"),
      );
    if (params.has("featured"))
      rows = rows.filter(
        (row) => `eq.${row.featured}` === params.get("featured"),
      );
    const offset = Number(params.get("offset") || 0);
    const limit = Number(params.get("limit") || rows.length);
    json(response, rows.slice(offset, offset + limit), request);
    return true;
  }
  if (url.pathname === "/rest/v1/project_images") {
    let rows = images;
    for (const key of ["id", "project_id"]) {
      const filter = params.get(key);
      if (filter?.startsWith("eq."))
        rows = rows.filter((row) => row[key] === filter.slice(3));
      else if (filter?.startsWith("in.(")) {
        const ids = filter.slice(4, -1).replaceAll('"', "").split(",");
        rows = rows.filter((row) => ids.includes(row[key]));
      }
    }
    json(response, rows, request);
    return true;
  }
  return false;
}
