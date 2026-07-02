import {
  REGIONAL_SHELTERS,
  type RegionalShelter,
} from "@/data/regional-shelters";
import { haversineKm } from "@/lib/featured-places";
import type { MapBounds } from "@/lib/overpass";
import type { Poi } from "@/lib/overpass";

function inBounds(s: RegionalShelter, bounds: MapBounds): boolean {
  const { south, north, west, east } = bounds;
  const crossesAntimeridian = east < west;
  if (s.lat < south || s.lat > north) return false;
  if (crossesAntimeridian) {
    return s.lng >= west || s.lng <= east;
  }
  return s.lng >= west && s.lng <= east;
}

export function regionalShelterToPoi(s: RegionalShelter): Poi {
  return {
    id: `regional-${s.id}`,
    type: "shelter",
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    address: [s.city, s.region, s.country].filter(Boolean).join(", "),
  };
}

/** Local shelter list for map — nearby + in viewport, zoom-aware. */
export function getRegionalSheltersForMap(
  centerLat: number,
  centerLng: number,
  bounds: MapBounds,
  zoom: number,
): Poi[] {
  const radiusKm = zoom < 9 ? (zoom < 5 ? 250 : zoom < 7 ? 120 : 80) : 60;
  const limit = zoom < 9 ? (zoom < 5 ? 8 : 12) : 20;

  const byId = new Map<string, Poi>();

  const nearby = REGIONAL_SHELTERS.map((s) => ({
    shelter: s,
    dist: haversineKm(centerLat, centerLng, s.lat, s.lng),
  }))
    .filter(({ dist }) => dist <= radiusKm)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit);

  for (const { shelter } of nearby) {
    byId.set(shelter.id, regionalShelterToPoi(shelter));
  }

  if (zoom >= 9) {
    for (const shelter of REGIONAL_SHELTERS) {
      if (inBounds(shelter, bounds)) {
        byId.set(shelter.id, regionalShelterToPoi(shelter));
      }
    }
  }

  return [...byId.values()];
}

export type { RegionalShelter };
