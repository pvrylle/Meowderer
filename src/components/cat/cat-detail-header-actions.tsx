"use client";

import { Heart, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function CatDetailHeaderActions({
  shareTitle,
  shareText,
}: {
  shareTitle: string;
  shareText: string;
}) {
  const [liked, setLiked] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url });
        return;
      } catch {
        return;
      }
    }

    await navigator.clipboard.writeText(url);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={liked ? "Remove favorite" : "Favorite"}
        onClick={() => setLiked((value) => !value)}
        className={cn(
          "flex size-10 items-center justify-center rounded-full border border-border/60 bg-card/85 shadow-[0_8px_24px_rgba(58,53,80,0.08)] backdrop-blur-xl transition-all active:scale-95",
          liked ? "text-destructive" : "text-muted-foreground",
        )}
      >
        <Heart className={cn("size-5", liked && "fill-current")} />
      </button>
      <button
        type="button"
        aria-label="Share"
        onClick={() => void handleShare()}
        className="flex size-10 items-center justify-center rounded-full border border-border/60 bg-card/85 text-muted-foreground shadow-[0_8px_24px_rgba(58,53,80,0.08)] backdrop-blur-xl transition-all active:scale-95"
      >
        <Share2 className="size-5" />
      </button>
    </div>
  );
}