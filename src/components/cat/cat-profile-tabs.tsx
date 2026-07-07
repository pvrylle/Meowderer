"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";

import { CatDetailDock } from "@/components/cat/cat-detail-dock";
import { NamePollCard } from "@/components/name-poll-card";
import { catBio, charmRating, dexNumber } from "@/lib/cat-stats";
import { formatRelativeTime } from "@/lib/format-time";
import type { NamePollWithCounts } from "@/app/(app)/cat/[id]/poll-actions";
import type { StraySighting } from "@/lib/stray-cats";
import type { Capture } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type ProfileTab = "about" | "story" | "sightings" | "comments";

function StatCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="min-h-[5rem] rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-extrabold leading-none text-foreground">{value}</p>
      {helper && <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{helper}</p>}
    </div>
  );
}

export function CatProfileTabs({
  capture,
  album,
  poll,
  isOwner,
  uploaderUsername,
  isSuperAdmin,
  nameLocked,
}: {
  capture: Capture;
  album: StraySighting[];
  poll: NamePollWithCounts | null;
  isOwner: boolean;
  uploaderUsername: string | null;
  isSuperAdmin: boolean;
  nameLocked: boolean;
}) {
  const [tab, setTab] = useState<ProfileTab>("about");

  const totalSightings = album.length + 1;
  const charm = charmRating(capture);
  const firstSeen = useMemo(
    () => new Date(capture.caught_at).toLocaleDateString(undefined, { month: "short", year: "numeric" }),
    [capture.caught_at],
  );
  // Most recent sighting across this capture and the whole album (ISO strings
  // sort lexicographically, so a plain max is correct).
  const lastSeenTime = useMemo(
    () =>
      [capture.caught_at, ...album.map((s) => s.caught_at)].reduce(
        (latest, t) => (t > latest ? t : latest),
        capture.caught_at,
      ),
    [capture.caught_at, album],
  );
  const lastSeen = formatRelativeTime(lastSeenTime);
  const place = [capture.place_label, capture.city, capture.country].filter(Boolean).join(" - ");
  const tabs: { key: ProfileTab; label: string }[] = [
    { key: "about", label: "About" },
    { key: "story", label: "Story" },
    { key: "sightings", label: "Sightings" },
    { key: "comments", label: "Comments" },
  ];

  return (
    <div className="relative z-10 mx-2 mt-3 flex flex-col gap-3 pb-3">
      <div className="flex justify-center gap-4 overflow-x-auto border-b border-border/40 px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(({ key, label }) => {
          const active = tab === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "relative flex-shrink-0 pb-3 text-sm font-semibold transition-colors",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
              <span
                className={cn(
                  "absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground transition-transform",
                  active ? "scale-x-100" : "scale-x-0",
                )}
              />
            </button>
          );
        })}
      </div>

      <div className={cn("flex flex-col gap-3", tab !== "about" && "hidden")}>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Sightings" value={totalSightings.toLocaleString()} />
            <StatCard label="Charm" value={charm.toFixed(1)} helper="out of 5" />
            <StatCard label="First seen" value={firstSeen} />
            <StatCard label="Last seen" value={lastSeen} />
          </div>
          {place && (
            <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card px-4 py-3 shadow-sm">
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{place}</span>
            </div>
          )}
      </div>

      <div className={cn("rounded-[1.5rem] border border-border/50 bg-card p-4 shadow-sm", tab !== "story" && "hidden")}>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            Story
          </p>
          <p className="mt-2 text-lg font-extrabold text-foreground">
            {capture.nickname?.trim() || "This cat"}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{catBio(capture)}</p>
          {uploaderUsername && (
            <p className="mt-4 text-sm text-muted-foreground">
              Spotted by <span className="font-semibold text-foreground">@{uploaderUsername}</span>
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-muted/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
              {dexNumber(capture.id)}
            </span>
            <span className="rounded-full bg-muted/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
              {capture.rarity ?? "common"}
            </span>
          </div>
      </div>

      <div className={cn("rounded-[1.5rem] border border-border/50 bg-card p-4 shadow-sm", tab !== "sightings" && "hidden")}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                Sightings
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {totalSightings} shared sighting{totalSightings === 1 ? "" : "s"} around this cat.
              </p>
            </div>
            <span className="rounded-full bg-muted/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
              Album
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[capture, ...album].map((sighting) => (
              <div
                key={sighting.id}
                className="w-20 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-background/80 shadow-sm"
              >
                <div className="relative aspect-square bg-muted/50">
                  <Image
                    src={sighting.sticker_url}
                    alt=""
                    fill
                    className="object-contain p-1"
                    sizes="80px"
                    unoptimized
                  />
                </div>
              </div>
            ))}
          </div>
      </div>

      <div className={cn("space-y-3", tab !== "comments" && "hidden")}>
          <div className="rounded-[1.5rem] border border-border/50 bg-card p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              Comments
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Community discussion and naming are handled here.
            </p>
          </div>
          <NamePollCard capture={capture} poll={poll} isOwner={isOwner} />
      </div>

      <CatDetailDock
        capture={capture}
        isSuperAdmin={isSuperAdmin}
        nameLocked={nameLocked}
      />
    </div>
  );
}
