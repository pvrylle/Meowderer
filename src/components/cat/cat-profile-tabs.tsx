"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

import { updatePrivacy } from "@/app/(app)/cat/[id]/actions";
import { CatDetailDock, type CatDetailDockHandle } from "@/components/cat/cat-detail-dock";
import { SightingsAlbum } from "@/components/cat/sightings-album";
import { NamePollCard } from "@/components/name-poll-card";
import { catBio, charmRating, dexNumber } from "@/lib/cat-stats";
import { formatRelativeTime } from "@/lib/format-time";
import type { NamePollWithCounts } from "@/app/(app)/cat/[id]/poll-actions";
import type { StraySighting } from "@/lib/stray-cats";
import type { Capture } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type ProfileTab = "about" | "story" | "sightings" | "comments";

function StatCard({
  label,
  value,
  helper,
  className,
}: {
  label: string;
  value: string;
  helper?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-[5rem] rounded-2xl border border-border/50 bg-card p-4 shadow-sm",
        className,
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-extrabold leading-none text-foreground">{value}</p>
      {helper && <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{helper}</p>}
    </div>
  );
}

function PrivacyToggle({
  captureId,
  field,
  label,
  initialValue,
}: {
  captureId: string;
  field: "share_photo" | "share_location";
  label: string;
  initialValue: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [pending, startTransition] = useTransition();

  function handleChange(newValue: boolean) {
    const previousValue = value;
    setValue(newValue);

    startTransition(async () => {
      const result = await updatePrivacy({ captureId, field, value: newValue });
      if (result.success) {
        toast.success("Privacy updated");
      } else {
        setValue(previousValue);
        toast.error(result.error || "Could not update privacy");
      }
    });
  }

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={pending}
        onClick={() => handleChange(!value)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          value ? "bg-primary" : "bg-muted",
          pending && "opacity-60",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform",
            value ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
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
  onDockMenuRef,
}: {
  capture: Capture;
  album: StraySighting[];
  poll: NamePollWithCounts | null;
  isOwner: boolean;
  uploaderUsername: string | null;
  isSuperAdmin: boolean;
  nameLocked: boolean;
  onDockMenuRef?: (ref: CatDetailDockHandle | null) => void;
}) {
  const [tab, setTab] = useState<ProfileTab>("about");
  const dockRef = useRef<CatDetailDockHandle>(null);

  const totalSightings = album.length + 1;
  const charm = charmRating(capture);
  const firstSeen = useMemo(
    () =>
      new Date(capture.caught_at).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      }),
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
  const hasCoordinates = capture.lat != null && capture.lng != null;
  const mapHref = capture.stray_cat_id
    ? `/map?stray=${capture.stray_cat_id}`
    : `/map?cat=${capture.id}`;

  const tabs: { key: ProfileTab; label: string }[] = [
    { key: "about", label: "About" },
    { key: "story", label: "Story" },
    { key: "sightings", label: "Sightings" },
    { key: "comments", label: "Comments" },
  ];

  return (
    <div className="relative z-10 mx-2 mt-3 flex flex-col gap-3 pb-0">
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
          {hasCoordinates && (
          <Link
            href={mapHref}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border/50 bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/60"
          >
            <MapPin className="size-4" />
            Locate on map
          </Link>
        )}
        {isOwner && (
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              Privacy
            </p>
            <PrivacyToggle
              captureId={capture.id}
              field="share_photo"
              label="Share photo publicly"
              initialValue={capture.share_photo}
            />
            <PrivacyToggle
              captureId={capture.id}
              field="share_location"
              label="Show pin on public map"
              initialValue={capture.share_location}
            />
          </div>
        )}
      </div>

      <div
        className={cn(
          "rounded-[1.5rem] border border-border/50 bg-card p-4 shadow-sm",
          tab !== "story" && "hidden",
        )}
      >
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

      <div
        className={cn(
          "rounded-[1.5rem] border border-border/50 bg-card p-4 shadow-sm",
          tab !== "sightings" && "hidden",
        )}
      >
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
        <SightingsAlbum sightings={[capture, ...album]} size="sm" />
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
        ref={(el) => {
          (dockRef as React.MutableRefObject<CatDetailDockHandle | null>).current = el;
          onDockMenuRef?.(el);
        }}
        capture={capture}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
