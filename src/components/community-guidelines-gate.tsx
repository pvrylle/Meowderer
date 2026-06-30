"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";

import { acceptCommunityGuidelinesAction } from "@/app/(app)/community/safety-actions";
import { COMMUNITY_GUIDELINES } from "@/content/community-guidelines";
import { CatButton } from "@/components/ui/cat-button";

export function CommunityGuidelinesGate({ show }: { show: boolean }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [accepting, startAccepting] = useTransition();

  if (!show || dismissed) return null;

  function handleAccept() {
    startAccepting(async () => {
      const result = await acceptCommunityGuidelinesAction();
      if (!result.success) {
        toast.error(result.error ?? "Could not save.");
        return;
      }
      setDismissed(true);
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-labelledby="community-guidelines-title"
        className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/15">
            <Shield className="size-6 text-primary" />
          </div>
          <div>
            <h2 id="community-guidelines-title" className="text-lg font-extrabold text-foreground">
              Community Guidelines
            </h2>
            <p className="text-xs text-muted-foreground">Required before posting or chatting</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {COMMUNITY_GUIDELINES.map((rule) => (
            <li key={rule} className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
        <CatButton block className="mt-6" loading={accepting} onClick={handleAccept}>
          I understand — let me in
        </CatButton>
      </div>
    </div>
  );
}
