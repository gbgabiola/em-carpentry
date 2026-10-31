import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted">
        <p>{siteConfig.name}</p>
        <p>{siteConfig.serviceArea}</p>
      </div>
    </footer>
  );
}
