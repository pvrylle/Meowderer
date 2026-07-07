"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Tap-to-toggle tooltip — works on mobile (tap) and desktop (hover).
 * Uses a fixed-position bubble measured at runtime so it never overflows
 * the viewport regardless of where the badge sits in the layout.
 */
export function InfoTip({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [bubbleStyle, setBubbleStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);

  // Measure badge position and compute a safe fixed bubble position
  function calcBubbleStyle() {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const BUBBLE_W = 176; // 11rem
    const GAP = 6;

    // Horizontal: center on badge, then clamp to viewport with 8px margin
    let left = r.left + r.width / 2 - BUBBLE_W / 2;
    const margin = 8;
    left = Math.max(margin, Math.min(left, window.innerWidth - BUBBLE_W - margin));

    // Vertical: below badge
    const top = r.bottom + GAP;

    setBubbleStyle({ position: "fixed", top, left, width: BUBBLE_W });
  }

  function open_() {
    calcBubbleStyle();
    setOpen(true);
  }

  // Close on outside tap/click
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  // Close on Escape or scroll
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleScroll() { setOpen(false); }
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className={cn("relative inline-flex", className)}>
      {/* Badge */}
      <button
        ref={btnRef}
        type="button"
        aria-label="More info"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : open_())}
        onMouseEnter={open_}
        onMouseLeave={() => setOpen(false)}
        className={cn(
          "inline-flex size-4 cursor-pointer items-center justify-center rounded-full text-[9px] font-bold transition-colors",
          open
            ? "bg-primary/20 text-primary"
            : "bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary",
        )}
      >
        i
      </button>

      {/* Bubble — fixed so it's never clipped by overflow:hidden parents */}
      {open && (
        <span
          role="tooltip"
          style={bubbleStyle}
          className="z-[9999] rounded-xl border border-border/60 bg-card px-3 py-2 text-[11px] leading-relaxed text-foreground shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
