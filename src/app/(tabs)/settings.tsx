import { StyleSheet, Text, View } from "react-native";
import { type, useTheme } from "@/theme";

export default function SettingsScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      <View style={[styles.row, { borderColor: theme.textPrimary }]}>
        <Text style={[type.body, { color: theme.textPrimary }]}>About</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  row: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    opacity: 0.6,
  },
});
