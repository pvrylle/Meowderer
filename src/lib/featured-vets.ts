import { FEATURED_VETS, type FeaturedVet } from "@/data/featured-vets";
import { haversineKm } from "@/lib/featured-places";
import type { MapBounds } from "@/lib/overpass";

export function getFeaturedVetsInBounds(bounds: MapBounds): FeaturedVet[] {
  const { south, north, west, east } = bounds;
  const crossesAntimeridian = east < west;

  return FEATURED_VETS.filter((p) => {
    if (p.lat < south || p.lat > north) return false;
    if (crossesAntimeridian) {
      return p.lng >= west || p.lng <= east;
    }
    return p.lng >= west && p.lng <= east;
  });
}

export function getNearestFeaturedVets(
  lat: number,
  lng: number,
  maxRadiusKm = 50,
  limit = 5,
): FeaturedVet[] {
  return FEATURED_VETS.map((p) => ({
    place: p,
    dist: haversineKm(lat, lng, p.lat, p.lng),
  }))
    .filter(({ dist }) => dist <= maxRadiusKm)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map(({ place }) => place);
}

export function getFeaturedVetsForMap(
  centerLat: number,
  centerLng: number,
  bounds: MapBounds,
  zoom: number,
): FeaturedVet[] {
  if (zoom < 9) {
    const radiusKm = zoom < 5 ? 200 : zoom < 7 ? 100 : 60;
    const limit = zoom < 5 ? 3 : zoom < 7 ? 5 : 6;
    return getNearestFeaturedVets(centerLat, centerLng, radiusKm, limit);
  }

  const byId = new Map<string, FeaturedVet>();
  const nearbyRadius = zoom < 12 ? 50 : 80;
  const nearbyLimit = zoom < 12 ? 8 : 12;

  for (const place of getNearestFeaturedVets(
    centerLat,
    centerLng,
    nearbyRadius,
    nearbyLimit,
  )) {
    byId.set(place.id, place);
  }

  if (zoom >= 10) {
    for (const place of getFeaturedVetsInBounds(bounds)) {
      byId.set(place.id, place);
    }
  }

  return [...byId.values()];
}

export function countNearbyFeaturedVets(
  lat: number,
  lng: number,
  maxRadiusKm = 50,
): number {
  return FEATURED_VETS.filter(
    (p) => haversineKm(lat, lng, p.lat, p.lng) <= maxRadiusKm,
  ).length;
}

export function dedupePoisAgainstFeaturedVets<
  T extends { lat: number; lng: number },
>(pois: T[], featured: FeaturedVet[], thresholdM = 100): T[] {
  if (featured.length === 0) return pois;
  const thresholdKm = thresholdM / 1000;
  return pois.filter(
    (poi) =>
      !featured.some(
        (f) => haversineKm(poi.lat, poi.lng, f.lat, f.lng) < thresholdKm,
      ),
  );
}

export type { FeaturedVet };
