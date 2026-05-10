import { create } from "zustand";

type GalleryStore = {
  seed: number;
};

export const useGalleryStore = create<GalleryStore>(() => ({
  seed: Date.now() | 0,
}));
