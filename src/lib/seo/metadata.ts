import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getSeoConfig } from "./config";

export function createPageMetadata(
  path: string,
  title: string,
  description: string,
): Metadata {
  const { origin, indexingEnabled } = getSeoConfig();
  const url = origin ? new URL(path, origin).href : undefined;
  const image = origin
    ? new URL("/images/brand/em-logo.webp", origin).href
    : undefined;
  return {
    title: path === "/" ? { absolute: title } : title,
    description,
    robots: { index: indexingEnabled, follow: indexingEnabled },
    ...(url && image
      ? {
          alternates: { canonical: url },
          openGraph: {
            type: "website",
            url,
            title,
            description,
            siteName: siteConfig.name,
            locale: "en_AU",
            images: [
              { url: image, width: 800, height: 800, alt: siteConfig.name },
            ],
          },
          twitter: { card: "summary", title, description, images: [image] },
        }
      : {}),
  };
}
