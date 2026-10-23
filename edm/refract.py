"""Refraction optics for the GemIQ hype campaign.

The product's whole job is to make a stone throw fire, so the campaign's own
light is that fire: a dispersion burst of spectral rays from a single point,
twisted slightly so the whole thing reads as circling rather than exploding.
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# A prism's output, not a rainbow: mostly silver, with warm and cool thrown
# to opposite sides and a little magenta where the spectrum wraps.
SPECTRUM = [
    (0.00, (70, 130, 255)),
    (0.09, (120, 215, 255)),
    (0.18, (205, 240, 255)),
    (0.28, (255, 255, 255)),
    (0.38, (255, 246, 228)),
    (0.48, (255, 198, 128)),
    (0.58, (255, 150, 110)),
    (0.67, (255, 124, 150)),
    (0.76, (226, 132, 226)),
    (0.86, (150, 150, 255)),
    (1.00, (70, 130, 255)),
]


def spectral(t):
    """Sample the dispersion ramp at t in [0,1). Vectorised over t."""
    stops = np.array([s for s, _ in SPECTRUM])
    cols = np.array([c for _, c in SPECTRUM], dtype=float)
    t = np.mod(t, 1.0)
    idx = np.clip(np.searchsorted(stops, t) - 1, 0, len(stops) - 2)
    span = stops[idx + 1] - stops[idx]
    f = ((t - stops[idx]) / np.where(span == 0, 1, span))[:, None]
    return cols[idx] * (1 - f) + cols[idx + 1] * f


def refraction_burst(w, h, centre=None, rays=2400, seed=5, swirl=0.55,
                     inner=0.05, outer=1.05, reach=0.78, samples=340,
                     exposure=1.0, white=0.30, peak=0.26, sharp=1.0, cycles=3.0):
    """Additive spectral rays from one point, twisted into a slow circling.

    `swirl` bends each ray as it travels, so the burst turns instead of simply
    radiating. `white` pulls colours toward silver so it reads as light rather
    than as a rainbow.
    """
    cx, cy = centre or (w / 2, h / 2)
    rng = np.random.default_rng(seed)
    R = float(max(w, h))

    theta = rng.uniform(0, 2 * np.pi, rays)
    r0 = R * inner * rng.uniform(0.35, 2.4, rays)
    r1 = r0 + R * outer * rng.uniform(0.12, 1.0, rays) ** 1.25

    # several spectrum cycles around the circle, so warm and cool fall in
    # patches the way a real brilliant cut scatters them
    hue = (theta / (2 * np.pi) * cycles
           + 0.08 * np.sin(theta * 2.0)
           + rng.normal(0, 0.05, rays)) % 1.0
    col = spectral(hue)
    col = col * (1 - white) + 255.0 * white
    bright = rng.uniform(0.18, 1.0, rays) ** 1.9

    u = np.linspace(0.0, 1.0, samples)[None, :]
    rr = r0[:, None] + (r1 - r0)[:, None] * u
    th = theta[:, None] + swirl * (rr / R) ** 1.6          # the circling
    xs = cx + np.cos(th) * rr
    ys = cy + np.sin(th) * rr

    # each streak lights partway along its length and tapers at both ends,
    # which is how a facet's fire actually reads on camera
    env = np.exp(-((u - peak) / (0.30 / sharp)) ** 2) * (1.0 - u) ** 0.7
    inten = bright[:, None] * env * np.exp(-(rr / (R * reach)) ** 2)

    xi = np.rint(xs).astype(np.int32)
    yi = np.rint(ys).astype(np.int32)
    ok = (xi >= 0) & (xi < w) & (yi >= 0) & (yi < h)

    buf = np.zeros((h, w, 3), dtype=np.float32)
    contrib = (col[:, None, :] * inten[:, :, None]).astype(np.float32)
    np.add.at(buf, (yi[ok], xi[ok]), contrib[ok])

    buf *= exposure / samples * 46.0
    img = Image.fromarray(np.clip(buf, 0, 255).astype("uint8"), "RGB")
    return img.filter(ImageFilter.GaussianBlur(0.55))


def core_bloom(w, h, centre=None, radius=None, colour=(255, 255, 255), power=1.0):
    """The hot centre the rays leave from."""
    cx, cy = centre or (w / 2, h / 2)
    radius = radius or max(w, h) * 0.14
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / radius
    g = (np.exp(-d ** 2) * 0.85 + np.exp(-(d / 3.2) ** 2) * 0.35) * power
    rgb = g[:, :, None] * np.array(colour, dtype=np.float32)
    return Image.fromarray(np.clip(rgb, 0, 255).astype("uint8"), "RGB")


def beam(w, h, centre, angle, colour, length, spread=0.09, power=1.0):
    """A soft cone of coloured light thrown outward from the centre."""
    cx, cy = centre
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dx, dy = xx - cx, yy - cy
    r = np.sqrt(dx ** 2 + dy ** 2)
    a = np.arctan2(dy, dx) - angle
    a = (a + np.pi) % (2 * np.pi) - np.pi
    cone = np.exp(-(a / spread) ** 2)
    run = np.clip(r / length, 0, None)
    along = np.exp(-(run ** 2) * 1.5) * np.clip(run * 3.0, 0, 1)
    g = cone * along * power
    rgb = g[:, :, None] * np.array(colour, dtype=np.float32)
    return Image.fromarray(np.clip(rgb, 0, 255).astype("uint8"), "RGB")


def screen(a, b):
    """Additive-ish compositing that keeps highlights from clipping flat."""
    x = np.asarray(a, dtype=np.float32)
    y = np.asarray(b, dtype=np.float32)
    out = 255.0 - (255.0 - x) * (255.0 - y) / 255.0
    return Image.fromarray(np.clip(out, 0, 255).astype("uint8"), "RGB")


def add(a, b, k=1.0):
    out = np.asarray(a, dtype=np.float32) + np.asarray(b, dtype=np.float32) * k
    return Image.fromarray(np.clip(out, 0, 255).astype("uint8"), "RGB")


def grain(img, amount=9.0, shadow_bias=1.5, seed=3):
    """Film grain, heavier in the shadows — the thing that keeps a black
    gradient looking like a photograph instead of a banded JPEG."""
    a = np.asarray(img, dtype=np.float32)
    rng = np.random.default_rng(seed)
    lum = a.mean(axis=2, keepdims=True) / 255.0
    weight = (1.0 - lum) ** shadow_bias * 0.75 + 0.25
    noise = rng.normal(0, amount, a.shape[:2])[:, :, None]
    return Image.fromarray(np.clip(a + noise * weight, 0, 255).astype("uint8"), "RGB")


def vignette(img, strength=0.55, radius=0.92):
    a = np.asarray(img, dtype=np.float32)
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / radius
    m = np.clip(1.0 - strength * np.clip(d - 0.55, 0, None) ** 1.6, 0, 1)[:, :, None]
    return Image.fromarray(np.clip(a * m, 0, 255).astype("uint8"), "RGB")


def spectrum_rule(w, h, seed=11, power=1.0):
    """A hairline that is a thrown spectrum rather than a white line."""
    x = np.linspace(0, 1, w)
    hue = (x * 1.15 + 0.12) % 1.0
    col = spectral(hue) * 0.55 + 255.0 * 0.45
    yy = np.abs(np.linspace(-1, 1, h))[:, None]
    core = np.exp(-(yy / (1.6 / h * 10)) ** 2)
    halo = np.exp(-(yy / 0.55) ** 2) * 0.42
    env = np.sin(np.linspace(0, np.pi, w))[None, :] ** 0.5
    g = (core + halo) * env * power
    rgb = g[:, :, None] * col[None, :, :]
    return Image.fromarray(np.clip(rgb, 0, 255).astype("uint8"), "RGB")
