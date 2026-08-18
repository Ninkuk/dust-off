export type LatLng = { latitude: number; longitude: number };

// Boundary guard for expo-media-library's AssetInfo.location: on iOS the
// bridge delivers latitude/longitude as STRINGS despite the number typing,
// which turns `longitude + 180` into string concatenation downstream. Coerce
// and validate here so consumers only ever see real numbers.
export function toLatLng(
  location:
    | { latitude?: number | string; longitude?: number | string }
    | null
    | undefined,
): LatLng | null {
  if (!location) return null;
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

// Equirectangular (plate carrée) projection onto the unit square — the same
// projection the bundled world-map path uses, so a projected point can be
// overlaid on it directly.
export function projectEquirectangular(
  latitude: number,
  longitude: number,
): { x: number; y: number } {
  return {
    x: (longitude + 180) / 360,
    y: (90 - latitude) / 180,
  };
}

export function formatCoordinates(
  latitude: number,
  longitude: number,
): string {
  const lat = `${Math.abs(latitude).toFixed(4)}° ${latitude < 0 ? "S" : "N"}`;
  const lng = `${Math.abs(longitude).toFixed(4)}° ${longitude < 0 ? "W" : "E"}`;
  return `${lat}, ${lng}`;
}

// Hands the coordinate to the OS maps app — a user-initiated hand-off, same
// privacy posture as the share sheet. The app itself makes no network call.
export function mapsUrl(
  latitude: number,
  longitude: number,
  platform: "ios" | "android",
): string {
  const ll = `${latitude},${longitude}`;
  return platform === "ios" ? `maps:?ll=${ll}` : `geo:${ll}?q=${ll}`;
}
