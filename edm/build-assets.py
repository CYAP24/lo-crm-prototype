"""Derive the e-mail image set from the Figma Black Friday photography."""
import os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

OUT = "build/img"
A = "assets"
os.makedirs(OUT, exist_ok=True)
made = []


def save(canvas, dst, quality=86):
    canvas.save(os.path.join(OUT, dst), quality=quality, optimize=True, progressive=True)
    made.append((dst, canvas.size))


def content_bounds(path, thresh=18):
    a = np.asarray(Image.open(path).convert("L"), dtype=np.uint8)
    rows = np.where(a.max(axis=1) > thresh)[0]
    cols = np.where(a.max(axis=0) > thresh)[0]
    return cols[0], rows[0], cols[-1], rows[-1]


def stage_crop(src, dst, out_w, out_h, bottom_pad=0.05):
    """Scale a black-stage photograph to width and window it around the lit subject."""
    im = Image.open(src).convert("RGB")
    _, y0, _, y1 = content_bounds(src)
    scale = out_w / im.width
    im = im.resize((out_w, round(im.height * scale)), Image.LANCZOS)
    cy0, cy1 = y0 * scale, y1 * scale
    if (cy1 - cy0) + out_h * bottom_pad <= out_h:
        top = cy0 - (out_h - (cy1 - cy0)) / 2
    else:
        top = cy1 + out_h * bottom_pad - out_h
    top = int(max(0, min(top, im.height - out_h)))
    canvas = Image.new("RGB", (out_w, out_h), (0, 0, 0))
    canvas.paste(im.crop((0, top, out_w, top + out_h)), (0, 0))
    save(canvas, dst)


def trim(im):
    """Crop a cut-out to the bounds of anything the eye can actually see."""
    a = np.asarray(im)
    vis = a[:, :, 3] > 24
    rows, cols = np.where(vis.any(axis=1))[0], np.where(vis.any(axis=0))[0]
    return im.crop((cols[0], rows[0], cols[-1] + 1, rows[-1] + 1))


def stage_plate(out_w, out_h):
    """The shared card background: near-black with one soft overhead key light."""
    plate = Image.new("RGB", (out_w, out_h), (7, 8, 10))
    glow = Image.new("L", (out_w, out_h), 0)
    ImageDraw.Draw(glow).ellipse(
        (out_w * 0.14, -out_h * 0.34, out_w * 0.86, out_h * 0.86), fill=72)
    glow = glow.filter(ImageFilter.GaussianBlur(out_w * 0.11))
    return Image.composite(Image.new("RGB", (out_w, out_h), (38, 44, 52)), plate, glow)


def card(src, dst, out_w=1104, out_h=720, inset=0.84, drop=0.02):
    """Stand a cut-out product on the shared plate at a consistent size, never touching an edge."""
    im = trim(Image.open(src).convert("RGBA"))
    s = min(out_w * inset / im.width, out_h * inset / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    canvas = stage_plate(out_w, out_h).convert("RGBA")
    canvas.alpha_composite(im, ((out_w - im.width) // 2,
                                round((out_h - im.height) / 2 + out_h * drop)))
    save(canvas.convert("RGB"), dst)


def plate_light(src, dst, out_w, out_h, inset=0.94, bg=(255, 255, 255)):
    """Re-centre a product shot on a clean white plate."""
    im = Image.open(src)
    if im.mode == "RGBA":
        im = trim(im.convert("RGBA"))
        flat = Image.new("RGBA", im.size, bg + (255,))
        flat.alpha_composite(im)
        im = flat.convert("RGB")
    else:
        im = im.convert("RGB")
        a = np.asarray(im.convert("L"), dtype=np.int16)
        rows, cols = np.where((a < 243).any(axis=1))[0], np.where((a < 243).any(axis=0))[0]
        im = im.crop((cols[0], rows[0], cols[-1] + 1, rows[-1] + 1))
    s = min(out_w * inset / im.width, out_h * inset / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    canvas = Image.new("RGB", (out_w, out_h), bg)
    canvas.paste(im, ((out_w - im.width) // 2, (out_h - im.height) // 2))
    save(canvas, dst, quality=88)


# Heroes — the same frame with the lights off, then on.
stage_crop(f"{A}/extra/f01.png", "hero-teaser.jpg", 1200, 1000)
stage_crop(f"{A}/bf/hero_a.png", "hero-launch.jpg", 1200, 1000)

# Offer cards — one plate, three products, matched footing.
card(f"{A}/extra/gs_closeup.png", "card-gemsparkle.jpg", inset=0.88)
card(f"{A}/raw/r17.png",          "card-3pack.jpg",      inset=0.80)
card(f"{A}/extra/m04.png",        "card-mini.jpg",       inset=0.82)

# Feature plates — daylight, on white.
plate_light(f"{A}/extra/gs_closeup.png", "feature-gemsparkle.jpg", 1104, 860, inset=0.90)
plate_light(f"{A}/extra/m07.png",        "feature-mini.jpg",       1104, 760, inset=0.92,
            bg=(242, 244, 246))
plate_light(f"{A}/raw/mini01.png",       "mini-in-hand.jpg",       1104, 740, inset=0.88)

for m in made:
    print(m)


def pay_strip(dst, sources, out_w=1104, row_h=120, gap=58, ink=(214, 220, 228), bg=(10, 12, 15)):
    """One muted trust strip: every mark flattened to a single ink, sized by optical weight."""
    marks = []
    for src, weight in sources:
        im = Image.open(src).convert("RGBA")
        flat = Image.new("RGBA", im.size, (255, 255, 255, 255))
        flat.alpha_composite(im)
        g = np.asarray(flat.convert("L"), dtype=np.int16)
        alpha = (np.clip((255 - g) / 255.0, 0, 1) ** 0.55 * 255).astype("uint8")
        rows, cols = np.where((alpha > 20).any(axis=1))[0], np.where((alpha > 20).any(axis=0))[0]
        alpha = alpha[rows[0]:rows[-1] + 1, cols[0]:cols[-1] + 1]
        mark = Image.fromarray(
            np.dstack([np.full(alpha.shape + (3,), ink, dtype="uint8"), alpha]), "RGBA")
        h = round(row_h * weight)
        mark = mark.resize((max(1, round(mark.width * h / mark.height)), h), Image.LANCZOS)
        marks.append(mark)
    total = sum(m.width for m in marks) + gap * (len(marks) - 1)
    if total > out_w - 80:                         # keep the strip inside the column
        k = (out_w - 80) / total
        marks = [m.resize((max(1, round(m.width * k)), max(1, round(m.height * k))), Image.LANCZOS)
                 for m in marks]
        gap = round(gap * k)
        total = sum(m.width for m in marks) + gap * (len(marks) - 1)
    canvas = Image.new("RGBA", (out_w, row_h), bg + (255,))
    x = (out_w - total) // 2
    for m in marks:
        canvas.alpha_composite(m, (x, (row_h - m.height) // 2))
        x += m.width + gap
    save(canvas.convert("RGB"), dst, quality=92)


pay_strip("pay-dark.jpg", [
    (f"{A}/extra/f02.png", 0.46),   # Visa
    (f"{A}/extra/f12.png", 0.56),   # PayPal
    (f"{A}/extra/f10.png", 0.50),   # Apple Pay
    (f"{A}/extra/f09.png", 0.46),   # Google Pay
    (f"{A}/extra/f05.png", 0.42),   # Shop Pay
    (f"{A}/extra/f17.png", 0.34),   # Klarna
    (f"{A}/raw/r03.png",   0.34),   # Stripe
])
print(made[-1])
