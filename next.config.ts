import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serwist injects a webpack config; this empty turbopack config lets
  // `next dev` (Turbopack) run without the "webpack config and no turbopack
  // config" error. Production builds use `next build --webpack`.
  turbopack: {},
  async redirects() {
    return [
      { source: "/maps", destination: "/map", permanent: true },
      { source: "/icon.svg", destination: "/assets/iconnotext.svg", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "tiles.stadiamaps.com",
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

      // onnxruntime-web's ESM bundle contains `new URL("...", import.meta.url)`
      // expressions (for its wasm/proxy-worker assets) that are evaluated at
      // module-load time. Next's webpack rewrites those into the RelativeURL
      // runtime helper (`__webpack_require__.U`), which isn't emitted into the
      // client runtime — so the onnxruntime chunk throws
      // "TypeError: __webpack_require__.U is not a constructor" as soon as
      // @imgly/background-removal imports it.
      //
      // Disable webpack's `new URL()` asset handling for onnxruntime-web so the
      // native `URL` constructor is used instead. This is safe here because
      // @imgly/background-removal sets `ort.env.wasm.wasmPaths` explicitly, so
      // onnxruntime never relies on webpack to locate its assets.
      config.module.rules.push({
        test: /[\\/]node_modules[\\/]onnxruntime-web[\\/]/,
        parser: { url: false },
      });
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
