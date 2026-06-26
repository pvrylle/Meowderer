import type { Capture, Rarity } from "@/lib/supabase/types";

/**
 * Playful, deterministic "trading-card" flavour derived from a capture id.
 * These are not real metrics -- just cute personality stats so every cat card
 * feels collectible. Same id always yields the same numbers.
 */

const STAT_LABELS = ["Floof", "Sass", "Stealth", "Chonk"] as const;

export type CatStat = { label: string; value: number };

const RARITY_FLOOR: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 2,
  epic: 3,
};

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Three personality stats, each 1-5 paws. Higher rarity skews higher. */
export function catStats(capture: Pick<Capture, "id" | "rarity">): CatStat[] {
  const seed = hashString(capture.id);
  const floor = capture.rarity ? RARITY_FLOOR[capture.rarity] : 1;

  return STAT_LABELS.slice(0, 3).map((label, i) => {
    const raw = (seed >> (i * 6)) & 63; // 0..63
    const span = 5 - floor + 1;
    const value = floor + (raw % span);
    return { label, value: Math.min(5, Math.max(1, value)) };
  });
}

/** Stable Pokedex-style number, e.g. "#042". */
export function dexNumber(id: string): string {
  const n = (hashString(`dex:${id}`) % 151) + 1;
  return `#${String(n).padStart(3, "0")}`;
}

export type Biome = "meadow" | "city" | "beach" | "night" | "snow";

const BIOMES: Biome[] = ["meadow", "city", "beach", "night", "snow"];

export const BIOME_LABEL: Record<Biome, string> = {
  meadow: "Meadow",
  city: "City",
  beach: "Beach",
  night: "Night",
  snow: "Snow",
};

/** Stable habitat backdrop for a cat, derived from its id. */
export function pickBiome(capture: Pick<Capture, "id">): Biome {
  return BIOMES[hashString(`biome:${capture.id}`) % BIOMES.length];
}

const TRAIT_LINE: Record<string, string> = {
  Floof: "an unrepentant floofball",
  Sass: "powered entirely by sass",
  Stealth: "a master of the silent ambush",
};

/** A short, deterministic flavour bio for the card back. */
export function catBio(
  capture: Pick<Capture, "id" | "rarity" | "coat_type" | "city" | "country">,
): string {
  const stats = catStats(capture);
  const top = [...stats].sort((a, b) => b.value - a.value)[0];
  const place = capture.city || capture.country || "parts unknown";
  const coat = capture.coat_type ? `${capture.coat_type} ` : "";
  const tier = capture.rarity ? `${capture.rarity}-tier ` : "";
  const trait = TRAIT_LINE[top.label] ?? "full of surprises";
  return `This ${tier}${coat}cat was first spotted around ${place}. Locals say it's ${trait}.`;
}
