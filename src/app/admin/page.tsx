import Link from "next/link";
import { retention } from "@/config/retention";
import { requireAdmin } from "@/lib/auth/admin";
export default async function AdminPage() {
  await requireAdmin();
  return (
    <div className="page-stack">
      <h1>Owner dashboard</h1>
      <p>
        Manage published portfolio content and manually selected Facebook
        testimonials. Public quotation and feedback submissions remain disabled
        until retention controls and secure intake are ready.
      </p>
      <p>
        <a className="text-link" href="/admin/export">
          Download business and customer data (JSON)
        </a>
      </p>
      <p className="text-sm text-muted">
        Exports include private enquiry information. Store them securely outside
        the website. Photo files need a separate backup. Rotate export copies
        and their separate photo backups after {retention.backupDays} days.
      </p>
      <ul>
        <li>
          <Link className="text-link" href="/admin/content">
            Manage approved services and FAQs
          </Link>
        </li>
        <li>
          <Link className="text-link" href="/admin/projects">
            Manage projects and photos
          </Link>
        </li>
        <li>
          <Link className="text-link" href="/admin/reviews">
            Manage reviews and testimonials
          </Link>
        </li>
        <li>
          <Link className="text-link" href="/admin/enquiries">
            Review private enquiries
          </Link>
        </li>
        <li>
          <Link className="text-link" href="/admin/settings">
            Edit business information
          </Link>
        </li>
      </ul>
      <p>
        Supabase Free can pause after inactivity. If data becomes unavailable,
        restore the project through the developer’s Supabase account. No enquiry
        email notifications are configured.
      </p>
    </div>
  );
}
