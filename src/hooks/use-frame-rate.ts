import { useState } from "react";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export function useFrameRate(): number {
  const [fps, setFps] = useState(0);
  const frameCount = useSharedValue(0);
  const windowStart = useSharedValue(0);

  useFrameCallback((info) => {
    "worklet";
    if (windowStart.value === 0) {
      windowStart.value = info.timestamp;
    }
    frameCount.value += 1;
    const elapsed = info.timestamp - windowStart.value;
    if (elapsed >= 1000) {
      const measured = (frameCount.value * 1000) / elapsed;
      scheduleOnRN(setFps, Math.round(measured));
      frameCount.value = 0;
      windowStart.value = info.timestamp;
    }
  });

  return fps;
}
