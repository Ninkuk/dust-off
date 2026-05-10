import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { EmptyState } from "@/components/empty-state";
import { GalleryGrid } from "@/components/gallery-grid";
import { SortStrip } from "@/components/sort-strip";
import { seededShuffle } from "@/lib/seeded-shuffle";
import { FAVORITES_ALBUM_ID } from "@/lib/source-set";
import { strings } from "@/lib/strings";
import {
  useAssetsQuery,
  useFavoritesAssetsQuery,
  usePrefetchAllAssetPages,
  type AlbumOrAllSource,
} from "@/queries/use-assets-query";
import { useGalleryStore } from "@/state/gallery-store";
import { usePreferencesStore } from "@/state/preferences-store";
import { useTheme } from "@/theme";

export default function AlbumGalleryScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ albumId: string }>();
  const albumId = Array.isArray(params.albumId)
    ? params.albumId[0]
    : params.albumId;

  const sortMode = usePreferencesStore((s) => s.defaultSort);
  const seed = useGalleryStore((s) => s.seed);

  const isFavorites = albumId === FAVORITES_ALBUM_ID;
  const querySource: AlbumOrAllSource = isFavorites
    ? { kind: "all" }
    : { kind: "album", albumId };

  // Rules of hooks: both query hooks run unconditionally; only the active one
  // is enabled. Album-scoped paginates via its own infinite query; favorites
  // shares the 'all' cache via useFavoritesAssetsQuery.
  usePrefetchAllAssetPages(querySource, { enabled: !isFavorites });
  const albumQuery = useAssetsQuery(querySource, { enabled: !isFavorites });
  const favoritesQuery = useFavoritesAssetsQuery({ enabled: isFavorites });

  const allAssets = useMemo(
    () =>
      isFavorites
        ? favoritesQuery.data
        : (albumQuery.data?.pages.flatMap((p) => p.assets) ?? []),
    [isFavorites, favoritesQuery.data, albumQuery.data],
  );

  const fullyLoaded = isFavorites
    ? !favoritesQuery.isFetching
    : !albumQuery.hasNextPage;

  const sortedAssets = useMemo(() => {
    if (!fullyLoaded) return allAssets;
    switch (sortMode) {
      case "random":
        return seededShuffle(allAssets, seed);
      case "newest":
        return allAssets;
      case "oldest":
        return [...allAssets].reverse();
      case "name":
        return [...allAssets].sort((a, b) =>
          a.filename.localeCompare(b.filename),
        );
    }
  }, [allAssets, sortMode, seed, fullyLoaded]);

  const ready = isFavorites
    ? !favoritesQuery.isLoading
    : albumQuery.data?.pages?.[0] != null;

  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      <SortStrip count={sortedAssets.length} />
      {!ready ? null : sortedAssets.length === 0 ? (
        <EmptyState title={strings.emptyStates.nothingYet} />
      ) : (
        <GalleryGrid assets={sortedAssets} isFirstReveal={false} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
