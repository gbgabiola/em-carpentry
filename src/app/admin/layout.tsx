import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { signOut } from "@/app/login/actions";
export const metadata: Metadata = {
  title: "Owner dashboard",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="page-stack">
      <nav aria-label="Owner navigation" className="admin-navigation">
        <Link href="/admin">Overview</Link>
        <Link href="/admin/projects">Projects</Link>
        <Link href="/admin/reviews">Reviews</Link>
        <Link href="/admin/enquiries">Enquiries</Link>
        <Link href="/admin/content">Services &amp; FAQs</Link>
        <Link href="/admin/settings">Business information</Link>
        <form action={signOut}>
          <button type="submit" className="text-link">
            Sign out
          </button>
        </form>
      </nav>
      {children}
    </div>
  );
}
