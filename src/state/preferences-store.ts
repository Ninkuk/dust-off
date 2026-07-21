import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandStorage } from "@/lib/async-storage";

export type SortMode = "random" | "newest" | "oldest" | "name";
export type GridSize = "compact" | "comfortable" | "large";
export type SlideTransition = "cross-fade" | "hard-cut";
export type ThemeMode = "auto" | "light" | "dark";

export type Preferences = {
  hasSeenOnboarding: boolean;
  hasSeenFirstReveal: boolean;
  seenSlideshowGuide: boolean;
  themeMode: ThemeMode;
  slideDurationSec: number;
  slideTransition: SlideTransition;
  includeICloud: boolean;
  defaultSort: SortMode;
  gridSize: GridSize;
};

type PreferencesActions = {
  setPreference: <K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) => void;
  resetFlags: () => void;
};

const defaults: Preferences = {
  hasSeenOnboarding: false,
  hasSeenFirstReveal: false,
  seenSlideshowGuide: false,
  themeMode: "auto",
  slideDurationSec: 8,
  slideTransition: "cross-fade",
  includeICloud: false,
  defaultSort: "random",
  gridSize: "comfortable",
};

export const usePreferencesStore = create<Preferences & PreferencesActions>()(
  persist(
    (set) => ({
      ...defaults,
      setPreference: (key, value) =>
        set({ [key]: value } as Partial<Preferences>),
      resetFlags: () =>
        set({
          hasSeenOnboarding: false,
          hasSeenFirstReveal: false,
          seenSlideshowGuide: false,
        }),
    }),
    {
      name: "@dust-off/preferences",
      storage: zustandStorage,
      version: 2,
      // v2 drops `defaultSource` (the old shuffle-source picker is gone).
      // Strip the stale key from previously-persisted state so it doesn't
      // linger in the rehydrated object.
      migrate: (persisted) => {
        if (persisted && typeof persisted === "object") {
          const { defaultSource: _drop, ...rest } = persisted as Record<
            string,
            unknown
          >;
          return rest as Preferences;
        }
        return persisted as Preferences;
      },
      partialize: ({ setPreference, resetFlags, ...data }) => data,
    },
  ),
);
