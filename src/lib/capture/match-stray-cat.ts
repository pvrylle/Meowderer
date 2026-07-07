import { cosineSimilarity } from "./image-embedding";

export type StrayCatCandidate = {
  id: string;
  canonical_name: string | null;
  sighting_count: number;
  cover_sticker_url: string | null;
  primary_lat: number | null;
  primary_lng: number | null;
  image_embedding: number[] | null;
};

const MATCH_THRESHOLD = 0.82;
const MAX_DISTANCE_M = 500;

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function fetchNearbyStrayCats(
  lat: number,
  lng: number,
  radiusKm = 0.5,
): Promise<StrayCatCandidate[]> {
  const res = await fetch(
    `/api/stray-cats/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`,
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { cats?: StrayCatCandidate[] };
  return data.cats ?? [];
}

export type StrayMatch = StrayCatCandidate & {
  /** Cosine similarity 0–1 */
  score: number;
  /** Distance from capture point in metres */
  distanceM: number;
};

/** A single shared-album entry for a stray cat (public sightings only). */
export type StraySightingLite = {
  id: string;
  sticker_url: string;
  username: string | null;
  place_label: string | null;
  city: string | null;
};

/**
 * Fetch the shared album (public sightings) for one stray cat. Used by the
 * "Same cat?" dialog to preview a candidate's other photos. Candidates are
 * already geo-fenced by `findStrayMatches` (within MAX_DISTANCE_M), so the
 * album shown is always for a nearby cat.
 */
export async function fetchStraySightings(
  strayId: string,
): Promise<StraySightingLite[]> {
  try {
    const res = await fetch(
      `/api/stray-cats/${encodeURIComponent(strayId)}/sightings`,
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { sightings?: StraySightingLite[] };
    return data.sightings ?? [];
  } catch {
    return [];
  }
}

export function findBestStrayMatch(
  embedding: number[],
  lat: number,
  lng: number,
  candidates: StrayCatCandidate[],
): StrayCatCandidate | null {
  const matches = findStrayMatches(embedding, lat, lng, candidates);
  return matches[0] ?? null;
}

/**
 * Returns up to 3 candidates ranked by cosine similarity, all above the
 * threshold and within the max distance. Callers can show a picker when
 * multiple candidates qualify.
 */
export function findStrayMatches(
  embedding: number[],
  lat: number,
  lng: number,
  candidates: StrayCatCandidate[],
  maxResults = 3,
): StrayMatch[] {
  const scored: StrayMatch[] = [];

  for (const cat of candidates) {
    if (cat.primary_lat == null || cat.primary_lng == null) continue;
    const distanceM = haversineM(lat, lng, cat.primary_lat, cat.primary_lng);
    if (distanceM > MAX_DISTANCE_M) continue;
    if (!cat.image_embedding?.length) continue;

    const score = cosineSimilarity(embedding, cat.image_embedding);
    if (score >= MATCH_THRESHOLD) {
      scored.push({ ...cat, score, distanceM });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

// ─── Pre-linked stray unlock ─────────────────────────────────────────────────

/**
 * The data we show as a hint while the user is hunting a specific stray.
 * Contains just enough to guide them without revealing the full locked sticker.
 */
export type StrayHint = {
  id: string;
  canonical_name: string | null;
  coat_type: string | null;
  place_label: string | null;
  primary_lat: number | null;
  primary_lng: number | null;
  cover_sticker_url: string | null;
  image_embedding: number[] | null;
  sighting_count: number;
};

/** Fetch public hint data for a single stray from the server. */
export async function fetchStrayHint(strayId: string): Promise<StrayHint | null> {
  try {
    const res = await fetch(`/api/stray-cats/${encodeURIComponent(strayId)}`);
    if (!res.ok) return null;
    return (await res.json()) as StrayHint;
  } catch {
    return null;
  }
}

/**
 * Relaxed threshold for the intentional "catch this specific stray" flow.
 * Lower than MATCH_THRESHOLD (0.82) because the user is deliberately hunting
 * the cat, so we accept different angles / lighting. Still high enough to
 * reject dogs, people, and objects (which score near 0).
 */
const PRELINKED_SIMILARITY_THRESHOLD = 0.55;

export type StrayVerifyResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Verify that a photo is plausibly the pre-linked stray by checking:
 *  1. GPS proximity — user must be within MAX_DISTANCE_M of the stray's location.
 *  2. Embedding similarity — photo must resemble the stray above the relaxed threshold.
 *
 * If the stray has no stored embedding (first-ever sighting), the similarity
 * check is skipped and only GPS proximity is required.
 */
export function verifyStrayMatch(
  hint: StrayHint,
  photoEmbedding: number[],
  userLat: number,
  userLng: number,
): StrayVerifyResult {
  // 1. GPS proximity check.
  if (hint.primary_lat != null && hint.primary_lng != null) {
    const distM = haversineM(userLat, userLng, hint.primary_lat, hint.primary_lng);
    if (distM > MAX_DISTANCE_M) {
      const distStr =
        distM < 1000
          ? `${Math.round(distM)}m`
          : `${(distM / 1000).toFixed(1)}km`;
      return {
        ok: false,
        reason: `You're ${distStr} away — get closer to where this cat was last spotted (within ${MAX_DISTANCE_M}m).`,
      };
    }
  }

  // 2. Embedding similarity check (skip if no stored embedding yet).
  if (hint.image_embedding?.length) {
    const score = cosineSimilarity(photoEmbedding, hint.image_embedding);
    if (score < PRELINKED_SIMILARITY_THRESHOLD) {
      return {
        ok: false,
        reason: "That doesn't look like the right cat — make sure you're photographing the same one.",
      };
    }
  }

  return { ok: true };
}
