"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { DEMO_COOKIE } from "@/lib/demo";

export type AuthResult = { error: string } | undefined;

const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

function parseCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase is not configured yet. See README setup." };
  }

  const parsed = parseCredentials(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE);

  redirect("/home");
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase is not configured yet. See README setup." };
  }

  const parsed = parseCredentials(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);
  if (error) return { error: error.message };

  // When email confirmation is enabled there is no active session yet.
  if (!data.session) {
    return { error: "Check your inbox to confirm your email, then sign in." };
  }

  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE);

  redirect("/home");
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE);

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/auth");
}
