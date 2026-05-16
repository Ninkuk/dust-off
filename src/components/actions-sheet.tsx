import { type BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import { StyleSheet } from "react-native";
import { strings } from "@/lib/strings";
import { Sheet } from "./sheet";
import { SheetRow } from "./sheet-row";

export const ActionsSheet = forwardRef<
  BottomSheetModal,
  {
    selectionCount: number;
    onFavoriteAll: () => void;
    onDeleteAll: () => void;
    onSlideshowSelection?: () => void;
  }
>(function ActionsSheet(
  { selectionCount, onFavoriteAll, onDeleteAll, onSlideshowSelection },
  ref,
) {
  return (
    <Sheet ref={ref}>
      <BottomSheetView style={styles.root}>
        {onSlideshowSelection ? (
          <SheetRow
            label={strings.actionsSheet.slideshowSelection(selectionCount)}
            onPress={onSlideshowSelection}
            disabled={selectionCount === 0}
          />
        ) : null}
        <SheetRow
          label={strings.actionsSheet.favoriteAll}
          onPress={onFavoriteAll}
        />
        <SheetRow
          label={strings.actionsSheet.deleteAll}
          tone="destructive"
          onPress={onDeleteAll}
        />
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
});
