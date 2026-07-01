"use client";

import { useEffect, useRef, useState } from "react";

import { AuthFooter } from "@/components/auth/auth-footer";
import { InteractivePawField } from "@/components/decorative/interactive-paw-field";
import { PwaInstallHost } from "@/components/pwa/pwa-install-host";

const CARD_WIDTH = 420;
const VIEWPORT_GUTTER = 40;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [layoutHeight, setLayoutHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    function measure() {
      const naturalHeight = card.offsetHeight;
      const maxH = window.innerHeight - VIEWPORT_GUTTER;
      const maxW = window.innerWidth - VIEWPORT_GUTTER;
      const nextScale = Math.min(1, maxH / naturalHeight, maxW / CARD_WIDTH);
      setScale(nextScale);
      setLayoutHeight(naturalHeight * nextScale);
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(card);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <>
      <div className="flex min-h-dvh w-full items-center justify-center bg-gradient-to-b from-[#ECE6F5] via-background to-secondary/20 px-4 py-3 sm:px-6 sm:py-4">
        <div
          className="relative shrink-0"
          style={{
            width: CARD_WIDTH * scale,
            height: layoutHeight,
          }}
        >
          <div
            ref={cardRef}
            className="origin-top-left"
            style={{
              width: CARD_WIDTH,
              transform: `scale(${scale})`,
            }}
          >
            <InteractivePawField
              trailMode="auto"
              className="flex w-full flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-background shadow-[0_20px_60px_rgba(45,42,62,0.12)] sm:rounded-[2.75rem]"
              contentClassName="flex flex-col"
            >
              {children}
              <AuthFooter />
            </InteractivePawField>
          </div>
        </div>
      </div>
      <PwaInstallHost />
    </>
  );
}
