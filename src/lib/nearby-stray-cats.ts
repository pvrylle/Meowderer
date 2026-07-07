import { createClient } from "@/lib/supabase/server";
import type { StrayCat } from "@/lib/supabase/types";

export const AREA_RADIUS_KM = 15;

export type NearbyStrayCat = StrayCat & {
  discovered: boolean;
  user_capture_id: string | null;
};

export type AreaStats = {
  totalInArea: number;
  foundCount: number;
  lockedCount: number;
  radiusKm: typeof AREA_RADIUS_KM;
  /** Top picks for the home grid */
  strays: NearbyStrayCat[];
  /** Every stray in radius — for map pins */
  mapStrays: NearbyStrayCat[];
};

function bbox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  return {
    south: lat - latDelta,
    north: lat + latDelta,
    west: lng - lngDelta,
    east: lng + lngDelta,
  };
}

function strayInBoxQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  box: ReturnType<typeof bbox>,
) {
  return supabase
    .from("stray_cats")
    .select("id, canonical_name, name_locked_at, primary_lat, primary_lng, place_label, sighting_count, cover_sticker_url, created_at")
    .gte("primary_lat", box.south)
    .lte("primary_lat", box.north)
    .gte("primary_lng", box.west)
    .lte("primary_lng", box.east)
    .gt("sighting_count", 0); // exclude orphans
}

export async function getAreaStatsNearby(
  userId: string,
  lat: number,
  lng: number,
  gridLimit = 8,
): Promise<AreaStats> {
  const supabase = await createClient();
  const box = bbox(lat, lng, AREA_RADIUS_KM);

  const { data: allInArea, error } = await strayInBoxQuery(supabase, box);
  if (error) {
    throw new Error(error.message);
  }

  const allIds = (allInArea ?? []).map((s) => s.id);
  const totalInArea = allIds.length;

  if (totalInArea === 0) {
    return {
      totalInArea: 0,
      foundCount: 0,
      lockedCount: 0,
      radiusKm: AREA_RADIUS_KM,
      strays: [],
      mapStrays: [],
    };
  }

  const { data: userCaptures } = await supabase
    .from("captures")
    .select("id, stray_cat_id")
    .eq("user_id", userId)
    .in("stray_cat_id", allIds);

  const discoveredMap = new Map<string, string>();
  for (const c of userCaptures ?? []) {
    if (c.stray_cat_id) discoveredMap.set(c.stray_cat_id, c.id);
  }

  const foundCount = allIds.filter((id) => discoveredMap.has(id)).length;
  const lockedCount = totalInArea - foundCount;

  const byPopularity = [...(allInArea ?? [])].sort(
    (a, b) => b.sighting_count - a.sighting_count,
  );
  const foundInArea = byPopularity.filter((s) => discoveredMap.has(s.id));
  const lockedInArea = byPopularity.filter((s) => !discoveredMap.has(s.id));
  const slotsForLocked = Math.max(0, gridLimit - foundInArea.length);
  const topStrays = [...foundInArea, ...lockedInArea.slice(0, slotsForLocked)];

  const toNearby = (s: (typeof allInArea)[number]): NearbyStrayCat => ({
    ...s,
    image_embedding: null,
    discovered: discoveredMap.has(s.id),
    user_capture_id: discoveredMap.get(s.id) ?? null,
  });

  const strays: NearbyStrayCat[] = topStrays.map(toNearby);
  const mapStrays: NearbyStrayCat[] = byPopularity.map(toNearby);

  return {
    totalInArea,
    foundCount,
    lockedCount,
    radiusKm: AREA_RADIUS_KM,
    strays,
    mapStrays,
  };
}

/** @deprecated Use getAreaStatsNearby */
export async function getPopularStrayCatsNearby(
  userId: string,
  lat: number,
  lng: number,
  limit = 8,
): Promise<NearbyStrayCat[]> {
  const stats = await getAreaStatsNearby(userId, lat, lng, limit);
  return stats.strays;
}
