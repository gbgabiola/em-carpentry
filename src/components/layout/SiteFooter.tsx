import { getBusiness } from "@/features/business/data";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export async function SiteFooter() {
  const business = await getBusiness();
  return (
    <footer className="site-footer">
      <div className="site-width footer-content">
        <div>
          <p className="font-semibold">{siteConfig.name}</p>
          <p className="mt-2 text-sm text-muted">{business.service_area}</p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <Link href="/contact">Contact</Link>
          <a href={business.contact.facebookHref}>Facebook</a>
          <Link href="/privacy">Privacy</Link>
        </div>
        <p className="footer-note">
          Website in preparation · Service details and portfolio content are
          being confirmed.
        </p>
      </div>
    </footer>
  );
}
