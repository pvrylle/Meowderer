"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PawPrint } from "lucide-react";

import { cn } from "@/lib/utils";

type PawTone = "primary" | "green" | "orange" | "muted";

type PawSpot = {
  id: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  rotate: number;
  size: number;
  tone: PawTone;
  delay: number;
};

const TONE_CLASS: Record<PawTone, string> = {
  primary: "text-primary",
  green: "text-green",
  orange: "text-orange",
  muted: "text-muted-foreground",
};

const PAWS: PawSpot[] = [
  { id: "tl", top: "6%", left: "5%", rotate: -28, size: 26, tone: "primary", delay: 0 },
  { id: "tr", top: "10%", right: "7%", rotate: 18, size: 22, tone: "green", delay: 0.4 },
  { id: "ml", top: "38%", left: "3%", rotate: 12, size: 20, tone: "muted", delay: 0.8 },
  { id: "mr", top: "52%", right: "4%", rotate: -14, size: 24, tone: "orange", delay: 1.1 },
  { id: "bl", bottom: "14%", left: "8%", rotate: 22, size: 22, tone: "green", delay: 0.6 },
  { id: "br", bottom: "10%", right: "6%", rotate: -20, size: 28, tone: "primary", delay: 1.4 },
];

const TRAIL_TONES: PawTone[] = ["primary", "green", "orange", "muted"];

/** Percent coords — cats wander these paths on auto mode. */
const AUTO_PATHS: { x: number; y: number }[][] = [
  [
    { x: 10, y: 86 },
    { x: 24, y: 72 },
    { x: 42, y: 58 },
    { x: 58, y: 44 },
    { x: 78, y: 30 },
    { x: 90, y: 18 },
  ],
  [
    { x: 90, y: 84 },
    { x: 74, y: 68 },
    { x: 56, y: 54 },
    { x: 38, y: 40 },
    { x: 22, y: 26 },
    { x: 10, y: 14 },
  ],
  [
    { x: 48, y: 92 },
    { x: 34, y: 74 },
    { x: 52, y: 56 },
    { x: 38, y: 38 },
    { x: 54, y: 22 },
    { x: 46, y: 10 },
  ],
];

type TrailPaw = {
  id: number;
  x: number;
  y: number;
  rotate: number;
  tone: PawTone;
  size: number;
};

const MIN_TRAIL_PX = 26;
const MIN_TRAIL_MS = 55;
const MAX_TRAIL = 36;
const AUTO_TRAIL_MS = 340;

export type PawTrailMode = "none" | "pointer" | "auto";

export function InteractivePawField({
  children,
  className,
  contentClassName,
  density = "normal",
  trailMode = "pointer",
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  density?: "normal" | "sparse";
  /** `auto` = ambient wandering paws; `pointer` = follow cursor; `none` = off */
  trailMode?: PawTrailMode;
}) {
  const reduceMotion = useReducedMotion();
  const fieldId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const lastTrailRef = useRef({ x: 0, y: 0, t: 0 });
  const lastAngleRef = useRef(0);
  const trailToneRef = useRef(0);
  const autoWalkerRef = useRef({ path: 0, step: 0, sub: 0 });
  const [trails, setTrails] = useState<TrailPaw[]>([]);
  const paws = density === "sparse" ? PAWS.slice(0, 4) : PAWS;

  const addTrailAtPercent = useCallback(
    (x: number, y: number, rotate: number) => {
      if (reduceMotion) return;
      const id = Date.now() + Math.random();
      const tone = TRAIL_TONES[trailToneRef.current % TRAIL_TONES.length];
      trailToneRef.current += 1;

      setTrails((prev) => {
        const next = [
          ...prev,
          {
            id,
            x,
            y,
            rotate,
            tone,
            size: 13 + Math.round(Math.random() * 7),
          },
        ];
        return next.length > MAX_TRAIL ? next.slice(-MAX_TRAIL) : next;
      });

      window.setTimeout(
        () => setTrails((prev) => prev.filter((p) => p.id !== id)),
        2600,
      );
    },
    [reduceMotion],
  );

  const dropPointerTrail = useCallback(
    (clientX: number, clientY: number) => {
      if (reduceMotion || trailMode !== "pointer") return;
      const root = rootRef.current;
      if (!root) return;

      const rect = root.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return;
      }

      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      const now = Date.now();
      const last = lastTrailRef.current;
      const dx = clientX - last.x;
      const dy = clientY - last.y;
      const dist = Math.hypot(dx, dy);

      if (dist < MIN_TRAIL_PX && now - last.t < MIN_TRAIL_MS) return;

      const angle =
        dist > 0.5
          ? (Math.atan2(dy, dx) * 180) / Math.PI + 90
          : lastAngleRef.current;
      const rotate = angle + (Math.random() * 16 - 8);
      lastAngleRef.current = angle;
      lastTrailRef.current = { x: clientX, y: clientY, t: now };

      addTrailAtPercent(x, y, rotate);
    },
    [addTrailAtPercent, reduceMotion, trailMode],
  );

  useEffect(() => {
    if (trailMode !== "auto" || reduceMotion) return;

    const tick = () => {
      const walker = autoWalkerRef.current;
      const path = AUTO_PATHS[walker.path % AUTO_PATHS.length];
      const nextStep = (walker.step + 1) % path.length;
      const a = path[walker.step];
      const b = path[nextStep];
      const t = walker.sub / 4;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      const rotate =
        (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI +
        90 +
        (Math.random() * 12 - 6);

      addTrailAtPercent(x, y, rotate);

      walker.sub += 1;
      if (walker.sub >= 4) {
        walker.sub = 0;
        walker.step = nextStep;
        if (walker.step === 0) walker.path += 1;
      }
    };

    tick();
    const id = window.setInterval(tick, AUTO_TRAIL_MS);
    return () => window.clearInterval(id);
  }, [addTrailAtPercent, reduceMotion, trailMode]);

  const staticInteractive = trailMode === "pointer";

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      onPointerMove={
        trailMode === "pointer" && !reduceMotion
          ? (e) => dropPointerTrail(e.clientX, e.clientY)
          : undefined
      }
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <AnimatePresence>
          {trails.map((t) => (
            <motion.span
              key={`trail-${t.id}`}
              className={cn("absolute", TONE_CLASS[t.tone])}
              style={{
                left: `${t.x}%`,
                top: `${t.y}%`,
                rotate: `${t.rotate}deg`,
              }}
              initial={{ opacity: 0, scale: 0.45, x: "-50%", y: "-50%" }}
              animate={{
                opacity: [0, 0.36, 0.2, 0],
                scale: [0.45, 1, 0.95, 0.85],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.4, ease: "easeOut" }}
            >
              <PawPrint
                style={{ width: t.size, height: t.size }}
                strokeWidth={2.25}
              />
            </motion.span>
          ))}
        </AnimatePresence>

        {paws.map((paw) => {
          const PawShell = staticInteractive ? motion.button : motion.div;
          return (
            <PawShell
              key={`${fieldId}-${paw.id}`}
              {...(staticInteractive
                ? {
                    type: "button" as const,
                    tabIndex: -1,
                    onClick: (e: React.MouseEvent) => {
                      e.stopPropagation();
                      const rect = rootRef.current?.getBoundingClientRect();
                      if (!rect) return;
                      addTrailAtPercent(
                        ((e.clientX - rect.left) / rect.width) * 100,
                        ((e.clientY - rect.top) / rect.height) * 100,
                        paw.rotate + (Math.random() * 20 - 10),
                      );
                    },
                  }
                : {})}
              aria-hidden
              className={cn(
                "absolute opacity-[0.16]",
                staticInteractive &&
                  "pointer-events-auto transition-opacity hover:opacity-35 active:opacity-50",
                TONE_CLASS[paw.tone],
              )}
              style={{
                top: paw.top,
                left: paw.left,
                right: paw.right,
                bottom: paw.bottom,
                rotate: `${paw.rotate}deg`,
              }}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
              animate={
                reduceMotion
                  ? { opacity: 0.16, scale: 1 }
                  : {
                      opacity: 0.16,
                      scale: 1,
                      y: [0, -4, 0],
                      rotate: [paw.rotate, paw.rotate + 5, paw.rotate],
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0.2 }
                  : {
                      opacity: { duration: 0.4, delay: paw.delay },
                      scale: {
                        type: "spring",
                        stiffness: 260,
                        damping: 18,
                        delay: paw.delay,
                      },
                      y: {
                        duration: 4.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: paw.delay,
                      },
                      rotate: {
                        duration: 5.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: paw.delay,
                      },
                    }
              }
              whileHover={
                staticInteractive && !reduceMotion
                  ? { scale: 1.12, opacity: 0.32 }
                  : undefined
              }
              whileTap={
                staticInteractive && !reduceMotion ? { scale: 0.9 } : undefined
              }
            >
              <PawPrint
                style={{ width: paw.size, height: paw.size }}
                strokeWidth={2.25}
              />
            </PawShell>
          );
        })}
      </div>

      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </div>
  );
}
