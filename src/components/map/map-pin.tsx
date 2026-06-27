import Image from "next/image";

import { pinFrameForRarity } from "@/lib/map-pins";
import type { Rarity } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export function MapPin({
  stickerUrl,
  rarity,
  count,
  size = "md",
  className,
}: {
  stickerUrl?: string;
  rarity?: Rarity | null;
  count?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim = size === "sm" ? 44 : size === "lg" ? 72 : 56;

  return (
    <div
      className={cn("relative select-none", className)}
      style={{ width: dim, height: dim }}
    >
      <Image
        src={pinFrameForRarity(rarity ?? null)}
        alt=""
        width={dim}
        height={dim}
        className="drop-shadow-md"
        aria-hidden
      />
      {count != null ? (
        <span
          className="absolute inset-0 flex items-center justify-center pb-2 text-sm font-extrabold text-foreground"
          style={{ paddingBottom: dim * 0.18 }}
        >
          {count}
        </span>
      ) : stickerUrl ? (
        <div
          className="absolute left-1/2 overflow-hidden rounded-full bg-white/90"
          style={{
            top: dim * 0.14,
            width: dim * 0.48,
            height: dim * 0.48,
            transform: "translateX(-50%)",
          }}
        >
          <Image
            src={stickerUrl}
            alt=""
            width={Math.round(dim * 0.48)}
            height={Math.round(dim * 0.48)}
            className="h-full w-full object-contain p-0.5"
            unoptimized={stickerUrl.startsWith("blob:")}
          />
        </div>
      ) : null}
    </div>
  );
}
