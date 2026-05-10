import { Image } from "expo-image";
import type { Asset } from "expo-media-library";
import { useEffect } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { theaterMotion } from "@/theme";

const HORIZ_COMMIT_RATIO = 0.25;
const HORIZ_COMMIT_VELOCITY = 800;
const VERT_COMMIT_PX = 120;
const VERT_COMMIT_VELOCITY = 900;
const PAN_DIRECTION_THRESHOLD = 8;
const ZOOM_THRESHOLD = 1.001;
const LONG_PRESS_MS = 400;
const SCALE_MIN = 1;
const SCALE_MAX = 4;

export function TheaterViewer({
  asset,
  onPrev,
  onNext,
  onDismiss,
  onTapCenter,
  onTapEdgeRevealsChrome,
  onLongPressBegin,
  onLongPressCommit,
  onLongPressCancel,
  onDoubleTap,
}: {
  asset: Asset;
  onPrev: () => void;
  onNext: () => void;
  onDismiss: () => void;
  onTapCenter: () => void;
  onTapEdgeRevealsChrome: () => void;
  onLongPressBegin: (x: number, y: number) => void;
  onLongPressCommit: () => void;
  onLongPressCancel: () => void;
  onDoubleTap: () => void;
}) {
  const { width } = useWindowDimensions();

  // Zoom + pan-while-zoomed. RNGH gestures yield deltas relative to gesture
  // start, not absolutes — so we snapshot the committed value at gesture begin
  // and apply the delta on top, otherwise consecutive pinches/pans reset to 1×.
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTy = useSharedValue(0);

  // Horizontal nav + swipe-down dismiss
  const pageX = useSharedValue(0);
  const dismissY = useSharedValue(0);

  // Drives <LongPressRing>
  const direction = useSharedValue<"none" | "horiz" | "vert">("none");

  // Reset transient values when the asset swaps so the new image starts clean.
  // Reanimated shared values are stable refs; listing them keeps the linter
  // happy without affecting effect behavior.
  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    tx.value = 0;
    savedTx.value = 0;
    ty.value = 0;
    savedTy.value = 0;
    pageX.value = 0;
    dismissY.value = 0;
  }, [
    asset.id,
    scale,
    savedScale,
    tx,
    savedTx,
    ty,
    savedTy,
    pageX,
    dismissY,
  ]);

  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.min(
        SCALE_MAX,
        Math.max(SCALE_MIN, savedScale.value * e.scale),
      );
    })
    .onEnd(() => {
      if (scale.value <= ZOOM_THRESHOLD) {
        scale.value = withSpring(1, theaterMotion.spring);
        tx.value = withSpring(0, theaterMotion.spring);
        ty.value = withSpring(0, theaterMotion.spring);
        savedScale.value = 1;
        savedTx.value = 0;
        savedTy.value = 0;
      } else {
        savedScale.value = scale.value;
        savedTx.value = tx.value;
        savedTy.value = ty.value;
      }
    });

  const pan = Gesture.Pan()
    .onBegin(() => {
      direction.value = "none";
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    })
    .onUpdate((e) => {
      // Branch on zoom: zoomed = pan the image; unzoomed = nav or dismiss.
      if (scale.value > ZOOM_THRESHOLD) {
        tx.value = savedTx.value + e.translationX;
        ty.value = savedTy.value + e.translationY;
        return;
      }
      if (direction.value === "none") {
        if (
          Math.abs(e.translationX) > PAN_DIRECTION_THRESHOLD ||
          Math.abs(e.translationY) > PAN_DIRECTION_THRESHOLD
        ) {
          if (Math.abs(e.translationX) > Math.abs(e.translationY)) {
            direction.value = "horiz";
          } else if (e.translationY > 0) {
            direction.value = "vert";
          }
        }
      }
      if (direction.value === "horiz") {
        pageX.value = e.translationX;
      } else if (direction.value === "vert") {
        dismissY.value = Math.max(0, e.translationY);
      }
    })
    .onEnd((e) => {
      if (scale.value > ZOOM_THRESHOLD) {
        // Pan-while-zoomed released: commit the new pan offset so the next
        // gesture starts from here.
        savedTx.value = tx.value;
        savedTy.value = ty.value;
        return;
      }
      if (direction.value === "horiz") {
        const threshold = width * HORIZ_COMMIT_RATIO;
        if (
          e.translationX < -threshold ||
          e.velocityX < -HORIZ_COMMIT_VELOCITY
        ) {
          pageX.value = 0;
          runOnJS(onNext)();
        } else if (
          e.translationX > threshold ||
          e.velocityX > HORIZ_COMMIT_VELOCITY
        ) {
          pageX.value = 0;
          runOnJS(onPrev)();
        } else {
          pageX.value = withSpring(0, theaterMotion.spring);
        }
      } else if (direction.value === "vert") {
        if (
          e.translationY > VERT_COMMIT_PX ||
          e.velocityY > VERT_COMMIT_VELOCITY
        ) {
          dismissY.value = 0;
          runOnJS(onDismiss)();
        } else {
          dismissY.value = withSpring(0, theaterMotion.spring);
        }
      }
      direction.value = "none";
    });

  const longPress = Gesture.LongPress()
    .minDuration(LONG_PRESS_MS)
    .onTouchesDown((e) => {
      const t = e.allTouches[0];
      if (!t) return;
      runOnJS(onLongPressBegin)(t.x, t.y);
    })
    .onStart(() => {
      runOnJS(onLongPressCommit)();
    })
    .onFinalize((_e, success) => {
      // success === true => onStart already fired; the menu owns the visual now.
      // success === false => the user moved or released too early; reset the ring.
      if (!success) runOnJS(onLongPressCancel)();
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > ZOOM_THRESHOLD) return;
      runOnJS(onDoubleTap)();
    });

  const tap = Gesture.Tap()
    .numberOfTaps(1)
    .requireExternalGestureToFail(doubleTap)
    .onEnd((e) => {
      runOnJS(onTapEdgeRevealsChrome)();
      const x = e.x;
      if (x < width * 0.33) runOnJS(onPrev)();
      else if (x > width * 0.66) runOnJS(onNext)();
      else runOnJS(onTapCenter)();
    });

  const composed = Gesture.Simultaneous(
    pinch,
    pan,
    Gesture.Exclusive(longPress, doubleTap, tap),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pageX.value + tx.value },
      { translateY: dismissY.value + ty.value },
      { scale: scale.value },
    ],
    // Subtle fade as the user pulls the photo down — confirms intent.
    opacity: dismissY.value > 0 ? Math.max(0.5, 1 - dismissY.value / 600) : 1,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.surface, animatedStyle]}>
        <Image
          source={{ uri: asset.uri }}
          style={styles.image}
          contentFit="contain"
          recyclingKey={asset.id}
          cachePolicy="memory-disk"
          transition={0}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  surface: {
    flex: 1,
  },
  image: {
    flex: 1,
  },
});
