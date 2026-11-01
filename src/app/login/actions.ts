"use server";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/db/server";
import { loginSchema, type ActionResult } from "@/lib/validation/schemas";
export async function signIn(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: "Enter your email address and password." };
  const client = await createSessionClient();
  if (!client)
    return { error: "Administrator sign-in has not been configured." };
  try {
    const result = await client.auth.signInWithPassword(parsed.data);
    if (result.error)
      return {
        error: "Sign-in failed. Check your details or try again later.",
      };
    const membership = await client.rpc("is_admin");
    if (membership.error || !membership.data) {
      await client.auth.signOut({ scope: "local" });
      return { error: "This account does not have administrator access." };
    }
  } catch {
    return {
      error: "Sign-in is temporarily unavailable. Please try again later.",
    };
  }
  redirect("/admin");
}
export async function signOut() {
  const client = await createSessionClient();
  if (client) await client.auth.signOut({ scope: "local" });
  redirect("/login");
}
