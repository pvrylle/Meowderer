import { cn } from "@/lib/utils";

export function PagerDots({
  count,
  active,
  className,
}: {
  count: number;
  active: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            i === active ? "w-6 bg-primary" : "w-2 bg-primary/25",
          )}
        />
      ))}
    </div>
  );
}
