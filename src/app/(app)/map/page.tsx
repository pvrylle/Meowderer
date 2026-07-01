import { MapView } from "@/components/map/map-view";
import { getCaptures } from "@/lib/captures";
import { capturesToGeoJSON } from "@/lib/map";
import { getPublicMapCaptures } from "@/lib/stray-cats";
import type { Capture } from "@/lib/supabase/types";

function mergeCaptures(own: Capture[], publicOnes: Capture[]): Capture[] {
  const map = new Map<string, Capture>();
  for (const c of own) map.set(c.id, c);
  for (const c of publicOnes) {
    if (!map.has(c.id)) map.set(c.id, c);
  }
  return [...map.values()];
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; stray?: string }>;
}) {
  const params = await searchParams;
  const [ownCaptures, publicCaptures] = await Promise.all([
    getCaptures(),
    getPublicMapCaptures(),
  ]);

  const captures = mergeCaptures(ownCaptures, publicCaptures);
  const geojson = capturesToGeoJSON(captures);

  let focusCatId = params.cat;
  if (!focusCatId && params.stray) {
    const match = captures.find((c) => c.stray_cat_id === params.stray);
    focusCatId = match?.id;
  }

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden">
      <MapView geojson={geojson} focusCatId={focusCatId} />
    </div>
  );
}
