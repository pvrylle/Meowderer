import { MapView } from "@/components/map/map-view";
import { getCaptures } from "@/lib/captures";
import { capturesToGeoJSON } from "@/lib/map";

export default async function MapPage() {
  const captures = await getCaptures();
  const geojson = capturesToGeoJSON(captures);

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden">
      <MapView geojson={geojson} />
    </div>
  );
}
