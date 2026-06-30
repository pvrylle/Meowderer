"use client";

import {
  CheckCircle2,
  Loader2,
  MapPin,
  Maximize2,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";

import { CoatTypePicker } from "@/components/capture/coat-type-picker";
import { CatButton } from "@/components/ui/cat-button";
import { Input } from "@/components/ui/input";
import type { CoatClassification } from "@/lib/capture/classify-coat";
import {
  STICKER_SCALE_MAX,
  STICKER_SCALE_MIN,
  STICKER_SCALE_STEP,
} from "@/lib/capture/scale-sticker";
import type { CoatType } from "@/lib/coat-rarity";
import { cn } from "@/lib/utils";

type LocationStatus = "idle" | "loading" | "ready" | "denied";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
      {children}
    </span>
  );
}

export function CatchReviewPanel({
  stickerScale,
  onStickerScaleChange,
  onAdjustStickerScale,
  selectedCoat,
  onCoatChange,
  classification,
  coatClassifying = false,
  nickname,
  onNicknameChange,
  locationStatus,
  onRetryLocation,
  canSave,
  saving,
  onRetake,
  onSave,
}: {
  stickerScale: number;
  onStickerScaleChange: (value: number) => void;
  onAdjustStickerScale: (delta: number) => void;
  selectedCoat: CoatType;
  onCoatChange: (coat: CoatType) => void;
  classification: CoatClassification | null;
  coatClassifying?: boolean;
  nickname: string;
  onNicknameChange: (value: string) => void;
  locationStatus: LocationStatus;
  onRetryLocation: () => void;
  canSave: boolean;
  saving: boolean;
  onRetake: () => void;
  onSave: () => void;
}) {
  const coatOverridden =
    classification != null && selectedCoat !== classification.coat_type;

  return (
    <section className="relative z-10 flex h-full min-h-0 flex-col overflow-hidden rounded-t-[1.25rem] border border-b-0 border-border/80 bg-card shadow-[0_-8px_32px_rgba(58,53,80,0.12)] sm:rounded-t-[1.75rem]">
      <div className="flex shrink-0 justify-center pt-2 pb-0.5">
        <span className="h-1 w-9 rounded-full bg-border sm:w-10" aria-hidden />
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 pb-2 pt-0.5 scrollbar-none sm:space-y-3.5 sm:px-4 sm:pb-3 sm:pt-1">
        {/* Sticker size — compact row on narrow screens */}
        <div className="rounded-xl bg-muted/45 p-2.5 sm:rounded-2xl sm:p-3.5">
          <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
            <span className="flex items-center gap-1.5 sm:gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-card shadow-sm sm:size-8 sm:rounded-xl">
                <Maximize2 className="size-3.5 text-primary sm:size-4" />
              </span>
              <FieldLabel>Sticker size</FieldLabel>
            </span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold tabular-nums text-primary sm:text-xs">
              {Math.round(stickerScale * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              aria-label="Smaller"
              disabled={stickerScale <= STICKER_SCALE_MIN}
              onClick={() => onAdjustStickerScale(-STICKER_SCALE_STEP)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-sm active:scale-95 disabled:opacity-35 sm:size-9"
            >
              <Minus className="size-3.5 sm:size-4" />
            </button>
            <input
              type="range"
              min={STICKER_SCALE_MIN}
              max={STICKER_SCALE_MAX}
              step={STICKER_SCALE_STEP}
              value={stickerScale}
              onChange={(e) => onStickerScaleChange(Number(e.target.value))}
              aria-label="Sticker size"
              className="catch-size-slider h-1.5 min-w-0 flex-1"
            />
            <button
              type="button"
              aria-label="Larger"
              disabled={stickerScale >= STICKER_SCALE_MAX}
              onClick={() => onAdjustStickerScale(STICKER_SCALE_STEP)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-sm active:scale-95 disabled:opacity-35 sm:size-9"
            >
              <Plus className="size-3.5 sm:size-4" />
            </button>
          </div>
        </div>

        {/* Coat type */}
        <div className="space-y-1.5 sm:space-y-2">
          <FieldLabel>Coat type</FieldLabel>
          <CoatTypePicker value={selectedCoat} onChange={onCoatChange} />
          {coatClassifying && !classification && (
            <p className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground sm:px-3 sm:py-2 sm:text-xs">
              <Loader2 className="size-3 shrink-0 animate-spin sm:size-3.5" />
              Detecting coat type…
            </p>
          )}
          {classification && (
            <p
              className={cn(
                "flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] leading-snug sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs sm:leading-relaxed",
                coatOverridden
                  ? "bg-orange/10 text-foreground"
                  : "bg-primary/8 text-muted-foreground",
              )}
            >
              <Sparkles className="mt-0.5 size-3 shrink-0 text-primary sm:size-3.5" />
              <span>
                AI picked{" "}
                <strong className="font-semibold capitalize text-foreground">
                  {classification.coat_type}
                </strong>{" "}
                ({Math.round(classification.confidence * 100)}%).
                {coatOverridden ? " Your pick is saved." : ""}
              </span>
            </p>
          )}
        </div>

        {/* Nickname */}
        <div className="space-y-1.5 sm:space-y-2">
          <FieldLabel>Nickname</FieldLabel>
          <div className="relative">
            <Pencil className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground sm:left-3.5 sm:size-4" />
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => onNicknameChange(e.target.value)}
              placeholder="Optional — e.g. Mittens"
              maxLength={40}
              className="h-10 rounded-xl border-border bg-background/80 pl-9 text-sm sm:h-12 sm:rounded-2xl sm:pl-10"
            />
          </div>
        </div>

        {/* Location */}
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl border px-2.5 py-2.5 sm:gap-3 sm:rounded-2xl sm:px-3.5 sm:py-3",
            locationStatus === "ready" && "border-green/40 bg-green/10",
            locationStatus === "denied" && "border-destructive/35 bg-destructive/5",
            (locationStatus === "loading" || locationStatus === "idle") &&
              "border-border bg-muted/30",
          )}
        >
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full sm:size-9",
              locationStatus === "ready" && "bg-green/25 text-green",
              locationStatus === "denied" && "bg-destructive/15 text-destructive",
              (locationStatus === "loading" || locationStatus === "idle") &&
                "bg-muted text-muted-foreground",
            )}
          >
            {locationStatus === "loading" || locationStatus === "idle" ? (
              <Loader2 className="size-3.5 animate-spin sm:size-4" />
            ) : locationStatus === "ready" ? (
              <CheckCircle2 className="size-3.5 sm:size-4" />
            ) : (
              <XCircle className="size-3.5 sm:size-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground sm:text-sm">
              {locationStatus === "ready" && "Location pinned"}
              {locationStatus === "denied" && "Location blocked"}
              {(locationStatus === "loading" || locationStatus === "idle") &&
                "Finding you…"}
            </p>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              {locationStatus === "ready" && "Shows on your map."}
              {locationStatus === "denied" && "Allow location to save."}
              {(locationStatus === "loading" || locationStatus === "idle") &&
                "Required to save."}
            </p>
          </div>
          {locationStatus === "denied" && (
            <button
              type="button"
              onClick={onRetryLocation}
              className="shrink-0 rounded-full bg-card px-2.5 py-1 text-[10px] font-bold text-primary shadow-sm sm:px-3 sm:py-1.5 sm:text-xs"
            >
              Retry
            </button>
          )}
          {locationStatus === "ready" && (
            <MapPin className="size-3.5 shrink-0 text-green opacity-70 sm:size-4" />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 gap-2 border-t border-border/60 bg-card px-3 py-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:gap-2.5 sm:px-4 sm:py-3 sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <CatButton
          variant="outline"
          size="sm"
          block
          onClick={onRetake}
          disabled={saving}
          className="rounded-xl sm:!h-12 sm:rounded-2xl sm:text-sm"
        >
          <RotateCcw className="size-3.5 sm:size-4" />
          Retake
        </CatButton>
        <CatButton
          size="sm"
          block
          onClick={onSave}
          loading={saving}
          disabled={!canSave || saving}
          className="rounded-xl sm:!h-12 sm:rounded-2xl sm:text-sm"
        >
          {saving ? "Saving…" : canSave ? "Save catch" : "Need location"}
        </CatButton>
      </div>
    </section>
  );
}
