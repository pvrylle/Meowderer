import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { isWithinMeters } from "@/lib/geo";
import type { Capture } from "@/lib/supabase/types";
import type { Database } from "@/lib/supabase/types";

type Supabase = SupabaseClient<Database>;

export type CaptureCommunityTags = {
  helpedIds: Set<string>;
  rescuedIds: Set<string>;
  seenIds: Set<string>;
};

const HELPED_RADIUS_M = 500;

export async function getCaptureCommunityTags(
  supabase: Supabase,
  userId: string,
  captures: Capture[],
): Promise<CaptureCommunityTags> {
  const [{ data: visits }, { data: posts }] = await Promise.all([
    supabase
      .from("user_shelter_visits")
      .select("lat, lng")
      .eq("user_id", userId),
    supabase
      .from("posts")
      .select("capture_id, category")
      .eq("user_id", userId)
      .not("capture_id", "is", null),
  ]);

  const rescuedIds = new Set<string>();
  const seenIds = new Set<string>();
  for (const post of posts ?? []) {
    if (!post.capture_id) continue;
    seenIds.add(post.capture_id);
    if (post.category === "rescue") {
      rescuedIds.add(post.capture_id);
    }
  }

  const helpedIds = new Set<string>();
  const visitCoords = visits ?? [];

  for (const capture of captures) {
    if (capture.lat == null || capture.lng == null) continue;
    for (const visit of visitCoords) {
      if (
        isWithinMeters(
          capture.lat,
          capture.lng,
          visit.lat,
          visit.lng,
          HELPED_RADIUS_M,
        )
      ) {
        helpedIds.add(capture.id);
        break;
      }
    }
  }

  return { helpedIds, rescuedIds, seenIds };
}
