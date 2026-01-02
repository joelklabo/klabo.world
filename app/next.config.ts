import path from "node:path";
import { createContentlayerPlugin } from "next-contentlayer";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const withContentlayer = createContentlayerPlugin({ configPath: "./contentlayer.config.ts" });

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "media-src 'self' https: blob:",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  typedRoutes: true,
  turbopack: {},
  output: 'standalone',
  reactCompiler: true,
  // Note: cacheComponents disabled due to incompatibility with dynamic='force-dynamic' in admin routes
  // cacheComponents: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
  async headers() {
    const headers = [
      {
        key: "Content-Security-Policy",
        value: contentSecurityPolicy,
      },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ];

    if (!isDev) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/(.*)",
        headers,
      },
    ];
  },
  webpack(config) {
    config.resolve.alias["contentlayer/generated"] = path.join(process.cwd(), ".contentlayer/generated");
    return config;
  },
};

export default withContentlayer(nextConfig);
