import Link from "next/link";
import { Camera, ChevronRight, Flame, Sparkles, Target } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { CatCard } from "@/components/cat-card";
import { MascotEmpty } from "@/components/mascot-empty";
import { CatButton } from "@/components/ui/cat-button";
import { getCurrentUser } from "@/lib/auth";
import { getCaptures } from "@/lib/captures";
import { countCapturesToday } from "@/lib/retention";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getCurrentUser();
  const captures = await getCaptures();
  const recent = captures.slice(0, 4);

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

  return (
    <div className="flex flex-col pb-nav">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4">
        <BrandMark variant="logo" className="h-10 w-auto" priority />
        <Link
          href="/catdex"
          className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"
        >
          <Sparkles className="size-4" />
          {captures.length}
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 px-5">
        {/* Streak */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange/20 to-orange/5 p-4">
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <Flame className="size-5 text-orange" fill="currentColor" />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Streak
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {streakCount > 0 ? `${streakCount}` : "0"}
              <span className="ml-1 text-sm font-medium text-muted-foreground">
                {streakCount === 1 ? "day" : "days"}
              </span>
            </p>
          </div>
          <div className="absolute -right-4 -top-4 size-20 rounded-full bg-orange/10 blur-2xl" />
        </div>

        {/* Daily goal */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green/20 to-green/5 p-4">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="size-5 text-green" />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Today
                </span>
              </div>
              <span className="text-sm font-bold text-green">
                {todayCount}/{dailyGoal}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/50">
              <div
                className="h-full rounded-full bg-green transition-all"
                style={{ width: `${Math.min(100, (todayCount / dailyGoal) * 100)}%` }}
              />
            </div>
            {goalDone && (
              <p className="mt-1 text-xs font-medium text-green">Complete! 🎉</p>
            )}
          </div>
          <div className="absolute -right-4 -top-4 size-20 rounded-full bg-green/10 blur-2xl" />
        </div>
      </div>

      {/* CTA */}
      <div className="mt-5 px-5">
        <Link href="/catch" className="block">
          <div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-white">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">Catch a cat</p>
                <p className="mt-0.5 text-sm text-white/70">
                  Add a new friend to your collection
                </p>
              </div>
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white/20">
                <Camera className="size-7" strokeWidth={2} />
              </div>
            </div>
            <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-6 -left-6 size-24 rounded-full bg-white/10" />
          </div>
        </Link>
      </div>

      {/* Recent */}
      <div className="mt-6 px-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Recent catches</h2>
          {captures.length > 4 && (
            <Link
              href="/catdex"
              className="flex items-center text-sm font-medium text-primary"
            >
              See all
              <ChevronRight className="size-4" />
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {recent.map((capture, i) => (
              <CatCard key={capture.id} capture={capture} priority={i === 0} />
            ))}
          </div>
        )}
      </div>
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
