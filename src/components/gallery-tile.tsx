import { Image } from "expo-image";
import type { Asset } from "expo-media-library";
import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { strings } from "@/lib/strings";
import { useSelectionStore } from "@/state/selection-store";
import { useToastStore } from "@/state/toast-store";
import { useTheme } from "@/theme";

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
  onOpen,
}: {
  asset: Asset;
  index: number;
  numColumns: number;
  revealProgress: SharedValue<number>;
  onOpen?: (id: string) => void;
}) {
  const theme = useTheme();
  const selected = useSelectionStore((s) => s.selectedIds.has(asset.id));
  const selectionActive = useSelectionStore((s) => s.selectedIds.size > 0);

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

  const handlePress = (() => {
    if (selectionActive) {
      return () => {
        if (useSelectionStore.getState().toggle(asset.id)) return;
        useToastStore.getState().show({
          kind: "flash",
          message: strings.selection.capToast,
        });
      };
    }
    if (onOpen) return () => onOpen(asset.id);
    return undefined;
  })();

  return (
    <Animated.View style={[styles.cell, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        accessibilityRole={handlePress ? "button" : undefined}
        accessibilityState={handlePress ? { selected } : undefined}
        style={styles.pressable}
      >
        <Image
          source={{ uri: asset.uri }}
          style={styles.image}
          recyclingKey={asset.id}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
        />
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
              <Check size={12} strokeWidth={2.5} color={theme.surface} />
            </View>
          </>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    aspectRatio: 1,
    padding: GUTTER / 2,
  },
  pressable: {
    flex: 1,
  },
  image: {
    flex: 1,
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
});
