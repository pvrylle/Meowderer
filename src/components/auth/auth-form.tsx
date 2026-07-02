"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
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
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export function AuthForm({
  initialMode = "signin",
  authError,
}: {
  initialMode?: Mode;
  authError?: string;
}) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (authError) toast.error(authError);
  }, [authError]);

  useEffect(() => {
    const modeFromQuery = searchParams.get("mode");
    if (modeFromQuery === "signup") setMode("signup");
    else if (modeFromQuery === "signin") setMode("signin");
  }, [searchParams]);

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

  return (
    <div className="auth-screen flex h-full min-h-0 flex-1 flex-col justify-between overflow-hidden px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex min-h-0 flex-col gap-2.5 max-[700px]:gap-2 max-[600px]:gap-1.5">
        <div className="flex flex-col items-center gap-1 text-center max-[600px]:gap-0.5">
          <BrandMark
            variant="logo"
            priority
            className={cn(
              "auth-logo w-[min(7rem,52vw)] sm:w-[min(8rem,58vw)]",
              mode === "signup" && "w-[min(5.75rem,44vw)] sm:w-[min(6.5rem,48vw)]",
            )}
          />
          {mode === "signin" && (
            <p className="text-sm text-muted-foreground max-[600px]:text-xs">
              Welcome back, cat catcher.
            </p>
          )}
        </div>

        <div className="relative z-20 shrink-0">
        <div className="relative isolate flex overflow-hidden rounded-full bg-muted/80 p-1">
          {(["signin", "signup"] as const).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "relative flex-1 rounded-full py-2 text-sm font-bold transition-colors",
                  active ? "text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="auth-mode-indicator"
                    className="absolute inset-0 rounded-full bg-primary shadow-sm"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10">
                  {m === "signin" ? "Sign in" : "Sign up"}
                </span>
              </button>
            );
          })}
        </div>
        </div>

        <form
          id="auth-main-form"
          action={handleSubmit}
          className="flex flex-col gap-2 max-[700px]:gap-1.5"
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="email" className="text-sm font-semibold max-[600px]:text-xs">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="auth-input h-10 rounded-2xl bg-muted/30 max-[600px]:h-9"
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password" className="text-sm font-semibold max-[600px]:text-xs">
                Password
              </Label>
              {mode === "signin" && (
                <Link
                  href="/auth/forgot-password"
                  className="shrink-0 text-xs font-semibold text-primary hover:underline"
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
                className="auth-input h-10 rounded-2xl bg-muted/30 pr-12 max-[600px]:h-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-5 max-[600px]:size-4" />
                ) : (
                  <Eye className="size-5 max-[600px]:size-4" />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="shrink-0 flex flex-col gap-2 pt-1 max-[600px]:gap-1.5">
        {mode === "signup" && (
          <label className="flex items-start gap-2 rounded-xl bg-muted/50 p-2 text-left text-[11px] leading-snug max-[600px]:p-1.5 max-[600px]:text-[10px]">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 size-3.5 shrink-0 rounded border-border accent-primary"
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
          form="auth-main-form"
          block
          loading={isPending}
          disabled={mode === "signup" && !termsAccepted}
          className="max-[600px]:h-10 max-[600px]:text-sm"
        >
          {mode === "signin" ? "Sign in" : "Create account"}
        </CatButton>
      </div>
    </div>
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
    <div className="flex flex-col items-center justify-center gap-6 px-5 py-10 text-center sm:px-7">
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
