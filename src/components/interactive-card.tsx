"use client";

import { useCallback, useRef, useState } from "react";

import { cardHoloProfile } from "@/lib/card-holo";
import type { Rarity } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const FLIP_TRANSITION = "transform 550ms cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Wraps a trading card with 3D tilt, a moving light glare and (optionally) a
 * holographic sheen. Tapping flips to `back` if provided.
 */
export function InteractiveCard({
  children,
  back,
  holoRarity = null,
  radiusClassName = "rounded-[2rem]",
  className,
}: {
  children: React.ReactNode;
  back?: React.ReactNode;
  holoRarity?: Rarity | null;
  radiusClassName?: string;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pressed = useRef(false);
  const dragged = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const [flipped, setFlipped] = useState(false);

  const canFlip = Boolean(back);
  const holo = cardHoloProfile(holoRarity);

  const apply = useCallback((clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const max = 8;
      el.style.setProperty("--rx", `${(0.5 - py) * 2 * max}deg`);
      el.style.setProperty("--ry", `${(px - 0.5) * 2 * max}deg`);
      el.style.setProperty("--mx", `${Math.max(0, Math.min(1, px)) * 100}%`);
      el.style.setProperty("--my", `${Math.max(0, Math.min(1, py)) * 100}%`);
      el.style.setProperty("--glow", "1");
      el.style.setProperty("--tilt-ease", "transform 80ms linear");
    });
  }, []);

  const reset = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--glow", "0");
    el.style.setProperty("--tilt-ease", "transform 350ms ease-out");
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      pressed.current = true;
      dragged.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture?.(e.pointerId);
      if (e.pointerType !== "mouse") apply(e.clientX, e.clientY);
    },
    [apply],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const isMouse = e.pointerType === "mouse";
      if (!pressed.current && !isMouse) return;
      if (pressed.current) {
        const dx = e.clientX - start.current.x;
        const dy = e.clientY - start.current.y;
        if (Math.hypot(dx, dy) > 6) dragged.current = true;
      }
      apply(e.clientX, e.clientY);
    },
    [apply],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const wasPressed = pressed.current;
      pressed.current = false;
      if (wasPressed && canFlip && !dragged.current) {
        setFlipped((f) => !f);
      }
      if (e.pointerType !== "mouse") reset();
    },
    [canFlip, reset],
  );

  const onPointerCancel = useCallback(() => {
    pressed.current = false;
    reset();
  }, [reset]);

  const onPointerLeave = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse") reset();
    },
    [reset],
  );

  const glareColor = holo
    ? `rgba(${holo.glareRgb}, 0.55)`
    : "rgba(255,255,255,0.55)";

  return (
    <div className={cn("overflow-hidden [perspective:1200px]", className)}>
      <div
        ref={wrapRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerLeave}
        className={cn(
          "relative [transform-style:preserve-3d] select-none",
          canFlip && "cursor-pointer",
        )}
        style={{
          transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
          transition: "var(--tilt-ease, transform 350ms ease-out)",
          willChange: "transform",
          touchAction: "none",
        }}
      >
        <div
          className="relative [transform-style:preserve-3d]"
          style={{
            transform: `rotateY(${flipped ? 180 : 0}deg)`,
            transition: FLIP_TRANSITION,
          }}
        >
          <div
            className="card-flip-face relative"
            style={{ transform: "rotateY(0deg) translateZ(1px)" }}
          >
            {children}

            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0",
                radiusClassName,
              )}
              style={{
                background: `radial-gradient(circle at var(--mx, 50%) var(--my, 50%), ${glareColor}, transparent 42%)`,
                opacity: "var(--glow, 0)",
                transition: "opacity 300ms ease",
                mixBlendMode: "soft-light",
              }}
            />

            {holo && (
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 holo-tilt-base",
                  holo.tiltClass,
                  radiusClassName,
                )}
              />
            )}
          </div>

          {canFlip && (
            <div
              className="card-flip-face absolute inset-0 overflow-hidden"
              style={{ transform: "rotateY(180deg) translateZ(1px)" }}
            >
              {back}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
