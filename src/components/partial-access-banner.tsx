import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import MediaLibrary from "@/lib/media-library";
import { strings } from "@/lib/strings";
import { tabularNums, type, useTheme } from "@/theme";

export function PartialAccessBanner({
  shared,
  total,
}: {
  shared: number;
  total: number;
}) {
  const theme = useTheme();

  const handleUpdate = async () => {
    if (Platform.OS === "ios") {
      await MediaLibrary.presentPermissionsPickerAsync().catch(() => {});
      return;
    }
    Linking.openSettings().catch(() => {});
  };

  return (
    <View
      style={[
        styles.root,
        {
          borderColor: theme.textPrimary,
          backgroundColor: theme.surface,
        },
      ]}
    >
      <Text
        style={[type.caption, tabularNums, styles.label, { color: theme.textPrimary }]}
        numberOfLines={1}
      >
        {strings.partialAccess.label(shared, total)}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.partialAccess.update}
        onPress={handleUpdate}
        hitSlop={8}
        style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={[type.caption, { color: theme.accent }]}>
          {strings.partialAccess.update}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    flex: 1,
    opacity: 0.85,
  },
  action: {
    marginLeft: 12,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
