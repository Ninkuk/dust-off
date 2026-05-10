import { useQuery } from "@tanstack/react-query";
import type { Asset } from "expo-media-library";
import MediaLibrary from "@/lib/media-library";
import { pickIndexFromSeed } from "@/lib/seeded-shuffle";

const SAMPLE_SIZE = 30;
const COVER_GC_MS = 5 * 60 * 1000;

// Keying on `seed` makes cold-start reseeding (DS-14) invalidate last session's
// covers automatically. `gcTime` bounds the cache so backgrounded sessions
// don't accumulate stale entries.
export function useAlbumCoverQuery(albumId: string, seed: number) {
  return useQuery<Asset | null>({
    queryKey: ["album-cover", albumId, seed] as const,
    queryFn: async () => {
      const page = await MediaLibrary.getAssetsAsync({
        album: albumId,
        first: SAMPLE_SIZE,
        mediaType: ["photo"],
        sortBy: ["creationTime"],
      });
      if (page.assets.length === 0) return null;
      const idx = pickIndexFromSeed(albumId, seed, page.assets.length);
      return page.assets[idx];
    },
    staleTime: Infinity,
    gcTime: COVER_GC_MS,
  });
}
