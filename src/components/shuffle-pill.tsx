import { Dices } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import AnimatedGlow, { type PresetConfig } from "react-native-animated-glow";
import { type } from "@/theme";

// Gold palette anchored on the app accent (#F5C77E). Used to recolor the
// "Showtime" marquee preset so the lights read as true gold, not pale cream.
const GOLD = "#F5C77E"; // app accent, warm gold
const GOLD_BRIGHT = "#FFE9B0"; // highlight / glint
const GOLD_AMBER = "#E0A33E"; // deeper gold for richness

/**
 * The primary shuffle action, wrapped in the "Showtime" gold marquee preset
 * from react-native-animated-glow (Skia), recolored to the app's gold accent.
 * The preset structure (flowing border + layered glow + a bright "over" rim)
 * is kept as-authored; we override its fixed dark fill with our theme-aware
 * `bodyColor` and make it a full pill to match the dock. Gold is identity-fixed.
 */
export function ShufflePill({
  label,
  onPress,
  onLongPress,
  bodyColor,
  contentColor,
}: {
  label: string;
  onPress: () => void;
  onLongPress?: () => void;
  bodyColor: string;
  contentColor: string;
}) {
  const reduceMotion = useReducedMotion();

  const preset = useMemo<PresetConfig>(
    () => ({
      metadata: {
        name: "Showtime Gold",
        textColor: contentColor,
        textSize: 16,
        category: "Subtle",
        tags: ["gold", "marquee", "glamorous", "lights"],
      },
      states: [
        {
          name: "default",
          preset: {
            cornerRadius: 999,
            outlineWidth: 2,
            borderColor: GOLD,
            backgroundColor: bodyColor,
            // Reduce Motion freezes the marquee to a static gold border.
            animationSpeed: reduceMotion ? 0 : 2,
            borderSpeedMultiplier: 1,
            glowLayers: [
              {
                glowPlacement: "behind",
                colors: [GOLD],
                glowSize: [35, 20],
                opacity: 0.1,
                speedMultiplier: 1,
                coverage: 1,
                relativeOffset: 0,
              },
              {
                glowPlacement: "behind",
                colors: [GOLD_AMBER, GOLD_BRIGHT],
                glowSize: [5, 4, 4, 5],
                opacity: 0.2,
                speedMultiplier: 1,
                coverage: 1,
                relativeOffset: 0,
              },
              {
                glowPlacement: "behind",
                colors: [GOLD_AMBER],
                glowSize: [0, 20],
                opacity: 0.1,
                speedMultiplier: 1,
                coverage: 0.5,
                relativeOffset: 0,
              },
              {
                glowPlacement: "over",
                colors: [GOLD_BRIGHT],
                glowSize: [0, 2],
                opacity: 1,
                speedMultiplier: 1,
                coverage: 0.6,
                relativeOffset: 0,
              },
            ],
          },
        },
        {
          name: "hover",
          transition: 300,
          preset: {
            animationSpeed: reduceMotion ? 0 : 3,
            glowLayers: [
              { glowSize: [40, 24], opacity: 0.12 },
              { glowSize: [6, 5, 5, 6], opacity: 0.24 },
              { glowSize: [0, 24], opacity: 0.12 },
              { glowSize: [0, 2], opacity: 1 },
            ],
          },
        },
        {
          name: "press",
          transition: 100,
          preset: {
            animationSpeed: reduceMotion ? 0 : 4,
            glowLayers: [
              { glowSize: [40, 28], opacity: 0.14 },
              { glowSize: [7, 6, 6, 7], opacity: 0.28 },
              { glowSize: [0, 28], opacity: 0.14 },
              { glowSize: [0, 3], opacity: 1 },
            ],
          },
        },
      ],
    }),
    [bodyColor, contentColor, reduceMotion],
  );

  return (
    <AnimatedGlow preset={preset}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={450}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={8}
        style={[styles.body, { backgroundColor: bodyColor }]}
      >
        {({ pressed }) => (
          <View style={[styles.row, { opacity: pressed ? 0.7 : 1 }]}>
            <Dices
              size={18}
              strokeWidth={2}
              color={contentColor}
              style={styles.icon}
            />
            <Text style={[type.body, { color: contentColor }]}>{label}</Text>
          </View>
        )}
      </Pressable>
    </AnimatedGlow>
  );
}

const styles = StyleSheet.create({
  body: {
    minHeight: 50,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 24,
  },
  icon: {
    marginRight: 8,
  },
});
