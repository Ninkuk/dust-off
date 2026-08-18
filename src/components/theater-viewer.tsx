import { Image } from "expo-image";
import type { Asset } from "expo-media-library";
import { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { strings } from "@/lib/strings";
import { usePreferencesStore } from "@/state/preferences-store";
import { reducedMotion, theaterMotion } from "@/theme";

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
  onLongPressBegin,
  onLongPressCommit,
  onLongPressCancel,
  onDoubleTap,
  onImageError,
  onPinchStart,
  accessibilityLabel,
}: {
  asset: Asset;
  onPrev: () => void;
  onNext: () => void;
  onDismiss: () => void;
  onTapCenter: () => void;
  onLongPressBegin: (x: number, y: number) => void;
  onLongPressCommit: () => void;
  onLongPressCancel: () => void;
  onDoubleTap: () => void;
  onImageError?: () => void;
  onPinchStart?: () => void;
  /** Describes the current photo and queue position to assistive tech. */
  accessibilityLabel?: string;
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

  const reduceMotion = useReducedMotion();

  // Drives <LongPressRing>
  const direction = useSharedValue<"none" | "horiz" | "vert">("none");

  const pinchHasFired = useSharedValue(false);

  // Two-layer cross-fade. The "front" layer holds the currently-visible asset;
  // the "back" layer is repainted with the incoming asset on `asset.id` change
  // and faded in. After the fade completes, frontIsA flips so the next
  // transition reuses the just-vacated layer.
  const [slotA, setSlotA] = useState<Asset>(asset);
  const [slotB, setSlotB] = useState<Asset | null>(null);
  const [frontIsA, setFrontIsA] = useState(true);
  const opacityA = useSharedValue(1);
  const opacityB = useSharedValue(0);

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

  // Cross-fade transition driver. Watches asset.id and animates the layer
  // swap. Reads slideTransition imperatively (not subscribed) so a settings
  // change mid-session doesn't retrigger transitions; the next asset change
  // will pick up the new value.
  useEffect(() => {
    const front = frontIsA ? slotA : slotB;
    if (front?.id === asset.id) return; // already showing it
    const transition = usePreferencesStore.getState().slideTransition;
    // Reduce Motion collapses the fade without forcing the user to discover
    // Settings → Transition → "Hard cut" for themselves.
    const duration =
      transition === "cross-fade" && !reduceMotion
        ? theaterMotion.duration.crossfade
        : reducedMotion.instant;
    if (frontIsA) {
      setSlotB(asset);
      opacityA.value = withTiming(0, { duration });
      opacityB.value = withTiming(1, { duration }, (done) => {
        if (done) runOnJS(setFrontIsA)(false);
      });
    } else {
      setSlotA(asset);
      opacityB.value = withTiming(0, { duration });
      opacityA.value = withTiming(1, { duration }, (done) => {
        if (done) runOnJS(setFrontIsA)(true);
      });
    }
    // frontIsA / slotA / slotB are read inside the effect but the trigger is
    // asset.id — including them would re-run on every layer swap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.id]);

  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
      pinchHasFired.value = false;
    })
    .onUpdate((e) => {
      scale.value = Math.min(
        SCALE_MAX,
        Math.max(SCALE_MIN, savedScale.value * e.scale),
      );
      if (
        scale.value > ZOOM_THRESHOLD &&
        !pinchHasFired.value &&
        onPinchStart
      ) {
        pinchHasFired.value = true;
        runOnJS(onPinchStart)();
      }
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

  const styleA = useAnimatedStyle(() => ({ opacity: opacityA.value }));
  const styleB = useAnimatedStyle(() => ({ opacity: opacityB.value }));

  // The currently-visible asset is whichever layer is in front. Used as the
  // event sink for onError so a render failure on the *displayed* photo
  // triggers the skip — back-layer prefetch errors are ignored (they self-
  // correct on the next transition).
  const visibleAssetId = (frontIsA ? slotA : slotB)?.id;

  return (
    <GestureDetector gesture={composed}>
      {/* The gesture surface is the product; without these props a screen
          reader can reach the theater and then operate none of it. "adjustable"
          maps VoiceOver's swipe-up/down onto next/previous, and magic-tap onto
          favourite, so every gesture has a non-gestural equivalent. */}
      <Animated.View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={strings.theater.doubleTapA11y}
        accessibilityActions={[
          { name: "increment", label: strings.theater.nextA11y },
          { name: "decrement", label: strings.theater.prevA11y },
          { name: "activate", label: strings.theater.playPauseA11y },
          { name: "longpress", label: strings.theater.longPressA11y },
          { name: "magicTap", label: strings.theater.doubleTapA11y },
        ]}
        onAccessibilityAction={(event) => {
          switch (event.nativeEvent.actionName) {
            case "increment":
              onNext();
              break;
            case "decrement":
              onPrev();
              break;
            case "activate":
              onTapCenter();
              break;
            case "longpress":
              onLongPressCommit();
              break;
            case "magicTap":
              onDoubleTap();
              break;
          }
        }}
        style={[styles.surface, animatedStyle]}
      >
        <Animated.View
          style={[styles.layer, styleA]}
          pointerEvents="none"
        >
          <Image
            source={{ uri: slotA.uri }}
            style={styles.image}
            contentFit="contain"
            recyclingKey={slotA.id}
            cachePolicy="memory-disk"
            transition={0}
            onError={
              visibleAssetId === slotA.id ? onImageError : undefined
            }
          />
        </Animated.View>
        {slotB ? (
          <Animated.View
            style={[styles.layer, styleB]}
            pointerEvents="none"
          >
            <Image
              source={{ uri: slotB.uri }}
              style={styles.image}
              contentFit="contain"
              recyclingKey={slotB.id}
              cachePolicy="memory-disk"
              transition={0}
              onError={
                visibleAssetId === slotB.id ? onImageError : undefined
              }
            />
          </Animated.View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  surface: {
    flex: 1,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    flex: 1,
  },
});
