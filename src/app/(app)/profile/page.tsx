import Link from "next/link";
import { Cat, Globe, Map, MapPin, Palette, Settings, Target, Users } from "lucide-react";

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

  const stats = [
    { label: "Cats", value: captures.length, icon: Cat },
    { label: "Cities", value: cities, icon: MapPin },
    { label: "Countries", value: countries, icon: Globe },
    { label: "Coats", value: coatTypes, icon: Palette },
  ];

  return (
    <div className="flex flex-col gap-8 p-6 pb-nav">
      <header className="flex flex-col items-center gap-3 pt-6 text-center">
        <BrandMark variant="icon" size={88} />
        <div>
          <h1 className="text-xl font-extrabold text-foreground">
            {user?.email ?? "Cat catcher"}
          </h1>
          <p className="text-sm text-muted-foreground">CatDex collector</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card p-4"
          >
            <Icon className="size-5 text-primary" />
            <span className="text-xl font-extrabold text-foreground">
              {value}
            </span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold text-foreground">Explore</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/home"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors active:bg-muted/50"
          >
            <Cat className="size-5 shrink-0 text-primary" />
            <span className="text-sm font-bold text-foreground">Home</span>
          </Link>
          <Link
            href="/map"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors active:bg-muted/50"
          >
            <Map className="size-5 shrink-0 text-primary" />
            <span className="text-sm font-bold text-foreground">Map</span>
          </Link>
          <Link
            href="/missions"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors active:bg-muted/50"
          >
            <Target className="size-5 shrink-0 text-primary" />
            <span className="text-sm font-bold text-foreground">Quests</span>
          </Link>
          <Link
            href="/community"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors active:bg-muted/50"
          >
            <Users className="size-5 shrink-0 text-primary" />
            <span className="text-sm font-bold text-foreground">Community</span>
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-foreground">Achievements</h2>
          <Link href="/missions" className="text-sm font-semibold text-primary">
            Missions & Badges →
          </Link>
        </div>
        <AchievementsGrid catalog={catalog} unlocked={unlocked} />
      </section>

      <Link href="/settings">
        <CatButton variant="outline" block>
          <Settings className="size-5" />
          Settings
        </CatButton>
      </Link>

      <form action={signOut} className="mt-auto">
        <CatButton type="submit" variant="outline" block>
          Sign out
        </CatButton>
      </form>
    </div>
  );
}
