import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CatDetailCardStage } from "@/components/cat/cat-detail-card-stage";
import { CatDetailDock } from "@/components/cat/cat-detail-dock";
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
          href="/home"
          aria-label="Back to collection"
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

      <CatDetailCardStage
        capture={capture}
        className={cn("bg-gradient-to-b", BIOME_HERO[biome])}
      />

      <NamePollCard capture={capture} poll={poll} isOwner={isOwner} />

      <CatDetailDock capture={capture} />
    </div>
  );
}
