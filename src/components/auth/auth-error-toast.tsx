"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function AuthErrorToast({ error }: { error?: string }) {
  useEffect(() => {
    if (error === "confirm_failed") {
      toast.error("Email confirmation failed. Try signing in or request a new link.");
    }
  }, [error]);

  return null;
}
