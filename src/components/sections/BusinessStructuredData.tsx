import { siteConfig } from "@/config/site";
import { getSeoConfig } from "@/lib/seo/config";

export function BusinessStructuredData() {
  const { origin } = getSeoConfig();
  const data = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: siteConfig.name,
    description: siteConfig.description,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    foundingDate: String(siteConfig.operatingSince),
    areaServed: { "@type": "City", name: "Geelong, Victoria, Australia" },
    sameAs: [siteConfig.contact.facebookHref],
    ...(origin
      ? {
          url: origin,
          image: new URL("/images/brand/em-logo.webp", origin).href,
        }
      : {}),
  };
  return (
    <script id="business-structured-data" type="application/ld+json">
      {JSON.stringify(data).replaceAll("<", "\u003c")}
    </script>
  );
}
