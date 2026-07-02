"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Camera, MapPin } from "lucide-react";

import { PawsInAreaGrid } from "@/components/home/paws-in-area-grid";
import { CatButton } from "@/components/ui/cat-button";
import { getCurrentPosition } from "@/lib/geo";
import { countNearbyFeaturedShelters } from "@/lib/featured-places";
import { countNearbyFeaturedVets } from "@/lib/featured-vets";
import type { AreaStats, NearbyStrayCat } from "@/lib/nearby-stray-cats";

const CACHE_KEY = "catdex-area-stats";
const CACHE_TTL_MS = 5 * 60 * 1000;

type CachedPayload = {
  at: number;
  lat: number;
  lng: number;
  stats: AreaStats;
};

function readCache(lat: number, lng: number): AreaStats | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedPayload;
    if (Date.now() - cached.at > CACHE_TTL_MS) return null;
    if (Math.abs(cached.lat - lat) > 0.01 || Math.abs(cached.lng - lng) > 0.01) {
      return null;
    }
    return cached.stats;
  } catch {
    return null;
  }
}

function writeCache(lat: number, lng: number, stats: AreaStats): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ at: Date.now(), lat, lng, stats } satisfies CachedPayload),
    );
  } catch {
    // ignore
  }
}

export function PawsInAreaSection({ userId }: { userId: string }) {
  const [stats, setStats] = useState<AreaStats | null>(null);
  const [featuredShelterCount, setFeaturedShelterCount] = useState(0);
  const [featuredVetCount, setFeaturedVetCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load(lat: number, lng: number, useCache = true) {
    const cached = useCache ? readCache(lat, lng) : null;
    if (cached) {
      setStats(cached);
      setFeaturedShelterCount(countNearbyFeaturedShelters(lat, lng));
      setFeaturedVetCount(countNearbyFeaturedVets(lat, lng));
      setLoading(false);
      setNeedsLocation(false);
      setLoadError(null);
      return;
    }

    setLoading(true);
    setNeedsLocation(false);
    setLoadError(null);
    try {
      const res = await fetch(`/api/stray-cats/popular?lat=${lat}&lng=${lng}`);
      const data = (await res.json()) as AreaStats & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load area stats");
      }
      setStats(data);
      writeCache(lat, lng, data);
      setFeaturedShelterCount(countNearbyFeaturedShelters(lat, lng));
      setFeaturedVetCount(countNearbyFeaturedVets(lat, lng));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load cats in your area.";
      setLoadError(message);
      setStats(null);
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

  const strays = stats?.strays ?? [];
  const total = stats?.totalInArea ?? 0;
  const found = stats?.foundCount ?? 0;
  const locked = stats?.lockedCount ?? 0;

  return (
    <section className="space-y-3">
      <div className="border-b border-border/50 pb-2.5">
        <Link
          href="/map?layer=cats"
          className="group block rounded-lg transition-colors active:bg-muted/40"
        >
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {loading
              ? "Paws in your area"
              : total === 0
                ? "Paws in your area"
                : `${total} cat${total === 1 ? "" : "s"} in your area`}
          </h2>
          {!loading && !needsLocation && !loadError && total > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground group-hover:text-foreground/80">
              {found} found · {locked} to unlock · within 15 km
            </p>
          )}
          {!loading && !needsLocation && !loadError && total === 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              No cats spotted nearby yet · within 15 km
            </p>
          )}
          {loading && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Popular cats nearby — catch them to unlock
            </p>
          )}
        </Link>

        {!loading && !needsLocation && featuredShelterCount > 0 && !loadError && (
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {featuredShelterCount} featured shelter
              {featuredShelterCount === 1 ? "" : "s"}
            </span>{" "}
            near you —{" "}
            <Link href="/map?layer=shelters" className="font-semibold text-primary">
              View on map
            </Link>
          </p>
        )}

        {!loading && !needsLocation && featuredVetCount > 0 && !loadError && (
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {featuredVetCount} featured vet
              {featuredVetCount === 1 ? "" : "s"}
            </span>{" "}
            near you —{" "}
            <Link href="/map?layer=vets" className="font-semibold text-primary">
              View on map
            </Link>
          </p>
        )}
      </div>

      {loading && (
        <p className="text-center text-sm text-muted-foreground">Loading nearby cats…</p>
      )}

      {!loading && loadError && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 p-6">
          <p className="text-center text-sm text-foreground">
            Could not load area stats.
          </p>
          <p className="text-center text-xs text-muted-foreground">{loadError}</p>
          {loadError.includes("stray_cats") && (
            <p className="text-center text-xs text-muted-foreground">
              Run migration{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                0010_stray_cats_and_qa.sql
              </code>{" "}
              in Supabase.
            </p>
          )}
          <CatButton size="sm" variant="outline" onClick={() => void requestAndLoad()}>
            Retry
          </CatButton>
        </div>
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

      {!loading && !needsLocation && !loadError && total === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 p-6">
          <p className="text-center text-sm text-muted-foreground">
            Be the first to catch a cat in your area!
          </p>
          <Link href="/catch">
            <CatButton size="sm">
              <Camera className="size-4" />
              Catch a cat
            </CatButton>
          </Link>
        </div>
      )}

      {!loading && !needsLocation && !loadError && total > 0 && (
        <PawsInAreaGrid strays={strays} totalInArea={total} />
      )}
    </section>
  );
}
