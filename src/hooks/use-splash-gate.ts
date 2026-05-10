import { useEffect, useState } from "react";
import { isPermissionCleared } from "@/lib/permission";
import { useAssetsQuery } from "@/queries/use-assets-query";
import { usePermissionQuery } from "@/queries/use-permission-query";
import { useFavoritesStore } from "@/state/favorites-store";
import { usePreferencesStore } from "@/state/preferences-store";

const GALLERY_BACKSTOP_MS = 1000;

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

export function useSplashGate(): { ready: boolean } {
  const hydrated = useStoreHydration();
  const hasSeenOnboarding = usePreferencesStore((s) => s.hasSeenOnboarding);
  const permissionQuery = usePermissionQuery();
  const permissionSettled = !permissionQuery.isLoading;
  const cleared = isPermissionCleared(permissionQuery.data);

  const assetsQuery = useAssetsQuery({ kind: "all" }, { enabled: cleared });
  const firstPageReady = assetsQuery.data?.pages?.[0] != null;

  const [backstopElapsed, setBackstopElapsed] = useState(false);
  useEffect(() => {
    if (!hydrated || !hasSeenOnboarding || !permissionSettled || !cleared)
      return;
    const timer = setTimeout(() => setBackstopElapsed(true), GALLERY_BACKSTOP_MS);
    return () => clearTimeout(timer);
  }, [hydrated, hasSeenOnboarding, permissionSettled, cleared]);

  const ready = (() => {
    if (!hydrated) return false;
    if (!hasSeenOnboarding) return true;
    if (!permissionSettled) return false;
    if (!cleared) return true;
    return firstPageReady || backstopElapsed;
  })();

  return { ready };
}
