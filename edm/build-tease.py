"""The single teaser banner.

Everything the pre-hype is allowed to say lives in one poster: that it is Black
Friday, that it is the biggest saving the brand has run, when it opens, and the
number $700 — never what the $700 comes off.

Built in the campaign's own system: black ground, white Inter caps on one left
axis, the turquoise marker ellipse, the rotated two-tone sticker breaking the
grid, and the signature bar of light as the horizon between the statement and
the offer. Crystal is lighting only — facet glints, a faint bloom, grain.
Nothing coloured crosses a letterform.
"""
import os

import numpy as np
from PIL import Image, ImageDraw

from artkit import (BLACK, TURQ, TURQ_DEEP, TURQ_HOT, WHITE, drop_shadow, fit,
                    font, light_streak, marker_ellipse, measure, paste_rotated,
                    price_sticker, save, text)
from refract import grain, screen, vignette

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
W = 1200
OUT = "build/img"
MICRO = (142, 150, 160)
AXIS = 92


def facet(w, h, centre, size=90, power=1.0, arms=4, rot=0.0):
    """A specular hit — white core, turquoise skirt."""
    cx, cy = centre
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / size
    a = np.arctan2(yy - cy, xx - cx) + rot
    spikes = np.abs(np.cos(a * arms / 2.0)) ** 44
    core = np.exp(-(r ** 2) * 3.0)
    arm = spikes * np.exp(-r * 2.2)
    rgb = ((core * 0.95 + arm * 0.8) * power)[:, :, None] * np.array([255.0, 255, 255])
    rgb += ((core * 0.45 + arm * 0.3) * power)[:, :, None] * np.array(TURQ_HOT, float) * 0.5
    return Image.fromarray(np.clip(rgb, 0, 255).astype("uint8"), "RGB")


def bloom(w, h, centre, radius, colour=TURQ_DEEP, power=0.14):
    cx, cy = centre
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / radius
    g = np.exp(-(d ** 2)) * power
    return Image.fromarray(
        np.clip(g[:, :, None] * np.array(colour, float), 0, 255).astype("uint8"), "RGB")


def overlay(canvas, layer, xy):
    tmp = canvas.convert("RGBA")
    tmp.alpha_composite(layer, (int(xy[0]), int(xy[1])))
    return tmp.convert("RGB")


def bar_at(canvas, y, strength=0.95, height=320):
    plate = Image.new("RGB", canvas.size, BLACK)
    plate.paste(light_streak(canvas.width, height, core=2.1, spread=0.33,
                             strength=strength), (0, int(y - height / 2)))
    return screen(canvas, plate)


def banner(dst, H=1280):
    canvas = Image.new("RGB", (W, H), BLACK)
    canvas = screen(canvas, bloom(W, H, (W * 0.46, H * 0.56), W * 0.52, power=0.15))
    canvas = bar_at(canvas, H * 0.545, strength=0.95)
    for at, size, power in (((W * 0.88, H * 0.20), 70, 0.8),
                            ((W * 0.12, H * 0.76), 52, 0.5),
                            ((W * 0.80, H * 0.52), 46, 0.45)):
        canvas = screen(canvas, facet(W, H, at, size=size, power=power))
    canvas = vignette(grain(canvas, 5.5), strength=0.42)

    d = ImageDraw.Draw(canvas)
    text(d, (AXIS, 58), "GEMIQ", font(600, 22), MICRO, tracking=3)
    text(d, (W - AXIS, H - 80), "27 NOVEMBER — 1 DECEMBER 2026", font(600, 22), MICRO,
         tracking=3, align="r")

    # ── the statement, above the horizon
    y = 206
    for line in ("OUR BIGGEST", "BLACK FRIDAY"):
        text(d, (AXIS, y), line, fit(900, line, 1000, 92, -4), WHITE, tracking=-4)
        y += 108

    hit = "EVER."
    f_hit = fit(900, hit, 860, 116, -4)
    hit_w = measure(d, hit, f_hit, -4)
    text(d, (AXIS, y), hit, f_hit, WHITE, tracking=-4)
    ring = marker_ellipse(int(hit_w + 162), 214, TURQ_HOT, stroke=16, seed=11)
    ring = ring.rotate(-1.8, resample=Image.BICUBIC, expand=True)
    canvas = overlay(canvas, ring, (AXIS - 80, y - 48))

    # ── the offer, below it
    d = ImageDraw.Draw(canvas)
    oy = int(H * 0.625)
    text(d, (AXIS, oy), "UP TO", font(700, 36), WHITE, tracking=11)

    f_num = fit(900, "$700", 760, 196, -8)
    f_off = font(800, 68)
    num_w = measure(d, "$700", f_num, -8)
    text(d, (AXIS, oy + 52), "$700", f_num, WHITE, tracking=-8)
    text(d, (AXIS + num_w + 24, oy + 52 + f_num.size * 0.50), "OFF", f_off,
         TURQ_HOT, tracking=4)

    ry = oy + 52 + f_num.size * 1.18
    ImageDraw.Draw(canvas).line([(AXIS, ry), (AXIS + 150, ry)], fill=TURQ, width=3)
    d = ImageDraw.Draw(canvas)
    text(d, (AXIS, ry + 30), "WE'RE NOT SAYING OFF WHAT. YET.",
         font(700, 30), (214, 221, 229), tracking=5)

    # ── the sticker breaks the grid
    tag = price_sticker("STARTS", "27 NOV", "five days only", w=448, h=238)
    shadow, _ = drop_shadow(tag, blur=30, offset=(0, 14), opacity=135)
    tmp = canvas.convert("RGBA")
    paste_rotated(tmp, shadow, (918, 196), -8)
    return save(tmp.convert("RGB"), f"{OUT}/{dst}", quality=84)




# ── closing panel ─────────────────────────────────────────────────────────────
def date_pill(left, right, h=76, pad=36, gap=26):
    """Dark outlined capsule holding the window, echoing the site's countdown."""
    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    f = font(800, 38)
    lw, rw = measure(probe, left, f, 1.5), measure(probe, right, f, 1.5)
    dash = 34
    w = int(pad + lw + gap + dash + gap + rw + pad)
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=h // 2, fill=(10, 13, 17, 225),
                        outline=(255, 255, 255, 70), width=2)
    ty = (h - 38 * 1.22) / 2
    x = pad
    text(d, (x, ty), left, f, WHITE, tracking=1.5)
    x += lw + gap
    d.line([(x, h / 2), (x + dash, h / 2)], fill=TURQ_HOT + (255,), width=4)
    x += dash + gap
    text(d, (x, ty), right, f, WHITE, tracking=1.5)
    return layer


def closing(dst, head, left, right, strap, H=620):
    canvas = Image.new("RGB", (W, H), BLACK)
    canvas = screen(canvas, bloom(W, H, (W * 0.5, H * 0.60), W * 0.48, power=0.14))
    canvas = bar_at(canvas, H * 0.78, strength=0.88)
    for at, size, power in (((W * 0.13, H * 0.30), 62, 0.6),
                            ((W * 0.88, H * 0.42), 52, 0.5)):
        canvas = screen(canvas, facet(W, H, at, size=size, power=power))
    canvas = vignette(grain(canvas, 5.0), strength=0.46)
    d = ImageDraw.Draw(canvas)
    f = fit(900, head, W - 160, 112, -4)
    text(d, (W / 2, H * 0.17), head, f, WHITE, tracking=-4, align="c")

    tag = date_pill(left, right)
    canvas = overlay(canvas, tag, ((W - tag.width) // 2, int(H * 0.50)))
    d = ImageDraw.Draw(canvas)
    text(d, (W / 2, H * 0.68), strap, font(800, 30), TURQ_HOT, tracking=9, align="c")
    return save(canvas, f"{OUT}/{dst}", quality=86)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    banner("tease-banner.jpg")
