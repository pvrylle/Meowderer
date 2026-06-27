"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { recordShelterVisitAction } from "@/app/(app)/community/actions";
import { isWithinMeters } from "@/lib/geo";
import type { Poi } from "@/lib/overpass";

const CHECK_IN_RADIUS_M = 200;
const POLL_MS = 15_000;

export function useShelterCheckIn(pois: Poi[], enabled: boolean) {
  const checkedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || pois.length === 0) return;

    let watchId: number | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function tryCheckIn(lat: number, lng: number) {
      for (const poi of pois) {
        if (poi.type !== "shelter") continue;
        if (checkedRef.current.has(poi.id)) continue;
        if (!isWithinMeters(lat, lng, poi.lat, poi.lng, CHECK_IN_RADIUS_M)) {
          continue;
        }

        checkedRef.current.add(poi.id);
        const result = await recordShelterVisitAction({
          osmId: poi.id,
          lat: poi.lat,
          lng: poi.lng,
          name: poi.name,
        });

        if (result.success) {
          toast.success(`Checked in at ${poi.name}!`);
        }
      }
    }

    function onPosition(pos: GeolocationPosition) {
      void tryCheckIn(pos.coords.latitude, pos.coords.longitude);
    }

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(onPosition, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 10_000,
      });
      intervalId = setInterval(() => {
        navigator.geolocation.getCurrentPosition(onPosition, () => {}, {
          enableHighAccuracy: true,
          maximumAge: 10_000,
        });
      }, POLL_MS);
    }

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [pois, enabled]);
}
