import { Pressable, StyleSheet, Text, View } from "react-native";
import { selectionTick } from "@/lib/haptics";
import { strings } from "@/lib/strings";
import { type Toast, useToastStore } from "@/state/toast-store";
import { ink, type } from "@/theme";
import { InkPill } from "./ink-pill";

export function ToastPill({
  toast,
  wrapped = true,
}: {
  toast: Toast;
  // `wrapped` controls chrome ownership: when true, ToastPill renders its
  // own InkPill chrome (standalone use, e.g. theater). When false, the
  // parent already provides chrome (e.g. nested inside MorphingPill).
  wrapped?: boolean;
}) {
  const undo = useToastStore((s) => s.undo);
  const message =
    toast.kind === "flash"
      ? toast.message
      : toast.kind === "undo-unfavorite"
        ? strings.toast.unfavorited
        : strings.toast.saved;
  const showUndo = toast.kind !== "flash";

  const handleUndo = () => {
    selectionTick();
    undo();
  };

  const row = (
    <View style={styles.row}>
      <Text style={[type.body, { color: ink.textPrimary }]}>{message}</Text>
      {showUndo ? (
        <>
          <Text style={[type.body, styles.dot, { color: ink.textPrimary }]}>
            {" · "}
          </Text>
          <Pressable
            onPress={handleUndo}
            accessibilityRole="button"
            accessibilityLabel={strings.toast.undo}
            hitSlop={8}
          >
            <Text style={[type.body, { color: ink.accent }]}>
              {strings.toast.undo}
            </Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );

  if (!wrapped) return row;

  return <InkPill size="pill">{row}</InkPill>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 24,
  },
  dot: {
    opacity: 0.6,
  },
});
