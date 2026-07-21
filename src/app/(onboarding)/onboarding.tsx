import { useState } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { EmptyState } from "@/components/empty-state";
import { useOnboardingComplete } from "@/actions/use-onboarding-complete";
import { strings } from "@/lib/strings";
import { theaterMotion, type, useTheme } from "@/theme";

const SWIPE_THRESHOLD = 0.25;

export default function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const onComplete = useOnboardingComplete();
  const [width, setWidth] = useState(Dimensions.get("window").width);
  const translateX = useSharedValue(0);
  const indexShared = useSharedValue(0);

  // Mirrored in React state so the page indicator and Skip control can be
  // described to assistive tech; the shared value alone never reaches JS.
  const [index, setIndex] = useState(0);

  const cards = [
    { key: "card1", title: strings.onboarding.card1 },
    { key: "card2", title: strings.onboarding.card2 },
    {
      key: "prePrompt",
      title: strings.onboarding.prePrompt,
      subtitle: strings.onboarding.prePromptBody,
      action: { label: strings.onboarding.continue, onPress: onComplete },
    },
  ];
  const lastIndex = cards.length - 1;

  const goTo = (next: number) => {
    "worklet";
    indexShared.value = next;
    runOnJS(setIndex)(next);
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
              <EmptyState
                title={c.title}
                subtitle={c.subtitle}
                action={c.action}
              />
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      {index < lastIndex ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.onboarding.skip}
          onPress={() => goTo(lastIndex)}
          hitSlop={12}
          style={({ pressed }) => [
            styles.skip,
            { top: insets.top + 12, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={[type.body, { color: theme.textPrimary }]}>
            {strings.onboarding.skip}
          </Text>
        </Pressable>
      ) : null}

      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={strings.onboarding.pageA11y(
          index + 1,
          cards.length,
        )}
        style={[styles.dots, { bottom: insets.bottom + 24 }]}
        pointerEvents="none"
      >
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
  skip: {
    position: "absolute",
    right: 24,
    minHeight: 44,
    minWidth: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  dots: {
    position: "absolute",
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
