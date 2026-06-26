import { cn } from "@/lib/utils";

function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 32" className={className} aria-hidden>
      <g fill="#ffffff">
        <ellipse cx="20" cy="20" rx="16" ry="11" />
        <ellipse cx="36" cy="16" rx="18" ry="13" />
        <ellipse cx="50" cy="21" rx="13" ry="9" />
        <rect x="14" y="20" width="42" height="10" rx="5" />
      </g>
    </svg>
  );
}

/**
 * Illustrated trading-card backdrop: pastel sky, soft clouds and rolling green
 * hills. Pure SVG/CSS so it scales crisply and ships no extra assets.
 */
export function CardScene({
  children,
  className,
  sparkle = false,
}: {
  children?: React.ReactNode;
  className?: string;
  sparkle?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#BFE3FB] via-[#D8EEFB] to-[#EAF7EE]" />

      {/* sun glow */}
      <div className="absolute -right-5 -top-5 size-20 rounded-full bg-white/60 blur-2xl" />

      <Cloud className="absolute left-[6%] top-[10%] w-[34%] opacity-95 drop-shadow-sm" />
      <Cloud className="absolute right-[8%] top-[26%] w-[26%] opacity-85" />

      {/* rolling hills */}
      <svg
        viewBox="0 0 200 90"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[46%] w-full"
        aria-hidden
      >
        <path d="M0 42 Q52 8 104 36 T200 30 V90 H0 Z" fill="#A6E4B8" />
        <path d="M0 58 Q60 30 124 54 T200 50 V90 H0 Z" fill="#8FD6A6" />
        <ellipse cx="150" cy="78" rx="60" ry="20" fill="#7FCB97" opacity="0.6" />
      </svg>

      {sparkle && (
        <>
          <span className="absolute left-[14%] top-[16%] text-base opacity-80">
            ✦
          </span>
          <span className="absolute right-[16%] top-[40%] text-xs opacity-70">
            ✧
          </span>
          <span className="absolute left-[22%] bottom-[30%] text-sm opacity-70">
            ✦
          </span>
        </>
      )}

      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}
