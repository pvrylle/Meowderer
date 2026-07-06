"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { useState } from "react";

import { buildStaticMapUrl } from "@/lib/static-map";

export function InlineMapPreview({
  lat,
  lng,
  name,
  mapHref,
}: {
  lat: number;
  lng: number;
  name: string;
  mapHref: string;
}) {
  const [failed, setFailed] = useState(false);
  const mapUrl = buildStaticMapUrl(lat, lng);
  const altText = `Map showing where ${name || "this cat"} was spotted`;

  if (failed) {
    return (
      <Link
        href={mapHref}
        className="flex h-[120px] w-full items-center justify-center overflow-hidden rounded-2xl bg-muted"
      >
        <MapPin className="size-6 text-muted-foreground" />
      </Link>
    );
  }

  return (
    <Link href={mapHref} className="block overflow-hidden rounded-2xl">
      <div className="h-[120px] w-full overflow-hidden rounded-2xl bg-muted">
        <Image
          src={mapUrl}
          alt={altText}
          width={512}
          height={120}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
          unoptimized
        />
      </div>
    </Link>
  );
}
