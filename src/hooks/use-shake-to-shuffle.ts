import { Accelerometer } from "expo-sensors";
import { useEffect, useRef } from "react";
import { heavyTap } from "@/lib/haptics";
import { usePreferencesStore } from "@/state/preferences-store";
import { useSlideshowStoreApi } from "@/state/slideshow-store";

// G-vector magnitude thresholds (gravity = ~1g while stationary; a shake
// pushes well above that). Tune on-device — these are first-pass values.
const THRESHOLD_BY_SENSITIVITY = {
  low: 1.8,
  medium: 1.4,
  high: 1.1,
} as const;

const DEBOUNCE_MS = 1500;
const SAMPLE_INTERVAL_MS = 60;

// S-13/S-14 / SM-10α: shake the device during an active slideshow to reshuffle.
// Sensitivity-gated by usePreferencesStore.shakeSensitivity (default 'medium');
// 'off' tears down the listener entirely so we're not waking the sensor for
// nothing. Debounced to one fire per ~1.5s window.
export function useShakeToShuffle() {
  const sensitivity = usePreferencesStore((s) => s.shakeSensitivity);
  const storeApi = useSlideshowStoreApi();
  const lastFireRef = useRef(0);

  useEffect(() => {
    if (sensitivity === "off") return;
    const threshold = THRESHOLD_BY_SENSITIVITY[sensitivity];
    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude < threshold) return;
      const now = Date.now();
      if (now - lastFireRef.current < DEBOUNCE_MS) return;
      const state = storeApi.getState();
      if (state.queue.length === 0) return;
      lastFireRef.current = now;
      heavyTap();
      state.reshuffle();
    });
    return () => subscription.remove();
  }, [sensitivity, storeApi]);
}
