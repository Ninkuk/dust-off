import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { Sparkle } from "lucide-react-native";
import { type ReactNode, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  type PillScope,
  usePillContextLabel,
} from "@/hooks/use-pill-context-label";
import { type PillState, usePillState } from "@/hooks/use-pill-state";
import { selectionTick } from "@/lib/haptics";
import { type Toast, useToastStore } from "@/state/toast-store";
import { tabularNums, type, useTheme } from "@/theme";
import { ActionsSheet } from "./actions-sheet";
import { ToastPill } from "./toast-pill";

// NativeTabs doesn't expose a tab-bar height to JS, so we approximate. The
// pill clears typical iOS (~49pt + home indicator) and Android (~56dp + nav)
// tab bars; dial in during dogfooding if it floats too high or low.
const TAB_BAR_CLEARANCE = 60;

export function MorphingPill({
  scope,
  onFavoriteAll,
  onDeleteAll,
}: {
  scope: PillScope;
  onFavoriteAll: () => void;
  onDeleteAll: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const state = usePillState();
  const label = usePillContextLabel(scope);
  const toast = useToastStore((s) => s.current);
  const sheetRef = useRef<BottomSheetModal>(null);

  if (state === "hidden") return null;

  const handleShufflePress = () => {
    selectionTick();
    // Phase 6 wires this to startSlideshow.
  };

  const handleActionsPress = () => {
    selectionTick();
    sheetRef.current?.present();
  };

  const wrapDismiss = (action: () => void) => () => {
    sheetRef.current?.dismiss();
    action();
  };

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[
          styles.wrapper,
          { bottom: insets.bottom + TAB_BAR_CLEARANCE },
        ]}
      >
        <BlurView
          intensity={60}
          tint={theme.isDark ? "dark" : "light"}
          style={styles.pill}
        >
          {renderContent({
            state,
            label,
            theme,
            toast,
            onShuffle: handleShufflePress,
            onActions: handleActionsPress,
          })}
        </BlurView>
      </View>

      <ActionsSheet
        ref={sheetRef}
        onFavoriteAll={wrapDismiss(onFavoriteAll)}
        onDeleteAll={wrapDismiss(onDeleteAll)}
      />
    </>
  );
}

function renderContent({
  state,
  label,
  theme,
  toast,
  onShuffle,
  onActions,
}: {
  state: PillState;
  label: string;
  theme: ReturnType<typeof useTheme>;
  toast: Toast | null;
  onShuffle: () => void;
  onActions: () => void;
}): ReactNode {
  switch (state) {
    case "shuffle":
      return (
        <Pressable
          onPress={onShuffle}
          accessibilityRole="button"
          accessibilityLabel={label}
          hitSlop={8}
          style={({ pressed }) => [
            styles.row,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Sparkle
            size={16}
            strokeWidth={2}
            color={theme.textPrimary}
            style={styles.icon}
          />
          <Text style={[type.body, { color: theme.textPrimary }]}>
            {label}
          </Text>
        </Pressable>
      );
    case "actions":
      return (
        <Pressable
          onPress={onActions}
          accessibilityRole="button"
          accessibilityLabel={label}
          hitSlop={8}
          style={({ pressed }) => [
            styles.row,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text
            style={[type.body, tabularNums, { color: theme.textPrimary }]}
          >
            {label}
          </Text>
        </Pressable>
      );
    case "toast":
      if (!toast) return null;
      return <ToastPill toast={toast} chrome="bare" />;
    case "hidden":
      return null;
  }
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
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
  icon: {
    marginRight: 8,
  },
});
