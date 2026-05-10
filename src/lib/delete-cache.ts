import type { InfiniteData } from "@tanstack/react-query";
import type { Asset, PagedInfo } from "expo-media-library";
import { queryClient } from "@/lib/query-client";
import { assetsQueryKey } from "@/queries/use-assets-query";

export const ALL_QUERY_KEY = assetsQueryKey({ kind: "all" });
export type AssetsCache = InfiniteData<PagedInfo<Asset>, string | undefined>;

// Preserve identity for pages that contain none of the deleted IDs — lets
// RQ subscribers keying on page identity skip downstream re-renders.
export function applyOptimisticOmit(
  idsToRemove: readonly string[],
): AssetsCache | undefined {
  const snapshot = queryClient.getQueryData<AssetsCache>([...ALL_QUERY_KEY]);
  if (!snapshot) return undefined;
  const idSet = new Set(idsToRemove);
  const next: AssetsCache = {
    ...snapshot,
    pages: snapshot.pages.map((p) => {
      if (!p.assets.some((a) => idSet.has(a.id))) return p;
      return { ...p, assets: p.assets.filter((a) => !idSet.has(a.id)) };
    }),
  };
  queryClient.setQueryData([...ALL_QUERY_KEY], next);
  return snapshot;
}

export function restoreCache(snapshot: AssetsCache | undefined) {
  if (snapshot) queryClient.setQueryData([...ALL_QUERY_KEY], snapshot);
}
