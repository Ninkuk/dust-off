import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { queryClient } from "@/lib/query-client";

export function usePermissionAppStateRefetch() {
  useEffect(() => {
    let lastState: AppStateStatus = AppState.currentState;
    const sub = AppState.addEventListener("change", (next) => {
      if (lastState !== "active" && next === "active") {
        queryClient.invalidateQueries({ queryKey: ["permission"] });
      }
      lastState = next;
    });
    return () => sub.remove();
  }, []);
}
