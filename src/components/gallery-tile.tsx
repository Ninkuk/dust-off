import { Image } from "expo-image";
import type { Asset } from "expo-media-library";
import { StyleSheet } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

const GUTTER = 1;
export const FADE_DURATION_MS = 200;
export const ROW_STAGGER_MS = 40;
export const MAX_STAGGERED_ROWS = 10;
export const REVEAL_DURATION_MS =
  MAX_STAGGERED_ROWS * ROW_STAGGER_MS + FADE_DURATION_MS;

export function GalleryTile({
  asset,
  index,
  numColumns,
  revealProgress,
}: {
  asset: Asset;
  index: number;
  numColumns: number;
  revealProgress: SharedValue<number>;
}) {
  const row = Math.floor(index / numColumns);
  const cappedRow = Math.min(row, MAX_STAGGERED_ROWS);
  const rowStart = cappedRow * ROW_STAGGER_MS;
  const rowEnd = rowStart + FADE_DURATION_MS;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      revealProgress.value,
      [rowStart, rowEnd],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Animated.View style={[styles.cell, animatedStyle]}>
      <Image
        source={{ uri: asset.uri }}
        style={styles.image}
        recyclingKey={asset.id}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    aspectRatio: 1,
    padding: GUTTER / 2,
  },
  image: {
    flex: 1,
  },
});
