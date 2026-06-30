"use client";

import { useEffect } from "react";

import { preloadCaptureAssets } from "@/lib/capture/preload-capture";

/** Warm imgly + MobileNet in the background so the first catch feels faster. */
export function PreloadCaptureAssets() {
  useEffect(() => {
    const run = () => {
      void preloadCaptureAssets().catch(() => undefined);
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = setTimeout(run, 800);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
