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

const CACHE_PREFIX = "catdex-overpass:v2:";
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

/** Collapse POIs within ~80m of each other (keep first). */
export function dedupePoisByProximity<T extends { lat: number; lng: number }>(
  pois: T[],
): T[] {
  const kept: T[] = [];
  for (const poi of pois) {
    const dup = kept.some(
      (k) =>
        Math.abs(k.lat - poi.lat) < 0.0005 &&
        Math.abs(k.lng - poi.lng) < 0.0005,
    );
    if (dup) continue;
    kept.push(poi);
  }
  return kept;
}

const SHELTER_NAME_RE = /animal shelter|pet rescue|dog shelter|cat shelter|animal rescue|animal welfare|paws|rescue center/i;
const SHELTER_NAME_TAG_RE = "animal shelter|pet rescue|dog shelter|cat shelter|animal rescue";
const NGO_NAME_RE = "animal|rescue|shelter|paws|welfare";

function shelterQueryPart(bbox: string): string {
  return `
  node["amenity"="animal_shelter"](${bbox});
  way["amenity"="animal_shelter"](${bbox});
  node["amenity"="animal_boarding"](${bbox});
  way["amenity"="animal_boarding"](${bbox});
  node["amenity"="veterinary"]["name"~"rescue|shelter|welfare|paws",i](${bbox});
  way["amenity"="veterinary"]["name"~"rescue|shelter|welfare|paws",i](${bbox});
  node["office"="ngo"]["name"~"${NGO_NAME_RE}",i](${bbox});
  way["office"="ngo"]["name"~"${NGO_NAME_RE}",i](${bbox});
  node["name"~"${SHELTER_NAME_TAG_RE}",i](${bbox});
  way["name"~"${SHELTER_NAME_TAG_RE}",i](${bbox});`;
}

function vetQueryPart(bbox: string): string {
  return `
  node["amenity"="veterinary"](${bbox});
  way["amenity"="veterinary"](${bbox});`;
}

function classifyPoiType(
  tags: Record<string, string> | undefined,
  types: PoiType[],
): PoiType | null {
  if (!tags) return null;

  const amenity = tags.amenity;
  const name = (tags.name ?? tags.operator ?? "").toLowerCase();
  const office = tags.office;

  const isShelter =
    amenity === "animal_shelter" ||
    amenity === "animal_boarding" ||
    (amenity === "veterinary" && /rescue|shelter|welfare|paws/i.test(name)) ||
    (office === "ngo" && /animal|rescue|shelter|paws|welfare/i.test(name)) ||
    SHELTER_NAME_RE.test(name);

  if (isShelter && types.includes("shelter")) return "shelter";

  if (
    amenity === "veterinary" &&
    !/rescue|shelter|welfare|paws/i.test(name) &&
    types.includes("vet")
  ) {
    return "vet";
  }

  return null;
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

  const parts: string[] = [];
  if (types.includes("shelter")) parts.push(shelterQueryPart(bbox));
  if (types.includes("vet")) parts.push(vetQueryPart(bbox));

  return `[out:json][timeout:25];(${parts.join("")});out center tags;`;
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

    const type = classifyPoiType(el.tags, types);
    if (!type) continue;

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

    if (!res.ok) {
      throw new Error(`POI fetch failed (${res.status})`);
    }

    const data = (await res.json()) as { pois?: Poi[] };
    const pois = data.pois ?? [];
    writeCache(key, pois);
    return pois;
  } catch {
    throw new Error("POI fetch failed");
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
