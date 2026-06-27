import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

type Supabase = SupabaseClient<Database>;

function utcDateString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function yesterdayUtc(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return utcDateString(d);
}

/** Update streak after a successful capture save (UTC dates). */
export async function updateStreakOnSave(
  supabase: Supabase,
  userId: string,
): Promise<void> {
  const today = utcDateString();

  const { data: profile } = await supabase
    .from("profiles")
    .select("streak_count, last_capture_date")
    .eq("id", userId)
    .single();

  const last = profile?.last_capture_date ?? null;
  let streak = profile?.streak_count ?? 0;

  if (last === today) {
    // Same UTC day — streak unchanged.
  } else if (last === yesterdayUtc()) {
    streak += 1;
  } else {
    streak = 1;
  }

  await supabase
    .from("profiles")
    .update({ streak_count: streak, last_capture_date: today })
    .eq("id", userId);
}

export function countCapturesToday(
  caughtAtValues: string[],
  today = utcDateString(),
): number {
  return caughtAtValues.filter((caughtAt) =>
    caughtAt.startsWith(today),
  ).length;
}
