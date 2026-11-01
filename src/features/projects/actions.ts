"use server";
import { getComparisonPair } from "@/lib/images/comparison";
import { randomUUID } from "node:crypto";
import {
  MAX_PROJECT_PHOTO_BYTES,
  PROJECT_PHOTO_SIZE_LABEL,
} from "@/lib/images/limits";
import { optimiseProjectPhoto } from "@/lib/images/process";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import {
  idSchema,
  imageSchema,
  projectSchema,
  type ActionResult,
} from "@/lib/validation/schemas";

function refreshProjects() {
  for (const path of ["/", "/projects", "/admin/projects", "/sitemap.xml"])
    revalidatePath(path, "layout");
}
export async function saveProject(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const client = await requireAdmin();
  const parsed = projectSchema.safeParse({
    ...Object.fromEntries(form),
    featured: form.get("featured") === "on",
    comparison_enabled: form.get("comparison_enabled") === "on",
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message || "Check the project fields.",
    };
  const rawId = form.get("id");
  const id = rawId ? idSchema.safeParse(rawId) : null;
  if (id && !id.success) return { error: "Invalid project." };
  if (parsed.data.status === "published" || parsed.data.comparison_enabled) {
    if (!id?.success)
      return {
        error:
          "Save a draft and upload approved photos before publishing or enabling a comparison.",
      };
    const images = await client
      .from("project_images")
      .select("id,role")
      .eq("project_id", id.data);
    if (images.error || !images.data.length)
      return { error: "Upload at least one approved photo before publishing." };
    if (parsed.data.comparison_enabled && !getComparisonPair(images.data))
      return {
        error:
          "A comparison needs exactly one Before photo and one After photo. Use the same viewpoint and framing.",
      };
  }
  const result = id?.success
    ? await client
        .from("projects")
        .update(parsed.data)
        .eq("id", id.data)
        .select("id")
        .single()
    : await client.from("projects").insert(parsed.data).select("id").single();
  if (result.error)
    return { error: "Could not save. Check the unique slug and try again." };
  refreshProjects();
  if (id?.success) revalidatePath(`/admin/projects/${id.data}`);
  return {
    success:
      "Project saved. Use its Edit link to manage photos and publishing.",
  };
}
export async function uploadImage(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const client = await requireAdmin();
  const parsed = imageSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: "Check the photo description, order and role." };
  const file = form.get("photo");
  if (
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > MAX_PROJECT_PHOTO_BYTES ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
    return {
      error: `Choose a JPEG, PNG or WebP photo up to ${PROJECT_PHOTO_SIZE_LABEL}.`,
    };
  if (form.get("rights") !== "on")
    return { error: "Confirm that you have permission to publish this photo." };
  const project = await client
    .from("projects")
    .select("id")
    .eq("id", parsed.data.project_id)
    .single();
  if (project.error) return { error: "Project not found." };
  let buffer: Buffer;
  try {
    buffer = await optimiseProjectPhoto(Buffer.from(await file.arrayBuffer()));
  } catch {
    return { error: "This photo could not be processed. Try a smaller image." };
  }
  const path = `${parsed.data.project_id}/${randomUUID()}.webp`;
  const upload = await client.storage
    .from("project-images")
    .upload(path, buffer, { contentType: "image/webp", upsert: false });
  if (upload.error) return { error: "Photo upload failed. Please try again." };
  const saved = await client
    .from("project_images")
    .insert({ ...parsed.data, path });
  if (saved.error) {
    const cleanup = await client.storage.from("project-images").remove([path]);
    return {
      error: cleanup.error
        ? "Photo record failed. An orphaned upload needs cleanup; see the owner guide."
        : "Photo could not be attached. The upload was removed.",
    };
  }
  revalidatePath(`/admin/projects/${parsed.data.project_id}`);
  refreshProjects();
  return { success: "Photo uploaded. Location metadata has been removed." };
}
export async function removeImage(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const client = await requireAdmin();
  const id = idSchema.safeParse(form.get("id"));
  if (!id.success) return { error: "Invalid photo." };
  const image = await client
    .from("project_images")
    .select("id,path,project_id")
    .eq("id", id.data)
    .single();
  if (image.error) return { error: "Photo not found." };
  const removed = await client.storage
    .from("project-images")
    .remove([image.data.path]);
  if (removed.error)
    return { error: "Could not remove the stored photo. Please retry." };
  const deleted = await client
    .from("project_images")
    .delete()
    .eq("id", id.data);
  if (deleted.error)
    return {
      error: "Stored photo removed; retry to remove the remaining record.",
    };
  revalidatePath(`/admin/projects/${image.data.project_id}`);
  refreshProjects();
  return { success: "Photo removed." };
}

export async function updateImage(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const client = await requireAdmin();
  const id = idSchema.safeParse(form.get("id"));
  const parsed = imageSchema.safeParse(Object.fromEntries(form));
  if (!id.success || !parsed.success)
    return { error: "Check the photo description, order and role." };
  const { alt, display_order, role } = parsed.data;
  const result = await client
    .from("project_images")
    .update({ alt, display_order, role })
    .eq("id", id.data)
    .eq("project_id", parsed.data.project_id)
    .select("id")
    .single();
  if (result.error) return { error: "Could not update this photo." };
  revalidatePath(`/admin/projects/${parsed.data.project_id}`);
  refreshProjects();
  return { success: "Photo details updated." };
}
