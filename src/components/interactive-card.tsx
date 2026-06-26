"use client";

import { useCallback, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Wraps a trading card with 3D tilt, a moving light glare and (optionally) a
 * holographic sheen. Tapping flips to `back` if provided.
 *
 * Input model:
 * - Mouse: tilt follows hover.
 * - Touch / pen: tilt follows the finger while pressed (drag to tilt); a quick
 *   tap (no drag) flips. `touch-action: none` lets the card own the gesture.
 *
 * Tilt/glare are written straight to the DOM via CSS variables inside a
 * requestAnimationFrame, so movement never triggers a React re-render.
 */
export function InteractiveCard({
  children,
  back,
  holo = false,
  radiusClassName = "rounded-[2rem]",
  className,
}: {
  children: React.ReactNode;
  back?: React.ReactNode;
  holo?: boolean;
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

  const apply = useCallback((clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const max = 10;
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
      // Touch/pen only tilt while pressed; mouse tilts on hover.
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

  return (
    <div className={cn("[perspective:1200px]", className)}>
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
            transition: "transform 550ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {/* Front face */}
          <div className="relative [backface-visibility:hidden]">
            {children}

            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0",
                radiusClassName,
              )}
              style={{
                background:
                  "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.55), transparent 42%)",
                opacity: "var(--glow, 0)",
                transition: "opacity 300ms ease",
                mixBlendMode: "soft-light",
              }}
            />

            {holo && (
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0",
                  radiusClassName,
                )}
                style={{
                  backgroundImage:
                    "linear-gradient(115deg, transparent 18%, rgba(255,110,210,0.38), rgba(90,210,255,0.38), rgba(180,130,255,0.38), transparent 82%)",
                  backgroundSize: "200% 200%",
                  backgroundPosition: "var(--mx, 50%) var(--my, 50%)",
                  mixBlendMode: "color-dodge",
                  opacity: "calc(var(--glow, 0) * 0.85)",
                  transition: "opacity 300ms ease",
                }}
              />
            )}
          </div>

          {/* Back face */}
          {canFlip && (
            <div
              className="absolute inset-0 [backface-visibility:hidden]"
              style={{ transform: "rotateY(180deg)" }}
            >
              {back}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
