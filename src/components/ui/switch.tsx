import { cn } from "@/lib/utils";

export function Switch({
  checked,
  tone = "primary",
  className,
}: {
  checked: boolean;
  tone?: "primary" | "destructive";
  className?: string;
}) {
  return (
    <span
      role="presentation"
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 overflow-hidden rounded-full transition-colors",
        checked
          ? tone === "destructive"
            ? "bg-destructive"
            : "bg-primary"
          : "bg-muted-foreground/30",
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[left] duration-200 ease-out",
          checked ? "left-[1.375rem]" : "left-0.5",
        )}
      />
    </span>
  );
}
