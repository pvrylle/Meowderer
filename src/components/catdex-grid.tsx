"use client";

import { useMemo, useState } from "react";

import { CatCard } from "@/components/cat-card";
import { DexPlaceholderCard } from "@/components/dex-placeholder-card";
import { isRareOrEpic } from "@/lib/xp";
import type { Capture } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "seen" | "geotagged" | "rare";

type CatDexGridProps = {
  captures: Capture[];
  seenIds?: string[];
  helpedIds?: string[];
  rescuedIds?: string[];
};

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "seen", label: "Seen" },
  { key: "geotagged", label: "Geotagged" },
  { key: "rare", label: "Rare+" },
];

function filterCaptures(
  captures: Capture[],
  status: StatusFilter,
  seenSet: Set<string>,
): Capture[] {
  switch (status) {
    case "seen":
      return captures.filter((c) => seenSet.has(c.id));
    case "geotagged":
      return captures.filter((c) => c.lat != null && c.lng != null);
    case "rare":
      return captures.filter((c) => c.rarity && isRareOrEpic(c.rarity));
    default:
      return captures;
  }
}

export function CatDexGrid({
  captures,
  seenIds = [],
}: CatDexGridProps) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const seenSet = useMemo(() => new Set(seenIds), [seenIds]);

  const filtered = useMemo(
    () => filterCaptures(captures, status, seenSet),
    [captures, status, seenSet],
  );

  const placeholderCount =
    captures.length < 6 ? Math.min(4, 6 - captures.length) : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              status === key
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No cats match this filter
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
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
                key={`ph-${i}`}
                variant={i % 2 === 0 ? "explore" : "undiscovered"}
              />
            ))}
        </div>
      )}
    </div>
  );
}
