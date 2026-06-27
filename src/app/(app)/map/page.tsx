import { MapPin } from "lucide-react";

import { CatchMap } from "@/components/map/catch-map";
import { getCaptures } from "@/lib/captures";
import { capturesToGeoJSON } from "@/lib/map";

export default async function MapPage() {
  const captures = await getCaptures();
  const geojson = capturesToGeoJSON(captures);
  const pinCount = geojson.features.length;

  return (
    <div className="flex min-h-[calc(100dvh-7.5rem)] flex-col">
      <header className="shrink-0 border-b border-border bg-card/80 px-6 py-4 backdrop-blur">
        <h1 className="text-xl font-extrabold text-foreground">Map</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5" />
          {pinCount === 0
            ? "Your catches will appear here"
            : `${pinCount} ${pinCount === 1 ? "pin" : "pins"} on the map`}
        </p>
      </header>
      <div className="relative min-h-0 flex-1">
        <CatchMap geojson={geojson} />
      </div>
    </div>
  );
}
