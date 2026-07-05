export interface Coords {
  lat: number;
  lng: number;
}

export type GeoErrorCode = "unavailable" | "denied" | "timeout" | "unknown";

export class GeoError extends Error {
  code: GeoErrorCode;

  constructor(message: string, code: GeoErrorCode) {
    super(message);
    this.name = "GeoError";
    this.code = code;
  }
}

function mapPositionError(err: GeolocationPositionError): GeoError {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return new GeoError(
        "Location permission denied for this site.",
        "denied",
      );
    case err.POSITION_UNAVAILABLE:
      return new GeoError("Location unavailable right now.", "unavailable");
    case err.TIMEOUT:
      return new GeoError("Location timed out — try again outdoors.", "timeout");
    default:
      return new GeoError(err.message || "Could not get your location.", "unknown");
  }
}

function getPositionOnce(
  options: PositionOptions,
): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new GeoError("Geolocation is not available.", "unavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(mapPositionError(err)),
      options,
    );
  });
}

function getPositionViaWatch(
  options: PositionOptions,
  timeoutMs: number,
): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new GeoError("Geolocation is not available.", "unavailable"));
      return;
    }

    let watchId: number | null = null;
    const timer = window.setTimeout(() => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      reject(new GeoError("Location timed out — try again outdoors.", "timeout"));
    }, timeoutMs);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        window.clearTimeout(timer);
        if (watchId != null) navigator.geolocation.clearWatch(watchId);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        window.clearTimeout(timer);
        if (watchId != null) navigator.geolocation.clearWatch(watchId);
        reject(mapPositionError(err));
      },
      options,
    );
  });
}

/**
 * Resolve device location with mobile-friendly fallbacks.
 * Tries fast/low-accuracy first, then high-accuracy, then watchPosition.
 */
export async function getCurrentPosition(): Promise<Coords> {
  const attempts: Array<() => Promise<Coords>> = [
    () =>
      getPositionOnce({
        enableHighAccuracy: false,
        timeout: 12_000,
        maximumAge: 120_000,
      }),
    () =>
      getPositionOnce({
        enableHighAccuracy: true,
        timeout: 18_000,
        maximumAge: 60_000,
      }),
    () =>
      getPositionViaWatch(
        { enableHighAccuracy: false, maximumAge: 120_000 },
        15_000,
      ),
  ];

  let lastError: GeoError | null = null;

  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err) {
      const geoErr =
        err instanceof GeoError
          ? err
          : new GeoError(
              err instanceof Error ? err.message : "Could not get your location.",
              "unknown",
            );
      lastError = geoErr;
      if (geoErr.code === "denied") break;
    }
  }

  throw lastError ?? new GeoError("Could not get your location.", "unknown");
}

const EARTH_RADIUS_M = 6_371_000;

/** Haversine distance in meters between two WGS84 points. */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

export function isWithinMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  maxMeters: number,
): boolean {
  return distanceMeters(lat1, lng1, lat2, lng2) <= maxMeters;
}
