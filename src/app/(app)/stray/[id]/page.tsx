import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";

import { getStrayCat, getStrayCatSightings } from "@/lib/stray-cats";

export default async function StrayCatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [stray, sightings] = await Promise.all([
    getStrayCat(id),
    getStrayCatSightings(id),
  ]);

  if (!stray) notFound();

  const name = stray.canonical_name?.trim() || "Mystery stray";
  const place =
    stray.place_label ||
    [stray.primary_lat?.toFixed(4), stray.primary_lng?.toFixed(4)]
      .filter(Boolean)
      .join(", ");

  return (
    <div className="flex flex-col gap-5 px-5 pb-nav pt-4">
      <header className="flex items-center gap-3">
        <Link
          href="/home"
          aria-label="Back"
          className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">{name}</h1>
          <p className="text-xs text-muted-foreground">
            {stray.sighting_count} sighting{stray.sighting_count === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      {stray.cover_sticker_url && (
        <div className="relative mx-auto aspect-square w-48 overflow-hidden rounded-3xl bg-muted">
          <Image
            src={stray.cover_sticker_url}
            alt=""
            fill
            className="object-contain p-2"
            unoptimized
          />
        </div>
      )}

      {place && (
        <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" />
          {place}
        </p>
      )}

      <Link
        href={`/map?stray=${stray.id}`}
        className="text-center text-sm font-bold text-primary"
      >
        View on map →
      </Link>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Who met this cat</h2>
        {sightings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No shared sightings yet. Catch and share to add to the album!
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sightings.map((s) => (
              <div
                key={s.id}
                className="w-28 shrink-0 overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="relative aspect-square bg-muted">
                  <Image
                    src={s.sticker_url}
                    alt=""
                    fill
                    className="object-contain p-1"
                    sizes="112px"
                    unoptimized
                  />
                </div>
                <div className="p-2">
                  <p className="truncate text-[10px] font-bold text-foreground">
                    @{s.username ?? "catcher"}
                  </p>
                  <p className="truncate text-[9px] text-muted-foreground">
                    {s.place_label || s.city || "Nearby"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
