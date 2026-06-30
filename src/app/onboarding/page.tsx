"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, LayoutGrid, PawPrint, Search, type LucideIcon } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { CatButton } from "@/components/ui/cat-button";
import { PagerDots } from "@/components/ui/pager-dots";
import { useOnboardingStore } from "@/stores/onboarding";
import { cn } from "@/lib/utils";

interface Slide {
  icon: LucideIcon;
  title: string;
  body: string;
  accent: string;
  tint: string;
}

const SLIDES: Slide[] = [
  {
    icon: Search,
    title: "Spot a stray",
    body: "Wander your city and find the community cats living around you.",
    accent: "text-green",
    tint: "bg-green/15",
  },
  {
    icon: Camera,
    title: "Snap & sticker",
    body: "Your photo becomes a collectible sticker, cut out right on your phone.",
    accent: "text-primary",
    tint: "bg-primary/15",
  },
  {
    icon: LayoutGrid,
    title: "Build your collection",
    body: "Collect across coats, cities, and countries. Gotta photograph 'em all.",
    accent: "text-orange",
    tint: "bg-orange/15",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { seen, setSeen } = useOnboardingStore();
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);

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
    if (isLast) finish();
    else setIndex((i) => i + 1);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 py-8 sm:px-7 sm:py-10">
      <div className="flex items-center justify-between">
        <BrandMark variant="logo" className="w-[6.5rem]" priority />
        <motion.button
          type="button"
          onClick={finish}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-full px-2 py-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Skip
        </motion.button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="relative">
              <motion.div
                className="pointer-events-none absolute -inset-6"
                animate={{ rotate: 360 }}
                transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
              >
                {[0, 72, 144, 216, 288].map((deg) => (
                  <div
                    key={deg}
                    className="absolute left-1/2 top-1/2 h-0 w-0"
                    style={{ transform: `rotate(${deg}deg)` }}
                  >
                    <PawPrint
                      className="absolute -top-14 left-1/2 size-4 -translate-x-1/2 text-primary/25"
                      strokeWidth={2.25}
                    />
                  </div>
                ))}
              </motion.div>
              <motion.div
                className={cn(
                  "relative flex size-32 items-center justify-center rounded-[40px]",
                  slide.tint,
                )}
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 320, damping: 20 }}
              >
                <Icon className={cn("size-14", slide.accent)} strokeWidth={2.25} />
              </motion.div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-extrabold text-foreground">
                {slide.title}
              </h2>
              <p className="mx-auto max-w-xs text-muted-foreground">
                {slide.body}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        className="flex flex-col gap-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        <PagerDots count={SLIDES.length} active={index} />
        <CatButton block onClick={next}>
          {isLast ? "Get started" : "Next"}
        </CatButton>
      </motion.div>
    </div>
  );
}
