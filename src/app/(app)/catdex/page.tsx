import Link from "next/link";
import { PawPrint } from "lucide-react";

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

  if (user) {
    const supabase = await createClient();
    const tags = await getCaptureCommunityTags(supabase, user.id, captures);
    helpedIds = [...tags.helpedIds];
    rescuedIds = [...tags.rescuedIds];
  }

  return (
    <div className="flex flex-col gap-5 p-6 pb-nav">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">CatDex</h1>
          <p className="text-sm text-muted-foreground">
            Your collection of community cats
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">
          <PawPrint className="size-4" />
          {progress.uniqueCoats}/{progress.totalCoatTypes}
        </div>
      </header>

      {captures.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">Collection progress</span>
            <span className="font-bold text-primary">{progress.coatPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress.coatPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {progress.totalCats} cats · {progress.cities} cities · {progress.countries}{" "}
            countries
          </p>
        </div>
      )}

      {captures.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16">
          <MascotEmpty
            title="Your CatDex is empty"
            description="Catch your first stray to start your collection."
          />
          <Link href="/catch">
            <CatButton size="md">Catch a cat</CatButton>
          </Link>
        </div>
      ) : (
        <CatDexGrid
          captures={captures}
          helpedIds={helpedIds}
          rescuedIds={rescuedIds}
        />
      )}
    </div>
  );
}
