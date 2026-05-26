import { Pressable, StyleSheet, Text } from "react-native";
import { type, useTheme } from "@/theme";

export type SheetRowTone = "default" | "destructive";

export function SheetRow({
  label,
  tone = "default",
  onPress,
  disabled = false,
}: {
  label: string;
  tone?: SheetRowTone;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const color = tone === "destructive" ? theme.danger : theme.textPrimary;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={disabled ? { disabled: true } : undefined}
      style={({ pressed }) => [
        styles.row,
        { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
      ]}
    >
      <Text style={[type.body, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
  },
});
