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

/** XP at which each level (1-10) begins — kept in sync with levelFromXp. */
const LEVEL_STARTS = [0, 100, 250, 500, 800, 1600, 2000, 2400, 2800, 3200];
const MAX_LEVEL = 10;

export type XpProgress = {
  level: number;
  xp: number;
  /** XP earned within the current level. */
  xpIntoLevel: number;
  /** XP needed to advance from this level to the next. */
  xpForLevel: number;
  /** XP still required to reach the next level. */
  xpToNext: number;
  /** Percent progress toward the next level (0-100). */
  pct: number;
  isMax: boolean;
};

/** Break an XP total into level + progress toward the next level. */
export function xpProgress(xp: number): XpProgress {
  const safeXp = Math.max(0, Math.floor(xp));
  const level = levelFromXp(safeXp);
  const isMax = level >= MAX_LEVEL;
  const start = LEVEL_STARTS[Math.min(level - 1, LEVEL_STARTS.length - 1)];
  const next = isMax ? start : LEVEL_STARTS[level];
  const xpForLevel = isMax ? 0 : next - start;
  const xpIntoLevel = safeXp - start;
  const pct = isMax
    ? 100
    : Math.max(0, Math.min(100, Math.round((xpIntoLevel / xpForLevel) * 100)));

  return {
    level,
    xp: safeXp,
    xpIntoLevel,
    xpForLevel,
    xpToNext: isMax ? 0 : Math.max(0, next - safeXp),
    pct,
    isMax,
  };
}
