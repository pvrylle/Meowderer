import type { Capture } from "@/lib/supabase/types";

/** Display line for cards — prefer street/neighbourhood over city/country. */
export function capturePlaceLabel(capture: Capture): string | null {
  if (capture.place_label?.trim()) return capture.place_label.trim();

  const city = capture.city?.trim();
  const country = capture.country?.trim();
  if (!city && !country) return null;
  if (city && country && city.toLowerCase() === country.toLowerCase()) return city;

  const parts = [city, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}
