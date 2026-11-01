import type { Metadata } from "next";
import { getSupabaseConfig } from "@/lib/db/config";
import { ActionForm } from "@/components/forms/ActionForm";
import { signIn } from "./actions";
export const metadata: Metadata = {
  title: "Owner sign-in",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const enabled = !!getSupabaseConfig();
  return (
    <div className="page-stack">
      <div className="page-intro">
        <p className="eyebrow">Owner access</p>
        <h1>Sign in.</h1>
        <p>
          Use your manually provisioned owner account. Public registration is
          not available.
        </p>
      </div>
      {notice === "denied" && (
        <p role="alert">This account does not have owner access.</p>
      )}
      {enabled ? (
        <ActionForm action={signIn} label="Sign in">
          <label>
            Email
            <input
              name="email"
              type="email"
              required
              maxLength={320}
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              maxLength={256}
              autoComplete="current-password"
            />
          </label>
        </ActionForm>
      ) : (
        <p role="status">
          Owner sign-in is not configured. Follow the backend setup guide before
          using this page.
        </p>
      )}
      <p className="text-sm text-muted">
        For access recovery, contact the developer who manages the hosting
        account. No automated password-reset email is promised.
      </p>
    </div>
  );
}
