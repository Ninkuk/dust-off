import {
  formatAperture,
  formatCamera,
  formatColorProfile,
  formatExposureBias,
  formatFlash,
  formatFocal,
  formatIso,
  formatMegapixels,
  formatOrientation,
  formatShutter,
  formatSize,
  formatSubtypes,
  formatWhiteBalance,
  normalizeExif,
} from "@/lib/exif";

describe("normalizeExif", () => {
  it("returns an empty record for null or undefined", () => {
    expect(normalizeExif(null)).toEqual({});
    expect(normalizeExif(undefined)).toEqual({});
  });

  it("passes flat Android-style keys through unchanged", () => {
    const android = {
      FNumber: "1.8",
      ExposureTime: "0.008",
      Make: "Google",
    };
    expect(normalizeExif(android)).toMatchObject(android);
  });

  it("flattens iOS CGImageProperties groups like {Exif}, {TIFF} and {GPS}", () => {
    const ios = {
      "{Exif}": { FNumber: 1.8, ISOSpeedRatings: [125], LensModel: "Wide" },
      "{TIFF}": { Make: "Apple", Model: "iPhone 15 Pro" },
      "{GPS}": { Altitude: 12.5 },
      ProfileName: "Display P3",
    };
    expect(normalizeExif(ios)).toMatchObject({
      FNumber: 1.8,
      ISOSpeedRatings: [125],
      LensModel: "Wide",
      Make: "Apple",
      Model: "iPhone 15 Pro",
      Altitude: 12.5,
      ProfileName: "Display P3",
    });
  });
});

describe("formatCamera", () => {
  it("joins make and model, deduping a model that repeats the make", () => {
    expect(formatCamera("Apple", "iPhone 15 Pro")).toBe("Apple iPhone 15 Pro");
    expect(formatCamera("Canon", "Canon EOS R5")).toBe("Canon EOS R5");
    expect(formatCamera(undefined, "Pixel 9")).toBe("Pixel 9");
    expect(formatCamera(undefined, undefined)).toBeUndefined();
  });
});

describe("formatFocal", () => {
  it("formats numbers, numeric strings and Android rational strings", () => {
    expect(formatFocal(26)).toBe("26mm");
    expect(formatFocal("6.86")).toBe("7mm");
    expect(formatFocal("400/100")).toBe("4mm");
  });

  it("returns undefined for missing or invalid values", () => {
    expect(formatFocal(undefined)).toBeUndefined();
    expect(formatFocal(0)).toBeUndefined();
    expect(formatFocal("junk")).toBeUndefined();
  });
});

describe("formatAperture", () => {
  it("formats numbers and rational strings, trimming trailing .0", () => {
    expect(formatAperture(1.8)).toBe("f/1.8");
    expect(formatAperture(2)).toBe("f/2");
    expect(formatAperture("180/100")).toBe("f/1.8");
  });
});

describe("formatShutter", () => {
  it("renders sub-second exposures as a fraction", () => {
    expect(formatShutter(0.0005)).toBe("1/2000s");
    expect(formatShutter("0.008")).toBe("1/125s");
  });

  it("renders exposures of a second or more in seconds", () => {
    expect(formatShutter(2)).toBe("2s");
    expect(formatShutter(1.5)).toBe("1.5s");
  });
});

describe("formatIso", () => {
  it("accepts the iOS array shape and scalar shapes", () => {
    expect(formatIso([125])).toBe("125");
    expect(formatIso(100)).toBe("100");
    expect(formatIso("64")).toBe("64");
  });

  it("returns undefined for empty or invalid input", () => {
    expect(formatIso([])).toBeUndefined();
    expect(formatIso(undefined)).toBeUndefined();
  });
});

describe("formatExposureBias", () => {
  it("shows a signed EV value rounded to one decimal", () => {
    expect(formatExposureBias(0.7)).toBe("+0.7 EV");
    expect(formatExposureBias(-1.33)).toBe("-1.3 EV");
    expect(formatExposureBias(0)).toBe("0 EV");
    expect(formatExposureBias(1)).toBe("+1 EV");
  });

  it("returns undefined when absent", () => {
    expect(formatExposureBias(undefined)).toBeUndefined();
    expect(formatExposureBias("junk")).toBeUndefined();
  });
});

describe("formatFlash", () => {
  it("reads the fired bit of the EXIF flash bitfield", () => {
    expect(formatFlash(1)).toBe("Fired");
    expect(formatFlash(9)).toBe("Fired");
    expect(formatFlash(0)).toBe("Did not fire");
    expect(formatFlash(16)).toBe("Did not fire");
    expect(formatFlash(undefined)).toBeUndefined();
  });
});

describe("formatWhiteBalance", () => {
  it("maps the EXIF enum to Auto/Manual", () => {
    expect(formatWhiteBalance(0)).toBe("Auto");
    expect(formatWhiteBalance("1")).toBe("Manual");
    expect(formatWhiteBalance(undefined)).toBeUndefined();
    expect(formatWhiteBalance(7)).toBeUndefined();
  });
});

describe("formatOrientation", () => {
  it("maps the EXIF orientation enum to a readable label", () => {
    expect(formatOrientation(1)).toBe("Normal");
    expect(formatOrientation("6")).toBe("Rotated 90°");
    expect(formatOrientation(3)).toBe("Rotated 180°");
    expect(formatOrientation(8)).toBe("Rotated 270°");
    expect(formatOrientation(2)).toBe("Mirrored");
    expect(formatOrientation(undefined)).toBeUndefined();
    expect(formatOrientation(0)).toBeUndefined();
  });
});

describe("formatSize", () => {
  it("scales bytes to KB and MB", () => {
    expect(formatSize(512)).toBe("512 B");
    expect(formatSize(2048)).toBe("2 KB");
    expect(formatSize(3.5 * 1024 * 1024)).toBe("3.5 MB");
  });

  it("returns undefined for missing or non-positive input", () => {
    expect(formatSize(undefined)).toBeUndefined();
    expect(formatSize(0)).toBeUndefined();
  });
});

describe("formatMegapixels", () => {
  it("derives megapixels from pixel dimensions", () => {
    expect(formatMegapixels(4032, 3024)).toBe("12.2 MP");
    expect(formatMegapixels(1920, 1080)).toBe("2.1 MP");
  });

  it("returns undefined for tiny or missing dimensions", () => {
    expect(formatMegapixels(100, 100)).toBeUndefined();
    expect(formatMegapixels(0, 0)).toBeUndefined();
  });
});

describe("formatColorProfile", () => {
  it("prefers the iOS ProfileName string", () => {
    expect(formatColorProfile("Display P3", 1)).toBe("Display P3");
  });

  it("falls back to the EXIF ColorSpace enum", () => {
    expect(formatColorProfile(undefined, 1)).toBe("sRGB");
    expect(formatColorProfile(undefined, "1")).toBe("sRGB");
  });

  it("returns undefined for uncalibrated or missing color space", () => {
    expect(formatColorProfile(undefined, 65535)).toBeUndefined();
    expect(formatColorProfile(undefined, undefined)).toBeUndefined();
  });
});

describe("formatSubtypes", () => {
  it("maps known media subtypes to labels", () => {
    expect(formatSubtypes(["livePhoto", "hdr"])).toBe("Live Photo · HDR");
    expect(formatSubtypes(["screenshot"])).toBe("Screenshot");
    expect(formatSubtypes(["panorama"])).toBe("Panorama");
  });

  it("ignores unknown subtypes and returns undefined when nothing maps", () => {
    expect(formatSubtypes(["somethingNew"])).toBeUndefined();
    expect(formatSubtypes([])).toBeUndefined();
    expect(formatSubtypes(undefined)).toBeUndefined();
  });
});
