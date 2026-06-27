import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serwist injects a webpack config; this empty turbopack config lets
  // `next dev` (Turbopack) run without the "webpack config and no turbopack
  // config" error. Production builds use `next build --webpack`.
  turbopack: {},
  async redirects() {
    return [{ source: "/maps", destination: "/map", permanent: true }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    // Local demo stickers are SVGs; safe because they are first-party assets.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        sharp$: false,
        "onnxruntime-node$": false,
      };
    }
    return config;
  },
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Avoid SW caching headaches during local development.
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
