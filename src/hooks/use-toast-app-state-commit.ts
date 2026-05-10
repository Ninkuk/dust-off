import { useAppStateListener } from "@/hooks/use-app-state-listener";
import { useToastStore } from "@/state/toast-store";

// SM-11: pending undo state commits on AppState→background. Rationale: the user
// has visibly moved on; surfacing an in-app dialog later is broken UX.
export function useToastAppStateCommit() {
  useAppStateListener((next) => {
    if (next === "background") useToastStore.getState().commitNow();
  });
}
