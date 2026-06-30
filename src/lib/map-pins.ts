import type { Rarity } from "@/lib/supabase/types";

/** Speech-bubble pin frames from public/assets (colored borders). */
export const PIN_FRAME: Record<Rarity | "default", string> = {
  common: "/assets/Background-3.svg",
  uncommon: "/assets/Background-2.svg",
  rare: "/assets/Background.svg",
  epic: "/assets/Background-1.svg",
  legendary: "/assets/Background-1.svg",
  default: "/assets/Background-1.svg",
};

export function pinFrameForRarity(rarity: Rarity | null): string {
  return rarity ? PIN_FRAME[rarity] : PIN_FRAME.default;
}
