import { Pressable, StyleSheet, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { type, useTheme } from "@/theme";

export function Button({
  label,
  onPress,
  haptic = true,
}: {
  label: string;
  onPress: () => void;
  haptic?: boolean;
}) {
  const theme = useTheme();
  const handlePress = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={handlePress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        {
          borderColor: theme.textPrimary,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <Text style={[type.body, { color: theme.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});
