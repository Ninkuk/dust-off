import { useCallback } from "react";
import Share from "react-native-share";
import { copyAssetToShareCache } from "@/lib/share-cache";
import { strings } from "@/lib/strings";
import { useSelectionStore } from "@/state/selection-store";
import { useToastStore } from "@/state/toast-store";

export function useBulkShare() {
  return useCallback(async (ids: readonly string[]) => {
    if (ids.length === 0) {
      useSelectionStore.getState().cancel();
      return;
    }

    const fail = (reason: string, err?: unknown) => {
      console.warn(`[bulk-share] ${reason}`, err ?? "");
      useToastStore.getState().show({
        kind: "flash",
        message: strings.toast.shareFailed,
      });
    };

    try {
      const cacheUris = await Promise.all(ids.map(copyAssetToShareCache));
      const urls = cacheUris.filter((u): u is string => !!u);

      if (urls.length === 0) {
        fail("no shareable URIs resolved");
        useSelectionStore.getState().cancel();
        return;
      }

      // failOnCancel: false — dismissing the share sheet is a normal outcome,
      // not an error worth surfacing.
      await Share.open({ urls, failOnCancel: false });
    } catch (err) {
      fail("Share.open threw", err);
    }
    useSelectionStore.getState().cancel();
  }, []);
}
