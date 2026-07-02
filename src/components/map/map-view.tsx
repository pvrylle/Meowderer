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
  focusStrayId,
  initialLayer,
}: {
  geojson: CaptureGeoJSON;
  focusCatId?: string;
  focusStrayId?: string;
  initialLayer?: string;
}) {
  return (
    <CatchMap
      geojson={geojson}
      focusCatId={focusCatId}
      focusStrayId={focusStrayId}
      initialLayer={initialLayer}
    />
  );
}
