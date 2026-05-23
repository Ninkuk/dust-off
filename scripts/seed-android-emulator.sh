#!/usr/bin/env bash
# Seed a running Android emulator with image fixtures so expo-media-library
# returns a non-empty asset set. Pushes files into /sdcard/Pictures/dust-off-test
# and triggers a MediaStore scan so the new files are indexed.
#
# Usage:
#   scripts/seed-android-emulator.sh [fixtures-dir]
#
# Defaults:
#   fixtures-dir = <repo>/fixtures/android-photos  (gitignored)
#
# Env overrides:
#   DEVICE_DIR   target dir on device (default: /sdcard/Pictures/dust-off-test)
#   ADB          path to adb (default: adb on PATH)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FIXTURES_DIR="${1:-$REPO_ROOT/fixtures/android-photos}"
DEVICE_DIR="${DEVICE_DIR:-/sdcard/Pictures/dust-off-test}"
ADB="${ADB:-adb}"

if ! command -v "$ADB" >/dev/null 2>&1; then
  echo "error: '$ADB' not found on PATH. Install Android platform-tools or set ADB=/path/to/adb." >&2
  exit 1
fi

if [ ! -d "$FIXTURES_DIR" ]; then
  echo "error: fixtures dir does not exist: $FIXTURES_DIR" >&2
  echo "hint:  mkdir -p \"$FIXTURES_DIR\" and drop ~20-50 mixed JPG/PNG/HEIC files into it." >&2
  exit 1
fi

# Recursive so we pick up album subdirectories (Camera, Screenshots, etc.).
# Each subdirectory becomes a separate MediaStore bucket on the device.
fixture_count=$(find "$FIXTURES_DIR" -type f \
  \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \
     -o -iname "*.heic" -o -iname "*.webp" \) | wc -l | tr -d ' ')
if [ "$fixture_count" -eq 0 ]; then
  echo "error: no image files (jpg/jpeg/png/heic/webp) found in $FIXTURES_DIR" >&2
  echo "hint:  run 'npm run fixtures:fetch' first." >&2
  exit 1
fi
album_count=$(find "$FIXTURES_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')

devices=$("$ADB" devices | awk 'NR>1 && $2=="device" {print $1}')
if [ -z "$devices" ]; then
  echo "error: no Android device/emulator attached. Start one in Android Studio or via 'emulator -avd <name>'." >&2
  exit 1
fi
device_count=$(echo "$devices" | wc -l | tr -d ' ')
if [ "$device_count" -gt 1 ]; then
  echo "note: multiple devices attached; adb will use the first or fail. Set ANDROID_SERIAL to disambiguate." >&2
fi

echo "→ wiping $DEVICE_DIR on device"
"$ADB" shell "rm -rf '$DEVICE_DIR' && mkdir -p '$DEVICE_DIR'"

if [ "$album_count" -gt 0 ]; then
  echo "→ pushing $fixture_count files across $album_count album(s) from $FIXTURES_DIR"
else
  echo "→ pushing $fixture_count files from $FIXTURES_DIR"
fi
"$ADB" push "$FIXTURES_DIR"/. "$DEVICE_DIR"/ >/dev/null

echo "→ triggering MediaStore scan"
if ! "$ADB" shell "cmd media_scanner scan '$DEVICE_DIR'" 2>/dev/null; then
  # Fallback for older system images where 'cmd media_scanner' isn't available.
  "$ADB" shell "am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d 'file://$DEVICE_DIR'" >/dev/null
fi

echo "✓ seeded $fixture_count files into $DEVICE_DIR"
echo "  next: launch Dust Off and accept the Photos permission prompt."
