# LoanOptions CRM — screen mocks

Static 1920×1080 mock-ups built on the design system in the Figma file
**CRM-2026** (page: `↪️ Design System`).

## Running

```bash
python serve.py
```

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
css/tokens.css   Design tokens — colours, spacing, radius, elevation, type ramp.
                 Variable names match the code syntax set on the Figma variables.
css/worklist.css Layout + components. Shared by all versions.
css/draft2.css   Overrides for the draft-parity page only.
js/icons.js      SVG sprite + icon() helper. Shared by all versions.
js/rows.js       Row data (ROWS) + renderer for the redesign versions.
js/rows-draft2.js Frozen data + renderer for the draft-parity page.
css/variants.css  Concept styles, scoped per version (v3–v5).
js/data.js        Shared deal data + document vocabulary for the concepts.
js/popups.js      Row popups — Tasks / Notes / Activity cards, with their
                  seeded mock content.
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
