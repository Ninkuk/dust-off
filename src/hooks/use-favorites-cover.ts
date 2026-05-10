import type { Asset } from "expo-media-library";
import { pickIndexFromSeed } from "@/lib/seeded-shuffle";
import { FAVORITES_ALBUM_ID } from "@/lib/source-set";
import { useFavoritesAssetsQuery } from "@/queries/use-assets-query";
import { useGalleryStore } from "@/state/gallery-store";

export function useFavoritesCover(): Asset | null {
  const seed = useGalleryStore((s) => s.seed);
  const { data: matches } = useFavoritesAssetsQuery();

  if (matches.length === 0) return null;
  const idx = pickIndexFromSeed(FAVORITES_ALBUM_ID, seed, matches.length);
  return matches[idx];
}
