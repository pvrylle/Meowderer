"use client";

import { motion } from "framer-motion";

import { BrandMark } from "@/components/brand-mark";
import type { CaptureProgress } from "@/lib/capture/pipeline";
import { cn } from "@/lib/utils";

function stageHint(stage: CaptureProgress["stage"] | undefined): string {
  switch (stage) {
    case "compressing":
      return "First run downloads models — later runs are faster";
    case "removing":
      return "AI is cutting out the background on your phone";
    case "refining":
      return "Sharpening fur and cleaning edges";
    case "outlining":
      return "Adding the collectible sticker frame";
    case "finishing":
      return "Almost ready…";
    case "done":
      return "Done!";
    default:
      return "This stays on your device — nothing is uploaded yet";
  }
}

export function CatchProcessingOverlay({
  progress,
  className,
}: {
  progress: CaptureProgress | null;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, progress?.pct ?? 0));
  const label = progress?.label ?? "Processing…";

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
          <div className="relative mx-auto mb-5 size-[4.5rem]">
            <svg
              className="absolute inset-0 size-full -rotate-90"
              viewBox="0 0 36 36"
              aria-hidden
            >
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                className="stroke-primary/15"
                strokeWidth="2.5"
              />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                className="stroke-primary transition-all duration-500 ease-out"
                strokeWidth="2.5"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={`${pct} ${100 - pct}`}
              />
            </svg>
            <div className="absolute inset-0 m-auto flex size-14 items-center justify-center rounded-2xl bg-primary/12 ring-1 ring-primary/15">
              <BrandMark variant="icon" size={40} />
            </div>
          </div>

          <p className="text-center text-sm font-semibold text-foreground">
            {label}
          </p>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted/80">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          </div>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            {stageHint(progress?.stage)}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
