"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function LegalBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
      aria-label="Back"
    >
      <ChevronLeft className="size-5" />
    </button>
  );
}
