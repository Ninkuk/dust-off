import { useQuery } from "@tanstack/react-query";
import type { PermissionStatus } from "expo-media-library";

export function usePermissionQuery() {
  return useQuery({
    queryKey: ["permission"] as const,
    queryFn: async (): Promise<PermissionStatus> =>
      "undetermined" as PermissionStatus,
    staleTime: Infinity,
  });
}
