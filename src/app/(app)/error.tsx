"use client";

import { useEffect } from "react";

import { CatButton } from "@/components/ui/cat-button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-5xl">🙀</div>
      <div>
        <p className="font-bold text-foreground">Something went wrong</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We couldn&apos;t load this page. Please try again.
        </p>
      </div>
      <CatButton size="md" onClick={reset}>
        Try again
      </CatButton>
    </div>
  );
}
