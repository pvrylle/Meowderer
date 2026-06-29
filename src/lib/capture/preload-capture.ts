import type { Config } from "@imgly/background-removal";

/** Shared config — must match removeBackground() in pipeline.ts */
export const BG_REMOVAL_CONFIG = {
  model: "isnet_fp16" as const,
  output: {
    format: "image/png" as const,
    quality: 1,
  },
} satisfies Config;

let assetsPromise: Promise<void> | null = null;

/** Pre-download imgly WASM/models and warm JS chunks before "Use photo". */
export function preloadCaptureAssets(): Promise<void> {
  if (!assetsPromise) {
    assetsPromise = Promise.all([
      import("@/lib/capture/pipeline"),
      import("@/lib/capture/cat-guard"),
      import("@/lib/capture/mobilenet-classifier").then(({ preloadMobileNet }) =>
        preloadMobileNet(),
      ),
      import("@imgly/background-removal").then(({ preload }) =>
        preload(BG_REMOVAL_CONFIG),
      ),
    ])
      .then(() => undefined)
      .catch((err) => {
        assetsPromise = null;
        throw err;
      });
  }
  return assetsPromise;
}
