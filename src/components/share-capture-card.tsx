"use client";

import { useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { CatButton } from "@/components/ui/cat-button";
import { CaptureCard } from "@/components/cat-trading-card";
import type { Capture } from "@/lib/supabase/types";

async function exportCardPng(element: HTMLElement): Promise<Blob> {
  const { toBlob } = await import("html-to-image");
  const blob = await toBlob(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#FDFAF4",
  });
  if (!blob) throw new Error("Could not export image.");
  return blob;
}

export function ShareCaptureCard({
  capture,
  compact = false,
}: {
  capture: Capture;
  compact?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  async function share() {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const blob = await exportCardPng(cardRef.current);
      const file = new File([blob], "meowderer-cat.png", { type: "image/png" });
      const title = capture.nickname?.trim() || "My Meowderer catch";

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, files: [file] });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "meowderer-cat.png";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Card saved to your device.");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Could not share this card.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <>
      <div
        ref={cardRef}
        className="pointer-events-none fixed -left-[9999px] top-0 w-[17rem] rounded-3xl bg-background p-2"
        aria-hidden
      >
        <CaptureCard capture={capture} size="lg" />
      </div>
      <CatButton
        type="button"
        variant="outline"
        block
        size={compact ? "md" : "lg"}
        loading={sharing}
        onClick={share}
        className={compact ? "h-11" : undefined}
      >
        <Share2 className="size-5" />
        Share card
      </CatButton>
    </>
  );
}
