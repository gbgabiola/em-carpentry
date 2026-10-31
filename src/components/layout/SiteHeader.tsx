import Image from "next/image";
import Link from "next/link";
import { navigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
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
          <span className="sr-only"> — {siteConfig.serviceArea}</span>
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
        <a className="header-phone" href={siteConfig.contact.phoneHref}>
          {siteConfig.contact.phone}
        </a>
      </nav>
    </header>
  );
}
