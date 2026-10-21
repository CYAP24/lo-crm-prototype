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
   sitting for ten is not. Over the 27 mock deals that gives 3 immediate, 7
   urgent, 2 warning and 15 quiet — a board a broker could triage rather than
   a wall of amber. The three immediate ones are the New lead column.

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
   one place that has to change.

   Each row carries the due text twice. v1 gives a task its own block and can
   spell it out; v2 puts the label, the task and the due on one line, so it
   takes the short form and gives the room back to the task name — which is
   what the frame does. */
function kbTasks(d) {
  const c = docCounts(d);
  const out = [];
  const days = (n) => `${n} day${n > 1 ? 's' : ''}`;

  if (d.tasksOverdue > 0) {
    out.push({
      label: d.nextAction || (c.rejected ? 'Re-request rejected document' : `Chase ${d.name.split(' ')[0]}`),
      due: `${days(d.tasksOverdue)} overdue`,
      dueShort: `${d.tasksOverdue}d overdue`,
      overdue: true
    });
  }
  if (d.tasksDue > 0) {
    out.push({
      label: `Reassign to ${d.assigned[1]}`,
      due: `due in ${days(d.tasksDue)}`,
      dueShort: `due in ${d.tasksDue}d`
    });
  }
  if (!out.length && d.nextAction) {
    out.push({ label: d.nextAction, due: 'due this week', dueShort: 'this week' });
  }

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
function kbCard(d, i, mode, v) {
  const st = kbState(d);
  const tasks = kbTasks(d);
  const c = docCounts(d);

  /* A card asking to be called right now drops its tasks and its documents,
     in both versions: the only thing being asked for is the call, and rows
     of progress underneath argue with it. What is left is who, how much, the
     day and stage, and the three ways to reach them. */
  const callNow = !!st && st.id === 'immediate';

  /* A parked deal does not offer the three ways to reach the client — the
     whole point is that nobody is ringing them yet — so the contact buttons
     give way to when it comes back. */
  const snoozed = kbBucket(d) === 'snoozed';

  /* In select mode the card grows a box in front of the name, which indents
     the identity row rather than hanging off the card's corner. */
  const sel = !!(v && v.select);
  const picked = sel && v.selected.has(i);

  const banner = st ? `
    <div class="kb-c__banner">
      <span class="kb-c__banner-label">${icon(st.glyph, 15)}${st.label}</span>
      <span class="kb-c__banner-action">${st.action}</span>
    </div>` : '';

  const head = `
    <div class="kb-c__who">
      ${sel ? `<span class="kb-cbox" data-kb-pick="${i}">${picked ? icon('check-sm', 12) : ''}</span>` : ''}
      <div class="kb-c__id">
        <span class="kb-c__name">${d.name}</span>
        <span class="kb-c__amount">${money(d.amount)}</span>
      </div>
      ${snoozed
        ? `<span class="kb-snooze">${icon('clock', 14)} Snoozed until ${d.snoozedUntil}</span>`
        : `<div class="kb-c__contact">
             <span class="kb-cp kb-cp--on" title="Call">${icon('phone', 14)}</span>
             <span class="kb-cp" title="SMS">${icon('chat', 14)}</span>
             <span class="kb-cp" title="Email">${icon('mail', 14)}</span>
           </div>`}
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
      <span class="kb-ap kb-ap--grow" data-kb-panel="note">${icon('note', 14)} Note</span>
      <span class="kb-ap kb-ap--grow" data-kb-panel="task">${icon('check-circle', 14)} Task</span>
      <span class="kb-ap">${icon('article', 14)} Request docs</span>
      <span class="kb-ap kb-ap--icon">${icon('kebab', 16)}</span>
    </div>`;

  const open = `<article class="kb-c kb-c--${mode} ${st ? 'is-' + st.id : ''}`
    + `${picked ? ' is-picked' : ''}" data-deal-row="${i}">`;

  /* v1 — one body, and the tasks are tinted blocks inside it. */
  if (mode === 'cues') {
    return `${open}
      ${banner}
      <div class="kb-c__body">
        ${head}
        ${!callNow && tasks.length ? `<div class="kb-c__blocks">${tasks.map(t => `
          <div class="kb-c__block ${t.overdue ? 'is-overdue' : ''}">
            ${icon('calendar-clock', 16)}
            <span class="kb-c__block-label">${t.label}</span>
            <span class="kb-c__block-due">${t.due}</span>
          </div>`).join('')}</div>` : ''}
        ${callNow ? '' : kbDocBar(d, c)}
        ${owner}
      </div>
      ${actions}
    </article>`;
  }

  /* v2 — no tints and no bar: the state is carried by the words and their
     colour alone. The rule above takes the divider with the rows it
     separates, so a call-now card is not left with a line across nothing. */
  const middle = callNow ? '' : `
    ${tasks.length ? `<div class="kb-c__list">${tasks.map((t, n) => `
      <div class="kb-c__list-row ${t.overdue ? 'is-overdue' : ''}">
        <span class="kb-c__list-label ${n ? 'is-hidden' : ''}">Upcoming tasks</span>
        <span class="kb-c__list-task">${t.label}</span>
        <span class="kb-c__list-due">${t.dueShort}</span>
      </div>`).join('')}</div>` : ''}
    <span class="kb-c__hr"></span>
    <div class="kb-c__docs-line">
      <span class="kb-c__docs-label">Documents</span>
      <span class="kb-c__docs-n">${c.ok} of ${d.docs.length}</span>
      <span class="kb-spacer"></span>
      <span class="kb-c__docs-breakdown">${kbDocWords(c)}</span>
    </div>`;

  return `${open}
    ${banner}
    <div class="kb-c__body">
      ${head}
      ${middle}
      ${owner}
    </div>
    ${actions}
  </article>`;
}

/* ---------- Columns -------------------------------------------------------- */

/* The board's own columns: the master stages with New lead in front of them.
   A lead that has just arrived has not been qualified yet, so it sits before
   Qualifying rather than inside it.

   The stage list is local to the kanban rather than added to MASTER_STAGES,
   because that array is the work list's spine too and an arrivals column is
   a board idea, not a change to the pipeline. */
const KB_STAGES = [
  { id:'newlead', label:'New lead', note:'Just arrived, nobody has called yet' },
  ...MASTER_STAGES
];

/* Which column a deal sits in. Two rules override the pipeline stage:

   A deal that wants calling right now is a new arrival by definition, so it
   goes to New lead — which is what keeps the call-now card exclusive to that
   column instead of scattered down the board.

   Snoozed is broker-set, and it wins over whatever stage the application is
   technically in — the same rule the grouped work list uses. */
function kbBucket(d) {
  const st = kbState(d);
  if (st && st.id === 'immediate') return 'newlead';
  return d.snoozed ? 'snoozed' : d.master;
}

/* What the heading reports, in the order a broker reads it: how many, how
   much, and what is late. Each one is summed from the column's own deals, so
   the heading cannot drift from the cards under it. */
const kbColumnStats = (deals) => ({
  n: deals.length,
  value: deals.reduce((t, d) => t + d.amount, 0),
  overdue: deals.reduce((t, d) => t + d.tasksOverdue, 0)
});

/* One row: the stage and its count on the left, the two totals on the right
   where the filter control used to sit. The stage's description moves onto
   the name as a tooltip, since that is where it went with the control.

   The heading differs between the versions the same way the cards do.

   v1 states the totals as chips, which is the language of its tinted task
   blocks, and shortens the value to fit one — $1.2M rather than the whole
   figure.

   v2 keeps them as a line of text with colour doing the work, and spells the
   value out, since nothing else on that card is abbreviated either.

   Both drop the overdue count when there is none: an empty "0 overdue"
   on every column is the thing that stops the real ones registering. */
function kbColumnHead(stage, deals, mode) {
  const s = kbColumnStats(deals);

  const stats = mode === 'cues'
    ? `<div class="kb-col__stats">
         <span class="kb-stat">${moneyShort(s.value)}</span>
         ${s.overdue ? `<span class="kb-stat kb-stat--over">${s.overdue} overdue</span>` : ''}
       </div>`
    : `<div class="kb-col__line">
         <span class="kb-col__value">${money(s.value)}</span>
         ${s.overdue ? `<span class="kb-col__dot">·</span>
         <span class="kb-col__over">${s.overdue} task${s.overdue > 1 ? 's' : ''} overdue</span>` : ''}
       </div>`;

  return `
    <div class="kb-col__head">
      <span class="kb-col__name" title="${stage.note}">${stage.label}</span>
      <span class="kb-col__n">(${String(s.n).padStart(2, '0')})</span>
      <span class="kb-spacer"></span>
      ${stats}
    </div>`;
}

/* `pool` is what the view, the filters and the sort have left; the column
   takes its share of it rather than reaching for DEALS, so the heading's
   counts and totals describe what is actually on screen. */
function kbColumn(stage, card, mode, pool, v) {
  const deals = pool.filter(d => kbBucket(d) === stage.id);
  const all = deals.length > 0 && deals.every(d => v.selected.has(DEALS.indexOf(d)));
  return `
    <section class="kb-col" data-stage="${stage.id}">
      ${v.select ? `
        <span class="kb-colsel ${all ? 'is-on' : ''}" data-kb-colsel="${stage.id}">
          <span class="kb-box">${all ? icon('check-sm', 11) : ''}</span>
          ${all ? 'Deselect' : 'Select'} all
        </span>` : ''}
      ${kbColumnHead(stage, deals, mode)}
      <div class="kb-col__scroll">
        ${deals.length
          ? deals.map(d => card(d, DEALS.indexOf(d))).join('')
          : `<p class="kb-col__empty t-body-sm">Nothing here with these filters.</p>`}
      </div>
    </section>`;
}

/* ==========================================================================
   The board's own controls — v1.
   --------------------------------------------------------------------------
   Seven things the brief asks the bar to do, and where each one lives:

     switch board / list / Easy View   tabs with a glyph, as before
     jump to a common view             a named dropdown beside the board name
     search                            the one field, widened, saying what it
                                       actually searches
     filter                            a side panel, applying as you change it
     sort                              the -Sort by- dropdown
     add a lead                        + New lead
     work on several deals at once     Select, which turns the board into
                                       checkboxes and raises a bulk bar

   Everything here is real: the views filter, the sort sorts, the filters
   apply instantly and the counts follow. What is mock is the content behind
   an action — nothing reassigns, messages or saves.
   ========================================================================== */

const kbDaysUntil = (date) => Math.round((parseDMY(date) - parseDMY(TODAY)) / 86400000);

/* The nine views the brief names, plus the unfiltered board they sit on.
   Each is a predicate over a deal, so a view and a filter compose rather
   than fight: picking "Overdue" then filtering by broker gives you the
   overdue deals for that broker. */
const KB_VIEWS = {
  all:       { label: 'All deals',               test: () => true },
  mine:      { label: 'My deals',                test: (d) => d.assigned[0] === 'KZ' },
  team:      { label: 'My team',                 test: (d) => ['KZ', 'JF', 'SM'].includes(d.assigned[0]) },
  attention: { label: 'Needs attention',         test: (d) => !!kbState(d) },
  today:     { label: 'New today',               test: (d) => kbDaysSince(d.created) <= 1 },
  overdue:   { label: 'Overdue',                 test: (d) => d.tasksOverdue > 0 },
  customer:  { label: 'Waiting on the customer', test: (d) => docCounts(d).pending > 0 },
  lender:    { label: 'Waiting on the lender',   test: (d) => d.master === 'progress' },
  settling:  { label: 'Settling this week',      test: (d) => !!d.settlement && kbDaysUntil(d.settlement) <= 7 },
  docs:      { label: 'Documents to review',     test: (d) => docCounts(d).review > 0 }
};

/* Saved views are the broker's own, so they live beside the standard ones
   rather than inside them. One is marked as the board's default. */
const KB_SAVED = [
  { label: 'Asset Finance - AU', test: (d) => d.product === 'Asset finance', isDefault: true },
  { label: 'Big-ticket equipment', test: (d) => d.product === 'Equipment finance' && d.amount >= 300000 }
];

/* The follow-up a sort orders by: the soonest thing with a date on it. */
const kbFollowUp = (d) => (d.tasksOverdue > 0 ? -d.tasksOverdue : (d.tasksDue || 99));

/* `created` and `activity` are dates the deal records, never the UI. Opening
   a card or its quick-actions panel changes neither, so a sorted board does
   not reshuffle underneath a broker who just looked at something — which is
   the behaviour the brief asks for. */
const KB_SORTS = {
  newest:   { label: 'Newest first',    cmp: (a, b) => parseDMY(b.created) - parseDMY(a.created) },
  oldest:   { label: 'Oldest first',    cmp: (a, b) => parseDMY(a.created) - parseDMY(b.created) },
  activity: { label: 'Last activity',   cmp: (a, b) => parseDMY(b.activity) - parseDMY(a.activity) },
  amount:   { label: 'Amount',          cmp: (a, b) => b.amount - a.amount },
  followup: { label: 'Next follow-up',  cmp: (a, b) => kbFollowUp(a) - kbFollowUp(b) }
};

/* Every filter the brief lists. A group with nothing ticked does not
   constrain, so filters narrow only where the broker has said something. */
const KB_FILTERS = {
  broker:  { label: 'Broker',      of: (d) => d.assigned[1] },
  stage:   { label: 'Stage',       of: (d) => (KB_STAGES.find(s => s.id === kbBucket(d)) || {}).label },
  segment: { label: 'Consumer or commercial', of: (d) => d.segment, cap: true },
  product: { label: 'Loan type',   of: (d) => d.product },
  source:  { label: 'Lead source', of: (d) => d.source },
  partner: { label: 'Partner',     of: (d) => (d.partner ? d.partner[1] : null) },
  group:   { label: 'Partner group', of: (d) => partnerGroup(d) }
};

const kbDefaultView = () => ({
  view: 'all',
  saved: null,
  sort: 'newest',
  picked: Object.fromEntries(Object.keys(KB_FILTERS).map(k => [k, []])),
  min: 0, max: 700000,
  from: '', to: '',
  select: false,
  selected: new Set()
});

/* Turns the view state into the deals the board should show. */
function kbDeals(v) {
  const dmy = (iso) => {
    const [y, m, d] = iso.split('-');
    return parseDMY(`${d}/${m}/${y.slice(2)}`);
  };
  const saved = v.saved === null ? null : KB_SAVED[v.saved];

  return DEALS
    .filter(d => KB_VIEWS[v.view].test(d))
    .filter(d => !saved || saved.test(d))
    .filter(d => Object.keys(KB_FILTERS).every(k => {
      const picked = v.picked[k];
      return !picked.length || picked.includes(KB_FILTERS[k].of(d));
    }))
    .filter(d => d.amount >= v.min && d.amount <= v.max)
    .filter(d => !v.from || parseDMY(d.created) >= dmy(v.from))
    .filter(d => !v.to || parseDMY(d.created) <= dmy(v.to))
    .sort(KB_SORTS[v.sort].cmp);
}

/* How many filter groups are actually constraining, for the badge on the
   Filter control — a number only when it has something to say. */
const kbFilterCount = (v) =>
  Object.values(v.picked).filter(a => a.length).length
  + (v.min > 0 || v.max < 700000 ? 1 : 0)
  + (v.from || v.to ? 1 : 0);

/* ---------- The bar -------------------------------------------------------- */

const kbMenuItem = (key, label, on, extra = '') => `
  <span class="kb-menu__item ${on ? 'is-on' : ''}" ${key}>
    <span class="kb-menu__tick">${on ? icon('check-sm', 12) : ''}</span>${label}${extra}
  </span>`;

function kbBarV1(v) {
  const viewLabel = v.saved !== null ? KB_SAVED[v.saved].label : KB_VIEWS[v.view].label;
  const fcount = kbFilterCount(v);

  return `
  <div class="kb-bar">
    <div class="kb-board-name">
      <span class="avatar avatar--solid kb-board-name__ava">KZ</span>
      <span class="kb-board-name__label">Kenn&rsquo;s Board</span>
    </div>

    <div class="kb-views-pick">
      <span class="kb-views-pick__label t-body-sm">Common views</span>
      <span class="kb-select kb-select--wide" data-kb-menu="views">
        ${viewLabel} ${icon('chevron-down', 11)}
      </span>
      <div class="kb-menu" data-kb-menufor="views">
        ${Object.keys(KB_VIEWS).map(k =>
          kbMenuItem(`data-kb-view="${k}"`, KB_VIEWS[k].label, v.saved === null && v.view === k)).join('')}
        <div class="kb-menu__sep t-overline">Saved views</div>
        ${KB_SAVED.map((s, i) =>
          kbMenuItem(`data-kb-saved="${i}"`, s.label, v.saved === i,
            s.isDefault ? '<span class="kb-menu__default t-body-sm">Default</span>' : '')).join('')}
        <div class="kb-menu__foot">
          <span class="kb-menu__act">${icon('plus', 12)} Save this view</span>
          <span class="kb-menu__act">${icon('star', 12)} Set as default</span>
        </div>
      </div>
    </div>

    <div class="kb-views">
      <span class="kb-view is-on">${icon('grid', 14)} Board</span>
      <span class="kb-rule"></span>
      <span class="kb-view">${icon('rows', 14)} List</span>
      <span class="kb-rule"></span>
      <span class="kb-view">${icon('apps', 14)} Easy View</span>
    </div>

    <label class="kb-search">
      ${icon('search', 16)}
      <span class="kb-search__ph">Search deals &mdash; name, phone, email, reference or ABN&hellip;</span>
    </label>

    <span class="kb-spacer"></span>

    <span class="kb-new">${icon('plus', 10)} New lead</span>
    <span class="kb-rule"></span>
    <span class="kb-sel ${v.select ? 'is-on' : ''}" data-kb-select>
      ${icon('check-circle', 14)} Select
    </span>
    <span class="kb-rule"></span>
    <span class="kb-filter ${fcount ? 'is-on' : ''}" data-kb-filter>
      ${icon('sliders', 14)} Filter${fcount ? `<span class="kb-filter__n">${fcount}</span>` : ''}
    </span>
    <span class="kb-rule"></span>
    <div class="kb-sort-pick">
      <span class="kb-select" data-kb-menu="sort">
        ${KB_SORTS[v.sort].label} ${icon('chevron-down', 11)}
      </span>
      <div class="kb-menu kb-menu--right" data-kb-menufor="sort">
        ${Object.keys(KB_SORTS).map(k =>
          kbMenuItem(`data-kb-sort="${k}"`, KB_SORTS[k].label, v.sort === k)).join('')}
      </div>
    </div>
  </div>`;
}

/* v2 keeps the bar it had: the brief is for v1 first. */
const kbBarLegacy = () => `
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

/* ---------- Quick actions panel -------------------------------------------
   The same full-height sidebar the work list opens, reusing its `.dp-*`
   styles from css/variants.css and its two body renderers, `panelTasks` and
   `panelNotes`, from js/variants.js. Those files come along for the panel
   only — `window.VARIANT` is unset on these pages, so the work-list renderer
   never runs.

   What differs is the head and the tab set. The board already shows the
   reference and the product on the card, so the panel names the deal by the
   three things the card does not repeat: what it is worth, how long it has
   been in this stage, and which stage that is.
   -------------------------------------------------------------------------- */

const KB_PANEL_TABS = {
  task: { label: 'Add task', render: panelTasks, count: (d) => d.tasks },
  note: { label: 'Add note', render: panelNotes, count: (d) => d.notes },
  /* No renderer yet — the tab holds the place so the shape of the panel is
     right, and says plainly that there is nothing behind it. */
  docs: { label: 'Docs & forms', render: null }
};
const KB_PANEL_ORDER = ['task', 'note', 'docs'];

const kbPanelInner = (d, tab) => `
  <div class="dp__head">
    <div style="flex:1;min-width:0">
      <div class="t-h4 dp__title">Quick actions</div>
      <div class="t-label-lg dp__name">${d.name}</div>
      <div class="t-body-sm dp__meta">
        ${money(d.amount)} &nbsp;·&nbsp; Day ${d.day} &nbsp;·&nbsp; ${d.stage}
      </div>
    </div>
    <span class="dp__close" title="Close">${icon('close', 15)}</span>
  </div>
  <div class="dp__tabs">
    ${KB_PANEL_ORDER.map(k => {
      const t = KB_PANEL_TABS[k];
      const off = !t.render;
      return `
      <span class="dp__tab ${k === tab ? 'is-active' : ''} ${off ? 'is-disabled' : ''}"
            ${off ? 'title="Nothing here yet"' : `data-tab="${k}"`}>
        ${t.label}
        ${t.count ? `<span class="dp__tabn">${String(t.count(d)).padStart(2, '0')}</span>` : ''}
      </span>`;
    }).join('')}
  </div>
  <div class="dp__body">${KB_PANEL_TABS[tab].render(d)}</div>`;

/* Opens on the pill that was clicked: Note lands on Add note, Task on Add
   task. Request docs stays inert until there is something to show. */
function mountKanbanPanel(app) {
  const dp = app.querySelector('#kbpanel');
  if (!dp || typeof panelTasks !== 'function') return;
  let openOn = null;

  const close = () => {
    dp.classList.remove('is-open');
    openOn = null;
    app.querySelectorAll('.kb-c.is-active').forEach(c => c.classList.remove('is-active'));
  };

  const render = (i, tab) => {
    dp.innerHTML = kbPanelInner(DEALS[i], tab);
    dp.classList.add('is-open');
    openOn = `${i}:${tab}`;

    app.querySelectorAll('.kb-c').forEach(c =>
      c.classList.toggle('is-active', Number(c.dataset.dealRow) === i));

    dp.querySelector('.dp__close').addEventListener('click', (e) => { e.stopPropagation(); close(); });
    dp.querySelectorAll('.dp__tab[data-tab]').forEach(t =>
      t.addEventListener('click', (e) => { e.stopPropagation(); render(i, t.dataset.tab); }));
  };

  app.querySelectorAll('[data-kb-panel]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = trigger.closest('[data-deal-row]');
      const i = Number(card.dataset.dealRow);
      const tab = trigger.dataset.kbPanel;
      if (openOn === `${i}:${tab}`) { close(); return; }
      render(i, tab);
    });
  });

  dp.addEventListener('click', (e) => e.stopPropagation());
  app.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

/* ---------- Filter panel ---------------------------------------------------
   Every group is multi-select and every change repaints the board, so there
   is nothing to apply. The count at the top is the feedback an Apply button
   would otherwise have given.
   -------------------------------------------------------------------------- */

function kbFilterPanel(v, shown) {
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const group = (key) => {
    const f = KB_FILTERS[key];
    const values = [...new Set(DEALS.map(f.of).filter(Boolean))].sort();
    return `
      <div class="kbf__group">
        <div class="kbf__label t-overline">${f.label}</div>
        <div class="kbf__opts">
          ${values.map(val => `
            <span class="kbf__opt ${v.picked[key].includes(val) ? 'is-on' : ''}"
                  data-kb-pickfilter="${key}" data-val="${val}">
              <span class="kb-box">${v.picked[key].includes(val) ? icon('check-sm', 11) : ''}</span>
              ${f.cap ? cap(val) : val}
            </span>`).join('')}
        </div>
      </div>`;
  };

  return `
    <div class="kbf__head">
      <div style="flex:1;min-width:0">
        <div class="t-h4">Filter</div>
        <div class="t-body-sm kbf__count">Showing ${shown} of ${DEALS.length} deals</div>
      </div>
      <span class="kbf__clear t-body-sm" data-kb-clearfilters>Clear all</span>
      <span class="dp__close" title="Close" data-kb-closefilter>${icon('close', 15)}</span>
    </div>
    <div class="kbf__body">
      ${Object.keys(KB_FILTERS).map(group).join('')}

      <div class="kbf__group">
        <div class="kbf__label t-overline">Amount</div>
        <div class="kbf__range t-body-sm">${money(v.min)} &ndash; ${money(v.max)}${v.max >= 700000 ? '+' : ''}</div>
        <input type="range" id="kbf-min" min="0" max="700000" step="5000" value="${v.min}" data-kb-amount="min">
        <input type="range" id="kbf-max" min="0" max="700000" step="5000" value="${v.max}" data-kb-amount="max">
      </div>

      <div class="kbf__group">
        <div class="kbf__label t-overline">Created between</div>
        <div class="kbf__dates">
          <input type="date" id="kbf-from" value="${v.from}" data-kb-date="from">
          <span class="kbf__to t-body-sm">to</span>
          <input type="date" id="kbf-to" value="${v.to}" data-kb-date="to">
        </div>
      </div>
    </div>`;
}

/* ---------- Bulk bar -------------------------------------------------------
   Raised only while something is picked. The four actions are the ones the
   brief names; none of them does anything yet.
   -------------------------------------------------------------------------- */

const kbBulkBar = (n) => `
  <div class="kb-bulk ${n ? 'is-up' : ''}">
    <span class="kb-bulk__n t-label-md">${n} selected</span>
    <span class="kb-bulk__sep"></span>
    <span class="kb-bulk__act">${icon('user-plus', 14)} Reassign</span>
    <span class="kb-bulk__act">${icon('arrow-forward', 14)} Move stage</span>
    <span class="kb-bulk__act">${icon('chat', 14)} Send message</span>
    <span class="kb-bulk__act">${icon('check-circle', 14)} Add task</span>
    <span class="kb-bulk__sep"></span>
    <span class="kb-bulk__act kb-bulk__act--quiet" data-kb-clearsel>Clear</span>
  </div>`;

/* ---------- Shell ---------------------------------------------------------- */

const kbBoardInner = (mode, v) => {
  const pool = kbDeals(v);
  const card = (d, i) => kbCard(d, i, mode, v);
  return KB_STAGES.map(s => kbColumn(s, card, mode, pool, v)).join('');
};

/* The board is the same in both versions — the mode decides the card, the
   column heading and, for now, the toolbar: the new bar is v1's only. */
function renderKanban(mode, v) {
  return `
  <div class="kb">
    ${navBar()}

    ${mode === 'cues' ? kbBarV1(v) : kbBarLegacy()}

    <div class="kb-board">${kbBoardInner(mode, v)}</div>

    ${mode === 'cues' ? `
      <aside class="kbf" id="kbfilter"></aside>
      <div id="kbbulk"></div>` : ''}

    <aside class="dp" id="kbpanel"></aside>
  </div>`;
}

/* One entry per version of this screen, the way the work list and screen 2
   do it: the page sets `window.KB_VARIANT` and the prototype view points at
   the page. A third version goes here as another skin over the same card.

   Both versions mount the same thing — the quick actions panel is the
   board's only wiring, and it behaves identically in each. */
const KB_MODES = { v1: 'cues', v2: 'text' };

/* Wires the bar to the board. The board is repainted rather than patched —
   a view, a filter, a sort and a selection all change which cards exist, so
   there is one path rather than four. */
function mountKanbanBar(app, mode) {
  const v = kbDefaultView();
  const board = app.querySelector('.kb-board');
  const bar = () => app.querySelector('.kb-bar');
  const fp = app.querySelector('#kbfilter');
  const bulk = app.querySelector('#kbbulk');

  const closeMenus = () => app.querySelectorAll('.kb-menu.is-open').forEach(m => m.classList.remove('is-open'));

  const paintBar = () => {
    bar().outerHTML = kbBarV1(v);
    wireBar();
  };
  const paintBoard = () => {
    board.innerHTML = kbBoardInner(mode, v);
    mountKanbanPanel(app);
    wireBoard();
  };
  const paintFilters = () => { if (fp.classList.contains('is-open')) fp.innerHTML = kbFilterPanel(v, kbDeals(v).length); };
  const paintBulk = () => { bulk.innerHTML = v.select ? kbBulkBar(v.selected.size) : ''; wireBulk(); };
  const paintAll = () => { paintBar(); paintBoard(); paintFilters(); paintBulk(); };

  /* --- board-level wiring, redone after every repaint --- */
  function wireBoard() {
    app.querySelectorAll('[data-kb-pick]').forEach(box => box.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = Number(box.dataset.kbPick);
      v.selected.has(i) ? v.selected.delete(i) : v.selected.add(i);
      paintBoard(); paintBulk();
    }));

    app.querySelectorAll('[data-kb-colsel]').forEach(el => el.addEventListener('click', (e) => {
      e.stopPropagation();
      const stage = el.dataset.kbColsel;
      const ids = kbDeals(v).filter(d => kbBucket(d) === stage).map(d => DEALS.indexOf(d));
      const all = ids.every(i => v.selected.has(i));
      ids.forEach(i => all ? v.selected.delete(i) : v.selected.add(i));
      paintBoard(); paintBulk();
    }));
  }

  function wireBulk() {
    const clear = bulk.querySelector('[data-kb-clearsel]');
    if (clear) clear.addEventListener('click', (e) => {
      e.stopPropagation();
      v.selected.clear();
      paintBoard(); paintBulk();
    });
  }

  /* --- bar-level wiring, redone whenever the bar is repainted --- */
  function wireBar() {
    app.querySelectorAll('[data-kb-menu]').forEach(trigger => trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = app.querySelector(`[data-kb-menufor="${trigger.dataset.kbMenu}"]`);
      const open = menu.classList.contains('is-open');
      closeMenus();
      menu.classList.toggle('is-open', !open);
    }));

    app.querySelectorAll('[data-kb-view]').forEach(el => el.addEventListener('click', (e) => {
      e.stopPropagation();
      v.view = el.dataset.kbView; v.saved = null; v.selected.clear();
      closeMenus(); paintAll();
    }));

    app.querySelectorAll('[data-kb-saved]').forEach(el => el.addEventListener('click', (e) => {
      e.stopPropagation();
      v.saved = Number(el.dataset.kbSaved); v.view = 'all'; v.selected.clear();
      closeMenus(); paintAll();
    }));

    app.querySelectorAll('[data-kb-sort]').forEach(el => el.addEventListener('click', (e) => {
      e.stopPropagation();
      v.sort = el.dataset.kbSort;
      closeMenus(); paintAll();
    }));

    const sel = app.querySelector('[data-kb-select]');
    if (sel) sel.addEventListener('click', (e) => {
      e.stopPropagation();
      v.select = !v.select;
      if (!v.select) v.selected.clear();
      paintAll();
    });

    const filt = app.querySelector('[data-kb-filter]');
    if (filt) filt.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = fp.classList.contains('is-open');
      fp.classList.toggle('is-open', !open);
      if (!open) { fp.innerHTML = kbFilterPanel(v, kbDeals(v).length); wireFilters(); }
    });
  }

  /* --- filter panel: every change applies at once --- */
  function wireFilters() {
    fp.querySelector('[data-kb-closefilter]').addEventListener('click', (e) => {
      e.stopPropagation(); fp.classList.remove('is-open');
    });

    fp.querySelector('[data-kb-clearfilters]').addEventListener('click', (e) => {
      e.stopPropagation();
      Object.keys(v.picked).forEach(k => { v.picked[k] = []; });
      v.min = 0; v.max = 700000; v.from = ''; v.to = '';
      refilter();
    });

    fp.querySelectorAll('[data-kb-pickfilter]').forEach(opt => opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const k = opt.dataset.kbPickfilter, val = opt.dataset.val;
      const at = v.picked[k].indexOf(val);
      at === -1 ? v.picked[k].push(val) : v.picked[k].splice(at, 1);
      refilter();
    }));

    fp.querySelectorAll('[data-kb-amount]').forEach(r => r.addEventListener('input', () => {
      const which = r.dataset.kbAmount;
      v[which] = Number(r.value);
      /* Keep the pair the right way round rather than letting them cross. */
      if (v.min > v.max) { if (which === 'min') v.max = v.min; else v.min = v.max; }
      refilter();
    }));

    fp.querySelectorAll('[data-kb-date]').forEach(inp => inp.addEventListener('change', () => {
      v[inp.dataset.kbDate] = inp.value;
      refilter();
    }));
  }

  /* A filter change repaints the panel too, so its counts and ticks follow —
     but the focused control keeps the caret where the broker left it. */
  function refilter() {
    const active = document.activeElement && document.activeElement.id;
    paintBar(); paintBoard(); paintBulk();
    fp.innerHTML = kbFilterPanel(v, kbDeals(v).length);
    wireFilters();
    if (active) { const el = fp.querySelector('#' + active); if (el) el.focus(); }
  }

  app.addEventListener('click', () => { closeMenus(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeMenus();
    fp.classList.remove('is-open');
  });

  wireBar(); wireBoard(); paintBulk();
}

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  const mode = KB_MODES[window.KB_VARIANT || 'v1'];
  if (!app || !mode) return;

  const v = kbDefaultView();
  app.innerHTML = renderKanban(mode, v);
  mountKanbanPanel(app);
  if (mode === 'cues') mountKanbanBar(app, mode);
});
