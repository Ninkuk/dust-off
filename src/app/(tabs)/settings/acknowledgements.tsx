import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { strings } from "@/lib/strings";
import { type, useTheme } from "@/theme";

type License = {
  name: string;
  license: string;
};

// Curated from direct dependencies in package.json. Update when adding new
// runtime deps. (Full transitive coverage deferred.)
const LICENSES: readonly License[] = [
  { name: "Expo & expo-* modules", license: "MIT" },
  { name: "React", license: "MIT" },
  { name: "React Native", license: "MIT" },
  { name: "expo-router", license: "MIT" },
  { name: "react-native-reanimated", license: "MIT" },
  { name: "react-native-gesture-handler", license: "MIT" },
  { name: "react-native-safe-area-context", license: "MIT" },
  { name: "react-native-screens", license: "MIT" },
  { name: "react-native-svg", license: "MIT" },
  { name: "react-native-share", license: "MIT" },
  { name: "react-native-worklets", license: "MIT" },
  { name: "@gorhom/bottom-sheet", license: "MIT" },
  { name: "@nandorojo/galeria", license: "MIT" },
  { name: "@shopify/flash-list", license: "MIT" },
  { name: "@tanstack/react-query", license: "MIT" },
  { name: "@react-navigation/*", license: "MIT" },
  { name: "@react-native-async-storage/async-storage", license: "MIT" },
  { name: "zustand", license: "MIT" },
  { name: "lucide-react-native", license: "ISC" },
];

export default function AcknowledgementsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={strings.nav.backA11y}
          hitSlop={12}
          style={({ pressed }) => [
            styles.back,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <ChevronLeft
            size={28}
            strokeWidth={1.5}
            color={theme.textPrimary}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[type.display, styles.title, { color: theme.textPrimary }]}>
          {strings.settings.acknowledgementsTitle}
        </Text>
        <Text
          style={[
            type.body,
            styles.intro,
            { color: theme.textPrimary, opacity: 0.6 },
          ]}
        >
          {strings.settings.acknowledgementsIntro}
        </Text>

        <View style={styles.list}>
          {LICENSES.map((entry, i) => (
            <View
              key={entry.name}
              style={[
                styles.row,
                i < LICENSES.length - 1
                  ? {
                      borderBottomColor: theme.textPrimary,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                    }
                  : null,
              ]}
            >
              <Text
                style={[type.body, { color: theme.textPrimary, flex: 1 }]}
                numberOfLines={2}
              >
                {entry.name}
              </Text>
              <Text
                style={[
                  type.caption,
                  { color: theme.textPrimary, opacity: 0.5, marginLeft: 12 },
                ]}
              >
                {entry.license}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  back: {
    padding: 4,
  },
  title: {
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 8,
  },
  intro: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  list: {
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    paddingVertical: 12,
  },
});
