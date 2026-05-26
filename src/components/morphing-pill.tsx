import { Heart, Play, Share2, Sparkle, Trash2 } from "lucide-react-native";
import type { ComponentType, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, Keyframe } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  type PillScope,
  usePillContextLabel,
} from "@/hooks/use-pill-context-label";
import { type PillState, usePillState } from "@/hooks/use-pill-state";
import { heavyTap, mediumTap, selectionTick } from "@/lib/haptics";
import { strings } from "@/lib/strings";
import { useSelectionStore } from "@/state/selection-store";
import { type Toast, useToastStore } from "@/state/toast-store";
import { colors, ink, type } from "@/theme";
import { shellMotion } from "@/theme/motion";
import { InkPill } from "./ink-pill";
import { ToastPill } from "./toast-pill";

// Pill hugs the tab bar with a 12pt gap so the chrome reads as a single
// dock rather than a floating pill orphaned mid-screen. NativeTabs doesn't
// expose a tab-bar height to JS; insets.bottom covers the tab-bar
// reservation, and this constant is the breathing room above it.
const TAB_BAR_CLEARANCE = 12;

// Stagger between circles when the action row enters — keeps the three
// buttons reading as a ladder rather than a single hard pop.
const CIRCLE_STAGGER_MS = 50;

const popIn = (delay = 0) =>
  new Keyframe({
    0: { opacity: 0, transform: [{ scale: 0.88 }] },
    100: {
      opacity: 1,
      transform: [{ scale: 1 }],
      easing: Easing.out(Easing.cubic),
    },
  })
    .duration(shellMotion.duration.base)
    .delay(delay);

const popOut = new Keyframe({
  0: { opacity: 1, transform: [{ scale: 1 }] },
  100: {
    opacity: 0,
    transform: [{ scale: 0.92 }],
    easing: Easing.in(Easing.cubic),
  },
}).duration(shellMotion.duration.fast);

export function MorphingPill({
  scope,
  onFavoriteAll,
  onShareAll,
  onDeleteAll,
  onShuffle,
  onLongPressShuffle,
  onSlideshowSelection,
}: {
  scope: PillScope;
  onFavoriteAll: () => void;
  onShareAll: () => void;
  onDeleteAll: () => void;
  onShuffle: () => void;
  onLongPressShuffle?: () => void;
  onSlideshowSelection?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const state = usePillState();
  const label = usePillContextLabel(scope);
  const toast = useToastStore((s) => s.current);
  const selectionCount = useSelectionStore((s) => s.selectedIds.size);

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

  const handleSlideshow = onSlideshowSelection
    ? () => {
        selectionTick();
        onSlideshowSelection();
      }
    : undefined;

  const handleFavorite = () => {
    selectionTick();
    onFavoriteAll();
  };

  const handleShare = () => {
    selectionTick();
    onShareAll();
  };

  const handleDelete = () => {
    mediumTap();
    onDeleteAll();
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: insets.bottom + TAB_BAR_CLEARANCE }]}
    >
      {renderContent({
        state,
        label,
        toast,
        selectionCount,
        onShuffle: handleShufflePress,
        onShuffleLongPress: handleShuffleLongPress,
        onSlideshow: handleSlideshow,
        onFavorite: handleFavorite,
        onShare: handleShare,
        onDelete: handleDelete,
      })}
    </View>
  );
}

function renderContent({
  state,
  label,
  toast,
  selectionCount,
  onShuffle,
  onShuffleLongPress,
  onSlideshow,
  onFavorite,
  onShare,
  onDelete,
}: {
  state: PillState;
  label: string;
  toast: Toast | null;
  selectionCount: number;
  onShuffle: () => void;
  onShuffleLongPress: (() => void) | undefined;
  onSlideshow: (() => void) | undefined;
  onFavorite: () => void;
  onShare: () => void;
  onDelete: () => void;
}): ReactNode {
  switch (state) {
    case "shuffle":
      return (
        <Animated.View entering={popIn()} exiting={popOut}>
          <InkPill size="pill" tone="accent">
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
                color={colors.text.onLight}
                style={styles.icon}
              />
              <Text style={[type.body, { color: colors.text.onLight }]}>
                {label}
              </Text>
            </Pressable>
          </InkPill>
        </Animated.View>
      );
    case "actions": {
      // Stagger index pegged to render order: Slideshow (if present), Heart,
      // Share, Trash. Each circle's enter delay = staggerIndex * CIRCLE_STAGGER_MS.
      let i = 0;
      return (
        <View style={styles.actionRow}>
          {onSlideshow ? (
            <CircleAction
              icon={Play}
              onPress={onSlideshow}
              accessibilityLabel={strings.pill.slideshowSelectionA11y(
                selectionCount,
              )}
              enterDelay={i++ * CIRCLE_STAGGER_MS}
            />
          ) : null}
          <CircleAction
            icon={Heart}
            onPress={onFavorite}
            color={ink.accent}
            accessibilityLabel={strings.pill.favoriteSelectionA11y(
              selectionCount,
            )}
            enterDelay={i++ * CIRCLE_STAGGER_MS}
          />
          <CircleAction
            icon={Share2}
            onPress={onShare}
            accessibilityLabel={strings.pill.shareSelectionA11y(
              selectionCount,
            )}
            enterDelay={i++ * CIRCLE_STAGGER_MS}
          />
          <CircleAction
            icon={Trash2}
            onPress={onDelete}
            color={ink.danger}
            accessibilityLabel={strings.pill.deleteSelectionA11y(
              selectionCount,
            )}
            enterDelay={i++ * CIRCLE_STAGGER_MS}
          />
        </View>
      );
    }
    case "toast":
      if (!toast) return null;
      return (
        <Animated.View entering={popIn()} exiting={popOut}>
          <ToastPill toast={toast} />
        </Animated.View>
      );
    case "hidden":
      return null;
  }
}

function CircleAction({
  icon: Icon,
  onPress,
  accessibilityLabel,
  color = ink.textPrimary,
  enterDelay = 0,
}: {
  icon: ComponentType<{ size: number; strokeWidth: number; color: string }>;
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
  enterDelay?: number;
}) {
  return (
    <Animated.View entering={popIn(enterDelay)} exiting={popOut}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <InkPill size="circle">
          <Icon size={20} strokeWidth={2} color={color} />
        </InkPill>
      </Pressable>
    </Animated.View>
  );
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
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
});
