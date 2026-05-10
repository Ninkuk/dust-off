import { PermissionStatus } from "expo-media-library";

/**
 * expo-media-library returns "limited" at runtime for iOS partial access,
 * but the PermissionStatus enum (from expo-modules-core) only types
 * GRANTED | UNDETERMINED | DENIED. Treat both granted and limited as
 * "cleared to use the app" per D-4.
 */
export function isPermissionCleared(
  status: PermissionStatus | undefined,
): boolean {
  if (!status) return false;
  return status === PermissionStatus.GRANTED || (status as string) === "limited";
}
