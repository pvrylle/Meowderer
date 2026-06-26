import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  seen: boolean;
  setSeen: (seen: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      seen: false,
      setSeen: (seen) => set({ seen }),
    }),
    { name: "catdex-onboarding" },
  ),
);
