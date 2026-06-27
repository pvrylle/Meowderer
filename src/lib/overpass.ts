export type PoiType = "shelter" | "vet";

export type Poi = {
  id: string;
  type: PoiType;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
};

export type MapBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

const CACHE_PREFIX = "catdex-overpass:";
const CACHE_TTL_MS = 10 * 60 * 1000;

function cacheKey(bounds: MapBounds, types: PoiType[]): string {
  const rounded = [
    bounds.south.toFixed(2),
    bounds.west.toFixed(2),
    bounds.north.toFixed(2),
    bounds.east.toFixed(2),
    types.sort().join(","),
  ].join("|");
  return `${CACHE_PREFIX}${rounded}`;
}

function readCache(key: string): Poi[] | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { at, pois } = JSON.parse(raw) as { at: number; pois: Poi[] };
    if (Date.now() - at > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return pois;
  } catch {
    return null;
  }
}

function writeCache(key: string, pois: Poi[]): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), pois }));
  } catch {
    // Storage full — ignore.
  }
}

function amenityForType(type: PoiType): string {
  return type === "shelter" ? "animal_shelter" : "veterinary";
}

/** Fetch shelters/vets from OpenStreetMap Overpass (free, no API key). */
export async function fetchPois(
  bounds: MapBounds,
  types: PoiType[],
): Promise<Poi[]> {
  if (types.length === 0) return [];

  const key = cacheKey(bounds, types);
  const cached = readCache(key);
  if (cached) return cached;

  const { south, west, north, east } = bounds;
  const bbox = `${south},${west},${north},${east}`;

  const filters = types
    .map(
      (t) => `
  node["amenity"="${amenityForType(t)}"](${bbox});
  way["amenity"="${amenityForType(t)}"](${bbox});`,
    )
    .join("");

  const query = `[out:json][timeout:25];(${filters});out center tags;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) return [];

  const data = (await res.json()) as {
    elements: Array<{
      id: number;
      type: string;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };

  const pois: Poi[] = [];

  for (const el of data.elements ?? []) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;

    const amenity = el.tags?.amenity;
    const type: PoiType | null =
      amenity === "animal_shelter"
        ? "shelter"
        : amenity === "veterinary"
          ? "vet"
          : null;
    if (!type || !types.includes(type)) continue;

    const name =
      el.tags?.name ??
      el.tags?.operator ??
      (type === "shelter" ? "Animal shelter" : "Veterinary clinic");

    const address =
      [
        el.tags?.["addr:street"],
        el.tags?.["addr:city"],
        el.tags?.["addr:country"],
      ]
        .filter(Boolean)
        .join(", ") || null;

    pois.push({
      id: `${el.type}-${el.id}`,
      type,
      name,
      lat,
      lng,
      address,
    });
  }

  writeCache(key, pois);
  return pois;
}

export function osmLink(poi: Poi): string {
  return `https://www.openstreetmap.org/?mlat=${poi.lat}&mlon=${poi.lng}#map=17/${poi.lat}/${poi.lng}`;
}
