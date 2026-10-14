# LoanOptions CRM — screen mocks

Static 1920×1080 mock-ups built on the design system in the Figma file
**CRM-2026** (page: `↪️ Design System`).

## Running

```bash
python serve.py
```

### Seeing your changes

Run `python stamp.py` after editing anything under `css/` or `js/`, and
before committing. It rewrites every page's `<link>` and `<script src>` to
`...css?v=<hash of that file>`.

Without it, an edit can be live on the server and still invisible in the
browser: the URL `css/appview.css` is the same whether or not its contents
changed, and GitHub Pages serves it with `max-age=600`, so a browser that
already has a copy keeps using it. A content hash makes a changed file a
different URL, so it is fetched — and an unchanged file keeps its hash and
stays cached. It is safe to run twice.

`serve.py` is a plain static server that sends `no-store`. That matters here:
versions get rewritten **in place** during iteration, so the filename never
changes and a normal server lets the browser keep showing the previous design
under the current name. If you ever serve this another way, hard-refresh
(`Ctrl+Shift+R`) after any edit.

Then open <http://localhost:8137/> — that's the prototype shell, which is the
easiest way in. Individual screens are at `/worklist-v2.html` etc. if you want
one on its own.

Opening the `.html` directly with `file://` will **not** work — the stylesheets
and fonts won't resolve. It needs to be served.

## Prototype shell (`index.html`)

| Control | |
|---|---|
| `1` `2` `3` | Jump to a version |
| `←` `→` | Step through versions |
| `C` | Compare — two versions side by side, each with its own picker |
| `Z` | Toggle fit-to-window / 100% |

The view is in the URL, so any state can be bookmarked or pasted to someone:
`#v2`, or `#compare=v1,v2`.

To add a version, append one entry to the `VERSIONS` array at the bottom of
`index.html` — tabs, compare pickers, shortcuts and deep links all follow.

## The artboard and scrolling

`.screen` is the 1920×1080 Figma frame, but its height is capped at the
viewport (`min(1080px, 100vh)`). Inside the prototype shell's iframe that is
exactly 1080, so the frame is untouched; opened full size in a window shorter
than 1080 it shrinks to fit.

That cap is what keeps the table's **horizontal scrollbar reachable**. The bar
belongs to `.v1-scroll`, which sits at the bottom of the frame — let the frame
run past the bottom of the window and the bar goes with it, so you have to
scroll the whole page down to find it. The x axis is also `overflow-x: scroll`
rather than `auto`: twelve columns never fit 1920, so the bar is always needed,
and one that appears and disappears just shifts the rows.

## Layout

```
assets/fonts/    Articulat CF (Regular / Medium / DemiBold / Bold)
assets/brand/    logo.svg and assist.svg, exported from CRM-2026 — the sprite
                 in js/icons.js carries copies, these are the sources.
                 stage-path.png is used directly, see below.
css/tokens.css   Design tokens — colours, spacing, radius, elevation, type ramp.
                 Variable names match the code syntax set on the Figma variables.
css/worklist.css Layout + components. Shared by all versions.
css/draft2.css   Overrides for the draft-parity page only.
stamp.py         Rewrites asset links with a content hash, see above.
js/icons.js      SVG sprite + icon() helper. Shared by all versions.
js/rows.js       Row data (ROWS) + renderer for the redesign versions.
js/rows-draft2.js Frozen data + renderer for the draft-parity page.
css/variants.css  Concept styles, scoped per version (v3–v5).
js/data.js        Shared deal data + document vocabulary for the concepts.
js/popups.js      Row popups — Tasks / Notes / Activity cards, with their
                  seeded mock content.
js/tour.js        Points-of-interest tour — engine and the step list per
                  version.
css/tour.css      Spotlight and callout styles.
js/appview.js     Application view — the screen a deal opens into (v1).
css/appview.css   Its styles.
js/variants.js    Concept renderers (v3–v5).
worklist-draft2.html  Reference — the original Figma draft, rebuilt. Not in
                      the shell; open it directly if you need it.
worklist-v1.html      v1 — top nav is a placeholder band.
worklist-v2.html      v2 — real global navigation bar.
```

## Versions

| Page | What it is |
|---|---|
| **v1** Pipeline + AI | Grouped by master pipeline stage. Sticky column chooser, multi-select, quick actions, contact tiles, Broker Assist popup. Documents as a segmented meter. The three quick-action pills each float their own card. |
| **v2** Colour coded | v1 as its base (its shell carries both classes), with stage colour through the dots, labels, sub-stage tags and a key line, and documents as four status boxes. Broker Assist is a tab in the quick-view sidebar rather than its own floating card. |

v2 is a **skin over v1**, not a copy: one `renderWorklist(opts)` builds both, so
a change to the shared base lands in both versions.

### Removed

Each review narrowed the set, and the survivors were renumbered so the
numbering stays contiguous:

- **Calm cards** and **power grid** — cut after the first review.
- **Contextual-CTA version** (`Fix` / `Chase` / `Submit`, per-document traffic
  lights) — cut after the second.
- **Redesign baseline, nav-bar version, Customise and Action rail** — cut after
  the third; the two survivors became v1 and v2.
- **Draft 2** — dropped from the shell after the fourth. The page and its
  frozen data still exist at `worklist-draft2.html`, so it can be opened
  directly, but it is no longer a tab or a compare option.

Files, renderers and styles for all of them are deleted.

All concepts share `js/data.js`, so the underlying deals are identical — only
the presentation changes.

The draft-parity page carries **its own copy of the row data** in
`js/rows-draft2.js`. That is deliberate — it is a frozen reference, so editing
`ROWS` for the redesign must not change what it shows.

## Application view

Clicking into a deal opens the full application screen — a rebuild
of the Figma frame **`Draft #2 - 1920px TO CODE`** (node `4124:6173`) on the
working file. Three columns on the 1920 artboard, 420 / 790 / 420 with the
113px gutters the frame uses:

| Column | |
|---|---|
| **Left** | Identity, call/email/SMS, overall progress, the activity feed and internal notes |
| **Middle** | Quick Summary with the four score dials, then Loan / Personal / Employment / Financial / Assets sections |
| **Right** | Next required actions, Documents, and Broker Assist |

**Interactions are deliberately thin**, as asked — it is a mock, not a working
form. Nothing submits and no field edits:

- every section folds away from its header
- Broker Assist is docked to the bottom edge rather than stacked with the other
  cards; its chevron raises it over Documents, stopping just under that card's
  heading so you can still see what is behind
- the middle column scrolls, and each list (activity, notes, tasks, documents) scrolls inside its card
- the expand control on Activity or Internal notes lifts that panel over the
  whole left column, covering the identity block and the other panel; only one
  can be expanded, since they take the same space
- the external/internal tabs switch
- `Esc` or the `×` closes it

**The way in is the lead-details cell** — the name and reference are what
identify the deal, so that is what opens it. It takes a pointer and the name
underlines on hover. Every other cell keeps doing its own job: the pills still
open their popups, the sparkle still opens Broker Assist.

The affordance is added by the mount rather than written into the stylesheet,
so it can only ever appear on a version that has actually wired the view up.

**What is real and what is dressing.** The name, reference, amount, loan type
and the six document rows with their statuses come from the deal you clicked,
so the view keeps telling the same story as the list. Scores, dates, addresses
and the financial figures are fixed mock values from the frame.

The score dials are drawn as SVG arcs rather than dropped in as artwork, so the
arc follows the value — change a number in `AV_SCORES` and the dial follows.

**The stage path is a flat image** — `assets/brand/stage-path.png`, the frame's
own run of chevrons exported at 1305×32 and dropped in at 1:1.

It was built in CSS first and did not hold up. The chevrons have to interlock
tightly, and a clip-path run cannot do both halves of that: notch the left edge
and the labels no longer fit ("Application submitted" needs 119px of the 126px
a step has), leave it straight and visible gaps open up between the steps.
Rather than keep trading one off against the other it is a picture for now.

That means it does not reflect the deal — every application shows
*Application pending*. When the stage needs to be real, this is the piece to
rebuild, and the greys to match are `#E5E5E5` for a step not yet reached, white
for one already done, and `#F3E9FF` with `#5614BB` text for the one in
progress, sampled from the frame.

All three versions open into it: each passes `appView` to the shared mount.
They still differ in the row itself — v2 keeps Broker Assist in its quick-view
sidebar, v3 keeps the split action columns — but the screen behind a deal is
the same one.

## Points-of-interest tour

The first time a version is viewed it spotlights its main controls, one at a
time. Everything dims except the control being introduced, a callout says what
it does, and **the step only advances once that control is actually used** —
the cog is clicked, the sparkle is clicked, the table is scrolled. Nothing is
blocked: the dim is purely visual, so the prototype stays explorable and a step
simply waits its turn. `Esc` or **Skip** ends it.

| | Steps |
|---|---|
| **v1** | Column chooser · Broker Assist · the quick-action popups · scrolling sideways for the rest of the columns |
| **v2** | Quick actions · Broker Assist in the sidebar |
| **v3** | None — nothing in it differs from v1 |

v2 deliberately repeats neither the column chooser nor the sideways scroll:
they behave exactly as they do in v1, so only what changed is worth pointing at.

**Replaying.** The toolbar's **Highlight the points of interest** button clears
what every version remembers and drops back to v1, which carries the full set.

**Progress** is per-version in `sessionStorage`, so leaving a version half-done
and coming back resumes on the same step rather than starting over. It clears
when the tab closes — the "exited the prototype" case — and survives a reload.

The tour lives in the version page rather than the shell, so it scales with the
frame and behaves the same opened full size. The shell drives it through a URL
parameter: `tour=auto` (default, skip if finished), `tour=force` (replay from
the top), `tour=off` (the side-by-side compare view, where two at once would be
chaos). To change the steps, edit `TOURS` at the top of `js/tour.js`.

## Broker Assist

In **v1** and **v3** the sparkle button floats Broker Assist as its own card.

In **v2** it is the fourth tab of the quick-view sidebar, beside Action tasks,
Notes and Activity — same summary, same vocabulary, one surface instead of
two. The sparkle button is just another way in: it opens the sidebar on that
tab, and clicking it again closes it. `#hailo` is never wired up in v2, so
there is no second overlay to collide with.

Which sections a version offers is `PANEL_SETS` in `js/variants.js`, picked by
the `assistInPanel` option that `MOUNTERS.v2` passes to `mountV1`.

## Row popups

In v1 the **Tasks**, **Notes** and **Activity** pills on a row each open a
floating card anchored under the pill — the three screens from the Figma
mock-up. They are static: nothing is editable, and the only live behaviour is
opening, closing (click off, `Esc`, or the `×`) and flipping above the pill
when the row sits near the bottom of the window.

Content is **seeded off the row index** in `js/popups.js`, so every row tells a
different story and the same row tells the same one on every reload. Change the
word lists at the top of that file to change the flavour.

Only one overlay is ever up: opening a card dismisses Broker Assist and the
column chooser, and vice versa. Nothing opens on load.

## Versioning

Each iteration is a new `worklist-vN.html`. They all share the CSS and JS, so:

- a change to a **token** (brand colour, radius, type size) hits every version
- a change to **layout or a component** hits every version
- a change that should apply to **one version only** goes in a `<style>` block
  inside that version's HTML, or its own stylesheet if it is substantial
  (see `css/draft2.css`)

Keeping old versions intact means you can open two side by side and compare.

## Editing the data

Row content lives in the `ROWS` array in `js/rows.js`. Add, remove or edit
entries and every version re-renders — nothing else to touch.

| Field | Notes |
|---|---|
| `pinned` | Draws the brand ring on the row |
| `pct` | Document progress, 0–100. 100 turns the ring green |
| `unread` | Puts the red dot on the Notes pill |
| `tone` | Stage badge colour: `brand`, `info`, `warning`, `success`, `neutral` |
| `settlement` | `null` renders the em-dash placeholder |

## Relationship to Figma

`worklist-v1.html` is a 1:1 rebuild of the Figma frame
**`Work list view — Redesign (1920)`** on the `↪️ Redesign` page.

The one difference is the typeface: this version uses the real **Articulat CF**,
loaded from `assets/fonts/`. The Figma version is still on Figtree, because
Figma's remote MCP server can only see cloud fonts.
