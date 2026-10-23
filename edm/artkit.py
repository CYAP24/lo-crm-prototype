"""Drawing kit for the GemIQ EDM artwork.

Everything is drawn at 2x (1200px canvas = 600pt email column) and the devices
here are the ones the brand's own EDMs use: marker ellipses and slashes, rotated
two-tone price stickers, floating testimonial bubbles, diamond bullets, outlined
panels over a navy glow, and annotated product diagrams.
"""
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "fonts")

# ── palette ───────────────────────────────────────────────────────────────────
BLACK      = (0, 0, 0)
INK        = (9, 10, 12)
WHITE      = (255, 255, 255)
TURQ       = (32, 169, 185)      # brand mark turquoise
TURQ_HOT   = (34, 211, 238)      # testimonial bubble / marker ink
TURQ_DEEP  = (0, 153, 161)
ORANGE     = (242, 87, 0)
NAVY       = (54, 62, 92)
CARD       = (74, 74, 74)
MUTE       = (150, 160, 172)


def font(weight, size):
    return ImageFont.truetype(os.path.join(FONTS, f"Inter-{weight}.ttf"), size)


def serif(size):
    return ImageFont.truetype(os.path.join(FONTS, "PlayfairDisplay-700.ttf"), size)


# ── text ──────────────────────────────────────────────────────────────────────
def measure(d, s, f, tracking=0):
    if not s:
        return 0
    return sum(d.textlength(c, font=f) for c in s) + tracking * (len(s) - 1)


def text(d, xy, s, f, fill, tracking=0, align="l"):
    """Draw a line with letter-spacing. `xy` is the top-left/centre/right, y = top."""
    x, y = xy
    total = measure(d, s, f, tracking)
    if align == "c":
        x -= total / 2
    elif align == "r":
        x -= total
    for c in s:
        d.text((x, y), c, font=f, fill=fill, anchor="la")
        x += d.textlength(c, font=f) + tracking
    return total


def block(d, xy, lines, f, fill, leading, tracking=0, align="l"):
    x, y = xy
    for line in lines:
        text(d, (x, y), line, f, fill, tracking, align)
        y += leading
    return y


def fit(weight, s, max_w, start, tracking=0, floor=28):
    """Largest size at or below `start` that keeps `s` inside `max_w`."""
    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    size = start
    while size > floor and measure(probe, s, font(weight, size), tracking) > max_w:
        size -= 2
    return font(weight, size)


def wrap(d, s, f, max_w, tracking=0):
    out, line = [], ""
    for word in s.split():
        trial = f"{line} {word}".strip()
        if measure(d, trial, f, tracking) <= max_w or not line:
            line = trial
        else:
            out.append(line)
            line = word
    if line:
        out.append(line)
    return out


# ── surfaces ──────────────────────────────────────────────────────────────────
def glow_bg(w, h, spots=(), base=BLACK):
    """Black ground with soft radial glows — the brand's section background."""
    canvas = np.zeros((h, w, 3), dtype=np.float32)
    canvas[:] = base
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    for cx, cy, radius, colour, strength in spots:
        dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / radius
        fall = np.clip(1 - dist, 0, 1) ** 2 * strength
        canvas += fall[:, :, None] * np.array(colour, dtype=np.float32)
    return Image.fromarray(np.clip(canvas, 0, 255).astype("uint8"), "RGB")


NAVY_SPOTS = lambda w, h: [
    (w * 0.02, h * 0.30, w * 0.62, (18, 40, 92), 0.85),
    (w * 1.00, h * 0.72, w * 0.66, (14, 34, 80), 0.80),
    (w * 0.55, h * 0.05, w * 0.55, (10, 22, 52), 0.55),
]


def rounded(size, radius, fill=None, outline=None, width=2):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle(
        (0, 0, size[0] - 1, size[1] - 1), radius=radius,
        fill=fill, outline=outline, width=width)
    return layer


def paste_rotated(base, layer, centre, angle):
    r = layer.rotate(angle, resample=Image.BICUBIC, expand=True)
    base.alpha_composite(r, (int(centre[0] - r.width / 2), int(centre[1] - r.height / 2)))


def drop_shadow(layer, blur=26, offset=(0, 10), opacity=110):
    a = layer.split()[3].point(lambda v: int(v * opacity / 255))
    shadow = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    shadow.putalpha(a)
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    out = Image.new("RGBA", (layer.width + blur * 2, layer.height + blur * 2), (0, 0, 0, 0))
    out.alpha_composite(shadow, (blur + offset[0], blur + offset[1]))
    out.alpha_composite(layer, (blur, blur))
    return out, blur


# ── hand-drawn marks ──────────────────────────────────────────────────────────
def _stroke_path(layer, pts, widths, colour):
    d = ImageDraw.Draw(layer)
    for (x, y), r in zip(pts, widths):
        d.ellipse((x - r, y - r, x + r, y + r), fill=colour)


def marker_ellipse(w, h, colour=TURQ_HOT, stroke=16, overshoot=0.16, seed=7, ss=2):
    """A marker loop drawn round a word — overshoots and crosses itself at the start."""
    rnd = random.Random(seed)
    W, H = w * ss, h * ss
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cx, cy = W / 2, H / 2
    rx, ry = W / 2 - stroke * ss, H / 2 - stroke * ss
    start = -0.45 * math.pi
    span = 2 * math.pi * (1 + overshoot)
    n = 1400
    pts, widths = [], []
    for i in range(n):
        t = i / (n - 1)
        a = start + span * t
        # the loop drifts a little as a real pen would, and lifts at the very end
        drift = 1 + 0.018 * math.sin(a * 2.3 + rnd.random()) + 0.012 * t
        taper = 1.0
        if t > 0.90:
            taper = max(0.25, 1 - (t - 0.90) / 0.10 * 0.8)
        if t < 0.04:
            taper = 0.55 + t / 0.04 * 0.45
        pts.append((cx + math.cos(a) * rx * drift,
                    cy + math.sin(a) * ry * drift - t * ry * 0.06))
        widths.append(stroke * ss / 2 * taper * (1 + 0.16 * math.sin(a * 1.7)))
    _stroke_path(layer, pts, widths, colour + (255,))
    return layer.resize((w, h), Image.LANCZOS)


def marker_slash(w, h, colour=ORANGE, stroke=12, seed=3, ss=2):
    """The orange strike the brand draws through a was-price."""
    W, H = w * ss, h * ss
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    n = 400
    pts, widths = [], []
    for i in range(n):
        t = i / (n - 1)
        x = t * W
        y = H * (0.72 - 0.44 * t) + math.sin(t * math.pi) * H * 0.05
        taper = min(1.0, t / 0.08) * min(1.0, (1 - t) / 0.10)
        pts.append((x, y))
        widths.append(stroke * ss / 2 * (0.45 + 0.55 * taper))
    _stroke_path(layer, pts, widths, colour + (255,))
    return layer.resize((w, h), Image.LANCZOS)


def diamond(size, colour=TURQ):
    """Brilliant-cut bullet glyph."""
    s = size * 4
    layer = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    top, girdle, bottom = s * 0.18, s * 0.42, s * 0.88
    d.polygon([(s * 0.18, top), (s * 0.82, top), (s * 0.96, girdle), (s * 0.04, girdle)],
              fill=colour + (255,))
    d.polygon([(s * 0.04, girdle), (s * 0.96, girdle), (s * 0.50, bottom)],
              fill=colour + (255,))
    cut = (4, 10, 14, 255)
    for x in (0.33, 0.50, 0.67):
        d.line([(s * (0.18 + (x - 0.18) * 0.30), top), (s * x, girdle)], fill=cut, width=max(2, s // 90))
    d.line([(s * 0.04, girdle), (s * 0.96, girdle)], fill=cut, width=max(2, s // 90))
    for x in (0.28, 0.72):
        d.line([(s * x, girdle), (s * 0.50, bottom)], fill=cut, width=max(2, s // 110))
    return layer.resize((size, size), Image.LANCZOS)


def stars(count=5, size=26, colour=ORANGE, gap=6):
    w = count * size + (count - 1) * gap
    layer = Image.new("RGBA", (w * 4, size * 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(count):
        cx, cy, r = (i * (size + gap) + size / 2) * 4, size * 2, size * 1.9
        pts = []
        for k in range(10):
            a = -math.pi / 2 + k * math.pi / 5
            rad = r if k % 2 == 0 else r * 0.46
            pts.append((cx + math.cos(a) * rad, cy + math.sin(a) * rad))
        d.polygon(pts, fill=colour + (255,))
    return layer.resize((w, size), Image.LANCZOS)


def circle_crop(img, size):
    im = img.convert("RGB")
    s = min(im.size)
    im = im.crop(((im.width - s) // 2, 0, (im.width + s) // 2, s)).resize((size * 4, size * 4), Image.LANCZOS)
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    out = Image.new("RGBA", (size * 4, size * 4), (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    return out.resize((size, size), Image.LANCZOS)


# ── composite devices ─────────────────────────────────────────────────────────
def price_sticker(top_line, big_line, sub_line, w=560, h=300):
    """The rotated two-tone sale sticker: white over turquoise."""
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    split = int(h * 0.60)
    ImageDraw.Draw(layer).rounded_rectangle((0, 0, w - 1, h - 1), radius=34, fill=TURQ + (255,))
    top = Image.new("RGBA", (w, split), (0, 0, 0, 0))
    ImageDraw.Draw(top).rounded_rectangle((0, 0, w - 1, split + 40), radius=34, fill=WHITE + (255,))
    layer.alpha_composite(top)

    d = ImageDraw.Draw(layer)
    inner = w - 56
    f_big = fit(800, big_line, inner * 0.62, int(h * 0.30))
    f_small = fit(700, top_line, inner * 0.34, int(h * 0.19))
    small_w, big_w = measure(d, top_line, f_small), measure(d, big_line, f_big)
    gap = 16
    x = (w - (small_w + gap + big_w)) / 2
    base = split * 0.52
    text(d, (x, base - f_small.size * 0.62), top_line, f_small, TURQ_DEEP)
    text(d, (x + small_w + gap, base - f_big.size * 0.72), big_line, f_big, TURQ_DEEP)
    f_sub = fit(800, sub_line, inner, int(h * 0.21))
    text(d, (w / 2, split + (h - split - f_sub.size * 1.25) / 2), sub_line, f_sub, WHITE,
         tracking=1.6, align="c")
    return layer


def bubble(quote, name, avatar, fill, ink, sub_ink, w=620, avatar_px=78, radius=30):
    """A floating testimonial card, as the brand drops over its product shots."""
    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    f_q, f_n = font(600, 36), font(700, 26)
    lines = wrap(probe, quote, f_q, w - 76)
    h = 40 + len(lines) * 48 + 24 + avatar_px + 36
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=fill + (255,))
    d = ImageDraw.Draw(layer)
    y = block(d, (38, 34), lines, f_q, ink, 48)
    y += 20
    layer.alpha_composite(circle_crop(avatar, avatar_px), (38, int(y)))
    text(d, (38 + avatar_px + 22, y + 8), name, f_n, sub_ink)
    layer.alpha_composite(stars(5, 26), (38 + avatar_px + 22, int(y + 44)))
    return layer


def chip(d, layer, xy, label, fill=ORANGE, ink=WHITE, size=26, pad_x=20, h=50, radius=10):
    f = font(800, size)
    w = measure(d, label, f, 2) + pad_x * 2
    x, y = xy
    d.rounded_rectangle((x, y, x + w, y + h), radius=radius, fill=fill + (255,))
    text(d, (x + w / 2, y + (h - size * 1.0) / 2 + 1), label, f, ink, tracking=2, align="c")
    return w


def pill(label, fill=WHITE, ink=(10, 12, 14), size=30, pad_x=36, h=74):
    """A baked call-to-action for a card whose whole image is the link."""
    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    f = font(800, size)
    w = int(measure(probe, label, f, 0.5) + pad_x * 2)
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=h // 2, fill=fill + (255,))
    text(d, (w / 2, (h - size * 1.22) / 2), label, f, ink, tracking=0.5, align="c")
    return layer


def price_card(title, was, now, product, w=1040, h=500, note=None,
               badge=None, radius=32, product_scale=0.98, product_nudge=0,
               lead=("Now", "yours", "for"), cta=None,
               badge_fill=ORANGE, badge_ink=WHITE):
    """Grey card: name, saving chip, struck was-price, 'Now yours for' + a very
    large price, product bleeding off the right edge.

    The price is the largest thing on the card and nothing else competes with it;
    the chip states the saving, the strike anchors it, the lead stays small.
    """
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=CARD + (255,))
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=255)

    # product, clipped to the card and hanging off the right
    prod = product.convert("RGBA")
    ph = int(h * product_scale)
    prod = prod.resize((max(1, round(prod.width * ph / prod.height)), ph), Image.LANCZOS)
    shelf = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    shelf.alpha_composite(prod, (int(w - prod.width * 0.80) + product_nudge, h - ph))
    layer.alpha_composite(Image.composite(shelf, Image.new("RGBA", (w, h), (0, 0, 0, 0)), mask))

    d = ImageDraw.Draw(layer)
    pad = 48
    col = w * 0.56                       # the text column; the product owns the rest
    f_title = fit(800, title, col - 24, 54, -1)
    tw = text(d, (pad, 40), title, f_title, WHITE, tracking=-1)
    if badge:
        chip(d, layer, (pad + tw + 20, 38), badge, fill=badge_fill, ink=badge_ink)

    y_was = 126
    f_was = font(600, 46)
    was_w = measure(d, was, f_was)
    text(d, (pad, y_was), was, f_was, (226, 228, 230))
    layer.alpha_composite(marker_slash(int(was_w + 40), 60, ORANGE, stroke=11), (pad - 20, y_was + 2))

    f_lead = font(500, 34)
    lead_w = max(measure(d, s, f_lead) for s in lead) if lead else 0
    lead_right = pad + lead_w
    ly = 220 + (3 - len(lead)) * 19
    for line in lead:
        text(d, (lead_right, ly), line, f_lead, WHITE, align="r")
        ly += 38
    now_x = lead_right + (16 if lead else 0)
    f_now = fit(800, now, col - (now_x - pad), 128, -4, floor=56)
    text(d, (now_x, 190 + (128 - f_now.size) * 0.46), now, f_now, WHITE, tracking=-4)

    if note:
        f_note = fit(600, note, col - 8, 30, floor=22)
        text(d, (pad, 350), note, f_note, (226, 230, 234))
    if cta:
        layer.alpha_composite(pill(cta), (pad, h - 102))
    return layer


def light_streak(w, h, core=2.0, spread=0.44, tint=TURQ_HOT, strength=1.0):
    """The signature bar of light from the product photography, as a graphic.

    A hot white core that falls away fast, with the brand turquoise surviving
    furthest into the dark — which is what the real LED does on camera.
    """
    yy = np.abs(np.linspace(-1, 1, h))[:, None]
    hot = np.exp(-(yy / (core / h * 10)) ** 2)
    bleed = np.exp(-(yy / spread) ** 2)
    ramp = np.sin(np.linspace(0, np.pi, w))[None, :] ** 0.35      # fades at both ends
    hot, bleed = hot * ramp * strength, bleed * ramp * strength
    rgb = (hot[:, :, None] * np.array([255.0, 255.0, 255.0])
           + bleed[:, :, None] * np.array(tint, dtype=float) * 0.55)
    return Image.fromarray(np.clip(rgb, 0, 255).astype("uint8"), "RGB")


def lit_type(lines, size, w, leading=None, tracking=-8, band=0.50, bloom=TURQ_HOT,
             falloff=0.21, floor=44):
    """Display caps lit from behind by the light bar, rather than filled flat.

    The one gradient moment in the system: the brand's product is a light, so the
    campaign title is the thing it lights. Used once per email and nowhere else.
    """
    leading = leading or int(size * 0.92)
    h = leading * len(lines) + int(size * 0.5)
    f = font(900, size)

    mask = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(mask)
    y = int(size * 0.16)
    for line in lines:
        text(md, (w / 2, y), line, f, 255, tracking=tracking, align="c")
        y += leading

    # the light itself: hot across a horizontal band, falling to near-black
    yy = np.linspace(0, 1, h)[:, None]
    d = np.abs(yy - band)
    lum = np.clip(np.exp(-(d / falloff) ** 2), 0, 1)
    base = floor + (255 - floor) * lum
    rgb = np.repeat(base, w, axis=1)[:, :, None] * np.ones(3)
    cool = np.clip(np.exp(-((yy - band - 0.30) / 0.17) ** 2), 0, 1) * 0.55
    rgb += np.repeat(cool, w, axis=1)[:, :, None] * np.array(bloom, dtype=float) * 0.75
    fill = Image.fromarray(np.clip(rgb, 0, 255).astype("uint8"), "RGB")

    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    # bloom behind the letterforms, so the light looks like it is coming through
    halo = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    halo.paste(Image.new("RGB", (w, h), bloom), (0, 0), mask)
    halo = halo.filter(ImageFilter.GaussianBlur(size * 0.17))
    halo.putalpha(halo.split()[3].point(lambda v: int(v * 0.5)))
    canvas.alpha_composite(halo)
    canvas.paste(fill, (0, 0), mask)
    return canvas


def outlined_panel(w, h, radius=56, stroke=(255, 255, 255, 70)):
    return rounded((w, h), radius, fill=None, outline=stroke, width=3)


def callout_diagram(canvas, product, calls, centre, prod_h,
                    label_w=330, dot=20, ink=TURQ, lead=5):
    """Product with turquoise anchor dots, elbowed leader lines and labelled copy.

    Each leader drops out of the bottom of its own label block, runs to the dot's
    row, then straight across — so a line never crosses the words it belongs to.
    """
    prod = product.convert("RGBA")
    prod = prod.resize((max(1, round(prod.width * prod_h / prod.height)), prod_h), Image.LANCZOS)
    px, py = int(centre[0] - prod.width / 2), int(centre[1] - prod.height / 2)
    canvas.alpha_composite(prod, (px, py))

    d = ImageDraw.Draw(canvas)
    f_t, f_b = font(700, 38), font(400, 32)
    for c in calls:
        dx = px + prod.width * c["dot"][0]
        dy = py + prod.height * c["dot"][1]
        lx, ly = c["lx"], c["ly"]

        titles = wrap(d, c["title"], f_t, label_w)
        y = block(d, (lx, ly), titles, f_t, WHITE, 44)
        bodies = wrap(d, c["body"], f_b, label_w)
        bottom = block(d, (lx, y + 10), bodies, f_b, (196, 204, 212), 40)

        # route the leader so it never runs through its own words
        if ly - 8 <= dy <= bottom + 8:
            inner = lx + label_w + 18 if c["side"] == "l" else lx - 18
            d.line([(inner, dy), (dx, dy)], fill=ink + (255,), width=lead)
        else:
            sx = lx + 28
            stem_y = ly - 16 if dy < ly else bottom + 8
            d.line([(sx, stem_y), (sx, dy)], fill=ink + (255,), width=lead)
            d.line([(sx, dy), (dx, dy)], fill=ink + (255,), width=lead)

        halo = Image.new("RGBA", (dot * 8, dot * 8), (0, 0, 0, 0))
        ImageDraw.Draw(halo).ellipse((0, 0, dot * 8 - 1, dot * 8 - 1), fill=ink + (95,))
        halo = halo.filter(ImageFilter.GaussianBlur(dot * 0.9))
        canvas.alpha_composite(halo, (int(dx - dot * 4), int(dy - dot * 4)))
        d.ellipse((dx - dot, dy - dot, dx + dot, dy + dot), fill=ink + (255,))
    return canvas


def cut_out(path, pad_alpha=24):
    im = Image.open(path).convert("RGBA")
    a = np.asarray(im)[:, :, 3] > pad_alpha
    rows, cols = np.where(a.any(axis=1))[0], np.where(a.any(axis=0))[0]
    return im.crop((cols[0], rows[0], cols[-1] + 1, rows[-1] + 1))


def save(img, path, quality=88):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if img.mode == "RGBA":
        flat = Image.new("RGB", img.size, BLACK)
        flat.paste(img, mask=img.split()[3])
        img = flat
    img.convert("RGB").save(path, quality=quality, optimize=True, progressive=True)
    print(f"{os.path.basename(path):<28} {img.size}")
