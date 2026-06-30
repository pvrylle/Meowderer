"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, X } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { CatButton } from "@/components/ui/cat-button";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { APP_NAME } from "@/lib/brand";
import { usePwaInstallStore } from "@/stores/pwa-install";

export function PwaInstallPrompt({
  open,
  onClose,
}: {
  open: boolean;
  onClose?: () => void;
}) {
  const { canPrompt, canInstall, isIos, install } = usePwaInstall();
  const dismissed = usePwaInstallStore((s) => s.dismissed);
  const dismiss = usePwaInstallStore((s) => s.dismiss);
  const [installing, setInstalling] = useState(false);

  const visible = open && canPrompt && !dismissed;

  useEffect(() => {
    if (open && !canPrompt) onClose?.();
  }, [open, canPrompt, onClose]);

  useEffect(() => {
    if (!visible) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  function handleDismiss() {
    dismiss();
    onClose?.();
  }

  async function handleInstall() {
    if (!canInstall) return;
    setInstalling(true);
    try {
      const accepted = await install();
      if (accepted) onClose?.();
    } finally {
      setInstalling(false);
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.button
            type="button"
            aria-label="Dismiss install prompt"
            className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
          />
          <motion.div
            role="dialog"
            aria-labelledby="pwa-install-title"
            aria-describedby="pwa-install-desc"
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[420px] rounded-t-[1.75rem] border border-b-0 border-border bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-16px_48px_rgba(45,42,62,0.18)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <BrandMark variant="icon" size={48} alt="" />
                <div>
                  <h2
                    id="pwa-install-title"
                    className="text-base font-extrabold text-foreground"
                  >
                    Install {APP_NAME}
                  </h2>
                  <p
                    id="pwa-install-desc"
                    className="text-xs text-muted-foreground"
                  >
                    Add to your home screen for the full app experience.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {isIos ? (
              <ol className="mb-4 space-y-2 rounded-2xl bg-muted/50 px-4 py-3 text-sm text-foreground">
                <li className="flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                    <Share className="size-3.5" strokeWidth={2.25} />
                  </span>
                  Tap <strong className="font-bold">Share</strong> in Safari
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                    <Download className="size-3.5" strokeWidth={2.25} />
                  </span>
                  Choose <strong className="font-bold">Add to Home Screen</strong>
                </li>
              </ol>
            ) : (
              <p className="mb-4 text-sm text-muted-foreground">
                Install for faster launches, offline catch syncing, and a
                full-screen cat-catching experience.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {canInstall && (
                <CatButton block loading={installing} onClick={handleInstall}>
                  Install app
                </CatButton>
              )}
              <CatButton variant="ghost" block onClick={handleDismiss}>
                {isIos && !canInstall ? "Got it" : "Not now"}
              </CatButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
