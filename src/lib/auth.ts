import "server-only";

import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { DEMO_AVAILABLE, DEMO_COOKIE, DEMO_USER } from "@/lib/demo";

export type AppUser = { id: string; email: string | null };

/** Whether the current request is a demo session (cookie set, no Supabase). */
export async function isDemoSession(): Promise<boolean> {
  if (!DEMO_AVAILABLE) return false;
  const cookieStore = await cookies();
  return cookieStore.get(DEMO_COOKIE)?.value === "1";
}

/**
 * Returns the verified current user, or null. Uses getUser() (verified against
 * the Supabase auth server) -- never getSession(). Falls back to a demo user
 * when Supabase is unconfigured and the demo cookie is present.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { id: user.id, email: user.email ?? null } : null;
  }

  if (await isDemoSession()) {
    return { id: DEMO_USER.id, email: DEMO_USER.email };
  }

  return null;
}
