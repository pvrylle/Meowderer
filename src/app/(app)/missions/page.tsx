import Link from "next/link";
import { ChevronLeft, Sparkles, Trophy } from "lucide-react";

import { MissionsTabs } from "@/components/missions-tabs";
import { getCurrentUser, isDemoSession } from "@/lib/auth";
import {
  getBadgesCatalog,
  getMissionsCatalog,
  getUserBadges,
  getUserMissions,
  progressMissionsAndBadgesAfterSave,
} from "@/lib/missions";
import { createClient } from "@/lib/supabase/server";

export default async function MissionsPage() {
  const [user, demo] = await Promise.all([getCurrentUser(), isDemoSession()]);

  let missions: Awaited<ReturnType<typeof getUserMissions>> = [];
  let badges: Awaited<ReturnType<typeof getUserBadges>> = [];
  let totalXp = 0;
  let level = 1;

  if (!demo && user) {
    const supabase = await createClient();
    await progressMissionsAndBadgesAfterSave(supabase, user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("total_xp, level")
      .eq("id", user.id)
      .single();

    totalXp = profile?.total_xp ?? 0;
    level = profile?.level ?? 1;

    [missions, badges] = await Promise.all([
      getUserMissions(supabase, user.id),
      getUserBadges(supabase, user.id),
    ]);

    if (missions.length === 0) {
      const catalog = await getMissionsCatalog(supabase);
      missions = catalog.map((m) => ({
        ...m,
        progress: 0,
        completed_at: null,
        claimed_at: null,
      }));
    }
    if (badges.length === 0) {
      const catalog = await getBadgesCatalog(supabase);
      badges = catalog.map((b) => ({ ...b, level: 0, xp: 0 }));
    }
  }

  const completedMissions = missions.filter((m) => m.claimed_at).length;

  return (
    <div className="flex flex-col pb-nav">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-legendary/20 via-legendary/10 to-background px-5 pb-6 pt-4">
        <div className="absolute -right-10 top-0 size-32 rounded-full bg-legendary/10 blur-3xl" />
        
        <Link
          href="/profile"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ChevronLeft className="size-4" />
          Profile
        </Link>

        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Missions</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Complete quests to earn rewards
            </p>
          </div>
          
          {/* Level badge */}
          <div className="flex flex-col items-center rounded-2xl bg-white/80 px-4 py-2 shadow-sm ring-1 ring-legendary/20">
            <div className="flex items-center gap-1">
              <Trophy className="size-4 text-legendary" />
              <span className="text-xs text-muted-foreground">Level</span>
            </div>
            <p className="text-2xl font-bold text-legendary">{level}</p>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-4 rounded-xl bg-white/60 p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Sparkles className="size-3.5 text-legendary" />
              {totalXp} XP
            </span>
            <span className="text-muted-foreground">
              {completedMissions}/{missions.length} completed
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-legendary to-orange"
              style={{ width: `${missions.length > 0 ? (completedMissions / missions.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-5 pt-4">
        <MissionsTabs
          missions={missions}
          badges={badges}
          totalXp={totalXp}
          level={level}
        />
      </div>
    </div>
  );
}
