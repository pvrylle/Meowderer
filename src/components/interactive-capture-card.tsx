"use client";

import { CardBack } from "@/components/card-back";
import { CatTradingCard } from "@/components/cat-trading-card";
import { InteractiveCard } from "@/components/interactive-card";
import { catBio, catStats, dexNumber, pickBiome } from "@/lib/cat-stats";
import type { Capture } from "@/lib/supabase/types";

/**
 * The full detail-page card: tilt + glare + (Epic) holo, flippable to a bio /
 * field-notes back.
 */
export function InteractiveCaptureCard({ capture }: { capture: Capture }) {
  const name = capture.nickname?.trim() || "Unnamed cat";
  const place = [capture.city, capture.country].filter(Boolean).join(", ") || null;
  const dex = dexNumber(capture.id);
  const biome = pickBiome(capture);
  const stats = catStats(capture);

  return (
    <InteractiveCard
      holo={capture.rarity === "epic"}
      back={
        <CardBack
          name={name}
          dex={dex}
          rarity={capture.rarity}
          biome={biome}
          bio={catBio(capture)}
          stats={stats}
          place={place}
          caughtAt={capture.caught_at}
        />
      }
    >
      <CatTradingCard
        name={name}
        stickerUrl={capture.sticker_url}
        rarity={capture.rarity}
        place={place}
        caughtAt={capture.caught_at}
        coat={capture.coat_type}
        dex={dex}
        stats={stats}
        biome={biome}
        size="lg"
        priority
      />
    </InteractiveCard>
  );
}
