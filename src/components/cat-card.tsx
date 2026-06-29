import Link from "next/link";

import { CaptureCard } from "@/components/cat-trading-card";
import type { Capture } from "@/lib/supabase/types";

export function CatCard({
  capture,
  priority,
}: {
  capture: Capture;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/cat/${capture.id}`}
      className="block rounded-2xl shadow-sm ring-1 ring-black/5 transition-all active:scale-[0.98]"
      aria-label={capture.nickname?.trim() || "Unnamed"}
    >
      <CaptureCard capture={capture} size="sm" priority={priority} />
    </Link>
  );
}
