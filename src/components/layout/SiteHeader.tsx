import { getBusiness } from "@/features/business/data";
import Image from "next/image";
import Link from "next/link";
import { navigation } from "@/config/navigation";
import { ThemeToggle } from "./ThemeToggle";

export async function SiteHeader() {
  const business = await getBusiness();
  return (
    <header className="site-header">
      <div className="site-width header-top">
        <Link href="/" className="brand-link">
          <Image
            src="/images/brand/em-logo.webp"
            alt=""
            width={64}
            height={64}
            className="brand-logo"
          />
          <span>
            EM Carpentry
            <span className="brand-subtitle">&amp; Home Maintenance</span>
          </span>
          <span className="sr-only"> — {business.service_area}</span>
        </Link>
        <ThemeToggle />
      </div>
      <nav aria-label="Main navigation" className="site-width main-navigation">
        <ul>
          {navigation.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
        {business.unavailable ? (
          <Link className="header-phone" href="/contact">
            Contact the business
          </Link>
        ) : (
          <a className="header-phone" href={business.contact.phoneHref}>
            {business.contact.phone}
          </a>
        )}
      </nav>
    </header>
  );
}
