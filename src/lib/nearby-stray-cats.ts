import { createClient } from "@/lib/supabase/server";
import type { StrayCat } from "@/lib/supabase/types";

export type NearbyStrayCat = StrayCat & {
  discovered: boolean;
  user_capture_id: string | null;
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

export async function getPopularStrayCatsNearby(
  userId: string,
  lat: number,
  lng: number,
  limit = 8,
): Promise<NearbyStrayCat[]> {
  const supabase = await createClient();
  const box = bbox(lat, lng, 15);

  const { data: strays } = await supabase
    .from("stray_cats")
    .select("*")
    .gte("primary_lat", box.south)
    .lte("primary_lat", box.north)
    .gte("primary_lng", box.west)
    .lte("primary_lng", box.east)
    .order("sighting_count", { ascending: false })
    .limit(limit);

  if (!strays?.length) return [];

  const strayIds = strays.map((s) => s.id);
  const { data: userCaptures } = await supabase
    .from("captures")
    .select("id, stray_cat_id")
    .eq("user_id", userId)
    .in("stray_cat_id", strayIds);

  const discoveredMap = new Map<string, string>();
  for (const c of userCaptures ?? []) {
    if (c.stray_cat_id) discoveredMap.set(c.stray_cat_id, c.id);
  }

  return strays.map((s) => ({
    ...s,
    image_embedding: null,
    discovered: discoveredMap.has(s.id),
    user_capture_id: discoveredMap.get(s.id) ?? null,
  }));
}
