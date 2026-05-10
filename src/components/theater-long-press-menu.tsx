import { type BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import { StyleSheet } from "react-native";
import { strings } from "@/lib/strings";
import { Sheet } from "./sheet";
import { SheetRow } from "./sheet-row";

type Props = {
  isFavorited: boolean;
  hasAlbum: boolean;
  // Handlers are pre-wrapped by the parent to dismiss the sheet — see
  // morphing-pill.tsx's wrapDismiss pattern.
  onFavorite: () => void;
  onUnfavorite: () => void;
  onDelete: () => void;
  onShowInfo: () => void;
  onGoToFolder: () => void;
  onPresentChange: (open: boolean) => void;
};

export const TheaterLongPressMenu = forwardRef<BottomSheetModal, Props>(
  function TheaterLongPressMenu(
    {
      isFavorited,
      hasAlbum,
      onFavorite,
      onUnfavorite,
      onDelete,
      onShowInfo,
      onGoToFolder,
      onPresentChange,
    },
    ref,
  ) {
    const m = strings.theater.longPressMenu;
    return (
      <Sheet ref={ref} onChange={(index) => onPresentChange(index >= 0)}>
        <BottomSheetView style={styles.root}>
          <SheetRow
            label={isFavorited ? m.unfavorite : m.favorite}
            onPress={isFavorited ? onUnfavorite : onFavorite}
          />
          <SheetRow label={m.delete} tone="destructive" onPress={onDelete} />
          <SheetRow label={m.info} onPress={onShowInfo} />
          <SheetRow
            label={m.goToFolder}
            onPress={onGoToFolder}
            disabled={!hasAlbum}
          />
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
});
