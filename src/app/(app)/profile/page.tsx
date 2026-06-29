import Link from "next/link";
import {
  Award,
  Cat,
  ChevronRight,
  Globe,
  LogOut,
  MapPin,
  Palette,
  Settings,
  Sparkles,
  Trophy,
} from "lucide-react";

import { signOut } from "@/app/auth/actions";
import { AchievementsGrid } from "@/components/achievements-grid";
import { BrandMark } from "@/components/brand-mark";
import { CatButton } from "@/components/ui/cat-button";
import {
  countCoatTypes,
  getAchievementsCatalog,
  getUserAchievements,
} from "@/lib/achievements";
import { getCurrentUser, isDemoSession } from "@/lib/auth";
import { getCaptures } from "@/lib/captures";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const [user, captures, demo] = await Promise.all([
    getCurrentUser(),
    getCaptures(),
    isDemoSession(),
  ]);

  const countries = new Set(
    captures.map((c) => c.country).filter(Boolean),
  ).size;
  const cities = new Set(captures.map((c) => c.city).filter(Boolean)).size;
  const coatTypes = countCoatTypes(captures);

  let catalog: Awaited<ReturnType<typeof getAchievementsCatalog>> = [];
  let unlocked: Awaited<ReturnType<typeof getUserAchievements>> = [];

  if (!demo && user) {
    const supabase = await createClient();
    [catalog, unlocked] = await Promise.all([
      getAchievementsCatalog(supabase),
      getUserAchievements(supabase, user.id),
    ]);
  }

  const displayName = user?.email?.split("@")[0] ?? "Explorer";

  return (
    <div className="flex flex-col pb-nav">
      {/* Hero section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/20 via-primary/10 to-background px-5 pb-8 pt-10">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-10 top-10 size-32 rounded-full bg-primary/5 blur-2xl" />
        
        <div className="relative flex flex-col items-center text-center">
          <div className="relative">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-white shadow-lg ring-4 ring-white">
              <BrandMark variant="icon" size={56} />
            </div>
            <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-white shadow">
              <Sparkles className="size-4" />
            </span>
          </div>
          
          <h1 className="mt-4 text-xl font-bold text-foreground">{displayName}</h1>
          <p className="text-sm text-muted-foreground">Level 1 Collector</p>
          
          {/* Quick stats */}
          <div className="mt-5 flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{captures.length}</p>
              <p className="text-xs text-muted-foreground">Cats</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{cities}</p>
              <p className="text-xs text-muted-foreground">Cities</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{coatTypes}</p>
              <p className="text-xs text-muted-foreground">Coats</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-5 pt-5">
        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-orange/10 p-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange/20">
              <Cat className="size-5 text-orange" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{captures.length}</p>
              <p className="text-xs text-muted-foreground">Total catches</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-green/10 p-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-green/20">
              <Globe className="size-5 text-green" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{countries}</p>
              <p className="text-xs text-muted-foreground">Countries</p>
            </div>
          </div>
        </div>

        {/* Progress card */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20">
                <Trophy className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Collection Progress</p>
                <p className="text-xs text-muted-foreground">
                  {coatTypes} of 11 coat types discovered
                </p>
              </div>
            </div>
            <span className="text-lg font-bold text-primary">
              {Math.round((coatTypes / 11) * 100)}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(coatTypes / 11) * 100}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Link
            href="/missions"
            className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-legendary/15">
                <Award className="size-5 text-legendary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Missions & Badges</p>
                <p className="text-xs text-muted-foreground">
                  {unlocked.length} achievements unlocked
                </p>
              </div>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>

          <Link
            href="/settings"
            className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <Settings className="size-5 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">Settings</p>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>
        </div>

        {/* Recent achievements */}
        {catalog.length > 0 && unlocked.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Recent Achievements</h2>
              <Link href="/missions" className="text-sm text-primary">
                View all
              </Link>
            </div>
            <AchievementsGrid catalog={catalog} unlocked={unlocked} />
          </div>
        )}

        {/* Sign out */}
        <form action={signOut} className="pt-2">
          <CatButton type="submit" variant="ghost" block size="md" className="text-muted-foreground">
            <LogOut className="size-4" />
            Sign out
          </CatButton>
        </form>
      </div>
    </div>
  );
}
