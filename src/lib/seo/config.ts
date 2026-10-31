export interface SeoEnvironment {
  SITE_URL?: string;
  SITE_INDEXING_ENABLED?: string;
}

export function resolveSeoConfig(environment: SeoEnvironment) {
  const value = environment.SITE_URL?.trim();
  const flag = environment.SITE_INDEXING_ENABLED?.trim() || "false";
  if (flag !== "true" && flag !== "false") {
    throw new Error("SITE_INDEXING_ENABLED must be true or false.");
  }
  let origin: string | undefined;
  if (value) {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error("SITE_URL must be an absolute HTTPS origin.");
    }
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash ||
      parsed.port ||
      parsed.hostname === "localhost" ||
      parsed.hostname.endsWith(".localhost") ||
      !parsed.hostname.includes(".") ||
      /^\d+(\.\d+){3}$/.test(parsed.hostname) ||
      parsed.hostname.startsWith("[")
    ) {
      throw new Error(
        "SITE_URL must be a public HTTPS origin without credentials, port, path, query or fragment.",
      );
    }
    origin = parsed.origin;
  }
  if (flag === "true" && !origin) {
    throw new Error("SITE_URL is required before enabling indexing.");
  }
  return { origin, indexingEnabled: flag === "true" };
}

export function getSeoConfig() {
  return resolveSeoConfig({
    SITE_URL: process.env.SITE_URL,
    SITE_INDEXING_ENABLED: process.env.SITE_INDEXING_ENABLED,
  });
}
