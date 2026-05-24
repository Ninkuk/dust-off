import { X } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { strings } from "@/lib/strings";
import { useSlideshowStore } from "@/state/slideshow-store";
import { useToastStore } from "@/state/toast-store";
import { tabularNums, type, useTheme } from "@/theme";

const FADE_MS = 220;

export function TheaterChrome({
  source,
  position,
  onClose,
  isSheetOpen,
}: {
  source: string;
  position: string;
  onClose: () => void;
  isSheetOpen: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isPlaying = useSlideshowStore((s) => s.isPlaying);
  const toastActive = useToastStore((s) => s.current !== null);

  // Chrome visible iff paused OR a sheet is open. The sheet branch preserves
  // the previous behavior of holding chrome up while the long-press menu /
  // info sheet is active, regardless of play state.
  const shouldShow = !isPlaying || isSheetOpen;
  const opacity = useSharedValue(shouldShow ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(shouldShow ? 1 : 0, { duration: FADE_MS });
  }, [shouldShow, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (toastActive) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { paddingTop: insets.top + 8, paddingBottom: 12 },
        animatedStyle,
      ]}
    >
      <View style={styles.row}>
        <Text style={[type.body, { color: theme.textPrimary }]}>{source}</Text>
        <Text style={[type.body, styles.dot, { color: theme.textPrimary }]}>
          {" · "}
        </Text>
        <Text style={[type.body, tabularNums, { color: theme.textPrimary }]}>
          {position}
        </Text>
        <View style={styles.spacer} />
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={strings.theater.closeA11y}
          hitSlop={12}
        >
          <X size={22} strokeWidth={1.5} color={theme.textPrimary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    opacity: 0.6,
  },
  spacer: {
    flex: 1,
  },
});
