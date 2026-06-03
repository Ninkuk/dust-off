import { type BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import {
  ArrowDownAZ,
  CalendarArrowDown,
  CalendarArrowUp,
  Check,
  Dices,
  type LucideIcon,
} from "lucide-react-native";
import { forwardRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { strings } from "@/lib/strings";
import { type SortMode, usePreferencesStore } from "@/state/preferences-store";
import { type, useTheme } from "@/theme";
import { Sheet } from "./sheet";

const SORT_MODES: readonly SortMode[] = ["random", "newest", "oldest", "name"];

// Single source of truth for the glyph paired with each sort mode, shared with
// the SortStrip trigger so the two never drift. `Dices` matches the existing
// "random" glyph used in the morphing pill.
export const SORT_ICONS: Record<SortMode, LucideIcon> = {
  random: Dices,
  newest: CalendarArrowDown,
  oldest: CalendarArrowUp,
  name: ArrowDownAZ,
};

export const SortSheet = forwardRef<BottomSheetModal>(function SortSheet(
  _props,
  ref,
) {
  const theme = useTheme();
  const sortMode = usePreferencesStore((s) => s.defaultSort);
  const setPreference = usePreferencesStore((s) => s.setPreference);

  const select = (mode: SortMode) => {
    setPreference("defaultSort", mode);
    if (typeof ref === "object" && ref?.current) {
      ref.current.dismiss();
    }
  };

  return (
    <Sheet ref={ref}>
      <BottomSheetView style={styles.root}>
        {SORT_MODES.map((mode) => {
          const Icon = SORT_ICONS[mode];
          return (
            <Pressable
              key={mode}
              onPress={() => select(mode)}
              style={({ pressed }) => [
                styles.row,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={strings.gallery.sortLabels[mode]}
              accessibilityState={{ selected: sortMode === mode }}
            >
              <View style={styles.label}>
                <Icon size={20} strokeWidth={1.5} color={theme.textPrimary} />
                <Text style={[type.body, { color: theme.textPrimary }]}>
                  {strings.gallery.sortLabels[mode]}
                </Text>
              </View>
              {sortMode === mode ? (
                <Check size={20} strokeWidth={1.5} color={theme.textPrimary} />
              ) : null}
            </Pressable>
          );
        })}
      </BottomSheetView>
    </Sheet>
  );
});

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
  },
  label: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
});
