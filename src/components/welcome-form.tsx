"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

import {
  completeWelcomeAction,
  skipWelcomeAction,
} from "@/app/welcome/actions";
import { BrandMark } from "@/components/brand-mark";
import { CatButton } from "@/components/ui/cat-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WelcomeForm({ suggestedUsername }: { suggestedUsername: string }) {
  const [isPending, startTransition] = useTransition();
  const [skipping, setSkipping] = useState(false);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await completeWelcomeAction(formData);
      if (result?.error) toast.error(result.error);
    });
  }

  async function handleSkip() {
    setSkipping(true);
    await skipWelcomeAction();
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-8 px-7 py-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <BrandMark variant="logo" />
        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-foreground">Welcome to Meowderer!</h1>
          <p className="text-sm text-muted-foreground">
            Pick a display name for the community.
          </p>
        </div>
      </div>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username" className="text-sm font-semibold">
            Username
          </Label>
          <Input
            id="username"
            name="username"
            defaultValue={suggestedUsername}
            required
            minLength={2}
            maxLength={24}
            pattern="[a-zA-Z0-9_]+"
            className="h-12 rounded-2xl"
          />
        </div>

        <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-4 text-left text-sm">
          <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            Location is optional and private by default. You can change GPS settings anytime in{" "}
            <Link href="/settings" className="font-semibold text-primary underline">
              Settings
            </Link>
            .
          </p>
        </div>

        <CatButton type="submit" block loading={isPending}>
          Continue to Meowderer
        </CatButton>
      </form>

      <button
        type="button"
        onClick={handleSkip}
        disabled={skipping}
        className="text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        Skip for now
      </button>
    </div>
  );
}
