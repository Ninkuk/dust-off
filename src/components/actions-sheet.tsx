import { type BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { strings } from "@/lib/strings";
import { type, useTheme } from "@/theme";
import { Sheet } from "./sheet";

export const ActionsSheet = forwardRef<
  BottomSheetModal,
  {
    onFavoriteAll: () => void;
    onDeleteAll: () => void;
  }
>(function ActionsSheet({ onFavoriteAll, onDeleteAll }, ref) {
  const theme = useTheme();
  return (
    <Sheet ref={ref}>
      <BottomSheetView style={styles.root}>
        <Pressable
          onPress={onFavoriteAll}
          accessibilityRole="button"
          accessibilityLabel={strings.actionsSheet.favoriteAll}
          style={({ pressed }) => [
            styles.row,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={[type.body, { color: theme.textPrimary }]}>
            {strings.actionsSheet.favoriteAll}
          </Text>
        </Pressable>
        <Pressable
          onPress={onDeleteAll}
          accessibilityRole="button"
          accessibilityLabel={strings.actionsSheet.deleteAll}
          style={({ pressed }) => [
            styles.row,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={[type.body, { color: theme.accent }]}>
            {strings.actionsSheet.deleteAll}
          </Text>
        </Pressable>
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
    minHeight: 52,
  },
});
