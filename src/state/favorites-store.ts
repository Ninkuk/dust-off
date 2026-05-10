import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandStorage } from "@/lib/async-storage";

type FavoritesState = {
  favorites: Set<string>;
  addFavorite: (id: string) => void;
  addFavorites: (ids: readonly string[]) => void;
  removeFavorite: (id: string) => void;
  removeFavorites: (ids: readonly string[]) => void;
  toggleFavorite: (id: string) => void;
  hasFavorite: (id: string) => boolean;
  clearFavorites: () => void;
};

type FavoritesPersist = { ids: string[] };

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: new Set<string>(),
      addFavorite: (id) => {
        const current = get().favorites;
        if (current.has(id)) return;
        const next = new Set(current);
        next.add(id);
        set({ favorites: next });
      },
      addFavorites: (ids) => {
        const current = get().favorites;
        const toAdd = ids.filter((id) => !current.has(id));
        if (toAdd.length === 0) return;
        const next = new Set(current);
        for (const id of toAdd) next.add(id);
        set({ favorites: next });
      },
      removeFavorite: (id) => {
        const current = get().favorites;
        if (!current.has(id)) return;
        const next = new Set(current);
        next.delete(id);
        set({ favorites: next });
      },
      removeFavorites: (ids) => {
        const current = get().favorites;
        const toRemove = ids.filter((id) => current.has(id));
        if (toRemove.length === 0) return;
        const next = new Set(current);
        for (const id of toRemove) next.delete(id);
        set({ favorites: next });
      },
      toggleFavorite: (id) => {
        const current = get().favorites;
        const next = new Set(current);
        if (current.has(id)) next.delete(id);
        else next.add(id);
        set({ favorites: next });
      },
      hasFavorite: (id) => get().favorites.has(id),
      clearFavorites: () => {
        if (get().favorites.size === 0) return;
        set({ favorites: new Set() });
      },
    }),
    {
      name: "@dust-off/favorites",
      storage: zustandStorage,
      version: 1,
      // Sets aren't JSON-serializable; persist as a sorted string[] for deterministic diffs.
      partialize: (state) =>
        ({ ids: [...state.favorites].sort() }) as unknown as Partial<FavoritesState>,
      merge: (persisted, current) => ({
        ...current,
        favorites: new Set(
          (persisted as FavoritesPersist | undefined)?.ids ?? [],
        ),
      }),
    },
  ),
);
