import type { Biome } from "@/lib/cat-stats";
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

function Stars() {
  const dots = [
    [12, 18],
    [28, 10],
    [44, 22],
    [62, 14],
    [78, 26],
    [88, 12],
    [20, 34],
    [70, 40],
  ];
  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 0.9 : 0.6} fill="#fff" />
      ))}
    </svg>
  );
}

function MeadowScene() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-[#BFE3FB] via-[#D8EEFB] to-[#EAF7EE]" />
      <div className="absolute -right-5 -top-5 size-20 rounded-full bg-white/60 blur-2xl" />
      <Cloud className="absolute left-[6%] top-[10%] w-[34%] opacity-95 drop-shadow-sm" />
      <Cloud className="absolute right-[8%] top-[26%] w-[26%] opacity-85" />
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
    </>
  );
}

function CityScene() {
  const buildings = [
    [4, 38, 20],
    [26, 30, 16],
    [44, 46, 18],
    [64, 26, 14],
    [80, 40, 18],
  ];
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-[#A9C2EE] via-[#C9CCF1] to-[#EADDF3]" />
      <div className="absolute right-[12%] top-[12%] size-12 rounded-full bg-[#FBE6B0]/80 blur-[2px]" />
      <Cloud className="absolute left-[8%] top-[14%] w-[24%] opacity-70" />
      <svg
        viewBox="0 0 100 64"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[56%] w-full"
        aria-hidden
      >
        {buildings.map(([x, h, w], i) => (
          <g key={i}>
            <rect
              x={x}
              y={64 - h}
              width={w}
              height={h}
              rx={1.5}
              fill={i % 2 === 0 ? "#8C9BD6" : "#9D8FD0"}
            />
          </g>
        ))}
        <rect x="0" y="60" width="100" height="4" fill="#7C72B4" />
      </svg>
      {/* lit windows */}
      <div className="absolute inset-x-0 bottom-0 h-[56%]">
        <div className="absolute left-[7%] bottom-[14%] grid grid-cols-2 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="size-1 rounded-[1px] bg-[#FBE6B0]/90" />
          ))}
        </div>
        <div className="absolute left-[46%] bottom-[18%] grid grid-cols-2 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="size-1 rounded-[1px] bg-[#FBE6B0]/90" />
          ))}
        </div>
      </div>
    </>
  );
}

function BeachScene() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-[#BFE9FB] via-[#DFF3F6] to-[#FBEFCF]" />
      <div className="absolute right-[14%] top-[10%] size-12 rounded-full bg-[#FCD66B]" />
      <Cloud className="absolute left-[8%] top-[12%] w-[24%] opacity-85" />
      <svg
        viewBox="0 0 200 90"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[52%] w-full"
        aria-hidden
      >
        <path d="M0 28 H200 V58 H0 Z" fill="#7FC9E8" />
        <path
          d="M0 30 Q25 24 50 30 T100 30 T150 30 T200 30 V40 H0 Z"
          fill="#A6DCF0"
        />
        <path d="M0 52 Q60 40 120 52 T200 48 V90 H0 Z" fill="#F4E2B0" />
        <ellipse cx="150" cy="80" rx="70" ry="18" fill="#EAD194" opacity="0.7" />
      </svg>
    </>
  );
}

function NightScene() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-[#2C2658] via-[#4A3F7E] to-[#6E5C9E]" />
      <div className="absolute right-[14%] top-[12%] size-10 rounded-full bg-[#F4EEC9] shadow-[0_0_18px_rgba(244,238,201,0.7)]" />
      <Stars />
      <svg
        viewBox="0 0 200 90"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[44%] w-full"
        aria-hidden
      >
        <path d="M0 46 Q52 14 104 40 T200 34 V90 H0 Z" fill="#3B3568" />
        <path d="M0 60 Q60 34 124 56 T200 52 V90 H0 Z" fill="#2E2A50" />
      </svg>
    </>
  );
}

function SnowScene() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-[#D6E6F2] via-[#E8F1F8] to-[#F6FAFD]" />
      <div className="absolute -right-4 -top-4 size-16 rounded-full bg-white/70 blur-2xl" />
      <Cloud className="absolute left-[8%] top-[12%] w-[26%] opacity-90" />
      <svg
        viewBox="0 0 200 90"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[48%] w-full"
        aria-hidden
      >
        <path d="M0 44 Q52 16 104 40 T200 34 V90 H0 Z" fill="#EAF2FA" />
        <path d="M0 60 Q60 38 124 58 T200 54 V90 H0 Z" fill="#FBFDFF" />
        <g fill="#BFD6C9">
          <path d="M40 60 l8 -22 l8 22 z" />
          <path d="M44 52 l4 -14 l4 14 z" fill="#A9C8B8" />
          <path d="M150 62 l9 -26 l9 26 z" />
        </g>
      </svg>
      {/* falling snow */}
      <div className="absolute inset-0">
        {[
          [16, 20],
          [40, 36],
          [66, 14],
          [82, 44],
          [28, 58],
          [72, 64],
        ].map(([x, y], i) => (
          <span
            key={i}
            className="absolute size-1 rounded-full bg-white/90"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        ))}
      </div>
    </>
  );
}

const SCENES: Record<Biome, () => React.ReactElement> = {
  meadow: MeadowScene,
  city: CityScene,
  beach: BeachScene,
  night: NightScene,
  snow: SnowScene,
};

/**
 * Illustrated trading-card backdrop that varies by habitat (biome). Pure
 * SVG/CSS so it scales crisply and ships no extra assets.
 */
export function CardScene({
  children,
  className,
  biome = "meadow",
  sparkle = false,
}: {
  children?: React.ReactNode;
  className?: string;
  biome?: Biome;
  sparkle?: boolean;
}) {
  const Scene = SCENES[biome];
  return (
    <div className={cn("relative overflow-hidden [transform:translateZ(0)]", className)}>
      <Scene />

      {sparkle && (
        <>
          <span className="absolute left-[14%] top-[16%] text-base text-white opacity-80">
            ✦
          </span>
          <span className="absolute right-[16%] top-[40%] text-xs text-white opacity-70">
            ✧
          </span>
          <span className="absolute bottom-[30%] left-[22%] text-sm text-white opacity-70">
            ✦
          </span>
        </>
      )}

      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}
