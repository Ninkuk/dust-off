import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Sparkle } from "lucide-react-native";
import { type ReactNode, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  type PillScope,
  usePillContextLabel,
} from "@/hooks/use-pill-context-label";
import { type PillState, usePillState } from "@/hooks/use-pill-state";
import { heavyTap, selectionTick } from "@/lib/haptics";
import { type Toast, useToastStore } from "@/state/toast-store";
import { ink, tabularNums, type } from "@/theme";
import { ActionsSheet } from "./actions-sheet";
import { InkPill } from "./ink-pill";
import { ToastPill } from "./toast-pill";

// NativeTabs doesn't expose a tab-bar height to JS, so we approximate.
// Clearance is purely geometric now (the bar is solid ink, no blur stack
// to preserve). Dial in during dogfooding if the pill floats too high
// or low above typical iOS/Android tab bars.
const TAB_BAR_CLEARANCE = 60;

export function MorphingPill({
  scope,
  selectionCount,
  onFavoriteAll,
  onDeleteAll,
  onShuffle,
  onLongPressShuffle,
  onSlideshowSelection,
}: {
  scope: PillScope;
  selectionCount: number;
  onFavoriteAll: () => void;
  onDeleteAll: () => void;
  onShuffle: () => void;
  onLongPressShuffle?: () => void;
  onSlideshowSelection?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const state = usePillState();
  const label = usePillContextLabel(scope);
  const toast = useToastStore((s) => s.current);
  const sheetRef = useRef<BottomSheetModal>(null);

  if (state === "hidden") return null;

  const handleShufflePress = () => {
    selectionTick();
    onShuffle();
  };

  const handleShuffleLongPress = onLongPressShuffle
    ? () => {
        heavyTap();
        onLongPressShuffle();
      }
    : undefined;

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
        <InkPill size="pill">
          {renderContent({
            state,
            label,
            toast,
            onShuffle: handleShufflePress,
            onShuffleLongPress: handleShuffleLongPress,
            onActions: handleActionsPress,
          })}
        </InkPill>
      </View>

      <ActionsSheet
        ref={sheetRef}
        selectionCount={selectionCount}
        onFavoriteAll={wrapDismiss(onFavoriteAll)}
        onDeleteAll={wrapDismiss(onDeleteAll)}
        onSlideshowSelection={
          onSlideshowSelection
            ? wrapDismiss(onSlideshowSelection)
            : undefined
        }
      />
    </>
  );
}

function renderContent({
  state,
  label,
  toast,
  onShuffle,
  onShuffleLongPress,
  onActions,
}: {
  state: PillState;
  label: string;
  toast: Toast | null;
  onShuffle: () => void;
  onShuffleLongPress: (() => void) | undefined;
  onActions: () => void;
}): ReactNode {
  switch (state) {
    case "shuffle":
      return (
        <Pressable
          onPress={onShuffle}
          onLongPress={onShuffleLongPress}
          delayLongPress={450}
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
            color={ink.textPrimary}
            style={styles.icon}
          />
          <Text style={[type.body, { color: ink.textPrimary }]}>
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
            style={[type.body, tabularNums, { color: ink.textPrimary }]}
          >
            {label}
          </Text>
        </Pressable>
      );
    case "toast":
      if (!toast) return null;
      return <ToastPill toast={toast} wrapped={false} />;
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 24,
  },
  icon: {
    marginRight: 8,
  },
});
