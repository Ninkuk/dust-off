import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedProps,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "@/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function LongPressRing({
  x,
  y,
  progress,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
  progress: SharedValue<number>;
}) {
  const theme = useTheme();

  const animatedProps = useAnimatedProps(() => ({
    cx: x.value,
    cy: y.value,
    r: interpolate(progress.value, [0, 1], [0, 24], Extrapolation.CLAMP),
    opacity: interpolate(
      progress.value,
      [0, 0.8, 1],
      [0.4, 0.7, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <AnimatedCircle animatedProps={animatedProps} fill={theme.accent} />
      </Svg>
    </View>
  );
}
