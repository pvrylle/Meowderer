"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { toast } from "sonner";

import {
  resendConfirmationEmail,
  signIn,
  signUp,
} from "@/app/auth/actions";
import { BrandMark } from "@/components/brand-mark";
import { CatButton } from "@/components/ui/cat-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { DEMO_AVAILABLE, DEMO_COOKIE } from "@/lib/demo";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export function AuthForm({ initialMode = "signin" }: { initialMode?: Mode }) {
  const searchParams = useSearchParams();
  const modeFromQuery = searchParams.get("mode");
  const defaultMode: Mode =
    modeFromQuery === "signup" ? "signup" : initialMode;

  const [mode, setMode] = useState<Mode>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [oauthPending, setOauthPending] = useState(false);

  function continueAsDemo() {
    document.cookie = `${DEMO_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
    window.location.href = "/home";
  }

  function handleSubmit(formData: FormData) {
    if (mode === "signup" && !termsAccepted) {
      toast.error("Please accept the Terms of Service and Privacy Policy.");
      return;
    }
    if (mode === "signup") {
      formData.set("acceptTerms", "on");
    }

    startTransition(async () => {
      const action = mode === "signin" ? signIn : signUp;
      const result = await action(formData);
      if (result?.error) toast.error(result.error);
    });
  }

  async function handleGoogle() {
    if (!isSupabaseConfigured) {
      toast.error("Supabase is not configured yet. See README setup.");
      return;
    }
    setOauthPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error(error.message);
      setOauthPending(false);
    }
  }

  return (
    <>
      <div className="flex flex-1 flex-col justify-center gap-8 px-7 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandMark variant="logo" priority />
          <p className="text-sm text-muted-foreground">
            {mode === "signin"
              ? "Welcome back, cat catcher."
              : "Create your account and start collecting strays."}
          </p>
        </div>

        <div className="flex rounded-full bg-muted/80 p-1 backdrop-blur-sm">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-full py-2.5 text-sm font-bold transition-colors",
                mode === m
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-sm font-semibold">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="h-12 rounded-2xl bg-background/80"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-semibold">
                Password
              </Label>
              {mode === "signin" && (
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                placeholder="••••••••"
                required
                minLength={mode === "signup" ? 8 : 6}
                className="h-12 rounded-2xl bg-background/80 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
            {mode === "signup" && (
              <p className="text-xs text-muted-foreground">
                At least 8 characters with a letter and a number.
              </p>
            )}
          </div>

          {mode === "signup" && (
            <label className="flex items-start gap-3 rounded-2xl bg-muted/50 p-3 text-left text-sm">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary"
              />
              <span className="text-muted-foreground">
                I agree to the{" "}
                <Link href="/legal/terms" className="font-semibold text-primary underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/legal/privacy" className="font-semibold text-primary underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          )}

          <CatButton
            type="submit"
            block
            loading={isPending}
            disabled={mode === "signup" && !termsAccepted}
            className="mt-2"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </CatButton>
        </form>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <CatButton
          type="button"
          variant="outline"
          block
          loading={oauthPending}
          onClick={handleGoogle}
        >
          Continue with Google
        </CatButton>

        {DEMO_AVAILABLE && (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-muted/60 p-4 text-center backdrop-blur-sm">
            <p className="text-xs text-muted-foreground">
              Preview the app with 6 sample cats — map, cards, and collection included.
            </p>
            <CatButton
              type="button"
              variant="secondary"
              size="md"
              block
              onClick={continueAsDemo}
            >
              Continue as demo
            </CatButton>
          </div>
        )}
      </div>
    </>
  );
}

export function CheckEmailClient({
  email,
  mode,
}: {
  email?: string;
  mode: "signup" | "reset";
}) {
  const [resending, setResending] = useState(false);

  async function handleResend() {
    if (!email || mode !== "signup") return;
    setResending(true);
    const result = await resendConfirmationEmail(email);
    setResending(false);
    if (result.error) toast.error(result.error);
    else toast.success("Confirmation email sent!");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-7 py-10 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/15">
        <Mail className="size-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-extrabold text-foreground">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "reset"
            ? "If an account exists for that email, we sent a password reset link."
            : email
              ? `We sent a confirmation link to ${decodeURIComponent(email)}.`
              : "We sent a confirmation link to your email."}
        </p>
      </div>
      {mode === "signup" && email && (
        <CatButton
          variant="outline"
          loading={resending}
          onClick={handleResend}
        >
          Resend confirmation email
        </CatButton>
      )}
      <Link href="/auth" className="text-sm font-semibold text-primary hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
