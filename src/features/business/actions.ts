"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { businessSchema, type ActionResult } from "@/lib/validation/schemas";
export async function saveBusiness(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const client = await requireAdmin();
  const parsed = businessSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error:
        "Provide business copy up to 3,000 characters and a service area up to 200 characters.",
    };
  const result = await client
    .from("business_settings")
    .update(parsed.data)
    .eq("id", 1)
    .select("id")
    .single();
  if (result.error) return { error: "Could not save business information." };
  for (const path of ["/about", "/contact", "/admin/settings"])
    revalidatePath(path);
  return { success: "Public business information updated." };
}
