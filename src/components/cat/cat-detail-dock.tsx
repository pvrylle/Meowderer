"use client";

import { useRouter } from "next/navigation";
import { forwardRef, useImperativeHandle, useRef, useState, useTransition } from "react";
import { Pencil, Share2, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { createPostAction } from "@/app/(app)/community/actions";
import { deleteCapture, renameCapture } from "@/app/(app)/cat/[id]/actions";
import { CaptureCard } from "@/components/cat-trading-card";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { PhoneOverlayPortal } from "@/components/phone-overlay-portal";
import { Input } from "@/components/ui/input";
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

function SheetMenuItem({
  icon,
  label,
  onClick,
  loading,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left text-sm font-semibold transition-colors active:bg-muted/60",
        destructive ? "text-destructive" : "text-foreground",
        loading && "pointer-events-none opacity-50",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-2xl",
          destructive ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}

export type CatDetailDockHandle = {
  openMenu: () => void;
};

export const CatDetailDock = forwardRef<
  CatDetailDockHandle,
  {
    capture: Capture;
    isSuperAdmin?: boolean;
  }
>(function CatDetailDock({ capture, isSuperAdmin = false }, ref) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sharingCard, setSharingCard] = useState(false);
  const [sharingCommunity, setSharingCommunity] = useState(false);
  const [communityConfirmOpen, setCommunityConfirmOpen] = useState(false);
  const [releaseConfirmOpen, setReleaseConfirmOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameName, setRenameName] = useState(capture.nickname ?? "");
  const [deleting, startDelete] = useTransition();
  const [savingRename, startRename] = useTransition();

  useImperativeHandle(ref, () => ({
    openMenu: () => setMenuOpen(true),
  }));

  const name = capture.nickname?.trim() || "a stray cat";
  const place = [capture.city, capture.country].filter(Boolean).join(", ");
  const defaultBody = place ? `Spotted ${name} near ${place}!` : `Spotted ${name}!`;
  const canRename = !capture.name_locked_at || isSuperAdmin;

  async function shareCard() {
    setMenuOpen(false);
    if (!cardRef.current) return;
    setSharingCard(true);
    try {
      const blob = await exportCardPng(cardRef.current);
      const file = new File([blob], "meowderer-cat.png", { type: "image/png" });
      const title = capture.nickname?.trim() || "My Meowderer catch";

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, files: [file] });
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast.success("Link also copied!");
        } catch {
          // silent
        }
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "meowderer-cat.png";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Card saved to your device.");
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link also copied!");
      } catch {
        // silent
      }
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

  function handleSaveRename() {
    startRename(async () => {
      const result = await renameCapture({ id: capture.id, nickname: renameName });
      if (result.success) {
        setRenaming(false);
        setMenuOpen(false);
        toast.success("Renamed!");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      {/* Off-screen card for PNG export */}
      <div
        ref={cardRef}
        className="pointer-events-none fixed -left-[9999px] top-0 w-[17rem] rounded-3xl bg-background p-2"
        aria-hidden
      >
        <CaptureCard capture={capture} size="lg" />
      </div>

      {/* Dock: actions sheet trigger only — no visible footer */}

      {/* Actions bottom sheet */}
      {menuOpen && (
        <PhoneOverlayPortal>
          <div
            className="absolute inset-0 z-50 flex items-end bg-black/30"
            role="presentation"
            onClick={() => {
              setMenuOpen(false);
              setRenaming(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Cat actions"
              className="w-full rounded-t-3xl border border-border bg-card p-3 pb-7 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />

              {canRename && (
                <div className="mb-1 px-1">
                  {renaming ? (
                    <div className="flex gap-2 pb-1">
                      <Input
                        value={renameName}
                        onChange={(e) => setRenameName(e.target.value)}
                        maxLength={40}
                        autoFocus
                        placeholder="Name this cat"
                        className="h-11 rounded-2xl"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename();
                          if (e.key === "Escape") setRenaming(false);
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveRename}
                        disabled={savingRename}
                        className="flex h-11 shrink-0 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenaming(false)}
                        className="flex h-11 shrink-0 items-center justify-center rounded-2xl bg-muted px-4 text-sm font-semibold text-muted-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <SheetMenuItem
                      icon={<Pencil className="size-4" />}
                      label="Rename"
                      onClick={() => {
                        setRenameName(capture.nickname ?? "");
                        setRenaming(true);
                      }}
                    />
                  )}
                </div>
              )}

              <SheetMenuItem
                icon={<Share2 className="size-4" />}
                label="Share card"
                onClick={() => void shareCard()}
                loading={sharingCard}
              />

              <SheetMenuItem
                icon={<Users className="size-4" />}
                label="Share to Community"
                onClick={() => {
                  setMenuOpen(false);
                  setCommunityConfirmOpen(true);
                }}
                loading={sharingCommunity}
              />

              <div className="my-2 border-t border-border/40" />

              <SheetMenuItem
                icon={<Trash2 className="size-4" />}
                label="Release cat"
                onClick={() => {
                  setMenuOpen(false);
                  setReleaseConfirmOpen(true);
                }}
                loading={deleting}
                destructive
              />
            </div>
          </div>
        </PhoneOverlayPortal>
      )}

      <ConfirmSheet
        open={communityConfirmOpen}
        title="Share to Community?"
        description={
          <>
            <p>
              Post <strong className="text-foreground">{name}</strong> as a sighting for other cat
              lovers to see.
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
          <p>
            <strong className="text-foreground">{name}</strong> will be removed from your
            collection. This can&apos;t be undone.
          </p>
        }
        confirmLabel="Release cat"
        destructive
        loading={deleting}
        onConfirm={confirmReleaseCat}
        onCancel={() => setReleaseConfirmOpen(false)}
      />
    </>
  );
});
