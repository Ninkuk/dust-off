import { useInfiniteQuery } from "@tanstack/react-query";
import type { Asset, PagedInfo } from "expo-media-library";
import { useEffect } from "react";
import MediaLibrary from "@/lib/media-library";
import { sourceSetKey, type SourceSet } from "@/lib/source-set";

const PAGE_SIZE = 5000;

export function useAssetsQuery(
  source: SourceSet,
  options?: { enabled?: boolean },
) {
  return useInfiniteQuery({
    queryKey: ["assets", sourceSetKey(source)] as const,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: PagedInfo<Asset>) =>
      last.hasNextPage ? last.endCursor : undefined,
    queryFn: async ({ pageParam }): Promise<PagedInfo<Asset>> =>
      MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        after: pageParam,
        mediaType: ["photo"],
        sortBy: ["creationTime"],
      }),
    enabled: options?.enabled,
    staleTime: Infinity,
  });
}

export function usePrefetchAllAssetPages(source: SourceSet) {
  const { hasNextPage, isFetchingNextPage, fetchNextPage } =
    useAssetsQuery(source);
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
}
