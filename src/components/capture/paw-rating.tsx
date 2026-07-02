"use client";

import { cn } from "@/lib/utils";

export function PawRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
        {label}
      </span>
      <div className="flex gap-0.5" role="group" aria-label={`${label} rating`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} paws`}
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
