import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { usePreferencesStore } from "@/state/preferences-store";
import { useSlideshowStore } from "@/state/slideshow-store";

const BAR_HEIGHT = 1;
const FADE_MS = 220;
const BAR_COLOR = "rgba(255, 255, 255, 0.85)";

export function TheaterProgressBar() {
  const isPlaying = useSlideshowStore((s) => s.isPlaying);
  const generation = useSlideshowStore((s) => s.generation);
  const slideDurationSec = usePreferencesStore((s) => s.slideDurationSec);

  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: slideDurationSec * 1000,
      });
      opacity.value = withTiming(1, { duration: FADE_MS });
    } else {
      opacity.value = withTiming(0, { duration: FADE_MS });
    }
  }, [isPlaying, generation, slideDurationSec, progress, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.bar, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    height: BAR_HEIGHT,
    backgroundColor: BAR_COLOR,
  },
});
