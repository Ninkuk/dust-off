import { useCallback } from "react";
import {
  applyOptimisticOmit,
  restoreCache,
} from "@/lib/delete-cache";
import {
  confirmDeleteIfNeeded,
  getDeleteResultMessage,
  osConfirmsDelete,
} from "@/lib/delete-confirm";
import MediaLibrary from "@/lib/media-library";
import { strings } from "@/lib/strings";
import { useFavoritesStore } from "@/state/favorites-store";
import { DELETE_TOAST_MS, useToastStore } from "@/state/toast-store";

export function useDeletePhoto() {
  return useCallback(async (id: string, onAdvance: () => void) => {
    if (!(await confirmDeleteIfNeeded(1))) return;

    // See use-bulk-delete: don't pre-empt the cache while the OS dialog is
    // still asking, or a cancel makes the photo disappear and come back.
    const snapshot = osConfirmsDelete() ? null : applyOptimisticOmit([id]);

    try {
      const ok = await MediaLibrary.deleteAssetsAsync([id]);
      if (!ok) {
        if (snapshot) restoreCache(snapshot);
        return;
      }
      if (!snapshot) applyOptimisticOmit([id]);
      useFavoritesStore.getState().removeFavorite(id);
      useToastStore.getState().show(
        { kind: "flash", message: getDeleteResultMessage(1) },
        { durationMs: DELETE_TOAST_MS },
      );
      onAdvance();
    } catch (e) {
      if (snapshot) restoreCache(snapshot);
      console.warn("[delete] deleteAssetsAsync failed", e);
      useToastStore.getState().show({
        kind: "flash",
        message: strings.toast.deleteFailed,
      });
    }
  }, []);
}
