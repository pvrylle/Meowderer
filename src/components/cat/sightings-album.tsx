import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * A single entry in a shared sightings album. Shaped to accept both a
 * `Capture` (the cat's own detail card) and a `StraySighting` (album rows),
 * so the same strip renders across the cat profile, stray page, and the
 * "Same cat?" match dialog.
 */
export type AlbumSighting = {
  id: string;
  sticker_url: string;
  username?: string | null;
  place_label?: string | null;
  city?: string | null;
};

/**
 * Horizontal, swipeable strip of sighting stickers shared by:
 *  - the cat profile "Sightings" tab (size "sm", sticker-only)
 *  - the stray detail "Who met this cat" section (size "md" + labels)
 *  - the capture "Same cat?" match dialog (size "md" + labels)
 *
 * No "use client" — it renders in both Server and Client Components.
 */
export function SightingsAlbum({
  sightings,
  size = "sm",
  showLabels = false,
  emptyLabel,
  className,
}: {
  sightings: AlbumSighting[];
  size?: "sm" | "md";
  showLabels?: boolean;
  emptyLabel?: string;
  className?: string;
}) {
  if (sightings.length === 0) {
    if (!emptyLabel) return null;
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const cardWidth = size === "md" ? "w-28" : "w-20";
  const imageSizes = size === "md" ? "112px" : "80px";

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {sightings.map((sighting) => (
        <div
          key={sighting.id}
          className={cn(
            "shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm",
            cardWidth,
          )}
        >
          <div className="relative aspect-square bg-muted/50">
            <Image
              src={sighting.sticker_url}
              alt=""
              fill
              className="object-contain p-1"
              sizes={imageSizes}
              unoptimized
            />
          </div>
          {showLabels && (
            <div className="p-2">
              <p className="truncate text-[10px] font-bold text-foreground">
                @{sighting.username ?? "catcher"}
              </p>
              <p className="truncate text-[9px] text-muted-foreground">
                {sighting.place_label || sighting.city || "Nearby"}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
