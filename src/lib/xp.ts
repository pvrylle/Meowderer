import type { Rarity } from "@/lib/supabase/types";

export function isRareOrEpic(rarity: Rarity | null): boolean {
  return rarity === "rare" || rarity === "epic";
}

export function levelFromXp(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 800) return 4;
  if (xp < 1200) return 5;
  return Math.min(10, 5 + Math.floor((xp - 1200) / 400));
}

export function xpForBadgeLevel(level: number): number {
  return level * 20;
}
