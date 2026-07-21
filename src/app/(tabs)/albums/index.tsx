import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import type { Album } from "expo-media-library";
import { X } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStartSlideshowFromAlbumSelection } from "@/actions/use-start-slideshow-from-album-selection";
import { AlbumShufflePill } from "@/components/album-shuffle-pill";
import { AlbumsGrid, type AlbumsGridItem } from "@/components/albums-grid";
import { BottomChromeScrim } from "@/components/bottom-chrome-scrim";
import { PartialAccessBanner } from "@/components/partial-access-banner";
import { isPermissionLimited } from "@/lib/permission";
import { FAVORITES_ALBUM_ID } from "@/lib/source-set";
import { strings } from "@/lib/strings";
import {
  useAssetsQuery,
  usePrefetchAllAssetPages,
  type AlbumOrAllSource,
} from "@/queries/use-assets-query";
import { usePermissionQuery } from "@/queries/use-permission-query";
import { useAlbumsQuery } from "@/queries/use-albums-query";
import { useAlbumSelectionStore } from "@/state/album-selection-store";
import { useFavoritesStore } from "@/state/favorites-store";
import { useGalleryStore } from "@/state/gallery-store";
import { tabularNums, type, useTheme } from "@/theme";

const ALL_SOURCE: AlbumOrAllSource = { kind: "all" };

export default function AlbumsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const seed = useGalleryStore((s) => s.seed);
  const favoritesCount = useFavoritesStore((s) => s.favorites.size);

  const selectionCount = useAlbumSelectionStore((s) => s.selectedIds.size);
  const clearSelection = useAlbumSelectionStore((s) => s.clear);
  const startFromAlbumSelection = useStartSlideshowFromAlbumSelection();
  const selecting = selectionCount > 0;

  // Android back clears the album selection instead of leaving the tab.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (useAlbumSelectionStore.getState().selectedIds.size === 0) {
          return false;
        }
        useAlbumSelectionStore.getState().clear();
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  // Keep the 'all' cache warm so the Favorites cover (which derives from it)
  // can resolve without round-tripping through the gallery tab first.
  usePrefetchAllAssetPages(ALL_SOURCE);
  const allQuery = useAssetsQuery(ALL_SOURCE);

  const albumsQuery = useAlbumsQuery();
  const permissionQuery = usePermissionQuery();
  const limited = isPermissionLimited(permissionQuery.data);

  const sortedAlbums = useMemo(() => {
    const albums = albumsQuery.data ?? [];
    return [...albums].sort((a, b) => a.title.localeCompare(b.title));
  }, [albumsQuery.data]);

  const items = useMemo<AlbumsGridItem[]>(
    () => [
      { kind: "favorites", count: favoritesCount },
      ...sortedAlbums.map((album) => ({ kind: "album", album }) as const),
    ],
    [sortedAlbums, favoritesCount],
  );

  const sharedCount = allQuery.data?.pages?.[0]?.totalCount ?? 0;

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.surface, paddingTop: insets.top + 16 },
      ]}
    >
      <View style={styles.header}>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={[type.display, styles.title, { color: theme.textPrimary }]}
        >
          {strings.tabs.albums}
        </Text>
        {selecting ? (
          <View style={styles.selectionControls}>
            <Text
              style={[type.caption, tabularNums, { color: theme.textPrimary }]}
            >
              {strings.selection.selectedLabel(selectionCount)}
            </Text>
            <Pressable
              onPress={clearSelection}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={strings.selection.cancelA11y}
              style={({ pressed }) => [
                styles.cancel,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <X size={20} strokeWidth={1.5} color={theme.textPrimary} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() =>
              useAlbumSelectionStore.getState().toggle(FAVORITES_ALBUM_ID)
            }
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={strings.albums.selectA11y}
            style={({ pressed }) => [
              styles.selectTrigger,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[type.caption, { color: theme.textPrimary }]}>
              {strings.albums.select}
            </Text>
          </Pressable>
        )}
      </View>
      {limited ? (
        <PartialAccessBanner shared={sharedCount} total={sharedCount} />
      ) : null}
      <AlbumsGrid
        items={items}
        seed={seed}
        onPressFavorites={() =>
          router.push({
            pathname: "/albums/[albumId]",
            params: { albumId: FAVORITES_ALBUM_ID },
          })
        }
        onPressAlbum={(album: Album) =>
          router.push({
            pathname: "/albums/[albumId]",
            params: { albumId: album.id },
          })
        }
      />
      <BottomChromeScrim />
      <AlbumShufflePill onShuffle={startFromAlbumSelection} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    flexShrink: 1,
  },
  selectTrigger: {
    minHeight: 32,
    minWidth: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  selectionControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cancel: {
    minHeight: 32,
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
