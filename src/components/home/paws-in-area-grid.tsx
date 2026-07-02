"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Lock, MapPin } from "lucide-react";

import type { NearbyStrayCat } from "@/lib/nearby-stray-cats";
import { cn } from "@/lib/utils";

function StrayCard({
  stray,
  locked,
}: {
  stray: NearbyStrayCat;
  locked: boolean;
}) {
  const name = stray.canonical_name?.trim() || "Mystery stray";
  const profileHref = stray.user_capture_id
    ? `/cat/${stray.user_capture_id}`
    : `/stray/${stray.id}`;

  const inner = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card p-2.5 shadow-sm transition-transform",
        locked ? "border-border/60 opacity-90" : "border-border active:scale-[0.98]",
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        {stray.cover_sticker_url ? (
          <Image
            src={stray.cover_sticker_url}
            alt=""
            fill
            className={cn("object-contain p-1", locked && "blur-sm scale-105")}
            sizes="160px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">🐱</div>
        )}
        {locked ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/30">
            <Lock className="size-8 text-muted-foreground" />
          </span>
        ) : (
          <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-green/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
            <CheckCircle2 className="size-3" />
            Found
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-sm font-bold text-foreground">{name}</p>
      <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <MapPin className="size-3 shrink-0" />
        {stray.sighting_count} sighting{stray.sighting_count === 1 ? "" : "s"}
      </p>
    </div>
  );

  if (locked) {
    return (
      <Link href={`/map?layer=cats&stray=${stray.id}`} className="text-left">
        {inner}
      </Link>
    );
  }

  return <Link href={profileHref}>{inner}</Link>;
}

export function PawsInAreaGrid({
  strays,
  totalInArea,
}: {
  strays: NearbyStrayCat[];
  totalInArea?: number;
}) {
  if (strays.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
        No popular cats spotted nearby yet. Be the first to catch one!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {totalInArea != null && totalInArea > strays.length && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {strays.length} of {totalInArea} nearby — your catches appear first; tap
          header for map
        </p>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        {strays.map((stray) => (
          <StrayCard key={stray.id} stray={stray} locked={!stray.discovered} />
        ))}
      </div>
    </div>
  );
}
