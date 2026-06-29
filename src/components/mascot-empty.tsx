"use client";

import { BRAND_ICON } from "@/lib/brand";

type MascotEmptyProps = {
  title: string;
  description?: string;
  size?: number;
};

/** Branded empty state using the app mascot. */
export function MascotEmpty({
  title,
  description,
  size = 80,
}: MascotEmptyProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_ICON}
        alt=""
        width={size}
        height={size}
        decoding="async"
        className="object-contain opacity-95"
        style={{ width: size, height: size }}
        aria-hidden
      />
      <div>
        <p className="font-bold text-foreground">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
