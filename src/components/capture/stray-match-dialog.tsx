"use client";

import Image from "next/image";
import { useState } from "react";
import { MapPin } from "lucide-react";

import { CatButton } from "@/components/ui/cat-button";
import { PhoneOverlayPortal } from "@/components/phone-overlay-portal";
import type { StrayMatch } from "@/lib/capture/match-stray-cat";
import { cn } from "@/lib/utils";

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)}m away`;
  return `${(m / 1000).toFixed(1)}km away`;
}

function ConfidencePill({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 92
      ? "bg-green/15 text-green"
      : pct >= 86
        ? "bg-orange/15 text-orange"
        : "bg-muted text-muted-foreground";
  return (
    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", color)}>
      {pct}% match
    </span>
  );
}

function CandidateCard({
  match,
  selected,
  onSelect,
}: {
  match: StrayMatch;
  selected: boolean;
  onSelect: () => void;
}) {
  const name = match.canonical_name?.trim() || "Mystery stray";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all active:scale-[0.98]",
        selected
          ? "border-primary/60 bg-primary/8 shadow-sm"
          : "border-border/60 bg-background/60",
      )}
    >
      {/* Sticker thumbnail */}
      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted/50">
        {match.cover_sticker_url ? (
          <Image
            src={match.cover_sticker_url}
            alt={name}
            fill
            className="object-contain p-1"
            sizes="56px"
            unoptimized
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl">
            🐱
          </span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">{name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <ConfidencePill score={match.score} />
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <MapPin className="size-2.5" />
            {formatDistance(match.distanceM)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {match.sighting_count} sighting{match.sighting_count === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Radio circle */}
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-primary bg-primary" : "border-border bg-transparent",
        )}
      >
        {selected && (
          <span className="size-2 rounded-full bg-white" />
        )}
      </span>
    </button>
  );
}

export function StrayMatchDialog({
  matches,
  onConfirm,
  onNewCat,
  onCancel,
}: {
  matches: StrayMatch[];
  onConfirm: (id: string) => void;
  onNewCat: () => void;
  onCancel: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    matches.length === 1 ? matches[0].id : null,
  );

  const isSingle = matches.length === 1;
  const title = isSingle ? "Same cat?" : "Looks familiar…";
  const subtitle = isSingle
    ? "This looks like a cat spotted nearby. Is it the same one?"
    : `${matches.length} cats nearby look similar. Pick the right one, or save as new.`;

  return (
    <PhoneOverlayPortal>
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div
          role="dialog"
          aria-labelledby="stray-match-title"
          className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-xl"
        >
        <h2 id="stray-match-title" className="text-lg font-extrabold text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

        {/* Candidate list */}
        <div className="mt-4 space-y-2">
          {matches.map((m) => (
            <CandidateCard
              key={m.id}
              match={m}
              selected={selectedId === m.id}
              onSelect={() => setSelectedId(m.id)}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-2">
          <CatButton
            block
            disabled={selectedId === null}
            onClick={() => selectedId && onConfirm(selectedId)}
          >
            {isSingle ? "Yes, same cat" : "Yes, that's the one"}
          </CatButton>
          <CatButton variant="outline" block onClick={onNewCat}>
            No, new cat
          </CatButton>
          <button
            type="button"
            onClick={onCancel}
            className="py-2 text-center text-sm font-semibold text-muted-foreground"
          >
            Cancel
          </button>
        </div>
        </div>
      </div>
    </PhoneOverlayPortal>
  );
}