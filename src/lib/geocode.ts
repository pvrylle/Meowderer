import "server-only";

export type GeocodeResult = {
  city: string | null;
  country: string | null;
  place_label: string | null;
};

const CACHE = new Map<string, GeocodeResult>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const cacheTimestamps = new Map<string, number>();

/** Round to ~100m precision for cache keys. */
function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

let lastRequestAt = 0;
const MIN_INTERVAL_MS = 1100; // Nominatim: max 1 req/sec

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

function pickPlaceLabel(address: Record<string, string | undefined>): string | null {
  return (
    address.suburb ??
    address.neighbourhood ??
    address.quarter ??
    address.village ??
    address.hamlet ??
    address.road ??
    address.pedestrian ??
    null
  );
}

function pickCity(address: Record<string, string | undefined>): string | null {
  return (
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.suburb ??
    address.county ??
    null
  );
}

/**
 * Reverse-geocode coordinates via Nominatim (OSM).
 * Results are cached in-memory per rounded coordinate pair.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<GeocodeResult> {
  const key = cacheKey(lat, lng);
  const cached = CACHE.get(key);
  const cachedAt = cacheTimestamps.get(key);
  if (cached && cachedAt && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  await throttle();

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "16");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "CatDex/1.0 (https://github.com/catdex)",
      Accept: "application/json",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    return { city: null, country: null, place_label: null };
  }

  const data = (await res.json()) as {
    address?: Record<string, string | undefined>;
  };

  const address = data.address ?? {};
  const result: GeocodeResult = {
    city: pickCity(address),
    country: address.country ?? null,
    place_label: pickPlaceLabel(address),
  };

  CACHE.set(key, result);
  cacheTimestamps.set(key, Date.now());
  return result;
}
