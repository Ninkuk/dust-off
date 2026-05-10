import { FlashList } from "@shopify/flash-list";
import type { Album } from "expo-media-library";
import { StyleSheet } from "react-native";
import { FAVORITES_ALBUM_ID } from "@/lib/source-set";
import { AlbumTile } from "./album-tile";

const HORIZONTAL_PADDING = 12;

export type AlbumsGridItem =
  | { kind: "favorites"; count: number }
  | { kind: "album"; album: Album };

export function AlbumsGrid({
  items,
  seed,
  onPressAlbum,
  onPressFavorites,
}: {
  items: AlbumsGridItem[];
  seed: number;
  onPressAlbum: (album: Album) => void;
  onPressFavorites: () => void;
}) {
  return (
    <FlashList
      data={items}
      numColumns={2}
      keyExtractor={(item) =>
        item.kind === "favorites" ? FAVORITES_ALBUM_ID : item.album.id
      }
      renderItem={({ item }) =>
        item.kind === "favorites" ? (
          <AlbumTile
            kind="favorites"
            count={item.count}
            onPress={onPressFavorites}
          />
        ) : (
          <AlbumTile
            kind="album"
            album={item.album}
            seed={seed}
            onPress={() => onPressAlbum(item.album)}
          />
        )
      }
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 4 },
});
