import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { ChevronLeft, X } from "lucide-react-native";
import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { strings } from "@/lib/strings";
import { usePreferencesStore } from "@/state/preferences-store";
import { tabularNums, type, useTheme } from "@/theme";
import { SORT_ICONS, SortSheet } from "./sort-sheet";

export function SortStrip({
  count,
  selectionCount,
  onCancel,
  onBack,
  title,
}: {
  count: number;
  selectionCount?: number;
  onCancel?: () => void;
  onBack?: () => void;
  title?: string;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const sortMode = usePreferencesStore((s) => s.defaultSort);
  const sheetRef = useRef<BottomSheetModal>(null);
  const SortIcon = SORT_ICONS[sortMode];

  const backButton = onBack ? (
    <Pressable
      onPress={onBack}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={strings.nav.backA11y}
      style={({ pressed }) => [
        styles.back,
        { top: insets.top + 4, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <ChevronLeft size={22} strokeWidth={1.75} color={theme.textPrimary} />
    </Pressable>
  ) : null;

  if ((selectionCount ?? 0) > 0 && onCancel) {
    return (
      <View style={[styles.rootRow, { paddingTop: insets.top + 8 }]}>
        {backButton}
        <Text
          style={[
            type.caption,
            tabularNums,
            styles.flex,
            onBack ? styles.flexWithBack : null,
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
        {backButton}
        {title ? (
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.title, type.body, { color: theme.textPrimary }]}
          >
            {title}
          </Text>
        ) : null}
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
          <SortIcon size={15} strokeWidth={1.5} color={theme.textPrimary} />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  flex: {
    flex: 1,
  },
  // Indent the centered selection label past the back chevron so it doesn't
  // visually crash into it. Only applied when onBack is present.
  flexWithBack: {
    marginLeft: 36,
  },
  cancel: {
    minHeight: 32,
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  back: {
    position: "absolute",
    left: 12,
    minHeight: 32,
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  title: {
    // 70% keeps long titles clear of the absolute-positioned back button on
    // narrow screens; ellipsis takes over before they collide.
    maxWidth: "70%",
    marginBottom: 2,
    textAlign: "center",
  },
});
