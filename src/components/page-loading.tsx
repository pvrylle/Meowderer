import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

type PageLoadingProps = {
  message?: string;
  className?: string;
};

export function PageLoading({ message, className }: PageLoadingProps) {
  return (
    <div className={cn("flex flex-1 flex-col items-center justify-center gap-4 p-8", className)}>
      <div className="relative">
        <div className="absolute -inset-3 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <BrandMark variant="icon" size={48} />
      </div>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

export function PageLoadingSimple({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-1 items-center justify-center p-8", className)}>
      <div className="size-6 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
    </div>
  );
}
