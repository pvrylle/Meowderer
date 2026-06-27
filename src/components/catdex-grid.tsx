"use client";

import { useMemo, useState } from "react";

import { CatCard } from "@/components/cat-card";
import { DexPlaceholderCard } from "@/components/dex-placeholder-card";
import { isRareOrEpic } from "@/lib/xp";
import type { Capture } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "photographed" | "geotagged" | "rare";

type CatDexGridProps = {
  captures: Capture[];
};

const STATUS_TABS: { key: StatusFilter; label: string; disabled?: boolean }[] = [
  { key: "all", label: "All" },
  { key: "photographed", label: "Photographed" },
  { key: "geotagged", label: "Geotagged" },
  { key: "rare", label: "Rare+" },
];

const TEASER_TABS = [
  { label: "Helped", disabled: true },
  { label: "Rescued", disabled: true },
];

function filterByStatus(captures: Capture[], status: StatusFilter): Capture[] {
  switch (status) {
    case "photographed":
      return captures;
    case "geotagged":
      return captures.filter((c) => c.lat != null && c.lng != null);
    case "rare":
      return captures.filter((c) => c.rarity && isRareOrEpic(c.rarity));
    default:
      return captures;
  }
}

export function CatDexGrid({ captures }: CatDexGridProps) {
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(
    () => filterByStatus(captures, status),
    [captures, status],
  );

  const placeholderCount =
    captures.length < 6 ? Math.min(4, 6 - captures.length) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
              status === key
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
        {TEASER_TABS.map(({ label }) => (
          <button
            key={label}
            type="button"
            disabled
            title="Coming with Community"
            className="shrink-0 cursor-not-allowed rounded-full border border-dashed border-border bg-muted/40 px-3 py-1.5 text-xs font-bold text-muted-foreground/60"
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
          No cats match this filter.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((capture, i) => (
            <CatCard
              key={capture.id}
              capture={capture}
              priority={i < 2 && status === "all"}
            />
          ))}
          {status === "all" &&
            Array.from({ length: placeholderCount }).map((_, i) => (
              <DexPlaceholderCard
                key={`placeholder-${i}`}
                variant={i % 2 === 0 ? "explore" : "undiscovered"}
              />
            ))}
        </div>
      )}
    </div>
  );
}
