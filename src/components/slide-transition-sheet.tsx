import { type BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Check } from "lucide-react-native";
import { forwardRef } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { strings } from "@/lib/strings";
import {
  type SlideTransition,
  usePreferencesStore,
} from "@/state/preferences-store";
import { type, useTheme } from "@/theme";
import { Sheet } from "./sheet";

const TRANSITIONS: readonly SlideTransition[] = ["cross-fade", "hard-cut"];

export const SlideTransitionSheet = forwardRef<BottomSheetModal>(
  function SlideTransitionSheet(_props, ref) {
    const theme = useTheme();
    const current = usePreferencesStore((s) => s.slideTransition);
    const setPreference = usePreferencesStore((s) => s.setPreference);

    const select = (value: SlideTransition) => {
      setPreference("slideTransition", value);
      if (typeof ref === "object" && ref?.current) {
        ref.current.dismiss();
      }
    };

    return (
      <Sheet ref={ref}>
        <BottomSheetView style={styles.root}>
          {TRANSITIONS.map((value) => (
            <Pressable
              key={value}
              onPress={() => select(value)}
              style={({ pressed }) => [
                styles.row,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={strings.settings.slideTransitionLabels[value]}
              accessibilityState={{ selected: current === value }}
            >
              <Text style={[type.body, { color: theme.textPrimary }]}>
                {strings.settings.slideTransitionLabels[value]}
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
