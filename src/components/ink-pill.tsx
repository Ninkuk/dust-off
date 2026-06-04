import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { ink } from "@/theme";

type InkPillSize = "pill" | "chip" | "circle";

export function InkPill({
  size = "pill",
  style,
  children,
}: {
  size?: InkPillSize;
  style?: ViewStyle;
  children: ReactNode;
}) {
  const toneChrome = {
    backgroundColor: ink.surface,
    borderColor: ink.hairline,
  };
  return <View style={[styles[size], toneChrome, style]}>{children}</View>;
}

const baseChrome = {
  borderRadius: 999,
  borderWidth: StyleSheet.hairlineWidth,
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
  circle: {
    ...baseChrome,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
