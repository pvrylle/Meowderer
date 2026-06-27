"use client";

import { useMemo, useState } from "react";

import { CatCard } from "@/components/cat-card";
import { RARITY_LABEL } from "@/lib/rarity";
import type { Capture, Rarity } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type RarityFilter = "all" | Rarity;

type CatDexGridProps = {
  captures: Capture[];
};

function uniqueSorted(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v?.trim())))].sort(
    (a, b) => a.localeCompare(b),
  );
}

export function CatDexGrid({ captures }: CatDexGridProps) {
  const [rarity, setRarity] = useState<RarityFilter>("all");
  const [coat, setCoat] = useState<string>("all");
  const [region, setRegion] = useState<string>("all");

  const coatOptions = useMemo(
    () => uniqueSorted(captures.map((c) => c.coat_type)),
    [captures],
  );
  const regionOptions = useMemo(
    () => uniqueSorted(captures.map((c) => c.country)),
    [captures],
  );

  const filtered = useMemo(() => {
    return captures.filter((c) => {
      if (rarity !== "all" && c.rarity !== rarity) return false;
      if (coat !== "all" && c.coat_type !== coat) return false;
      if (region !== "all" && c.country !== region) return false;
      return true;
    });
  }, [captures, rarity, coat, region]);

  const rarityChips: { key: RarityFilter; label: string }[] = [
    { key: "all", label: "All" },
    ...(Object.entries(RARITY_LABEL) as [Rarity, string][]).map(([key, label]) => ({
      key,
      label,
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {rarityChips.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRarity(key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                rarity === key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {(coatOptions.length > 0 || regionOptions.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {coatOptions.length > 0 && (
              <select
                value={coat}
                onChange={(e) => setCoat(e.target.value)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground"
                aria-label="Filter by coat"
              >
                <option value="all">All coats</option>
                {coatOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
            {regionOptions.length > 0 && (
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground"
                aria-label="Filter by region"
              >
                <option value="all">All regions</option>
                {regionOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
          No cats match these filters.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((capture, i) => (
            <CatCard
              key={capture.id}
              capture={capture}
              priority={i < 2 && rarity === "all" && coat === "all" && region === "all"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
