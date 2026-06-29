import { Compass } from "lucide-react";

export function MapSkeleton() {
  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-muted/50">
      <div className="absolute inset-x-0 top-0 z-10 space-y-2 p-4">
        <div className="h-11 animate-pulse rounded-xl bg-card shadow-sm" />
        <div className="flex gap-2">
          <div className="h-8 w-12 animate-pulse rounded-lg bg-primary/20" />
          <div className="h-8 w-16 animate-pulse rounded-lg bg-card" />
          <div className="h-8 w-16 animate-pulse rounded-lg bg-card" />
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <Compass className="size-8 animate-pulse text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  );
}
