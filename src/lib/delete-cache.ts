import type { InfiniteData } from "@tanstack/react-query";
import type { Asset, PagedInfo } from "expo-media-library";
import { queryClient } from "@/lib/query-client";

export type AssetsCache = InfiniteData<PagedInfo<Asset>, string | undefined>;

export type AssetsCacheSnapshot = readonly (readonly [
  readonly unknown[],
  AssetsCache,
])[];

// Preserve identity for pages that contain none of the deleted IDs — lets
// RQ subscribers keying on page identity skip downstream re-renders.
//
// Patches every assets cache (the "all" cache and every per-album cache —
// they all share the ["assets", ...] key prefix), not just "all", so
// deleting from an album detail screen doesn't leave ghost tiles in that
// album's grid until the debounced library-change refetch lands.
export function applyOptimisticOmit(
  idsToRemove: readonly string[],
): AssetsCacheSnapshot {
  const idSet = new Set(idsToRemove);
  const entries = queryClient.getQueriesData<AssetsCache>({
    queryKey: ["assets"],
  });
  const snapshot: [readonly unknown[], AssetsCache][] = [];
  for (const [key, data] of entries) {
    if (!data) continue;
    const touched = data.pages.some((p) =>
      p.assets.some((a) => idSet.has(a.id)),
    );
    if (!touched) continue;
    snapshot.push([key, data]);
    queryClient.setQueryData(key, {
      ...data,
      pages: data.pages.map((p) =>
        p.assets.some((a) => idSet.has(a.id))
          ? { ...p, assets: p.assets.filter((a) => !idSet.has(a.id)) }
          : p,
      ),
    });
  }
  return snapshot;
}

export function restoreCache(snapshot: AssetsCacheSnapshot) {
  for (const [key, data] of snapshot) queryClient.setQueryData(key, data);
}
