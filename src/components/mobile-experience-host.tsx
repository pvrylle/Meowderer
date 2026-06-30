"use client";

import { useEffect, useState } from "react";

import { MobileExperienceModal } from "@/components/mobile-experience-modal";
import { useIsMobileDevice } from "@/hooks/use-is-mobile";
import { useMobileExperienceHintStore } from "@/stores/mobile-experience-hint";

/** Desktop/tablet visitors — suggest using a phone for the best experience. */
export function MobileExperienceHost() {
  const isMobile = useIsMobileDevice();
  const dismissed = useMobileExperienceHintStore((s) => s.dismissed);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || isMobile || dismissed) return;
    const timer = window.setTimeout(() => setOpen(true), 1600);
    return () => window.clearTimeout(timer);
  }, [hydrated, isMobile, dismissed]);

  return <MobileExperienceModal open={open} onClose={() => setOpen(false)} />;
}
