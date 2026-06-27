import "server-only";

import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { DEMO_COOKIE, DEMO_USER } from "@/lib/demo";

export type AppUser = { id: string; email: string | null };

/** Whether the current request is a demo session (cookie set). */
export async function isDemoSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(DEMO_COOKIE)?.value === "1";
}

/**
 * Returns the verified current user, or null. Demo cookie takes priority so you
 * can preview sample data even when Supabase is configured. Real auth uses
 * getUser() (never getSession()).
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  if (await isDemoSession()) {
    return { id: DEMO_USER.id, email: DEMO_USER.email };
  }

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { id: user.id, email: user.email ?? null } : null;
  }

  return null;
}
