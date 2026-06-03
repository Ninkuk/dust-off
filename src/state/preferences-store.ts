import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandStorage } from "@/lib/async-storage";
import type { PersistableSourceSet } from "@/lib/source-set";

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
  defaultSource: PersistableSourceSet;
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
  defaultSource: { kind: "all" },
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
      version: 1,
      partialize: ({ setPreference, resetFlags, ...data }) => data,
    },
  ),
);
