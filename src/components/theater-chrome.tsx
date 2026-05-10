import { X } from "lucide-react-native";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastStore } from "@/state/toast-store";
import { tabularNums, type, useTheme } from "@/theme";
import { strings } from "@/lib/strings";

const AUTO_HIDE_MS = 2000;
const FADE_MS = 220;

export type TheaterChromeHandle = {
  reveal: () => void;
};

export const TheaterChrome = forwardRef<
  TheaterChromeHandle,
  {
    source: string;
    position: string;
    onClose: () => void;
    isSheetOpen: boolean;
  }
>(function TheaterChrome({ source, position, onClose, isSheetOpen }, ref) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hide entirely while a toast is up — they share the same vertical slot.
  const toastActive = useToastStore((s) => s.current !== null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      opacity.value = withTiming(0, { duration: FADE_MS });
      timerRef.current = null;
    }, AUTO_HIDE_MS);
  }, [clearTimer, opacity]);

  useImperativeHandle(
    ref,
    () => ({
      reveal: () => {
        opacity.value = withTiming(1, { duration: FADE_MS });
        if (!isSheetOpen) scheduleHide();
      },
    }),
    [isSheetOpen, opacity, scheduleHide],
  );

  useEffect(() => {
    if (isSheetOpen) {
      clearTimer();
      opacity.value = withTiming(1, { duration: FADE_MS });
    } else {
      scheduleHide();
    }
    return clearTimer;
  }, [isSheetOpen, opacity, clearTimer, scheduleHide]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

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
        <Text
          style={[type.body, tabularNums, { color: theme.textPrimary }]}
        >
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
});

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
