"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

const PAWS = [1, 2, 3, 4, 5] as const;

export function PawRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Ratings are constrained to 1–5 (the server rejects 0), so arrow keys clamp
  // within that range and move focus to the newly selected paw.
  function setAndFocus(next: number) {
    const clamped = Math.min(5, Math.max(1, next));
    onChange(clamped);
    btnRefs.current[clamped - 1]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        event.preventDefault();
        setAndFocus(value + 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        event.preventDefault();
        setAndFocus(value - 1);
        break;
      case "Home":
        event.preventDefault();
        setAndFocus(1);
        break;
      case "End":
        event.preventDefault();
        setAndFocus(5);
        break;
    }
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
        {label}
      </span>
      <div
        className="flex gap-0.5"
        role="radiogroup"
        aria-label={`${label} rating, ${value} out of 5`}
        onKeyDown={handleKeyDown}
      >
        {PAWS.map((n, i) => (
          <button
            key={n}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={`${n} ${n === 1 ? "paw" : "paws"}`}
            tabIndex={n === value ? 0 : -1}
            onClick={() => onChange(n)}
            className={cn(
              "size-6 rounded-md text-sm transition-colors sm:size-7",
              n <= value
                ? "bg-primary/20 text-primary"
                : "bg-muted/60 text-muted-foreground/40",
            )}
          >
            🐾
          </button>
        ))}
      </div>
    </div>
  );
}
