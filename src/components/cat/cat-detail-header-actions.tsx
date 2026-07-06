"use client";

import { Heart, MoreHorizontal } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { toggleFavorite } from "@/app/(app)/cat/[id]/actions";
import { cn } from "@/lib/utils";

export function CatDetailHeaderActions({
  captureId,
  shareTitle,
  shareText,
  isFavorited,
  onOpenMenu,
}: {
  captureId: string;
  shareTitle: string;
  shareText: string;
  isFavorited: boolean;
  onOpenMenu: () => void;
}) {
  const [liked, setLiked] = useState(isFavorited);
  const [pending, startTransition] = useTransition();

  async function handleFavorite() {
    const previousState = liked;
    setLiked(!liked);

    startTransition(async () => {
      const result = await toggleFavorite({ captureId });
      if (!result.success) {
        setLiked(previousState);
        toast.error(result.error || "Sign in to save favorites");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={liked ? "Remove favorite" : "Favorite"}
        onClick={handleFavorite}
        disabled={pending}
        className={cn(
          "flex size-10 items-center justify-center rounded-full border border-border/60 bg-card/85 shadow-[0_8px_24px_rgba(58,53,80,0.08)] backdrop-blur-xl transition-all active:scale-95",
          liked ? "text-destructive" : "text-muted-foreground",
          pending && "opacity-60",
        )}
      >
        <Heart className={cn("size-5", liked && "fill-current")} />
      </button>

      <button
        type="button"
        aria-label="More options"
        onClick={onOpenMenu}
        className="flex size-10 items-center justify-center rounded-full border border-border/60 bg-card/85 text-muted-foreground shadow-[0_8px_24px_rgba(58,53,80,0.08)] backdrop-blur-xl transition-all active:scale-95"
      >
        <MoreHorizontal className="size-5" />
      </button>
    </div>
  );
}
