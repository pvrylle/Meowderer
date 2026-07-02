"use client";

import { X } from "lucide-react";

import { CatButton } from "@/components/ui/cat-button";
import { PhoneOverlayPortal } from "@/components/phone-overlay-portal";
import { cn } from "@/lib/utils";

type ConfirmSheetProps = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmSheet({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  if (!open) return null;

  return (
    <PhoneOverlayPortal>
      <div
        className="absolute inset-0 z-50 flex items-end bg-black/30"
        role="presentation"
        onClick={onCancel}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-sheet-title"
          className="w-full rounded-t-3xl border border-border bg-card p-5 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2
              id="confirm-sheet-title"
              className={cn(
                "text-lg font-extrabold",
                destructive ? "text-destructive" : "text-foreground",
              )}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="text-sm text-muted-foreground">{description}</div>

          <div className="mt-5 flex flex-col gap-2">
            <CatButton
              block
              loading={loading}
              onClick={onConfirm}
              className={
                destructive
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : undefined
              }
            >
              {confirmLabel}
            </CatButton>
            <CatButton variant="outline" block onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </CatButton>
          </div>
        </div>
      </div>
    </PhoneOverlayPortal>
  );
}
