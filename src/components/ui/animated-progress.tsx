"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Progress bar that animates its fill from 0 → value on mount.
 * Used in places where the value is server-rendered (so a plain CSS
 * transition never plays), giving the bar a visible "fill" movement.
 */
export function AnimatedProgress({
  value,
  trackClassName,
  barClassName,
  delay = 0.15,
  duration = 0.9,
}: {
  /** 0–100 */
  value: number;
  trackClassName?: string;
  barClassName?: string;
  delay?: number;
  duration?: number;
}) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("overflow-hidden rounded-full", trackClassName)}>
      <motion.div
        className={cn("h-full rounded-full", barClassName)}
        initial={{ width: "0%" }}
        animate={{ width: `${pct}%` }}
        transition={{ duration, ease: [0.25, 1, 0.5, 1], delay }}
      />
    </div>
  );
}
