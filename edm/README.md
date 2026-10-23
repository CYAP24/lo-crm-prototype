# GemIQ Black Friday 2026 — EDM pair

Two production-ready emails for the Black Friday sale, built in the house EDM style from the
GemIQ Figma file (`VRMpzQHuxwoLtYq5PNq8Lz`, pages **EDM**, **Campaigns → Black Friday '26**,
**Launch Posts**, **branding**).

| File | Role | Send | Client preview |
|---|---|---|---|
| [`build/01-prehype.html`](build/01-prehype.html) | Pre-hype teaser | ~22 November (5 days out) | [gemiq-bf26-prehype.vercel.app](https://gemiq-bf26-prehype.vercel.app) |
| [`build/02-launch.html`](build/02-launch.html) | Launch offer | 27 November, 9am local | [gemiq-bf26-launch.vercel.app](https://gemiq-bf26-launch.vercel.app) |

**The sale runs 27 November – 1 December 2026.** Five days. There is no VIP list and no
promo code — the prices change on the day.

---

## The idea: lights off, lights on

The Black Friday shoot in Figma has the same frame twice — the GemSparkle and the
GemLightbox Mini on a dark studio table, once in silhouette and once lit. The two emails
are built on that pair.

**Email 1** is the stage before the lights come up: the silhouette, no products named, no
prices, one number.
**Email 2** is the same frame lit, and the whole offer on the table.

Anyone who gets both reads the second as the payoff of the first.

### What the teaser withholds

Email 1 says four things and hides everything else:

1. It is **Black Friday**
2. These are the **biggest savings we have ever run**
3. It **starts 27 November**
4. **Up to $700 off** — and never what the $700 comes off

No product is named and no price appears. The only CTA is *Explore our range*, pointing at
the catalogue at full price: "Have a look at what we make. The prices change on the 27th."
It closes on a full-bleed orange block — *Keep an eye out* / *Sale begins 27 November* —
with no button under it, so the last thing in the email is the date.

---

## Style: matched to the house EDM, not invented

Both emails use the device set from the May Sale EDM (`3944:3491`) and the Black Friday
campaign assets, rebuilt for this offer:

| Device | Where |
|---|---|
| **Lit type** — BLACK FRIDAY with the light bar raking through the letterforms | Campaign title card, both emails |
| Full-bleed orange campaign bars, big centred greeting | Both |
| Marker ellipse circling the payoff line | Teaser hero |
| Rotated two-tone price sticker (white over turquoise) | Teaser hero |
| Grey price cards — name, struck price with an orange marker slash, "Now yours for" + a very large figure, product bleeding off the right | Launch offer block |
| Orange `SAVE $x` chip beside each product name | Launch offer block |
| Floating testimonial bubbles (cyan and navy) with round avatar and orange stars, dropped over the product photography | Launch |
| Outlined rounded panel over a navy glow, with turquoise diamond bullets | Launch |
| Annotated product diagram — turquoise dots with glow halos and elbowed leader lines | Launch, both products (client-supplied) |
| BEFORE / AFTER split panel | Launch |
| Serif "FREE Worldwide Shipping" over the world map, truck badge, circular flag row | Launch |
| **Light-bar divider** — the same streak as a 32px section rule | Launch |

### Tokens

| Token | Value | Use |
|---|---|---|
| Stage | `#000000` | Page ground |
| Navy glow | `#0A1630`→`#122C5C` | Section backgrounds behind panels and diagrams |
| Card grey | `#4A4A4A` | Price cards |
| Turquoise | `#20A9B9` | Mark, diagram ink, diamond bullets, sticker |
| Hot turquoise | `#22D3EE` | Marker ellipse, cyan testimonial bubble |
| Navy | `#363E5C` | Second testimonial bubble |
| Orange | `#F25700` | Campaign bars, CTAs, the marker slash, badges, the teaser close |
| Footer | `#2F3336` / `#F1F2F3` | Legal band / sign-off band |

Orange is the primary. The website's Black Friday page uses turquoise on its CTAs; these
emails deliberately do not follow it, so the campaign reads as GemIQ first.

**Type** — Inter (the brand guide's face) at 400–900. Display caps are Inter Black at
−0.04em. Playfair Display 700 appears once, on the launch shipping band, as it does in the
house EDM. Live text falls back to Arial in Outlook; baked artwork is unaffected.

### The one gradient in the system

Gradient-filled type is normally a tell, and everything else here is solid colour. It is
spent once, on the campaign title: GemIQ sells a light, the campaign photography is
"object lit by a bar of light", so the title is the thing that light falls on. `BLACK`
drops into shadow above the bar, `FRIDAY` catches the turquoise bleed below it — the same
falloff the real LED produces on camera. It appears nowhere else in either email.

---

## What the CRO pass changed

| Lever | How it is built |
|---|---|
| **One link per product** | The launch offer block is three separate images, each wrapping its own product URL with its own `utm_content`, so clicks attribute per product instead of per email |
| **A visible affordance on every card** | A white "Shop GemSparkle / the 3-Pack / the Mini" pill is baked into each card, bottom-left |
| **Saving stated, not inferred** | An orange `SAVE $150 / $300 / $700` chip sits beside each product name, above the struck price |
| **Unit-price reframe** | The 3-Pack carries "Works out at $233 a lens" — arithmetic from the given prices, no new claim |
| **Reassurance before the offers** | Free worldwide shipping · 20,000+ jewelers · 100+ countries, directly under the first CTA, in both emails |
| **Deadline three times in the launch** | Top campaign bar, a line directly under the offer cards where the decision happens, and the closing `ENDS 1 DECEMBER` ribbon |
| **A single CTA label** | Every button in the launch email reads *Shop sale now*; the teaser's reads *Explore our range*. One verb per email, no competing asks |

### Two things worth adding before send

1. **Returns and warranty.** They are the strongest missing risk-reversal and nothing in
   the Figma file states them, so nothing here asserts them. If the policy is 30-day
   returns and a 1-year warranty, add them as two more columns in the reassurance strip —
   it is a three-line HTML change, no artwork to rebuild.
2. **A live countdown.** The closing ribbon is static. A Sendtric or NiftyImages timer GIF
   drops straight into that slot at 600×96, beside the "Ends 1 December" cell. A static
   date was shipped rather than a fake one.

**One discrepancy to settle:** the Figma campaign says "100+ countries" in the headline
copy and "+180 countries" on the flag row. Both emails use 100+, which is the conservative
of the two. The flag row artwork still reads +180 — regenerate `shipping.jpg` if you want
them aligned.

---

## Subject lines and preheaders

**Email 1 — pre-hype** (shipped)
> **Subject:** Our biggest Black Friday ever. Starts 27 November.
> **Preheader:** Up to $700 off. We're not saying off what. Coming 27 November.

Alternates to A/B:
- `Up to $700 off. We're not saying off what.` / *Black Friday opens 27 November.*
- `Something opens on 27 November` / *Our biggest savings ever. Five days only.*
- `We have never cut this deep` / *Black Friday, 27 November – 1 December.*

**Email 2 — launch** (shipped)
> **Subject:** Black Friday is live — the sale jewelers wait all year for
> **Preheader:** GemSparkle $299. 3-Pack $699. GemLightbox Mini $1,299. Free worldwide shipping. Nov 27 – Dec 1.

Alternates to A/B:
- `It's live — up to $700 off GemSparkle and GemLightbox Mini` / *Free worldwide shipping. Ends 1 December.*
- `GemSparkle $299. GemLightbox Mini $1,299.` / *Our biggest sale ever is open. Five days.*
- `Your best price ever. Five days only.` / *Then everything goes back to full price.*

---

## The offer, as built

| Product | Sale | Was | Saving |
|---|---|---|---|
| GemSparkle | **$299** | $449 | $150 |
| GemSparkle 3-Pack | **$699** | $999 | $300 |
| GemLightbox Mini | **$1,299** | $1,999 | $700 |

RRPs are taken from the May Sale EDM already in the Figma file (`$449`, `$999`) and from
the brief (`$1,999`). Free worldwide shipping on everything; the offer runs
27 November – 1 December 2026.

---

## Technical notes

- 600px, table-based, `role="presentation"`, inline styles only.
- Outlook: ghost tables, `mso-line-height-rule:exactly` on every text cell, VML `roundrect`
  for every CTA, `AllowPNG` + 96 DPI declared.
- Mobile: one `max-width:620px` query — gutters 56px → 26px, display type steps down,
  artwork scales fluidly, CTAs go full width, the footer stacks.
- Artwork is drawn at 2x (1200px) and served at 600px, so it stays sharp on retina.
- Every image carries `width`/`height` and full alt text, so each section still reads with
  images off. Prices, dates and product names also appear in the alt text for that reason.
- Hidden preheader with zero-width padding so no body copy leaks into the inbox preview.
- Merge tags follow the client's existing convention: `{{ contact.firstname }}`,
  `{{ organization.name }}`, `{{ organization.address }}`, `{{ unsubscribe }}`,
  `{{ view_in_browser }}`.
- `color-scheme: only` stops iOS/Apple Mail re-inverting an already-dark design.
- Weight: 16KB and 20KB of HTML, well inside Gmail's 102KB clip. Images are 236KB for the
  teaser and 1.05MB for the launch — in line with the house EDM, which is image-led by design.

### Before sending

1. **Host the images.** `src` values are relative (`img/…`) for local preview. Upload
   `build/img/` to your CDN and rewrite the paths — nothing else needs touching.
2. **Replace the URLs.** Every `href` points at `gemiq.com/...` placeholders with
   `utm_campaign=bf26_tease` / `bf26_launch` already attached. Swap in the real
   collection and product URLs; keep the UTMs.
3. **Confirm the dates.** Copy says the sale runs 27 November – 1 December 2026.
4. Litmus or Email on Acid before scheduling — Outlook 2016/2019 and the Gmail app are
   the two worth a look.

### Localisation

The Figma file carries seven language variants. The copy in the baked artwork lives in
`build-art.py` as plain strings — translate those, re-run the script into a language-suffixed
output folder, and translate the live text in the HTML. Nothing is hard-coded in an image
the script cannot regenerate.

---

## Assets

`build/img/` is the shipping set — 20 files, nothing unused:

| File | Used by | What it is |
|---|---|---|
| `black-friday.jpg` | both | BLACK FRIDAY campaign title, lit by the light bar |
| `hero-teaser.jpg` | teaser | Silhouette hero: "OUR BIGGEST SALE EVER", marker ellipse on the date, UP TO $700 SAVINGS sticker |
| `sale-live.jpg` | launch | "Sale live now!" lit hero — client-supplied |
| `card-gemsparkle/3pack/mini.jpg` | launch | One price card per product, each its own link |
| `divider.jpg` | launch | The light-bar section rule |
| `why-launch.jpg` | launch | Outlined bullet panel |
| `proof-launch.jpg` | launch | Testimonial bubbles over product photography |
| `diagram-gemsparkle.jpg` / `diagram-mini.jpg` | launch | Annotated product diagrams — client-supplied |
| `beforeafter.jpg` | launch | BEFORE / AFTER ring comparison |
| `shipping.jpg` | launch | World map, serif headline, truck badge, flags |
| `pay.jpg` | launch | Payment marks, flattened to one ink |
| `logo-gemiq-light/dark.png` | both | GemIQ lockup, alpha recovered from the Figma export |
| `social-instagram/facebook/x/youtube.png` | both | Footer icons, alpha recovered per-file from white-flattened Figma exports |

### Building it

```bash
python build-art.py      # everything except the footer icons
python build-social.py   # social-*.png
```

[`build-art.py`](build-art.py) draws on top of [`artkit.py`](artkit.py), composing the
client's own photography; `supplied()` passes client-finished artwork
(`sale-live.jpg`, the two diagrams) straight through without redrawing it.
`build-assets.py`, `build-gen-hero.py` and `build-tease.py` are earlier passes kept in the
folder for reference — they produce nothing in the current shipping set.

`src-art/` holds everything the build needs: the client photography it composes
(`src-art/photo/`, downsampled to 1700px since nothing is used larger), the three device
crops lifted from the May Sale EDM (the BEFORE/AFTER panel, the free-shipping truck badge
and the flag row) and the raw social exports. `src-art/gen/` holds generated plates
from earlier directions, kept with the scripts that made them. `fonts/` holds Inter and Playfair Display,
both SIL Open Font Licence. Those folders are committed, so the artwork rebuilds from a
fresh clone.

`assets/` (the raw Figma downloads, ~45MB) and `ref/` (reference slices and working
previews) are gitignored — useful if you go back to Figma, not needed to build.

---

## Preview and deploy

Locally, both emails plus an index page:

```bash
python -m http.server 8777 --directory edm/build
```

The client-facing links are two separate Vercel projects, each a self-contained copy of one
email and only the images it uses (`deploy/`, gitignored). To push an update:

```bash
vercel deploy --cwd deploy/gemiq-bf26-prehype --prod
vercel deploy --cwd deploy/gemiq-bf26-launch --prod
```

`--prod` matters: the first deploy of a project goes to production automatically, every one
after that is a preview URL unless you ask for production. Rebuild a deploy folder by
copying the email in as `index.html` alongside the images it references.
