#!/usr/bin/env node
// Deterministic generator for the perf-rig mock library (D-2).
// Writes src/lib/__mocks__/assets-mock.json — overwrites in place.
// Usage:  node scripts/generate-mock-library.mjs [count] [seed]
// Defaults: 50000 assets, seed 1.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "src", "lib", "__mocks__", "assets-mock.json");

const count = Number(process.argv[2] ?? 50_000);
const seed = Number(process.argv[3] ?? 1);

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

const albumNames = [
  "Camera Roll", "Screenshots", "Selfies", "Favorites Source", "Tokyo 2024",
  "Goa Trip", "Wedding", "Birthday", "Hiking", "Beach Days", "Studio",
  "Sunsets", "Coffee", "Concerts", "Family", "Friends", "Pets", "Food",
  "Architecture", "Street", "Macro", "Night Sky", "Snow", "Rain", "Books",
  "Art", "Workouts", "Recipes", "Garden", "Flowers", "Cars", "Bikes",
  "Trains", "Planes", "Cities", "Villages", "Festivals", "Gigs", "Office",
  "Home",
];

const albumIds = albumNames.map((_, i) => `album-${String(i).padStart(3, "0")}`);
const albums = albumNames.map((title, i) => ({
  id: albumIds[i],
  title,
  assetCount: 0,
  type: "album",
  startTime: 0,
  endTime: 0,
}));

const aspectRatios = [
  [4032, 3024], [3024, 4032], [4032, 2268], [3024, 3024], [1920, 1080],
];

const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 4, 9);

const assets = new Array(count);
for (let i = 0; i < count; i++) {
  const [width, height] = pick(aspectRatios);
  const albumIndex = Math.floor(rand() * albumIds.length);
  const albumId = albumIds[albumIndex];
  const creationTime = NOW - Math.floor(rand() * TWO_YEARS_MS);
  const id = `asset-${String(i).padStart(7, "0")}`;
  const filename = `IMG_${String(i).padStart(7, "0")}.jpg`;
  assets[i] = {
    id,
    filename,
    uri: `file:///mock/${filename}`,
    mediaType: "photo",
    width,
    height,
    creationTime,
    modificationTime: creationTime,
    duration: 0,
    albumId,
  };
  const album = albums[albumIndex];
  album.assetCount += 1;
  album.startTime =
    album.startTime === 0 ? creationTime : Math.min(album.startTime, creationTime);
  album.endTime = Math.max(album.endTime, creationTime);
}

assets.sort((a, b) => b.creationTime - a.creationTime);

writeFileSync(OUT, JSON.stringify({ assets, albums }));
const sizeMb = (Buffer.byteLength(JSON.stringify({ assets, albums })) / 1_000_000).toFixed(2);
console.log(`Wrote ${count} assets across ${albums.length} albums to ${OUT} (~${sizeMb} MB)`);
