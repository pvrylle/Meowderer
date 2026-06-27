"use client";

import { useMemo, useState } from "react";

import { CatCard } from "@/components/cat-card";
import { DexPlaceholderCard } from "@/components/dex-placeholder-card";
import { isRareOrEpic } from "@/lib/xp";
import type { Capture } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type StatusFilter =
  | "all"
  | "photographed"
  | "geotagged"
  | "rare"
  | "helped"
  | "rescued";

type CatDexGridProps = {
  captures: Capture[];
  helpedIds?: string[];
  rescuedIds?: string[];
};

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "photographed", label: "Photographed" },
  { key: "geotagged", label: "Geotagged" },
  { key: "rare", label: "Rare+" },
  { key: "helped", label: "Helped" },
  { key: "rescued", label: "Rescued" },
];

function filterByStatus(
  captures: Capture[],
  status: StatusFilter,
  helpedSet: Set<string>,
  rescuedSet: Set<string>,
): Capture[] {
  switch (status) {
    case "photographed":
      return captures;
    case "geotagged":
      return captures.filter((c) => c.lat != null && c.lng != null);
    case "rare":
      return captures.filter((c) => c.rarity && isRareOrEpic(c.rarity));
    case "helped":
      return captures.filter((c) => helpedSet.has(c.id));
    case "rescued":
      return captures.filter((c) => rescuedSet.has(c.id));
    default:
      return captures;
  }
}

export function CatDexGrid({
  captures,
  helpedIds = [],
  rescuedIds = [],
}: CatDexGridProps) {
  const [status, setStatus] = useState<StatusFilter>("all");

  const helpedSet = useMemo(() => new Set(helpedIds), [helpedIds]);
  const rescuedSet = useMemo(() => new Set(rescuedIds), [rescuedIds]);

  const filtered = useMemo(
    () => filterByStatus(captures, status, helpedSet, rescuedSet),
    [captures, status, helpedSet, rescuedSet],
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
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
          {status === "helped"
            ? "No helped cats yet — visit a shelter on the map or check in nearby."
            : status === "rescued"
              ? "No rescue stories yet — share a catch as a rescue story from its detail page."
              : "No cats match this filter."}
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
