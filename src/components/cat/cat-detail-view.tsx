import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CatDetailDock } from "@/components/cat/cat-detail-dock";
import { InteractiveCaptureCard } from "@/components/interactive-capture-card";
import { NamePollCard } from "@/components/name-poll-card";
import type { NamePollWithCounts } from "@/app/(app)/cat/[id]/poll-actions";
import { dexNumber, pickBiome } from "@/lib/cat-stats";
import type { Capture } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const BIOME_HERO: Record<
  ReturnType<typeof pickBiome>,
  string
> = {
  meadow: "from-green/25 via-background/40 to-card",
  city: "from-secondary/50 via-background/40 to-card",
  beach: "from-rare/20 via-orange/10 to-card",
  night: "from-primary/20 via-secondary/25 to-card",
  snow: "from-rare/15 via-muted/40 to-card",
};

export function CatDetailView({
  capture,
  poll,
  isOwner,
}: {
  capture: Capture;
  poll: NamePollWithCounts | null;
  isOwner: boolean;
}) {
  const biome = pickBiome(capture);
  const dex = dexNumber(capture.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="relative z-10 flex shrink-0 items-center justify-between px-4 py-2">
        <Link
          href="/catdex"
          aria-label="Back to CatDex"
          className="flex size-9 items-center justify-center rounded-full bg-card/90 text-muted-foreground shadow-sm backdrop-blur-sm"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Tap to flip
        </span>
        <span className="rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-bold text-muted-foreground shadow-sm backdrop-blur-sm">
          {dex}
        </span>
      </header>

      <div
        className={cn(
          "cat-detail-stage relative bg-gradient-to-b",
          BIOME_HERO[biome],
        )}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -right-6 top-0 size-32 rounded-full bg-white/60 blur-2xl" />
          <div className="absolute -bottom-4 -left-4 size-24 rounded-full bg-primary/15 blur-2xl" />
        </div>
        <div className="cat-detail-card-slot relative z-0">
          <div className="cat-detail-card-scale">
            <InteractiveCaptureCard capture={capture} />
          </div>
        </div>
      </div>

      <NamePollCard capture={capture} poll={poll} isOwner={isOwner} />

      <CatDetailDock capture={capture} />
    </div>
  );
}
