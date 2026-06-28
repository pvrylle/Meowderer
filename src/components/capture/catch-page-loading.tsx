"use client";

export function CatchPageLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="size-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="text-sm font-semibold text-muted-foreground">
        Loading camera…
      </p>
    </div>
  );
}
