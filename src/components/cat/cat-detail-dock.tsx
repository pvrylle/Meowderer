"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  MapPin,
  Share2,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { createPostAction } from "@/app/(app)/community/actions";
import { deleteCapture } from "@/app/(app)/cat/[id]/actions";
import { CatName } from "@/components/cat/cat-actions";
import { CaptureCard } from "@/components/cat-trading-card";
import { cn } from "@/lib/utils";
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

function DockAction({
  label,
  onClick,
  loading,
  href,
  destructive,
  children,
}: {
  label: string;
  onClick?: () => void;
  loading?: boolean;
  href?: string;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  const className = cn(
    "flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2.5 text-center transition-colors active:scale-[0.97]",
    destructive
      ? "text-destructive active:bg-destructive/10"
      : "text-muted-foreground active:bg-muted",
    loading && "pointer-events-none opacity-60",
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} className={className}>
        {children}
        <span className="text-[10px] font-bold">{label}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={loading}
      className={className}
    >
      {children}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

export function CatDetailDock({ capture }: { capture: Capture }) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharingCard, setSharingCard] = useState(false);
  const [sharingCommunity, setSharingCommunity] = useState(false);
  const [deleting, startDelete] = useTransition();

  const hasMap = capture.lat != null && capture.lng != null;
  const name = capture.nickname?.trim() || "a stray cat";
  const place = [capture.city, capture.country].filter(Boolean).join(", ");
  const defaultBody = place
    ? `Spotted ${name} near ${place}!`
    : `Spotted ${name}!`;

  async function shareCard() {
    if (!cardRef.current) return;
    setSharingCard(true);
    try {
      const blob = await exportCardPng(cardRef.current);
      const file = new File([blob], "catdex-cat.png", { type: "image/png" });
      const title = capture.nickname?.trim() || "My CatDex catch";

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, files: [file] });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "catdex-cat.png";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Card saved to your device.");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Could not share this card.");
    } finally {
      setSharingCard(false);
    }
  }

  async function shareCommunity() {
    setSharingCommunity(true);
    const result = await createPostAction({
      body: defaultBody,
      category: "sighting",
      imageUrl: capture.sticker_url,
    });
    setSharingCommunity(false);

    if (!result.success) {
      toast.error(result.error ?? "Could not share.");
      return;
    }
    toast.success("Shared to Community!");
    router.push("/community");
  }

  function releaseCat() {
    if (!window.confirm("Release this cat from your CatDex?")) return;
    startDelete(async () => {
      await deleteCapture(capture.id);
    });
  }

  return (
    <footer className="relative z-20 shrink-0 rounded-t-[1.75rem] border border-border/80 bg-card px-4 pt-2.5 shadow-[0_-8px_28px_rgba(58,53,80,0.08)] pb-[var(--nav-clearance)]">
      <div
        ref={cardRef}
        className="pointer-events-none fixed -left-[9999px] top-0 w-[17rem] rounded-3xl bg-background p-2"
        aria-hidden
      >
        <CaptureCard capture={capture} size="lg" />
      </div>

      <div className="mb-2 text-center">
        <CatName id={capture.id} initialName={capture.nickname} />
      </div>

      <div className="flex gap-1.5">
        {hasMap && (
          <DockAction label="Map" href="/map">
            <MapPin className="size-5" />
          </DockAction>
        )}
        <DockAction label="Share" onClick={shareCard} loading={sharingCard}>
          <Share2 className="size-5" />
        </DockAction>
        <DockAction
          label="Community"
          onClick={shareCommunity}
          loading={sharingCommunity}
        >
          <Users className="size-5" />
        </DockAction>
        <DockAction
          label="Release"
          onClick={releaseCat}
          loading={deleting}
          destructive
        >
          <Trash2 className="size-5" />
        </DockAction>
      </div>
    </footer>
  );
}
