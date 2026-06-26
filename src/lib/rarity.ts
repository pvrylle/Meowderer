import type { Rarity } from "@/lib/supabase/types";

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
};

// Background tint behind the sticker for each tier.
export const RARITY_TINT: Record<Rarity, string> = {
  common: "bg-common/25",
  uncommon: "bg-uncommon/25",
  rare: "bg-rare/25",
  epic: "bg-epic/30",
};

// Badge styling for each tier.
export const RARITY_BADGE: Record<Rarity, string> = {
  common: "bg-common/30 text-foreground",
  uncommon: "bg-uncommon/30 text-foreground",
  rare: "bg-rare/30 text-foreground",
  epic: "bg-epic/40 text-foreground",
};

export function rarityTint(rarity: Rarity | null) {
  return rarity ? RARITY_TINT[rarity] : "bg-muted";
}

// Outer trading-card frame gradient per tier (literal classes so Tailwind keeps them).
export const RARITY_FRAME: Record<Rarity, string> = {
  common: "from-common to-common/50",
  uncommon: "from-uncommon to-uncommon/50",
  rare: "from-rare to-rare/50",
  epic: "from-epic to-epic/50",
};

// Solid-ish name banner background per tier.
export const RARITY_BANNER: Record<Rarity, string> = {
  common: "bg-common",
  uncommon: "bg-uncommon",
  rare: "bg-rare",
  epic: "bg-epic",
};

const NEUTRAL_FRAME = "from-secondary to-secondary/50";
const NEUTRAL_BANNER = "bg-secondary";

export function rarityFrame(rarity: Rarity | null) {
  return rarity ? RARITY_FRAME[rarity] : NEUTRAL_FRAME;
}

export function rarityBanner(rarity: Rarity | null) {
  return rarity ? RARITY_BANNER[rarity] : NEUTRAL_BANNER;
}

export function rarityLabel(rarity: Rarity | null) {
  return rarity ? RARITY_LABEL[rarity] : "New";
}
