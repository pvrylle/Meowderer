"use client";

import { CatButton } from "@/components/ui/cat-button";
import type { StrayCatCandidate } from "@/lib/capture/match-stray-cat";

export function StrayMatchDialog({
  match,
  onConfirm,
  onNewCat,
  onCancel,
}: {
  match: StrayCatCandidate;
  onConfirm: () => void;
  onNewCat: () => void;
  onCancel: () => void;
}) {
  const name = match.canonical_name?.trim() || "this cat";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-labelledby="stray-match-title"
        className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-xl"
      >
        <h2 id="stray-match-title" className="text-lg font-extrabold text-foreground">
          Same cat?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This looks like <strong className="text-foreground">{name}</strong> spotted
          nearby ({match.sighting_count} sightings). Add as a new sighting?
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <CatButton block onClick={onConfirm}>
            Yes, same cat
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
  );
}
