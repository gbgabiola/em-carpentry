import { createSessionClient, createPublicClient } from "@/lib/db/server";
import { idSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";
const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};
function unavailablePhoto() {
  return new Response(null, { status: 404, headers: privateHeaders });
}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return unavailablePhoto();
  const client = (await createSessionClient()) || createPublicClient();
  if (!client) return unavailablePhoto();
  const image = await client
    .from("project_images")
    .select("path")
    .eq("id", id)
    .maybeSingle();
  if (image.error || !image.data) return unavailablePhoto();
  const result = await client.storage
    .from("project-images")
    .download(image.data.path);
  if (result.error || !result.data) return unavailablePhoto();
  return new Response(result.data, {
    headers: {
      "Content-Type": "image/webp",
      ...privateHeaders,
    },
  });
}
