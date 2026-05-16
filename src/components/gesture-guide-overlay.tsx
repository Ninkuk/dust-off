import { BlurView } from "expo-blur";
import { useEffect } from "react";
import {
  AccessibilityInfo,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { strings } from "@/lib/strings";
import { type, useTheme } from "@/theme";
import { Button } from "./button";

// DS-19 first-slideshow gesture guide. Translucent dark scrim + animated
// hints. Dismisses on first tap or `Got it`. Reduce Motion gating is Phase 8.
const SCRIM_FADE_IN_MS = 400;
const SCRIM_FADE_IN_DELAY_MS = 400;
const SCRIM_OPACITY = 0.7;
const PULSE_DURATION_MS = 600;
const SWIPE_LOOP_MS = 2000;

export function GestureGuideOverlay({ onDismiss }: { onDismiss: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const swipeTravel = screenWidth * 0.5;

  const scrimOpacity = useSharedValue(0);
  const pulse = useSharedValue(1);
  const swipeX = useSharedValue(-swipeTravel / 2);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(strings.theater.gestureGuide.a11y);
    scrimOpacity.value = withDelay(
      SCRIM_FADE_IN_DELAY_MS,
      withTiming(SCRIM_OPACITY, {
        duration: SCRIM_FADE_IN_MS,
        easing: Easing.out(Easing.quad),
      }),
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: PULSE_DURATION_MS }),
        withTiming(1.0, { duration: PULSE_DURATION_MS }),
      ),
      -1,
      true,
    );
    swipeX.value = withRepeat(
      withSequence(
        withTiming(swipeTravel / 2, {
          duration: SWIPE_LOOP_MS / 2,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(-swipeTravel / 2, {
          duration: SWIPE_LOOP_MS / 2,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );
  }, [pulse, scrimOpacity, swipeX, swipeTravel]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOpacity.value,
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipeX.value }],
  }));

  return (
    <Pressable
      style={StyleSheet.absoluteFill}
      onPress={onDismiss}
      accessibilityRole="button"
      accessibilityLabel={strings.theater.gestureGuide.a11y}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "#000" },
          scrimStyle,
        ]}
      />

      {/* Top-center chip: ⚡ Shake */}
      <View
        style={[styles.topChipWrap, { paddingTop: insets.top + 24 }]}
        pointerEvents="none"
      >
        <Chip label={`⚡ ${strings.theater.gestureGuide.shake}`} />
      </View>

      {/* Three pulsing dots: ‹ ‖ › across left/center/right thirds */}
      <View style={styles.dotsRow} pointerEvents="none">
        <Animated.Text
          style={[styles.dot, pulseStyle, { color: theme.textPrimary }]}
        >
          {"‹"}
        </Animated.Text>
        <Animated.Text
          style={[styles.dot, pulseStyle, { color: theme.textPrimary }]}
        >
          {"‖"}
        </Animated.Text>
        <Animated.Text
          style={[styles.dot, pulseStyle, { color: theme.textPrimary }]}
        >
          {"›"}
        </Animated.Text>
      </View>

      {/* Ghost-finger swipe loop, centered horizontally */}
      <View style={styles.swipeRow} pointerEvents="none">
        <Animated.View
          style={[
            styles.ghostFinger,
            { backgroundColor: theme.textPrimary },
            swipeStyle,
          ]}
        />
      </View>

      {/* Bottom-center chip: ♥♥ Double-tap to favorite */}
      <View
        style={[styles.bottomChipWrap, { paddingBottom: insets.bottom + 96 }]}
        pointerEvents="none"
      >
        <Chip
          label={`♥♥ ${strings.theater.gestureGuide.doubleTap}`}
        />
      </View>

      {/* Got it CTA above safe area */}
      <View
        style={[styles.cta, { paddingBottom: insets.bottom + 24 }]}
        pointerEvents="box-none"
      >
        <Button
          label={strings.theater.gestureGuide.gotIt}
          onPress={onDismiss}
          haptic={false}
        />
      </View>
    </Pressable>
  );
}

function Chip({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <BlurView
      intensity={50}
      tint={theme.isDark ? "dark" : "light"}
      style={styles.chip}
    >
      <Text style={[type.caption, styles.chipText, { color: theme.textPrimary }]}>
        {label}
      </Text>
    </BlurView>
  );
}

const GHOST_SIZE = 24;

const styles = StyleSheet.create({
  topChipWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bottomChipWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  chipText: {
    fontSize: 13,
  },
  dotsRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 24,
  },
  dot: {
    fontSize: 32,
    opacity: 0.85,
  },
  swipeRow: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostFinger: {
    width: GHOST_SIZE,
    height: GHOST_SIZE,
    borderRadius: GHOST_SIZE / 2,
    opacity: 0.5,
  },
  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
