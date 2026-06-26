import { PawPrint } from "lucide-react";

import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-20 items-center justify-center rounded-[28px] bg-primary text-primary-foreground shadow-lg shadow-primary/30",
        className,
      )}
    >
      <PawPrint className="size-9" strokeWidth={2.5} />
    </div>
  );
}
