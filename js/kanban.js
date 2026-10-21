/* ==========================================================================
   Kanban view — the board the work list can switch to.
   --------------------------------------------------------------------------
   The board itself — columns, toolbar, chrome — is a rebuild of the Figma
   frame "Draft #2 - 1440 px" (node 4235:8867) on this project's 1920x1080
   artboard rather than the frame's 1440: a column keeps the frame's
   measurements, so the wider artboard shows more of the board instead of a
   different board.

   The card in it is the alert-state card from the "To upload" page (node
   4622:10931), in its two directions:

     v1  Visual cues    tasks as rounded tinted blocks inside one body
     v2  Text & colour  tasks as a labelled two-column list, documents as
                        words with no bar

   Everything outside the middle of the card — banner, who, stage, owner,
   actions — is the same in both, so a change there lands in both.

   It runs on the shared model in js/data.js — the same deals the work list
   shows — so the board and the list tell the same story. The columns are
   MASTER_STAGES in order, and `snoozed` wins over the pipeline stage the
   way it does everywhere else.

   Interactions are thin, as they are on the other screens: the columns
   scroll, the board scrolls sideways, and the controls are presentational.
   Nothing drags yet.
   ========================================================================== */

/* How long a deal has gone untouched, which is what turns a normal state
   into one worth shouting about. */
const kbDaysSince = (date) => Math.round((parseDMY(TODAY) - parseDMY(date)) / 86400000);

/* The four states, in the order a broker should notice them. Each one is
   read off the deal rather than set by hand:

     immediate  a high-urgency deal still in Qualifying — nobody has worked it
     urgent     the deal is slipping: more than one task past its due date, or
                documents the client sent that have sat unchecked for a week
                and a half
     warning    flagged by the system rather than by the pipeline
     (none)     nothing wants attention

   **The thresholds are what keep the board honest.** An alert on every card
   is the same as no alerts at all, so a state has to mean something is
   actually wrong: one overdue task is ordinary slippage, two is a deal being
   neglected; a document in review for two days is the process working, one
   sitting for ten is not. Over the 26 mock deals that gives 2 immediate, 7
   urgent, 2 warning and 15 quiet — a board a broker could triage rather than
   a wall of amber.

   `duplicate` is the one thing the model could not express, so js/data.js
   gained it. Everything else was already there. */
function kbState(d) {
  const c = docCounts(d);

  if (d.urgency === 'high' && d.master === 'qualifying' && !d.snoozed)
    return { id:'immediate', glyph:'alarm', label:'New lead - call now', action:'Call by today 4:07pm' };

  if (d.tasksOverdue >= 2)
    return { id:'urgent', glyph:'alarm',
             label:`${d.tasksOverdue} tasks overdue`, action:'Action now' };

  if (c.review > 0 && kbDaysSince(d.activity) >= 10)
    return { id:'urgent', glyph:'alarm',
             label:`${c.review} document${c.review > 1 ? 's' : ''} to review`, action:'Review now' };

  if (d.duplicate)
    return { id:'warning', glyph:'alert', label:'Possible duplicate', action:'Review now' };

  return null;
}

/* Up to two task rows, derived from the deal. The due counts stand in for
   real dates, which the model does not carry yet — when it does, this is the
   one place that has to change. */
function kbTasks(d) {
  const c = docCounts(d);
  const out = [];

  if (d.tasksOverdue > 0) {
    out.push({
      label: d.nextAction || (c.rejected ? 'Re-request rejected document' : `Chase ${d.name.split(' ')[0]}`),
      due: `${d.tasksOverdue} day${d.tasksOverdue > 1 ? 's' : ''} overdue`,
      overdue: true
    });
  }
  if (d.tasksDue > 0) {
    out.push({ label:`Reassign to ${d.assigned[1]}`, due:`due in ${d.tasksDue} day${d.tasksDue > 1 ? 's' : ''}` });
  }
  if (!out.length && d.nextAction) out.push({ label:d.nextAction, due:'due this week' });

  return out.slice(0, 2);
}

/* Received out of requested, as the frame reads it: the filled part of the
   bar is what is approved, and the breakdown names only what is not. */
const kbDocBar = (d, c) => `
  <div class="kb-c__docs">
    <div class="kb-c__docs-head">
      <span class="kb-c__docs-label">Documents</span>
      <span class="kb-c__docs-n">${c.ok} of ${d.docs.length}</span>
    </div>
    <div class="kb-c__bar">
      ${c.ok ? `<span class="kb-c__seg kb-c__seg--ok" style="flex:${c.ok}"></span>` : ''}
      ${c.review ? `<span class="kb-c__seg kb-c__seg--review" style="flex:${c.review}"></span>` : ''}
      ${c.rejected ? `<span class="kb-c__seg kb-c__seg--rejected" style="flex:${c.rejected}"></span>` : ''}
      ${c.pending ? `<span class="kb-c__seg" style="flex:${c.pending}"></span>` : ''}
    </div>
    <div class="kb-c__docs-breakdown">${kbDocWords(c)}</div>
  </div>`;

/* The same three numbers as words, for the version that drops the bar. */
function kbDocWords(c) {
  const parts = [];
  if (c.review)   parts.push(`<span class="is-review">${c.review} pending</span>`);
  if (c.rejected) parts.push(`<span class="is-rejected">${c.rejected} rejected</span>`);
  if (c.pending)  parts.push(`<span>${c.pending} to request</span>`);
  return parts.join('<span class="kb-c__dot">·</span>') || '<span>all in</span>';
}

/* `mode` is 'cues' or 'text' — the only thing the two versions disagree
   about is the middle of the card. */
function kbCard(d, i, mode) {
  const st = kbState(d);
  const tasks = kbTasks(d);
  const c = docCounts(d);

  const banner = st ? `
    <div class="kb-c__banner">
      <span class="kb-c__banner-label">${icon(st.glyph, 15)}${st.label}</span>
      <span class="kb-c__banner-action">${st.action}</span>
    </div>` : '';

  const head = `
    <div class="kb-c__who">
      <div class="kb-c__id">
        <span class="kb-c__name">${d.name}</span>
        <span class="kb-c__amount">${money(d.amount)}</span>
      </div>
      <div class="kb-c__contact">
        <span class="kb-cp kb-cp--on" title="Call">${icon('phone', 14)}</span>
        <span class="kb-cp" title="SMS">${icon('chat', 14)}</span>
        <span class="kb-cp" title="Email">${icon('mail', 14)}</span>
      </div>
    </div>
    <div class="kb-c__stage">
      <span>Day ${d.day}</span>
      <span>${d.stage}</span>
    </div>`;

  const owner = `
    <div class="kb-c__owner">
      <span class="kb-c__ava">${d.assigned[0]}</span>
      ${d.partner ? `<span class="kb-c__partner">${d.partner[1]}</span>` : ''}
    </div>`;

  const actions = `
    <div class="kb-c__actions">
      <span class="kb-ap kb-ap--grow">${icon('note', 14)} Note</span>
      <span class="kb-ap kb-ap--grow">${icon('check-circle', 14)} Task</span>
      <span class="kb-ap">${icon('article', 14)} Request docs</span>
      <span class="kb-ap kb-ap--icon">${icon('kebab', 16)}</span>
    </div>`;

  const open = `<article class="kb-c kb-c--${mode} ${st ? 'is-' + st.id : ''}" data-deal-row="${i}">`;

  /* v1 — one body, and the tasks are tinted blocks inside it. */
  if (mode === 'cues') {
    return `${open}
      ${banner}
      <div class="kb-c__body">
        ${head}
        ${tasks.length ? `<div class="kb-c__blocks">${tasks.map(t => `
          <div class="kb-c__block ${t.overdue ? 'is-overdue' : ''}">
            ${icon('clock', 16)}
            <span class="kb-c__block-label">${t.label}</span>
            <span class="kb-c__block-due">${t.due}</span>
          </div>`).join('')}</div>` : ''}
        ${kbDocBar(d, c)}
        ${owner}
      </div>
      ${actions}
    </article>`;
  }

  /* v2 — no tints and no bar: the state is carried by the words and their
     colour alone. */
  return `${open}
    ${banner}
    <div class="kb-c__body">
      ${head}
      ${tasks.length ? `<div class="kb-c__list">${tasks.map((t, n) => `
        <div class="kb-c__list-row ${t.overdue ? 'is-overdue' : ''}">
          <span class="kb-c__list-label ${n ? 'is-hidden' : ''}">Upcoming tasks</span>
          <span class="kb-c__list-task">${t.label}</span>
          <span class="kb-c__list-due">${t.due}</span>
        </div>`).join('')}</div>` : ''}
      <span class="kb-c__hr"></span>
      <div class="kb-c__docs-line">
        <span class="kb-c__docs-label">Documents</span>
        <span class="kb-c__docs-n">${c.ok} of ${d.docs.length}</span>
        <span class="kb-spacer"></span>
        <span class="kb-c__docs-breakdown">${kbDocWords(c)}</span>
      </div>
      ${owner}
    </div>
    ${actions}
  </article>`;
}

/* ---------- Columns -------------------------------------------------------- */

/* Snoozed is broker-set, so it wins over whatever stage the application is
   technically in — the same rule the grouped work list uses. */
const kbBucket = (d) => (d.snoozed ? 'snoozed' : d.master);

function kbColumn(stage, card) {
  const deals = DEALS.filter(d => kbBucket(d) === stage.id);
  return `
    <section class="kb-col" data-stage="${stage.id}">
      <div class="kb-col__head">
        <span class="kb-col__name">${stage.label}</span>
        <span class="kb-col__n">(${String(deals.length).padStart(2, '0')})</span>
        <span class="kb-spacer"></span>
        <span class="kb-col__filter" title="${stage.note}">
          View all ${icon('chevron-down', 11)}
        </span>
      </div>
      <div class="kb-col__scroll">
        ${deals.map(d => card(d, DEALS.indexOf(d))).join('')}
      </div>
    </section>`;
}

/* ---------- Toolbar and shell ---------------------------------------------- */

/* The board's own controls. The view toggle is presentational: the work
   list is its own prototype view, not a tab inside this one. */
const kbBar = () => `
  <div class="kb-bar">
    <div class="kb-board-name">
      <span class="avatar avatar--solid kb-board-name__ava">KZ</span>
      <span class="kb-board-name__label">Kenn&rsquo;s Board</span>
    </div>

    <span class="kb-select kb-select--wide">
      Asset Finance - AU ${icon('chevron-down', 11)}
    </span>

    <div class="kb-views">
      <span class="kb-view is-on">${icon('grid', 14)} Kanban</span>
      <span class="kb-rule"></span>
      <span class="kb-view">${icon('rows', 14)} Worklist</span>
    </div>

    <label class="kb-search">
      ${icon('search', 16)}
      <span class="kb-search__ph">Search applications&hellip;</span>
    </label>

    <span class="kb-spacer"></span>

    <span class="kb-new">${icon('plus', 10)} New</span>
    <span class="kb-rule"></span>
    <span class="kb-filter">${icon('sliders', 14)} Filter</span>
    <span class="kb-rule"></span>
    <span class="kb-select">-Sort by- ${icon('chevron-down', 11)}</span>
  </div>`;

/* The board is the same in both versions — only the card differs, so each
   version passes its own card renderer rather than its own board. */
function renderKanban(card) {
  return `
  <div class="kb">
    <header class="appbar">
      <div class="logo"><svg width="22" height="13"><use href="#i-logo"/></svg></div>
      <div class="nav-placeholder t-body-sm">General CRM navigation elements here</div>
    </header>

    ${kbBar()}

    <div class="kb-board">
      ${MASTER_STAGES.map(s => kbColumn(s, card)).join('')}
    </div>
  </div>`;
}

/* Wires what the board does. Scrolling is CSS; this is the rest of it. */
function mountKanban(app) {
  /* The column filter is a control, not a menu yet, so it shows what it
     would filter rather than pretending to open. */
  app.querySelectorAll('.kb-col__filter').forEach(f =>
    f.addEventListener('click', () => f.classList.toggle('is-on')));
}

/* One entry per version of this screen, the way the work list and screen 2
   do it: the page sets `window.KB_VARIANT` and the prototype view points at
   the page. A third version goes here as another skin over the same card. */
const KB_RENDERERS = {
  v1: () => renderKanban((d, i) => kbCard(d, i, 'cues')),
  v2: () => renderKanban((d, i) => kbCard(d, i, 'text'))
};
const KB_MOUNTERS = {
  v1: mountKanban,
  v2: mountKanban
};

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  const variant = window.KB_VARIANT || 'v1';
  const render = KB_RENDERERS[variant];
  if (!app || !render) return;
  app.innerHTML = render();
  const mount = KB_MOUNTERS[variant];
  if (mount) mount(app);
});
