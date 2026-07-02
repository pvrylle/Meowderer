"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { acceptTermsAction } from "@/app/auth/actions";
import { CatButton } from "@/components/ui/cat-button";
import { PhoneOverlayPortal } from "@/components/phone-overlay-portal";

export function TermsConsentModal({ show }: { show: boolean }) {
  const router = useRouter();
  const [accepting, startAccepting] = useTransition();
  const [dismissed, setDismissed] = useState(false);

  if (!show || dismissed) return null;

  function handleAccept() {
    startAccepting(async () => {
      const result = await acceptTermsAction();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setDismissed(true);
      router.refresh();
    });
  }

  return (
    <PhoneOverlayPortal>
      <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
        <div
          role="dialog"
          aria-labelledby="terms-consent-title"
          className="w-full rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border"
        >
        <h2 id="terms-consent-title" className="text-lg font-extrabold text-foreground">
          Terms & Privacy
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Before continuing, please review and accept our{" "}
          <Link href="/legal/terms" className="font-semibold text-primary underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="font-semibold text-primary underline">
            Privacy Policy
          </Link>
          .
        </p>
        <CatButton block className="mt-6" loading={accepting} onClick={handleAccept}>
          I agree
        </CatButton>
        </div>
      </div>
    </PhoneOverlayPortal>
  );
}
