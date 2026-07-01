import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser, isDemoSession } from "@/lib/auth";
import { DEMO_CAPTURES, getDemoCapture } from "@/lib/demo";
import type { Capture } from "@/lib/supabase/types";

export async function getCaptures(): Promise<Capture[]> {
  if (await isDemoSession()) return DEMO_CAPTURES;
  if (!isSupabaseConfigured) return [];

  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("captures")
    .select("*")
    .eq("user_id", user.id)
    .order("caught_at", { ascending: false });
  return data ?? [];
}

export async function getCapture(id: string): Promise<Capture | null> {
  if (await isDemoSession()) return getDemoCapture(id);
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("captures")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}
