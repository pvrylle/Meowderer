import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") ?? "15");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const box = bbox(lat, lng, radius);

  const { data, error } = await supabase
    .from("stray_cats")
    .select(
      "id, canonical_name, sighting_count, cover_sticker_url, primary_lat, primary_lng, image_embedding",
    )
    .gte("primary_lat", box.south)
    .lte("primary_lat", box.north)
    .gte("primary_lng", box.west)
    .lte("primary_lng", box.east)
    .order("sighting_count", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cats = (data ?? []).map((row) => ({
    ...row,
    image_embedding: parseEmbedding(row.image_embedding),
  }));

  return NextResponse.json({ cats });
}

function parseEmbedding(raw: unknown): number[] | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw as number[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as number[];
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}
