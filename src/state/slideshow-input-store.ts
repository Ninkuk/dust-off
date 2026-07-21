import type { Asset } from "expo-media-library";
import { create } from "zustand";

// Single-slot transient bridge for slideshow scopes that can't be encoded as
// query keys: kind='selection' (ad-hoc IDs from gallery selection) and
// kind='union' (multi-source picker output, where iOS Asset.albumId is often
// not populated for assets fetched via the 'all' query — so we can't resolve
// the union by filtering the cache by albumId at the theater).
//
// Two independent single-slot channels:
// - ids (pendingIds / setInput / takeInput): kind='selection'. IDs always
//   come from the 'all' cache, so the theater can safely resolve them by
//   filtering 'all'.
// - assets (pendingAssets / setAssets / takeAssets): kind='union'. The
//   resolver may include assets that are NOT yet in the 'all' cache (see
//   src/lib/source-resolver.ts), so full Assets are carried across the
//   bridge to avoid silently dropping them.
//
// Producer (action / picker) calls setInput(ids) or setAssets(assets) before
// router.push. Theater calls takeInput()/takeAssets() once on mount:
// read-and-clear in one step so a remount or back-nav doesn't re-consume
// stale data. The mutating-getter shape is deliberate — call sites read as
// `const ids = ...takeInput()`, signaling drain semantics. The two channels
// are independent: draining one never affects the other.
type SlideshowInputState = {
  pendingIds: readonly string[] | null;
  pendingAssets: readonly Asset[] | null;
  setInput: (ids: readonly string[]) => void;
  setAssets: (assets: readonly Asset[]) => void;
  takeInput: () => readonly string[] | null;
  takeAssets: () => readonly Asset[] | null;
};

export const useSlideshowInputStore = create<SlideshowInputState>((set, get) => ({
  pendingIds: null,
  pendingAssets: null,
  setInput: (ids) => set({ pendingIds: ids }),
  setAssets: (assets) => set({ pendingAssets: assets }),
  takeInput: () => {
    const ids = get().pendingIds;
    if (ids !== null) set({ pendingIds: null });
    return ids;
  },
  takeAssets: () => {
    const assets = get().pendingAssets;
    if (assets !== null) set({ pendingAssets: null });
    return assets;
  },
}));
