"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { signIn, signUp } from "@/app/auth/actions";
import { BrandMark } from "@/components/brand-mark";
import { CatButton } from "@/components/ui/cat-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { DEMO_AVAILABLE, DEMO_COOKIE } from "@/lib/demo";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [isPending, startTransition] = useTransition();
  const [oauthPending, setOauthPending] = useState(false);

  function continueAsDemo() {
    document.cookie = `${DEMO_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
    router.push("/home");
    router.refresh();
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const action = mode === "signin" ? signIn : signUp;
      const result = await action(formData);
      // A successful action redirects, so we only get here on error.
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
    <div className="flex flex-1 flex-col justify-center gap-8 px-7 py-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <BrandMark />
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">CatDex</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Welcome back, cat catcher."
              : "Start your collection today."}
          </p>
        </div>
      </div>

      <div className="flex rounded-full bg-muted p-1">
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
            className="h-12 rounded-2xl"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-sm font-semibold">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="••••••••"
            required
            minLength={6}
            className="h-12 rounded-2xl"
          />
        </div>

        <CatButton type="submit" block loading={isPending} className="mt-2">
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
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-muted/60 p-4 text-center">
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
  );
}
