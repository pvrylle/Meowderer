import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Badge,
  MetricSnapshot,
  Mission,
  UserBadge,
  UserMission,
} from "@/lib/mission-types";
import type { Capture } from "@/lib/supabase/types";
import type { Database } from "@/lib/supabase/types";
import { isRareOrEpic, levelFromXp, xpForBadgeLevel } from "@/lib/xp";

type Supabase = SupabaseClient<Database>;

export type { Badge, MetricSnapshot, Mission, UserBadge, UserMission } from "@/lib/mission-types";

export function computeMetrics(captures: Capture[]): MetricSnapshot {
  const cities = new Set(
    captures.map((c) => c.city).filter((c): c is string => Boolean(c)),
  );
  const countries = new Set(
    captures.map((c) => c.country).filter((c): c is string => Boolean(c)),
  );
  const geotagged = captures.filter((c) => c.lat != null && c.lng != null);
  const rare = captures.filter((c) => c.rarity && isRareOrEpic(c.rarity));

  return {
    capture_count: captures.length,
    geotagged_visits: geotagged.length,
    unique_cities: cities.size,
    unique_countries: countries.size,
    rare_catches: rare.length,
    shelter_visits: 0,
    verify_rescue: 0,
    name_votes: 0,
  };
}

export async function computeExtendedMetrics(
  supabase: Supabase,
  userId: string,
  captures: Capture[],
): Promise<MetricSnapshot> {
  const base = computeMetrics(captures);

  const [{ count: shelterVisits }, { count: verifyRescue }, { count: nameVotes }] =
    await Promise.all([
    supabase
      .from("user_shelter_visits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("rescue_alerts")
      .select("*", { count: "exact", head: true })
      .eq("resolved_by", userId),
    supabase
      .from("name_poll_votes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return {
    ...base,
    shelter_visits: shelterVisits ?? 0,
    verify_rescue: verifyRescue ?? 0,
    name_votes: nameVotes ?? 0,
  };
}

function metricValue(
  metrics: MetricSnapshot,
  metricType: string,
): number {
  return metrics[metricType as keyof MetricSnapshot] ?? 0;
}

export async function getMissionsCatalog(supabase: Supabase): Promise<Mission[]> {
  const { data } = await supabase.from("missions").select("*");
  return data ?? [];
}

export async function getUserMissions(
  supabase: Supabase,
  userId: string,
): Promise<UserMission[]> {
  const [{ data: catalog }, { data: rows }] = await Promise.all([
    supabase.from("missions").select("*"),
    supabase.from("user_missions").select("*").eq("user_id", userId),
  ]);

  if (!catalog?.length) return [];

  const byMission = new Map((rows ?? []).map((r) => [r.mission_id, r]));

  return catalog.map((m) => {
    const row = byMission.get(m.id);
    return {
      ...m,
      progress: row?.progress ?? 0,
      completed_at: row?.completed_at ?? null,
      claimed_at: row?.claimed_at ?? null,
    };
  });
}

export async function getBadgesCatalog(supabase: Supabase): Promise<Badge[]> {
  const { data } = await supabase.from("badges").select("*");
  return data ?? [];
}

export async function getUserBadges(
  supabase: Supabase,
  userId: string,
): Promise<UserBadge[]> {
  const [{ data: catalog }, { data: rows }] = await Promise.all([
    supabase.from("badges").select("*"),
    supabase.from("user_badges").select("*").eq("user_id", userId),
  ]);

  if (!catalog?.length) return [];

  const byBadge = new Map((rows ?? []).map((r) => [r.badge_id, r]));

  return catalog.map((b) => {
    const row = byBadge.get(b.id);
    return {
      ...b,
      level: row?.level ?? 0,
      xp: row?.xp ?? 0,
    };
  });
}

/** Re-sync mission + badge progress (e.g. after community actions). */
export async function syncMissionProgress(
  supabase: Supabase,
  userId: string,
): Promise<{ completedMissionIds: string[]; leveledBadgeIds: string[] }> {
  return progressMissionsAndBadgesAfterSave(supabase, userId);
}

/** Sync mission + badge progress after a new capture. */
export async function progressMissionsAndBadgesAfterSave(
  supabase: Supabase,
  userId: string,
): Promise<{ completedMissionIds: string[]; leveledBadgeIds: string[] }> {
  const [{ data: captures }, { data: missions }, { data: badges }] =
    await Promise.all([
      supabase.from("captures").select("*").eq("user_id", userId),
      supabase.from("missions").select("*"),
      supabase.from("badges").select("*"),
    ]);

  if (!captures || !missions || !badges) {
    return { completedMissionIds: [], leveledBadgeIds: [] };
  }

  const metrics = await computeExtendedMetrics(supabase, userId, captures);
  const completedMissionIds: string[] = [];
  const leveledBadgeIds: string[] = [];

  for (const mission of missions) {
    const value = metricValue(metrics, mission.metric_type);
    const progress = Math.min(value, mission.target_count);
    const completed = progress >= mission.target_count;

    const { data: existing } = await supabase
      .from("user_missions")
      .select("claimed_at, completed_at")
      .eq("user_id", userId)
      .eq("mission_id", mission.id)
      .maybeSingle();

    const wasComplete = Boolean(existing?.completed_at);

    await supabase.from("user_missions").upsert(
      {
        user_id: userId,
        mission_id: mission.id,
        progress,
        completed_at: completed ? existing?.completed_at ?? new Date().toISOString() : null,
        claimed_at: existing?.claimed_at ?? null,
      },
      { onConflict: "user_id,mission_id" },
    );

    if (completed && !wasComplete) {
      completedMissionIds.push(mission.id);
    }
  }

  for (const badge of badges) {
    const value = metricValue(metrics, badge.metric_type);
    const { data: existing } = await supabase
      .from("user_badges")
      .select("level, xp")
      .eq("user_id", userId)
      .eq("badge_id", badge.id)
      .maybeSingle();

    const prevLevel = existing?.level ?? 0;
    let level = prevLevel;
    const xp = value;

    while (level < badge.max_level && xp >= xpForBadgeLevel(level + 1)) {
      level++;
    }

    await supabase.from("user_badges").upsert(
      {
        user_id: userId,
        badge_id: badge.id,
        level,
        xp,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,badge_id" },
    );

    if (level > prevLevel) {
      leveledBadgeIds.push(badge.id);
    }
  }

  return { completedMissionIds, leveledBadgeIds };
}

export async function claimMission(
  supabase: Supabase,
  userId: string,
  missionId: string,
): Promise<{ success: boolean; xp?: number; error?: string }> {
  const { data: row } = await supabase
    .from("user_missions")
    .select("progress, completed_at, claimed_at")
    .eq("user_id", userId)
    .eq("mission_id", missionId)
    .maybeSingle();

  if (!row?.completed_at) {
    return { success: false, error: "Mission not complete yet." };
  }
  if (row.claimed_at) {
    return { success: false, error: "Reward already claimed." };
  }

  const { data: mission } = await supabase
    .from("missions")
    .select("xp_reward")
    .eq("id", missionId)
    .single();

  if (!mission) return { success: false, error: "Mission not found." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp")
    .eq("id", userId)
    .single();

  const newXp = (profile?.total_xp ?? 0) + mission.xp_reward;

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ total_xp: newXp, level: levelFromXp(newXp) })
    .eq("id", userId);

  if (profileErr) return { success: false, error: "Could not award XP." };

  const { error: claimErr } = await supabase
    .from("user_missions")
    .update({ claimed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("mission_id", missionId);

  if (claimErr) return { success: false, error: "Could not claim reward." };

  return { success: true, xp: mission.xp_reward };
}
