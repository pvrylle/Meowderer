"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { isDemoSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const usernameSchema = z
  .string()
  .trim()
  .min(2, "Username must be at least 2 characters.")
  .max(24, "Username must be 24 characters or less.")
  .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, and underscores only.");

export async function completeWelcomeAction(formData: FormData): Promise<{
  error?: string;
}> {
  if (await isDemoSession()) {
    redirect("/home");
  }

  const parsed = usernameSchema.safeParse(formData.get("username"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid username." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", parsed.data)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) {
    return { error: "That username is already taken." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username: parsed.data,
      onboarding_complete: true,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  redirect("/home");
}

export async function skipWelcomeAction(): Promise<void> {
  if (await isDemoSession()) {
    redirect("/home");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  await supabase
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("id", user.id);

  redirect("/home");
}
