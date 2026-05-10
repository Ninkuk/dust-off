import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandStorage } from "@/lib/async-storage";
import type { PersistableSourceSet } from "@/lib/source-set";

export type SortMode = "random" | "newest" | "oldest" | "name";
export type GridSize = "compact" | "comfortable" | "large";
export type SlideTransition = "cross-fade" | "hard-cut";
export type ShakeSensitivity = "off" | "low" | "medium" | "high";
export type ReduceMotionOverride = "auto" | "on" | "off";

export type Preferences = {
  hasSeenOnboarding: boolean;
  hasSeenFirstReveal: boolean;
  seenSlideshowGuide: boolean;
  slideDurationSec: number;
  slideTransition: SlideTransition;
  shakeSensitivity: ShakeSensitivity;
  visibleButtonMode: boolean;
  includeICloud: boolean;
  defaultSort: SortMode;
  gridSize: GridSize;
  defaultSource: PersistableSourceSet;
  reduceMotionOverride: ReduceMotionOverride;
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
  slideDurationSec: 8,
  slideTransition: "cross-fade",
  shakeSensitivity: "medium",
  visibleButtonMode: false,
  includeICloud: false,
  defaultSort: "random",
  gridSize: "comfortable",
  defaultSource: { kind: "all" },
  reduceMotionOverride: "auto",
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
