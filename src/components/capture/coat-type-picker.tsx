"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Cat, Check, ChevronDown, X } from "lucide-react";

import { COAT_TYPES, type CoatType } from "@/lib/coat-rarity";
import { cn } from "@/lib/utils";

function formatCoatLabel(coat: string): string {
  return coat.replace(/\b\w/g, (char) => char.toUpperCase());
}

function useIsDesktopPicker(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isDesktop;
}

export function CoatTypePicker({
  value,
  onChange,
}: {
  value: CoatType;
  onChange: (coat: CoatType) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const isDesktop = useIsDesktopPicker();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    if (!isDesktop) document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, isDesktop]);

  useEffect(() => {
    if (!open || !isDesktop) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, isDesktop]);

  function pick(coat: CoatType) {
    onChange(coat);
    setOpen(false);
  }

  const optionButtons = COAT_TYPES.map((coat) => {
    const selected = coat === value;
    return (
      <button
        key={coat}
        type="button"
        role="option"
        aria-selected={selected}
        onClick={() => pick(coat)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold capitalize transition-colors active:scale-[0.99]",
          selected
            ? "bg-primary/15 text-primary"
            : "text-foreground hover:bg-muted/80 active:bg-muted",
        )}
      >
        <span className="truncate">{formatCoatLabel(coat)}</span>
        {selected && <Check className="size-4 shrink-0" strokeWidth={2.5} />}
      </button>
    );
  });

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id="coat-type"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-2xl border-2 bg-card px-3 shadow-sm transition-all sm:h-12 sm:px-4",
          open
            ? "border-primary/50 ring-2 ring-primary/20"
            : "border-border hover:border-primary/25",
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 sm:size-8 sm:rounded-xl">
            <Cat className="size-3.5 text-primary sm:size-4" />
          </span>
          <span className="truncate text-sm font-bold capitalize text-foreground">
            {formatCoatLabel(value)}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && !isDesktop && (
        <>
          <button
            type="button"
            aria-label="Close coat type menu"
            className="fixed inset-0 z-40 bg-foreground/25 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[min(72dvh,28rem)] flex-col rounded-t-[1.5rem] border border-b-0 border-border bg-card shadow-[0_-12px_40px_rgba(58,53,80,0.18)]">
            <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
              <p className="text-sm font-bold text-foreground">Pick coat type</p>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div
              id={listId}
              role="listbox"
              aria-label="Coat type"
              className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] scrollbar-none"
            >
              {optionButtons}
            </div>
          </div>
        </>
      )}

      {open && isDesktop && (
        <div
          id={listId}
          role="listbox"
          aria-label="Coat type"
          className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-50 max-h-52 space-y-0.5 overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-xl scrollbar-none"
        >
          {optionButtons}
        </div>
      )}
    </div>
  );
}
