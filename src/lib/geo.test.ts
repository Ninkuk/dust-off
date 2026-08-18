import {
  formatCoordinates,
  mapsUrl,
  projectEquirectangular,
  toLatLng,
} from "@/lib/geo";

describe("toLatLng", () => {
  it("passes numeric coordinates through", () => {
    expect(toLatLng({ latitude: 37.5, longitude: -122.25 })).toEqual({
      latitude: 37.5,
      longitude: -122.25,
    });
  });

  it("coerces the string coordinates iOS getAssetInfoAsync returns", () => {
    expect(
      toLatLng({ latitude: "37.7749", longitude: "-122.4194" }),
    ).toEqual({ latitude: 37.7749, longitude: -122.4194 });
  });

  it("returns null for missing or unparsable coordinates", () => {
    expect(toLatLng(undefined)).toBeNull();
    expect(toLatLng(null)).toBeNull();
    expect(toLatLng({ latitude: "junk", longitude: "0" })).toBeNull();
    expect(toLatLng({ latitude: 37.5 })).toBeNull();
  });

  it("rejects out-of-range coordinates", () => {
    expect(toLatLng({ latitude: 91, longitude: 0 })).toBeNull();
    expect(toLatLng({ latitude: 0, longitude: 181 })).toBeNull();
  });
});

describe("projectEquirectangular", () => {
  it("maps the origin to the center of the unit square", () => {
    expect(projectEquirectangular(0, 0)).toEqual({ x: 0.5, y: 0.5 });
  });

  it("maps the corners of the coordinate space to the unit square corners", () => {
    expect(projectEquirectangular(90, -180)).toEqual({ x: 0, y: 0 });
    expect(projectEquirectangular(-90, 180)).toEqual({ x: 1, y: 1 });
  });

  it("maps a real coordinate proportionally", () => {
    const { x, y } = projectEquirectangular(37.7749, -122.4194);
    expect(x).toBeCloseTo((-122.4194 + 180) / 360, 5);
    expect(y).toBeCloseTo((90 - 37.7749) / 180, 5);
  });
});

describe("formatCoordinates", () => {
  it("formats hemispheres with degree notation", () => {
    expect(formatCoordinates(37.7749, -122.4194)).toBe(
      "37.7749° N, 122.4194° W",
    );
    expect(formatCoordinates(-33.8688, 151.2093)).toBe(
      "33.8688° S, 151.2093° E",
    );
  });
});

describe("mapsUrl", () => {
  it("builds the Apple Maps scheme on iOS", () => {
    expect(mapsUrl(37.5, -122.25, "ios")).toBe("maps:?ll=37.5,-122.25");
  });

  it("builds a geo: URI on Android", () => {
    expect(mapsUrl(37.5, -122.25, "android")).toBe(
      "geo:37.5,-122.25?q=37.5,-122.25",
    );
  });
});
