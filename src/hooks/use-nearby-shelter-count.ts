"use client";

import { useEffect, useState } from "react";

import {
  countNearbyFeaturedShelters,
  dedupePoisAgainstFeatured,
  getNearestFeatured,
} from "@/lib/featured-places";
import { fetchPois, dedupePoisByProximity } from "@/lib/overpass";
import { getRegionalSheltersForMap } from "@/lib/regional-shelters";
import { getCurrentPosition } from "@/lib/geo";

const LOCAL_RADIUS_DEG = 0.05;
const MAX_LOCAL = 15;

export function useNearbyShelterCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const pos = await getCurrentPosition();
        const featuredCount = countNearbyFeaturedShelters(pos.lat, pos.lng, 50);

        const bounds = {
          south: pos.lat - LOCAL_RADIUS_DEG,
          north: pos.lat + LOCAL_RADIUS_DEG,
          west: pos.lng - LOCAL_RADIUS_DEG,
          east: pos.lng + LOCAL_RADIUS_DEG,
        };

        const pois = await fetchPois(bounds, ["shelter"]).catch(() => [] as Awaited<ReturnType<typeof fetchPois>>);

        const regional = getRegionalSheltersForMap(pos.lat, pos.lng, bounds, 12);
        const featured = getNearestFeatured(pos.lat, pos.lng, 50, 100);
        const merged = dedupePoisByProximity([...pois, ...regional]);
        const deduped = dedupePoisAgainstFeatured(merged, featured);
        const localCount = Math.min(deduped.length, MAX_LOCAL);

        if (!cancelled) setCount(featuredCount + localCount);
      } catch {
        if (!cancelled) setCount(null);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}
