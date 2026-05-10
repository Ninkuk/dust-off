import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { strings } from "@/lib/strings";
import { usePreferencesStore } from "@/state/preferences-store";
import { tabularNums, type, useTheme } from "@/theme";
import { SortSheet } from "./sort-sheet";

export function SortStrip({ count }: { count: number }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const sortMode = usePreferencesStore((s) => s.defaultSort);
  const sheetRef = useRef<BottomSheetModal>(null);

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
  trigger: {
    minHeight: 32,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
