import { useAppStateListener } from "@/hooks/use-app-state-listener";
import { queryClient } from "@/lib/query-client";

export function usePermissionAppStateRefetch() {
  useAppStateListener((next, prev) => {
    if (prev !== "active" && next === "active") {
      queryClient.invalidateQueries({ queryKey: ["permission"] });
    }
  });
}
