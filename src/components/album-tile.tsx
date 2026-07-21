import { Image } from "expo-image";
import type { Album, Asset } from "expo-media-library";
import { Check, Heart } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFavoritesCover } from "@/hooks/use-favorites-cover";
import { useAlbumCoverQuery } from "@/queries/use-album-cover-query";
import { mediumTap } from "@/lib/haptics";
import { FAVORITES_ALBUM_ID } from "@/lib/source-set";
import { strings } from "@/lib/strings";
import { useAlbumSelectionStore } from "@/state/album-selection-store";
import { tabularNums, type, useTheme } from "@/theme";

const GUTTER = 8;
const FADE_MS = 200;

type AlbumTileProps =
  | { kind: "favorites"; count: number; onPress: () => void }
  | { kind: "album"; album: Album; seed: number; onPress: () => void };

export function AlbumTile(props: AlbumTileProps) {
  const theme = useTheme();
  const id =
    props.kind === "favorites" ? FAVORITES_ALBUM_ID : props.album.id;
  const selected = useAlbumSelectionStore((s) => s.selectedIds.has(id));
  const selectionActive = useAlbumSelectionStore(
    (s) => s.selectedIds.size > 0,
  );

  const title =
    props.kind === "favorites"
      ? strings.albums.favoritesTitle
      : props.album.title;
  const count =
    props.kind === "favorites" ? props.count : props.album.assetCount;

  const handlePress = () => {
    if (selectionActive) {
      useAlbumSelectionStore.getState().toggle(id);
      return;
    }
    props.onPress();
  };

  const handleLongPress = () => {
    mediumTap();
    useAlbumSelectionStore.getState().toggle(id);
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={300}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={strings.albums.tileA11y(title, count)}
      style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View
        style={[
          styles.cover,
          {
            backgroundColor: theme.isDark
              ? "rgba(255,255,255,0.04)"
              : "rgba(0,0,0,0.04)",
          },
        ]}
      >
        {props.kind === "favorites" ? (
          <FavoritesCover />
        ) : (
          <RealAlbumCover albumId={props.album.id} seed={props.seed} />
        )}
        {selected ? (
          <>
            <View
              pointerEvents="none"
              style={[styles.selectedBorder, { borderColor: theme.accent }]}
            />
            <View
              pointerEvents="none"
              style={[styles.checkBadge, { backgroundColor: theme.accent }]}
            >
              <Check size={12} strokeWidth={2.5} color={theme.onAccent} />
            </View>
          </>
        ) : null}
      </View>
      <Text
        style={[type.caption, styles.title, { color: theme.textPrimary }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text
        style={[
          type.caption,
          tabularNums,
          styles.count,
          { color: theme.textPrimary },
        ]}
      >
        {strings.gallery.formatCount(count)}
      </Text>
    </Pressable>
  );
}

function CoverPhoto({ asset }: { asset: Asset }) {
  return (
    <Image
      source={{ uri: asset.uri }}
      style={StyleSheet.absoluteFill}
      recyclingKey={asset.id}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={FADE_MS}
    />
  );
}

function FavoritesCover() {
  const theme = useTheme();
  const cover = useFavoritesCover();
  if (!cover) {
    return (
      <View style={styles.empty} accessibilityElementsHidden>
        <Heart size={32} color={theme.textPrimary} strokeWidth={1.5} />
      </View>
    );
  }
  return <CoverPhoto asset={cover} />;
}

function RealAlbumCover({ albumId, seed }: { albumId: string; seed: number }) {
  const { data: cover } = useAlbumCoverQuery(albumId, seed);
  if (!cover) return null;
  return <CoverPhoto asset={cover} />;
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    padding: GUTTER / 2,
  },
  cover: {
    aspectRatio: 1,
    overflow: "hidden",
  },
  empty: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
  },
  checkBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 8,
  },
  count: {
    marginTop: 2,
    opacity: 0.6,
  },
});
