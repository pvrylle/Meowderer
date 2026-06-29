import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

type DexPlaceholderCardProps = {
  variant: "explore" | "undiscovered";
};

export function DexPlaceholderCard({ variant }: DexPlaceholderCardProps) {
  const isExplore = variant === "explore";

  return (
    <div
      className={cn(
        "flex aspect-[5/7] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center",
        isExplore ? "border-border/60 bg-muted/20" : "border-border/40 bg-muted/10",
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted/50">
        {isExplore ? (
          <MapPin className="size-5 text-muted-foreground/50" />
        ) : (
          <span className="text-lg text-muted-foreground/40">?</span>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground/60">
        {isExplore ? "Keep exploring" : "Not found"}
      </p>
    </div>
  );
}
