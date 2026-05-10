import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useToastStore } from "@/state/toast-store";

// SM-11: pending undo state commits on AppState→background. Rationale: the user
// has visibly moved on; surfacing an in-app dialog later is broken UX.
export function useToastAppStateCommit() {
  useEffect(() => {
    const sub = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "background") useToastStore.getState().commitNow();
      },
    );
    return () => sub.remove();
  }, []);
}
