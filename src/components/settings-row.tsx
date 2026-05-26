import { ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { type, useTheme } from "@/theme";

export type SettingsRowTone = "default" | "destructive";

type SettingsRowProps = {
  label: string;
  value?: string;
  onPress?: () => void;
  rightSlot?: ReactNode;
  tone?: SettingsRowTone;
  disabled?: boolean;
  accessibilityHint?: string;
};

export function SettingsRow({
  label,
  value,
  onPress,
  rightSlot,
  tone = "default",
  disabled = false,
  accessibilityHint,
}: SettingsRowProps) {
  const theme = useTheme();
  const labelColor = tone === "destructive" ? theme.danger : theme.textPrimary;

  // rightSlot (e.g. Switch) handles its own input; the row itself isn't a button.
  if (rightSlot) {
    return (
      <View style={styles.row}>
        <Text style={[type.body, { color: labelColor }]}>{label}</Text>
        <View style={styles.right}>{rightSlot}</View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled || !onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={disabled ? { disabled: true } : undefined}
      style={({ pressed }) => [
        styles.row,
        { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
      ]}
    >
      <Text style={[type.body, { color: labelColor }]}>{label}</Text>
      <View style={styles.right}>
        {value ? (
          <Text
            style={[
              type.body,
              { color: theme.textPrimary, opacity: 0.5, marginRight: 6 },
            ]}
            numberOfLines={1}
          >
            {value}
          </Text>
        ) : null}
        {onPress ? (
          <ChevronRight
            size={18}
            strokeWidth={1.5}
            color={theme.textPrimary}
            opacity={0.4}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    maxWidth: "60%",
  },
});
