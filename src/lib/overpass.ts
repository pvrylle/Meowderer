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

/** Max bbox side length sent to Overpass (large queries time out). */
export const POI_MAX_BBOX_DEGREES = 2;

/** Below this zoom, POI fetch is skipped (viewport too wide to be useful). */
export const POI_MIN_ZOOM = 7;

const CACHE_PREFIX = "catdex-overpass:";
const CACHE_TTL_MS = 10 * 60 * 1000;

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
] as const;

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

/** Shrink oversized map bounds to a query-safe bbox centered on the viewport. */
export function clampPoiBounds(bounds: MapBounds): MapBounds {
  let { south, west, north, east } = bounds;

  if (![south, west, north, east].every(Number.isFinite)) {
    return { south: 14, west: 109, north: 16, east: 111 };
  }

  if (north < south) [south, north] = [north, south];

  let lngSpan = east - west;
  if (lngSpan <= 0) lngSpan += 360;
  if (lngSpan > 180) lngSpan = 360 - lngSpan;

  const latSpan = Math.max(north - south, 0.01);
  const centerLat = (south + north) / 2;
  let centerLng = (west + east) / 2;
  if (east < west) {
    centerLng = ((west + east + 360) / 2) % 360;
    if (centerLng > 180) centerLng -= 360;
  }

  const halfLat = Math.min(latSpan / 2, POI_MAX_BBOX_DEGREES / 2);
  const halfLng = Math.min(lngSpan / 2, POI_MAX_BBOX_DEGREES / 2);

  south = Math.max(-90, centerLat - halfLat);
  north = Math.min(90, centerLat + halfLat);
  west = Math.max(-180, centerLng - halfLng);
  east = Math.min(180, centerLng + halfLng);

  if (north - south < 0.01) north = south + 0.01;
  if (east - west < 0.01) east = west + 0.01;

  return { south, west, north, east };
}

export function buildOverpassQuery(bounds: MapBounds, types: PoiType[]): string {
  const { south, west, north, east } = bounds;
  const bbox = `${south},${west},${north},${east}`;

  const filters = types
    .map(
      (t) => `
  node["amenity"="${amenityForType(t)}"](${bbox});
  way["amenity"="${amenityForType(t)}"](${bbox});`,
    )
    .join("");

  return `[out:json][timeout:25];(${filters});out center tags;`;
}

type OverpassElement = {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export function parseOverpassElements(
  elements: OverpassElement[],
  types: PoiType[],
): Poi[] {
  const pois: Poi[] = [];

  for (const el of elements) {
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

  return pois;
}

/** Server-side Overpass query with mirror fallback. */
export async function queryOverpassServer(
  bounds: MapBounds,
  types: PoiType[],
): Promise<Poi[]> {
  if (types.length === 0) return [];

  const query = buildOverpassQuery(clampPoiBounds(bounds), types);
  const body = `data=${encodeURIComponent(query)}`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(28_000),
      });
      if (!res.ok) continue;

      const data = (await res.json()) as { elements?: OverpassElement[] };
      return parseOverpassElements(data.elements ?? [], types);
    } catch {
      continue;
    }
  }

  return [];
}

/** Fetch shelters/vets via the app API (avoids browser CORS/network blocks). */
export async function fetchPois(
  bounds: MapBounds,
  types: PoiType[],
): Promise<Poi[]> {
  if (types.length === 0) return [];

  const safeBounds = clampPoiBounds(bounds);
  const key = cacheKey(safeBounds, types);
  const cached = readCache(key);
  if (cached) return cached;

  try {
    const res = await fetch("/api/overpass/pois", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bounds: safeBounds, types }),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { pois?: Poi[] };
    const pois = data.pois ?? [];
    writeCache(key, pois);
    return pois;
  } catch {
    return [];
  }
}

export function osmLink(poi: Poi): string {
  return `https://www.openstreetmap.org/?mlat=${poi.lat}&mlon=${poi.lng}#map=17/${poi.lat}/${poi.lng}`;
}

export function googleMapsSearchLink(lat: number, lng: number, name?: string): string {
  const query = name ? encodeURIComponent(`${name}@${lat},${lng}`) : `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function googleMapsDirectionsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
