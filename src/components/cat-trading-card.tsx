import Image from "next/image";
import { CalendarDays, Cat, MapPin, PawPrint, Star } from "lucide-react";

import { CardScene } from "@/components/card-scene";
import {
  catStats,
  charmRating,
  dexNumber,
  personalityTitle,
  pickBiome,
  type Biome,
  type CatStat,
} from "@/lib/cat-stats";
import { rarityBanner, rarityFrame, rarityLabel } from "@/lib/rarity";
import type { Capture, Rarity } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type CatTradingCardProps = {
  name: string;
  stickerUrl: string;
  rarity?: Rarity | null;
  place?: string | null;
  caughtAt?: string | null;
  coat?: string | null;
  dex?: string | null;
  stats?: CatStat[] | null;
  personality?: string | null;
  charm?: number | null;
  biome?: Biome;
  size?: "sm" | "lg" | "tcg";
  priority?: boolean;
  unoptimizedSticker?: boolean;
  sparkle?: boolean;
};

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CharmStars({ value }: { value: number }) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5" aria-label={`Charm ${value}`}>
      <Star className="size-3 fill-legendary text-legendary" />
      <span className="text-[11px] font-bold text-foreground">{value.toFixed(1)}</span>
      <span className="sr-only">{full} full stars{hasHalf ? ", half" : ""}</span>
    </span>
  );
}

function PawBar({ value }: { value: number }) {
  return (
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
  );
}

function Chip({
  icon: Icon,
  children,
  compact,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-muted font-medium text-foreground",
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[11px]",
      )}
    >
      <Icon className={cn(compact ? "size-2.5" : "size-3", "text-muted-foreground")} />
      <span className="truncate">{children}</span>
    </span>
  );
}

export function CatTradingCard({
  name,
  stickerUrl,
  rarity = null,
  place,
  caughtAt,
  coat,
  dex,
  stats,
  personality,
  charm,
  biome = "meadow",
  size = "lg",
  priority,
  unoptimizedSticker,
  sparkle,
}: CatTradingCardProps) {
  const isTcg = size === "tcg";
  const isLg = size === "lg";
  const isEpic = rarity === "epic";
  const showLegendaryBorder = isEpic;

  return (
    <div
      className={cn(
        "bg-gradient-to-b shadow-lg",
        rarityFrame(rarity),
        showLegendaryBorder && "ring-2 ring-legendary/60",
        isTcg && "aspect-[5/7] w-[17.5rem] rounded-[1.25rem] p-1 shadow-xl",
        isLg && "rounded-[2rem] p-1.5 shadow-xl",
        !isLg && !isTcg && "rounded-3xl p-1",
      )}
    >
      <div
        className={cn(
          "flex flex-col bg-white/90",
          isTcg && "h-full gap-1 rounded-[1rem] p-1.5",
          isLg && "gap-2 rounded-[1.7rem] p-2",
          !isLg && !isTcg && "gap-1.5 rounded-[1.35rem] p-1.5",
        )}
      >
        {/* name banner */}
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-2 border-2 border-white",
            rarityBanner(rarity),
            isTcg && "rounded-lg px-2.5 py-1.5",
            isLg && "rounded-2xl px-3 py-2",
            !isLg && !isTcg && "rounded-xl px-2.5 py-1.5",
          )}
        >
          <span
            className={cn(
              "truncate font-extrabold text-foreground",
              isTcg && "text-sm",
              isLg && "text-base",
              !isLg && !isTcg && "text-sm",
            )}
          >
            {name}
          </span>
          {dex && (
            <span
              className={cn(
                "shrink-0 font-bold text-foreground/55",
                isTcg ? "text-[10px]" : isLg ? "text-xs" : "text-[10px]",
              )}
            >
              {dex}
            </span>
          )}
        </div>

        {/* art window */}
        <div
          className={cn(
            "relative min-h-0 overflow-hidden border-2 border-white",
            isTcg && "flex-1 rounded-lg",
            isLg && "rounded-2xl",
            !isLg && !isTcg && "rounded-xl",
          )}
        >
          <CardScene
            biome={biome}
            sparkle={sparkle ?? isEpic}
            className={cn(
              isTcg && "h-full min-h-0",
              isLg && "aspect-[4/5]",
              !isLg && !isTcg && "aspect-square",
            )}
          >
            <Image
              src={stickerUrl}
              alt={name}
              fill
              unoptimized={unoptimizedSticker}
              priority={priority}
              sizes={
                isTcg || isLg
                  ? "(max-width: 420px) 90vw, 360px"
                  : "(max-width: 420px) 45vw, 200px"
              }
              className={cn(
                "object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)] transition-transform",
                isTcg ? "p-3" : isLg ? "p-5" : "p-3",
              )}
            />
          </CardScene>

          {/* idle holographic shimmer on Epic cards */}
          {isEpic && (
            <span className="holo-idle pointer-events-none absolute inset-0" />
          )}

          {/* rarity ribbon */}
          <span
            className={cn(
              "absolute right-0 top-2 rounded-l-full border-y-2 border-l-2 border-white font-bold uppercase tracking-wide text-foreground",
              isEpic ? "bg-legendary text-foreground" : rarityBanner(rarity),
              isTcg ? "px-2 py-0.5 text-[9px]" : isLg ? "px-2.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[9px]",
            )}
          >
            {isEpic ? "Legendary" : rarityLabel(rarity)}
          </span>
        </div>

        {/* stats + meta (large / tcg only) */}
        {isTcg || isLg ? (
          <div
            className={cn(
              "shrink-0 rounded-2xl bg-white",
              isTcg ? "space-y-1 px-2 py-1.5" : "space-y-2 px-3 py-2.5",
            )}
          >
            {stats && stats.length > 0 && (
              <div className={cn(isTcg ? "space-y-0.5" : "space-y-1")}>
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between"
                  >
                    <span
                      className={cn(
                        "font-semibold text-muted-foreground",
                        isTcg ? "text-[10px]" : "text-xs",
                      )}
                    >
                      {s.label}
                    </span>
                    <PawBar value={s.value} />
                  </div>
                ))}
              </div>
            )}
            {(place || caughtAt || coat) && (
              <div className={cn("flex flex-wrap gap-1", isTcg ? "pt-0" : "gap-1.5 pt-0.5")}>
                {place && (
                  <Chip icon={MapPin} compact={isTcg}>
                    {place}
                  </Chip>
                )}
                {coat && (
                  <Chip icon={Cat} compact={isTcg}>
                    {coat}
                  </Chip>
                )}
                {caughtAt && (
                  <Chip icon={CalendarDays} compact={isTcg}>
                    {formatShortDate(caughtAt)}
                  </Chip>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-0.5 px-1.5 pb-1">
            {personality && (
              <p className="truncate text-[10px] text-muted-foreground">{personality}</p>
            )}
            {place && (
              <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                <MapPin className="size-3 shrink-0" />
                <span className="truncate">{place}</span>
              </p>
            )}
            {charm != null && (
              <div className="flex justify-end pt-0.5">
                <CharmStars value={charm} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Convenience wrapper that maps a stored Capture to the trading card. */
export function CaptureCard({
  capture,
  size = "sm",
  priority,
}: {
  capture: Capture;
  size?: "sm" | "lg" | "tcg";
  priority?: boolean;
}) {
  const place = [capture.city, capture.country].filter(Boolean).join(", ") || null;

  return (
    <CatTradingCard
      name={capture.nickname?.trim() || "Unnamed cat"}
      stickerUrl={capture.sticker_url}
      rarity={capture.rarity}
      place={place}
      caughtAt={capture.caught_at}
      coat={capture.coat_type}
      dex={dexNumber(capture.id)}
      stats={size === "lg" || size === "tcg" ? catStats(capture) : null}
      personality={size === "sm" ? personalityTitle(capture) : null}
      charm={size === "sm" ? charmRating(capture) : null}
      biome={pickBiome(capture)}
      size={size}
      priority={priority}
    />
  );
}
