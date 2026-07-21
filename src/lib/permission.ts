import { PermissionStatus } from "expo-media-library";
import type { PermissionState } from "@/queries/use-permission-query";

/**
 * Some platforms have historically reported "limited" through the status
 * field, which the PermissionStatus enum (from expo-modules-core) does not
 * type — it only declares GRANTED | UNDETERMINED | DENIED. Kept as a defensive
 * fallback alongside the real signal, `accessPrivileges`.
 */
const LIMITED = "limited" as PermissionStatus;

export function isPermissionCleared(
  status: PermissionStatus | undefined,
): boolean {
  return status === PermissionStatus.GRANTED || status === LIMITED;
}

/**
 * Limited (partial) access. On iOS 14+ and Android 14+ the library grants
 * `status: "granted"` and marks the restriction on `accessPrivileges`, so
 * checking the status alone always reports false.
 */
export function isPermissionLimited(
  permission: PermissionState | undefined,
): boolean {
  if (permission == null) return false;
  return (
    permission.accessPrivileges === "limited" || permission.status === LIMITED
  );
}
