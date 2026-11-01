import { getBusiness } from "@/features/business/data";
import { siteConfig } from "@/config/site";
import { getSeoConfig } from "@/lib/seo/config";

export async function BusinessStructuredData() {
  const business = await getBusiness();
  const { origin } = getSeoConfig();
  const data = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: siteConfig.name,
    description: siteConfig.description,
    ...(!business.unavailable
      ? {
          telephone: business.contact.phone,
          email: business.contact.email,
          sameAs: [business.contact.facebookHref],
          areaServed: { "@type": "Place", name: business.service_area },
        }
      : {}),
    foundingDate: String(siteConfig.operatingSince),
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
