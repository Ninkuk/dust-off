import { useCallback, useRef } from "react";
import { usePreferencesStore } from "@/state/preferences-store";

export function useFirstReveal() {
  const isFirstReveal = useRef(
    !usePreferencesStore.getState().hasSeenFirstReveal,
  ).current;

  const markRevealComplete = useCallback(() => {
    if (!usePreferencesStore.getState().hasSeenFirstReveal) {
      usePreferencesStore.getState().setPreference("hasSeenFirstReveal", true);
    }
  }, []);

  return { isFirstReveal, markRevealComplete };
}
