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

Then open <http://localhost:8137/> — that's the work-list prototype view,
which is the easiest way in. The other screens have their own prototype
views at <http://localhost:8137/kanban.html> and
<http://localhost:8137/screen2.html>. Individual versions are at
`/worklist-v2.html`, `/kanban-v1.html` etc. if you want one on its own.

Opening the `.html` directly with `file://` will **not** work — the stylesheets
and fonts won't resolve. It needs to be served.

## Prototype views

Each screen gets its own prototype view — a dark harness that frames that
screen's versions and lets you switch between them:

| Page | Screen | Versions |
|---|---|---|
| `index.html` | The work list | v1, v2, v3 |
| `kanban.html` | The kanban board | v1, v2 |
| `screen2.html` | Screen 2 | v1 |

Each numbers its versions **from v1 in its own right**: the kanban's v1 and
the work list's v1 are different screens, not two takes on one.

| Control | |
|---|---|
| `1` `2` `3` … | Jump to a version — one key per version |
| `←` `→` | Step through versions |
| `C` | Compare — two versions side by side, each with its own picker |
| `Z` | Toggle fit-to-window / 100% |

The view is in the URL, so any state can be bookmarked or pasted to someone:
`#v2`, or `#compare=v1,v2`.

### The shared shell

The harness itself — toolbar, tabs, compare, scaling, shortcuts, deep links —
is `js/shell.js` and `css/shell.css`, one copy for both views. A prototype
view is just a page that declares what it frames, inline, before that script:

```js
window.SHELL = {
  title: 'Work list view',
  sub:   'LoanOptions CRM prototype',
  start: 'v2',                 // which version opens first
  tour:  true,                 // show the replay-the-tour button
  versions: [
    { id:'v1', label:'v1', sub:'Pipeline + AI', file:'worklist-v1.html',
      note:'…the line under the toolbar' }
  ]
};
```

To add a version, append one entry to that `versions` array — tabs, compare
pickers, shortcuts and deep links all follow. To add a **screen**, copy one of
the two pages and point it at that screen's versions.

Two controls look after themselves: compare stands down when there is only one
version, since there is nothing to hold it against, and the tour button appears
only where `tour` is set — screen 2 has no tour yet.

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
css/shell.css    The prototype views' own chrome — the dark harness, not the
                 mocks it frames. Shared by index.html and screen2.html.
js/shell.js      The harness itself: tabs, compare, scaling, shortcuts, deep
                 links. Driven by the page's window.SHELL.
css/worklist.css Layout + components. Shared by all work-list versions.
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
js/kanban.js      Kanban board — the deals as cards. See below.
css/kanban.css    Its styles, on top of worklist.css.
js/screen2.js     Screen 2 — a standalone copy of the application view, being
css/screen2.css   reworked into a different screen. See below.
js/variants.js    Concept renderers (v3–v5).
worklist-draft2.html  Reference — the original Figma draft, rebuilt. Not in
                      the shell; open it directly if you need it.
worklist-v1.html      v1 — top nav is a placeholder band.
worklist-v2.html      v2 — real global navigation bar.
index.html            The work-list prototype view — v1, v2, v3.
kanban.html           The kanban prototype view — v1, v2.
kanban-v1.html        v1 — alert states, tasks as tinted blocks.
kanban-v2.html        v2 — alert states, text and colour only.
screen2.html          The screen-2 prototype view — v1.
screen2-v1.html       Screen 2, v1 — the copy of the application view.
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

## Kanban view

The board is a rebuild of the Figma frame **`Draft #2 - 1440 px`** (node
`4235:8867`) — the deals as cards, grouped by the master pipeline stage. The
card in it comes from a later frame; see **Alert states** below.

**It runs on the same deals as the work list.** `js/data.js` already carried
everything a card needs, so nothing is invented: the name, reference, amount,
product, created and last-activity dates, the stage and its day count, the
documents, the people on the deal and the task / note / activity counts all
come from the deal. The column counts are the real ones, so they move when
the data does.

| Column | |
|---|---|
| Qualifying, Discovery, In Progress, Approval, Settlement | `MASTER_STAGES`, in order |
| Snoozed | Broker-set, and it wins over the pipeline stage — the same rule the grouped work list uses |

**The artboard is this project's 1920, not the frame's 1440.** The column is
the unit and keeps the frame's size (340 wide, 12px gutter, 312px cards), so
the wider artboard shows more of the board rather than a wider board. Six
columns still do not fit, so the board scrolls sideways — as it does in the
frame, where four of the six are visible.

**Where it leaves the frame**, and why:

- the icons are the sprite's, not the frame's exports — `js/icons.js` already
  carried every one of them
- the per-column filter reads `View all` on every column; the frame shows a
  filter glyph on two of them, and there is no filter state to drive it yet

**Interactions are thin**, as on the other screens: the columns scroll, the
board scrolls sideways, the column filter toggles. **Nothing drags yet**, and
a card does not open the application view — both are the obvious next
things.

#### Removed

- **The first board card** — the one from the `Draft #2 - 1440 px` frame, with
  the documents ring and the assignee stack. The alert-state card replaced it.
- **Visual cues 1** — the treatment that ran the tasks as full-bleed bands
  across the card, separated by hairlines. Cut after review; `Visual cues 2`
  survived and is now v1.

Their renderers and styles are deleted, as with the work list's removed
versions.

### Alert states

Both versions use the alert-state card from the CRM-2026 `To upload` page
(node `4622:10931`). The board is identical in both — each one passes its own
card renderer to `renderKanban`, so the columns, the toolbar and the chrome
are shared rather than copied.

| | What differs |
|---|---|
| **v1** Visual cues | One body, and the tasks are rounded tinted blocks inside it |
| **v2** Text & colour | No tints and no progress bar: a labelled two-column task list, and the documents as words |

**The four states are read off the deal**, not set by hand — `kbState()` in
`js/kanban.js` is the whole rule:

| State | When | How it shows |
|---|---|---|
| Immediate | A high-urgency deal still in Qualifying, not snoozed | Red banner, `New lead - call now`, and a red outline on v1 |
| Urgent | The deal is slipping: more than one task past its due date, or documents that have sat unchecked for ten days | Amber banner naming the count |
| Warning | `duplicate` is set on the deal | Grey banner, `Possible duplicate` |
| None | Nothing wants attention | No banner |

**The thresholds are what keep the board honest.** An alert on every card is
the same as no alerts at all, so a state has to mean something is actually
wrong: one overdue task is ordinary slippage, two is a deal being neglected;
a document in review for two days is the process working, one sitting for ten
is not. Over the 26 deals that gives **2 immediate, 7 urgent, 2 warning and 15
quiet** — a board a broker could triage rather than a wall of amber.

**`duplicate` is the one field the model gained for this.** Everything else a
card shows was already in `js/data.js`. The task rows are derived from
`nextAction`, `tasksOverdue` and `tasksDue`, so the due counts stand in for
real dates — `kbTasks()` is the single place to change when the model
carries them.

Two values are sampled from the frame rather than taken from a token: the
filled contact pill (`#ECDEFE`) and the neutral task block (`#EFEFEF`). Both
sit between steps on the ramp, and matching the frame mattered more than
inventing a token for them.

## Screen 2 — the copy of the application view

`screen2-v1.html` is a **standalone duplicate of the application view**, the
starting point for a different screen. It is a copy rather than a second
skin, because the two are meant to diverge: the `av` prefix was renamed to
`s2` throughout, so `js/screen2.js` and `css/screen2.css` can be reshaped
freely without any of it reaching the screen a deal opens into.

It still shares what is genuinely common — `css/tokens.css`, the icon sprite
in `js/icons.js`, and the deal data in `js/data.js`.

Two things differ from the original, both because this is a screen in its own
right rather than an overlay over the work list:

- it renders on load, from `DEALS[0]`, instead of waiting for a row to be
  clicked — so the `.is-open` gate and the row-opening wiring are gone
- the close `×` is gone from the top bar: there is nothing behind it to close
  back to

The interactions that were asked for are all still there — sections collapse,
Activity and Internal notes expand over the column, Broker Assist raises, the
external/internal tabs switch, the lists scroll.

It has its own prototype view at `screen2.html`, where it is **v1** — the
numbering starts again, because this is a different screen rather than another
take on the work list. The page itself is `screen2-v1.html`, and it opens on
its own at `/screen2-v1.html`.

A second version of this screen goes the way the work list's do: a page that
sets `window.S2_VARIANT`, an entry in `S2_MOUNTERS` at the bottom of
`js/screen2.js` skinning the same mount, and one line in the `versions` array
in `screen2.html`.

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
