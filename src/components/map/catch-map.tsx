"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import { Search, SlidersHorizontal, X } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";

import { MapPin } from "@/components/map/map-pin";
import { pinFrameForRarity } from "@/lib/map-pins";
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_STYLE_URL,
  suppressMissingStyleSprites,
  type CaptureGeoJSON,
  type CapturePointProps,
} from "@/lib/map";
import type { Rarity } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type CatchMapProps = {
  geojson: CaptureGeoJSON;
};

type FilterKey = "all" | Rarity;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "common", label: "Common" },
  { key: "uncommon", label: "Uncommon" },
  { key: "rare", label: "Rare" },
  { key: "epic", label: "Epic" },
];

function fitToFeatures(map: maplibregl.Map, geojson: CaptureGeoJSON) {
  const coords = geojson.features.map((f) => f.geometry.coordinates);
  if (coords.length === 0) return;
  if (coords.length === 1) {
    map.easeTo({ center: coords[0] as [number, number], zoom: 13, duration: 800 });
    return;
  }
  const bounds = coords.reduce(
    (b, c) => b.extend(c as [number, number]),
    new maplibregl.LngLatBounds(
      coords[0] as [number, number],
      coords[0] as [number, number],
    ),
  );
  map.fitBounds(bounds, { padding: { top: 100, bottom: 80, left: 40, right: 40 }, maxZoom: 11, duration: 800 });
}

function filterGeoJSON(
  geojson: CaptureGeoJSON,
  query: string,
  rarity: FilterKey,
): CaptureGeoJSON {
  const q = query.trim().toLowerCase();
  const features = geojson.features.filter((f) => {
    if (rarity !== "all" && f.properties.rarity !== rarity) return false;
    if (!q) return true;
    const { name, place } = f.properties;
    return (
      name.toLowerCase().includes(q) ||
      (place?.toLowerCase().includes(q) ?? false)
    );
  });
  return { type: "FeatureCollection", features };
}

/** Build a DOM pin button (plain img — safe for MapLibre markers). */
function buildPinButton(
  props: CapturePointProps | { count: number },
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    "block cursor-pointer border-0 bg-transparent p-0 transition-transform active:scale-95";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });

  const size = 56;
  const frame =
    "count" in props
      ? pinFrameForRarity("epic")
      : pinFrameForRarity(props.rarity);

  if ("count" in props) {
    btn.innerHTML = `
      <div style="position:relative;width:${size}px;height:${size}px">
        <img src="${frame}" width="${size}" height="${size}" alt="" style="display:block;filter:drop-shadow(0 4px 6px rgba(58,53,80,0.2))" />
        <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding-bottom:10px;font:bold 14px Nunito,sans-serif;color:#3a3550">${props.count}</span>
      </div>`;
  } else {
    btn.innerHTML = `
      <div style="position:relative;width:${size}px;height:${size}px">
        <img src="${frame}" width="${size}" height="${size}" alt="" style="display:block;filter:drop-shadow(0 4px 6px rgba(58,53,80,0.2))" />
        <img src="${props.sticker_url}" width="${Math.round(size * 0.48)}" height="${Math.round(size * 0.48)}" alt=""
          style="position:absolute;left:50%;top:14%;transform:translateX(-50%);object-fit:contain;border-radius:9999px;background:rgba(255,255,255,0.9)" />
      </div>`;
  }
  return btn;
}

export function CatchMap({ geojson }: CatchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<CapturePointProps | null>(null);

  const filtered = useMemo(
    () => filterGeoJSON(geojson, query, filter),
    [geojson, query, filter],
  );

  const hasPoints = geojson.features.length > 0;
  const hasFiltered = filtered.features.length > 0;

  const syncMarkers = useCallback((map: maplibregl.Map) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!map.getSource("captures")) return;

    const features = map.querySourceFeatures("captures");
    const placed = new Set<string>();

    for (const feature of features) {
      if (!feature.properties || feature.geometry.type !== "Point") continue;
      const coords = feature.geometry.coordinates as [number, number];
      const props = feature.properties;

      if (props.cluster) {
        const clusterId = props.cluster_id as number;
        const key = `cluster-${clusterId}`;
        if (placed.has(key)) continue;
        placed.add(key);

        const count = props.point_count as number;
        const el = buildPinButton({ count }, () => {
          const source = map.getSource("captures") as maplibregl.GeoJSONSource;
          source
            .getClusterExpansionZoom(clusterId)
            .then((zoom) => {
              map.easeTo({ center: coords, zoom });
            })
            .catch(() => {});
        });

        markersRef.current.push(
          new maplibregl.Marker({ element: el, anchor: "bottom" })
            .setLngLat(coords)
            .addTo(map),
        );
      } else {
        const id = props.id as string;
        if (placed.has(id)) continue;
        placed.add(id);

        const pointProps = props as unknown as CapturePointProps;
        const el = buildPinButton(pointProps, () => setSelected(pointProps));

        markersRef.current.push(
          new maplibregl.Marker({ element: el, anchor: "bottom" })
            .setLngLat(coords)
            .addTo(map),
        );
      }
    }
  }, []);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || !hasPoints) return;

    let cancelled = false;
    const container = containerRef.current;

    const map = new maplibregl.Map({
      container,
      style: MAP_STYLE_URL,
      center: MAP_DEFAULT_CENTER,
      zoom: MAP_DEFAULT_ZOOM,
      attributionControl: { compact: true },
    });

    mapRef.current = map;
    suppressMissingStyleSprites(map);

    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserLocation: true,
      }),
      "bottom-right",
    );

    const onLoad = () => {
      if (cancelled) return;

      map.addSource("captures", {
        type: "geojson",
        data: filtered,
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 55,
      });

      map.addLayer({
        id: "captures-points",
        type: "circle",
        source: "captures",
        paint: {
          "circle-radius": 0,
          "circle-opacity": 0,
        },
      });

      fitToFeatures(map, filtered);
      syncMarkers(map);
      map.resize();
    };

    map.on("load", onLoad);
    map.on("moveend", () => syncMarkers(map));
    map.on("click", () => setSelected(null));

    // Ensure canvas picks up flex layout dimensions after paint
    const ro = new ResizeObserver(() => {
      if (!cancelled) map.resize();
    });
    ro.observe(container);

    return () => {
      cancelled = true;
      ro.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once per mount
  }, [hasPoints]);

  // Update pins when search/filter changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource("captures")) return;

    const source = map.getSource("captures") as maplibregl.GeoJSONSource;
    source.setData(filtered);
    map.once("idle", () => syncMarkers(map));
  }, [filtered, syncMarkers]);

  // Re-fit map when rarity filter changes (not on every keystroke)
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource("captures") || filtered.features.length === 0) return;
    fitToFeatures(map, filtered);
  }, [filter, filtered]);

  if (!hasPoints) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="text-5xl" aria-hidden>
          🗺️
        </span>
        <p className="font-bold text-foreground">No mapped catches yet</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Turn on location when you catch a cat and your pins will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 w-full">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Overlay: search + filters (reference: public/screens/Container.png) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 space-y-3 p-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border/60 bg-card/95 px-3 py-2.5 shadow-md backdrop-blur-sm">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cats & places…"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            aria-label="Filters"
            className="flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>

        <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors",
                filter === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-card/95 text-muted-foreground shadow-sm backdrop-blur-sm",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {!hasFiltered && (
          <p className="pointer-events-auto rounded-2xl bg-card/95 px-4 py-2 text-center text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
            No cats match your search.
          </p>
        )}
      </div>

      {/* Selected cat bottom sheet */}
      {selected && (
        <div className="absolute inset-x-4 bottom-4 z-20 rounded-3xl border border-border bg-card p-4 shadow-xl">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSelected(null)}
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <X className="size-4" />
          </button>
          <div className="flex items-center gap-4">
            <MapPin
              stickerUrl={selected.sticker_url}
              rarity={selected.rarity}
              size="lg"
            />
            <div className="min-w-0 flex-1 pr-6">
              <p className="truncate font-extrabold text-foreground">
                {selected.name}
              </p>
              {selected.place && (
                <p className="truncate text-sm text-muted-foreground">
                  {selected.place}
                </p>
              )}
              <Link
                href={`/cat/${selected.id}`}
                className="mt-2 inline-block text-sm font-bold text-primary"
              >
                View cat →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
