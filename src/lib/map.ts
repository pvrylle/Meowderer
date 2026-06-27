import type { Capture, Rarity } from "@/lib/supabase/types";
import type maplibregl from "maplibre-gl";

export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

/** Default view before bounds are fitted (roughly SE Asia). */
export const MAP_DEFAULT_CENTER: [number, number] = [110, 15];
export const MAP_DEFAULT_ZOOM = 2;

/** MapLibre needs literal hex colors (not CSS variables). */
export const RARITY_PIN_COLOR: Record<Rarity | "default", string> = {
  common: "#c9d3e3",
  uncommon: "#8fd6a6",
  rare: "#7fb4e8",
  epic: "#b79cf0",
  default: "#9b7ede",
};

export type CapturePointProps = {
  id: string;
  name: string;
  rarity: Rarity | null;
  sticker_url: string;
  place: string | null;
};

export type CaptureGeoJSON = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  CapturePointProps
>;

export function capturesToGeoJSON(captures: Capture[]): CaptureGeoJSON {
  const features: CaptureGeoJSON["features"] = [];

  for (const c of captures) {
    if (c.lat == null || c.lng == null) continue;
    const place =
      [c.city, c.country].filter(Boolean).join(", ") || null;
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [c.lng, c.lat] },
      properties: {
        id: c.id,
        name: c.nickname?.trim() || "Unnamed cat",
        rarity: c.rarity,
        sticker_url: c.sticker_url,
        place,
      },
    });
  }

  return { type: "FeatureCollection", features };
}

/** OpenFreeMap styles reference POI sprites that are not always bundled — supply a 1×1 transparent fallback. */
const BLANK_SPRITE = new Uint8Array(4);

export function suppressMissingStyleSprites(map: maplibregl.Map) {
  map.on("styleimagemissing", (e) => {
    if (map.hasImage(e.id)) return;
    map.addImage(e.id, { width: 1, height: 1, data: BLANK_SPRITE });
  });
}
