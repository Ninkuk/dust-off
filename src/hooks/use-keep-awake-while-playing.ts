import {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
} from "expo-keep-awake";
import { useEffect } from "react";
import { useSlideshowStore } from "@/state/slideshow-store";

const KEEP_AWAKE_TAG = "dust-off.slideshow";

export function useKeepAwakeWhilePlaying() {
  const isPlaying = useSlideshowStore((s) => s.isPlaying);
  useEffect(() => {
    if (!isPlaying) return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, [isPlaying]);
}
