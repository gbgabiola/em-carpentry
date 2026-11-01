"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import {
  idSchema,
  serviceSchema,
  faqSchema,
  type ActionResult,
} from "@/lib/validation/schemas";
function refreshContent() {
  revalidatePath("/", "layout");
}
export async function saveService(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const client = await requireAdmin();
  const parsed = serviceSchema.safeParse({
    ...Object.fromEntries(form),
    publication_confirmed: form.get("publication_confirmed") === "on",
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message || "Check the service fields.",
    };
  const raw = form.get("id");
  const id = raw ? idSchema.safeParse(raw) : null;
  if (id && !id.success) return { error: "Invalid service." };
  const result = id?.success
    ? await client
        .from("services")
        .update(parsed.data)
        .eq("id", id.data)
        .select("id")
        .single()
    : await client.from("services").insert(parsed.data).select("id").single();
  if (result.error)
    return {
      error: "Could not save this service. Check the unique slug and retry.",
    };
  refreshContent();
  return {
    success: "Service saved. Only confirmed, published services are displayed.",
  };
}
export async function saveFaq(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const client = await requireAdmin();
  const parsed = faqSchema.safeParse({
    ...Object.fromEntries(form),
    publication_confirmed: form.get("publication_confirmed") === "on",
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message || "Check the FAQ fields.",
    };
  const raw = form.get("id");
  const id = raw ? idSchema.safeParse(raw) : null;
  if (id && !id.success) return { error: "Invalid FAQ." };
  const result = id?.success
    ? await client
        .from("faqs")
        .update(parsed.data)
        .eq("id", id.data)
        .select("id")
        .single()
    : await client.from("faqs").insert(parsed.data).select("id").single();
  if (result.error) return { error: "Could not save this FAQ. Please retry." };
  refreshContent();
  return {
    success: "FAQ saved. Only confirmed, published answers are displayed.",
  };
}
