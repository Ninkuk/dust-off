import { useQuery } from "@tanstack/react-query";
import type { PermissionStatus } from "expo-media-library";
import MediaLibrary from "@/lib/media-library";

/**
 * iOS partial access reports `status: "granted"` and signals the restriction
 * separately via `accessPrivileges`. Keeping only the status would erase the
 * limited state entirely, so both fields are carried through.
 */
export type PermissionState = {
  status: PermissionStatus;
  accessPrivileges?: "all" | "limited" | "none";
};

export function usePermissionQuery() {
  return useQuery({
    queryKey: ["permission"] as const,
    queryFn: async (): Promise<PermissionState> => {
      const result = await MediaLibrary.getPermissionsAsync();
      return {
        status: result.status,
        accessPrivileges: result.accessPrivileges,
      };
    },
    staleTime: Infinity,
  });
}
