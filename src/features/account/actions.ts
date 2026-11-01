"use server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import {
  passwordChangeSchema,
  type ActionResult,
} from "@/lib/validation/schemas";
import { changeOwnPassword } from "./password";
export async function changePassword(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const client = await requireAdmin();
  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message || "Check the password fields.",
    };
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user?.email) redirect("/login");
  return changeOwnPassword(
    client.auth,
    { id: user.id, email: user.email },
    parsed.data,
  );
}
