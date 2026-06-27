import { COAT_TYPES } from "@/lib/coat-rarity";
import type { Capture } from "@/lib/supabase/types";

export type CollectionProgress = {
  totalCats: number;
  uniqueCoats: number;
  totalCoatTypes: number;
  coatPercent: number;
  cities: number;
  countries: number;
};

export function computeCollectionProgress(
  captures: Capture[],
): CollectionProgress {
  const uniqueCoats = new Set(
    captures.map((c) => c.coat_type?.toLowerCase().trim()).filter(Boolean),
  ).size;

  const totalCoatTypes = COAT_TYPES.length;
  const coatPercent =
    totalCoatTypes > 0
      ? Math.round((uniqueCoats / totalCoatTypes) * 100)
      : 0;

  const cities = new Set(
    captures.map((c) => c.city).filter((c): c is string => Boolean(c)),
  ).size;

  const countries = new Set(
    captures.map((c) => c.country).filter((c): c is string => Boolean(c)),
  ).size;

  return {
    totalCats: captures.length,
    uniqueCoats,
    totalCoatTypes,
    coatPercent,
    cities,
    countries,
  };
}
