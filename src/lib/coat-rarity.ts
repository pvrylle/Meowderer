import type { Rarity } from "@/lib/supabase/types";

/** Normalized coat labels used across classifier + demo data. */
export const COAT_TYPES = [
  "black",
  "white",
  "gray",
  "gray tabby",
  "ginger",
  "brown tabby",
  "tuxedo",
  "bicolor",
  "calico",
  "tortoiseshell",
  "pointed",
] as const;

export type CoatType = (typeof COAT_TYPES)[number];

const COMMON_COATS = new Set<string>(["black", "white", "gray", "gray tabby"]);
const UNCOMMON_COATS = new Set<string>(["ginger", "brown tabby", "tuxedo", "bicolor"]);
const RARE_COATS = new Set<string>(["calico", "tortoiseshell", "pointed", "tortie"]);

/** Map coat label → base rarity tier (PRD §9). */
export function coatToRarity(coatType: string): Rarity {
  const normalized = coatType.toLowerCase().trim();
  if (RARE_COATS.has(normalized)) return "rare";
  if (UNCOMMON_COATS.has(normalized)) return "uncommon";
  if (COMMON_COATS.has(normalized)) return "common";
  return "common";
}

/** Epic if first catch in a new city or country for this user. */
export function applyLocationEpicBonus(
  baseRarity: Rarity,
  city: string | null,
  country: string | null,
  existingCities: Set<string>,
  existingCountries: Set<string>,
): Rarity {
  const isNewCountry =
    country != null && country.length > 0 && !existingCountries.has(country);
  const isNewCity =
    city != null && city.length > 0 && !existingCities.has(city);

  if (isNewCountry || isNewCity) return "epic";
  return baseRarity;
}

const RARITY_RANK: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export function maxRarity(a: Rarity, b: Rarity): Rarity {
  return RARITY_RANK[a] >= RARITY_RANK[b] ? a : b;
}
