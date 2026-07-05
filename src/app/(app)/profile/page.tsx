import Link from "next/link";
import {
  Award,
  ChevronRight,
  Globe,
  LogOut,
  Palette,
  Pencil,
  Settings,
  Trophy,
} from "lucide-react";

import { signOut } from "@/app/auth/actions";
import { AchievementsGrid } from "@/components/achievements-grid";
import { ShopEntry } from "@/components/shop/shop-entry";
import { UserAvatar } from "@/components/user-avatar";
import { CatButton } from "@/components/ui/cat-button";
import {
  getAchievementsCatalog,
  getUserAchievements,
} from "@/lib/achievements";
import { getCurrentUser, isDemoSession } from "@/lib/auth";
import { getCaptures } from "@/lib/captures";
import { computeCollectionProgress } from "@/lib/collection-progress";
import { createClient } from "@/lib/supabase/server";
import { xpProgress } from "@/lib/xp";

export default async function ProfilePage() {
  const [user, captures, demo] = await Promise.all([
    getCurrentUser(),
    getCaptures(),
    isDemoSession(),
  ]);

  const progress = computeCollectionProgress(captures);

  let catalog: Awaited<ReturnType<typeof getAchievementsCatalog>> = [];
  let unlocked: Awaited<ReturnType<typeof getUserAchievements>> = [];
  let avatarUrl: string | null = null;
  let username: string | null = null;
  let totalXp = 0;

  if (!demo && user) {
    const supabase = await createClient();
    const [cat, unl, profileRes] = await Promise.all([
      getAchievementsCatalog(supabase),
      getUserAchievements(supabase, user.id),
      supabase
        .from("profiles")
        .select("avatar_url, username, total_xp")
        .eq("id", user.id)
        .maybeSingle(),
    ]);
    catalog = cat;
    unlocked = unl;
    avatarUrl = profileRes.data?.avatar_url ?? null;
    username = profileRes.data?.username ?? null;
    totalXp = profileRes.data?.total_xp ?? 0;
  }

  const displayName = username ?? user?.email?.split("@")[0] ?? "Explorer";
  const xp = xpProgress(totalXp);

  return (
    <div className="flex flex-col pb-nav">
      {/* Hero section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/20 via-primary/8 to-background px-5 pb-7 pt-10">
        <div className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 top-12 size-32 rounded-full bg-primary/10 blur-2xl" />

        <div className="relative flex flex-col items-center text-center">
          <Link href="/settings" className="group relative" aria-label="Edit profile">
            <UserAvatar
              name={displayName}
              avatarUrl={avatarUrl}
              className="!size-24 text-2xl shadow-lg ring-4 ring-white"
            />
            <span className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-primary text-white shadow-md ring-2 ring-background transition-transform group-active:scale-90">
              <Pencil className="size-4" />
            </span>
          </Link>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">
            {displayName}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Level {xp.level} Collector
          </p>

          {/* XP progress */}
          <div className="mt-3 w-full max-w-[240px]">
            <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span>{xp.xp.toLocaleString()} XP</span>
              <span>
                {xp.isMax
                  ? "Max level"
                  : `${xp.xpToNext.toLocaleString()} XP to Lv ${xp.level + 1}`}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-card/70 shadow-inner ring-1 ring-border/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-[width] duration-500"
                style={{ width: `${xp.pct}%` }}
              />
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-6 flex w-full max-w-xs items-center justify-around rounded-3xl bg-card/70 px-2 py-3 shadow-sm ring-1 ring-border/50 backdrop-blur">
            <QuickStat value={progress.totalCats} label="Cats" />
            <div className="h-9 w-px bg-border/70" />
            <QuickStat value={progress.cities} label="Cities" />
            <div className="h-9 w-px bg-border/70" />
            <QuickStat value={progress.uniqueCoats} label="Coats" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-5 pt-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-green/10 p-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-green/20">
              <Globe className="size-5 text-green" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none text-foreground">
                {progress.countries}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Countries</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-orange/10 p-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-orange/20">
              <Palette className="size-5 text-orange" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none text-foreground">
                {progress.uniqueCoats}
                <span className="text-sm font-semibold text-muted-foreground">
                  /{progress.totalCoatTypes}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Coat types</p>
            </div>
          </div>
        </div>

        {/* Progress card */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/12 to-primary/5 p-4 ring-1 ring-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/20">
                <Trophy className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Collection Progress</p>
                <p className="text-xs text-muted-foreground">
                  {progress.uniqueCoats} of {progress.totalCoatTypes} coat types discovered
                </p>
              </div>
            </div>
            <span className="text-xl font-extrabold text-primary">
              {progress.coatPercent}%
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-[width] duration-500"
              style={{ width: `${progress.coatPercent}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <Link
            href="/missions"
            className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50 transition-transform active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-legendary/15">
                <Award className="size-5 text-legendary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Missions &amp; Badges</p>
                <p className="text-xs text-muted-foreground">
                  {unlocked.length} achievement{unlocked.length === 1 ? "" : "s"} unlocked
                </p>
              </div>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>

          <Link
            href="/settings"
            className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50 transition-transform active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                <Settings className="size-5 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">Settings</p>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>

          <ShopEntry points={xp.xp} />
        </div>

        {/* Recent achievements */}
        {catalog.length > 0 && unlocked.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Recent Achievements</h2>
              <Link href="/missions" className="text-sm font-medium text-primary">
                View all
              </Link>
            </div>
            <AchievementsGrid catalog={catalog} unlocked={unlocked} />
          </div>
        )}

        {/* Sign out */}
        <form action={signOut} className="pt-1">
          <CatButton
            type="submit"
            variant="ghost"
            block
            size="md"
            className="text-muted-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </CatButton>
        </form>
      </div>
    </div>
  );
}

function QuickStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-14 text-center">
      <p className="text-2xl font-extrabold leading-none text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
