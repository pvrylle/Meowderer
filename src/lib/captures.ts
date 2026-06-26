import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isDemoSession } from "@/lib/auth";
import { DEMO_CAPTURES, getDemoCapture } from "@/lib/demo";
import type { Capture } from "@/lib/supabase/types";

export async function getCaptures(): Promise<Capture[]> {
  if (!isSupabaseConfigured) {
    return (await isDemoSession()) ? DEMO_CAPTURES : [];
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("captures")
    .select("*")
    .order("caught_at", { ascending: false });
  return data ?? [];
}

export async function getCapture(id: string): Promise<Capture | null> {
  if (!isSupabaseConfigured) {
    return (await isDemoSession()) ? getDemoCapture(id) : null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("captures")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}
