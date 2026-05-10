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
      ? c.bodyIos
      : platform === "android-new"
        ? c.bodyAndroidNew
        : c.bodyAndroidOld;
  return {
    title,
    body,
    destructiveLabel: c.delete(count),
    cancelLabel: c.cancel,
  };
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
