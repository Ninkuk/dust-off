import { StyleSheet, Text, View } from "react-native";
import { strings } from "@/lib/strings";
import { tabularNums, type, useTheme } from "@/theme";

export default function GalleryScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      <Text style={[type.caption, tabularNums, { color: theme.textPrimary }]}>
        Random · —
      </Text>
      <Text style={[type.display, { color: theme.textPrimary }]}>
        {strings.tabs.gallery}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
});
