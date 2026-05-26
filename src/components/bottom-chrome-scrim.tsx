import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme";

// 12pt gap + 44pt pill + 64pt soft fade above the pill = 120pt of
// fixed scrim height on top of the safe-area inset (which itself
// covers the tab bar's reserved area).
const SCRIM_FIXED_PORTION = 120;

export function BottomChromeScrim() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const height = insets.bottom + SCRIM_FIXED_PORTION;

  return (
    <LinearGradient
      pointerEvents="none"
      colors={[
        `${theme.surface}00`,
        `${theme.surface}BF`,
        theme.surface,
      ]}
      locations={[0, 0.55, 1]}
      style={[styles.scrim, { height }]}
    />
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
