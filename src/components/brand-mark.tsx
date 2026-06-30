import { APP_NAME, BRAND_ICON, BRAND_LOGO } from "@/lib/brand";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  /** `logo` = full wordmark; `icon` = mascot only */
  variant?: "logo" | "icon";
  className?: string;
  /** Icon variant size in px (ignored for logo). */
  size?: number;
  priority?: boolean;
  alt?: string;
};

/** Native img — brand SVGs embed large PNGs; bypass Next/Image attachment headers. */
export function BrandMark({
  variant = "icon",
  className,
  size = 80,
  priority,
  alt,
}: BrandMarkProps) {
  if (variant === "logo") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={BRAND_LOGO}
        alt={alt ?? APP_NAME}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        className={cn("h-auto w-[min(13rem,72vw)] object-contain", className)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_ICON}
      alt={alt ?? ""}
      width={size}
      height={size}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      className={cn("object-contain", className)}
      style={{ width: size, height: size }}
      aria-hidden={alt ? undefined : true}
    />
  );
}
