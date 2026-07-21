import { ActivityIndicator, StyleSheet, View } from "react-native";
import { strings } from "@/lib/strings";
import { useTheme } from "@/theme";

/**
 * Shown while a library read is in flight. Previously these branches rendered
 * `null`, so a slow read (a large album, a cold library) was indistinguishable
 * from a broken screen.
 */
export function LoadingState() {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      <ActivityIndicator
        accessibilityLabel={strings.loading.photosA11y}
        color={theme.textPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
