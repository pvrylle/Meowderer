"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, Share2 } from "lucide-react";
import { toast } from "sonner";

import { createPostAction } from "@/app/(app)/community/actions";
import { CatButton } from "@/components/ui/cat-button";
import type { Capture } from "@/lib/supabase/types";

type ShareToCommunityProps = {
  capture: Capture;
  compact?: boolean;
};

export function ShareToCommunity({
  capture,
  compact = false,
}: ShareToCommunityProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rescueLoading, setRescueLoading] = useState(false);

  const name = capture.nickname?.trim() || "a stray cat";
  const place = [capture.city, capture.country].filter(Boolean).join(", ");
  const defaultBody = place
    ? `Spotted ${name} near ${place}!`
    : `Spotted ${name}!`;

  async function share(category: "sighting" | "rescue", body: string) {
    const setBusy = category === "rescue" ? setRescueLoading : setLoading;
    setBusy(true);
    const result = await createPostAction({
      body,
      category,
      imageUrl: capture.sticker_url,
      captureId: capture.id,
    });
    setBusy(false);

    if (!result.success) {
      toast.error(result.error ?? "Could not share.");
      return;
    }
    toast.success(
      category === "rescue"
        ? "Rescue story shared!"
        : "Shared to Community!",
    );
    router.push("/community");
  }

  if (compact) {
    return (
      <CatButton
        variant="outline"
        block
        size="md"
        loading={loading}
        onClick={() => share("sighting", defaultBody)}
        className="h-11"
      >
        <Share2 className="size-5" />
        Community
      </CatButton>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <CatButton
        variant="outline"
        block
        size="lg"
        loading={loading}
        onClick={() => share("sighting", defaultBody)}
      >
        <Share2 className="size-5" />
        Share sighting to Community
      </CatButton>
      <CatButton
        variant="outline"
        block
        size="md"
        loading={rescueLoading}
        onClick={() =>
          share(
            "rescue",
            place
              ? `Rescue update for ${name} near ${place}.`
              : `Rescue update for ${name}.`,
          )
        }
      >
        <Heart className="size-5" />
        Share as rescue story
      </CatButton>
    </div>
  );
}
