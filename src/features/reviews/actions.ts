"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import {
  idSchema,
  testimonialSchema,
  type ActionResult,
} from "@/lib/validation/schemas";
export async function saveTestimonial(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const client = await requireAdmin();
  const parsed = testimonialSchema.safeParse({
    ...Object.fromEntries(form),
    consent: form.get("consent") === "on",
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message || "Check the testimonial fields.",
    };
  const result = await client
    .from("reviews")
    .insert({ ...parsed.data, source: "facebook", rating: null });
  if (result.error)
    return { error: "Could not save the testimonial. Please retry." };
  revalidatePath("/reviews");
  revalidatePath("/admin/reviews");
  return {
    success:
      "Testimonial saved with Facebook attribution. No star rating was invented.",
  };
}
export async function moderateReview(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const client = await requireAdmin();
  const id = idSchema.safeParse(form.get("id"));
  const status = form.get("status");
  if (
    !id.success ||
    !["approved", "rejected", "pending", "withdraw-consent"].includes(
      String(status),
    )
  )
    return { error: "Invalid moderation request." };
  const result = await client
    .from("reviews")
    .update(
      status === "withdraw-consent"
        ? { status: "rejected", consent: false }
        : { status: status as "approved" | "rejected" | "pending" },
    )
    .eq("id", id.data)
    .select("id")
    .single();
  if (result.error)
    return {
      error:
        "Could not update this review. Approval requires recorded publication consent; expired reviews can only be deleted.",
    };
  revalidatePath("/reviews");
  revalidatePath("/admin/reviews");
  return {
    success:
      status === "withdraw-consent"
        ? "Publication consent withdrawn. The review is hidden and cannot be reapproved without new permission."
        : "Moderation status updated.",
  };
}
