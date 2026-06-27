"use client";

import { useOfflineSync } from "@/hooks/use-offline-sync";

export function OfflineSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useOfflineSync();
  return children;
}
