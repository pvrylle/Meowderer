"use server";

import { revalidatePath } from "next/cache";

import { backfillMissingPlaces } from "@/lib/achievements";
import { isDemoSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
