import { useQuery } from "@tanstack/react-query";
import type { Asset } from "expo-media-library";
import { sourceSetKey, type SourceSet } from "@/lib/source-set";

export function useAssetsQuery(source: SourceSet) {
  return useQuery({
    queryKey: ["assets", sourceSetKey(source)] as const,
    queryFn: async (): Promise<Asset[]> => [],
    staleTime: Infinity,
  });
}
