/** Placeholder shown while the client-only map bundle loads. */
export function MapSkeleton() {
  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-[#e8eef4]">
      <div className="absolute inset-x-0 top-0 z-10 space-y-3 p-4">
        <div className="h-12 rounded-2xl border border-border/60 bg-card/95 shadow-md" />
        <div className="flex gap-2">
          <div className="h-9 w-14 rounded-full bg-primary/20" />
          <div className="h-9 w-20 rounded-full bg-card/95" />
          <div className="h-9 w-24 rounded-full bg-card/95" />
        </div>
      </div>
      <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </p>
    </div>
  );
}
