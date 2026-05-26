import { useRouter } from "expo-router";
import type { Album } from "expo-media-library";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlbumsGrid, type AlbumsGridItem } from "@/components/albums-grid";
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
import { useFavoritesStore } from "@/state/favorites-store";
import { useGalleryStore } from "@/state/gallery-store";
import { type, useTheme } from "@/theme";

const ALL_SOURCE: AlbumOrAllSource = { kind: "all" };

export default function AlbumsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const seed = useGalleryStore((s) => s.seed);
  const favoritesCount = useFavoritesStore((s) => s.favorites.size);

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
      <Text
        accessibilityRole="header"
        style={[type.display, styles.title, { color: theme.textPrimary }]}
      >
        {strings.tabs.albums}
      </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
});
