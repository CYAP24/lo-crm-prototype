"""Teaser hero: a generated crystal plate with the title set in real Inter.

The plate comes from Figma's image generator (gpt-image-2.5) — a faceted stone
half in shadow throwing prismatic caustics, which is the depth and dimension an
illustrator gives you and code does not. The type is set here rather than in the
prompt, because an image model cannot be trusted with letterforms and cannot use
Inter at all, and Inter is the brand face.
"""
import os

import numpy as np
from PIL import Image, ImageDraw

from artkit import WHITE, fit, font, measure, save, text
from refract import grain

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
W, H = 1200, 1000
OUT = "build/img"

TURQ_SITE = (31, 169, 185)
INK = (6, 8, 11)
MUTED = (166, 175, 186)


def plate(src, w, h, shift=0.0):
    im = Image.open(src).convert("RGB")
    k = h / im.height
    im = im.resize((round(im.width * k), h), Image.LANCZOS)
    x = int(max(0, min(im.width - w, im.width * shift)))
    return im.crop((x, 0, x + w, h))


def scrim(img, strength=0.74, falloff=1.25):
    """Darken hardest at the left where the type sits, release toward the stone."""
    a = np.asarray(img, dtype=np.float32)
    h, w = a.shape[:2]
    x = np.linspace(0, 1, w)[None, :]
    k = 1.0 - strength * np.clip(1.0 - x / 0.72, 0, 1) ** falloff
    y = np.linspace(0, 1, h)[:, None]
    k = k * (1.0 - 0.18 * np.clip((y - 0.72) / 0.28, 0, 1))
    return Image.fromarray(np.clip(a * k[:, :, None], 0, 255).astype("uint8"), "RGB")


def pill(label, h=58, pad=26):
    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    f = font(800, 22)
    w = int(measure(probe, label, f, 2.2) + pad * 2)
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=h // 2, fill=WHITE + (255,))
    text(d, (w / 2, (h - 22 * 1.22) / 2), label, f, INK, tracking=2.2, align="c")
    return layer


def hero(dst, src, title, sub, badge="BLACK FRIDAY"):
    canvas = scrim(plate(src, W, H, shift=0.20))
    canvas = grain(canvas, 4.5)

    x = 80
    tag = pill(badge)
    tmp = canvas.convert("RGBA")
    tmp.alpha_composite(tag, (x, 128))
    canvas = tmp.convert("RGB")

    d = ImageDraw.Draw(canvas)
    y = 262
    for line in title:
        f = fit(800, line, 860, 124, -3)
        text(d, (x, y), line, f, WHITE, tracking=-3)
        y += 128

    y += 34
    f_sub = font(600, 46)
    sw = text(d, (x, y), sub, f_sub, TURQ_SITE, tracking=1)
    d.line([(x, y + 70), (x + sw, y + 70)], fill=TURQ_SITE, width=3)
    return save(canvas, f"{OUT}/{dst}", quality=86)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    hero("tease-banner.jpg", "src-art/gen/crystal-01.png",
         ["Our biggest", "sale ever"], "Coming soon")
