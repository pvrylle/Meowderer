import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

type DexPlaceholderCardProps = {
  variant: "explore" | "undiscovered";
};

export function DexPlaceholderCard({ variant }: DexPlaceholderCardProps) {
  const isExplore = variant === "explore";

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-dashed border-border/60 bg-muted/15">
      <div className="flex aspect-square items-center justify-center bg-muted/20">
        <div className="flex size-10 items-center justify-center rounded-md bg-muted/50">
          {isExplore ? (
            <MapPin className="size-5 text-muted-foreground/50" />
          ) : (
            <span className="text-lg text-muted-foreground/40">?</span>
          )}
        </div>
      </div>
      <p className="border-t border-border/40 py-2 text-center text-[10px] text-muted-foreground/60">
        {isExplore ? "Keep exploring" : "Not found"}
      </p>
    </div>
  );
}
