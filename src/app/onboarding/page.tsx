"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, LayoutGrid, Search, type LucideIcon } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";
import { CatButton } from "@/components/ui/cat-button";
import { PagerDots } from "@/components/ui/pager-dots";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { useOnboardingStore } from "@/stores/onboarding";
import { usePwaInstallStore } from "@/stores/pwa-install";
import { cn } from "@/lib/utils";

interface Slide {
  icon: LucideIcon;
  title: string;
  body: string;
  accent: string;
  tint: string;
  glow: string;
}

const SLIDES: Slide[] = [
  {
    icon: Search,
    title: "Spot a stray",
    body: "Wander your city and find the community cats living around you.",
    accent: "text-green",
    tint: "bg-green/12",
    glow: "from-green/25",
  },
  {
    icon: Camera,
    title: "Snap & sticker",
    body: "Your photo becomes a collectible sticker, cut out right on your phone.",
    accent: "text-primary",
    tint: "bg-primary/12",
    glow: "from-primary/25",
  },
  {
    icon: LayoutGrid,
    title: "Build your collection",
    body: "Collect across coats, cities, and countries. Gotta photograph 'em all.",
    accent: "text-orange",
    tint: "bg-orange/12",
    glow: "from-orange/25",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { seen, setSeen } = useOnboardingStore();
  const installDismissed = usePwaInstallStore((s) => s.dismissed);
  const { canPrompt, ready: pwaReady } = usePwaInstall();
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    // Wait for the persisted onboarding store to hydrate before deciding to
    // show slides vs. redirect (avoids an SSR/CSR flash).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && seen) router.replace("/auth?mode=signup");
  }, [mounted, seen, router]);

  if (!mounted || seen) return null;

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const Icon = slide.icon;

  function finish() {
    setSeen(true);
    router.replace("/auth?mode=signup");
  }

  function next() {
    if (isLast) {
      if (pwaReady && canPrompt && !installDismissed) {
        setShowInstall(true);
      } else {
        finish();
      }
      return;
    }
    setIndex((i) => i + 1);
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col px-5 py-8 sm:px-7 sm:py-10">
        <div className="flex items-center justify-between">
          <BrandMark variant="logo" className="w-[6.5rem]" priority />
          <button
            type="button"
            onClick={finish}
            className="rounded-full px-2 py-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative flex size-36 items-center justify-center">
                <div
                  className={cn(
                    "absolute inset-0 rounded-[2.5rem] bg-gradient-to-b opacity-80 blur-2xl",
                    slide.glow,
                    "to-transparent",
                  )}
                  aria-hidden
                />
                <div
                  className={cn(
                    "relative flex size-28 items-center justify-center rounded-[2rem] border border-border/50 shadow-[0_12px_40px_rgba(45,42,62,0.08)]",
                    slide.tint,
                  )}
                >
                  <Icon className={cn("size-12", slide.accent)} strokeWidth={2.25} />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70">
                  Step {index + 1} of {SLIDES.length}
                </p>
                <h2 className="text-[1.65rem] font-extrabold leading-tight text-foreground">
                  {slide.title}
                </h2>
                <p className="mx-auto max-w-[17rem] text-[15px] leading-relaxed text-muted-foreground">
                  {slide.body}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          className="flex flex-col gap-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35 }}
        >
          <PagerDots count={SLIDES.length} active={index} />
          <CatButton block onClick={next}>
            {isLast ? "Get started" : "Next"}
          </CatButton>
        </motion.div>
      </div>

      <PwaInstallPrompt open={showInstall} onClose={finish} />
    </>
  );
}
