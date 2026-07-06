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
      <div className={cn("cat-detail-stage relative flex justify-center", className)}>
        <InteractiveCaptureCard
          capture={capture}
          className="mx-auto w-full max-w-[24rem]"
          cardClassName="w-full"
        />

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
