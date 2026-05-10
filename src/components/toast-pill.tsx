import { BlurView } from "expo-blur";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { selectionTick } from "@/lib/haptics";
import { strings } from "@/lib/strings";
import { type Toast, useToastStore } from "@/state/toast-store";
import { type, useTheme } from "@/theme";

type ChromeMode = "blur" | "bare";

export function ToastPill({
  toast,
  chrome = "blur",
}: {
  toast: Toast;
  // "blur" wraps in BlurView (free-floating use, e.g. theater).
  // "bare" returns the row content only (already inside another blur surface).
  chrome?: ChromeMode;
}) {
  const theme = useTheme();
  const undo = useToastStore((s) => s.undo);
  const message = toast.kind === "flash" ? toast.message : strings.toast.saved;
  const showUndo = toast.kind !== "flash";

  const handleUndo = () => {
    selectionTick();
    undo();
  };

  const row = (
    <View style={styles.row}>
      <Text style={[type.body, { color: theme.textPrimary }]}>{message}</Text>
      {showUndo ? (
        <>
          <Text style={[type.body, styles.dot, { color: theme.textPrimary }]}>
            {" · "}
          </Text>
          <Pressable
            onPress={handleUndo}
            accessibilityRole="button"
            accessibilityLabel={strings.toast.undo}
            hitSlop={8}
          >
            <Text style={[type.body, { color: theme.accent }]}>
              {strings.toast.undo}
            </Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );

  if (chrome === "bare") return row;

  return (
    <BlurView
      intensity={60}
      tint={theme.isDark ? "dark" : "light"}
      style={styles.pill}
    >
      {row}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 24,
  },
  dot: {
    opacity: 0.6,
  },
});
