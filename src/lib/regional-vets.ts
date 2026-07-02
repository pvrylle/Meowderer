import { REGIONAL_VETS, type RegionalVet } from "@/data/regional-vets";
import { haversineKm } from "@/lib/featured-places";
import type { MapBounds } from "@/lib/overpass";
import type { Poi } from "@/lib/overpass";

function inBounds(v: RegionalVet, bounds: MapBounds): boolean {
  const { south, north, west, east } = bounds;
  const crossesAntimeridian = east < west;
  if (v.lat < south || v.lat > north) return false;
  if (crossesAntimeridian) {
    return v.lng >= west || v.lng <= east;
  }
  return v.lng >= west && v.lng <= east;
}

export function regionalVetToPoi(v: RegionalVet): Poi {
  return {
    id: `regional-vet-${v.id}`,
    type: "vet",
    name: v.name,
    lat: v.lat,
    lng: v.lng,
    address: [v.city, v.region, v.country].filter(Boolean).join(", "),
  };
}

export function getRegionalVetsForMap(
  centerLat: number,
  centerLng: number,
  bounds: MapBounds,
  zoom: number,
): Poi[] {
  const radiusKm = zoom < 9 ? (zoom < 5 ? 250 : zoom < 7 ? 120 : 80) : 60;
  const limit = zoom < 9 ? (zoom < 5 ? 8 : 12) : 20;

  const byId = new Map<string, Poi>();

  const nearby = REGIONAL_VETS.map((v) => ({
    vet: v,
    dist: haversineKm(centerLat, centerLng, v.lat, v.lng),
  }))
    .filter(({ dist }) => dist <= radiusKm)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit);

  for (const { vet } of nearby) {
    byId.set(vet.id, regionalVetToPoi(vet));
  }

  if (zoom >= 9) {
    for (const vet of REGIONAL_VETS) {
      if (inBounds(vet, bounds)) {
        byId.set(vet.id, regionalVetToPoi(vet));
      }
    }
  }

  return [...byId.values()];
}

export type { RegionalVet };
