import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback } from "react";
import { seededShuffle } from "@/lib/seeded-shuffle";
import { resolveSourceSet } from "@/lib/source-resolver";
import {
  FAVORITES_ALBUM_ID,
  type PersistableSourceSet,
} from "@/lib/source-set";
import { strings } from "@/lib/strings";
import { useAlbumSelectionStore } from "@/state/album-selection-store";
import { useGalleryStore } from "@/state/gallery-store";
import { useSlideshowInputStore } from "@/state/slideshow-input-store";
import { useToastStore } from "@/state/toast-store";

// Albums-tab multi-select shuffle entry point. Reads the album selection set
// (Favorites is FAVORITES_ALBUM_ID), collapses to the simplest SourceSet, then
// resolves + navigates. Empty selection / zero matches → /theater/empty.
// Selection is NOT cleared (parity with the gallery photo-selection flow).
export function useStartSlideshowFromAlbumSelection() {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    const selectedIds = useAlbumSelectionStore.getState().selectedIds;
    if (selectedIds.size === 0) {
      router.push("/theater/empty");
      return;
    }
    const includeFavorites = selectedIds.has(FAVORITES_ALBUM_ID);
    const albumIds = [...selectedIds].filter((id) => id !== FAVORITES_ALBUM_ID);

    const source: PersistableSourceSet =
      albumIds.length === 0
        ? { kind: "favorites" }
        : albumIds.length === 1 && !includeFavorites
          ? { kind: "album", albumId: albumIds[0] }
          : {
              kind: "union",
              albumIds,
              includeFavorites,
            };

    try {
      const resolved = await resolveSourceSet(source, queryClient);
      if (resolved.length === 0) {
        router.push("/theater/empty");
        return;
      }

      const seed = useGalleryStore.getState().seed;
      const first = seededShuffle(resolved, seed)[0];
      if (!first) return;

      if (source.kind === "union") {
        useSlideshowInputStore.getState().setAssets(resolved);
      }

      router.push({
        pathname: "/theater/[assetId]",
        params: {
          assetId: first.id,
          kind: source.kind,
          ...(source.kind === "album" ? { albumId: source.albumId } : {}),
          autoplay: "1",
        },
      });
    } catch (e) {
      console.warn("[shuffle] album-selection slideshow failed", e);
      useToastStore.getState().show({
        kind: "flash",
        message: strings.toast.slideshowFailed,
      });
    }
  }, [queryClient]);
}
