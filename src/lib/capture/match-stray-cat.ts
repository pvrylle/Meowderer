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
