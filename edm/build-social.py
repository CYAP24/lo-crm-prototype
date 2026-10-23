"""Footer social icons, taken from the brand's own EDM icon set in Figma.

Figma exports them flattened on white, so the alpha is recovered from luminance
and the glyph re-inked to the footer's text colour.
"""
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
SRC = "src-art/social"
OUT = "build/img"
INK = (58, 64, 71)          # #3A4047, the footer's text colour
SIZE = 56                   # 28pt in the e-mail, at 2x


def icon(name, ink=INK, size=SIZE):
    a = np.asarray(Image.open(f"{SRC}/{name}.png").convert("RGB"), dtype=np.float32)
    lum = a.mean(axis=2)
    # each export has its own paper tone, so key off this image's own corner
    paper = float(np.median([lum[0, 0], lum[0, -1], lum[-1, 0], lum[-1, -1]]))
    ink_lum = float(np.percentile(lum, 2))
    alpha = np.clip((paper - 2.0 - lum) / max(paper - ink_lum, 1.0), 0, 1)
    rgb = np.empty_like(a)
    rgb[...] = np.array(ink, dtype=np.float32)
    im = Image.fromarray(np.dstack([rgb, alpha * 255]).astype("uint8"), "RGBA")
    im = im.crop(im.getbbox())
    # square it so every glyph optically matches on the same baseline
    s = max(im.size)
    pad = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    pad.alpha_composite(im, ((s - im.width) // 2, (s - im.height) // 2))
    pad = pad.resize((size, size), Image.LANCZOS)
    pad.save(f"{OUT}/social-{name}.png")
    print(f"social-{name}.png  {pad.size}")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for n in ("instagram", "facebook", "x", "youtube"):
        icon(n)
