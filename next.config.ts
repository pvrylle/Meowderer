import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serwist injects a webpack config; this empty turbopack config lets
  // `next dev` (Turbopack) run without the "webpack config and no turbopack
  // config" error. Production builds use `next build --webpack`.
  turbopack: {},
  images: {
    // Supabase Storage public URLs for stickers.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    // Local demo stickers are SVGs; safe because they are first-party assets.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Avoid SW caching headaches during local development.
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
