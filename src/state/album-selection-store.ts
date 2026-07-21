import { create } from "zustand";

// Selection set for the Albums tab multi-select shuffle. Kept SEPARATE from
// the photo `selection-store` on purpose: the global `usePillState` reacts to
// the photo store, and album selection must not flip the Gallery pill into its
// photo action row. IDs are album IDs; the Favorites tile uses
// FAVORITES_ALBUM_ID. Selection mode is "active" when selectedIds.size > 0
// (no separate boolean), matching the photo-selection convention.
type AlbumSelectionState = {
  selectedIds: Set<string>;
  toggle: (id: string) => void;
  clear: () => void;
};

export const useAlbumSelectionStore = create<AlbumSelectionState>(
  (set, get) => ({
    selectedIds: new Set(),
    toggle: (id) => {
      const next = new Set(get().selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      set({ selectedIds: next });
    },
    clear: () => {
      if (get().selectedIds.size === 0) return;
      set({ selectedIds: new Set() });
    },
  }),
);
