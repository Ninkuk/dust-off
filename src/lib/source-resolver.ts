import type { QueryClient } from "@tanstack/react-query";
import type { Asset, PagedInfo } from "expo-media-library";
import type { PersistableSourceSet } from "@/lib/source-set";
import {
  assetsInfiniteOptions,
  assetsQueryKey,
} from "@/queries/use-assets-query";
import { useFavoritesStore } from "@/state/favorites-store";

// Resolves a PersistableSourceSet to a flat asset list. Used by the source
// picker to materialize the union before navigating to theater. Reads from
// query caches where possible; for `kind: 'union'`, fetches any missing
// per-album caches in parallel.
//
// Why this lives here: iOS Asset.albumId is often unpopulated when fetched via
// the 'all' query (no album scope), so we can't resolve unions by filtering
// the 'all' cache by albumId. Instead we union per-album caches by ID. This
// helper centralizes that workaround so future surfaces (settings, etc.) can
// reuse it.
export async function resolveSourceSet(
  source: PersistableSourceSet,
  queryClient: QueryClient,
): Promise<readonly Asset[]> {
  const allAssets = readAllAssets(queryClient);
  if (source.kind === "all") return allAssets;
  if (source.kind === "favorites") {
    const favs = useFavoritesStore.getState().favorites;
    return allAssets.filter((a) => favs.has(a.id));
  }
  if (source.kind === "album") {
    return readAlbumAssets(source.albumId, queryClient);
  }
  // Union: build the membership Set from each enabled source in parallel.
  const idSet = new Set<string>();
  if (source.includeFavorites) {
    const favs = useFavoritesStore.getState().favorites;
    for (const id of favs) idSet.add(id);
  }
  const albumLists = await Promise.all(
    source.albumIds.map((albumId) => readAlbumAssets(albumId, queryClient)),
  );
  for (const list of albumLists) {
    for (const a of list) idSet.add(a.id);
  }
  // Map back to Asset objects, preferring the 'all' cache for canonical
  // metadata; fall back to per-album cache for IDs that aren't in 'all' yet.
  const byId = new Map<string, Asset>();
  for (const a of allAssets) byId.set(a.id, a);
  for (let i = 0; i < source.albumIds.length; i++) {
    for (const a of albumLists[i]) {
      if (!byId.has(a.id)) byId.set(a.id, a);
    }
  }
  const out: Asset[] = [];
  for (const id of idSet) {
    const a = byId.get(id);
    if (a) out.push(a);
  }
  return out;
}

export async function readAlbumAssets(
  albumId: string,
  queryClient: QueryClient,
): Promise<readonly Asset[]> {
  const cached = queryClient.getQueryData<{ pages: PagedInfo<Asset>[] }>(
    assetsQueryKey({ kind: "album", albumId }),
  );
  if (cached) return cached.pages.flatMap((p) => p.assets);
  const fetched = await queryClient.fetchInfiniteQuery(
    assetsInfiniteOptions({ kind: "album", albumId }),
  );
  return fetched.pages.flatMap((p) => p.assets);
}

export function readAllAssets(queryClient: QueryClient): readonly Asset[] {
  const data = queryClient.getQueryData<{ pages: PagedInfo<Asset>[] }>(
    assetsQueryKey({ kind: "all" }),
  );
  return data?.pages.flatMap((p) => p.assets) ?? [];
}
