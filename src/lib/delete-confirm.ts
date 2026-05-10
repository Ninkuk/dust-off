import { Platform } from "react-native";
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
