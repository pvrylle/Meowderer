import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Public stray cat hint — returns fields safe to show before unlock.
 * coat_type is pulled from the most-sighted capture linked to this stray
 * since stray_cats itself doesn't store coat info.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("stray_cats")
    .select(
      "id, canonical_name, place_label, primary_lat, primary_lng, cover_sticker_url, image_embedding, sighting_count",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Grab coat_type from the most recent shared capture for this stray.
  const { data: coatRow } = await supabase
    .from("captures")
    .select("coat_type")
    .eq("stray_cat_id", id)
    .eq("share_photo", true)
    .order("caught_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Parse embedding stored as JSON string or array.
  let image_embedding: number[] | null = null;
  if (Array.isArray(data.image_embedding)) {
    image_embedding = data.image_embedding as number[];
  } else if (typeof data.image_embedding === "string") {
    try {
      const parsed: unknown = JSON.parse(data.image_embedding);
      if (Array.isArray(parsed)) image_embedding = parsed as number[];
    } catch {
      // leave null
    }
  }

  return NextResponse.json({
    id: data.id,
    canonical_name: data.canonical_name,
    coat_type: coatRow?.coat_type ?? null,
    place_label: data.place_label ?? null,
    primary_lat: data.primary_lat,
    primary_lng: data.primary_lng,
    cover_sticker_url: data.cover_sticker_url,
    image_embedding,
    sighting_count: data.sighting_count,
  });
}
