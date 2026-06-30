"use client";

import { useCallback, useId, useRef, useState } from "react";
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

type PopPaw = {
  id: number;
  x: number;
  y: number;
  rotate: number;
};

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
const MAX_TRAIL = 32;

export function InteractivePawField({
  children,
  className,
  contentClassName,
  density = "normal",
  trail = true,
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  density?: "normal" | "sparse";
  trail?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const fieldId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const lastTrailRef = useRef({ x: 0, y: 0, t: 0 });
  const lastAngleRef = useRef(0);
  const trailToneRef = useRef(0);
  const [pops, setPops] = useState<PopPaw[]>([]);
  const [trails, setTrails] = useState<TrailPaw[]>([]);
  const paws = density === "sparse" ? PAWS.slice(0, 4) : PAWS;

  const popAt = useCallback(
    (x: number, y: number) => {
      if (reduceMotion) return;
      const id = Date.now() + Math.random();
      const rotate = Math.round(Math.random() * 60 - 30);
      setPops((prev) => [...prev, { id, x, y, rotate }]);
      window.setTimeout(
        () => setPops((prev) => prev.filter((p) => p.id !== id)),
        700,
      );
    },
    [reduceMotion],
  );

  const dropTrailPaw = useCallback(
    (clientX: number, clientY: number) => {
      if (reduceMotion || !trail) return;
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

      const id = now + Math.random();
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
            size: 14 + Math.round(Math.random() * 6),
          },
        ];
        return next.length > MAX_TRAIL ? next.slice(-MAX_TRAIL) : next;
      });

      window.setTimeout(
        () => setTrails((prev) => prev.filter((p) => p.id !== id)),
        2400,
      );
    },
    [reduceMotion, trail],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      dropTrailPaw(e.clientX, e.clientY);
    },
    [dropTrailPaw],
  );

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      onPointerMove={trail && !reduceMotion ? handlePointerMove : undefined}
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
              animate={{ opacity: [0, 0.38, 0.22, 0], scale: [0.45, 1, 0.95, 0.85] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: "easeOut" }}
            >
              <PawPrint
                style={{ width: t.size, height: t.size }}
                strokeWidth={2.25}
              />
            </motion.span>
          ))}
        </AnimatePresence>

        {paws.map((paw) => (
          <motion.button
            key={`${fieldId}-${paw.id}`}
            type="button"
            tabIndex={-1}
            aria-hidden
            className={cn(
              "pointer-events-auto absolute opacity-[0.18] transition-opacity hover:opacity-40 active:opacity-55",
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
                ? { opacity: 0.18, scale: 1 }
                : {
                    opacity: 0.18,
                    scale: 1,
                    y: [0, -5, 0],
                    rotate: [paw.rotate, paw.rotate + 6, paw.rotate],
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
            whileHover={reduceMotion ? undefined : { scale: 1.15, opacity: 0.42 }}
            whileTap={reduceMotion ? undefined : { scale: 0.88 }}
            onClick={(e) => {
              e.stopPropagation();
              const rect = rootRef.current?.getBoundingClientRect();
              if (!rect) return;
              popAt(
                ((e.clientX - rect.left) / rect.width) * 100,
                ((e.clientY - rect.top) / rect.height) * 100,
              );
            }}
          >
            <PawPrint
              style={{ width: paw.size, height: paw.size }}
              strokeWidth={2.25}
            />
          </motion.button>
        ))}

        <AnimatePresence>
          {pops.map((pop) => (
            <motion.span
              key={pop.id}
              className="pointer-events-none absolute text-primary"
              style={{
                left: `${pop.x}%`,
                top: `${pop.y}%`,
                rotate: `${pop.rotate}deg`,
              }}
              initial={{ opacity: 0.55, scale: 0.4, x: "-50%", y: "-50%" }}
              animate={{ opacity: 0, scale: 1.6, y: "-120%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            >
              <PawPrint className="size-5" strokeWidth={2.5} />
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </div>
  );
}
