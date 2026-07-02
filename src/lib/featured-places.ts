import {
  FEATURED_PLACES,
  type FeaturedPlace,
} from "@/data/featured-places";
import type { MapBounds } from "@/lib/overpass";

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getFeaturedPlacesInBounds(bounds: MapBounds): FeaturedPlace[] {
  const { south, north, west, east } = bounds;
  const crossesAntimeridian = east < west;

  return FEATURED_PLACES.filter((p) => {
    if (p.lat < south || p.lat > north) return false;
    if (crossesAntimeridian) {
      return p.lng >= west || p.lng <= east;
    }
    return p.lng >= west && p.lng <= east;
  });
}

/** Featured pins to show on the map — zoom-aware so wide views stay uncluttered. */
export function getFeaturedPlacesForMap(
  centerLat: number,
  centerLng: number,
  bounds: MapBounds,
  zoom: number,
): FeaturedPlace[] {
  if (zoom < 9) {
    const radiusKm = zoom < 5 ? 200 : zoom < 7 ? 100 : 60;
    const limit = zoom < 5 ? 3 : zoom < 7 ? 5 : 6;
    return getNearestFeatured(centerLat, centerLng, radiusKm, limit);
  }

  const byId = new Map<string, FeaturedPlace>();
  const nearbyRadius = zoom < 12 ? 50 : 80;
  const nearbyLimit = zoom < 12 ? 8 : 12;

  for (const place of getNearestFeatured(
    centerLat,
    centerLng,
    nearbyRadius,
    nearbyLimit,
  )) {
    byId.set(place.id, place);
  }

  if (zoom >= 10) {
    for (const place of getFeaturedPlacesInBounds(bounds)) {
      byId.set(place.id, place);
    }
  }

  return [...byId.values()];
}

export function getNearestFeatured(
  lat: number,
  lng: number,
  maxRadiusKm = 50,
  limit = 5,
): FeaturedPlace[] {
  return FEATURED_PLACES.map((p) => ({
    place: p,
    dist: haversineKm(lat, lng, p.lat, p.lng),
  }))
    .filter(({ dist }) => dist <= maxRadiusKm)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map(({ place }) => place);
}

export function countNearbyFeaturedShelters(
  lat: number,
  lng: number,
  maxRadiusKm = 50,
): number {
  return FEATURED_PLACES.filter(
    (p) =>
      (p.type === "shelter" || p.type === "sanctuary") &&
      haversineKm(lat, lng, p.lat, p.lng) <= maxRadiusKm,
  ).length;
}

/** Hide Overpass POI if within ~100m of a featured place. */
export function dedupePoisAgainstFeatured<
  T extends { lat: number; lng: number },
>(pois: T[], featured: FeaturedPlace[], thresholdM = 100): T[] {
  if (featured.length === 0) return pois;
  const thresholdKm = thresholdM / 1000;
  return pois.filter(
    (poi) =>
      !featured.some(
        (f) => haversineKm(poi.lat, poi.lng, f.lat, f.lng) < thresholdKm,
      ),
  );
}

export type { FeaturedPlace };
