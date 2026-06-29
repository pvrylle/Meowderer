import { BRAND_ICON } from "@/lib/brand";

type MascotEmptyProps = {
  title: string;
  description?: string;
  size?: number;
};

export function MascotEmpty({
  title,
  description,
  size = 64,
}: MascotEmptyProps) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_ICON}
        alt=""
        width={size}
        height={size}
        className="opacity-80"
        style={{ width: size, height: size }}
      />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
