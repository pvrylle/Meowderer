"use client";

import { motion } from "framer-motion";

import { BrandMark } from "@/components/brand-mark";
import type { CaptureProgress } from "@/lib/capture/pipeline";
import { cn } from "@/lib/utils";

function stageHint(stage: CaptureProgress["stage"] | undefined): string {
  switch (stage) {
    case "compressing":  return "Preparing your photo…";
    case "removing":     return "Cutting out the background — this is the slow bit";
    case "refining":     return "Sharpening fur and cleaning edges";
    case "outlining":    return "Adding the collectible sticker frame";
    case "finishing":    return "Almost ready…";
    case "done":         return "Done!";
    default:             return "Processing on your device…";
  }
}

/**
 * Two counter-rotating comet arcs + icon badge.
 * Pure CSS transform animations — these run on the GPU compositor thread, so
 * they keep spinning even while the background-removal WASM blocks the main
 * (JS) thread. Anything driven by React state / setInterval / rAF freezes
 * during that block, which is why this overlay avoids them entirely.
 */
function DualRingSpinner({ heavy }: { heavy: boolean }) {
  return (
    <div className="relative mx-auto mb-5 size-[5.5rem]">
      {/* Faint static track */}
      <svg className="absolute inset-0 size-full" viewBox="0 0 80 80" aria-hidden>
        <circle cx="40" cy="40" r="36" fill="none"
          stroke="rgb(139,108,199)" strokeOpacity="0.08" strokeWidth="2.5" />
      </svg>

      {/* Outer comet ring — clockwise */}
      <div
        className="absolute inset-0 animate-spin [will-change:transform]"
        style={{ animationDuration: heavy ? "1.1s" : "1.8s" }}
        aria-hidden
      >
        <svg viewBox="0 0 80 80" className="size-full">
          <defs>
            <linearGradient id="comet-outer" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="rgb(139,108,199)" stopOpacity="0"   />
              <stop offset="65%"  stopColor="rgb(139,108,199)" stopOpacity="1"   />
              <stop offset="100%" stopColor="rgb(139,108,199)" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="36" fill="none"
            stroke="url(#comet-outer)"
            strokeWidth={heavy ? "3.5" : "2.5"}
            strokeLinecap="round"
            strokeDasharray="52 174" />
        </svg>
      </div>

      {/* Inner comet ring — counter-clockwise */}
      <div
        className="absolute inset-[9px] animate-spin [will-change:transform]"
        style={{ animationDuration: heavy ? "1.8s" : "2.8s", animationDirection: "reverse" }}
        aria-hidden
      >
        <svg viewBox="0 0 62 62" className="size-full">
          <defs>
            <linearGradient id="comet-inner" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="rgb(180,155,230)" stopOpacity="0"   />
              <stop offset="60%"  stopColor="rgb(180,155,230)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="rgb(180,155,230)" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <circle cx="31" cy="31" r="26" fill="none"
            stroke="url(#comet-inner)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="28 135" />
        </svg>
      </div>

      {/* Icon badge */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={cn(
          "flex size-[3.6rem] items-center justify-center rounded-2xl transition-colors duration-500",
          heavy
            ? "bg-primary/15 ring-2 ring-primary/30 shadow-[0_0_16px_rgba(139,108,199,0.2)]"
            : "bg-primary/10 ring-1 ring-primary/15",
        )}>
          <BrandMark variant="icon" size={44} />
        </div>
      </div>
    </div>
  );
}

export function CatchProcessingOverlay({
  progress,
  className,
}: {
  progress: CaptureProgress | null;
  className?: string;
}) {
  const label   = progress?.label ?? "Processing…";
  const stage   = progress?.stage;
  const isHeavy = stage === "removing" || stage === "refining";
  const isDone  = stage === "done";

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden bg-background",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/6 via-background to-secondary/25" />

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative flex flex-1 flex-col items-center justify-center p-6"
      >
        <div className="w-full max-w-[17rem] rounded-[1.75rem] border border-border/50 bg-card/80 p-6 shadow-[0_16px_48px_rgba(45,42,62,0.1)] backdrop-blur-xl">

          <DualRingSpinner heavy={isHeavy} />

          {/* Label + bouncing dots (opacity/transform = compositor) */}
          <p className="text-center text-sm font-semibold text-foreground">{label}</p>
          <div className="mt-1.5 flex items-end justify-center gap-[3px]" aria-hidden>
            <span className="block size-1.5 rounded-full bg-primary/50 [animation:bounce_0.8s_ease-in-out_0s_infinite]" />
            <span className="block size-1.5 rounded-full bg-primary/50 [animation:bounce_0.8s_ease-in-out_0.18s_infinite]" />
            <span className="block size-1.5 rounded-full bg-primary/50 [animation:bounce_0.8s_ease-in-out_0.36s_infinite]" />
          </div>

          {/* On-device chip — pulsing dot is opacity-based (compositor), so it
              keeps blinking even while the WASM inference blocks the JS thread. */}
          <div className="mt-3 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">
              <span className="size-1.5 rounded-full bg-primary [animation:pulse_0.9s_ease-in-out_infinite]" aria-hidden />
              On-device AI · private
            </span>
          </div>

          {/*
           * Progress bar — the fill is driven by a CSS keyframe animating
           * transform: scaleX(). Because transform runs on the compositor
           * thread, the bar keeps filling smoothly through the WASM freeze
           * (unlike a width/React-driven bar, which would sit frozen).
           * It "trickles" toward ~90% and snaps to 100% only when done.
           */}
          <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-muted/80">
            <div
              className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-primary/70 via-primary to-primary/80 [will-change:transform]"
              style={
                isDone
                  ? { transform: "scaleX(1)", transition: "transform 0.4s ease-out" }
                  : { animation: "progress-trickle 18s cubic-bezier(0.08,0.7,0.15,1) forwards" }
              }
            />
            {/* Shimmer sweep — translateX = compositor */}
            <span
              className="absolute top-0 h-full w-16 bg-gradient-to-r from-transparent via-white/35 to-transparent [will-change:transform]"
              style={{ animation: "shimmer 1.6s linear 0.4s infinite" }}
              aria-hidden
            />
          </div>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            {stageHint(stage)}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
