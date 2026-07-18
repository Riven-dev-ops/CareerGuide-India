"""
Generates the CareerGuide India launcher icon (a three-way compass/signpost
mark matching the web app's logo dot) as PNGs at every Android mipmap density,
plus a round variant. Run once: python3 generate_icons.py
"""
import math
import os
from PIL import Image, ImageDraw

NAVY = (22, 33, 58)
MARIGOLD = (232, 163, 61)
TEAL = (47, 111, 107)
CORAL = (193, 73, 95)
PAPER = (250, 246, 234)

DENSITIES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

OUT_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app/src/main/res")


def draw_icon(size, round_mask=False):
    scale = 4  # supersample for smooth edges
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = s / 2, s / 2
    r = s * 0.46

    # Background circle (navy)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=NAVY)

    # Three-way pie mark (science / commerce / arts), like the web logo dot
    inner_r = s * 0.30
    colors = [MARIGOLD, TEAL, CORAL]
    start = -90
    for i, color in enumerate(colors):
        end = start + 120
        draw.pieslice(
            [cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r],
            start, end, fill=color,
        )
        start = end

    # Small paper-colored center dot (compass hub)
    hub_r = s * 0.07
    draw.ellipse([cx - hub_r, cy - hub_r, cx + hub_r, cy + hub_r], fill=PAPER)

    img = img.resize((size, size), Image.LANCZOS)

    if round_mask:
        mask = Image.new("L", (size, size), 0)
        mdraw = ImageDraw.Draw(mask)
        mdraw.ellipse([0, 0, size, size], fill=255)
        img.putalpha(mask)

    return img


def main():
    for folder, size in DENSITIES.items():
        out_dir = os.path.join(OUT_ROOT, folder)
        os.makedirs(out_dir, exist_ok=True)

        square = draw_icon(size, round_mask=False)
        square.save(os.path.join(out_dir, "ic_launcher.png"))

        round_icon = draw_icon(size, round_mask=True)
        round_icon.save(os.path.join(out_dir, "ic_launcher_round.png"))

        print(f"Wrote {folder} ({size}x{size})")


if __name__ == "__main__":
    main()
