import { useInfiniteQuery } from "@tanstack/react-query";
import type { Asset, PagedInfo } from "expo-media-library";
import { useEffect } from "react";
import MediaLibrary from "@/lib/media-library";
import { sourceSetKey } from "@/lib/source-set";
import { useFavoritesStore } from "@/state/favorites-store";

const PAGE_SIZE = 5000;

export type AlbumOrAllSource =
  | { kind: "all" }
  | { kind: "album"; albumId: string };

export const assetsQueryKey = (source: AlbumOrAllSource) =>
  ["assets", sourceSetKey(source)] as const;

function assetsInfiniteOptions(source: AlbumOrAllSource) {
  return {
    queryKey: assetsQueryKey(source),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: PagedInfo<Asset>) =>
      last.hasNextPage ? last.endCursor : undefined,
    queryFn: async ({
      pageParam,
    }: {
      pageParam: string | undefined;
    }): Promise<PagedInfo<Asset>> =>
      MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        after: pageParam,
        mediaType: ["photo"],
        sortBy: ["creationTime"],
        ...(source.kind === "album" ? { album: source.albumId } : {}),
      }),
    staleTime: Infinity,
  };
}

export function useAssetsQuery(
  source: AlbumOrAllSource,
  options?: { enabled?: boolean },
) {
  return useInfiniteQuery({
    ...assetsInfiniteOptions(source),
    enabled: options?.enabled,
  });
}

export function usePrefetchAllAssetPages(
  source: AlbumOrAllSource,
  options?: { enabled?: boolean },
) {
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = useAssetsQuery(
    source,
    options,
  );
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
}

// Favorites is derived from the 'all' cache (no native MediaLibrary "favorites"
// API; our store keys by asset ID). Sharing the queryKey means a single cache
// entry feeds gallery, splash gate, and favorites view.
export function useFavoritesAssetsQuery(options?: { enabled?: boolean }) {
  const favorites = useFavoritesStore((s) => s.favorites);
  const all = useInfiniteQuery({
    ...assetsInfiniteOptions({ kind: "all" }),
    enabled: options?.enabled,
  });
  const data: Asset[] =
    all.data?.pages
      .flatMap((p) => p.assets)
      .filter((a) => favorites.has(a.id)) ?? [];
  return {
    data,
    isLoading: all.isLoading,
    isFetching: all.isFetching,
    hasNextPage: all.hasNextPage,
  };
}
