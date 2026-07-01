"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { PHONE_OVERLAY_ROOT_ID } from "@/lib/phone-overlay";

export function usePhoneOverlayRoot(): HTMLElement | null {
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setRoot(document.getElementById(PHONE_OVERLAY_ROOT_ID));
  }, []);

  return root;
}

export function PhoneOverlayPortal({
  children,
}: {
  children: React.ReactNode;
}) {
  const root = usePhoneOverlayRoot();
  if (!root) return null;
  return createPortal(children, root);
}
