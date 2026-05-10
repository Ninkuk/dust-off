import { create } from "zustand";

type GalleryStore = {
  seed: number;
  anchorIds: ReadonlySet<string> | null;
  reshuffle: (anchorIds?: readonly string[]) => void;
};

export const useGalleryStore = create<GalleryStore>((set) => ({
  seed: Date.now() | 0,
  anchorIds: null,
  reshuffle: (anchorIds) =>
    set({
      seed: Date.now() | 0,
      anchorIds:
        anchorIds && anchorIds.length > 0 ? new Set(anchorIds) : null,
    }),
}));
