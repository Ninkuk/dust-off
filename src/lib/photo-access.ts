import { Linking, Platform } from "react-native";
import MediaLibrary from "@/lib/media-library";

/**
 * Widen limited (partial) photo access. iOS can present the system picker
 * in-app; Android has no equivalent, so it falls back to app settings.
 *
 * Shared by the partial-access banner and the empty-state CTA so both routes
 * out of limited access behave identically.
 */
export async function presentPhotoAccessPicker(): Promise<void> {
  if (Platform.OS === "ios") {
    await MediaLibrary.presentPermissionsPickerAsync().catch(() => {});
    return;
  }
  await Linking.openSettings().catch(() => {});
}
