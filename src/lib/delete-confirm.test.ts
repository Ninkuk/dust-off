import {
  getDeleteConfirm,
  getDeleteResultMessage,
  osConfirmsDelete,
} from "@/lib/delete-confirm";

describe("osConfirmsDelete", () => {
  // Drives whether the cache may be emptied before the user has consented.
  it("is true where the system raises its own dialog", () => {
    expect(osConfirmsDelete("ios")).toBe(true);
    expect(osConfirmsDelete("android-new")).toBe(true);
  });

  it("is false on Android <11, where the app asks", () => {
    expect(osConfirmsDelete("android-old")).toBe(false);
  });
});

describe("getDeleteConfirm copy", () => {
  it("pluralises the title", () => {
    expect(getDeleteConfirm(1, "ios").title).toBe("Delete photo?");
    expect(getDeleteConfirm(12, "ios").title).toBe("Delete 12 photos?");
  });

  // Bodies were singular regardless of count, so a bulk delete read
  // "This photo will be moved…" for 300 photos.
  it("pluralises the body on every platform", () => {
    expect(getDeleteConfirm(1, "ios").body).toContain("This photo");
    expect(getDeleteConfirm(9, "ios").body).toContain("These 9 photos");
    expect(getDeleteConfirm(9, "android-new").body).toContain("These 9 photos");
    expect(getDeleteConfirm(9, "android-old").body).toContain("These 9 photos");
  });

  it("names the platform's recovery location", () => {
    expect(getDeleteConfirm(1, "ios").body).toContain("Recently Deleted");
    expect(getDeleteConfirm(1, "android-new").body).toContain("Trash");
  });
});

describe("getDeleteResultMessage", () => {
  // "Gone." said nothing about recoverability; the post-delete message is the
  // one place the app can reinforce what the OS just told the user.
  it("names where the photos went", () => {
    expect(getDeleteResultMessage(1, "ios")).toContain("Recently Deleted");
    expect(getDeleteResultMessage(1, "android-new")).toContain("Trash");
  });

  it("pluralises with a count", () => {
    expect(getDeleteResultMessage(300, "ios")).toContain("300");
    expect(getDeleteResultMessage(300, "ios")).toContain("photos");
  });

  it("falls back to a plain past tense on Android <11", () => {
    expect(getDeleteResultMessage(1, "android-old")).toBe("Deleted.");
  });
});
