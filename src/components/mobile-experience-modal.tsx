"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, MapPin, Smartphone, X } from "lucide-react";

import { CatButton } from "@/components/ui/cat-button";
import { APP_NAME, BRAND_ICON_PNG } from "@/lib/brand";
import { useMobileExperienceHintStore } from "@/stores/mobile-experience-hint";

export function MobileExperienceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose?: () => void;
}) {
  const dismissed = useMobileExperienceHintStore((s) => s.dismissed);
  const dismiss = useMobileExperienceHintStore((s) => s.dismiss);
  const visible = open && !dismissed;

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

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.button
            type="button"
            aria-label="Dismiss"
            className="fixed inset-0 z-[60] bg-foreground/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
          />
          <motion.div
            role="dialog"
            aria-labelledby="mobile-experience-title"
            aria-describedby="mobile-experience-desc"
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-h-[min(90dvh,34rem)] w-full max-w-md overflow-y-auto rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_24px_64px_rgba(45,42,62,0.22)] sm:p-6"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <Smartphone className="size-6" strokeWidth={2.25} />
                </span>
                <div>
                  <h2
                    id="mobile-experience-title"
                    className="text-base font-extrabold text-foreground"
                  >
                    Best on your phone
                  </h2>
                  <p
                    id="mobile-experience-desc"
                    className="text-xs text-muted-foreground"
                  >
                    {APP_NAME} is built for mobile cat catching.
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

            <div className="mb-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BRAND_ICON_PNG}
                alt=""
                width={72}
                height={72}
                className="size-[4.5rem] object-contain"
              />
            </div>

            <ul className="mb-5 space-y-2.5 rounded-2xl bg-muted/45 px-4 py-3 text-sm text-foreground">
              <li className="flex items-start gap-2.5">
                <Camera className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  Use your phone camera to snap cats and build stickers on the
                  spot.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  GPS pinning and the map work best when you are out wandering.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Smartphone className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  Add {APP_NAME} to your home screen for the full app
                  experience.
                </span>
              </li>
            </ul>

            <div className="flex flex-col gap-2">
              <CatButton block onClick={handleDismiss}>
                Continue on desktop
              </CatButton>
              <p className="text-center text-[11px] text-muted-foreground">
                Open this site on your phone to catch your first cat.
              </p>
            </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
