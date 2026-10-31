import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Keep all unfinished routes out of search. This is not access control.
  return { rules: { userAgent: "*", disallow: "/" } };
}
