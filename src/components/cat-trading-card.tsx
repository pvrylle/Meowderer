"use client";

import Image from "next/image";
import { MapPin, PawPrint, Sparkles, Star, Zap } from "lucide-react";

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
import { capturePlaceLabel } from "@/lib/capture-place";
import { cardHoloProfile } from "@/lib/card-holo";
import { cardTheme } from "@/lib/card-theme";
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
  /** Hide rarity badge and use neutral styling (catch review before save). */
  hideRarity?: boolean;
  /** Omit the stats block (catch review preview). */
  hideStats?: boolean;
  className?: string;
};

function PawMeter({
  value,
  fillClass,
  emptyClass,
  size = "md",
  onDark,
}: {
  value: number;
  fillClass: string;
  emptyClass: string;
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
}) {
  const pawSize =
    size === "lg" ? "size-5" : size === "md" ? "size-4" : "size-3";

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center justify-center rounded-full",
            pawSize,
            i < value ? fillClass : emptyClass,
          )}
        >
          <PawPrint
            className={cn(
              size === "lg" ? "size-3" : size === "md" ? "size-2.5" : "size-2",
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

function StatAttack({
  stat,
  theme,
  compact,
  onDark,
}: {
  stat: CatStat;
  theme: ReturnType<typeof cardTheme>;
  compact?: boolean;
  onDark?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 shadow-sm",
        onDark
          ? "epic-stat-row"
          : "bg-white/45",
        compact && "py-1",
      )}
    >
      <span
        className={cn(
          "font-black uppercase tracking-wide",
          onDark ? "text-white/80" : "text-foreground/75",
          compact ? "text-[8px]" : "text-[10px]",
        )}
      >
        {stat.label}
      </span>
      <PawMeter
        value={stat.value}
        fillClass={theme.statFill}
        emptyClass={theme.statEmpty}
        size={compact ? "sm" : "md"}
        onDark={onDark}
      />
    </div>
  );
}

function CollectionGridCard({
  name,
  stickerUrl,
  rarity = null,
  place,
  dex,
  personality,
  biome = "meadow",
  priority,
  unoptimizedSticker,
  stickerScale = 1,
}: Pick<
  CatTradingCardProps,
  | "name"
  | "stickerUrl"
  | "rarity"
  | "place"
  | "dex"
  | "personality"
  | "biome"
  | "priority"
  | "unoptimizedSticker"
  | "stickerScale"
>) {
  const theme = cardTheme(rarity);
  const rarityKey = rarity ?? "common";

  const accent: Record<string, string> = {
    common: "border-t-slate-400",
    uncommon: "border-t-emerald-500",
    rare: "border-t-sky-500",
    epic: "border-t-violet-500",
    legendary: "border-t-amber-500",
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm",
        "border-t-[3px]",
        accent[rarityKey],
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        <CardScene biome={biome} className="absolute inset-0">
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
              sizes="(max-width: 420px) 45vw, 180px"
              className="object-contain p-2.5 drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
            />
          </div>
        </CardScene>
        <span
          className={cn(
            "absolute right-1.5 top-1.5 rounded px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-white",
            theme.badge,
          )}
        >
          {rarityLabel(rarity)}
        </span>
      </div>

      <div className="flex flex-col gap-1 border-t border-border/40 px-2.5 py-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13px] font-semibold leading-tight text-foreground">
            {name}
          </span>
          {dex && (
            <span className="shrink-0 text-[9px] font-medium tabular-nums text-muted-foreground">
              {dex}
            </span>
          )}
        </div>

        {personality && (
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {personality}
          </p>
        )}

        {place && (
          <p className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
            <MapPin className="size-2.5 shrink-0" />
            <span className="truncate">{place}</span>
          </p>
        )}
      </div>
    </div>
  );
}

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
  hideRarity = false,
  hideStats = false,
  className,
}: CatTradingCardProps) {
  const isTcg = size === "tcg";
  const isLg = size === "lg";
  const isSm = !isLg && !isTcg;
  const displayRarity = hideRarity ? null : rarity;
  const theme = cardTheme(displayRarity);
  const holoProfile = hideRarity ? null : cardHoloProfile(rarity);
  const isEpic = !hideRarity && (rarity === "epic" || rarity === "legendary");
  const isLegendary = !hideRarity && rarity === "legendary";
  const onDark = theme.textOnDark;
  const hp = charm != null ? Math.round(charm * 20) : null;

  if (isSm) {
    return (
      <div className={cn("relative", className)}>
        <CollectionGridCard
          name={name}
          stickerUrl={stickerUrl}
          rarity={rarity}
          place={place}
          dex={dex}
          personality={personality}
          biome={biome}
          priority={priority}
          unoptimizedSticker={unoptimizedSticker}
          stickerScale={stickerScale}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative",
        isTcg && "aspect-[5/7] w-[17.5rem]",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-2xl",
          theme.shellClass ?? cn("bg-gradient-to-b", theme.shell),
          isEpic && theme.glow,
        )}
      >
          {/* Epic holo sheen removed — too neon */}

          {/* Decorative doodles */}
          <PawPrint
            className={cn(
              "pointer-events-none absolute right-3 top-14 size-10 rotate-12",
              theme.pattern,
            )}
          />
          <PawPrint
            className={cn(
              "pointer-events-none absolute bottom-16 left-2 size-8 -rotate-12",
              theme.pattern,
            )}
          />

          {/* === HEADER (Pokémon-style name + HP) === */}
          <div
            className={cn(
              "relative shrink-0 bg-gradient-to-r px-3 py-2",
              theme.header,
              isSm && "px-2 py-1.5",
            )}
          >
            <div className="relative z-10 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  {isLegendary && (
                    <Zap className="size-3.5 shrink-0 fill-yellow-300 text-yellow-300" />
                  )}
                  <span
                    className={cn(
                      "truncate font-black tracking-tight text-white drop-shadow",
                      isSm ? "text-xs" : "text-base",
                    )}
                  >
                    {name}
                  </span>
                </div>
                {dex && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">
                    {dex}
                  </span>
                )}
              </div>

              {hp != null && !isSm && (
                <div className="shrink-0 text-right">
                  <div className="flex items-baseline gap-1">
                    <Star className="size-3 fill-amber-200 text-amber-200" />
                    <span className="text-lg font-black leading-none text-white">
                      {hp}
                    </span>
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-white/70">
                    Charm
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* === ART WINDOW === */}
          <div className={cn("relative shrink-0", isSm ? "px-1.5 pt-1.5" : "px-2 pt-2")}>
            <div
              className={cn(
                "relative overflow-hidden rounded-xl border-[3px] p-[3px] shadow-inner",
                theme.artFrame,
              )}
            >
              <div
                className={cn(
                  "relative overflow-hidden rounded-lg bg-gradient-to-b",
                  theme.artInner,
                  isTcg && "aspect-[4/3]",
                  isLg && "aspect-[4/5]",
                  isSm && "aspect-square",
                )}
              >
                <CardScene
                  biome={biome}
                  sparkle={sparkle ?? holoProfile !== null}
                  className="absolute inset-0"
                >
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-3">
                    {unoptimizedSticker ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={stickerUrl}
                        src={stickerUrl}
                        alt={name}
                        draggable={false}
                        className="max-h-full max-w-full object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.22)]"
                        style={{
                          transform: `scale(${stickerScale})`,
                          transformOrigin: "center center",
                        }}
                      />
                    ) : (
                      <div
                        className="relative h-full w-full"
                        style={{ transform: `scale(${stickerScale})` }}
                      >
                        <Image
                          src={stickerUrl}
                          alt={name}
                          fill
                          priority={priority}
                          sizes={isSm ? "(max-width: 420px) 45vw, 160px" : "260px"}
                          className="object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.22)]"
                        />
                      </div>
                    )}
                  </div>
                </CardScene>

                {holoProfile && (
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 z-[1]",
                      "holo-idle-base",
                      holoProfile.idleClass,
                    )}
                  />
                )}

                {!hideRarity && (
                  <div
                    className={cn(
                      "absolute right-1.5 top-1.5 z-10 flex items-center gap-1 rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-white shadow-md",
                      theme.badge,
                    )}
                  >
                    {isLegendary && <Sparkles className="size-2.5" />}
                    {rarityLabel(rarity)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* === TYPE STRIP === */}
          {(personality || isSm) && (
            <div
              className={cn(
                "mx-2 flex items-center justify-between gap-2 rounded-md px-2 py-1",
                theme.strip,
                isSm && "mx-1.5 py-0.5",
              )}
            >
              <span
                className={cn(
                  "truncate font-black uppercase tracking-wide",
                  onDark ? "text-white/90" : "text-foreground/80",
                  isSm ? "text-[8px]" : "text-[10px]",
                )}
              >
                {personality ?? "Stray cat"}
              </span>
              {isSm && charm != null && (
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "size-2.5",
                        i < Math.round(charm)
                          ? "fill-amber-500 text-amber-500"
                          : "fill-black/10 text-black/10",
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === STATS PANEL === */}
          {!hideStats && stats && stats.length > 0 ? (
            <div
              className={cn(
                "relative z-10 flex flex-1 flex-col",
                theme.panelClass ?? (theme.panel ? cn("bg-gradient-to-b", theme.panel) : ""),
                isSm ? "gap-1 px-1.5 pb-2 pt-1" : "gap-1.5 px-3 pb-3 pt-2",
              )}
            >
              {stats.map((s) => (
                <StatAttack
                  key={s.label}
                  stat={s}
                  theme={theme}
                  compact={isSm}
                  onDark={onDark}
                />
              ))}

              {place && !isTcg && (
                <div
                  className={cn(
                    "mt-auto flex items-center gap-1 rounded-md px-2 py-1 font-semibold",
                    onDark
                      ? "bg-white/8 text-white/60"
                      : "bg-black/5 text-foreground/60",
                    isSm ? "text-[8px]" : "text-[10px]",
                  )}
                >
                  <MapPin className={cn(isSm ? "size-2.5" : "size-3")} />
                  <span className="truncate">{place}</span>
                </div>
              )}
            </div>
          ) : hideStats ? (
            <div
              className={cn(
                "relative z-10 shrink-0 px-3 py-2.5 text-center text-[10px] font-semibold",
                onDark ? "text-white/50" : "text-muted-foreground",
              )}
            >
              Rarity revealed after you save
            </div>
          ) : null}
      </div>
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
      personality={personalityTitle(capture)}
      charm={size === "lg" || size === "tcg" ? charmRating(capture) : null}
      biome={pickBiome(capture)}
      size={size}
      priority={priority}
    />
  );
}
