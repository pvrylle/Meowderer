"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import {
  Building2,
  Cat,
  MapPin as MapPinIcon,
  Search,
  SlidersHorizontal,
  Stethoscope,
  X,
} from "lucide-react";
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
import { fetchPois, osmLink, POI_MIN_ZOOM, type Poi, type PoiType } from "@/lib/overpass";
import { useShelterCheckIn } from "@/hooks/use-shelter-check-in";
import type { Rarity } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type CatchMapProps = {
  geojson: CaptureGeoJSON;
};

type LayerTab = "all" | "cats" | "shelters" | "vets";
type RarityFilter = "all" | Rarity;

const LAYER_TABS: { key: LayerTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "all", label: "All", icon: MapPinIcon },
  { key: "cats", label: "Cats", icon: Cat },
  { key: "shelters", label: "Shelters", icon: Building2 },
  { key: "vets", label: "Vets", icon: Stethoscope },
];

const RARITY_FILTERS: { key: RarityFilter; label: string }[] = [
  { key: "all", label: "All rarities" },
  { key: "common", label: "Common" },
  { key: "uncommon", label: "Uncommon" },
  { key: "rare", label: "Rare" },
  { key: "epic", label: "Epic" },
];

function whenStyleReady(
  map: maplibregl.Map,
  fn: () => void,
  isCancelled?: () => boolean,
): void {
  const run = () => {
    if (isCancelled?.()) return;
    if (!map.isStyleLoaded()) return;
    fn();
  };

  if (map.isStyleLoaded()) {
    run();
  } else {
    map.once("load", run);
  }
}

function ensureCapturesLayer(
  map: maplibregl.Map,
  data: CaptureGeoJSON,
  isCancelled?: () => boolean,
): boolean {
  if (isCancelled?.() || !map.isStyleLoaded()) return false;

  if (!map.getSource("captures")) {
    map.addSource("captures", {
      type: "geojson",
      data,
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
  }

  return true;
}

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
  map.fitBounds(bounds, {
    padding: { top: 120, bottom: 100, left: 40, right: 40 },
    maxZoom: 11,
    duration: 800,
  });
}

function filterGeoJSON(
  geojson: CaptureGeoJSON,
  query: string,
  rarity: RarityFilter,
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

function buildCatPinButton(
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

function buildPoiPinButton(poi: Poi, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    "block cursor-pointer border-0 bg-transparent p-0 transition-transform active:scale-95";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });

  const color = poi.type === "shelter" ? "#8fd6a6" : "#7fb4e8";
  const icon = poi.type === "shelter" ? "🏠" : "🩺";
  const size = 44;

  btn.innerHTML = `
    <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">
      <div style="width:36px;height:36px;border-radius:12px;background:${color};border:3px solid white;box-shadow:0 4px 8px rgba(58,53,80,0.2);display:flex;align-items:center;justify-content:center;font-size:16px">${icon}</div>
    </div>`;

  return btn;
}

export function CatchMap({ geojson }: CatchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const catMarkersRef = useRef<maplibregl.Marker[]>([]);
  const poiMarkersRef = useRef<maplibregl.Marker[]>([]);
  const [query, setQuery] = useState("");
  const [layerTab, setLayerTab] = useState<LayerTab>("all");
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<CapturePointProps | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [pois, setPois] = useState<Poi[]>([]);
  const [poiLoading, setPoiLoading] = useState(false);

  const showCats = layerTab === "all" || layerTab === "cats";
  const showShelters = layerTab === "all" || layerTab === "shelters";
  const showVets = layerTab === "all" || layerTab === "vets";

  const shelterPois = useMemo(
    () => pois.filter((p) => p.type === "shelter"),
    [pois],
  );
  useShelterCheckIn(shelterPois, showShelters);

  const filteredCats = useMemo(
    () => (showCats ? filterGeoJSON(geojson, query, rarityFilter) : { type: "FeatureCollection" as const, features: [] }),
    [geojson, query, rarityFilter, showCats],
  );

  const filteredPois = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pois.filter((p) => {
      if (p.type === "shelter" && !showShelters) return false;
      if (p.type === "vet" && !showVets) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.address?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [pois, query, showShelters, showVets]);

  const hasCatPoints = geojson.features.length > 0;
  const hasFilteredCats = filteredCats.features.length > 0;

  const syncCatMarkers = useCallback((map: maplibregl.Map) => {
    catMarkersRef.current.forEach((m) => m.remove());
    catMarkersRef.current = [];

    if (!showCats || !map.getSource("captures")) return;

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
        const el = buildCatPinButton({ count }, () => {
          const source = map.getSource("captures") as maplibregl.GeoJSONSource;
          source
            .getClusterExpansionZoom(clusterId)
            .then((zoom) => {
              map.easeTo({ center: coords, zoom });
            })
            .catch(() => {});
        });

        catMarkersRef.current.push(
          new maplibregl.Marker({ element: el, anchor: "bottom" })
            .setLngLat(coords)
            .addTo(map),
        );
      } else {
        const id = props.id as string;
        if (placed.has(id)) continue;
        placed.add(id);

        const pointProps = props as unknown as CapturePointProps;
        const el = buildCatPinButton(pointProps, () => {
          setSelectedPoi(null);
          setSelectedCat(pointProps);
        });

        catMarkersRef.current.push(
          new maplibregl.Marker({ element: el, anchor: "bottom" })
            .setLngLat(coords)
            .addTo(map),
        );
      }
    }
  }, [showCats]);

  const syncPoiMarkers = useCallback(
    (map: maplibregl.Map) => {
      poiMarkersRef.current.forEach((m) => m.remove());
      poiMarkersRef.current = [];

      for (const poi of filteredPois) {
        const el = buildPoiPinButton(poi, () => {
          setSelectedCat(null);
          setSelectedPoi(poi);
        });
        poiMarkersRef.current.push(
          new maplibregl.Marker({ element: el, anchor: "center" })
            .setLngLat([poi.lng, poi.lat])
            .addTo(map),
        );
      }
    },
    [filteredPois],
  );

  const loadPois = useCallback(async (map: maplibregl.Map) => {
    if (!showShelters && !showVets) return;
    if (map.getZoom() < POI_MIN_ZOOM) {
      setPois([]);
      return;
    }
    const b = map.getBounds();
    const types: PoiType[] = [];
    if (showShelters) types.push("shelter");
    if (showVets) types.push("vet");
    if (types.length === 0) return;

    setPoiLoading(true);
    try {
      const results = await fetchPois(
        {
          south: b.getSouth(),
          west: b.getWest(),
          north: b.getNorth(),
          east: b.getEast(),
        },
        types,
      );
      setPois(results);
    } catch {
      setPois([]);
    } finally {
      setPoiLoading(false);
    }
  }, [showShelters, showVets]);

  // Init map once
  useEffect(() => {
    if (!containerRef.current) return;

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

      if (hasCatPoints && ensureCapturesLayer(map, filteredCats, () => cancelled)) {
        fitToFeatures(map, filteredCats);
        syncCatMarkers(map);
      }

      void loadPois(map);
      map.resize();
    };

    whenStyleReady(map, onLoad, () => cancelled);
    map.on("moveend", () => {
      syncCatMarkers(map);
      void loadPois(map);
    });
    map.on("click", () => {
      setSelectedCat(null);
      setSelectedPoi(null);
    });

    const ro = new ResizeObserver(() => {
      if (!cancelled) map.resize();
    });
    ro.observe(container);

    return () => {
      cancelled = true;
      ro.disconnect();
      catMarkersRef.current.forEach((m) => m.remove());
      poiMarkersRef.current.forEach((m) => m.remove());
      catMarkersRef.current = [];
      poiMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once per mount
  }, [hasCatPoints]);

  // Update cat pins when search/filter/layer changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      if (!map.isStyleLoaded()) return;

      if (hasCatPoints && map.getSource("captures")) {
        const source = map.getSource("captures") as maplibregl.GeoJSONSource;
        source.setData(filteredCats);
        map.once("idle", () => syncCatMarkers(map));
      } else if (hasCatPoints && showCats) {
        if (ensureCapturesLayer(map, filteredCats)) {
          syncCatMarkers(map);
        }
      }

      if (!showCats) {
        catMarkersRef.current.forEach((m) => m.remove());
        catMarkersRef.current = [];
      }
    };

    whenStyleReady(map, apply);
  }, [filteredCats, syncCatMarkers, hasCatPoints, showCats]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    syncPoiMarkers(map);
  }, [filteredPois, syncPoiMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    void loadPois(map);
  }, [loadPois, layerTab]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    whenStyleReady(map, () => {
      if (!map.getSource("captures") || filteredCats.features.length === 0) return;
      fitToFeatures(map, filteredCats);
    });
  }, [rarityFilter, filteredCats]);

  return (
    <div className="relative h-full min-h-0 w-full">
      <div ref={containerRef} className="absolute inset-0 z-0" />

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
            aria-label="Advanced filters"
            onClick={() => setFiltersOpen(true)}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors",
              filtersOpen || rarityFilter !== "all"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground",
            )}
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>

        <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LAYER_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setLayerTab(key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors",
                layerTab === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-card/95 text-muted-foreground shadow-sm backdrop-blur-sm",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        {poiLoading && (showShelters || showVets) && (
          <p className="pointer-events-auto rounded-2xl bg-card/95 px-4 py-2 text-center text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
            Loading nearby places…
          </p>
        )}

        {showCats && hasCatPoints && !hasFilteredCats && (
          <p className="pointer-events-auto rounded-2xl bg-card/95 px-4 py-2 text-center text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
            No cats match your search.
          </p>
        )}

        {!hasCatPoints && layerTab === "cats" && (
          <p className="pointer-events-auto rounded-2xl bg-card/95 px-4 py-2 text-center text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
            No mapped catches yet. Turn on location when you catch a cat.
          </p>
        )}
      </div>

      {filtersOpen && (
        <div className="absolute inset-0 z-30 flex items-end bg-black/30">
          <div className="w-full rounded-t-3xl border border-border bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-extrabold text-foreground">Filters</h2>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setFiltersOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Cat rarity
            </p>
            <div className="flex flex-wrap gap-2">
              {RARITY_FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRarityFilter(key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                    rarityFilter === key
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-muted text-muted-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="mt-5 w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {selectedCat && (
        <div className="absolute inset-x-4 bottom-4 z-20 rounded-3xl border border-border bg-card p-4 shadow-xl">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSelectedCat(null)}
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <X className="size-4" />
          </button>
          <div className="flex items-center gap-4">
            <MapPin
              stickerUrl={selectedCat.sticker_url}
              rarity={selectedCat.rarity}
              size="lg"
            />
            <div className="min-w-0 flex-1 pr-6">
              <p className="truncate font-extrabold text-foreground">
                {selectedCat.name}
              </p>
              {selectedCat.place && (
                <p className="truncate text-sm text-muted-foreground">
                  {selectedCat.place}
                </p>
              )}
              <Link
                href={`/cat/${selectedCat.id}`}
                className="mt-2 inline-block text-sm font-bold text-primary"
              >
                View cat →
              </Link>
            </div>
          </div>
        </div>
      )}

      {selectedPoi && (
        <div className="absolute inset-x-4 bottom-4 z-20 rounded-3xl border border-border bg-card p-4 shadow-xl">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSelectedPoi(null)}
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <X className="size-4" />
          </button>
          <div className="pr-8">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {selectedPoi.type === "shelter" ? "Animal shelter" : "Veterinary"}
            </p>
            <p className="mt-1 font-extrabold text-foreground">{selectedPoi.name}</p>
            {selectedPoi.address && (
              <p className="mt-1 text-sm text-muted-foreground">{selectedPoi.address}</p>
            )}
            <a
              href={osmLink(selectedPoi)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-bold text-primary"
            >
              Open in Maps →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
