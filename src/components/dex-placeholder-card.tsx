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
        "flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed p-4 text-center",
        isExplore
          ? "border-border bg-muted/30"
          : "border-border/80 bg-card/50",
      )}
    >
      <div
        className={cn(
          "flex size-16 items-center justify-center rounded-full",
          isExplore ? "bg-muted" : "bg-muted/60",
        )}
      >
        {isExplore ? (
          <MapPin className="size-7 text-muted-foreground/50" />
        ) : (
          <span className="text-2xl text-muted-foreground/40">🐱</span>
        )}
      </div>
      <div>
        <p className="font-bold text-muted-foreground">???</p>
        <p className="text-[11px] text-muted-foreground/70">
          {isExplore ? "Keep exploring" : "Not discovered"}
        </p>
      </div>
    </div>
  );
}
