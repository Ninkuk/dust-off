#!/usr/bin/env bash
# Seed a booted iOS simulator with image fixtures so expo-media-library
# returns a non-empty asset set. Uses `xcrun simctl addmedia` to import
# files into the simulator's Photos library (Camera Roll / Recents).
#
# Usage:
#   scripts/seed-ios-simulator.sh [fixtures-dir]
#
# Defaults:
#   fixtures-dir = <repo>/fixtures/android-photos  (shared with seed:android;
#                  same Picsum-sourced files, EXIF-backdated, work on both
#                  platforms — see fetch-fixtures.mjs)
#
# Env overrides:
#   IOS_SIM_UDID   target simulator UDID (default: the sole booted sim).
#                  Required when more than one simulator is booted.
#   SIMCTL         path to simctl (default: xcrun simctl).
#
# Caveats vs seed:android:
#   - iOS Photos has no filesystem-backed album buckets, so the album
#     subdirectories (Camera/Screenshots/...) all collapse into the single
#     Camera Roll. Albums on iOS require PhotoKit from inside an app.
#   - There is no per-file delete from CLI. Re-running this script will
#     create duplicate-named imports. To start clean, either delete from
#     the Photos app on the sim or wipe the whole device with
#     `xcrun simctl erase <udid>` (warning: erases everything on the sim).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FIXTURES_DIR="${1:-$REPO_ROOT/fixtures/android-photos}"
SIMCTL="${SIMCTL:-xcrun simctl}"

if ! command -v xcrun >/dev/null 2>&1; then
  echo "error: 'xcrun' not found. Install Xcode command-line tools: xcode-select --install" >&2
  exit 1
fi

if [ ! -d "$FIXTURES_DIR" ]; then
  echo "error: fixtures dir does not exist: $FIXTURES_DIR" >&2
  echo "hint:  run 'npm run fixtures:fetch' first." >&2
  exit 1
fi

# Recursive: subdirectories collapse into one Camera Roll on iOS, but we
# still want every file regardless of how the fetch script laid them out.
fixture_count=$(find "$FIXTURES_DIR" -type f \
  \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \
     -o -iname "*.heic" -o -iname "*.webp" \) | wc -l | tr -d ' ')
if [ "$fixture_count" -eq 0 ]; then
  echo "error: no image files (jpg/jpeg/png/heic/webp) found in $FIXTURES_DIR" >&2
  echo "hint:  run 'npm run fixtures:fetch' first." >&2
  exit 1
fi

# Resolve target sim. Prefer explicit UDID; otherwise require exactly one booted.
if [ -n "${IOS_SIM_UDID:-}" ]; then
  TARGET="$IOS_SIM_UDID"
else
  booted=$($SIMCTL list devices booted 2>/dev/null \
    | awk -F '[()]' '/\(Booted\)/ {print $2}')
  booted_count=$(printf "%s" "$booted" | grep -c . || true)
  if [ "$booted_count" -eq 0 ]; then
    echo "error: no booted iOS simulator. Start one with 'open -a Simulator' or" >&2
    echo "       'xcrun simctl boot <udid>' (list with 'xcrun simctl list devices')." >&2
    exit 1
  fi
  if [ "$booted_count" -gt 1 ]; then
    echo "error: multiple booted simulators. Set IOS_SIM_UDID to disambiguate:" >&2
    printf "%s\n" "$booted" | sed 's/^/  /' >&2
    exit 1
  fi
  TARGET="booted"
fi

echo "→ importing $fixture_count files into simulator ($TARGET)"
# Stream filenames to xargs -0 so we tolerate spaces in paths (e.g. "WhatsApp Images").
# -n 200 chunks the addmedia calls to stay well under ARG_MAX.
find "$FIXTURES_DIR" -type f \
  \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \
     -o -iname "*.heic" -o -iname "*.webp" \) -print0 \
  | xargs -0 -n 200 $SIMCTL addmedia "$TARGET"

echo "✓ seeded $fixture_count files into Photos on simulator $TARGET"
echo "  note: all files land in Camera Roll; album buckets do not carry over from iOS."
echo "  next: launch Dust Off and accept the Photos permission prompt."
