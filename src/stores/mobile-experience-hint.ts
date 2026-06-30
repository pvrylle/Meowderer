import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MobileExperienceHintState {
  dismissed: boolean;
  dismiss: () => void;
}

export const useMobileExperienceHintStore = create<MobileExperienceHintState>()(
  persist(
    (set) => ({
      dismissed: false,
      dismiss: () => set({ dismissed: true }),
    }),
    { name: "catdex-mobile-experience-hint" },
  ),
);
