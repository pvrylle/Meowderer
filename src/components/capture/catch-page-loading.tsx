"use client";

import { useEffect } from "react";
import { Camera } from "lucide-react";

import { preloadCaptureAssets } from "@/lib/capture/preload-capture";

export function CatchPageLoading() {
  useEffect(() => {
    void preloadCaptureAssets().catch(() => undefined);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="relative">
        <div className="absolute -inset-3 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
          <Camera className="size-7 text-primary" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">Loading camera</p>
        <p className="text-xs text-muted-foreground">Warming up capture tools</p>
      </div>
    </div>
  );
}
