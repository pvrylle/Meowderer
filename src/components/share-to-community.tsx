"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { createPostAction } from "@/app/(app)/community/actions";
import { CatButton } from "@/components/ui/cat-button";
import type { Capture } from "@/lib/supabase/types";

type ShareToCommunityProps = {
  capture: Capture;
};

export function ShareToCommunity({
  capture,
  compact = false,
}: ShareToCommunityProps & { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const name = capture.nickname?.trim() || "a stray cat";
  const place = [capture.city, capture.country].filter(Boolean).join(", ");
  const defaultBody = place
    ? `Spotted ${name} near ${place}!`
    : `Spotted ${name}!`;

  async function handleShare() {
    setLoading(true);
    const result = await createPostAction({
      body: defaultBody,
      category: "sighting",
      imageUrl: capture.sticker_url,
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "Could not share.");
      return;
    }
    toast.success("Shared to Community!");
    router.push("/community");
  }

  return (
    <CatButton
      variant="outline"
      block
      size={compact ? "md" : "lg"}
      loading={loading}
      onClick={handleShare}
      className={compact ? "h-11" : undefined}
    >
      <Share2 className="size-5" />
      {compact ? "Community" : "Share sighting to Community"}
    </CatButton>
  );
}
