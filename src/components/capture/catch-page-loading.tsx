"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { preloadCaptureAssets } from "@/lib/capture/preload-capture";

export function CatchPageLoading() {
  useEffect(() => {
    void preloadCaptureAssets().catch(() => undefined);
  }, []);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-background to-secondary/30" />
      <div className="absolute inset-0 bg-background/30 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative flex flex-1 flex-col items-center justify-center p-8"
      >
        <div className="w-full max-w-[17rem] rounded-[1.75rem] border border-white/30 bg-card/72 p-6 text-center shadow-[0_16px_48px_rgba(45,42,62,0.12)] backdrop-blur-xl">
          <div className="relative mx-auto mb-4 flex size-16 items-center justify-center">
            <div className="absolute -inset-1 animate-spin rounded-full border-2 border-primary/15 border-t-primary" />
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/12 ring-1 ring-primary/15">
              <BrandMark variant="icon" size={40} />
            </div>
          </div>
          <p className="text-sm font-semibold text-foreground">Loading camera</p>
          <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Camera className="size-3.5 opacity-70" />
            Warming up capture tools
          </p>
        </div>
      </motion.div>
    </div>
  );
}
