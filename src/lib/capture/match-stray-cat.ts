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

export function findBestStrayMatch(
  embedding: number[],
  lat: number,
  lng: number,
  candidates: StrayCatCandidate[],
): StrayCatCandidate | null {
  let best: StrayCatCandidate | null = null;
  let bestScore = MATCH_THRESHOLD;

  for (const cat of candidates) {
    if (cat.primary_lat == null || cat.primary_lng == null) continue;
    const dist = haversineM(lat, lng, cat.primary_lat, cat.primary_lng);
    if (dist > MAX_DISTANCE_M) continue;
    if (!cat.image_embedding?.length) continue;

    const sim = cosineSimilarity(embedding, cat.image_embedding);
    if (sim >= bestScore) {
      bestScore = sim;
      best = cat;
    }
  }

  return best;
}
