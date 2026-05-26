import { type BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Check } from "lucide-react-native";
import { forwardRef } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { strings } from "@/lib/strings";
import {
  type ReduceMotionOverride,
  usePreferencesStore,
} from "@/state/preferences-store";
import { type, useTheme } from "@/theme";
import { Sheet } from "./sheet";

const MODES: readonly ReduceMotionOverride[] = ["auto", "on", "off"];

export const ReduceMotionSheet = forwardRef<BottomSheetModal>(
  function ReduceMotionSheet(_props, ref) {
    const theme = useTheme();
    const current = usePreferencesStore((s) => s.reduceMotionOverride);
    const setPreference = usePreferencesStore((s) => s.setPreference);

    const select = (value: ReduceMotionOverride) => {
      setPreference("reduceMotionOverride", value);
      if (typeof ref === "object" && ref?.current) {
        ref.current.dismiss();
      }
    };

    return (
      <Sheet ref={ref}>
        <BottomSheetView style={styles.root}>
          {MODES.map((value) => (
            <Pressable
              key={value}
              onPress={() => select(value)}
              style={({ pressed }) => [
                styles.row,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={strings.settings.reduceMotionLabels[value]}
              accessibilityState={{ selected: current === value }}
            >
              <Text style={[type.body, { color: theme.textPrimary }]}>
                {strings.settings.reduceMotionLabels[value]}
              </Text>
              {current === value ? (
                <Check size={20} strokeWidth={1.5} color={theme.textPrimary} />
              ) : null}
            </Pressable>
          ))}
        </BottomSheetView>
      </Sheet>
    );
  },
);

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
});
