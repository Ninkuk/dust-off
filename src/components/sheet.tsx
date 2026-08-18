import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  type BottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import {
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { BackHandler } from "react-native";
import { ThemeProvider, useTheme } from "@/theme";

type SheetProps = Omit<BottomSheetModalProps, "children" | "ref"> & {
  children: ReactNode;
};

export const Sheet = forwardRef<BottomSheetModal, SheetProps>(function Sheet(
  { children, onChange, ...props },
  ref,
) {
  const theme = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const indexRef = useRef(-1);

  // Merge the forwarded ref with an internal one so the back handler below can
  // dismiss the sheet while callers still get the ref for present()/dismiss().
  const setRef = useCallback(
    (node: BottomSheetModal | null) => {
      sheetRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // gorhom v5 no longer dismisses on the Android hardware back button, so
  // without this the press falls through to the router and navigates the page
  // while the sheet stays open. Swallow the event only while a sheet is open.
  const handleChange = useCallback<NonNullable<BottomSheetModalProps["onChange"]>>(
    (index, position, type) => {
      indexRef.current = index;
      onChange?.(index, position, type);
    },
    [onChange],
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (indexRef.current >= 0) {
        sheetRef.current?.dismiss();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

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
      ref={setRef}
      onChange={handleChange}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.surface }}
      handleIndicatorStyle={{
        backgroundColor: theme.textPrimary,
        opacity: 0.3,
      }}
      enableDynamicSizing
      {...props}
    >
      {/* BottomSheetModal portals its children to the root host, which sits
          outside every ThemeProvider — so a forced zone (theater) would fall
          back to the shell theme and render black-on-black rows in light mode.
          Re-broadcast the theme resolved at the declaration site. */}
      <ThemeProvider value={theme}>{children}</ThemeProvider>
    </BottomSheetModal>
  );
});
