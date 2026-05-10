import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFrameRate } from "@/hooks/use-frame-rate";
import {
  ThemeProvider,
  tabularNums,
  theaterTheme,
  type,
  useTheme,
} from "@/theme";

export default function Index() {
  const [theaterMode, setTheaterMode] = useState(false);
  const screen = (
    <Screen
      theaterMode={theaterMode}
      onToggle={() => setTheaterMode((v) => !v)}
    />
  );
  return theaterMode ? (
    <ThemeProvider value={theaterTheme}>{screen}</ThemeProvider>
  ) : (
    screen
  );
}

function Screen({
  theaterMode,
  onToggle,
}: {
  theaterMode: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  const fps = useFrameRate();

  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      <Text style={[type.display, { color: theme.textPrimary }]}>Phase 0.</Text>

      <Pressable
        accessibilityRole="button"
        onPress={onToggle}
        style={({ pressed }) => [
          styles.toggle,
          {
            borderColor: theme.accent,
            backgroundColor: theaterMode ? theme.accent : "transparent",
            opacity: pressed ? 0.6 : 1,
          },
        ]}
      >
        <Text
          style={[
            type.body,
            { color: theaterMode ? "#000000" : theme.textPrimary },
          ]}
        >
          {theaterMode ? "Theater" : "Shell"}
        </Text>
      </Pressable>

      <Text
        style={[
          type.caption,
          tabularNums,
          styles.fps,
          { color: theme.textPrimary },
        ]}
      >
        {String(fps).padStart(2, "0")} fps · {theme.zone}
      </Text>

      <Link href="/spike-galeria" style={[styles.devLink, { color: theme.textPrimary }]}>
        D-1 spike →
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  toggle: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  fps: {
    position: "absolute",
    bottom: 64,
    opacity: 0.5,
  },
  devLink: {
    position: "absolute",
    bottom: 24,
    fontSize: 11,
    opacity: 0.4,
    textDecorationLine: "underline",
  },
});
