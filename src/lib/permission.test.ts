import { PermissionStatus } from "expo-media-library";
import { isPermissionCleared, isPermissionLimited } from "@/lib/permission";
import type { PermissionState } from "@/queries/use-permission-query";

const state = (
  status: PermissionStatus,
  accessPrivileges?: PermissionState["accessPrivileges"],
): PermissionState => ({ status, accessPrivileges });

describe("isPermissionCleared", () => {
  it("clears granted", () => {
    expect(isPermissionCleared(PermissionStatus.GRANTED)).toBe(true);
  });

  it("does not clear denied or undetermined", () => {
    expect(isPermissionCleared(PermissionStatus.DENIED)).toBe(false);
    expect(isPermissionCleared(PermissionStatus.UNDETERMINED)).toBe(false);
    expect(isPermissionCleared(undefined)).toBe(false);
  });
});

describe("isPermissionLimited", () => {
  // The shipped bug: iOS partial access reports status "granted" and marks the
  // restriction only on accessPrivileges. Checking status alone was always
  // false, so the partial-access banner never mounted and a limited user got
  // no signal and no way to widen access.
  it("detects limited access reported via accessPrivileges", () => {
    expect(isPermissionLimited(state(PermissionStatus.GRANTED, "limited"))).toBe(
      true,
    );
  });

  it("does not report limited for full access", () => {
    expect(isPermissionLimited(state(PermissionStatus.GRANTED, "all"))).toBe(
      false,
    );
  });

  it("does not report limited when access is denied", () => {
    expect(isPermissionLimited(state(PermissionStatus.DENIED, "none"))).toBe(
      false,
    );
  });

  it("tolerates a missing accessPrivileges field", () => {
    expect(isPermissionLimited(state(PermissionStatus.GRANTED))).toBe(false);
    expect(isPermissionLimited(undefined)).toBe(false);
  });

  it("still honours a status-reported limited value", () => {
    const legacy = { status: "limited" as PermissionStatus };
    expect(isPermissionLimited(legacy)).toBe(true);
  });
});
