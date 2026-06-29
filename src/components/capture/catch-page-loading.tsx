"use client";

import { useEffect } from "react";

import { preloadCaptureAssets } from "@/lib/capture/preload-capture";

export function CatchPageLoading() {
  useEffect(() => {
    void preloadCaptureAssets().catch(() => undefined);
  }, []);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="relative flex size-14 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <span className="text-2xl" aria-hidden>
          🐱
        </span>
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold text-foreground">Loading camera…</p>
        <p className="text-xs text-muted-foreground">
          Warming up capture tools in the background
        </p>
      </div>
    </div>
  );
}
