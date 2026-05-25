import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { ink } from "@/theme";

type InkPillSize = "pill" | "chip";

export function InkPill({
  size = "pill",
  style,
  children,
}: {
  size?: InkPillSize;
  style?: ViewStyle;
  children: ReactNode;
}) {
  return <View style={[styles[size], style]}>{children}</View>;
}

const baseChrome = {
  backgroundColor: ink.surface,
  borderRadius: 999,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: ink.hairline,
  overflow: "hidden" as const,
};

const styles = StyleSheet.create({
  pill: {
    ...baseChrome,
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  chip: {
    ...baseChrome,
    minHeight: 28,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
