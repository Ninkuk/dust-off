import * as FileSystem from "expo-file-system/legacy";
import MediaLibrary from "@/lib/media-library";

// Copies a MediaLibrary asset into the app cache and returns its file:// URI.
//
// Direct asset URIs aren't reliably shareable: iOS returns `ph://` references
// that can't be handed to a share sheet, and Android's raw file paths to user
// storage trip FileUriExposedException once they leave our process. Copying
// into the app's own cache lets the FileProvider inside expo-sharing /
// react-native-share grant the receiving app real read access.
export async function copyAssetToShareCache(
  assetId: string,
): Promise<string | null> {
  const info = await MediaLibrary.getAssetInfoAsync(assetId);
  const source = info?.localUri;
  if (!source || !FileSystem.cacheDirectory) return null;

  // Preserve the extension so the share sheet can pick a correct MIME type.
  const ext = source.split(".").pop()?.split("?")[0] ?? "jpg";
  const dest = `${FileSystem.cacheDirectory}share-${assetId}.${ext}`;

  // Idempotent delete guards against a stale cache entry from a prior share
  // of the same asset id (e.g. after the underlying file was re-edited).
  await FileSystem.deleteAsync(dest, { idempotent: true });
  await FileSystem.copyAsync({ from: source, to: dest });
  return dest;
}
