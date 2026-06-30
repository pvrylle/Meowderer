"use client";

import { useEffect, useState } from "react";

import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { usePwaInstallStore } from "@/stores/pwa-install";

/**
 * Shows the install sheet once on mobile after the user enters the app,
 * if they have not dismissed it or already installed.
 */
export function PwaInstallHost() {
  const { canPrompt, ready } = usePwaInstall();
  const dismissed = usePwaInstallStore((s) => s.dismissed);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready || !canPrompt || dismissed) return;
    const timer = window.setTimeout(() => setOpen(true), 2800);
    return () => window.clearTimeout(timer);
  }, [ready, canPrompt, dismissed]);

  return (
    <PwaInstallPrompt open={open} onClose={() => setOpen(false)} />
  );
}
