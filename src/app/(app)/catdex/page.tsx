import Link from "next/link";
import { Camera, Globe, MapPin, Palette } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { CatDexGrid } from "@/components/catdex-grid";
import { MascotEmpty } from "@/components/mascot-empty";
import { CatButton } from "@/components/ui/cat-button";
import { getCaptureCommunityTags } from "@/lib/capture-tags";
import { computeCollectionProgress } from "@/lib/collection-progress";
import { getCurrentUser } from "@/lib/auth";
import { getCaptures } from "@/lib/captures";
import { createClient } from "@/lib/supabase/server";

export default async function CatDexPage() {
  const user = await getCurrentUser();
  const captures = await getCaptures();
  const progress = computeCollectionProgress(captures);

  let helpedIds: string[] = [];
  let rescuedIds: string[] = [];
  let seenIds: string[] = [];

  if (user) {
    const supabase = await createClient();
    const tags = await getCaptureCommunityTags(supabase, user.id, captures);
    helpedIds = [...tags.helpedIds];
    rescuedIds = [...tags.rescuedIds];
    seenIds = [...tags.seenIds];
  }

  return (
    <div className="flex flex-col pb-nav">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/15 to-background px-5 pb-5 pt-4">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-3xl" />
        
        <div className="relative flex items-start justify-between">
          <div>
            <BrandMark variant="logo" className="h-9 w-auto" priority />
            <p className="mt-1 text-sm text-muted-foreground">
              Your collection
            </p>
          </div>
          <div className="rounded-xl bg-primary px-3 py-2 text-center shadow-sm">
            <p className="text-lg font-bold text-white">{progress.uniqueCoats}</p>
            <p className="text-[10px] text-white/70">of {progress.totalCoatTypes}</p>
          </div>
        </div>

        {/* Progress */}
        {captures.length > 0 && (
          <div className="mt-4 rounded-xl bg-white/80 p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Collection progress
              </span>
              <span className="text-sm font-bold text-primary">
                {progress.coatPercent}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/50">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress.coatPercent}%` }}
              />
            </div>
            
            {/* Mini stats */}
            <div className="mt-3 flex items-center justify-around border-t border-border/30 pt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Palette className="size-3.5" />
                <span className="font-medium text-foreground">{progress.totalCats}</span>
                cats
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />
                <span className="font-medium text-foreground">{progress.cities}</span>
                cities
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="size-3.5" />
                <span className="font-medium text-foreground">{progress.countries}</span>
                countries
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="px-5 pt-4">
        {captures.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 p-10">
            <MascotEmpty
              title="Empty collection"
              description="Catch cats to start your collection"
              size={72}
            />
            <Link href="/catch">
              <CatButton size="md">
                <Camera className="size-5" />
                Catch a cat
              </CatButton>
            </Link>
          </div>
        ) : (
          <CatDexGrid
            captures={captures}
            seenIds={seenIds}
            helpedIds={helpedIds}
            rescuedIds={rescuedIds}
          />
        )}
      </div>
    </div>
  );
}
