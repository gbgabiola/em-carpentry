import { PROJECT_ACTION_BODY_LIMIT } from "./src/lib/images/limits";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { serverActions: { bodySizeLimit: PROJECT_ACTION_BODY_LIMIT } },
  poweredByHeader: false,
};

export default nextConfig;
