import { requireAdmin } from "@/lib/auth/admin";
export const dynamic = "force-dynamic";
export async function GET() {
  const client = await requireAdmin();
  const tables = [
    "projects",
    "project_images",
    "reviews",
    "enquiries",
    "business_settings",
    "services",
    "faqs",
  ] as const;
  const content: Record<string, unknown[]> = {};
  for (const table of tables) {
    content[table] = [];
    for (let page = 0; ; page++) {
      const result = await client
        .from(table)
        .select("*")
        .order("id")
        .range(page * 1000, page * 1000 + 999);
      if (result.error)
        return Response.json(
          {
            error:
              "Export could not be completed. Please retry; no partial export was produced.",
          },
          { status: 503, headers: { "Cache-Control": "private, no-store" } },
        );
      content[table].push(...result.data);
      if (result.data.length < 1000) break;
    }
  }
  return Response.json(
    {
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      containsPrivateCustomerData: true,
      photoDownloadNote:
        "Photo bytes are separate. Download authenticated /media/{image-id} files and preserve the project_images path mapping.",
      content,
    },
    {
      headers: {
        "Content-Disposition":
          'attachment; filename="em-carpentry-export.json"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
