import type { Capture } from "@/lib/supabase/types";

/**
 * Demo mode lets you browse the app with sample cats via a cookie set by
 * "Continue as demo" on the auth screen. Works with or without Supabase.
 */
export const DEMO_AVAILABLE = true;
export const DEMO_COOKIE = "catdex-demo";

export const DEMO_USER = {
  id: "demo-user",
  email: "demo@catdex.app",
} as const;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export const DEMO_CAPTURES: Capture[] = [
  {
    id: "demo-1",
    user_id: DEMO_USER.id,
    photo_url: "demo/cat-1.svg",
    sticker_url: "/demo/cat-1.svg",
    lat: 14.5995,
    lng: 120.9842,
    city: "Manila",
    country: "Philippines",
    place_label: "East Tapinac",
    coat_type: "tuxedo",
    rarity: "uncommon",
    nickname: "Oyen",
    caught_at: daysAgo(1),
  },
  {
    id: "demo-2",
    user_id: DEMO_USER.id,
    photo_url: "demo/cat-2.svg",
    sticker_url: "/demo/cat-2.svg",
    lat: 1.3521,
    lng: 103.8198,
    city: "Singapore",
    country: "Singapore",
    place_label: "Orchard Road",
    coat_type: "ginger",
    rarity: "uncommon",
    nickname: "Mango",
    caught_at: daysAgo(3),
  },
  {
    id: "demo-3",
    user_id: DEMO_USER.id,
    photo_url: "demo/cat-3.svg",
    sticker_url: "/demo/cat-3.svg",
    lat: 35.6762,
    lng: 139.6503,
    city: "Tokyo",
    country: "Japan",
    place_label: "Shibuya",
    coat_type: "gray tabby",
    rarity: "common",
    nickname: "Blueberry",
    caught_at: daysAgo(6),
  },
  {
    id: "demo-4",
    user_id: DEMO_USER.id,
    photo_url: "demo/cat-4.svg",
    sticker_url: "/demo/cat-4.svg",
    lat: 13.7563,
    lng: 100.5018,
    city: "Bangkok",
    country: "Thailand",
    place_label: "Rizal Avenue",
    coat_type: "brown tabby",
    rarity: "common",
    nickname: "Biscuit",
    caught_at: daysAgo(9),
  },
  {
    id: "demo-5",
    user_id: DEMO_USER.id,
    photo_url: "demo/cat-5.svg",
    sticker_url: "/demo/cat-5.svg",
    lat: 48.8566,
    lng: 2.3522,
    city: "Paris",
    country: "France",
    place_label: "Le Marais",
    coat_type: "pointed",
    rarity: "rare",
    nickname: "Coco",
    caught_at: daysAgo(14),
  },
  {
    id: "demo-6",
    user_id: DEMO_USER.id,
    photo_url: "demo/cat-6.svg",
    sticker_url: "/demo/cat-6.svg",
    lat: 40.7128,
    lng: -74.006,
    city: "New York",
    country: "United States",
    place_label: "Brooklyn Bridge Park",
    coat_type: "tuxedo",
    rarity: "epic",
    nickname: "Salem",
    caught_at: daysAgo(21),
  },
];

export function getDemoCapture(id: string): Capture | null {
  return DEMO_CAPTURES.find((c) => c.id === id) ?? null;
}
