import Image from "next/image";
import { MapPin, Star } from "lucide-react";

import { CardScene } from "@/components/card-scene";
import { catStats, charmRating, dexNumber, personalityTitle, pickBiome, type Biome, type CatStat } from "@/lib/cat-stats";
import { capturePlaceLabel } from "@/lib/capture-place";
import { rarityLabel } from "@/lib/rarity";
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
  stickerScale?: number;
  className?: string;
};

const RARITY_COLORS: Record<string, string> = {
  common: "bg-[#e8e8e8]",
  uncommon: "bg-[#d4f0dc]",
  rare: "bg-[#d4e8f7]",
  epic: "bg-[#e8dff7]",
  legendary: "bg-[#faecd0]",
};

const RARITY_ACCENT: Record<string, string> = {
  common: "text-[#888]",
  uncommon: "text-green",
  rare: "text-[#4a90c2]",
  epic: "text-primary",
  legendary: "text-[#c9a030]",
};

export function CatTradingCard({
  name,
  stickerUrl,
  rarity = null,
  place,
  dex,
  stats,
  personality,
  charm,
  biome = "meadow",
  size = "lg",
  priority,
  unoptimizedSticker,
  sparkle,
  stickerScale = 1,
  className,
}: CatTradingCardProps) {
  const isTcg = size === "tcg";
  const isLg = size === "lg";
  const rarityKey = rarity ?? "common";
  const isEpic = rarity === "epic" || rarity === "legendary";

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl bg-white",
        isTcg && "aspect-[5/7] w-[17.5rem] p-2",
        isLg && "p-2.5",
        !isLg && !isTcg && "p-1.5",
        className,
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 rounded-lg px-2.5 py-1.5",
          RARITY_COLORS[rarityKey],
        )}
      >
        <span className="truncate text-sm font-semibold text-foreground">
          {name}
        </span>
        {dex && (
          <span className="shrink-0 text-[10px] font-medium text-foreground/50">
            {dex}
          </span>
        )}
      </div>

      {/* Art */}
      <div
        className={cn(
          "relative overflow-hidden rounded-lg",
          isTcg && "mt-1.5 flex-1",
          isLg && "mt-2 aspect-[4/5] w-full",
          !isLg && !isTcg && "mt-1.5 aspect-square w-full",
        )}
      >
        <CardScene
          biome={biome}
          sparkle={sparkle ?? isEpic}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `scale(${stickerScale})` }}
          >
            <Image
              src={stickerUrl}
              alt={name}
              fill
              unoptimized={unoptimizedSticker}
              priority={priority}
              sizes="(max-width: 420px) 45vw, 200px"
              className="object-contain p-3 drop-shadow-md"
            />
          </div>
        </CardScene>

        {/* Rarity tag */}
        <span
          className={cn(
            "absolute right-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase",
            RARITY_COLORS[rarityKey],
            RARITY_ACCENT[rarityKey],
          )}
        >
          {rarityLabel(rarity)}
        </span>

        {isEpic && (
          <span className="holo-idle pointer-events-none absolute inset-0" />
        )}
      </div>

      {/* Footer */}
      {isTcg || isLg ? (
        <div className="mt-1.5 space-y-1 px-0.5">
          {stats && stats.length > 0 && (
            <div className="space-y-0.5">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                  <StatBar value={s.value} />
                </div>
              ))}
            </div>
          )}
          {place && (
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="size-3" />
              <span className="truncate">{place}</span>
            </p>
          )}
        </div>
      ) : (
        <div className="mt-1 space-y-0.5 px-1">
          {personality && (
            <p className="truncate text-[10px] font-medium text-foreground/70">
              {personality}
            </p>
          )}
          {place && (
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="size-2.5" />
              <span className="truncate">{place}</span>
            </p>
          )}
          {charm != null && (
            <div className="flex items-center justify-end gap-0.5 pt-0.5">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-medium">{charm.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatBar({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 w-3 rounded-sm",
            i < value ? "bg-primary" : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}

export function CaptureCard({
  capture,
  size = "sm",
  priority,
}: {
  capture: Capture;
  size?: "sm" | "lg" | "tcg";
  priority?: boolean;
}) {
  const place = capturePlaceLabel(capture);

  return (
    <CatTradingCard
      name={capture.nickname?.trim() || "Unnamed"}
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
