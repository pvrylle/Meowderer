"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { pendingCaptureCount } from "@/lib/offline-capture-queue";
import { drainPendingCaptures, type DrainResult } from "@/lib/offline-sync";

export function useOfflineSync() {
  const router = useRouter();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const syncingRef = useRef(false);

  const refreshPending = useCallback(async () => {
    setPending(await pendingCaptureCount());
  }, []);

  const syncNow = useCallback(async (): Promise<DrainResult> => {
    if (syncingRef.current) {
      return { synced: 0, failed: 0, errors: ["Sync already in progress."] };
    }

    syncingRef.current = true;
    setSyncing(true);
    setLastError(null);

    const result = await drainPendingCaptures();
    await refreshPending();

    syncingRef.current = false;
    setSyncing(false);

    if (result.errors.length > 0 && result.synced === 0) {
      setLastError(result.errors[0] ?? null);
    }
    if (result.synced > 0) {
      router.refresh();
    }

    return result;
  }, [refreshPending, router]);

  useEffect(() => {
    void refreshPending();

    const onOnline = () => {
      void syncNow();
    };

    window.addEventListener("online", onOnline);
    if (navigator.onLine) {
      void syncNow();
    }

    return () => window.removeEventListener("online", onOnline);
  }, [refreshPending, syncNow]);

  return { pending, syncing, lastError, syncNow, refreshPending };
}
