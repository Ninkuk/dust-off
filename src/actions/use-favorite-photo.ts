import { useCallback } from "react";
import { heavyTap } from "@/lib/haptics";
import { useFavoritesStore } from "@/state/favorites-store";
import { type Toast, useToastStore } from "@/state/toast-store";

type Direction = "add" | "remove";

function runSingle(direction: Direction, id: string) {
  const store = useFavoritesStore.getState();
  const isFavorited = store.hasFavorite(id);
  if (direction === "add" && isFavorited) return;
  if (direction === "remove" && !isFavorited) return;

  if (direction === "add") store.addFavorite(id);
  else store.removeFavorite(id);

  heavyTap();

  const toastKind: Toast["kind"] =
    direction === "add" ? "undo-favorite" : "undo-unfavorite";
  useToastStore.getState().show(
    { kind: toastKind, ids: [id] },
    {
      onUndo: () => {
        const fav = useFavoritesStore.getState();
        if (direction === "add") fav.removeFavorite(id);
        else fav.addFavorite(id);
      },
    },
  );
}

export function useFavoritePhoto() {
  return useCallback((id: string) => runSingle("add", id), []);
}

export function useUnfavoritePhoto() {
  return useCallback((id: string) => runSingle("remove", id), []);
}
