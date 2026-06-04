import { strings } from "@/lib/strings";
import { useSlideshowStore } from "@/state/slideshow-store";
import { useTheme } from "@/theme";
import { FolderOpen, Heart, Info, Share2, Trash2 } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FADE_MS = 220;
const ICON_SIZE = 24;
const STROKE = 1.5;

type Props = {
  isFavorited: boolean;
  hasAlbum: boolean;
  onFavorite: () => void;
  onUnfavorite: () => void;
  onShare: () => void;
  onDelete: () => void;
  onShowInfo: () => void;
  onGoToFolder: () => void;
};

export function TheaterPauseControls({
  isFavorited,
  hasAlbum,
  onFavorite,
  onUnfavorite,
  onShare,
  onDelete,
  onShowInfo,
  onGoToFolder,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isPlaying = useSlideshowStore((s) => s.isPlaying);
  const opacity = useSharedValue(isPlaying ? 0 : 1);

  useEffect(() => {
    opacity.value = withTiming(isPlaying ? 0 : 1, { duration: FADE_MS });
  }, [isPlaying, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const m = strings.theater.longPressMenu;
  const heartLabel = isFavorited ? m.unfavorite : m.favorite;
  const heartPress = isFavorited ? onUnfavorite : onFavorite;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { paddingBottom: insets.bottom + 12 },
        animatedStyle,
      ]}
    >
      <View style={styles.row} pointerEvents="box-none">
        <IconButton label={heartLabel} onPress={heartPress}>
          <Heart
            size={ICON_SIZE}
            strokeWidth={STROKE}
            color={theme.textPrimary}
            fill={isFavorited ? theme.textPrimary : "transparent"}
          />
        </IconButton>
        <IconButton label={m.share} onPress={onShare}>
          <Share2
            size={ICON_SIZE}
            strokeWidth={STROKE}
            color={theme.textPrimary}
          />
        </IconButton>
        <IconButton label={m.info} onPress={onShowInfo}>
          <Info
            size={ICON_SIZE}
            strokeWidth={STROKE}
            color={theme.textPrimary}
          />
        </IconButton>
        <IconButton
          label={m.goToFolder}
          onPress={onGoToFolder}
          disabled={!hasAlbum}
        >
          <FolderOpen
            size={ICON_SIZE}
            strokeWidth={STROKE}
            color={theme.textPrimary}
          />
        </IconButton>
        <IconButton label={m.delete} onPress={onDelete}>
          <Trash2 size={ICON_SIZE} strokeWidth={STROKE} color={theme.danger} />
        </IconButton>
      </View>
    </Animated.View>
  );
}

function IconButton({
  label,
  onPress,
  disabled = false,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={disabled ? { disabled: true } : undefined}
      style={({ pressed }) => [
        styles.button,
        { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
});
