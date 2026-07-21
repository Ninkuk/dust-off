import { Alert, Platform } from "react-native";
import { strings } from "@/lib/strings";

export type DeletePlatform = "ios" | "android-new" | "android-old";

export function getDeletePlatform(): DeletePlatform {
  if (Platform.OS === "ios") return "ios";
  if (typeof Platform.Version === "number" && Platform.Version >= 30) {
    return "android-new";
  }
  return "android-old";
}

export type DeleteConfirm = {
  title: string;
  body: string;
  destructiveLabel: string;
  cancelLabel: string;
};

export function getDeleteConfirm(
  count: number,
  platform: DeletePlatform = getDeletePlatform(),
): DeleteConfirm {
  const c = strings.deleteConfirm;
  const title = count === 1 ? c.titleSingle : c.titleBulk(count);
  const body =
    platform === "ios"
      ? c.bodyIos(count)
      : platform === "android-new"
        ? c.bodyAndroidNew(count)
        : c.bodyAndroidOld(count);
  return {
    title,
    body,
    destructiveLabel: c.delete(count),
    cancelLabel: c.cancel,
  };
}

/**
 * True when the platform shows its own delete confirmation during
 * `deleteAssetsAsync`. Callers must NOT optimistically remove assets from the
 * cache in that case: the user has not consented yet, and cancelling the system
 * dialog would make tiles vanish and flicker back.
 */
export function osConfirmsDelete(
  platform: DeletePlatform = getDeletePlatform(),
): boolean {
  return platform !== "android-old";
}

/** Post-delete confirmation copy naming where the photos actually went. */
export function getDeleteResultMessage(
  count: number,
  platform: DeletePlatform = getDeletePlatform(),
): string {
  const r = strings.deleteResult;
  if (platform === "ios") return r.ios(count);
  if (platform === "android-new") return r.androidNew(count);
  return r.androidOld(count);
}

// Only Android <11 has no OS-level trash dialog after deleteAssetsAsync — on
// iOS and Android ≥11 we let the system handle confirmation to avoid
// double-confirm UX. Returns true when the caller should proceed.
export function confirmDeleteIfNeeded(count: number): Promise<boolean> {
  if (getDeletePlatform() !== "android-old") return Promise.resolve(true);
  const c = getDeleteConfirm(count, "android-old");
  return new Promise((resolve) => {
    Alert.alert(
      c.title,
      c.body,
      [
        {
          text: c.cancelLabel,
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: c.destructiveLabel,
          style: "destructive",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
