import { createClient } from "@/lib/supabase/server";
import type { Capture, StrayCat } from "@/lib/supabase/types";

export type StraySighting = Pick<
  Capture,
  "id" | "sticker_url" | "nickname" | "caught_at" | "user_id" | "city" | "country" | "place_label"
> & {
  username: string | null;
};

export async function getStrayCat(id: string): Promise<StrayCat | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("stray_cats").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function getStrayCatSightings(strayCatId: string): Promise<StraySighting[]> {
  const supabase = await createClient();
  const { data: captures } = await supabase
    .from("captures")
    .select("id, sticker_url, nickname, caught_at, user_id, city, country, place_label")
    .eq("stray_cat_id", strayCatId)
    .eq("share_photo", true)
    .order("caught_at", { ascending: false })
    .limit(24);

  if (!captures?.length) return [];

  const userIds = [...new Set(captures.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", userIds);

  const nameMap = new Map(profiles?.map((p) => [p.id, p.username]) ?? []);

  return captures.map((c) => ({
    ...c,
    username: nameMap.get(c.user_id) ?? null,
  }));
}

export async function getPublicMapCaptures(): Promise<Capture[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("captures")
    .select(
      "id, user_id, photo_url, sticker_url, lat, lng, city, country, place_label, coat_type, rarity, nickname, caught_at, stray_cat_id, share_photo, share_location, short_description, traits, image_embedding, name_locked_at",
    )
    .eq("share_location", true)
    .not("lat", "is", null)
    .not("lng", "is", null)
    .limit(200);

  return (data ?? []) as Capture[];
}
