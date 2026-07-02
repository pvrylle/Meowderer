"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { updatePassword } from "@/app/auth/actions";
import { BrandMark } from "@/components/brand-mark";
import { CatButton } from "@/components/ui/cat-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [ready, setReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
        return;
      }
      const hash = window.location.hash;
      if (hash.includes("type=recovery")) {
        setReady(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result?.error) toast.error(result.error);
    });
  }

  if (!ready) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-7 py-10 text-center">
        <p className="text-sm text-muted-foreground">Verifying reset link…</p>
        <Link href="/auth/forgot-password" className="mt-4 text-sm text-primary underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center gap-6 px-5 py-6 sm:gap-8 sm:px-7 sm:py-10 [@media(max-height:700px)]:gap-4 [@media(max-height:700px)]:py-4">
      <div className="flex flex-col items-center gap-3 text-center sm:gap-4 [@media(max-height:700px)]:gap-2">
        <BrandMark variant="logo" className="[@media(max-height:700px)]:w-28" />
        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-foreground">Choose a new password</h1>
          <p className="text-sm text-muted-foreground">
            At least 8 characters with a letter and a number.
          </p>
        </div>
      </div>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-sm font-semibold">
            New password
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              className="h-12 rounded-2xl bg-background/80 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </div>
        <CatButton type="submit" block loading={isPending}>
          Update password
        </CatButton>
      </form>
    </div>
  );
}
