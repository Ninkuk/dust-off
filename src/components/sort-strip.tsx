import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { strings } from "@/lib/strings";
import { usePreferencesStore } from "@/state/preferences-store";
import { tabularNums, type, useTheme } from "@/theme";
import { SortSheet } from "./sort-sheet";

export function SortStrip({
  count,
  selectionCount,
  onCancel,
}: {
  count: number;
  selectionCount?: number;
  onCancel?: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const sortMode = usePreferencesStore((s) => s.defaultSort);
  const sheetRef = useRef<BottomSheetModal>(null);

  if ((selectionCount ?? 0) > 0 && onCancel) {
    return (
      <View style={[styles.rootRow, { paddingTop: insets.top + 8 }]}>
        <Text
          style={[
            type.caption,
            tabularNums,
            styles.flex,
            { color: theme.textPrimary },
          ]}
        >
          {strings.selection.selectedLabel(selectionCount ?? 0)}
        </Text>
        <Pressable
          onPress={onCancel}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={strings.selection.cancelA11y}
          style={({ pressed }) => [
            styles.cancel,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <X size={20} strokeWidth={1.5} color={theme.textPrimary} />
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => sheetRef.current?.present()}
          hitSlop={8}
          style={({ pressed }) => [
            styles.trigger,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={strings.gallery.sortStripA11y(
            strings.gallery.sortLabels[sortMode],
            count,
          )}
        >
          <Text style={[type.caption, { color: theme.textPrimary }]}>
            {strings.gallery.sortLabels[sortMode]}
            {" · "}
            <Text style={tabularNums}>
              {strings.gallery.formatCount(count)}
            </Text>
          </Text>
        </Pressable>
      </View>
      <SortSheet ref={sheetRef} />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: "center",
  },
  rootRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  trigger: {
    minHeight: 32,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: {
    flex: 1,
  },
  cancel: {
    minHeight: 32,
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
