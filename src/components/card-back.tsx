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
        "flex h-full flex-col rounded-[2rem] bg-gradient-to-b p-1.5 shadow-xl",
        rarityFrame(rarity),
      )}
    >
      <div className="flex h-full flex-col gap-3 rounded-[1.7rem] bg-white/92 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-base font-extrabold text-foreground">
            {name}
          </span>
          {dex && (
            <span className="shrink-0 text-xs font-bold text-foreground/55">
              {dex}
            </span>
          )}
        </div>

        <div
          className={cn(
            "rounded-2xl border-2 border-white px-3 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-foreground",
            rarityBanner(rarity),
          )}
        >
          {rarityLabel(rarity)}
          {biome ? ` · ${BIOME_LABEL[biome]}` : ""}
        </div>

        <div className="flex flex-1 flex-col justify-center gap-3">
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              <PawPrint className="size-3" />
              Field notes
            </p>
            <p className="text-sm leading-relaxed text-foreground/80">{bio}</p>
          </div>

          <div className="space-y-1.5 rounded-2xl bg-muted/60 p-3">
            {stats.map((s) => (
              <PawRow key={s.label} label={s.label} value={s.value} />
            ))}
            <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-muted-foreground">
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

        <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
          <RotateCcw className="size-3" />
          Tap to flip back
        </p>
      </div>
    </div>
  );
}
