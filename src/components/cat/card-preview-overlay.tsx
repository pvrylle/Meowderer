"use client";

import { useEffect } from "react";
import { Maximize2, X } from "lucide-react";

import { InteractiveCaptureCard } from "@/components/interactive-capture-card";
import type { Capture } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export function CardPreviewOverlay({
  capture,
  onClose,
}: {
  capture: Capture;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Card preview"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-[22rem] flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="absolute -right-1 -top-1 z-10 flex size-9 items-center justify-center rounded-full bg-card text-muted-foreground shadow-md"
        >
          <X className="size-5" />
        </button>

        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/70">
          Tap card to flip
        </p>

        <InteractiveCaptureCard
          capture={capture}
          className="mx-auto w-full max-w-[22rem]"
          cardClassName="aspect-[5/7] w-full max-w-[22rem]"
        />
      </div>
    </div>
  );
}

export function CardPreviewButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="View card larger"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/90 px-3.5 py-1.5 text-[10px] font-semibold text-muted-foreground shadow-[0_8px_24px_rgba(58,53,80,0.08)] backdrop-blur-xl transition-all hover:text-foreground active:scale-95",
        className,
      )}
    >
      <Maximize2 className="size-3.5" />
      View larger
    </button>
  );
}
