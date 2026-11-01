"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { idSchema, type ActionResult } from "@/lib/validation/schemas";
export async function updateEnquiry(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const client = await requireAdmin();
  const id = idSchema.safeParse(form.get("id"));
  const status = form.get("status");
  if (!id.success || !["new", "reviewed", "closed"].includes(String(status)))
    return { error: "Invalid enquiry." };
  const result = await client
    .from("enquiries")
    .update({ status: status as "new" | "reviewed" | "closed" })
    .eq("id", id.data)
    .select("id")
    .single();
  if (result.error) return { error: "Could not update the enquiry." };
  revalidatePath("/admin/enquiries");
  return { success: "Enquiry status updated." };
}
export async function deletePrivateRecord(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const client = await requireAdmin();
  const id = idSchema.safeParse(form.get("id"));
  const table = form.get("table");
  if (
    !id.success ||
    (table !== "enquiries" && table !== "reviews") ||
    form.get("confirmation") !== "DELETE"
  )
    return { error: "Type DELETE to confirm permanent deletion." };
  const result = await client
    .from(table)
    .delete()
    .eq("id", id.data)
    .select("id")
    .single();
  if (result.error) return { error: "Deletion failed. Please retry." };
  revalidatePath(`/admin/${table}`);
  revalidatePath("/reviews");
  return { success: "Record permanently deleted." };
}
