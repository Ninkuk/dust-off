import { Pressable, StyleSheet, Text, View } from "react-native";
import { InkPill } from "@/components/ink-pill";
import { presentPhotoAccessPicker } from "@/lib/photo-access";
import { strings } from "@/lib/strings";
import { ink, tabularNums, type, useTheme } from "@/theme";

export function PartialAccessBanner({ shared }: { shared: number }) {
  const theme = useTheme();

  const handleUpdate = () => {
    presentPhotoAccessPicker();
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
        {strings.partialAccess.label(shared)}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.partialAccess.update}
        onPress={handleUpdate}
        hitSlop={8}
        style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
      >
        {/* Fixed dark chrome rather than accent-on-surface: the warm gold is
            1.57:1 on the light shell, which made this the least visible control
            on the only screen that can widen access. */}
        <InkPill size="chip">
          <Text style={[type.caption, { color: ink.textPrimary }]}>
            {strings.partialAccess.update}
          </Text>
        </InkPill>
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
