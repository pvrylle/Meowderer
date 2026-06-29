"use client";

import { useState } from "react";

import {
  CardPreviewButton,
  CardPreviewOverlay,
} from "@/components/cat/card-preview-overlay";
import { InteractiveCaptureCard } from "@/components/interactive-capture-card";
import type { Capture } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export function CatDetailCardStage({
  capture,
  className,
}: {
  capture: Capture;
  className?: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <div className={cn("cat-detail-stage relative", className)}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -right-6 top-0 size-32 rounded-full bg-white/60 blur-2xl" />
          <div className="absolute -bottom-4 -left-4 size-24 rounded-full bg-primary/15 blur-2xl" />
        </div>

        <div className="cat-detail-card-slot relative z-0">
          <div className="cat-detail-card-scale">
            <InteractiveCaptureCard capture={capture} />
          </div>
        </div>

        <CardPreviewButton
          onClick={() => setPreviewOpen(true)}
          className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2"
        />
      </div>

      {previewOpen && (
        <CardPreviewOverlay
          capture={capture}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
