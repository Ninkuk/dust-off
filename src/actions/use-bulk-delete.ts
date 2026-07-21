import { useCallback } from "react";
import { confirmDeleteIfNeeded } from "@/lib/delete-confirm";
import {
  applyOptimisticOmit,
  restoreCache,
} from "@/lib/delete-cache";
import MediaLibrary from "@/lib/media-library";
import { strings } from "@/lib/strings";
import { useFavoritesStore } from "@/state/favorites-store";
import { useSelectionStore } from "@/state/selection-store";
import { useToastStore } from "@/state/toast-store";

export function useBulkDelete() {
  return useCallback(async (ids: readonly string[]) => {
    if (ids.length === 0) {
      useSelectionStore.getState().cancel();
      return;
    }

    if (!(await confirmDeleteIfNeeded(ids.length))) {
      useSelectionStore.getState().cancel();
      return;
    }

    const snapshot = applyOptimisticOmit(ids);

    try {
      const ok = await MediaLibrary.deleteAssetsAsync([...ids]);
      if (!ok) {
        restoreCache(snapshot);
        useSelectionStore.getState().cancel();
        return;
      }
      useFavoritesStore.getState().removeFavorites([...ids]);
      useToastStore.getState().show({
        kind: "flash",
        message: strings.toast.gone,
      });
    } catch (e) {
      restoreCache(snapshot);
      console.warn("[delete] deleteAssetsAsync failed", e);
      useToastStore.getState().show({
        kind: "flash",
        message: strings.toast.deleteFailed,
      });
    }
    useSelectionStore.getState().cancel();
  }, []);
}
