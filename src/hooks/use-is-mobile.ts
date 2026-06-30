"use client";

import { useEffect, useState } from "react";

export function useIsMobileDevice(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const sync = () => {
      setMobile(
        query.matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
      );
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return mobile;
}
