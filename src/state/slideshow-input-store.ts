import { create } from "zustand";

// Single-slot transient bridge for slideshow scopes that can't be encoded as
// query keys: kind='selection' (ad-hoc IDs from gallery selection) and
// kind='union' (multi-source picker output, where iOS Asset.albumId is often
// not populated for assets fetched via the 'all' query — so we can't resolve
// the union by filtering the cache by albumId at the theater).
//
// Producer (action / picker) calls setInput(ids) before router.push. Theater
// calls takeInput() once on mount: read-and-clear in one step so a remount or
// back-nav doesn't re-consume stale data. The mutating-getter shape is
// deliberate — call site reads as `const ids = ...takeInput()`, signaling
// drain semantics.
type SlideshowInputState = {
  pendingIds: readonly string[] | null;
  setInput: (ids: readonly string[]) => void;
  takeInput: () => readonly string[] | null;
};

export const useSlideshowInputStore = create<SlideshowInputState>((set, get) => ({
  pendingIds: null,
  setInput: (ids) => set({ pendingIds: ids }),
  takeInput: () => {
    const ids = get().pendingIds;
    if (ids !== null) set({ pendingIds: null });
    return ids;
  },
}));
