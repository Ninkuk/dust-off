#!/usr/bin/env python3
"""
Generates placeholder spark assets for Dust Off (DS-21).
Real cinematic spark asset deferred to Phase 8 polish — this just unblocks the build.

Outputs:
  assets/icon-spark.png             — amber circle on near-black (iOS source)
  assets/icon-spark-foreground.png  — amber circle on transparent (Android adaptive foreground)
  assets/icon-spark-monochrome.png  — white circle on transparent (Android themed icon)
  assets/splash-spark.png           — amber circle on transparent (splash overlay)
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets"

CANVAS = 1024
ICON_RADIUS = 220
SPLASH_RADIUS = 140
AMBER = (0xF5, 0xC7, 0x7E, 255)
NEAR_BLACK = (0x0A, 0x0A, 0x0A, 255)
TRANSPARENT = (0, 0, 0, 0)
WHITE = (255, 255, 255, 255)


def draw_circle(canvas_color: tuple[int, int, int, int], dot_color: tuple[int, int, int, int], radius: int) -> Image.Image:
    img = Image.new("RGBA", (CANVAS, CANVAS), canvas_color)
    draw = ImageDraw.Draw(img)
    cx = cy = CANVAS // 2
    draw.ellipse(
        (cx - radius, cy - radius, cx + radius, cy + radius),
        fill=dot_color,
    )
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    draw_circle(NEAR_BLACK, AMBER, ICON_RADIUS).save(OUT / "icon-spark.png")
    draw_circle(TRANSPARENT, AMBER, ICON_RADIUS).save(OUT / "icon-spark-foreground.png")
    draw_circle(TRANSPARENT, WHITE, ICON_RADIUS).save(OUT / "icon-spark-monochrome.png")
    draw_circle(TRANSPARENT, AMBER, SPLASH_RADIUS).save(OUT / "splash-spark.png")

    print(f"Wrote 4 placeholders into {OUT}")


if __name__ == "__main__":
    main()
