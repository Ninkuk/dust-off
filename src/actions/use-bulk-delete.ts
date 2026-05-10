import type { InfiniteData } from "@tanstack/react-query";
import type { Asset, PagedInfo } from "expo-media-library";
import { useCallback } from "react";
import { Alert, Platform } from "react-native";
import { getDeleteConfirm } from "@/lib/delete-confirm";
import MediaLibrary from "@/lib/media-library";
import { queryClient } from "@/lib/query-client";
import { strings } from "@/lib/strings";
import { assetsQueryKey } from "@/queries/use-assets-query";
import { useSelectionStore } from "@/state/selection-store";
import { useToastStore } from "@/state/toast-store";

const ALL_KEY = assetsQueryKey({ kind: "all" });
type AssetsCache = InfiniteData<PagedInfo<Asset>, string | undefined>;

function confirmAndroid(count: number): Promise<boolean> {
  const c = getDeleteConfirm(count);
  return new Promise((resolve) => {
    Alert.alert(
      c.title,
      c.body,
      [
        {
          text: c.cancelLabel,
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: c.destructiveLabel,
          style: "destructive",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

function applyOptimistic(
  idsToRemove: readonly string[],
): AssetsCache | undefined {
  const snapshot = queryClient.getQueryData<AssetsCache>([...ALL_KEY]);
  if (!snapshot) return undefined;
  const idSet = new Set(idsToRemove);
  // Preserve identity for pages that contain none of the deleted IDs — lets
  // RQ subscribers keying on page identity skip downstream re-renders.
  const next: AssetsCache = {
    ...snapshot,
    pages: snapshot.pages.map((p) => {
      if (!p.assets.some((a) => idSet.has(a.id))) return p;
      return { ...p, assets: p.assets.filter((a) => !idSet.has(a.id)) };
    }),
  };
  queryClient.setQueryData([...ALL_KEY], next);
  return snapshot;
}

function restore(snapshot: AssetsCache | undefined) {
  if (snapshot) queryClient.setQueryData([...ALL_KEY], snapshot);
}

export function useBulkDelete() {
  return useCallback(async (ids: readonly string[]) => {
    if (ids.length === 0) {
      useSelectionStore.getState().cancel();
      return;
    }

    if (Platform.OS === "android") {
      const ok = await confirmAndroid(ids.length);
      if (!ok) {
        useSelectionStore.getState().cancel();
        return;
      }
    }

    const snapshot = applyOptimistic(ids);

    try {
      const ok = await MediaLibrary.deleteAssetsAsync([...ids]);
      if (!ok) {
        restore(snapshot);
        useSelectionStore.getState().cancel();
        return;
      }
      useToastStore.getState().show({
        kind: "flash",
        message: strings.toast.gone,
      });
    } catch {
      restore(snapshot);
    }
    useSelectionStore.getState().cancel();
  }, []);
}
