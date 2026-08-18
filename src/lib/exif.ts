import { strings } from "@/lib/strings";

const values = strings.theater.infoFields.values;

export type NormalizedExif = Record<string, unknown>;

// iOS returns Apple's CGImageProperties dictionary, where the interesting tags
// live inside nested groups keyed like "{Exif}", "{TIFF}" and "{GPS}". Android
// returns a flat ExifInterface map. Flatten both into one flat record.
export function normalizeExif(
  raw: Record<string, unknown> | null | undefined,
): NormalizedExif {
  if (!raw) return {};
  const flat: NormalizedExif = {};
  for (const [key, value] of Object.entries(raw)) {
    if (
      key.startsWith("{") &&
      key.endsWith("}") &&
      value != null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      Object.assign(flat, value);
    } else {
      flat[key] = value;
    }
  }
  return flat;
}

export function asString(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v.trim() || undefined;
  if (typeof v === "number") return String(v);
  return undefined;
}

// Android's ExifInterface reports many tags as strings, including rationals
// like "400/100"; iOS reports plain numbers.
function toNumber(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const rational = v.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
    if (rational) {
      const denom = Number(rational[2]);
      return denom === 0 ? undefined : Number(rational[1]) / denom;
    }
    const n = Number(v);
    return v.trim() !== "" && Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function trimZero(s: string): string {
  return s.replace(/\.0$/, "");
}

export function formatDate(ms: number | undefined): string | undefined {
  if (!ms) return undefined;
  return new Date(ms).toLocaleString();
}

export function formatCamera(
  make: unknown,
  model: unknown,
): string | undefined {
  const m = asString(make);
  const md = asString(model);
  if (m && md)
    return md.toLowerCase().startsWith(m.toLowerCase()) ? md : `${m} ${md}`;
  return md ?? m;
}

export function formatFocal(v: unknown): string | undefined {
  const n = toNumber(v);
  if (n == null || n <= 0) return undefined;
  return `${Math.round(n)}mm`;
}

export function formatAperture(v: unknown): string | undefined {
  const n = toNumber(v);
  if (n == null || n <= 0) return undefined;
  return `f/${trimZero(n.toFixed(1))}`;
}

export function formatShutter(v: unknown): string | undefined {
  const n = toNumber(v);
  if (n == null || n <= 0) return undefined;
  if (n >= 1) return `${trimZero(n.toFixed(1))}s`;
  return `1/${Math.round(1 / n)}s`;
}

export function formatIso(v: unknown): string | undefined {
  // iOS reports ISOSpeedRatings as an array, e.g. [125].
  const scalar = Array.isArray(v) ? v[0] : v;
  const n = toNumber(scalar);
  if (n == null || n <= 0) return undefined;
  return String(Math.round(n));
}

export function formatExposureBias(v: unknown): string | undefined {
  const n = toNumber(v);
  if (n == null) return undefined;
  const rounded = trimZero(Math.abs(n).toFixed(1));
  if (rounded === "0") return "0 EV";
  return `${n > 0 ? "+" : "-"}${rounded} EV`;
}

export function formatFlash(v: unknown): string | undefined {
  const n = toNumber(v);
  if (n == null) return undefined;
  // EXIF Flash is a bitfield; bit 0 is "flash fired".
  return n & 1 ? values.flashFired : values.flashNotFired;
}

export function formatWhiteBalance(v: unknown): string | undefined {
  const n = toNumber(v);
  if (n === 0) return values.whiteBalanceAuto;
  if (n === 1) return values.whiteBalanceManual;
  return undefined;
}

export function formatOrientation(v: unknown): string | undefined {
  const n = toNumber(v);
  switch (n) {
    case 1:
      return values.orientationNormal;
    case 3:
      return values.orientationRotated(180);
    case 6:
      return values.orientationRotated(90);
    case 8:
      return values.orientationRotated(270);
    case 2:
    case 4:
    case 5:
    case 7:
      return values.orientationMirrored;
    default:
      return undefined;
  }
}

export function formatColorProfile(
  profileName: unknown,
  colorSpace: unknown,
): string | undefined {
  const name = asString(profileName);
  if (name) return name;
  // EXIF ColorSpace: 1 = sRGB, 65535 = uncalibrated.
  return toNumber(colorSpace) === 1 ? "sRGB" : undefined;
}

export function formatSize(v: unknown): string | undefined {
  const n = toNumber(v);
  if (n == null || n <= 0) return undefined;
  if (n >= 1024 * 1024) return `${trimZero((n / (1024 * 1024)).toFixed(1))} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}

export function formatMegapixels(
  width: number | undefined,
  height: number | undefined,
): string | undefined {
  if (!width || !height) return undefined;
  const mp = (width * height) / 1_000_000;
  if (mp < 0.1) return undefined;
  return `${trimZero(mp.toFixed(1))} MP`;
}

export function formatSubtypes(
  subtypes: string[] | undefined,
): string | undefined {
  if (!subtypes?.length) return undefined;
  const labels = subtypes
    .map((s) => values.subtypes[s])
    .filter((label): label is string => label != null);
  return labels.length ? labels.join(" · ") : undefined;
}
