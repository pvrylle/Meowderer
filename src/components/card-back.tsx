"use client";

import { CalendarDays, MapPin, PawPrint, RotateCcw, Sparkles, Zap } from "lucide-react";

import { BIOME_LABEL, type Biome, type CatStat } from "@/lib/cat-stats";
import { cardTheme } from "@/lib/card-theme";
import { rarityLabel } from "@/lib/rarity";
import type { Rarity } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

function PawMeter({
  value,
  fillClass,
  emptyClass,
  onDark,
}: {
  value: number;
  fillClass: string;
  emptyClass: string;
  onDark?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex size-5 items-center justify-center rounded-full",
            i < value ? fillClass : emptyClass,
          )}
        >
          <PawPrint
            className={cn(
              "size-3",
              i < value
                ? "fill-white text-white"
                : onDark
                  ? "text-white/20"
                  : "text-black/15",
            )}
          />
        </div>
      ))}
    </div>
  );
}

function StatRow({
  label,
  value,
  fillClass,
  emptyClass,
  onDark,
}: {
  label: string;
  value: number;
  fillClass: string;
  emptyClass: string;
  onDark?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 shadow-sm",
        onDark ? "epic-stat-row" : "bg-white/50",
      )}
    >
      <span
        className={cn(
          "text-xs font-black uppercase tracking-wide",
          onDark ? "text-white/80" : "text-foreground/75",
        )}
      >
        {label}
      </span>
      <PawMeter
        value={value}
        fillClass={fillClass}
        emptyClass={emptyClass}
        onDark={onDark}
      />
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

  const theme = cardTheme(rarity);
  const isLegendary = rarity === "legendary";
  const onDark = theme.textOnDark;

  return (
    <div className="relative h-full w-full">
      <div
        className={cn(
          "relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl",
          theme.shellClass ?? cn("bg-gradient-to-b", theme.shell),
        )}
      >
          <PawPrint
            className={cn(
              "pointer-events-none absolute right-3 top-20 size-9 rotate-12",
              theme.pattern,
            )}
          />
          <PawPrint
            className={cn(
              "pointer-events-none absolute bottom-24 left-3 size-7 -rotate-12",
              theme.pattern,
            )}
          />

          {/* Header */}
          <div
            className={cn(
              "relative shrink-0 bg-gradient-to-r px-3 py-2",
              theme.header,
            )}
          >
            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                {isLegendary && (
                  <Zap className="size-3.5 shrink-0 fill-yellow-300 text-yellow-300" />
                )}
                <span className="truncate text-sm font-black text-white drop-shadow">
                  {name}
                </span>
              </div>
              {dex && (
                <span className="shrink-0 rounded-full bg-black/25 px-2 py-0.5 text-[9px] font-bold text-white">
                  {dex}
                </span>
              )}
            </div>
          </div>

          {/* Rarity badge */}
          <div className="relative z-10 flex shrink-0 justify-center py-2">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md",
                theme.badge,
              )}
            >
              {isLegendary && <Sparkles className="size-3" />}
              <span>{rarityLabel(rarity)}</span>
              {biome && (
                <>
                  <span className="text-white/40">·</span>
                  <span className="text-white/90">{BIOME_LABEL[biome]}</span>
                </>
              )}
            </div>
          </div>

          {/* Field notes */}
          <div
            className={cn(
              "relative z-10 mx-2.5 shrink-0 rounded-xl p-2.5 shadow-sm",
              onDark
                ? "border border-white/10 bg-white/8 backdrop-blur-sm"
                : "bg-white/55",
            )}
          >
            <div className="mb-1 flex items-center gap-1">
              <PawPrint
                className={cn(
                  "size-3",
                  onDark ? "text-fuchsia-300/70" : "text-foreground/50",
                )}
              />
              <span
                className={cn(
                  "text-[9px] font-black uppercase tracking-widest",
                  onDark ? "text-fuchsia-200/70" : "text-foreground/50",
                )}
              >
                Field Notes
              </span>
            </div>
            <p
              className={cn(
                "line-clamp-4 text-[11px] leading-relaxed",
                onDark ? "text-white/75" : "text-foreground/80",
              )}
            >
              {bio}
            </p>
          </div>

          {/* Stats */}
          <div className="relative z-10 min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2.5 py-2">
            {stats.map((s) => (
              <StatRow
                key={s.label}
                label={s.label}
                value={s.value}
                fillClass={theme.statFill}
                emptyClass={theme.statEmpty}
                onDark={onDark}
              />
            ))}
          </div>

          {/* Footer */}
          <div
            className={cn(
              "relative z-10 flex shrink-0 items-center justify-between gap-2 px-3 py-2",
              theme.panelClass ?? cn("bg-gradient-to-b", theme.panel),
            )}
          >
            <div
              className={cn(
                "flex min-w-0 flex-wrap gap-2 text-[9px] font-semibold",
                onDark ? "text-white/55" : "text-foreground/60",
              )}
            >
              {place && (
                <span className="inline-flex max-w-[55%] items-center gap-0.5 truncate">
                  <MapPin className="size-3 shrink-0" />
                  {place}
                </span>
              )}
              {caught && (
                <span className="inline-flex items-center gap-0.5">
                  <CalendarDays className="size-3" />
                  {caught}
                </span>
              )}
            </div>

            <div
              className={cn(
                "flex shrink-0 items-center gap-1 text-[9px] font-semibold",
                onDark ? "text-white/45" : "text-foreground/50",
              )}
            >
              <RotateCcw className="size-3" />
              <span>Flip</span>
            </div>
          </div>
      </div>
    </div>
  );
}
