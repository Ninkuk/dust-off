import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

export function useAppStateListener(
  callback: (next: AppStateStatus, prev: AppStateStatus) => void,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  useEffect(() => {
    let prev: AppStateStatus = AppState.currentState;
    const sub = AppState.addEventListener("change", (next) => {
      callbackRef.current(next, prev);
      prev = next;
    });
    return () => sub.remove();
  }, []);
}
