"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_STYLE_URL,
  type CaptureGeoJSON,
} from "@/lib/map";

type CatchMapProps = {
  geojson: CaptureGeoJSON;
};

function fitToFeatures(map: maplibregl.Map, geojson: CaptureGeoJSON) {
  const coords = geojson.features.map((f) => f.geometry.coordinates);
  if (coords.length === 0) return;
  if (coords.length === 1) {
    map.easeTo({ center: coords[0] as [number, number], zoom: 12 });
    return;
  }
  const bounds = coords.reduce(
    (b, c) => b.extend(c as [number, number]),
    new maplibregl.LngLatBounds(
      coords[0] as [number, number],
      coords[0] as [number, number],
    ),
  );
  map.fitBounds(bounds, { padding: 48, maxZoom: 10, duration: 0 });
}

function popupHtml(props: CaptureGeoJSON["features"][0]["properties"]) {
  const place = props.place
    ? `<p style="margin:4px 0 0;font-size:11px;color:#a8a2b8">${escapeHtml(props.place)}</p>`
    : "";
  return `
    <div style="text-align:center;min-width:120px;padding:4px 2px 2px">
      <img src="${escapeHtml(props.sticker_url)}" alt="" width="72" height="72" style="object-fit:contain;display:block;margin:0 auto 6px" />
      <p style="margin:0;font-weight:800;font-size:14px;color:#3a3550">${escapeHtml(props.name)}</p>
      ${place}
      <a href="/cat/${escapeHtml(props.id)}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:700;color:#9b7ede;text-decoration:none">View cat →</a>
    </div>
  `;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function CatchMap({ geojson }: CatchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const hasPoints = geojson.features.length > 0;

  useEffect(() => {
    if (!containerRef.current || !hasPoints) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: MAP_DEFAULT_CENTER,
      zoom: MAP_DEFAULT_ZOOM,
      attributionControl: { compact: true },
    });

    mapRef.current = map;
    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: "200px",
      className: "catdex-map-popup",
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserLocation: true,
      }),
      "top-right",
    );

    map.on("load", () => {
      map.addSource("captures", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 48,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "captures",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#d9ccf6",
            5,
            "#9b7ede",
            15,
            "#7c5fd4",
          ],
          "circle-radius": ["step", ["get", "point_count"], 18, 5, 24, 15, 30],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "captures",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: { "text-color": "#3a3550" },
      });

      map.addLayer({
        id: "unclustered",
        type: "circle",
        source: "captures",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "match",
            ["get", "rarity"],
            "common",
            "#c9d3e3",
            "uncommon",
            "#8fd6a6",
            "rare",
            "#7fb4e8",
            "epic",
            "#b79cf0",
            "#9b7ede",
          ],
          "circle-radius": 12,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      fitToFeatures(map, geojson);

      map.on("click", "clusters", async (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const clusterId = feature.properties?.cluster_id as number | undefined;
        if (clusterId == null) return;
        const source = map.getSource("captures") as maplibregl.GeoJSONSource;
        try {
          const zoom = await source.getClusterExpansionZoom(clusterId);
          const geometry = feature.geometry;
          if (geometry.type !== "Point") return;
          map.easeTo({
            center: geometry.coordinates as [number, number],
            zoom,
          });
        } catch {
          // cluster gone or source updating
        }
      });

      map.on("click", "unclustered", (e) => {
        const feature = e.features?.[0];
        if (!feature?.properties) return;
        const geometry = feature.geometry;
        if (geometry.type !== "Point") return;
        popupRef.current
          ?.setLngLat(geometry.coordinates as [number, number])
          .setHTML(popupHtml(feature.properties as CaptureGeoJSON["features"][0]["properties"]))
          .addTo(map);
      });

      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "unclustered", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "unclustered", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [geojson, hasPoints]);

  if (!hasPoints) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
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
    <div ref={containerRef} className="h-full min-h-[280px] w-full" />
  );
}
