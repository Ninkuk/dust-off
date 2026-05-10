import { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { EmptyState } from "@/components/empty-state";
import { useOnboardingComplete } from "@/actions/use-onboarding-complete";
import { strings } from "@/lib/strings";
import { theaterMotion, useTheme } from "@/theme";

const SWIPE_THRESHOLD = 0.25;

export default function OnboardingScreen() {
  const theme = useTheme();
  const onComplete = useOnboardingComplete();
  const [width, setWidth] = useState(Dimensions.get("window").width);
  const translateX = useSharedValue(0);
  const indexShared = useSharedValue(0);

  const cards = [
    { key: "card1", title: strings.onboarding.card1 },
    { key: "card2", title: strings.onboarding.card2 },
    {
      key: "prePrompt",
      title: strings.onboarding.prePrompt,
      action: { label: strings.onboarding.continue, onPress: onComplete },
    },
  ];
  const lastIndex = cards.length - 1;

  const goTo = (next: number) => {
    "worklet";
    indexShared.value = next;
    translateX.value = withSpring(-next * width, theaterMotion.spring);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      const base = -indexShared.value * width;
      translateX.value = base + e.translationX;
    })
    .onEnd((e) => {
      const current = indexShared.value;
      const dx = e.translationX;
      const passedThreshold = Math.abs(dx) > width * SWIPE_THRESHOLD;
      let next = current;
      if (passedThreshold && dx < 0 && current < lastIndex)
        next = current + 1;
      if (passedThreshold && dx > 0 && current > 0)
        next = current - 1;
      goTo(next);
    });

  const onLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width;
    if (next !== width) {
      setWidth(next);
      translateX.value = withTiming(-indexShared.value * next, {
        duration: theaterMotion.duration.fast,
      });
    }
  };

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: width * cards.length,
  }));

  return (
    <View
      style={[styles.root, { backgroundColor: theme.surface }]}
      onLayout={onLayout}
    >
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.track, trackStyle]}>
          {cards.map((c) => (
            <View key={c.key} style={[styles.page, { width }]}>
              <EmptyState title={c.title} action={c.action} />
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      <View style={styles.dots} pointerEvents="none">
        {cards.map((c, i) => (
          <Dot
            key={c.key}
            index={i}
            indexShared={indexShared}
            color={theme.textPrimary}
          />
        ))}
      </View>
    </View>
  );
}

function Dot({
  index,
  indexShared,
  color,
}: {
  index: number;
  indexShared: SharedValue<number>;
  color: string;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: indexShared.value === index ? 0.8 : 0.25,
  }));
  return (
    <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
  track: { flex: 1, flexDirection: "row" },
  page: { height: "100%" },
  dots: {
    position: "absolute",
    bottom: 56,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
