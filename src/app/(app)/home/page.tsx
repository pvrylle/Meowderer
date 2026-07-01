import Link from "next/link";
import { Camera, Flame, Globe, Palette, Target } from "lucide-react";

import { APP_NAME } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark";
import { PreloadCaptureAssets } from "@/components/capture/preload-capture-assets";
import { CatCard } from "@/components/cat-card";
import { PawsInAreaSection } from "@/components/home/paws-in-area-section";
import { DexPlaceholderCard } from "@/components/dex-placeholder-card";
import { MascotEmpty } from "@/components/mascot-empty";
import { CatButton } from "@/components/ui/cat-button";
import { computeCollectionProgress } from "@/lib/collection-progress";
import { getCurrentUser } from "@/lib/auth";
import { getCaptures } from "@/lib/captures";
import { countCapturesToday } from "@/lib/retention";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getCurrentUser();
  const captures = await getCaptures();
  const progress = computeCollectionProgress(captures);

  let streakCount = 0;
  let dailyGoal = 1;

  if (user) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("streak_count, daily_goal")
      .eq("id", user.id)
      .maybeSingle();
    streakCount = profile?.streak_count ?? 0;
    dailyGoal = profile?.daily_goal ?? 1;
  }

  const todayCount = countCapturesToday(captures.map((c) => c.caught_at));
  const goalDone = todayCount >= dailyGoal;
  const placeholderCount = captures.length < 6 ? Math.min(2, 6 - captures.length) : 0;

  return (
    <div className="flex flex-col gap-5 px-5 pb-nav pt-4">
      <PreloadCaptureAssets />
      {/* Header */}
      <header className="flex items-center justify-between">
        <BrandMark variant="icon" size={36} alt={APP_NAME} priority />
        <Link
          href="/profile"
          className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"
        >
          {progress.uniqueCoats}/{progress.totalCoatTypes} coats
        </Link>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Streak */}
        <div className="flex items-center gap-3 rounded-2xl bg-orange/10 p-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-orange/20">
            <Flame className="size-5 text-orange" fill="currentColor" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Streak
            </p>
            <p className="text-lg font-bold leading-tight text-foreground">
              {streakCount > 0 ? `${streakCount}d` : "—"}
            </p>
          </div>
        </div>

        {/* Daily goal */}
        <div className="flex items-center gap-3 rounded-2xl bg-green/10 p-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-green/20">
            <Target className="size-5 text-green" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Today
              </p>
              <span className="text-xs font-bold text-green">
                {todayCount}/{dailyGoal}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-green/20">
              <div
                className="h-full rounded-full bg-green"
                style={{ width: `${Math.min(100, (todayCount / dailyGoal) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Link href="/catch" className="block">
        <div className="relative overflow-hidden rounded-2xl bg-primary p-4 text-white">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="font-bold">Catch a cat</p>
              <p className="text-sm text-white/70">Add to your collection</p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/20">
              <Camera className="size-6" />
            </div>
          </div>
          <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-white/10" />
        </div>
      </Link>

      {user && <PawsInAreaSection userId={user.id} />}

      {/* Collection section */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3 border-b border-border/50 pb-2.5">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Your collection
            </h2>
            {captures.length > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {progress.totalCats} cats · {progress.cities} cities
              </p>
            )}
          </div>
          {captures.length > 0 && (
            <div className="flex shrink-0 items-center gap-2.5 text-[11px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1">
                <Palette className="size-3" />
                {progress.uniqueCoats}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="size-3" />
                {progress.countries}
              </span>
            </div>
          )}
        </div>

        {captures.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {captures.map((capture, i) => (
              <CatCard key={capture.id} capture={capture} priority={i < 2} />
            ))}
            {Array.from({ length: placeholderCount }).map((_, i) => (
              <DexPlaceholderCard
                key={`ph-${i}`}
                variant={i % 2 === 0 ? "explore" : "undiscovered"}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 p-8">
      <MascotEmpty
        title="No cats yet"
        description="Catch your first stray to start collecting"
        size={64}
      />
      <Link href="/catch">
        <CatButton size="md">
          <Camera className="size-5" />
          Start catching
        </CatButton>
      </Link>
    </div>
  );
}
