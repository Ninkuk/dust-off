import { useQuery } from "@tanstack/react-query";
import type { Album } from "expo-media-library";
import MediaLibrary from "@/lib/media-library";

export function useAlbumsQuery(options?: { enabled?: boolean }) {
  return useQuery<Album[]>({
    queryKey: ["albums"] as const,
    queryFn: () => MediaLibrary.getAlbumsAsync(),
    enabled: options?.enabled,
    staleTime: Infinity,
  });
}
