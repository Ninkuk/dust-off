import { router } from "expo-router";
import MediaLibrary from "@/lib/media-library";
import { isPermissionCleared } from "@/lib/permission";
import { queryClient } from "@/lib/query-client";
import type { PermissionState } from "@/queries/use-permission-query";
import { usePreferencesStore } from "@/state/preferences-store";

export function useOnboardingComplete(): () => Promise<void> {
  return async () => {
    // Set the flag BEFORE the system prompt so killing the app mid-prompt
    // doesn't re-show the cards on next launch (the system dialog can
    // resurface on its own). Per SM-13.
    usePreferencesStore.getState().setPreference("hasSeenOnboarding", true);
    const result = await MediaLibrary.requestPermissionsAsync();
    // Must match the shape usePermissionQuery stores. Seeding a bare status
    // here would leave every reader's `.status` undefined, bouncing a user who
    // just granted access straight to /denied.
    queryClient.setQueryData<PermissionState>(["permission"], {
      status: result.status,
      accessPrivileges: result.accessPrivileges,
    });
    router.replace(isPermissionCleared(result.status) ? "/" : "/denied");
  };
}
