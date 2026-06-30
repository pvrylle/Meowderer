"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import { requestPasswordReset } from "@/app/auth/actions";
import { BrandMark } from "@/components/brand-mark";
import { CatButton } from "@/components/ui/cat-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await requestPasswordReset(formData);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-8 px-7 py-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <BrandMark variant="logo" />
        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-foreground">Forgot password?</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>
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
        <CatButton type="submit" block loading={isPending}>
          Send reset link
        </CatButton>
      </form>

      <Link
        href="/auth"
        className="text-center text-sm font-semibold text-primary hover:underline"
      >
        Back to sign in
      </Link>
    </div>
  );
}
