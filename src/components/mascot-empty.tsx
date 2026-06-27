"use client";

import Image from "next/image";

type MascotEmptyProps = {
  title: string;
  description?: string;
  size?: number;
};

/** Branded empty state using the app mascot (public/icon.svg). */
export function MascotEmpty({
  title,
  description,
  size = 80,
}: MascotEmptyProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Image
        src="/icon.svg"
        alt=""
        width={size}
        height={size}
        className="opacity-90"
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
