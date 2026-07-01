import { cn } from "@/lib/utils";

/**
 * Mobile-first app shell. Phones: full-screen. Desktop: proportional phone mockup
 * that scales down to fit the viewport at 100% zoom (like a design preview).
 */
export function PhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="phone-shell">
      <div className={cn("phone-shell__device", className)}>{children}</div>
    </div>
  );
}
