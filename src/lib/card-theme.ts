import type { Rarity } from "@/lib/supabase/types";

export type CardRarityTheme = {
  frame: string;
  shell: string;
  header: string;
  artFrame: string;
  artInner: string;
  badge: string;
  strip: string;
  panel: string;
  statFill: string;
  statEmpty: string;
  glow: string;
  pattern: string;
  divider: string;
  /** When set, frame uses a CSS class instead of bg-gradient-to-br */
  frameClass?: string;
  shellClass?: string;
  panelClass?: string;
  textOnDark?: boolean;
};

export const CARD_RARITY_THEME: Record<string, CardRarityTheme> = {
  common: {
    frame: "from-zinc-400 via-zinc-200 to-zinc-400",
    shell: "from-zinc-100 via-white to-zinc-50",
    header: "from-zinc-500 to-zinc-600",
    artFrame: "border-zinc-300 bg-zinc-200",
    artInner: "from-zinc-100 to-zinc-50",
    badge: "bg-zinc-600",
    strip: "bg-zinc-200/90",
    panel: "from-zinc-100/90 to-zinc-50/90",
    statFill: "bg-zinc-500",
    statEmpty: "bg-zinc-300/60",
    glow: "",
    pattern: "text-zinc-300/50",
    divider: "bg-zinc-400",
  },
  uncommon: {
    frame: "from-emerald-400 via-lime-300 to-teal-400",
    shell: "from-emerald-50 via-lime-50 to-teal-50",
    header: "from-emerald-600 to-teal-600",
    artFrame: "border-emerald-400 bg-emerald-200",
    artInner: "from-emerald-100 to-teal-50",
    badge: "bg-gradient-to-r from-emerald-600 to-teal-600",
    strip: "bg-emerald-200/90",
    panel: "from-emerald-100/95 to-teal-50/95",
    statFill: "bg-emerald-600",
    statEmpty: "bg-emerald-300/50",
    glow: "shadow-[0_0_28px_rgba(16,185,129,0.28)]",
    pattern: "text-emerald-300/60",
    divider: "bg-emerald-500",
  },
  rare: {
    frame: "from-sky-400 via-cyan-300 to-blue-400",
    shell: "from-sky-50 via-cyan-50 to-blue-50",
    header: "from-sky-600 to-blue-600",
    artFrame: "border-sky-400 bg-sky-200",
    artInner: "from-sky-100 to-blue-50",
    badge: "bg-gradient-to-r from-sky-600 to-blue-600",
    strip: "bg-sky-200/90",
    panel: "from-sky-100/95 to-blue-50/95",
    statFill: "bg-sky-600",
    statEmpty: "bg-sky-300/50",
    glow: "shadow-[0_0_28px_rgba(14,165,233,0.32)]",
    pattern: "text-sky-300/60",
    divider: "bg-sky-500",
  },
  epic: {
    frame: "from-[#b8a9d4] via-[#ddd6ee] to-[#b8a9d4]",
    shell: "from-[#f3effa] via-[#ebe4f7] to-[#e8dff5]",
    header: "from-[#7c6aad] to-[#9b8bc4]",
    artFrame: "border-[#b8a9d4] bg-[#ddd6ee]",
    artInner: "from-[#ebe4f7] to-[#e0d6f0]",
    badge: "bg-[#8b7cb8]",
    strip: "bg-[#ddd6ee]/90",
    panel: "from-[#ebe4f7]/95 to-[#e0d6f0]/95",
    statFill: "bg-[#8b7cb8]",
    statEmpty: "bg-[#c4b8dc]/50",
    glow: "shadow-[0_8px_28px_rgba(124,106,173,0.22)]",
    pattern: "text-[#c4b8dc]/50",
    divider: "text-[#b8a9d4]/60",
    textOnDark: false,
  },
  legendary: {
    frame: "from-amber-400 via-yellow-300 to-orange-400",
    shell: "from-amber-50 via-yellow-50 to-orange-50",
    header: "from-amber-500 via-yellow-500 to-orange-500",
    artFrame: "border-amber-400 bg-amber-200",
    artInner: "from-amber-100 to-orange-50",
    badge: "bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500",
    strip: "bg-amber-200/90",
    panel: "from-amber-100/95 to-orange-50/95",
    statFill: "bg-amber-600",
    statEmpty: "bg-amber-300/50",
    glow: "shadow-[0_0_42px_rgba(245,158,11,0.42)]",
    pattern: "text-amber-300/60",
    divider: "bg-amber-500",
  },
};

export function cardTheme(rarity?: Rarity | null): CardRarityTheme {
  return CARD_RARITY_THEME[rarity ?? "common"] ?? CARD_RARITY_THEME.common;
}
