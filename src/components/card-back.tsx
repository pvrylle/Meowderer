import { CalendarDays, MapPin, PawPrint, RotateCcw } from "lucide-react";

import { BIOME_LABEL, type Biome, type CatStat } from "@/lib/cat-stats";
import { rarityBanner, rarityFrame, rarityLabel } from "@/lib/rarity";
import type { Rarity } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

function PawRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="flex gap-0.5" aria-label={`${value} of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <PawPrint
            key={i}
            className={cn(
              "size-3.5",
              i < value ? "fill-primary text-primary" : "text-muted-foreground/30",
            )}
          />
        ))}
      </span>
    </div>
  );
}

/** Reverse side of the trading card: bio + field notes. Fills its parent box. */
export function CardBack({
  name,
  dex,
  rarity = null,
  biome,
  bio,
  stats,
  place,
  caughtAt,
}: {
  name: string;
  dex?: string | null;
  rarity?: Rarity | null;
  biome?: Biome;
  bio: string;
  stats: CatStat[];
  place?: string | null;
  caughtAt?: string | null;
}) {
  const caught = caughtAt
    ? new Date(caughtAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-[1.25rem] bg-gradient-to-b p-1 shadow-xl",
        rarityFrame(rarity),
      )}
    >
      <div className="flex h-full flex-col gap-2 rounded-[1rem] bg-white/92 p-2">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-extrabold text-foreground">
            {name}
          </span>
          {dex && (
            <span className="shrink-0 text-[10px] font-bold text-foreground/55">
              {dex}
            </span>
          )}
        </div>

        <div
          className={cn(
            "rounded-lg border-2 border-white px-2 py-1 text-center text-[9px] font-bold uppercase tracking-wide text-foreground",
            rarityBanner(rarity),
          )}
        >
          {rarityLabel(rarity)}
          {biome ? ` · ${BIOME_LABEL[biome]}` : ""}
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center gap-2">
          <div className="space-y-1">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              <PawPrint className="size-2.5" />
              Field notes
            </p>
            <p className="line-clamp-4 text-xs leading-relaxed text-foreground/80">
              {bio}
            </p>
          </div>

          <div className="space-y-1 rounded-xl bg-muted/60 p-2">
            {stats.map((s) => (
              <PawRow key={s.label} label={s.label} value={s.value} />
            ))}
            <div className="flex flex-wrap gap-2 pt-0.5 text-[10px] text-muted-foreground">
              {place && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" />
                  {place}
                </span>
              )}
              {caught && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3" />
                  {caught}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="flex shrink-0 items-center justify-center gap-1 text-[10px] text-muted-foreground">
          <RotateCcw className="size-3" />
          Tap to flip back
        </p>
      </div>
    </div>
  );
}
