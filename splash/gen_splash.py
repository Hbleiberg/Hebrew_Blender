#!/usr/bin/env python3
"""Generate IvritSuite iOS launch / splash images.

To bump the version shown on the splash screen, edit VERSION below and run:

    python3 splash/gen_splash.py

Requires Python 3 + Pillow (`pip install Pillow`). Fonts are bundled in
splash/fonts/ so this renders offline. It (re)writes:
  - splash/splash-<w>x<h>.png        one image per unique device resolution
  - splash/apple-startup-links.html  the <link rel="apple-touch-startup-image">
                                     block that lives in index.html's <head>

Android draws its own splash from manifest.webmanifest, so no image is needed there.
"""
import math
import os

from PIL import Image, ImageDraw, ImageFont, ImageChops

# ---------------------------------------------------------------------------
VERSION = "1.2"          # <<< shown as "v{VERSION}" at the bottom of the splash
# ---------------------------------------------------------------------------

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(HERE, "fonts")
FONT_BOLD = os.path.join(FONT_DIR, "LibreBaskerville-Bold.ttf")
FONT_REG = os.path.join(FONT_DIR, "LibreBaskerville-Regular.ttf")
FALLBACK = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"

NAVY_TOP = (26, 39, 68)       # #1a2744
NAVY_BOT = (13, 18, 32)       # #0d1220
GOLD = (201, 146, 42)         # #c9922a
GOLD_LT = (240, 208, 128)     # #f0d080
CREAM = (253, 248, 239)       # #fdf8ef
CREAM_MUTED = (208, 200, 186)
VERSION_MUTED = (138, 148, 168)

# (css_width, css_height, device_pixel_ratio, label) — portrait orientation
DEVICES = [
    (375, 667, 2, "iPhone SE / 8 / 7 / 6s"),
    (414, 736, 3, "iPhone 8+ / 7+ / 6s+"),
    (375, 812, 3, "iPhone X / XS / 11 Pro / 12-13 mini"),
    (414, 896, 2, "iPhone XR / 11"),
    (414, 896, 3, "iPhone XS Max / 11 Pro Max"),
    (390, 844, 3, "iPhone 12 / 13 / 14"),
    (428, 926, 3, "iPhone 12-14 Pro Max / 14 Plus"),
    (393, 852, 3, "iPhone 14 Pro / 15 / 15 Pro / 16"),
    (430, 932, 3, "iPhone 15 Plus / 15 Pro Max / 16 Plus"),
    (402, 874, 3, "iPhone 16 Pro"),
    (440, 956, 3, "iPhone 16 Pro Max"),
    (744, 1133, 2, "iPad mini (6th)"),
    (768, 1024, 2, "iPad 9.7 / mini (older)"),
    (810, 1080, 2, "iPad 10.2 (7-9th gen)"),
    (820, 1180, 2, "iPad 10.9 / Air"),
    (834, 1112, 2, "iPad Air / Pro 10.5"),
    (834, 1194, 2, "iPad Pro 11"),
    (1024, 1366, 2, "iPad Pro 12.9"),
]


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.truetype(FALLBACK, size)


def render(out_w, out_h):
    ss = 2  # supersample, then downscale for crisp edges
    w, h = out_w * ss, out_h * ss
    img = Image.new("RGB", (w, h), NAVY_TOP)
    draw = ImageDraw.Draw(img)

    # Vertical navy -> navy-deep gradient
    for y in range(h):
        t = y / (h - 1)
        draw.line([(0, y), (w, y)], fill=(
            round(NAVY_TOP[0] + (NAVY_BOT[0] - NAVY_TOP[0]) * t),
            round(NAVY_TOP[1] + (NAVY_BOT[1] - NAVY_TOP[1]) * t),
            round(NAVY_TOP[2] + (NAVY_BOT[2] - NAVY_TOP[2]) * t)))

    # Bold Star of David: two overlapping thick triangle frames (matches the app icon)
    cx, cy = w // 2, int(h * 0.40)
    R = int(w * 0.165)
    K = 0.70  # inner/outer radius ratio -> band thickness

    def tri(up, radius):
        base = -90 if up else 90
        return [(cx + radius * math.cos(math.radians(base + k * 120)),
                 cy + radius * math.sin(math.radians(base + k * 120))) for k in range(3)]

    def frame_mask(up):
        m = Image.new("L", (w, h), 0)
        d = ImageDraw.Draw(m)
        d.polygon(tri(up, R), fill=255)
        d.polygon(tri(up, R * K), fill=0)
        return m

    star = ImageChops.lighter(frame_mask(True), frame_mask(False))
    img.paste(Image.new("RGBA", (w, h), GOLD + (255,)), (0, 0), star)

    def center(top_y, text, fnt, fill):
        b = draw.textbbox((0, 0), text, font=fnt)
        draw.text(((w - (b[2] - b[0])) // 2 - b[0], top_y - b[1]), text, font=fnt, fill=fill)

    # Wordmark (shrink to fit width)
    word = "IvritSuite"
    ws = int(w * 0.135)
    while ws > 10:
        wf = font(FONT_BOLD, ws)
        if draw.textbbox((0, 0), word, font=wf)[2] <= w * 0.78:
            break
        ws -= 2
    center(cy + R + int(h * 0.030), word, wf, CREAM)

    # Footer: credit, license, version
    ff = font(FONT_REG, int(w * 0.034))
    vf = font(FONT_REG, int(w * 0.028))
    center(int(h * 0.846), "Created by Harrison Bleiberg", ff, CREAM_MUTED)
    center(int(h * 0.884), "CC BY-NC-SA 4.0", ff, GOLD_LT)
    center(int(h * 0.920), "v" + VERSION, vf, VERSION_MUTED)

    return img.resize((out_w, out_h), Image.LANCZOS)


def main():
    rendered = {}
    links = []
    for cw, ch, dpr, label in DEVICES:
        pw, ph = cw * dpr, ch * dpr
        fname = "splash-%dx%d.png" % (pw, ph)
        if (pw, ph) not in rendered:
            render(pw, ph).save(os.path.join(HERE, fname))
            rendered[(pw, ph)] = fname
            print("  rendered %-20s %s" % (fname, label))
        links.append(
            '<link rel="apple-touch-startup-image" '
            'media="screen and (device-width: %dpx) and (device-height: %dpx) '
            'and (-webkit-device-pixel-ratio: %d) and (orientation: portrait)" '
            'href="/splash/%s">' % (cw, ch, dpr, fname)
        )
    with open(os.path.join(HERE, "apple-startup-links.html"), "w") as fh:
        fh.write("\n".join(links) + "\n")
    print("\nv%s -> %d images, %d link tags (splash/apple-startup-links.html)"
          % (VERSION, len(rendered), len(links)))


if __name__ == "__main__":
    main()
