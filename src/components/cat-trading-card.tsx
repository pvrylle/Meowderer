import Image from "next/image";
import { CalendarDays, Cat, MapPin, PawPrint } from "lucide-react";

import { CardScene } from "@/components/card-scene";
import { catStats, dexNumber, type CatStat } from "@/lib/cat-stats";
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
  size?: "sm" | "lg";
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-foreground">
      <Icon className="size-3 text-muted-foreground" />
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
  size = "lg",
  priority,
  unoptimizedSticker,
  sparkle,
}: CatTradingCardProps) {
  const isLg = size === "lg";

  return (
    <div
      className={cn(
        "bg-gradient-to-b shadow-lg",
        rarityFrame(rarity),
        isLg ? "rounded-[2rem] p-1.5 shadow-xl" : "rounded-3xl p-1",
      )}
    >
      <div
        className={cn(
          "flex flex-col bg-white/85 backdrop-blur",
          isLg ? "gap-2 rounded-[1.7rem] p-2" : "gap-1.5 rounded-[1.35rem] p-1.5",
        )}
      >
        {/* name banner */}
        <div
          className={cn(
            "flex items-center justify-between gap-2 border-2 border-white",
            rarityBanner(rarity),
            isLg ? "rounded-2xl px-3 py-2" : "rounded-xl px-2.5 py-1.5",
          )}
        >
          <span
            className={cn(
              "truncate font-extrabold text-foreground",
              isLg ? "text-base" : "text-sm",
            )}
          >
            {name}
          </span>
          {dex && (
            <span
              className={cn(
                "shrink-0 font-bold text-foreground/55",
                isLg ? "text-xs" : "text-[10px]",
              )}
            >
              {dex}
            </span>
          )}
        </div>

        {/* art window */}
        <div
          className={cn(
            "relative overflow-hidden border-2 border-white",
            isLg ? "rounded-2xl" : "rounded-xl",
          )}
        >
          <CardScene
            sparkle={sparkle ?? rarity === "epic"}
            className={isLg ? "aspect-[4/5]" : "aspect-square"}
          >
            <Image
              src={stickerUrl}
              alt={name}
              fill
              unoptimized={unoptimizedSticker}
              priority={priority}
              sizes={
                isLg
                  ? "(max-width: 420px) 90vw, 360px"
                  : "(max-width: 420px) 45vw, 200px"
              }
              className={cn(
                "object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)] transition-transform",
                isLg ? "p-5" : "p-3",
              )}
            />
          </CardScene>

          {/* rarity ribbon */}
          <span
            className={cn(
              "absolute left-0 top-2 rounded-r-full border-y-2 border-r-2 border-white font-bold uppercase tracking-wide text-foreground",
              rarityBanner(rarity),
              isLg ? "px-2.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[9px]",
            )}
          >
            {rarityLabel(rarity)}
          </span>
        </div>

        {/* stats + meta (large only) */}
        {isLg ? (
          <div className="space-y-2 rounded-2xl bg-white px-3 py-2.5">
            {stats && stats.length > 0 && (
              <div className="space-y-1">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-muted-foreground">
                      {s.label}
                    </span>
                    <PawBar value={s.value} />
                  </div>
                ))}
              </div>
            )}
            {(place || caughtAt || coat) && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {place && <Chip icon={MapPin}>{place}</Chip>}
                {coat && <Chip icon={Cat}>{coat}</Chip>}
                {caughtAt && (
                  <Chip icon={CalendarDays}>{formatShortDate(caughtAt)}</Chip>
                )}
              </div>
            )}
          </div>
        ) : (
          place && (
            <p className="flex items-center gap-1 truncate px-1.5 pb-0.5 text-[11px] text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{place}</span>
            </p>
          )
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
  size?: "sm" | "lg";
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
      stats={size === "lg" ? catStats(capture) : null}
      size={size}
      priority={priority}
    />
  );
}
