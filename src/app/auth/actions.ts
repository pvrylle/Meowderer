"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { DEMO_COOKIE } from "@/lib/demo";

export type AuthResult = { error: string } | undefined;

const signInSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const signUpSchema = z
  .object({
    email: z.string().email("Enter a valid email."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Za-z]/, "Password must include at least one letter.")
      .regex(/[0-9]/, "Password must include at least one number."),
    acceptTerms: z.string().optional(),
  })
  .refine((data) => data.acceptTerms === "on", {
    message: "You must accept the Terms and Privacy Policy.",
    path: ["acceptTerms"],
  });

function parseSignIn(formData: FormData) {
  return signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

function parseSignUp(formData: FormData) {
  return signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    acceptTerms: formData.get("acceptTerms"),
  });
}

async function recordTermsAcceptance(userId: string) {
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ accepted_terms_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase is not configured yet. See README setup." };
  }

  const parsed = parseSignIn(formData);
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

  const parsed = parseSignUp(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { acceptTerms: _, ...credentials } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(credentials);
  if (error) return { error: error.message };

  if (!data.session) {
    const email = encodeURIComponent(parsed.data.email);
    redirect(`/auth/check-email?email=${email}`);
  }

  if (data.user) {
    await recordTermsAcceptance(data.user.id);
  }

  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE);

  redirect("/welcome");
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

export async function requestPasswordReset(formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase is not configured yet. See README setup." };
  }

  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) {
    return { error: "Enter a valid email." };
  }

  const supabase = await createClient();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${origin}/auth/reset-password`,
  });
  if (error) return { error: error.message };

  redirect("/auth/check-email?mode=reset");
}

export async function updatePassword(formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase is not configured yet. See README setup." };
  }

  const password = z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Za-z]/, "Password must include at least one letter.")
    .regex(/[0-9]/, "Password must include at least one number.")
    .safeParse(formData.get("password"));

  if (!password.success) {
    return { error: password.error.issues[0]?.message ?? "Invalid password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { error: error.message };

  redirect("/home");
}

export async function resendConfirmationEmail(
  email: string,
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase is not configured yet." };
  }

  const parsed = z.string().email().safeParse(email);
  if (!parsed.success) {
    return { error: "Invalid email." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
  });
  if (error) return { error: error.message };
  return {};
}

export async function acceptTermsAction(): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase is not configured yet." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ accepted_terms_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { error: error.message };

  return {};
}
