import { useEffect, useState } from "react";
import type { PermissionStatus } from "expo-media-library";
import { queryClient } from "@/lib/query-client";
import { sourceSetKey } from "@/lib/source-set";
import { usePermissionQuery } from "@/queries/use-permission-query";
import { useFavoritesStore } from "@/state/favorites-store";
import { usePreferencesStore } from "@/state/preferences-store";

export type SplashBranch = "phase0-hello" | "onboarding" | "denied" | "gallery";

export type SplashGateState = {
  branch: SplashBranch;
  hydrated: boolean;
  permission: PermissionStatus;
  hasSeenOnboarding: boolean;
  galleryReady: boolean;
};

function useStoreHydration(): boolean {
  const [hydrated, setHydrated] = useState(
    () =>
      usePreferencesStore.persist.hasHydrated() &&
      useFavoritesStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const check = () => {
      if (
        usePreferencesStore.persist.hasHydrated() &&
        useFavoritesStore.persist.hasHydrated()
      ) {
        setHydrated(true);
      }
    };
    check();
    const unsubA = usePreferencesStore.persist.onFinishHydration(check);
    const unsubB = useFavoritesStore.persist.onFinishHydration(check);
    return () => {
      unsubA();
      unsubB();
    };
  }, []);

  return hydrated;
}

export function useSplashGate(): SplashGateState {
  const hydrated = useStoreHydration();
  const hasSeenOnboarding = usePreferencesStore((s) => s.hasSeenOnboarding);
  const { data: permission = "undetermined" as PermissionStatus } =
    usePermissionQuery();
  const galleryReady = false;

  useEffect(() => {
    if (permission === "granted") {
      queryClient.prefetchQuery({
        queryKey: ["assets", sourceSetKey({ kind: "all" })],
      });
    }
  }, [permission]);

  return {
    branch: "phase0-hello",
    hydrated,
    permission,
    hasSeenOnboarding,
    galleryReady,
  };
}
