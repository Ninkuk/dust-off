import { useCallback } from "react";
import {
  confirmDeleteIfNeeded,
  getDeleteResultMessage,
  osConfirmsDelete,
} from "@/lib/delete-confirm";
import {
  applyOptimisticOmit,
  restoreCache,
} from "@/lib/delete-cache";
import MediaLibrary from "@/lib/media-library";
import { strings } from "@/lib/strings";
import { useFavoritesStore } from "@/state/favorites-store";
import { useSelectionStore } from "@/state/selection-store";
import { DELETE_TOAST_MS, useToastStore } from "@/state/toast-store";

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

    // When the OS is about to raise its own dialog the user has not consented
    // yet, so removing tiles now makes them vanish and flicker back on cancel.
    // Only pre-empt the cache where we collected consent ourselves.
    const snapshot = osConfirmsDelete() ? null : applyOptimisticOmit(ids);

    try {
      const ok = await MediaLibrary.deleteAssetsAsync([...ids]);
      if (!ok) {
        if (snapshot) restoreCache(snapshot);
        useSelectionStore.getState().cancel();
        return;
      }
      if (!snapshot) applyOptimisticOmit(ids);
      useFavoritesStore.getState().removeFavorites([...ids]);
      useToastStore.getState().show(
        { kind: "flash", message: getDeleteResultMessage(ids.length) },
        { durationMs: DELETE_TOAST_MS },
      );
    } catch (e) {
      if (snapshot) restoreCache(snapshot);
      console.warn("[delete] deleteAssetsAsync failed", e);
      useToastStore.getState().show({
        kind: "flash",
        message: strings.toast.deleteFailed,
      });
    }
    useSelectionStore.getState().cancel();
  }, []);
}
