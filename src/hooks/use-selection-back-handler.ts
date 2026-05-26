import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { BackHandler } from "react-native";
import { useSelectionStore } from "@/state/selection-store";

// Android convention (Google Photos, Files, Gmail): pressing back while
// in selection mode clears the selection instead of popping the route.
// Scoped via useFocusEffect so only the focused screen consumes the
// hardware back press. No-op on iOS.
export function useSelectionBackHandler() {
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        const { selectedIds, cancel } = useSelectionStore.getState();
        if (selectedIds.size === 0) return false;
        cancel();
        return true;
      });
      return () => sub.remove();
    }, []),
  );
}
