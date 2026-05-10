import { useCallback } from "react";
import { useFavoritesStore } from "@/state/favorites-store";
import { useSelectionStore } from "@/state/selection-store";
import { type Toast, useToastStore } from "@/state/toast-store";

type Direction = "add" | "remove";

function runBulk(direction: Direction, ids: readonly string[]) {
  const store = useFavoritesStore.getState();
  const before = store.favorites;
  const changed =
    direction === "add"
      ? ids.filter((id) => !before.has(id))
      : ids.filter((id) => before.has(id));

  if (changed.length === 0) {
    useSelectionStore.getState().cancel();
    return;
  }

  if (direction === "add") store.addFavorites(changed);
  else store.removeFavorites(changed);

  const toastKind: Toast["kind"] =
    direction === "add" ? "undo-favorite" : "undo-unfavorite";
  useToastStore.getState().show(
    { kind: toastKind, ids: changed },
    {
      onUndo: () => {
        const fav = useFavoritesStore.getState();
        if (direction === "add") fav.removeFavorites(changed);
        else fav.addFavorites(changed);
      },
    },
  );
  useSelectionStore.getState().cancel();
}

export function useBulkFavorite() {
  return useCallback(
    (ids: readonly string[]) => runBulk("add", ids),
    [],
  );
}

export function useBulkUnfavorite() {
  return useCallback(
    (ids: readonly string[]) => runBulk("remove", ids),
    [],
  );
}
