"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

import { PawsInAreaGrid } from "@/components/home/paws-in-area-grid";
import { CatButton } from "@/components/ui/cat-button";
import { getCurrentPosition } from "@/lib/geo";
import type { NearbyStrayCat } from "@/lib/nearby-stray-cats";

export function PawsInAreaSection({ userId }: { userId: string }) {
  const [strays, setStrays] = useState<NearbyStrayCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLocation, setNeedsLocation] = useState(false);

  async function load(lat: number, lng: number) {
    setLoading(true);
    setNeedsLocation(false);
    try {
      const res = await fetch(`/api/stray-cats/popular?lat=${lat}&lng=${lng}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { strays?: NearbyStrayCat[] };
      setStrays(data.strays ?? []);
    } catch {
      setStrays([]);
    } finally {
      setLoading(false);
    }
  }

  async function requestAndLoad() {
    try {
      const pos = await getCurrentPosition();
      await load(pos.lat, pos.lng);
    } catch {
      setNeedsLocation(true);
      setLoading(false);
    }
  }

  useEffect(() => {
    void requestAndLoad();
  }, [userId]);

  return (
    <section className="space-y-3">
      <div className="border-b border-border/50 pb-2.5">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Paws in your area
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Popular cats nearby — catch them to unlock
        </p>
      </div>

      {loading && (
        <p className="text-center text-sm text-muted-foreground">Loading nearby cats…</p>
      )}

      {!loading && needsLocation && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 p-6">
          <MapPin className="size-8 text-muted-foreground" />
          <p className="text-center text-sm text-muted-foreground">
            Enable location to see popular cats near you.
          </p>
          <CatButton size="sm" onClick={() => void requestAndLoad()}>
            Enable location
          </CatButton>
        </div>
      )}

      {!loading && !needsLocation && <PawsInAreaGrid strays={strays} />}
    </section>
  );
}
