import Link from "next/link";
import { navigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-6">
        <Link href="/" className="max-w-xs font-semibold">{siteConfig.name}</Link>
        <nav aria-label="Main navigation">
          <ul className="flex flex-wrap gap-6">
            {navigation.map((item) => (
              <li key={item.href}><Link href={item.href}>{item.label}</Link></li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
