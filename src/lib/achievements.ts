import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Capture, Rarity } from "@/lib/supabase/types";
import type { Database } from "@/lib/supabase/types";

export type Achievement = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
};

export type UnlockedAchievement = Achievement & { unlocked_at: string };

type Supabase = SupabaseClient<Database>;

export async function getAchievementsCatalog(
  supabase: Supabase,
): Promise<Achievement[]> {
  const { data } = await supabase.from("achievements").select("*");
  return data ?? [];
}

export async function getUserAchievements(
  supabase: Supabase,
  userId: string,
): Promise<UnlockedAchievement[]> {
  const [{ data: unlocks }, { data: catalog }] = await Promise.all([
    supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", userId),
    supabase.from("achievements").select("*"),
  ]);

  if (!unlocks?.length || !catalog?.length) return [];

  const byId = new Map(catalog.map((a) => [a.id, a]));

  return unlocks
    .map((row) => {
      const ach = byId.get(row.achievement_id);
      if (!ach) return null;
      return { ...ach, unlocked_at: row.unlocked_at };
    })
    .filter((a): a is UnlockedAchievement => a != null);
}

function evaluateUnlocks(
  captures: Capture[],
  newCapture: Capture,
  alreadyUnlocked: Set<string>,
): string[] {
  const toUnlock: string[] = [];
  const count = captures.length;
  const cities = new Set(
    captures.map((c) => c.city).filter((c): c is string => Boolean(c)),
  );
  const countries = new Set(
    captures.map((c) => c.country).filter((c): c is string => Boolean(c)),
  );
  const coats = new Set(
    captures.map((c) => c.coat_type).filter((c): c is string => Boolean(c)),
  );

  const tryUnlock = (id: string, condition: boolean) => {
    if (condition && !alreadyUnlocked.has(id)) toUnlock.push(id);
  };

  tryUnlock("first_catch", count >= 1);
  tryUnlock("five_cats", count >= 5);
  tryUnlock("ten_cats", count >= 10);
  tryUnlock("three_cities", cities.size >= 3);
  tryUnlock("three_countries", countries.size >= 3);
  tryUnlock(
    "rare_find",
    newCapture.rarity === "rare" || newCapture.rarity === "epic",
  );
  tryUnlock("coat_variety", coats.size >= 5);

  return toUnlock;
}

/** Check rules after a new capture is saved; insert unlock rows. */
export async function unlockAchievementsAfterSave(
  supabase: Supabase,
  userId: string,
  newCapture: Capture,
): Promise<Achievement[]> {
  const [{ data: captures }, { data: existing }, { data: catalog }] =
    await Promise.all([
      supabase.from("captures").select("*").eq("user_id", userId),
      supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", userId),
      supabase.from("achievements").select("*"),
    ]);

  if (!captures || !catalog) return [];

  const alreadyUnlocked = new Set(
    (existing ?? []).map((r) => r.achievement_id),
  );
  const ids = evaluateUnlocks(captures, newCapture, alreadyUnlocked);
  if (ids.length === 0) return [];

  const { error } = await supabase.from("user_achievements").insert(
    ids.map((achievement_id) => ({ user_id: userId, achievement_id })),
  );

  if (error) return [];

  return catalog.filter((a) => ids.includes(a.id));
}

/** Backfill city/country for captures that have coords but no place data. */
export async function backfillMissingPlaces(
  supabase: Supabase,
  userId: string,
): Promise<number> {
  const { reverseGeocode } = await import("@/lib/geocode");

  const { data: rows } = await supabase
    .from("captures")
    .select("id, lat, lng, city, country")
    .eq("user_id", userId)
    .not("lat", "is", null)
    .not("lng", "is", null)
    .or("city.is.null,country.is.null");

  if (!rows?.length) return 0;

  let updated = 0;
  for (const row of rows) {
    if (row.lat == null || row.lng == null) continue;
    const { city, country } = await reverseGeocode(row.lat, row.lng);
    if (!city && !country) continue;

    const { error } = await supabase
      .from("captures")
      .update({
        city: row.city ?? city,
        country: row.country ?? country,
      })
      .eq("id", row.id)
      .eq("user_id", userId);

    if (!error) updated++;
  }

  return updated;
}

export function countCoatTypes(captures: Capture[]): number {
  return new Set(
    captures.map((c) => c.coat_type).filter((c): c is string => Boolean(c)),
  ).size;
}

export function isRareOrEpic(rarity: Rarity | null): boolean {
  return rarity === "rare" || rarity === "epic";
}
