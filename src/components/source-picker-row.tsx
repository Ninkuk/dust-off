import { Image } from "expo-image";
import { Check, Heart, Images } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFavoritesCover } from "@/hooks/use-favorites-cover";
import { selectionTick } from "@/lib/haptics";
import { strings } from "@/lib/strings";
import { useAlbumCoverQuery } from "@/queries/use-album-cover-query";
import { tabularNums, type, useTheme } from "@/theme";

const ROW_MIN_HEIGHT = 56;
const THUMB_SIZE = 40;
const THUMB_RADIUS = 6;

export type SourcePickerRowKind =
  | { kind: "all-photos" }
  | { kind: "favorites" }
  | { kind: "album"; albumId: string; seed: number };

export function SourcePickerRow({
  source,
  label,
  total,
  eligible,
  selected,
  onToggle,
}: {
  source: SourcePickerRowKind;
  label: string;
  total: number;
  eligible: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  const handlePress = () => {
    selectionTick();
    onToggle();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={strings.theater.sourcePicker.rowA11y(
        label,
        total,
        selected,
      )}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: theme.isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.08)",
          },
        ]}
      >
        <Thumbnail source={source} />
      </View>
      <Text
        style={[type.body, styles.label, { color: theme.textPrimary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        style={[
          type.caption,
          tabularNums,
          styles.count,
          { color: theme.textPrimary, opacity: 0.6 },
        ]}
      >
        {strings.theater.sourcePicker.formatCount(total, eligible)}
      </Text>
      <View style={styles.checkSlot}>
        {selected ? (
          <Check size={20} strokeWidth={2} color={theme.textPrimary} />
        ) : null}
      </View>
    </Pressable>
  );
}

function Thumbnail({ source }: { source: SourcePickerRowKind }) {
  const theme = useTheme();
  if (source.kind === "all-photos") {
    return (
      <View style={styles.iconCenter} accessibilityElementsHidden>
        <Images size={20} strokeWidth={1.5} color={theme.textPrimary} />
      </View>
    );
  }
  if (source.kind === "favorites") return <FavoritesThumb />;
  return <AlbumThumb albumId={source.albumId} seed={source.seed} />;
}

function FavoritesThumb() {
  const theme = useTheme();
  const cover = useFavoritesCover();
  if (!cover) {
    return (
      <View style={styles.iconCenter} accessibilityElementsHidden>
        <Heart size={20} strokeWidth={1.5} color={theme.textPrimary} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri: cover.uri }}
      style={StyleSheet.absoluteFill}
      recyclingKey={cover.id}
      contentFit="cover"
      cachePolicy="memory-disk"
    />
  );
}

function AlbumThumb({ albumId, seed }: { albumId: string; seed: number }) {
  const { data: cover } = useAlbumCoverQuery(albumId, seed);
  if (!cover) return null;
  return (
    <Image
      source={{ uri: cover.uri }}
      style={StyleSheet.absoluteFill}
      recyclingKey={cover.id}
      contentFit="cover"
      cachePolicy="memory-disk"
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: ROW_MIN_HEIGHT,
    paddingVertical: 8,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_RADIUS,
    overflow: "hidden",
    marginRight: 16,
  },
  iconCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    marginRight: 12,
  },
  count: {
    marginRight: 12,
  },
  checkSlot: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
