import { Platform, type TextStyle } from "react-native";

export const tabularNums: TextStyle =
  Platform.OS === "ios"
    ? { fontVariant: ["tabular-nums"] }
    : { fontFamily: "monospace" };

export const type = {
  caption: { fontSize: 10, fontWeight: "400", letterSpacing: 0.2 },
  body: { fontSize: 16, fontWeight: "400" },
  display: {
    fontSize: 38,
    fontWeight: "300",
    letterSpacing: -0.5,
    lineHeight: 48,
  },
} as const satisfies Record<string, TextStyle>;
