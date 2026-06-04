import type { LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import { type, useTheme } from "@/theme";

export type SheetRowTone = "default" | "destructive";

const ICON_SIZE = 22;
const ICON_STROKE = 1.5;

export function SheetRow({
  label,
  icon: Icon,
  iconFilled = false,
  tone = "default",
  onPress,
  disabled = false,
}: {
  label: string;
  icon?: LucideIcon;
  iconFilled?: boolean;
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
      {Icon ? (
        <Icon
          size={ICON_SIZE}
          strokeWidth={ICON_STROKE}
          color={color}
          fill={iconFilled ? color : "transparent"}
        />
      ) : null}
      <Text style={[type.body, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 52,
  },
});
