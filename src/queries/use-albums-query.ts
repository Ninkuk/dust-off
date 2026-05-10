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

export function useAlbumTitle(albumId: string | undefined): string | undefined {
  const albumsQuery = useAlbumsQuery();
  if (!albumId) return undefined;
  return albumsQuery.data?.find((a) => a.id === albumId)?.title;
}
