"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import {
  Building2,
  Cat,
  MapPin as MapPinIcon,
  Navigation,
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
import { fetchPois, googleMapsDirectionsLink, googleMapsSearchLink, POI_MIN_ZOOM, dedupePoisByProximity, type MapBounds, type Poi, type PoiType } from "@/lib/overpass";
import {
  dedupePoisAgainstFeatured,
  getFeaturedPlacesForMap,
  haversineKm,
  type FeaturedPlace,
} from "@/lib/featured-places";
import {
  dedupePoisAgainstFeaturedVets,
  getFeaturedVetsForMap,
  type FeaturedVet,
} from "@/lib/featured-vets";
import { getRegionalSheltersForMap } from "@/lib/regional-shelters";
import { getRegionalVetsForMap } from "@/lib/regional-vets";
import { getCurrentPosition } from "@/lib/geo";
import type { AreaStats, NearbyStrayCat } from "@/lib/nearby-stray-cats";
import { useShelterCheckIn } from "@/hooks/use-shelter-check-in";
import {
  buildFeaturedPinButton,
  buildFeaturedVetPinButton,
  buildPoiPinButton,
  bindMarkerTap,
} from "@/lib/map-marker-html";
import type { Rarity } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type CatchMapProps = {
  geojson: CaptureGeoJSON;
  focusCatId?: string;
  focusStrayId?: string;
  initialLayer?: string;
};

const POI_MAX_PER_TYPE = 25;

function parseInitialLayer(layer?: string): LayerTab {
  if (layer === "shelters" || layer === "vets" || layer === "cats" || layer === "all") {
    return layer;
  }
  return "all";
}

type LayerTab = "all" | "cats" | "shelters" | "vets";
type RarityFilter = "all" | Rarity;
type CuratedSelection = {
  kind: "shelter" | "vet";
  place: FeaturedPlace | FeaturedVet;
};

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

const MAP_SHEET_BOTTOM =
  "bottom-[calc(var(--nav-clearance)+0.625rem)]" as const;

function MapSheetClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-muted/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-muted"
    >
      <X className="size-4" />
    </button>
  );
}

function ShelterLegendDots() {
  return (
    <>
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <span className="size-2 shrink-0 rounded-full bg-[#8b6cc7] ring-1 ring-white/80" />
        Curated
      </span>
      <span className="text-border/80" aria-hidden>
        ·
      </span>
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <span className="size-2 shrink-0 rounded-full bg-[#6bc49a] ring-1 ring-white/80" />
        Local
      </span>
    </>
  );
}

function VetLegendDots() {
  return (
    <>
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <span className="size-2 shrink-0 rounded-full bg-[#5b7fc7] ring-1 ring-white/80" />
        Curated
      </span>
      <span className="text-border/80" aria-hidden>
        ·
      </span>
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <span className="size-2 shrink-0 rounded-full bg-[#6ba3e0] ring-1 ring-white/80" />
        Local
      </span>
    </>
  );
}

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

function buildStrayPinButton(
  stray: {
    canonical_name: string | null;
    cover_sticker_url: string | null;
    discovered: boolean;
  },
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  const name = stray.canonical_name?.trim() || "Mystery stray";
  btn.setAttribute(
    "aria-label",
    stray.discovered ? `${name}, found` : `${name}, locked — catch to unlock`,
  );
  btn.className =
    "catch-map-pin-btn block cursor-pointer border-0 bg-transparent transition-transform active:scale-95";
  btn.style.touchAction = "manipulation";
  bindMarkerTap(btn, onClick);

  const size = 52;
  const frame = pinFrameForRarity(stray.discovered ? "uncommon" : "common");

  if (stray.discovered && stray.cover_sticker_url) {
    btn.innerHTML = `
      <div style="position:relative;width:${size}px;height:${size}px">
        <img src="${frame}" width="${size}" height="${size}" alt="" style="display:block;filter:drop-shadow(0 4px 6px rgba(58,53,80,0.2))" />
        <img src="${stray.cover_sticker_url}" width="${Math.round(size * 0.48)}" height="${Math.round(size * 0.48)}" alt=""
          style="position:absolute;left:50%;top:14%;transform:translateX(-50%);object-fit:contain;border-radius:9999px;background:rgba(255,255,255,0.9)" />
      </div>`;
  } else {
    const sticker = stray.cover_sticker_url ?? "";
    btn.innerHTML = `
      <div style="position:relative;width:${size}px;height:${size}px">
        <img src="${frame}" width="${size}" height="${size}" alt="" style="display:block;filter:drop-shadow(0 4px 6px rgba(58,53,80,0.2))" />
        ${
          sticker
            ? `<img src="${sticker}" width="${Math.round(size * 0.48)}" height="${Math.round(size * 0.48)}" alt=""
          style="position:absolute;left:50%;top:14%;transform:translateX(-50%);object-fit:contain;border-radius:9999px;background:rgba(255,255,255,0.9);filter:blur(4px);opacity:0.85" />`
            : `<span style="position:absolute;left:50%;top:22%;transform:translateX(-50%);font-size:22px">🐱</span>`
        }
        <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding-bottom:8px;font-size:18px">🔒</span>
      </div>`;
  }
  return btn;
}

function buildCatPinButton(
  props: CapturePointProps | { count: number },
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    "catch-map-pin-btn block cursor-pointer border-0 bg-transparent transition-transform active:scale-95";
  btn.style.touchAction = "manipulation";
  bindMarkerTap(btn, onClick);

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

function capPoisByDistance(
  pois: Poi[],
  centerLat: number,
  centerLng: number,
  maxPerType: number,
): Poi[] {
  const byType = new Map<PoiType, Poi[]>();
  for (const p of pois) {
    const list = byType.get(p.type) ?? [];
    list.push(p);
    byType.set(p.type, list);
  }

  const result: Poi[] = [];
  for (const [, list] of byType) {
    const sorted = list
      .map((p) => ({
        p,
        d: haversineKm(centerLat, centerLng, p.lat, p.lng),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, maxPerType)
      .map((x) => x.p);
    result.push(...sorted);
  }
  return result;
}

const MARKER_CLASS = "catch-map-marker";

function markerCacheKey(zoom: number, ids: string[]): string {
  return `${Math.floor(zoom)}|${ids.sort().join("|")}`;
}

function placeFeaturedMarkers(
  map: maplibregl.Map,
  places: FeaturedPlace[],
  markersRef: React.MutableRefObject<maplibregl.Marker[]>,
  onSelect: (place: FeaturedPlace) => void,
  cacheKeyRef: React.MutableRefObject<string>,
): void {
  const zoom = map.getZoom();
  const key = markerCacheKey(
    zoom,
    places.map((p) => p.id),
  );
  if (cacheKeyRef.current === key && markersRef.current.length === places.length) {
    return;
  }
  cacheKeyRef.current = key;

  markersRef.current.forEach((m) => m.remove());
  markersRef.current = [];

  for (const place of places) {
    const el = buildFeaturedPinButton(place, zoom, () => onSelect(place));
    markersRef.current.push(
      new maplibregl.Marker({
        element: el,
        anchor: "bottom",
        className: MARKER_CLASS,
      })
        .setLngLat([place.lng, place.lat])
        .addTo(map),
    );
  }
}

function placeFeaturedVetMarkers(
  map: maplibregl.Map,
  places: FeaturedVet[],
  markersRef: React.MutableRefObject<maplibregl.Marker[]>,
  onSelect: (place: FeaturedVet) => void,
  cacheKeyRef: React.MutableRefObject<string>,
): void {
  const zoom = map.getZoom();
  const key = markerCacheKey(
    zoom,
    places.map((p) => `vet:${p.id}`),
  );
  if (cacheKeyRef.current === key && markersRef.current.length === places.length) {
    return;
  }
  cacheKeyRef.current = key;

  markersRef.current.forEach((m) => m.remove());
  markersRef.current = [];

  for (const place of places) {
    const el = buildFeaturedVetPinButton(place, zoom, () => onSelect(place));
    markersRef.current.push(
      new maplibregl.Marker({
        element: el,
        anchor: "bottom",
        className: MARKER_CLASS,
      })
        .setLngLat([place.lng, place.lat])
        .addTo(map),
    );
  }
}

function fitMapToCuratedLayer(
  map: maplibregl.Map,
  getFeatured: (
    centerLat: number,
    centerLng: number,
    bounds: MapBounds,
    zoom: number,
  ) => Array<{ lat: number; lng: number }>,
  getRegional: (
    centerLat: number,
    centerLng: number,
    bounds: MapBounds,
    zoom: number,
  ) => Poi[],
): void {
  const center = map.getCenter();
  const b = map.getBounds();
  const bounds: MapBounds = {
    south: b.getSouth(),
    west: b.getWest(),
    north: b.getNorth(),
    east: b.getEast(),
  };
  const zoom = Math.max(map.getZoom(), POI_MIN_ZOOM + 1);
  const featured = getFeatured(center.lat, center.lng, bounds, zoom);
  const regional = getRegional(center.lat, center.lng, bounds, zoom);
  if (featured.length === 0 && regional.length === 0) return;

  const fit = new maplibregl.LngLatBounds();
  fit.extend([center.lng, center.lat]);
  for (const place of featured) {
    fit.extend([place.lng, place.lat]);
  }
  for (const poi of regional) {
    fit.extend([poi.lng, poi.lat]);
  }
  map.fitBounds(fit, {
    padding: { top: 180, bottom: 160, left: 48, right: 48 },
    maxZoom: 13,
    duration: 700,
  });
}

function placePoiMarkers(
  map: maplibregl.Map,
  pois: Poi[],
  markersRef: React.MutableRefObject<maplibregl.Marker[]>,
  onSelect: (poi: Poi) => void,
  cacheKeyRef: React.MutableRefObject<string>,
): void {
  const zoom = map.getZoom();
  const key = markerCacheKey(
    zoom,
    pois.map((p) => `${p.type}:${p.lat}:${p.lng}:${p.name}`),
  );
  if (cacheKeyRef.current === key && markersRef.current.length === pois.length) {
    return;
  }
  cacheKeyRef.current = key;

  markersRef.current.forEach((m) => m.remove());
  markersRef.current = [];

  for (const poi of pois) {
    const el = buildPoiPinButton(poi, zoom, () => onSelect(poi));
    markersRef.current.push(
      new maplibregl.Marker({
        element: el,
        anchor: "bottom",
        className: MARKER_CLASS,
      })
        .setLngLat([poi.lng, poi.lat])
        .addTo(map),
    );
  }
}

function shortBlurb(text: string, max = 64): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export function CatchMap({ geojson, focusCatId, focusStrayId, initialLayer }: CatchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const geolocateRef = useRef<maplibregl.GeolocateControl | null>(null);
  const catMarkersRef = useRef<maplibregl.Marker[]>([]);
  const strayMarkersRef = useRef<maplibregl.Marker[]>([]);
  const strayMarkerKeyRef = useRef("");
  const poiMarkersRef = useRef<maplibregl.Marker[]>([]);
  const featuredShelterMarkersRef = useRef<maplibregl.Marker[]>([]);
  const featuredVetMarkersRef = useRef<maplibregl.Marker[]>([]);
  const featuredShelterMarkerKeyRef = useRef("");
  const featuredVetMarkerKeyRef = useRef("");
  const poiMarkerKeyRef = useRef("");
  const markerResyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState("");
  const [layerTab, setLayerTab] = useState<LayerTab>(() => parseInitialLayer(initialLayer));
  const layerTabRef = useRef(layerTab);
  layerTabRef.current = layerTab;
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<CapturePointProps | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [selectedCurated, setSelectedCurated] = useState<CuratedSelection | null>(null);
  const [selectedStray, setSelectedStray] = useState<NearbyStrayCat | null>(null);
  const [areaStrays, setAreaStrays] = useState<NearbyStrayCat[]>([]);
  const [areaStrayTotal, setAreaStrayTotal] = useState(0);
  const areaStraysRef = useRef(areaStrays);
  areaStraysRef.current = areaStrays;
  const [pois, setPois] = useState<Poi[]>([]);
  const [featuredSheltersInView, setFeaturedSheltersInView] = useState<FeaturedPlace[]>([]);
  const [featuredVetsInView, setFeaturedVetsInView] = useState<FeaturedVet[]>([]);
  const [poiLoading, setPoiLoading] = useState(false);
  const [poiError, setPoiError] = useState(false);

  const focusMapPoint = useCallback((lng: number, lat: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      center: [lng, lat],
      duration: 220,
      offset: [0, 56],
    });
  }, []);

  const selectCuratedShelter = useCallback(
    (place: FeaturedPlace) => {
      setSelectedCat(null);
      setSelectedPoi(null);
      setSelectedStray(null);
      setSelectedCurated({ kind: "shelter", place });
      focusMapPoint(place.lng, place.lat);
    },
    [focusMapPoint],
  );

  const selectCuratedVet = useCallback(
    (place: FeaturedVet) => {
      setSelectedCat(null);
      setSelectedPoi(null);
      setSelectedStray(null);
      setSelectedCurated({ kind: "vet", place });
      focusMapPoint(place.lng, place.lat);
    },
    [focusMapPoint],
  );

  const selectPoi = useCallback(
    (poi: Poi) => {
      setSelectedCat(null);
      setSelectedCurated(null);
      setSelectedStray(null);
      setSelectedPoi(poi);
      focusMapPoint(poi.lng, poi.lat);
    },
    [focusMapPoint],
  );

  const selectCat = useCallback(
    (props: CapturePointProps) => {
      setSelectedPoi(null);
      setSelectedCurated(null);
      setSelectedStray(null);
      setSelectedCat(props);
      const feature = geojson.features.find((f) => f.properties.id === props.id);
      if (feature?.geometry.type === "Point") {
        const [lng, lat] = feature.geometry.coordinates as [number, number];
        focusMapPoint(lng, lat);
      }
    },
    [focusMapPoint, geojson.features],
  );

  const selectStray = useCallback(
    (stray: NearbyStrayCat) => {
      setSelectedCat(null);
      setSelectedPoi(null);
      setSelectedCurated(null);
      setSelectedStray(stray);
      if (stray.primary_lat != null && stray.primary_lng != null) {
        focusMapPoint(stray.primary_lng, stray.primary_lat);
      }
    },
    [focusMapPoint],
  );

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
  const hasAreaStrays = areaStrays.length > 0;

  const placeStrayMarkers = useCallback(
    (map: maplibregl.Map, strays: NearbyStrayCat[]) => {
      if (!map.isStyleLoaded()) return;

      if (!showCats) {
        strayMarkersRef.current.forEach((m) => m.remove());
        strayMarkersRef.current = [];
        strayMarkerKeyRef.current = "";
        return;
      }

      const visible = strays.filter(
        (s) => s.primary_lat != null && s.primary_lng != null,
      );
      const key = markerCacheKey(
        map.getZoom(),
        visible.map((s) => `${s.id}:${s.discovered ? "1" : "0"}`),
      );
      if (
        strayMarkerKeyRef.current === key &&
        strayMarkersRef.current.length === visible.length
      ) {
        return;
      }
      strayMarkerKeyRef.current = key;

      strayMarkersRef.current.forEach((m) => m.remove());
      strayMarkersRef.current = [];

      for (const stray of visible) {
        const el = buildStrayPinButton(stray, () => selectStray(stray));
        strayMarkersRef.current.push(
          new maplibregl.Marker({
            element: el,
            anchor: "bottom",
            className: MARKER_CLASS,
          })
            .setLngLat([stray.primary_lng!, stray.primary_lat!])
            .addTo(map),
        );
      }
    },
    [showCats, selectStray],
  );

  const syncStrayMarkers = useCallback(
    (map: maplibregl.Map) => {
      placeStrayMarkers(map, areaStraysRef.current);
    },
    [placeStrayMarkers],
  );

  const fitMapToAreaStrays = useCallback(
    (map: maplibregl.Map, strays: NearbyStrayCat[]) => {
      const withCoords = strays.filter(
        (s) => s.primary_lat != null && s.primary_lng != null,
      );
      if (withCoords.length === 0) return;

      const center = map.getCenter();
      const fit = new maplibregl.LngLatBounds();
      fit.extend([center.lng, center.lat]);
      for (const stray of withCoords) {
        fit.extend([stray.primary_lng!, stray.primary_lat!]);
      }
      map.fitBounds(fit, {
        padding: { top: 180, bottom: 160, left: 48, right: 48 },
        maxZoom: 14,
        duration: 700,
      });
    },
    [],
  );

  const loadAreaStrays = useCallback(
    async (map: maplibregl.Map, lat: number, lng: number, fitView = false) => {
      try {
        const res = await fetch(`/api/stray-cats/popular?lat=${lat}&lng=${lng}`);
        if (!res.ok) return;
        const data = (await res.json()) as AreaStats;
        const strays = data.mapStrays ?? data.strays ?? [];
        setAreaStrays(strays);
        setAreaStrayTotal(data.totalInArea ?? strays.length);
        placeStrayMarkers(map, strays);
        if (fitView && (layerTabRef.current === "cats" || layerTabRef.current === "all")) {
          fitMapToAreaStrays(map, strays);
        }
      } catch {
        setAreaStrays([]);
        setAreaStrayTotal(0);
        placeStrayMarkers(map, []);
      }
    },
    [fitMapToAreaStrays, placeStrayMarkers],
  );

  const loadAreaStraysRef = useRef(loadAreaStrays);
  loadAreaStraysRef.current = loadAreaStrays;

  const localShelterCount = useMemo(
    () => pois.filter((p) => p.type === "shelter").length,
    [pois],
  );

  const localVetCount = useMemo(
    () => pois.filter((p) => p.type === "vet").length,
    [pois],
  );

  const mapOverlayStatus = useMemo((): {
    kind: "loading" | "error" | "info" | "count" | "hint";
    message?: string;
    showLegend?: boolean;
    legend?: "shelter" | "vet";
  } | null => {
    if (poiLoading && (showShelters || showVets)) {
      return { kind: "loading", message: "Loading nearby places…" };
    }

    if (poiError && !poiLoading && (showShelters || showVets)) {
      const hasCurated =
        (showShelters && featuredSheltersInView.length > 0) ||
        (showVets && featuredVetsInView.length > 0);
      if (!hasCurated) {
        return { kind: "error" };
      }
    }

    if (showCats && hasCatPoints && !hasFilteredCats) {
      return { kind: "info", message: "No cats match your search." };
    }

    if (!hasCatPoints && !hasAreaStrays && layerTab === "cats") {
      return {
        kind: "info",
        message: "No cats in your area yet — catch one with location on to add it.",
      };
    }

    if (showCats && hasAreaStrays && (layerTab === "cats" || layerTab === "all")) {
      const locked = areaStrays.filter((s) => !s.discovered).length;
      const found = areaStrays.filter((s) => s.discovered).length;
      const parts: string[] = [];
      if (areaStrayTotal > 0) {
        parts.push(
          `${areaStrayTotal} cat${areaStrayTotal === 1 ? "" : "s"} within 15 km`,
        );
      }
      if (locked > 0) parts.push(`${locked} to unlock`);
      if (found > 0) parts.push(`${found} found`);
      return {
        kind: "count",
        message: `${parts.join(" · ")} — tap a pin`,
      };
    }

    if (showShelters && (layerTab === "shelters" || layerTab === "all")) {
      const parts: string[] = [];
      if (featuredSheltersInView.length > 0) {
        parts.push(
          `${featuredSheltersInView.length} curated shelter${featuredSheltersInView.length === 1 ? "" : "s"}`,
        );
      }
      if (localShelterCount > 0) {
        parts.push(
          `${localShelterCount} local shelter${localShelterCount === 1 ? "" : "s"}`,
        );
      }

      if (parts.length > 0) {
        return {
          kind: "count",
          message: `${parts.join(" · ")} — tap a pin`,
          showLegend: true,
          legend: "shelter" as const,
        };
      }

      if (layerTab === "shelters" && !poiLoading) {
        return {
          kind: "hint",
          message: "Use location or zoom in to discover shelters",
          showLegend: true,
          legend: "shelter" as const,
        };
      }
    }

    if (showVets && (layerTab === "vets" || layerTab === "all")) {
      const parts: string[] = [];
      if (featuredVetsInView.length > 0) {
        parts.push(
          `${featuredVetsInView.length} curated vet${featuredVetsInView.length === 1 ? "" : "s"}`,
        );
      }
      if (localVetCount > 0) {
        parts.push(
          `${localVetCount} local vet${localVetCount === 1 ? "" : "s"}`,
        );
      }

      if (parts.length > 0) {
        return {
          kind: "count",
          message: `${parts.join(" · ")} — tap a pin`,
          showLegend: true,
          legend: "vet" as const,
        };
      }

      if (layerTab === "vets" && !poiLoading) {
        return {
          kind: "hint",
          message: "Use location or zoom in to discover vets",
          showLegend: true,
          legend: "vet" as const,
        };
      }
    }

    return null;
  }, [
    poiLoading,
    showShelters,
    showVets,
    poiError,
    featuredSheltersInView.length,
    featuredVetsInView.length,
    showCats,
    hasCatPoints,
    hasFilteredCats,
    hasAreaStrays,
    areaStrays,
    areaStrayTotal,
    layerTab,
    localShelterCount,
    localVetCount,
  ]);

  const syncCatMarkers = useCallback((map: maplibregl.Map) => {
    if (!map.isStyleLoaded()) return;

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
        const el = buildCatPinButton(pointProps, () => selectCat(pointProps));

        catMarkersRef.current.push(
          new maplibregl.Marker({ element: el, anchor: "bottom" })
            .setLngLat(coords)
            .addTo(map),
        );
      }
    }
  }, [showCats, selectCat]);

  const syncPoiMarkers = useCallback(
    (map: maplibregl.Map) => {
      if (!map.isStyleLoaded()) return;

      if (!showShelters && !showVets) {
        poiMarkersRef.current.forEach((m) => m.remove());
        poiMarkersRef.current = [];
        poiMarkerKeyRef.current = "";
        return;
      }
      placePoiMarkers(map, filteredPois, poiMarkersRef, selectPoi, poiMarkerKeyRef);
    },
    [filteredPois, showShelters, showVets, selectPoi],
  );

  const refreshFeaturedOnMap = useCallback(
    (map: maplibregl.Map) => {
      if (!map.isStyleLoaded()) return;

      const center = map.getCenter();
      const b = map.getBounds();
      const bounds: MapBounds = {
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      };
      const zoom = map.getZoom();

      if (showShelters) {
        const featured = getFeaturedPlacesForMap(
          center.lat,
          center.lng,
          bounds,
          zoom,
        );
        setFeaturedSheltersInView(featured);
        placeFeaturedMarkers(
          map,
          featured,
          featuredShelterMarkersRef,
          selectCuratedShelter,
          featuredShelterMarkerKeyRef,
        );
      } else {
        featuredShelterMarkersRef.current.forEach((m) => m.remove());
        featuredShelterMarkersRef.current = [];
        featuredShelterMarkerKeyRef.current = "";
        setFeaturedSheltersInView([]);
      }

      if (showVets) {
        const featured = getFeaturedVetsForMap(
          center.lat,
          center.lng,
          bounds,
          zoom,
        );
        setFeaturedVetsInView(featured);
        placeFeaturedVetMarkers(
          map,
          featured,
          featuredVetMarkersRef,
          selectCuratedVet,
          featuredVetMarkerKeyRef,
        );
      } else {
        featuredVetMarkersRef.current.forEach((m) => m.remove());
        featuredVetMarkersRef.current = [];
        featuredVetMarkerKeyRef.current = "";
        setFeaturedVetsInView([]);
      }
    },
    [showShelters, showVets, selectCuratedShelter, selectCuratedVet],
  );

  const scheduleMarkerResync = useCallback(
    () => {
      if (markerResyncTimerRef.current) {
        clearTimeout(markerResyncTimerRef.current);
      }
      markerResyncTimerRef.current = setTimeout(() => {
        const map = mapRef.current;
        if (!map?.isStyleLoaded()) return;
        syncCatMarkers(map);
        syncStrayMarkers(map);
        syncPoiMarkers(map);
        refreshFeaturedOnMap(map);
      }, 180);
    },
    [syncCatMarkers, syncStrayMarkers, syncPoiMarkers, refreshFeaturedOnMap],
  );

  const fitMapToShelters = useCallback((map: maplibregl.Map) => {
    fitMapToCuratedLayer(
      map,
      (centerLat, centerLng, bounds, zoom) =>
        getFeaturedPlacesForMap(centerLat, centerLng, bounds, zoom),
      (centerLat, centerLng, bounds, zoom) =>
        getRegionalSheltersForMap(centerLat, centerLng, bounds, zoom),
    );
  }, []);

  const fitMapToVets = useCallback((map: maplibregl.Map) => {
    fitMapToCuratedLayer(
      map,
      (centerLat, centerLng, bounds, zoom) =>
        getFeaturedVetsForMap(centerLat, centerLng, bounds, zoom),
      (centerLat, centerLng, bounds, zoom) =>
        getRegionalVetsForMap(centerLat, centerLng, bounds, zoom),
    );
  }, []);

  const focusShelterLayer = useCallback(
    (map: maplibregl.Map) => {
      geolocateRef.current?.trigger();

      if (map.getZoom() < POI_MIN_ZOOM + 1) {
        map.easeTo({ zoom: POI_MIN_ZOOM + 1, duration: 600 });
      }

      fitMapToShelters(map);
      refreshFeaturedOnMap(map);
    },
    [fitMapToShelters, refreshFeaturedOnMap],
  );

  const focusVetLayer = useCallback(
    (map: maplibregl.Map) => {
      geolocateRef.current?.trigger();

      if (map.getZoom() < POI_MIN_ZOOM + 1) {
        map.easeTo({ zoom: POI_MIN_ZOOM + 1, duration: 600 });
      }

      fitMapToVets(map);
      refreshFeaturedOnMap(map);
    },
    [fitMapToVets, refreshFeaturedOnMap],
  );

  const handleLayerTabChange = useCallback(
    (key: LayerTab) => {
      setLayerTab(key);
      const map = mapRef.current;
      if (!map) return;
      if (key === "shelters") {
        focusShelterLayer(map);
      } else if (key === "vets") {
        focusVetLayer(map);
      } else {
        refreshFeaturedOnMap(map);
        if (key === "cats" || key === "all") {
          geolocateRef.current?.trigger();
          const center = map.getCenter();
          void loadAreaStrays(map, center.lat, center.lng, true);
        }
      }
    },
    [focusShelterLayer, focusVetLayer, refreshFeaturedOnMap, loadAreaStrays],
  );

  const syncPoiMarkersRef = useRef(syncPoiMarkers);
  const refreshFeaturedRef = useRef(refreshFeaturedOnMap);
  const focusShelterLayerRef = useRef(focusShelterLayer);
  const focusVetLayerRef = useRef(focusVetLayer);
  const scheduleMarkerResyncRef = useRef(scheduleMarkerResync);
  syncPoiMarkersRef.current = syncPoiMarkers;
  refreshFeaturedRef.current = refreshFeaturedOnMap;
  focusShelterLayerRef.current = focusShelterLayer;
  focusVetLayerRef.current = focusVetLayer;
  scheduleMarkerResyncRef.current = scheduleMarkerResync;

  const loadPois = useCallback(async (map: maplibregl.Map) => {
    if (!showShelters && !showVets) return;
    if (!map.isStyleLoaded()) return;

    const b = map.getBounds();
    const center = map.getCenter();
    const bounds: MapBounds = {
      south: b.getSouth(),
      west: b.getWest(),
      north: b.getNorth(),
      east: b.getEast(),
    };

    if (map.getZoom() < POI_MIN_ZOOM) {
      const regional = [
        ...(showShelters
          ? getRegionalSheltersForMap(
              center.lat,
              center.lng,
              bounds,
              map.getZoom(),
            )
          : []),
        ...(showVets
          ? getRegionalVetsForMap(
              center.lat,
              center.lng,
              bounds,
              map.getZoom(),
            )
          : []),
      ];
      setPois(regional);
      setPoiError(false);
      return;
    }

    const featuredShelters = showShelters
      ? getFeaturedPlacesForMap(
          center.lat,
          center.lng,
          bounds,
          map.getZoom(),
        )
      : [];
    const featuredVets = showVets
      ? getFeaturedVetsForMap(
          center.lat,
          center.lng,
          bounds,
          map.getZoom(),
        )
      : [];

    const types: PoiType[] = [];
    if (showShelters) types.push("shelter");
    if (showVets) types.push("vet");
    if (types.length === 0) return;

    setPoiLoading(true);
    setPoiError(false);

    let osmResults: Poi[] = [];
    let osmFailed = false;
    try {
      osmResults = await fetchPois(bounds, types);
    } catch {
      osmFailed = true;
    }

    const regional = [
      ...(showShelters
        ? getRegionalSheltersForMap(
            center.lat,
            center.lng,
            bounds,
            map.getZoom(),
          )
        : []),
      ...(showVets
        ? getRegionalVetsForMap(
            center.lat,
            center.lng,
            bounds,
            map.getZoom(),
          )
        : []),
    ];

    try {
      const merged = dedupePoisByProximity([...osmResults, ...regional]);
      const capped = capPoisByDistance(
        merged,
        center.lat,
        center.lng,
        POI_MAX_PER_TYPE,
      );
      const shelters = capped.filter((p) => p.type === "shelter");
      const vets = capped.filter((p) => p.type === "vet");
      const deduped = [
        ...dedupePoisAgainstFeatured(shelters, featuredShelters),
        ...dedupePoisAgainstFeaturedVets(vets, featuredVets),
      ];
      setPois(deduped);
      const hasCurated = featuredShelters.length > 0 || featuredVets.length > 0;
      if (deduped.length === 0 && !hasCurated && osmFailed) {
        setPoiError(true);
      }
    } catch {
      setPois(regional);
      const hasCurated = featuredShelters.length > 0 || featuredVets.length > 0;
      if (regional.length === 0 && !hasCurated) {
        setPoiError(true);
      }
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

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserLocation: true,
    });
    geolocateRef.current = geolocate;
    map.addControl(geolocate, "bottom-right");

    const onLoad = () => {
      if (cancelled) return;

      if (hasCatPoints && ensureCapturesLayer(map, filteredCats, () => cancelled)) {
        fitToFeatures(map, filteredCats);
        syncCatMarkers(map);
      }

      refreshFeaturedRef.current(map);

      const startLayer = parseInitialLayer(initialLayer);
      if (startLayer === "shelters") {
        focusShelterLayerRef.current(map);
      } else if (startLayer === "vets") {
        focusVetLayerRef.current(map);
      } else if (startLayer === "cats" || startLayer === "all") {
        geolocateRef.current?.trigger();
      }

      void loadPois(map);
      map.resize();
    };

    whenStyleReady(map, onLoad, () => cancelled);
    const onMoveEnd = () => {
      if (cancelled) return;
      const m = mapRef.current;
      if (!m?.isStyleLoaded()) return;
      scheduleMarkerResyncRef.current();
      void loadPois(m);
    };
    map.on("moveend", onMoveEnd);
    geolocate.on("geolocate", (e) => {
      const m = mapRef.current;
      if (!m?.isStyleLoaded()) return;
      const pos = e.coords;
      const tab = layerTabRef.current;
      if (tab === "shelters") {
        fitMapToShelters(m);
      } else if (tab === "vets") {
        fitMapToVets(m);
      }
      refreshFeaturedRef.current(m);
      if (tab === "cats" || tab === "all") {
        void loadAreaStraysRef.current(m, pos.latitude, pos.longitude, true);
      }
    });
    map.on("click", () => {
      setSelectedCat(null);
      setSelectedPoi(null);
      setSelectedCurated(null);
      setSelectedStray(null);
    });

    const ro = new ResizeObserver(() => {
      if (!cancelled) map.resize();
    });
    ro.observe(container);

    return () => {
      cancelled = true;
      if (markerResyncTimerRef.current) {
        clearTimeout(markerResyncTimerRef.current);
        markerResyncTimerRef.current = null;
      }
      map.off("moveend", onMoveEnd);
      ro.disconnect();
      catMarkersRef.current.forEach((m) => m.remove());
      strayMarkersRef.current.forEach((m) => m.remove());
      poiMarkersRef.current.forEach((m) => m.remove());
      featuredShelterMarkersRef.current.forEach((m) => m.remove());
      featuredVetMarkersRef.current.forEach((m) => m.remove());
      catMarkersRef.current = [];
      strayMarkersRef.current = [];
      poiMarkersRef.current = [];
      featuredShelterMarkersRef.current = [];
      featuredVetMarkersRef.current = [];
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
    if (showShelters || showVets) {
      refreshFeaturedOnMap(map);
    }
  }, [layerTab, showShelters, showVets, refreshFeaturedOnMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    void loadPois(map);
  }, [loadPois, layerTab]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    syncStrayMarkers(map);
  }, [areaStrays, showCats, syncStrayMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !showCats) return;
    void getCurrentPosition()
      .then((pos) => loadAreaStrays(map, pos.lat, pos.lng, false))
      .catch(() => {
        const center = map.getCenter();
        void loadAreaStrays(map, center.lat, center.lng, false);
      });
  }, [showCats, loadAreaStrays]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusStrayId) return;

    whenStyleReady(map, () => {
      void getCurrentPosition()
        .then(async (pos) => {
          await loadAreaStrays(map, pos.lat, pos.lng, false);
          const stray = areaStraysRef.current.find((s) => s.id === focusStrayId);
          if (stray) {
            selectStray(stray);
            map.easeTo({
              center: [stray.primary_lng!, stray.primary_lat!],
              zoom: 15,
              duration: 800,
            });
          }
        })
        .catch(() => {});
    });
  }, [focusStrayId, loadAreaStrays, selectStray]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    whenStyleReady(map, () => {
      if (!map.getSource("captures") || filteredCats.features.length === 0) return;
      fitToFeatures(map, filteredCats);
    });
  }, [rarityFilter, filteredCats]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusCatId) return;

    const feature = geojson.features.find((f) => f.properties.id === focusCatId);
    if (!feature || feature.geometry.type !== "Point") return;

    const coords = feature.geometry.coordinates as [number, number];
    whenStyleReady(map, () => {
      map.easeTo({ center: coords, zoom: 15, duration: 800 });
      setSelectedCat(feature.properties);
    });
  }, [focusCatId, geojson]);

  return (
    <div className="catch-map-root relative h-full min-h-0 w-full">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 space-y-2.5 p-3">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/60 bg-card/90 px-3.5 py-2 shadow-lg shadow-black/[0.06] backdrop-blur-xl">
          <Search className="size-4 shrink-0 text-muted-foreground" />
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
              "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
              filtersOpen || rarityFilter !== "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground",
            )}
          >
            <SlidersHorizontal className="size-3.5" />
          </button>
        </div>

        <div className="pointer-events-auto flex rounded-2xl border border-white/60 bg-card/85 p-1 shadow-lg shadow-black/[0.06] backdrop-blur-xl">
          {LAYER_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleLayerTabChange(key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-bold transition-all",
                layerTab === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {mapOverlayStatus?.kind === "error" && (
          <div className="pointer-events-auto flex max-w-full items-center justify-between gap-3 rounded-2xl border border-destructive/20 bg-card/95 px-3.5 py-2.5 shadow-md backdrop-blur-xl">
            <p className="text-xs text-muted-foreground">Could not load nearby places.</p>
            <button
              type="button"
              onClick={() => {
                const map = mapRef.current;
                if (map) void loadPois(map);
              }}
              className="shrink-0 text-xs font-bold text-primary"
            >
              Retry
            </button>
          </div>
        )}

        {mapOverlayStatus &&
          mapOverlayStatus.kind !== "error" &&
          mapOverlayStatus.message && (
            <div className="pointer-events-none inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-white/60 bg-card/90 px-3 py-1.5 text-[11px] shadow-md backdrop-blur-xl">
              {mapOverlayStatus.showLegend &&
                (mapOverlayStatus.legend === "vet" ? (
                  <VetLegendDots />
                ) : (
                  <ShelterLegendDots />
                ))}
              {mapOverlayStatus.showLegend && (
                <span className="text-border/80" aria-hidden>
                  ·
                </span>
              )}
              <span
                className={cn(
                  "font-semibold leading-snug",
                  mapOverlayStatus.kind === "loading"
                    ? "text-muted-foreground"
                    : "text-foreground",
                )}
              >
                {mapOverlayStatus.message}
              </span>
            </div>
          )}
      </div>

      {filtersOpen && (
        <div className="absolute inset-0 z-30 flex items-end bg-black/40 backdrop-blur-[2px]">
          <div className="w-full rounded-t-3xl border border-border/60 bg-card p-5 shadow-2xl">
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
        <div
          className={cn(
            "pointer-events-auto absolute inset-x-3 z-20 rounded-3xl border border-border/60 bg-card/95 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl",
            MAP_SHEET_BOTTOM,
          )}
        >
          <MapSheetClose onClose={() => setSelectedCat(null)} />
          <div className="flex items-center gap-3.5">
            <MapPin
              stickerUrl={selectedCat.sticker_url}
              rarity={selectedCat.rarity}
              size="lg"
            />
            <div className="min-w-0 flex-1 pr-8">
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
                className="mt-2 inline-flex items-center text-sm font-bold text-primary"
              >
                View cat →
              </Link>
            </div>
          </div>
        </div>
      )}

      {selectedStray && (
        <div
          className={cn(
            "pointer-events-auto absolute inset-x-3 z-20 rounded-3xl border border-border/60 bg-card/95 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl",
            MAP_SHEET_BOTTOM,
          )}
        >
          <MapSheetClose onClose={() => setSelectedStray(null)} />
          <div className="flex items-center gap-3.5">
            <MapPin
              stickerUrl={
                selectedStray.discovered ? (selectedStray.cover_sticker_url ?? undefined) : undefined
              }
              rarity={selectedStray.discovered ? "uncommon" : "common"}
              size="lg"
            />
            <div className="min-w-0 flex-1 pr-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {selectedStray.discovered ? "Found in your area" : "Locked stray"}
              </p>
              <p className="truncate font-extrabold text-foreground">
                {selectedStray.canonical_name?.trim() || "Mystery stray"}
              </p>
              {selectedStray.place_label && (
                <p className="truncate text-sm text-muted-foreground">
                  {selectedStray.place_label}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedStray.sighting_count} sighting
                {selectedStray.sighting_count === 1 ? "" : "s"}
              </p>
              {selectedStray.discovered ? (
                <Link
                  href={
                    selectedStray.user_capture_id
                      ? `/cat/${selectedStray.user_capture_id}`
                      : `/stray/${selectedStray.id}`
                  }
                  className="mt-2 inline-flex items-center text-sm font-bold text-primary"
                >
                  View cat →
                </Link>
              ) : (
                <Link
                  href="/catch"
                  className="mt-2 inline-flex items-center text-sm font-bold text-primary"
                >
                  Catch nearby to unlock →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedCurated && (
        <div
          className={cn(
            "pointer-events-auto absolute inset-x-4 z-20 max-w-sm overflow-hidden rounded-2xl border border-border/50 bg-card/95 shadow-lg shadow-black/10 backdrop-blur-xl",
            MAP_SHEET_BOTTOM,
          )}
        >
          <div className="relative flex items-start gap-2.5 p-3 pr-10">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              {selectedCurated.kind === "shelter" ? (
                <Building2 className="size-4" strokeWidth={2} />
              ) : (
                <Stethoscope className="size-4" strokeWidth={2} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-foreground">
                {selectedCurated.place.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {selectedCurated.place.city}
                {selectedCurated.place.country
                  ? ` · ${selectedCurated.place.country}`
                  : ""}
              </p>
              {selectedCurated.place.blurb && (
                <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
                  {shortBlurb(selectedCurated.place.blurb)}
                </p>
              )}
            </div>
            <MapSheetClose onClose={() => setSelectedCurated(null)} />
          </div>
          <div className="grid grid-cols-2 gap-1.5 border-t border-border/40 p-2">
            <a
              href={googleMapsDirectionsLink(
                selectedCurated.place.lat,
                selectedCurated.place.lng,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-2 py-2 text-xs font-bold text-primary-foreground active:scale-[0.98]"
            >
              <Navigation className="size-3.5" />
              Directions
            </a>
            <a
              href={googleMapsSearchLink(
                selectedCurated.place.lat,
                selectedCurated.place.lng,
                selectedCurated.place.name,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-muted/30 px-2 py-2 text-xs font-bold text-foreground active:scale-[0.98]"
            >
              Maps
            </a>
          </div>
        </div>
      )}

      {selectedPoi && (
        <div
          className={cn(
            "pointer-events-auto absolute inset-x-3 z-20 rounded-3xl border border-border/60 bg-card/95 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl",
            MAP_SHEET_BOTTOM,
          )}
        >
          <MapSheetClose onClose={() => setSelectedPoi(null)} />
          <div className="pr-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {selectedPoi.type === "shelter" ? "Local shelter" : "Veterinary"}
            </p>
            <p className="mt-1 font-extrabold leading-snug text-foreground">
              {selectedPoi.name}
            </p>
            {selectedPoi.address && (
              <p className="mt-1 text-sm text-muted-foreground">{selectedPoi.address}</p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={googleMapsDirectionsLink(selectedPoi.lat, selectedPoi.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground"
              >
                <Navigation className="size-4" />
                Directions
              </a>
              <a
                href={googleMapsSearchLink(selectedPoi.lat, selectedPoi.lng, selectedPoi.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-border bg-muted/30 px-3 py-2.5 text-sm font-bold text-foreground"
              >
                Open in Maps
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
