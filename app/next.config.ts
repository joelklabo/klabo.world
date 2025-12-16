import path from "node:path";
import { withContentlayer } from "next-contentlayer";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  turbopack: {},
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  webpack(config) {
    config.resolve.alias["contentlayer/generated"] = path.join(process.cwd(), ".contentlayer/generated");
    return config;
  },
};

export default withContentlayer(nextConfig);
