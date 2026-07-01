"use client";

import dynamic from "next/dynamic";

import { MapSkeleton } from "@/components/map/map-skeleton";
import type { CaptureGeoJSON } from "@/lib/map";

const CatchMap = dynamic(
  () => import("@/components/map/catch-map").then((mod) => mod.CatchMap),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  },
);

export function MapView({
  geojson,
  focusCatId,
}: {
  geojson: CaptureGeoJSON;
  focusCatId?: string;
}) {
  return <CatchMap geojson={geojson} focusCatId={focusCatId} />;
}
