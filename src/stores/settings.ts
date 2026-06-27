import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  gpsDefaultOn: boolean;
  setGpsDefaultOn: (on: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      gpsDefaultOn: false,
      setGpsDefaultOn: (gpsDefaultOn) => set({ gpsDefaultOn }),
    }),
    { name: "catdex-settings" },
  ),
);
