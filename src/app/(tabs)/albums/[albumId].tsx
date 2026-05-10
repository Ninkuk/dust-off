import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useBulkDelete } from "@/actions/use-bulk-delete";
import { useBulkFavorite } from "@/actions/use-bulk-favorite";
import { useReshuffleGallery } from "@/actions/use-reshuffle-gallery";
import { EmptyState } from "@/components/empty-state";
import { GalleryGrid } from "@/components/gallery-grid";
import { MorphingPill } from "@/components/morphing-pill";
import { SortStrip } from "@/components/sort-strip";
import { seededShuffle } from "@/lib/seeded-shuffle";
import { FAVORITES_ALBUM_ID } from "@/lib/source-set";
import { strings } from "@/lib/strings";
import {
  type AlbumOrAllSource,
  useAssetsQuery,
  useFavoritesAssetsQuery,
  usePrefetchAllAssetPages,
} from "@/queries/use-assets-query";
import { useAlbumsQuery } from "@/queries/use-albums-query";
import { useGalleryStore } from "@/state/gallery-store";
import { usePreferencesStore } from "@/state/preferences-store";
import { useSelectionStore } from "@/state/selection-store";
import { useTheme } from "@/theme";

export default function AlbumGalleryScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ albumId: string }>();
  const albumId = Array.isArray(params.albumId)
    ? params.albumId[0]
    : params.albumId;

  const sortMode = usePreferencesStore((s) => s.defaultSort);
  const seed = useGalleryStore((s) => s.seed);
  const anchorIds = useGalleryStore((s) => s.anchorIds);

  const isFavorites = albumId === FAVORITES_ALBUM_ID;
  const querySource: AlbumOrAllSource = isFavorites
    ? { kind: "all" }
    : { kind: "album", albumId };

  usePrefetchAllAssetPages(querySource, { enabled: !isFavorites });
  const albumQuery = useAssetsQuery(querySource, { enabled: !isFavorites });
  const favoritesQuery = useFavoritesAssetsQuery({ enabled: isFavorites });
  const albumsQuery = useAlbumsQuery();

  const reshuffle = useReshuffleGallery();
  const bulkFavorite = useBulkFavorite();
  const bulkDelete = useBulkDelete();
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const cancelSelection = useSelectionStore((s) => s.cancel);

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
        return seededShuffle(allAssets, seed, {
          anchorIds: anchorIds ?? undefined,
        });
      case "newest":
        return allAssets;
      case "oldest":
        return [...allAssets].reverse();
      case "name":
        return [...allAssets].sort((a, b) =>
          a.filename.localeCompare(b.filename),
        );
    }
  }, [allAssets, sortMode, seed, fullyLoaded, anchorIds]);

  const ready = isFavorites
    ? !favoritesQuery.isLoading
    : albumQuery.data?.pages?.[0] != null;

  const albumTitle = isFavorites
    ? strings.albums.favoritesTitle
    : (albumsQuery.data?.find((a) => a.id === albumId)?.title ?? "");

  const handleFavoriteAll = () => bulkFavorite([...selectedIds]);
  const handleDeleteAll = () => bulkDelete([...selectedIds]);

  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      <SortStrip
        count={sortedAssets.length}
        selectionCount={selectedIds.size}
        onCancel={cancelSelection}
      />
      {!ready ? null : sortedAssets.length === 0 ? (
        <EmptyState title={strings.emptyStates.nothingYet} />
      ) : (
        <GalleryGrid
          assets={sortedAssets}
          isFirstReveal={false}
          onPullToShuffle={reshuffle}
        />
      )}
      <MorphingPill
        scope={{ kind: "album", title: albumTitle }}
        onFavoriteAll={handleFavoriteAll}
        onDeleteAll={handleDeleteAll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
