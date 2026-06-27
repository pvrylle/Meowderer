"use server";

import { revalidatePath } from "next/cache";

import { claimMission } from "@/lib/missions";
import { createClient } from "@/lib/supabase/server";

export async function claimMissionAction(missionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  const result = await claimMission(supabase, user.id, missionId);
  if (result.success) {
    revalidatePath("/missions");
    revalidatePath("/profile");
  }
  return result;
}

export async function syncMissionProgressAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const };

  const { progressMissionsAndBadgesAfterSave } = await import("@/lib/missions");
  await progressMissionsAndBadgesAfterSave(supabase, user.id);
  revalidatePath("/missions");
  return { success: true as const };
}
