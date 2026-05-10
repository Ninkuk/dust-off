import * as Haptics from "expo-haptics";

export const selectionTick = () =>
  Haptics.selectionAsync().catch(() => {});

export const lightTap = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

export const mediumTap = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

export const heavyTap = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

export const successNotify = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {},
  );
