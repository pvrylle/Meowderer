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
import { ConfirmSheet } from "@/components/confirm-sheet";
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
    "flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-center transition-all active:scale-[0.97]",
    destructive
      ? "text-destructive active:bg-destructive/10"
      : "text-muted-foreground hover:bg-muted/60 active:bg-muted",
    loading && "pointer-events-none opacity-60",
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} className={className}>
        <span className="flex size-9 items-center justify-center rounded-2xl bg-background/70 shadow-sm ring-1 ring-border/60">
          {children}
        </span>
        <span className="text-[10px] font-bold tracking-wide">{label}</span>
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
      <span className="flex size-9 items-center justify-center rounded-2xl bg-background/70 shadow-sm ring-1 ring-border/60">
        {children}
      </span>
      <span className="text-[10px] font-bold tracking-wide">{label}</span>
    </button>
  );
}

export function CatDetailDock({
  capture,
  isSuperAdmin = false,
  nameLocked = false,
}: {
  capture: Capture;
  isSuperAdmin?: boolean;
  nameLocked?: boolean;
}) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharingCard, setSharingCard] = useState(false);
  const [sharingCommunity, setSharingCommunity] = useState(false);
  const [communityConfirmOpen, setCommunityConfirmOpen] = useState(false);
  const [releaseConfirmOpen, setReleaseConfirmOpen] = useState(false);
  const [deleting, startDelete] = useTransition();

  const mapHref = capture.stray_cat_id
    ? `/map?stray=${capture.stray_cat_id}`
    : capture.lat != null && capture.lng != null
      ? `/map?cat=${capture.id}`
      : "/map";
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
      setSharingCard(false);
    }
  }

  async function confirmShareCommunity() {
    setSharingCommunity(true);
    const result = await createPostAction({
      body: defaultBody,
      category: "sighting",
      imageUrl: capture.sticker_url,
      captureId: capture.id,
      lat: capture.share_location ? capture.lat : null,
      lng: capture.share_location ? capture.lng : null,
    });
    setSharingCommunity(false);
    setCommunityConfirmOpen(false);

    if (!result.success) {
      toast.error(result.error ?? "Could not share.");
      return;
    }
    toast.success("Shared to Community!");
    router.push("/community");
  }

  function confirmReleaseCat() {
    startDelete(async () => {
      setReleaseConfirmOpen(false);
      await deleteCapture(capture.id);
    });
  }

  return (
    <footer className="relative z-20 shrink-0 rounded-[1.35rem] border border-border/70 bg-card/95 px-4 py-3 shadow-[0_14px_34px_rgba(58,53,80,0.10)] backdrop-blur-xl">
      <div
        ref={cardRef}
        className="pointer-events-none fixed -left-[9999px] top-0 w-[17rem] rounded-3xl bg-background p-2"
        aria-hidden
      >
        <CaptureCard capture={capture} size="lg" />
      </div>

      <div className="mb-2.5 text-center">
        <CatName
          id={capture.id}
          initialName={capture.nickname}
          nameLocked={nameLocked}
          isSuperAdmin={isSuperAdmin}
        />
      </div>

      <div className="grid grid-cols-4 gap-1">
        <DockAction label="Map" href={mapHref}>
          <MapPin className="size-5" />
        </DockAction>
        <DockAction label="Share" onClick={shareCard} loading={sharingCard}>
          <Share2 className="size-5" />
        </DockAction>
        <DockAction
          label="Community"
          onClick={() => setCommunityConfirmOpen(true)}
          loading={sharingCommunity}
        >
          <Users className="size-5" />
        </DockAction>
        <DockAction
          label="Release"
          onClick={() => setReleaseConfirmOpen(true)}
          loading={deleting}
          destructive
        >
          <Trash2 className="size-5" />
        </DockAction>
      </div>

      <ConfirmSheet
        open={communityConfirmOpen}
        title="Share to Community?"
        description={
          <>
            <p>
              Post <strong className="text-foreground">{name}</strong> as a sighting
              for other cat lovers to see.
            </p>
            <p className="mt-2 rounded-xl bg-muted/60 px-3 py-2 text-foreground">
              &ldquo;{defaultBody}&rdquo;
            </p>
          </>
        }
        confirmLabel="Share to Community"
        loading={sharingCommunity}
        onConfirm={() => void confirmShareCommunity()}
        onCancel={() => setCommunityConfirmOpen(false)}
      />

      <ConfirmSheet
        open={releaseConfirmOpen}
        title="Release this cat?"
        description={
          <>
            <p>
              <strong className="text-foreground">{name}</strong> will be removed from
              your collection. This can&apos;t be undone.
            </p>
          </>
        }
        confirmLabel="Release cat"
        destructive
        loading={deleting}
        onConfirm={confirmReleaseCat}
        onCancel={() => setReleaseConfirmOpen(false)}
      />
    </footer>
  );
}
