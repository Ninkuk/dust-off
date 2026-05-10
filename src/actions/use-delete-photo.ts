import { useCallback } from "react";
import {
  applyOptimisticOmit,
  restoreCache,
} from "@/lib/delete-cache";
import { confirmDeleteIfNeeded } from "@/lib/delete-confirm";
import MediaLibrary from "@/lib/media-library";
import { strings } from "@/lib/strings";
import { useToastStore } from "@/state/toast-store";

export function useDeletePhoto() {
  return useCallback(async (id: string, onAdvance: () => void) => {
    if (!(await confirmDeleteIfNeeded(1))) return;

    const snapshot = applyOptimisticOmit([id]);

    try {
      const ok = await MediaLibrary.deleteAssetsAsync([id]);
      if (!ok) {
        restoreCache(snapshot);
        return;
      }
      useToastStore.getState().show({
        kind: "flash",
        message: strings.toast.gone,
      });
      onAdvance();
    } catch {
      restoreCache(snapshot);
    }
  }, []);
}
