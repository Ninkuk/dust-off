import { useCallback } from "react";
import { successNotify } from "@/lib/haptics";
import { strings } from "@/lib/strings";
import { useGalleryStore } from "@/state/gallery-store";
import { usePreferencesStore } from "@/state/preferences-store";
import { useToastStore } from "@/state/toast-store";

export function useReshuffleGallery() {
  return useCallback((anchorIds?: readonly string[]) => {
    successNotify();
    usePreferencesStore.getState().setPreference("defaultSort", "random");
    useGalleryStore.getState().reshuffle(anchorIds);
    useToastStore.getState().show({
      kind: "flash",
      message: strings.toast.reshuffled,
    });
  }, []);
}
