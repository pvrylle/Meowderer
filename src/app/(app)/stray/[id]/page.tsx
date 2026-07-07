import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Camera, Lock, MapPin } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getStrayCat, getStrayCatSightings } from "@/lib/stray-cats";
import { CatButton } from "@/components/ui/cat-button";
import { SightingsAlbum } from "@/components/cat/sightings-album";

export default async function StrayCatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [stray, sightings, user] = await Promise.all([
    getStrayCat(id),
    getStrayCatSightings(id),
    getCurrentUser(),
  ]);

  if (!stray) notFound();

  // Check if this user has already caught this stray
  let alreadyCaught = false;
  if (user) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("captures")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("stray_cat_id", stray.id);
    alreadyCaught = (count ?? 0) > 0;
  }

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
            className={alreadyCaught ? "object-contain p-2" : "scale-105 object-contain p-2 blur-md"}
            unoptimized
          />
          {!alreadyCaught && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <Lock className="size-8 text-foreground/70" />
              <span className="text-xs font-bold text-foreground/70">Locked</span>
            </div>
          )}
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

      {/* Unlock CTA — shown when the current user hasn't caught this stray yet */}
      {!alreadyCaught && (
        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-sm font-semibold text-foreground">
            Find this cat and catch it to unlock
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Head to the map to see where it was last spotted, then take a photo nearby.
            The app will recognise it and add it to your CatDex.
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <Link href={`/map?stray=${stray.id}`}>
              <CatButton variant="outline" size="sm">
                <MapPin className="size-4" />
                Find on map
              </CatButton>
            </Link>
            <Link href={`/catch?stray=${stray.id}`}>
              <CatButton size="sm">
                <Camera className="size-4" />
                Catch a cat
              </CatButton>
            </Link>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Who met this cat</h2>
        <SightingsAlbum
          sightings={sightings}
          size="md"
          showLabels
          emptyLabel="No shared sightings yet. Catch and share to add to the album!"
        />
      </section>
    </div>
  );
}
