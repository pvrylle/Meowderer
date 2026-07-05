import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CatDetailCardStage } from "@/components/cat/cat-detail-card-stage";
import { CatDetailHeaderActions } from "@/components/cat/cat-detail-header-actions";
import { CatProfileTabs } from "@/components/cat/cat-profile-tabs";
import type { NamePollWithCounts } from "@/app/(app)/cat/[id]/poll-actions";
import { pickBiome } from "@/lib/cat-stats";
import type { StraySighting } from "@/lib/stray-cats";
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
  uploaderUsername,
  album,
  isSuperAdmin,
  nameLocked,
}: {
  capture: Capture;
  poll: NamePollWithCounts | null;
  isOwner: boolean;
  uploaderUsername: string | null;
  album: StraySighting[];
  isSuperAdmin: boolean;
  nameLocked: boolean;
}) {
  const biome = pickBiome(capture);

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-visible bg-gradient-to-b from-background via-background/95 to-muted/25 pb-0">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-10 top-10 size-36 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[-2rem] top-32 size-44 rounded-full bg-secondary/35 blur-3xl" />
        <div className="absolute bottom-24 left-1/2 size-52 -translate-x-1/2 rounded-full bg-rare/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-border/25 bg-background/55 px-4 pb-2 pt-3 backdrop-blur-2xl">
        <Link
          href="/home"
          aria-label="Back to collection"
          className="flex size-10 items-center justify-center rounded-full border border-border/60 bg-card/85 text-muted-foreground shadow-[0_8px_24px_rgba(58,53,80,0.08)] backdrop-blur-xl transition-transform active:scale-95"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <CatDetailHeaderActions
          shareTitle={capture.nickname?.trim() || "Meowderer cat"}
          shareText={`Check out ${capture.nickname?.trim() || "this cat"} on Meowderer.`}
        />
      </header>

      <CatDetailCardStage
        capture={capture}
        className={cn("mx-2 mt-1", BIOME_HERO[biome])}
      />

      <CatProfileTabs
        capture={capture}
        album={album}
        poll={poll}
        isOwner={isOwner}
        uploaderUsername={uploaderUsername}
        isSuperAdmin={isSuperAdmin}
        nameLocked={nameLocked}
      />

    </div>
  );
}
