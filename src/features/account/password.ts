import type { ActionResult } from "@/lib/validation/schemas";

interface PasswordAuth {
  signInWithPassword(credentials: {
    email: string;
    password: string;
  }): Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  updateUser(attributes: {
    password: string;
    current_password: string;
  }): Promise<{ error: unknown }>;
  signOut(options: { scope: "others" | "local" }): Promise<{ error: unknown }>;
}
export async function changeOwnPassword(
  auth: PasswordAuth,
  user: { id: string; email: string },
  passwords: { current_password: string; new_password: string },
): Promise<ActionResult> {
  try {
    const verified = await auth.signInWithPassword({
      email: user.email,
      password: passwords.current_password,
    });
    if (verified.error)
      return {
        error:
          "Current password could not be verified. Check it or try again later.",
      };
    if (verified.data.user?.id !== user.id) {
      await auth.signOut({ scope: "local" });
      return { error: "Your identity could not be verified. Sign in again." };
    }
    const updated = await auth.updateUser({
      password: passwords.new_password,
      current_password: passwords.current_password,
    });
    if (updated.error)
      return {
        error:
          "Password could not be changed. Try a different, stronger passphrase or contact the developer.",
      };
  } catch {
    return {
      error:
        "Password change is temporarily unavailable. Please try again later.",
    };
  }
  try {
    const otherSessions = await auth.signOut({ scope: "others" });
    if (otherSessions.error)
      return {
        success:
          "Password updated. Other-device sign-out could not be confirmed; contact the developer if you suspect another device has access.",
      };
  } catch {
    return {
      success:
        "Password updated. Other-device sign-out could not be confirmed; contact the developer if you suspect another device has access.",
    };
  }
  return {
    success:
      "Password updated. Other devices may retain access until their current sign-in expires.",
  };
}
