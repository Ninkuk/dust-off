import * as Sharing from "expo-sharing";
import { useCallback } from "react";
import { copyAssetToShareCache } from "@/lib/share-cache";
import { strings } from "@/lib/strings";
import { useToastStore } from "@/state/toast-store";

export function useSharePhoto() {
  return useCallback(async (id: string) => {
    const fail = (reason: string, err?: unknown) => {
      console.warn(`[share] ${reason}`, err ?? "");
      useToastStore.getState().show({
        kind: "flash",
        message: strings.toast.shareFailed,
      });
    };

    try {
      if (!(await Sharing.isAvailableAsync())) {
        return fail("sharing unavailable on this device");
      }
      const cacheUri = await copyAssetToShareCache(id);
      if (!cacheUri) return fail(`no localUri for asset ${id}`);
      await Sharing.shareAsync(cacheUri);
    } catch (err) {
      fail("shareAsync threw", err);
    }
  }, []);
}
