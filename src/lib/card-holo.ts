import type { Rarity } from "@/lib/supabase/types";

export type CardHoloProfile = {
  idleClass: string;
  tiltClass: string;
  /** RGB triplet for the tilt glare highlight, e.g. "186,230,253" */
  glareRgb: string;
};

const HOLO_BY_RARITY: Record<string, CardHoloProfile> = {
  uncommon: {
    idleClass: "holo-idle-uncommon",
    tiltClass: "holo-tilt-uncommon",
    glareRgb: "167,243,208",
  },
  rare: {
    idleClass: "holo-idle-rare",
    tiltClass: "holo-tilt-rare",
    glareRgb: "186,230,253",
  },
  epic: {
    idleClass: "holo-idle-epic",
    tiltClass: "holo-tilt-epic",
    glareRgb: "221,214,254",
  },
  legendary: {
    idleClass: "holo-idle-legendary",
    tiltClass: "holo-tilt-legendary",
    glareRgb: "253,230,138",
  },
};

/** Holo shimmer profile for a rarity tier (common = none). */
export function cardHoloProfile(rarity?: Rarity | null): CardHoloProfile | null {
  if (!rarity || rarity === "common") return null;
  return HOLO_BY_RARITY[rarity] ?? null;
}

export function hasCardHolo(rarity?: Rarity | null): boolean {
  return cardHoloProfile(rarity) !== null;
}
