import { useQuery } from "@tanstack/react-query";
import type { PermissionStatus } from "expo-media-library";
import MediaLibrary from "@/lib/media-library";

export function usePermissionQuery() {
  return useQuery({
    queryKey: ["permission"] as const,
    queryFn: async (): Promise<PermissionStatus> => {
      const result = await MediaLibrary.getPermissionsAsync();
      return result.status;
    },
    staleTime: Infinity,
  });
}
