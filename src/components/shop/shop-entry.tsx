"use client";

import { useEffect, useState } from "react";
import {
  ChevronRight,
  Cookie,
  Fish,
  Gift,
  Lock,
  ShoppingBag,
  X,
} from "lucide-react";

import { CatButton } from "@/components/ui/cat-button";
import { PhoneOverlayPortal } from "@/components/phone-overlay-portal";

type PreviewItem = {
  icon: typeof Fish;
  name: string;
  cost: number;
};

const PREVIEW_ITEMS: PreviewItem[] = [
  { icon: Fish, name: "Wet food pack", cost: 500 },
  { icon: Cookie, name: "Crunchy treats", cost: 250 },
  { icon: Gift, name: "Care bundle", cost: 1200 },
];

export function ShopEntry({ points }: { points: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl bg-card p-4 text-left shadow-sm ring-1 ring-border/50 transition-transform active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15">
            <ShoppingBag className="size-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Shop</p>
            <p className="text-xs text-muted-foreground">
              Trade points for cat food
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1.5">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
            Soon
          </span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </span>
      </button>

      {open && <ShopModal points={points} onClose={() => setOpen(false)} />}
    </>
  );
}

function ShopModal({
  points,
  onClose,
}: {
  points: number;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <PhoneOverlayPortal>
      <div
        className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shop-modal-title"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xs rounded-2xl bg-card p-4 shadow-xl ring-1 ring-border"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-center gap-2 pr-6">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/12">
              <ShoppingBag className="size-4 text-primary" />
            </div>
            <h2
              id="shop-modal-title"
              className="text-base font-bold text-foreground"
            >
              Cat Food Shop
            </h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              Soon
            </span>
          </div>

          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            Spend the points you earn catching cats on food and treats for the
            strays you meet.
          </p>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
            <span className="text-xs text-muted-foreground">Your points</span>
            <span className="text-sm font-bold text-foreground">
              {points.toLocaleString()}
            </span>
          </div>

          <ul className="mt-3 space-y-2">
            {PREVIEW_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.name}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-foreground">{item.name}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="size-3" />
                    {item.cost.toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>

          <CatButton block size="sm" className="mt-4" onClick={onClose}>
            Got it
          </CatButton>
        </div>
      </div>
    </PhoneOverlayPortal>
  );
}
