import { cn } from "@/lib/utils";

/**
 * Locks the app to a mobile-width canvas. On desktop it is centered inside a
 * phone bezel on a soft background (PRD section 7). On phones it fills the screen.
 */
export function PhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-[#ECE6F5] sm:p-6">
      <div
        className={cn(
          "relative flex h-dvh w-full flex-col overflow-hidden bg-background",
          "sm:h-[860px] sm:max-h-[92dvh] sm:w-[420px] sm:rounded-[2.75rem] sm:border-[10px] sm:border-[#2E2A3F] sm:shadow-2xl",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
