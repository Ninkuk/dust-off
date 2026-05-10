import type { Asset } from "expo-media-library";
import { router } from "expo-router";
import { useCallback } from "react";
import { seededShuffle } from "@/lib/seeded-shuffle";
import type { ViewerSourceKind } from "@/lib/source-set";
import { useGalleryStore } from "@/state/gallery-store";

export type StartSlideshowOptions = {
  source: ViewerSourceKind;
  albumId?: string;
  assets: readonly Asset[];
};

// Pill-Shuffle entry point. Computes the queue head against the current
// gallery seed (so gallery and slideshow agree on shuffle order) and pushes
// to theater with autoplay=1. The theater screen re-runs the same shuffle
// internally — the queue head matches because the seed is shared.
export function useStartSlideshow() {
  return useCallback((opts: StartSlideshowOptions) => {
    if (opts.assets.length === 0) return;
    const seed = useGalleryStore.getState().seed;
    const first = seededShuffle(opts.assets, seed)[0];
    if (!first) return;
    router.push({
      pathname: "/theater/[assetId]",
      params: {
        assetId: first.id,
        kind: opts.source,
        ...(opts.albumId ? { albumId: opts.albumId } : {}),
        autoplay: "1",
      },
    });
  }, []);
}
