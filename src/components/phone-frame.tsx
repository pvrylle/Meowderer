import { cn } from "@/lib/utils";
import {
  PHONE_OVERLAY_ROOT_CLASS,
  PHONE_OVERLAY_ROOT_ID,
} from "@/lib/phone-overlay";

/**
 * Mobile-first app shell. Phones: full-screen. Desktop: proportional phone mockup
 * that scales down to fit the viewport at 100% zoom (like a design preview).
 *
 * Overlay portal root lives here so every route gets a stable DOM target without
 * depending on client-only siblings (avoids hydration ordering bugs).
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
      <div className={cn("phone-shell__device", className)}>
        {children}
        <div id={PHONE_OVERLAY_ROOT_ID} className={PHONE_OVERLAY_ROOT_CLASS} />
      </div>
    </div>
  );
}
