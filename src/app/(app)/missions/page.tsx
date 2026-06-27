import Link from "next/link";
import { User } from "lucide-react";

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

  return (
    <div className="flex flex-col gap-4 p-6 pb-nav">
      <div className="flex justify-end">
        <Link
          href="/profile"
          className="flex items-center gap-1.5 text-sm font-semibold text-primary"
        >
          <User className="size-4" />
          Profile
        </Link>
      </div>
      <MissionsTabs
        missions={missions}
        badges={badges}
        totalXp={totalXp}
        level={level}
      />
    </div>
  );
}
