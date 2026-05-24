import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/button";
import { strings } from "@/lib/strings";
import { type, useTheme } from "@/theme";

// D-7 fail-at-start surface. Reached when a slideshow start (pill long-press
// → picker → empty union, or selection-driven slideshow with zero matches)
// resolves to no eligible photos. Two CTAs:
//   • Adjust sources → bounces back to gallery with ?openPicker=1.
//   • Use All Photos → bounces back to gallery with ?startSlideshow=all.
//     One-shot — does NOT mutate the user's persisted defaultSource.
export default function TheaterEmptyScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.surface,
          paddingBottom: insets.bottom + 8,
        },
      ]}
    >
      <Text
        accessibilityRole="header"
        style={[type.display, styles.title, { color: theme.textPrimary }]}
      >
        {strings.emptyStates.nothingToShuffle}
      </Text>
      <View style={styles.actions}>
        <Button
          label={strings.theater.empty.adjust}
          onPress={() =>
            router.replace({
              pathname: "/(tabs)",
              params: { openPicker: "1" },
            })
          }
        />
        <View style={styles.spacer} />
        <Button
          label={strings.theater.empty.useAllPhotos}
          onPress={() =>
            router.replace({
              pathname: "/(tabs)",
              params: { startSlideshow: "all" },
            })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    textAlign: "center",
    marginBottom: 32,
  },
  actions: {
    alignItems: "center",
  },
  spacer: {
    height: 16,
  },
});
