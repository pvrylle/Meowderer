"use server";

import { revalidatePath } from "next/cache";

import { backfillMissingPlaces } from "@/lib/achievements";
import { isDemoSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Rough estimate: ~400KB per capture (photo + sticker). Supabase free tier = 1GB. */
const ESTIMATED_BYTES_PER_CAPTURE = 400_000;
const FREE_TIER_BYTES = 1_073_741_824;

export async function backfillPlacesAction(): Promise<{
  success: boolean;
  updated: number;
  error?: string;
}> {
  if (await isDemoSession()) {
    return { success: false, updated: 0, error: "Not available in demo mode." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, updated: 0, error: "You must be signed in." };
  }

  const updated = await backfillMissingPlaces(supabase, user.id);
  revalidatePath("/map");
  revalidatePath("/catdex");
  return { success: true, updated };
}

export async function getStorageEstimateAction(): Promise<{
  captureCount: number;
  estimatedBytes: number;
  percentUsed: number;
}> {
  if (await isDemoSession()) {
    return { captureCount: 0, estimatedBytes: 0, percentUsed: 0 };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { captureCount: 0, estimatedBytes: 0, percentUsed: 0 };
  }

  const { count } = await supabase
    .from("captures")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const captureCount = count ?? 0;
  const estimatedBytes = captureCount * ESTIMATED_BYTES_PER_CAPTURE;
  const percentUsed = Math.min(
    100,
    Math.round((estimatedBytes / FREE_TIER_BYTES) * 100),
  );

  return { captureCount, estimatedBytes, percentUsed };
}
