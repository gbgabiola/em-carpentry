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
        parsed.error.issues[0]?.message || "Check the business information.",
    };
  const result = await client
    .from("business_settings")
    .update(parsed.data)
    .eq("id", 1)
    .select("id")
    .single();
  if (result.error) return { error: "Could not save business information." };
  revalidatePath("/", "layout");
  return { success: "Public business information updated." };
}
