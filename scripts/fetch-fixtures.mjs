#!/usr/bin/env node
// Fetch deterministic image fixtures for Dust Off emulator testing.
// Produces a mixed-format, mixed-resolution, backdated image set spread
// across 5 simulated Android album buckets (Camera, Screenshots, WhatsApp
// Images, Saved, Selfies). Each album has its own resolution palette,
// format mix, date distribution, and EXIF policy so the source picker
// has meaningfully different sources to filter on.
//
// Source: Picsum (picsum.photos), which serves Unsplash photos without
// requiring an API key. Same seed → same image set.
//
// Usage:
//   node scripts/fetch-fixtures.mjs [count] [seed] [outdir]
// Defaults: count=50, seed=1, outdir=<repo>/fixtures/android-photos
//
// Tools:
//   curl      required (download)
//   sips      required, macOS built-in (format conversion)
//   exiftool  optional — without it EXIF dates are skipped and Android
//             MediaStore will see every photo as "today" because adb push
//             resets file mtime on device. brew install exiftool.

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  utimesSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const count = Number(process.argv[2] ?? 50);
const seed = Number(process.argv[3] ?? 1);
const outDir = resolve(
  process.argv[4] ?? join(REPO_ROOT, "fixtures", "android-photos"),
);

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(seed);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

function hasCommand(cmd) {
  try {
    execFileSync("which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

for (const tool of ["curl", "sips"]) {
  if (!hasCommand(tool)) {
    console.error(`error: '${tool}' not found on PATH`);
    process.exit(1);
  }
}

const hasExiftool = hasCommand("exiftool");
if (!hasExiftool) {
  console.warn(
    "⚠ exiftool not found — EXIF dates will not be written.\n" +
    "  Backdating will not survive 'adb push' to the emulator, because\n" +
    "  Android's MediaStore reads DATE_TAKEN from EXIF, not file mtime.\n" +
    "  Install:  brew install exiftool\n",
  );
}

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();

// Date distributions. Each returns an age in days for a synthetic photo.
const DATE = {
  // Full range, biased toward recent — typical Camera roll spanning years.
  full: () => {
    const b = rand();
    if (b < 0.20) return Math.floor(rand() * 7);
    if (b < 0.40) return 7 + Math.floor(rand() * 30);
    if (b < 0.70) return 30 + Math.floor(rand() * 335);
    if (b < 0.90) return 365 + Math.floor(rand() * 4 * 365);
    return 5 * 365 + Math.floor(rand() * 5 * 365);
  },
  // Screenshots are inherently recent — last 60 days only.
  recent: () => Math.floor(rand() * 60),
  // Messaging photos cluster in the past year, more uniform within it.
  pastYear: () => Math.floor(rand() * 365),
  // Selfies — power-law biased toward recent within a 3-year window.
  recentWeighted: () => Math.floor(Math.pow(rand(), 2) * 3 * 365),
};

const FORMAT_META = {
  jpeg: { ext: "jpg",  sips: "jpeg" },
  png:  { ext: "png",  sips: "png"  },
  heic: { ext: "heic", sips: "heic" },
  webp: { ext: "webp", sips: "webp" },
};

function formatPool(weights) {
  return Object.entries(weights).flatMap(([f, w]) => Array(w).fill(f));
}

// Each album models the shape of a real Android source.
const ALBUMS = [
  {
    name: "Camera",
    share: 0.50,
    resolutions: [
      [4032, 3024],
      [3024, 4032],
      [4000, 3000],
      [4032, 2268],
      [2268, 4032],
    ],
    formats: formatPool({ jpeg: 70, heic: 15, png: 10, webp: 5 }),
    age: DATE.full,
    exif: true,
  },
  {
    name: "Screenshots",
    share: 0.15,
    resolutions: [
      [1080, 2400],
      [1440, 3120],
      [1080, 2340],
      [2400, 1080],
    ],
    formats: formatPool({ png: 100 }),
    age: DATE.recent,
    exif: false,
  },
  {
    name: "WhatsApp Images",
    share: 0.15,
    resolutions: [
      [800, 800],
      [1280, 720],
      [720, 1280],
      [1024, 768],
      [960, 1280],
    ],
    formats: formatPool({ jpeg: 100 }),
    age: DATE.pastYear,
    exif: false,
  },
  {
    name: "Saved",
    share: 0.10,
    resolutions: [
      [800, 800],
      [1080, 1920],
      [1920, 1080],
      [640, 480],
      [2560, 1080],
    ],
    formats: formatPool({ jpeg: 70, png: 14, heic: 10, webp: 6 }),
    age: DATE.full,
    exif: true,
  },
  {
    name: "Selfies",
    share: 0.10,
    resolutions: [
      [1080, 1920],
      [3024, 4032],
      [1080, 1350],
      [1170, 2532],
    ],
    formats: formatPool({ jpeg: 80, heic: 20 }),
    age: DATE.recentWeighted,
    exif: true,
  },
];

// Allocate `total` images across albums, preserving ratios. Last album
// gets the rounding remainder.
function allocate(total) {
  const plan = [];
  let assigned = 0;
  for (let i = 0; i < ALBUMS.length - 1; i++) {
    const n = Math.round(total * ALBUMS[i].share);
    plan.push(n);
    assigned += n;
  }
  plan.push(Math.max(0, total - assigned));
  return plan;
}

function formatExifDate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}:${pad(d.getMonth() + 1)}:${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

const FIXTURE_RE = /^dustoff-\d+\.(jpg|jpeg|png|heic|webp)$/i;

function wipeStaleFixtures(root) {
  if (!existsSync(root)) {
    mkdirSync(root, { recursive: true });
    return 0;
  }
  let removed = 0;
  // Top-level (legacy flat layout) + every immediate subdirectory.
  const targets = [root];
  for (const e of readdirSync(root, { withFileTypes: true })) {
    if (e.isDirectory()) targets.push(join(root, e.name));
  }
  for (const dir of targets) {
    for (const f of readdirSync(dir)) {
      if (FIXTURE_RE.test(f)) {
        rmSync(join(dir, f));
        removed++;
      }
    }
  }
  return removed;
}

const wiped = wipeStaleFixtures(outDir);
if (wiped > 0) console.log(`→ removed ${wiped} stale fixtures from ${outDir}`);

const plan = allocate(count);

console.log(`→ fetching ${count} images into ${outDir}`);
console.log(`  seed: ${seed}    source: picsum.photos (Unsplash, no API key)`);
console.log(`  albums:`);
ALBUMS.forEach((a, i) => console.log(`    ${a.name.padEnd(16)} ${String(plan[i]).padStart(3)}`));
console.log();

const summary = {};
for (const a of ALBUMS) summary[a.name] = { jpeg: 0, png: 0, heic: 0, webp: 0, failed: 0 };

let imageIndex = 0;
for (let a = 0; a < ALBUMS.length; a++) {
  const album = ALBUMS[a];
  const n = plan[a];
  if (n === 0) continue;
  const albumDir = join(outDir, album.name);
  mkdirSync(albumDir, { recursive: true });

  for (let j = 0; j < n; j++) {
    const [w, h] = pick(album.resolutions);
    const format = pick(album.formats);
    const date = new Date(NOW - album.age() * DAY);
    const stem = `dustoff-${String(imageIndex).padStart(3, "0")}`;
    const picsumSeed = seed * 1000 + imageIndex;
    const url = `https://picsum.photos/seed/${picsumSeed}/${w}/${h}`;
    const tmpPath = join(albumDir, `${stem}.tmp.jpg`);
    const finalPath = join(albumDir, `${stem}.${FORMAT_META[format].ext}`);

    try {
      execFileSync("curl", ["-fsSL", "-o", tmpPath, url], { stdio: "pipe" });

      if (format === "jpeg") {
        renameSync(tmpPath, finalPath);
      } else {
        execFileSync(
          "sips",
          ["-s", "format", FORMAT_META[format].sips, tmpPath, "--out", finalPath],
          { stdio: "pipe" },
        );
        rmSync(tmpPath);
      }

      if (hasExiftool && album.exif) {
        const exifDate = formatExifDate(date);
        execFileSync(
          "exiftool",
          [
            "-overwrite_original",
            "-q",
            `-DateTimeOriginal=${exifDate}`,
            `-CreateDate=${exifDate}`,
            `-ModifyDate=${exifDate}`,
            finalPath,
          ],
          { stdio: "pipe" },
        );
      }

      utimesSync(finalPath, date, date);

      summary[album.name][format]++;
      process.stdout.write(
        `  [${String(imageIndex + 1).padStart(3)}/${count}] ` +
        `${album.name.padEnd(16)} ${stem}.${FORMAT_META[format].ext.padEnd(4)} ` +
        `${String(w).padStart(4)}x${String(h).padStart(4)}  ` +
        `${date.toISOString().slice(0, 10)}\n`,
      );
    } catch (err) {
      summary[album.name].failed++;
      const msg = (err.stderr?.toString() || err.message).split("\n")[0];
      process.stdout.write(
        `  [${String(imageIndex + 1).padStart(3)}/${count}] ` +
        `${album.name.padEnd(16)} FAILED ${stem}.${FORMAT_META[format].ext}: ${msg}\n`,
      );
      if (existsSync(tmpPath)) rmSync(tmpPath);
    }
    imageIndex++;
  }
}

console.log("\nsummary:");
console.log(`  ${"album".padEnd(16)} ${"jpeg".padStart(5)} ${"png".padStart(5)} ${"heic".padStart(5)} ${"webp".padStart(5)} ${"fail".padStart(5)}`);
for (const a of ALBUMS) {
  const s = summary[a.name];
  console.log(`  ${a.name.padEnd(16)} ${String(s.jpeg).padStart(5)} ${String(s.png).padStart(5)} ${String(s.heic).padStart(5)} ${String(s.webp).padStart(5)} ${String(s.failed).padStart(5)}`);
}
console.log("\nnext: npm run seed:android");
