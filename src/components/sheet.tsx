import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  type BottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import { forwardRef, type ReactNode, useCallback } from "react";
import { useTheme } from "@/theme";

type SheetProps = Omit<BottomSheetModalProps, "children" | "ref"> & {
  children: ReactNode;
};

export const Sheet = forwardRef<BottomSheetModal, SheetProps>(function Sheet(
  { children, ...props },
  ref,
) {
  const theme = useTheme();
  const renderBackdrop = useCallback(
    (p: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...p}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.surface }}
      handleIndicatorStyle={{
        backgroundColor: theme.textPrimary,
        opacity: 0.3,
      }}
      enableDynamicSizing
      {...props}
    >
      {children}
    </BottomSheetModal>
  );
});
