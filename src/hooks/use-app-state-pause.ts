import { useAppStateListener } from "@/hooks/use-app-state-listener";
import { useSlideshowStoreApi } from "@/state/slideshow-store";

// D-9 / SM-10γ: pause on inactive/background, never auto-resume on return.
export function useAppStatePause() {
  const storeApi = useSlideshowStoreApi();
  useAppStateListener((next) => {
    if (next === "inactive" || next === "background") {
      storeApi.getState().pause();
    }
  });
}
