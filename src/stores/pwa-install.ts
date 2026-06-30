import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PwaInstallState {
  dismissed: boolean;
  dismiss: () => void;
  resetDismiss: () => void;
}

export const usePwaInstallStore = create<PwaInstallState>()(
  persist(
    (set) => ({
      dismissed: false,
      dismiss: () => set({ dismissed: true }),
      resetDismiss: () => set({ dismissed: false }),
    }),
    { name: "catdex-pwa-install" },
  ),
);
