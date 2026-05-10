import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastStore } from "@/state/toast-store";
import { ToastPill } from "./toast-pill";

export function TheaterToast() {
  const insets = useSafeAreaInsets();
  const toast = useToastStore((s) => s.current);
  if (!toast) return null;
  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { top: insets.top + 8 }]}
    >
      <ToastPill toast={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
