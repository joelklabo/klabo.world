import path from "path";
import { withContentlayer } from "next-contentlayer";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  turbopack: {},
  output: 'standalone',
  webpack(config) {
    config.resolve.alias["contentlayer/generated"] = path.join(process.cwd(), ".contentlayer/generated");
    return config;
  },
};

export default withContentlayer(nextConfig);
