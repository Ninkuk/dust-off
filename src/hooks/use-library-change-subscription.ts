import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import MediaLibrary from "@/lib/media-library";
import { queryClient } from "@/lib/query-client";

const DEBOUNCE_MS = 500;

// Foreground-only MediaLibrary listener (SM-6). Debounces 500ms then
// invalidates active 'assets' queries. Slideshow-immune is enforced by
// refetchType: 'active' — paused/inactive sessions ignore until they remount.
export function useLibraryChangeSubscription() {
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    let debounceTimerId: ReturnType<typeof setTimeout> | null = null;

    const onChange = () => {
      if (debounceTimerId) clearTimeout(debounceTimerId);
      debounceTimerId = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["assets"],
          refetchType: "active",
        });
      }, DEBOUNCE_MS);
    };

    const subscribe = () => {
      if (subscription) return;
      subscription = MediaLibrary.addListener(onChange);
    };

    const unsubscribe = () => {
      subscription?.remove();
      subscription = null;
      if (debounceTimerId) {
        clearTimeout(debounceTimerId);
        debounceTimerId = null;
      }
    };

    if (AppState.currentState === "active") subscribe();

    const stateSub = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active") subscribe();
        else unsubscribe();
      },
    );

    return () => {
      stateSub.remove();
      unsubscribe();
    };
  }, []);
}
