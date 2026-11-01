import { createSessionClient, createPublicClient } from "@/lib/db/server";
import { idSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success)
    return new Response(null, { status: 404 });
  const client = (await createSessionClient()) || createPublicClient();
  if (!client) return new Response(null, { status: 404 });
  const image = await client
    .from("project_images")
    .select("path")
    .eq("id", id)
    .maybeSingle();
  if (image.error || !image.data) return new Response(null, { status: 404 });
  const result = await client.storage
    .from("project-images")
    .download(image.data.path);
  if (result.error || !result.data) return new Response(null, { status: 404 });
  return new Response(result.data, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
