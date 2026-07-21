import { heavyTap } from "@/lib/haptics";
import { strings } from "@/lib/strings";
import { useAlbumSelectionStore } from "@/state/album-selection-store";
import { useTheme } from "@/theme";
import { shellMotion } from "@/theme/motion";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, Keyframe } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShufflePill } from "./shuffle-pill";

// Matches MorphingPill's dock gap so the two pills read as the same system.
const TAB_BAR_CLEARANCE = 12;

const popIn = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.88 }] },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.out(Easing.cubic),
  },
}).duration(shellMotion.duration.base);

const popOut = new Keyframe({
  0: { opacity: 1, transform: [{ scale: 1 }] },
  100: {
    opacity: 0,
    transform: [{ scale: 0.92 }],
    easing: Easing.in(Easing.cubic),
  },
}).duration(shellMotion.duration.fast);

export function AlbumShufflePill({ onShuffle }: { onShuffle: () => void }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const count = useAlbumSelectionStore((s) => s.selectedIds.size);

  if (count === 0) return null;

  const handlePress = () => {
    heavyTap();
    onShuffle();
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: insets.bottom + TAB_BAR_CLEARANCE }]}
    >
      <Animated.View entering={popIn} exiting={popOut}>
        <ShufflePill
          label={strings.pill.shuffleSelected(count)}
          onPress={handlePress}
          bodyColor={theme.accent}
          contentColor={theme.surface}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
