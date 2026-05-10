import { router } from "expo-router";
import type { PermissionStatus } from "expo-media-library";
import MediaLibrary from "@/lib/media-library";
import { isPermissionCleared } from "@/lib/permission";
import { queryClient } from "@/lib/query-client";
import { usePreferencesStore } from "@/state/preferences-store";

export function useOnboardingComplete(): () => Promise<void> {
  return async () => {
    // Set the flag BEFORE the system prompt so killing the app mid-prompt
    // doesn't re-show the cards on next launch (the system dialog can
    // resurface on its own). Per SM-13.
    usePreferencesStore.getState().setPreference("hasSeenOnboarding", true);
    const { status } = await MediaLibrary.requestPermissionsAsync();
    queryClient.setQueryData<PermissionStatus>(["permission"], status);
    router.replace(isPermissionCleared(status) ? "/" : "/denied");
  };
}
