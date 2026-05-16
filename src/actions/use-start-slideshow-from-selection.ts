import type { Asset } from "expo-media-library";
import { router } from "expo-router";
import { useCallback } from "react";
import { seededShuffle } from "@/lib/seeded-shuffle";
import { useGalleryStore } from "@/state/gallery-store";
import { useSelectionStore } from "@/state/selection-store";
import { useSlideshowInputStore } from "@/state/slideshow-input-store";

// Selection-driven slideshow entry point (SM-13). Snapshots the current
// selection, filters allAssets to it, writes the resolved ID list to the
// bridge store, and routes to theater with kind=selection. Theater consumes
// the bridge on mount.
//
// We do NOT cancel selection here — SM-12 says selection persists when
// returning to gallery.
//
// Empty selection → /theater/empty (D-7 fail-at-start). Defensive; the
// `Slideshow these N` row is disabled when selection is empty.
export function useStartSlideshowFromSelection() {
  return useCallback((allAssets: readonly Asset[]) => {
    const selectedIds = useSelectionStore.getState().selectedIds;
    if (selectedIds.size === 0) {
      router.push("/theater/empty");
      return;
    }
    const filtered = allAssets.filter((a) => selectedIds.has(a.id));
    if (filtered.length === 0) {
      router.push("/theater/empty");
      return;
    }
    const seed = useGalleryStore.getState().seed;
    const first = seededShuffle(filtered, seed)[0];
    if (!first) return;
    useSlideshowInputStore
      .getState()
      .setInput(filtered.map((a) => a.id));
    router.push({
      pathname: "/theater/[assetId]",
      params: {
        assetId: first.id,
        kind: "selection",
        autoplay: "1",
      },
    });
  }, []);
}
