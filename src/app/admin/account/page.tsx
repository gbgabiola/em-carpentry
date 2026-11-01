import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { ActionForm } from "@/components/forms/ActionForm";
import { changePassword } from "@/features/account/actions";
export const metadata: Metadata = {
  title: "Account security",
  robots: { index: false, follow: false },
};
export default async function AccountPage() {
  const client = await requireAdmin();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user?.email) redirect("/login");
  return (
    <div className="page-stack">
      <header className="page-intro">
        <p className="eyebrow">Your website account</p>
        <h1>Account security</h1>
        <p>
          Signed in as {user.email}. This account manages the website; it does
          not grant access to the Supabase dashboard.
        </p>
      </header>
      <section>
        <h2>Change your password</h2>
        <p>
          Use a unique passphrase of at least 12 characters. Keep it in your
          password manager. Your current password must be verified before a new
          password is saved.
        </p>
        <ActionForm action={changePassword} label="Change password">
          <label>
            Current password
            <input
              type="password"
              name="current_password"
              required
              maxLength={256}
              autoComplete="current-password"
            />
          </label>
          <label>
            New password
            <input
              type="password"
              name="new_password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              name="confirm_password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
            />
          </label>
        </ActionForm>
      </section>
      <p className="text-sm text-muted">
        Forgotten-password recovery is handled by the developer. Automatic reset
        emails are not configured. If another device may have access, ask the
        developer to revoke access; changing a password does not immediately
        invalidate every existing sign-in.
      </p>
    </div>
  );
}
