"""Compose the EDM section artwork from the GemIQ campaign photography.

Every canvas is 1200px = the 600pt email column at 2x.
"""
import os
from PIL import Image, ImageDraw, ImageFilter

from artkit import (BLACK, CARD, MUTE, NAVY, NAVY_SPOTS, ORANGE, TURQ, TURQ_DEEP,
                    TURQ_HOT, WHITE, block, bubble, callout_diagram, chip,
                    circle_crop, cut_out, diamond, drop_shadow, fit, font,
                    glow_bg, light_streak, lit_type, marker_ellipse, measure,
                    outlined_panel, paste_rotated, pill, price_card,
                    price_sticker, rounded, save, serif, stars, text, wrap)
import numpy as np
from refract import screen as refract_screen

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
W = 1200
OUT = "build/img"

A = "src-art/photo"
PH_LIT = f"{A}/hero_a.png"          # both products, lit
PH_DARK = f"{A}/f01.png"         # the same frame, unlit
P_SPARKLE = f"{A}/gs_closeup.png"
P_3PACK = f"{A}/r17.png"
P_MINI = f"{A}/m04.png"


# ── shared helpers ────────────────────────────────────────────────────────────
def photo_band(src, w, h, anchor="bottom", darken=0.0, bias=0.46, thr=90):
    """Scale to the column width, then window on the lit subject rather than the frame."""
    im = Image.open(src).convert("RGB")
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    if im.height < h:
        pad = Image.new("RGB", (w, h), BLACK)
        pad.paste(im, (0, h - im.height))
        im = pad
    if anchor == "fit":
        k = min(w / im.width, h / im.height)
        sized = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        plate = Image.new("RGB", (w, h), im.getpixel((2, 2)))
        plate.paste(sized, ((w - sized.width) // 2, (h - sized.height) // 2))
        return Image.blend(plate, Image.new("RGB", (w, h), BLACK), darken) if darken else plate
    if anchor == "subject":
        rows = np.asarray(im.convert("L"), dtype=int).max(axis=1)
        lit = np.where(rows > thr)[0]
        centre = (lit[0] + lit[-1]) / 2 if len(lit) else im.height / 2
        top = int(min(max(0, centre - h * bias), im.height - h))
    elif anchor == "bottom":
        top = im.height - h
    else:
        top = max(0, (im.height - h) // 2)
    im = im.crop((0, top, w, top + h))
    if darken:
        im = Image.blend(im, Image.new("RGB", im.size, BLACK), darken)
    return im


def fade_to_black(im, px, where="top"):
    """Blend a photograph into the black section above or below it."""
    grad = Image.new("L", (1, im.height), 255)
    g = grad.load()
    for y in range(im.height):
        if where == "top" and y < px:
            g[0, y] = int(255 * (y / px))
        elif where == "bottom" and y > im.height - px:
            g[0, y] = int(255 * ((im.height - y) / px))
    mask = grad.resize(im.size)
    return Image.composite(im, Image.new("RGB", im.size, BLACK), mask)


def avatars():
    simon = Image.open(f"{A}/q03.png").convert("RGB").crop((387, 103, 536, 253))
    amy = Image.open(f"{A}/q09.png").convert("RGB").crop((115, 35, 305, 225))
    return simon, amy


# ── hero ──────────────────────────────────────────────────────────────────────
def hero(dst, photo, lines, circled, sticker):
    H, BAND = 1240, 830
    canvas = Image.new("RGBA", (W, H), BLACK + (255,))
    band = fade_to_black(photo_band(photo, W, BAND, anchor="subject", darken=0.03), 210, "top")
    canvas.alpha_composite(band.convert("RGBA"), (0, H - BAND))

    d = ImageDraw.Draw(canvas)
    x, y = 92, 118
    for line in lines:
        f = fit(900, line, 1012, 88, -4)
        text(d, (x, y), line, f, WHITE, tracking=-4)
        y += 104

    # the ellipse arc rides above its own line, so the line before it needs
    # clearance or the arc cuts through the previous word
    y += 36
    f_hit = fit(900, circled, 930, 102, -4)
    hit_w = measure(d, circled, f_hit, -4)
    text(d, (x, y), circled, f_hit, WHITE, tracking=-4)
    ring = marker_ellipse(int(hit_w + 152), 190, TURQ_HOT, stroke=15, seed=11)
    ring = ring.rotate(-1.6, resample=Image.BICUBIC, expand=True)
    canvas.alpha_composite(ring, (int(x - 76), int(y - 38)))

    tag = price_sticker(*sticker, w=396, h=216)
    shadow, pad = drop_shadow(tag, blur=28, offset=(0, 12), opacity=130)
    paste_rotated(canvas, shadow, (938, 168), -8)
    return save(canvas, f"{OUT}/{dst}")


# ── campaign title ────────────────────────────────────────────────────────────
def title_card(dst, lines, size=196, H=580):
    """BLACK FRIDAY lit by the product's own bar of light.

    The streak runs between the two words and the type sits over it, so the
    first line stays bright white and the second catches the turquoise.
    """
    canvas = glow_bg(W, H, [(W * 0.5, H * 0.52, W * 0.82, (10, 30, 62), 0.75)])

    block_img = lit_type(lines, size, W)
    top = int(H * 0.50 - block_img.height * 0.54)

    # the streak is light: screen it in. Pasting it would stamp its black
    # backing over the glow as a hard-edged rectangle.
    plate = Image.new("RGB", (W, H), BLACK)
    plate.paste(light_streak(W, 300, core=2.6, spread=0.30, strength=0.85),
                (0, int(top + block_img.height * 0.50 - 150)))
    canvas = refract_screen(canvas, plate).convert("RGBA")

    canvas.alpha_composite(block_img, (0, top))
    return save(canvas, f"{OUT}/{dst}")


def supplied(dst, src, width=W, quality=86):
    """Drop in finished campaign artwork at the column width."""
    im = Image.open(src)
    if im.mode == "RGBA":
        flat = Image.new("RGBA", im.size, (0, 0, 0, 255))
        flat.alpha_composite(im)
        im = flat
    im = im.convert("RGB")
    im = im.resize((width, max(1, round(im.height * width / im.width))), Image.LANCZOS)
    return save(im, f"{OUT}/{dst}", quality=quality)


def divider(dst, H=64):
    canvas = Image.new("RGB", (W, H), BLACK)
    bar = light_streak(W, H, core=1.6, spread=0.5, strength=0.62)
    canvas.paste(bar, (0, 0))
    return save(canvas, f"{OUT}/{dst}", quality=92)


# ── offer cards, one image per product so each can carry its own link ─────────
def offer_card(dst, c, card_h=500, pad=40):
    H = card_h + pad * 2
    canvas = glow_bg(W, H, [(W * 0.10, H * 0.14, W * 0.80, (12, 26, 60), 0.5),
                            (W * 0.94, H * 0.88, W * 0.72, (10, 22, 54), 0.45)]).convert("RGBA")
    canvas.alpha_composite(
        price_card(c["title"], c["was"], c["now"], c["product"],
                   w=1040, h=card_h, note=c.get("note"), badge=c.get("badge"),
                   product_scale=c.get("scale", 0.98), product_nudge=c.get("nudge", 0),
                   lead=c.get("lead", ("Now", "yours", "for")), cta=c.get("cta"),
                   # the site's SAVE chips are gold, not orange
                   badge_fill=(240, 198, 108), badge_ink=(58, 40, 6)),
        (80, pad))
    return save(canvas, f"{OUT}/{dst}")


# ── payment strip ─────────────────────────────────────────────────────────────
def pay_strip(dst):
    marks = [(f"{A}/f02.png", 0.46), (f"{A}/f12.png", 0.56),
             (f"{A}/f10.png", 0.50), (f"{A}/f09.png", 0.46),
             (f"{A}/f05.png", 0.42), (f"{A}/f17.png", 0.34),
             (f"{A}/r03.png", 0.34)]
    H, row = 164, 96
    canvas = glow_bg(W, H, [(W * 0.5, H * 0.5, W * 0.7, (12, 26, 58), 0.5)]).convert("RGBA")
    built = []
    for src, weight in marks:
        im = Image.open(src).convert("RGBA")
        flat = Image.new("RGBA", im.size, (255, 255, 255, 255))
        flat.alpha_composite(im)
        g = np.asarray(flat.convert("L"), dtype=np.int16)
        alpha = (np.clip((255 - g) / 255.0, 0, 1) ** 0.55 * 255).astype("uint8")
        rows, cols = np.where((alpha > 20).any(axis=1))[0], np.where((alpha > 20).any(axis=0))[0]
        alpha = alpha[rows[0]:rows[-1] + 1, cols[0]:cols[-1] + 1]
        mark = Image.fromarray(np.dstack([np.full(alpha.shape + (3,), (188, 196, 206), dtype="uint8"), alpha]), "RGBA")
        h = round(row * weight)
        built.append(mark.resize((max(1, round(mark.width * h / mark.height)), h), Image.LANCZOS))
    gap = 54
    total = sum(m.width for m in built) + gap * (len(built) - 1)
    k = min(1.0, (W - 120) / total)
    if k < 1:
        built = [m.resize((round(m.width * k), round(m.height * k)), Image.LANCZOS) for m in built]
        gap = round(gap * k)
        total = sum(m.width for m in built) + gap * (len(built) - 1)
    x = (W - total) // 2
    for m in built:
        canvas.alpha_composite(m, (x, (H - m.height) // 2))
        x += m.width + gap
    return save(canvas, f"{OUT}/{dst}", quality=92)


# ── annotated diagram ─────────────────────────────────────────────────────────
def diagram(dst, head, product, calls, prod_h, centre, label_w=330, H=1120):
    canvas = glow_bg(W, H, NAVY_SPOTS(W, H)).convert("RGBA")
    d = ImageDraw.Draw(canvas)
    y = 92
    for line in head:
        text(d, (W / 2, y), line, font(800, 58), WHITE, tracking=-2, align="c")
        y += 68
    callout_diagram(canvas, cut_out(product), calls, centre, prod_h, label_w=label_w)
    return save(canvas, f"{OUT}/{dst}")


# ── testimonial bubbles over a photograph ─────────────────────────────────────
def proof(dst, photo, quotes, h=1020, photo_h=None, anchor="center"):
    photo_h = photo_h or h
    canvas = Image.new("RGBA", (W, h), BLACK + (255,))
    band = photo_band(photo, W, photo_h, anchor=anchor, bias=0.48)
    if anchor != "fit":
        band = fade_to_black(fade_to_black(band, 120, "top"), 120, "bottom")
    canvas.alpha_composite(band.convert("RGBA"), (0, (h - photo_h) // 2))
    simon, amy = avatars()
    for q in quotes:
        av = amy if q["who"] == "amy" else simon
        card = bubble(q["quote"], q["name"], av, q["fill"], q["ink"], q["sub"], w=q.get("w", 640))
        shadow, pad = drop_shadow(card, blur=26, offset=(0, 10), opacity=120)
        canvas.alpha_composite(shadow, (q["x"] - pad, q["y"] - pad))
    return save(canvas, f"{OUT}/{dst}")


# ── outlined bullet panel ─────────────────────────────────────────────────────
def bullet_panel(dst, head, bullets, h=None):
    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    f_b = font(400, 42)
    rows = [wrap(probe, b, f_b, 740) for b in bullets]
    body_h = sum(len(r) * 52 + 26 for r in rows)
    panel_h = 110 + len(head) * 70 + 40 + body_h + 70
    H = h or panel_h + 160
    canvas = glow_bg(W, H, NAVY_SPOTS(W, H)).convert("RGBA")
    canvas.alpha_composite(outlined_panel(1040, panel_h), (80, 80))
    d = ImageDraw.Draw(canvas)

    y = 80 + 72
    for line, bold in head:
        text(d, (W / 2, y), line, font(800 if bold else 500, 58), WHITE, tracking=-2, align="c")
        y += 70
    y += 42
    glyph = diamond(44, TURQ)
    for row in rows:
        canvas.alpha_composite(glyph, (164, int(y + 6)))
        block(d, (240, y), row, f_b, WHITE, 52)
        y += len(row) * 52 + 26
    return save(canvas, f"{OUT}/{dst}")


# ── before / after ────────────────────────────────────────────────────────────
def before_after(dst, head):
    panel = Image.open("src-art/crop-ba.png").convert("RGB")
    panel = panel.crop((38, 46, 962, 600))
    pw = 1024
    panel = panel.resize((pw, round(panel.height * pw / panel.width)), Image.LANCZOS)
    rad = 30
    mask = Image.new("L", panel.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, panel.width - 1, panel.height - 1), radius=rad, fill=255)
    rounded_panel = Image.new("RGBA", panel.size, (0, 0, 0, 0))
    rounded_panel.paste(panel, (0, 0), mask)

    TOP = 236
    H = TOP + panel.height + 112
    canvas = Image.new("RGBA", (W, H), BLACK + (255,))
    d = ImageDraw.Draw(canvas)
    f = font(800, 62)
    y = 56
    for segs in head:
        total = sum(measure(d, s, f, -2) for s, _ in segs)
        x = (W - total) / 2
        for s, col in segs:
            x += text(d, (x, y), s, f, col, tracking=-2)
        y += 74
    canvas.alpha_composite(rounded_panel, ((W - pw) // 2, TOP))
    return save(canvas, f"{OUT}/{dst}")


# ── worldwide shipping ────────────────────────────────────────────────────────
def shipping(dst, sub):
    H = 1180
    canvas = Image.new("RGBA", (W, H), BLACK + (255,))
    world = Image.open(f"{A}/r06.jpg").convert("RGB")
    world = world.resize((W, round(world.height * W / world.width)), Image.LANCZOS)
    top = max(0, (world.height - 620) // 2)
    world = world.crop((0, top, W, top + 620))
    world = fade_to_black(fade_to_black(world, 90, "top"), 230, "bottom")
    scrim = Image.new("L", world.size, 0)
    sd = ImageDraw.Draw(scrim)
    for i in range(world.height):
        t = i / world.height
        sd.line([(0, i), (world.width, i)], fill=int(255 * min(1.0, max(0.0, (t - 0.34) / 0.30)) * 0.72))
    world = Image.composite(Image.new("RGB", world.size, BLACK), world, scrim)
    canvas.alpha_composite(world.convert("RGBA"), (0, 40))

    d = ImageDraw.Draw(canvas)
    f_s = serif(84)
    rows = [[("FREE Worldwide", WHITE)],
            [("Shipping ", WHITE), ("on All Orders", TURQ)]]
    y = 400
    for segs in rows:
        total = sum(measure(d, s, f_s) for s, _ in segs)
        x = (W - total) / 2
        for s, col in segs:
            x += text(d, (x, y), s, f_s, col)
        y += 102
    text(d, (W / 2, y + 26), sub, font(400, 44), WHITE, align="c")

    truck = Image.open("src-art/crop-truck.png").convert("RGB")
    truck = truck.crop((10, 28, 672, 212))
    tw = 540
    truck = truck.resize((tw, round(truck.height * tw / truck.width)), Image.LANCZOS)
    canvas.alpha_composite(truck.convert("RGBA"), ((W - tw) // 2, y + 118))

    flags = Image.open("src-art/crop-flags.png").convert("RGB")
    flags = flags.crop((14, 44, 1066, 160))
    fw = 1000
    flags = flags.resize((fw, round(flags.height * fw / flags.width)), Image.LANCZOS)
    canvas.alpha_composite(flags.convert("RGBA"), ((W - fw) // 2, y + 118 + truck.height + 60))
    return save(canvas, f"{OUT}/{dst}")


# ── logos (alpha recovered from the Figma exports) ────────────────────────────
def logos():
    import numpy as np
    TURQ_F = np.array([32, 169, 185], dtype=float)

    def run(src, dst, over_black, wordmark):
        a = np.asarray(Image.open(src).convert("RGB"), dtype=float)
        teal = (a[:, :, 2] - a[:, :, 0] > 18) & (a[:, :, 1] - a[:, :, 0] > 12)
        if over_black:
            F = np.empty_like(a); F[...] = 255.0; F[teal] = TURQ_F
            alpha = np.max(a / np.maximum(F, 1e-6), axis=2)
        else:
            F = np.empty_like(a); F[...] = 0.0; F[teal] = TURQ_F
            alpha = np.max((255.0 - a) / np.maximum(255.0 - F, 1e-6), axis=2)
        rgb = np.empty_like(a); rgb[...] = np.array(wordmark, dtype=float); rgb[teal] = TURQ_F
        im = Image.fromarray(np.dstack([rgb, np.clip(alpha, 0, 1) * 255]).astype("uint8"), "RGBA")
        im = im.crop(im.getbbox())
        im.save(f"{OUT}/{dst}")
        print(f"{dst:<28} {im.size}")

    run(f"{A}/gemiq-white.png", "logo-gemiq-light.png", True, (255, 255, 255))
    run(f"{A}/gemiq-white.png", "logo-gemiq-dark.png", True, (13, 16, 22))


# ══ build ═════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    logos()

    # ---- heroes -------------------------------------------------------------
    hero("hero-teaser.jpg", PH_DARK,
         ["OUR BIGGEST", "SALE EVER"], "27 NOVEMBER",
         ("UP TO", "$700", "SAVINGS"))

    # ---- campaign title + divider -------------------------------------------
    title_card("black-friday.jpg", ["BLACK", "FRIDAY"])
    divider("divider.jpg")

    # ---- offer cards, one per product ---------------------------------------
    LAUNCH = [
        ("card-gemsparkle.jpg",
         {"title": "GemSparkle", "was": "was $449", "now": "$299", "badge": "SAVE $150",
          "product": cut_out(P_SPARKLE), "scale": 1.02, "nudge": 40,
          "cta": "Shop GemSparkle"}),
        ("card-3pack.jpg",
         {"title": "GemSparkle 3-Pack", "was": "was $999", "now": "$699", "badge": "SAVE $300",
          "note": "Works out at $233 a lens.",
          "product": cut_out(P_3PACK), "scale": 0.86, "nudge": 20,
          "cta": "Shop the 3-Pack"}),
        ("card-mini.jpg",
         {"title": "GemLightbox Mini", "was": "was $1,999", "now": "$1,299", "badge": "SAVE $700",
          "note": "The biggest saving of the sale.",
          "product": cut_out(P_MINI), "scale": 0.92, "nudge": 30,
          "cta": "Shop the Mini"}),
    ]
    for dst, card in LAUNCH:
        offer_card(dst, card)

    # ---- payment ------------------------------------------------------------
    pay_strip("pay.jpg")

    supplied("sale-live.jpg", f"{A}/sale-live-now.webp")
    # ---- supplied campaign artwork -------------------------------------------
    supplied("diagram-gemsparkle.jpg", f"{A}/gem sparkle Black friday 2.png")
    supplied("diagram-mini.jpg", f"{A}/Gemlightbox mini black friday.png")


    # ---- social proof -------------------------------------------------------
    proof("proof-launch.jpg", f"{A}/mini_a.png",
          [{"who": "amy", "quote": "“I feel like I’m a professional photographer now.”",
            "name": "Amy, Jewelry Business Owner", "fill": TURQ_HOT, "ink": (6, 24, 28),
            "sub": (6, 24, 28), "x": 618, "y": 56, "w": 628},
           {"who": "simon", "quote": "“We have 4 in the office and use it at least 10x a day.”",
            "name": "Simon, Mayar & Watts", "fill": NAVY, "ink": WHITE,
            "sub": WHITE, "x": 44, "y": 596, "w": 600}],
          h=1020, photo_h=1020, anchor="subject")

    # ---- bullet panels ------------------------------------------------------
    bullet_panel("why-launch.jpg",
                 [("Why jewelers are", False), ("UPGRADING this week", True)],
                 ["True-to-life color accuracy",
                  "Lighting consistency anytime, anywhere",
                  "Perfect for Instagram, WhatsApp, website listings",
                  "Zero need for natural light",
                  "Photos that help customers buy faster"])

    # ---- closers ------------------------------------------------------------
    before_after("beforeafter.jpg",
                 [[("Get your GemSparkle", TURQ)], [("before it’s gone", WHITE)]])

    shipping("shipping.jpg", "Your GemIQ kit is waiting for you.")
