"use client";

import { useEffect, useState } from "react";

import { fetchPois } from "@/lib/overpass";
import { getCurrentPosition } from "@/lib/geo";

export function useNearbyShelterCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const pos = await getCurrentPosition();
        const delta = 0.05;
        const pois = await fetchPois(
          {
            south: pos.lat - delta,
            north: pos.lat + delta,
            west: pos.lng - delta,
            east: pos.lng + delta,
          },
          ["shelter"],
        );
        if (!cancelled) setCount(pois.length);
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
