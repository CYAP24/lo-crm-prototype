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

  /* v1 opens the full-height quick-actions panel; v2 floats a card beside
     the pill, the way the work list's own quick actions do. Same two
     actions either way — only where they land differs. */
  const pop = (kind, tab) => mode === 'text'
    ? `data-pop="${kind}" data-deal="${i}"`
    : `data-kb-panel="${tab}"`;

  const actions = `
    <div class="kb-c__actions">
      <span class="kb-ap kb-ap--grow" ${pop('notes', 'note')}>${icon('note', 14)} Note</span>
      <span class="kb-ap kb-ap--grow" ${pop('tasks', 'task')}>${icon('check-circle', 14)} Task</span>
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
   figure. The total is not one of them: it is on every column, so it sits
   as plain text at the stage name's size and leaves the chip to the thing
   that is only sometimes there.

   v2 keeps them as a line of text with colour doing the work, and spells the
   value out, since nothing else on that card is abbreviated either.

   Both drop the overdue count when there is none: an empty "0 overdue"
   on every column is the thing that stops the real ones registering. */
function kbColumnHead(stage, deals, mode) {
  const s = kbColumnStats(deals);

  const stats = mode === 'cues'
    ? `<div class="kb-col__stats">
         <span class="kb-col__sum">${moneyShort(s.value)}</span>
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

/* Each stage already carries a hue, a tint and an ink in `MASTER_STAGES`,
   for the colour-coded work list. The column hands them down as custom
   properties so a skin can reach for the stage's own colour without
   restating the palette. New lead is not in that list and borrows the
   system's error tint, which is the ground it already stands on. */
const kbTone = (stage) => [
  `--kb-stage:${stage.colour || 'var(--error-base)'}`,
  `--kb-tint:${stage.tint || (stage.colour ? 'var(--bg-surface)' : 'var(--error-bg)')}`,
  `--kb-ink:${stage.ink || (stage.colour ? 'var(--text-secondary)' : 'var(--text-error)')}`
].join(';');

/* `pool` is what the view, the filters and the sort have left; the column
   takes its share of it rather than reaching for DEALS, so the heading's
   counts and totals describe what is actually on screen. */
function kbColumn(stage, card, mode, pool, v) {
  const deals = pool.filter(d => kbBucket(d) === stage.id);
  const all = deals.length > 0 && deals.every(d => v.selected.has(DEALS.indexOf(d)));
  return `
    <section class="kb-col" data-stage="${stage.id}" style="${kbTone(stage)}">
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
  /* People are searched for and held as tags, because there are more of them
     than a tick list wants to show and a broker knows the name they are
     after. Everything else is a short, closed list, so ticks are quicker. */
  broker:  { label: 'Broker',  of: (d) => d.assigned[1], mark: (d) => d.assigned[0],
             kind: 'search', placeholder: 'Search brokers by name…' },
  partner: { label: 'Partner', of: (d) => (d.partner ? d.partner[1] : null),
             mark: (d) => (d.partner ? d.partner[0] : null),
             kind: 'search', placeholder: 'Search partners by name…' },

  stage:   { label: 'Stage',       of: (d) => (KB_STAGES.find(s => s.id === kbBucket(d)) || {}).label },
  segment: { label: 'Consumer or commercial', of: (d) => d.segment, cap: true },
  product: { label: 'Loan type',   of: (d) => d.product },
  source:  { label: 'Lead source', of: (d) => d.source },
  group:   { label: 'Partner group', of: (d) => partnerGroup(d) }
};

const KB_SEARCH_KEYS = Object.keys(KB_FILTERS).filter(k => KB_FILTERS[k].kind === 'search');
const KB_TICK_KEYS   = Object.keys(KB_FILTERS).filter(k => KB_FILTERS[k].kind !== 'search');

/* Name → initials, built from the deals so a person cannot appear here who
   is not on the board. */
function kbNameIndex(key) {
  const f = KB_FILTERS[key];
  const out = new Map();
  DEALS.forEach(d => {
    const label = f.of(d);
    if (label && !out.has(label)) out.set(label, f.mark(d));
  });
  return out;
}

/* A saved view is a set of filters with a name on it, not a rule of its own.
   That is what lets it be adjusted: applying one loads its filters into the
   panel, so the broker can see and change exactly what it stands for.

   It is a `let` because the broker owns this list — they save, rename and
   delete from it. Nothing persists past a reload; this is a prototype. */
const kbEmptyFilters = () => ({
  picked: Object.fromEntries(Object.keys(KB_FILTERS).map(k => [k, []])),
  min: 0, max: 700000, from: '', to: ''
});

let KB_SAVED = [
  {
    label: 'Asset Finance - AU',
    isDefault: true,
    filters: Object.assign(kbEmptyFilters(), {
      picked: Object.assign(kbEmptyFilters().picked, { product: ['Asset finance'] })
    })
  },
  {
    label: 'Big-ticket equipment',
    filters: Object.assign(kbEmptyFilters(), {
      picked: Object.assign(kbEmptyFilters().picked, { product: ['Equipment finance'] }),
      min: 300000
    })
  }
];

/* Loading a saved view is loading its filters — the dropdown then just
   remembers whose filters these are, so the name can be shown. */
function kbApplySaved(v, i) {
  const f = KB_SAVED[i].filters;
  v.picked = JSON.parse(JSON.stringify(f.picked));
  v.min = f.min; v.max = f.max; v.from = f.from; v.to = f.to;
  v.view = 'all';
  v.saved = i;
}

/* Snapshot of what the panel is currently filtering by. */
const kbSnapshot = (v) => ({
  picked: JSON.parse(JSON.stringify(v.picked)),
  min: v.min, max: v.max, from: v.from, to: v.to
});

const kbDefaultView = () => ({
  view: 'all',
  saved: null,
  sort: 'newest',
  picked: Object.fromEntries(Object.keys(KB_FILTERS).map(k => [k, []])),
  query: Object.fromEntries(KB_SEARCH_KEYS.map(k => [k, ''])),
  min: 0, max: 700000,
  from: '', to: '',
  editSaved: false,
  saveName: '',
  select: false,
  selected: new Set(),

  /* The bulk banner: which form is open, what it has been told so far, and
     the line it shows after a save. */
  bulk: null,
  note: '',
  pending: {
    broker: null, brokerQuery: '',
    stage: null,
    channel: 'SMS', text: '',
    taskTitle: '', taskWho: null, taskWhoQuery: '', taskDue: '',
    noteText: ''
  }
});

const kbResetPending = (v) => {
  v.pending = {
    broker: null, brokerQuery: '',
    stage: null,
    channel: 'SMS', text: '',
    taskTitle: '', taskWho: null, taskWhoQuery: '', taskDue: '',
    noteText: ''
  };
};

/* Turns the view state into the deals the board should show. */
function kbDeals(v) {
  const dmy = (iso) => {
    const [y, m, d] = iso.split('-');
    return parseDMY(`${d}/${m}/${y.slice(2)}`);
  };

  return DEALS
    .filter(d => KB_VIEWS[v.view].test(d))
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
      <span class="kb-pick__label t-body-sm">Your views</span>
      <span class="kb-select kb-select--wide" data-kb-menu="views">
        ${viewLabel} ${icon('chevron-down', 11)}
      </span>
      <div class="kb-menu" data-kb-menufor="views">
        ${Object.keys(KB_VIEWS).map(k =>
          kbMenuItem(`data-kb-view="${k}"`, KB_VIEWS[k].label, v.saved === null && v.view === k)).join('')}

        <div class="kb-menu__sep t-overline">Saved views</div>
        ${KB_SAVED.length === 0
          ? '<div class="kb-menu__none t-body-sm">None yet — save one from the filter panel.</div>'
          : v.editSaved
            /* Editing: each row becomes its name, a way to change what it
               stands for, and a way to be rid of it. */
            ? KB_SAVED.map((s, i) => `
                <div class="kb-menu__edit">
                  <input type="text" class="kb-menu__rename" id="kb-rename-${i}"
                         data-kb-rename="${i}" value="${s.label}" autocomplete="off">
                  <span class="kb-menu__editact" data-kb-adjust="${i}" title="Adjust its filters">${icon('sliders', 13)}</span>
                  <span class="kb-menu__editact kb-menu__editact--del" data-kb-delsaved="${i}" title="Delete">${icon('close', 13)}</span>
                </div>`).join('')
            : KB_SAVED.map((s, i) =>
                kbMenuItem(`data-kb-saved="${i}"`, s.label, v.saved === i,
                  s.isDefault ? '<span class="kb-menu__default t-body-sm">Default</span>' : '')).join('')}

        <div class="kb-menu__foot">
          ${v.editSaved
            ? '<span class="kb-menu__act" data-kb-editsaved="off">Done</span>'
            : `<span class="kb-menu__act">${icon('star', 12)} Set as default</span>
               <span class="kb-menu__act kb-menu__act--danger" data-kb-editsaved="on">Edit saved views</span>`}
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
      <span class="kb-pick__label t-body-sm">Sort by</span>
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

  /* A person group: the people already chosen as removable tags, then a
     field to find the next one. Suggestions appear only once something is
     typed, and never offer someone already in the list. */
  const searchGroup = (key) => {
    const f = KB_FILTERS[key];
    const index = kbNameIndex(key);
    const picked = v.picked[key];
    const typed = (v.query[key] || '').trim().toLowerCase();
    const matches = [...index.keys()]
      .filter(n => !picked.includes(n) && n.toLowerCase().includes(typed))
      .sort();

    return `
      <div class="kbf__group" data-kb-group="${key}">
        <div class="kbf__label t-overline">${f.label}</div>
        ${picked.length ? `<div class="kbf__tags">
          ${picked.map(n => `<span class="kbf__tag" data-val="${n}">${personChip([index.get(n), n])}</span>`).join('')}
        </div>` : ''}
        <input type="text" class="kbf__search" id="kbf-${key}" data-kb-search="${key}"
               value="${v.query[key] || ''}" placeholder="${f.placeholder}" autocomplete="off">
        ${typed ? `<div class="kbf__sugg">
          ${matches.length
            ? matches.map(n => `
                <span class="kbf__sugg-item" data-kb-addtag="${key}" data-val="${n}">
                  <span class="kbf__sugg-av">${index.get(n)}</span>${n}
                </span>`).join('')
            : `<span class="kbf__nomatch t-body-sm">No ${f.label.toLowerCase()} matching &ldquo;${v.query[key]}&rdquo;</span>`}
        </div>` : ''}
      </div>`;
  };

  const tickGroup = (key) => {
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

  /* Amount and date lead, because they are the two a broker reaches for
     without first deciding whose deals they are looking at. */
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
      ${/* One track with a handle at each end. Two range inputs stacked on
            it do the work, because no single input carries two values —
            only their thumbs take the pointer, so each is grabbable and the
            band between them is a plain element. */ ''}
      <div class="kbf__group">
        <div class="kbf__label t-overline">Amount</div>
        <div class="kbf__range t-body-sm">${money(v.min)} &ndash; ${money(v.max)}${v.max >= 700000 ? '+' : ''}</div>
        <div class="kbf__slider" style="--lo:${(v.min / 700000) * 100}%;--hi:${(v.max / 700000) * 100}%">
          <span class="kbf__slider-track"></span>
          <span class="kbf__slider-fill"></span>
          <input type="range" id="kbf-min" min="0" max="700000" step="5000" value="${v.min}" data-kb-amount="min" aria-label="Lowest amount">
          <input type="range" id="kbf-max" min="0" max="700000" step="5000" value="${v.max}" data-kb-amount="max" aria-label="Highest amount">
        </div>
      </div>

      <div class="kbf__group">
        <div class="kbf__label t-overline">Created between</div>
        <div class="kbf__dates">
          <input type="date" id="kbf-from" value="${v.from}" data-kb-date="from">
          <span class="kbf__to t-body-sm">to</span>
          <input type="date" id="kbf-to" value="${v.to}" data-kb-date="to">
        </div>
      </div>

      ${KB_SEARCH_KEYS.map(searchGroup).join('')}
      ${KB_TICK_KEYS.map(tickGroup).join('')}
    </div>

    ${/* Saving belongs here rather than in the views menu: this is where the
          thing being saved was made, and the broker can see it. */ ''}
    <div class="kbf__save">
      <input type="text" class="kbf__search" id="kbf-savename" data-kb-savename
             value="${v.saveName}" placeholder="Name this view&hellip;" autocomplete="off">
      <span class="kbf__savebtn ${v.saveName.trim() && kbFilterCount(v) ? '' : 'is-off'}" data-kb-saveview>
        ${icon('plus', 12)} Save this view
      </span>
    </div>`;
}

/* ---------- Bulk actions ---------------------------------------------------
   Picking a card raises a banner over the global nav rather than floating a
   bar over the board: the selection is a mode the whole screen is in, so it
   takes the screen's top edge, the way Zoho's does.

   A cross on the left drops the selection, the count sits beside it, and
   each action opens a small form under its own chip. Nothing is written —
   Save closes the form and says what would have happened.
   -------------------------------------------------------------------------- */

const KB_BULK = {
  broker:  { label: 'Reassign broker', glyph: 'user-plus' },
  stage:   { label: 'Move stage',      glyph: 'arrow-forward' },
  message: { label: 'Message',         glyph: 'chat' },
  task:    { label: 'Add a task',      glyph: 'check-circle' },
  note:    { label: 'Add a note',      glyph: 'note' }
};

/* Each form says what it needs before Save means anything, so the button is
   live only once it does. */
function kbBulkReady(v) {
  const p = v.pending;
  if (v.bulk === 'broker')  return !!p.broker;
  if (v.bulk === 'stage')   return !!p.stage;
  if (v.bulk === 'message') return p.text.trim().length > 0;
  if (v.bulk === 'task')    return p.taskTitle.trim().length > 0;
  if (v.bulk === 'note')    return p.noteText.trim().length > 0;
  return false;
}

function kbBulkForm(v) {
  const p = v.pending;
  const n = v.selected.size;

  if (v.bulk === 'broker') {
    const index = kbNameIndex('broker');
    const typed = p.brokerQuery.trim().toLowerCase();
    const matches = [...index.keys()].filter(x => x.toLowerCase().includes(typed)).sort();
    return `
      <div class="kb-pop__title t-label-md">Reassign ${n} deal${n > 1 ? 's' : ''} to</div>
      ${p.broker
        ? `<div class="kbf__tags"><span class="kbf__tag" data-val="${p.broker}">${personChip([index.get(p.broker), p.broker])}</span></div>`
        : `<input type="text" class="kbf__search" id="kb-bulk-broker" data-kb-bulkq="brokerQuery"
                  value="${p.brokerQuery}" placeholder="Search brokers by name&hellip;" autocomplete="off">
           ${typed ? `<div class="kbf__sugg">
             ${matches.length
               ? matches.map(x => `<span class="kbf__sugg-item" data-kb-bulkpick="broker" data-val="${x}">
                   <span class="kbf__sugg-av">${index.get(x)}</span>${x}</span>`).join('')
               : '<span class="kbf__nomatch t-body-sm">No broker by that name</span>'}
           </div>` : ''}`}`;
  }

  if (v.bulk === 'stage') {
    return `
      <div class="kb-pop__title t-label-md">Move ${n} deal${n > 1 ? 's' : ''} to</div>
      <div class="kb-pop__list">
        ${KB_STAGES.map(s => `
          <span class="kb-pop__opt ${p.stage === s.id ? 'is-on' : ''}" data-kb-bulkpick="stage" data-val="${s.id}">
            <span class="kb-box">${p.stage === s.id ? icon('check-sm', 11) : ''}</span>${s.label}
          </span>`).join('')}
      </div>`;
  }

  if (v.bulk === 'message') {
    return `
      <div class="kb-pop__title t-label-md">Message ${n} client${n > 1 ? 's' : ''}</div>
      <div class="kb-pop__seg">
        ${['SMS', 'Email'].map(c => `
          <span class="kb-pop__segbtn ${p.channel === c ? 'is-on' : ''}" data-kb-bulkpick="channel" data-val="${c}">${c}</span>`).join('')}
      </div>
      <textarea class="kb-pop__text" id="kb-bulk-text" data-kb-bulkq="text"
                placeholder="Write your ${p.channel.toLowerCase()}&hellip;">${p.text}</textarea>`;
  }

  if (v.bulk === 'note') {
    return `
      <div class="kb-pop__title t-label-md">Add a note to ${n} deal${n > 1 ? 's' : ''}</div>
      <textarea class="kb-pop__text" id="kb-bulk-note" data-kb-bulkq="noteText"
                placeholder="Write a note&hellip;">${p.noteText}</textarea>
      <div class="kb-pop__hint t-body-sm">Goes on every selected deal as an internal note.</div>`;
  }

  /* The task form is the quick-actions panel's own vocabulary: a title, who
     it is for, and when it is due. */
  const index = kbNameIndex('broker');
  const typed = p.taskWhoQuery.trim().toLowerCase();
  const matches = [...index.keys()].filter(x => x.toLowerCase().includes(typed)).sort();
  return `
    <div class="kb-pop__title t-label-md">Add a task to ${n} deal${n > 1 ? 's' : ''}</div>
    <input type="text" class="kbf__search" id="kb-bulk-task" data-kb-bulkq="taskTitle"
           value="${p.taskTitle}" placeholder="What needs doing?" autocomplete="off">
    <div class="kb-pop__label t-overline">Assigned to</div>
    ${p.taskWho
      ? `<div class="kbf__tags"><span class="kbf__tag" data-val="${p.taskWho}">${personChip([index.get(p.taskWho), p.taskWho])}</span></div>`
      : `<input type="text" class="kbf__search" id="kb-bulk-who" data-kb-bulkq="taskWhoQuery"
                value="${p.taskWhoQuery}" placeholder="Search brokers by name&hellip;" autocomplete="off">
         ${typed ? `<div class="kbf__sugg">
           ${matches.length
             ? matches.map(x => `<span class="kbf__sugg-item" data-kb-bulkpick="taskWho" data-val="${x}">
                 <span class="kbf__sugg-av">${index.get(x)}</span>${x}</span>`).join('')
             : '<span class="kbf__nomatch t-body-sm">No broker by that name</span>'}
         </div>` : ''}`}
    <div class="kb-pop__label t-overline">Due</div>
    <input type="date" id="kb-bulk-due" data-kb-bulkq="taskDue" value="${p.taskDue}">`;
}

/* What a save would have done, said plainly. Nothing is written: these are
   the words the confirmation uses, and the board is unchanged behind it. */
function kbBulkNote(v) {
  const n = v.selected.size;
  const deals = `${n} deal${n > 1 ? 's' : ''}`;
  const p = v.pending;
  if (v.bulk === 'broker')  return `${deals} reassigned to ${p.broker}`;
  if (v.bulk === 'stage')   return `${deals} moved to ${(KB_STAGES.find(s => s.id === p.stage) || {}).label}`;
  if (v.bulk === 'message') return `${p.channel} queued to ${n} client${n > 1 ? 's' : ''}`;
  if (v.bulk === 'note')    return `Note added to ${deals}`;
  return `Task added to ${deals}`;
}

function kbBulkBanner(v) {
  const n = v.selected.size;
  if (!n) return '';

  return `
    <div class="kb-bb">
      <span class="kb-bb__x" data-kb-bulkexit title="Clear selection">${icon('close', 15)}</span>
      <span class="kb-bb__n t-label-md">${n}</span>
      ${Object.keys(KB_BULK).map(k => `
        <span class="kb-bb__act ${v.bulk === k ? 'is-on' : ''}" data-kb-bulkopen="${k}">
          ${icon(KB_BULK[k].glyph, 13)} ${KB_BULK[k].label}
        </span>`).join('')}

      ${/* The confirmation sits beside the actions rather than replacing
            them: having just reassigned, the next thing a broker wants is
            often to message the same deals. */ ''}
      ${v.note ? `<span class="kb-bb__note t-body-md">${icon('check-circle', 15)} ${v.note}</span>` : ''}

      ${v.bulk ? `
        <div class="kb-pop" data-kb-pop>
          ${kbBulkForm(v)}
          <div class="kb-pop__foot">
            <span class="kb-pop__cancel t-body-sm" data-kb-bulkclose>Cancel</span>
            <span class="kb-pop__save ${kbBulkReady(v) ? '' : 'is-off'}" data-kb-bulksave>Save</span>
          </div>
        </div>` : ''}
    </div>`;
}

/* ---------- Shell ---------------------------------------------------------- */

const kbBoardInner = (mode, v) => {
  const pool = kbDeals(v);
  const card = (d, i) => kbCard(d, i, mode, v);
  return KB_STAGES.map(s => kbColumn(s, card, mode, pool, v)).join('');
};

/* The board is the same in both versions. The mode decides two things: the
   card, and with it the column heading, and where a card's quick actions
   open — the sidebar in v1, a floating card in v2. Everything in the
   toolbar is shared. */
function renderKanban(mode, v) {
  return `
  <div class="kb">
    ${navBar()}

    ${kbBarV1(v)}

    <div class="kb-board">${kbBoardInner(mode, v)}</div>

    <aside class="kbf" id="kbfilter"></aside>
    <div id="kbbulk"></div>

    ${mode === 'text'
      ? '<div class="pop" id="rowpop"></div>'
      : '<aside class="dp" id="kbpanel"></aside>'}

    <aside class="kbnl" id="kbnew"></aside>
  </div>`;
}

/* One entry per version of this screen, the way the work list and screen 2
   do it: the page sets `window.KB_VARIANT` and the prototype view points at
   the page. A third version goes here as another skin over the same card. */
const KB_MODES = { v1: 'cues', v2: 'text' };

/* A card's Note and Task pills: the full-height sidebar in v1, the work
   list's floating cards in v2. Both bind to the triggers they find, so both
   are remounted whenever the board is repainted. */
const mountCardActions = (app, mode) =>
  mode === 'text' ? mountPopups(app) : mountKanbanPanel(app);

/* Wires the bar to the board. The board is repainted rather than patched —
   a view, a filter, a sort and a selection all change which cards exist, so
   there is one path rather than four. */
function mountKanbanBar(app, mode) {
  const v = kbDefaultView();
  let noteTimer = null;
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
    mountCardActions(app, mode);
    wireBoard();
  };
  const paintFilters = () => { if (fp.classList.contains('is-open')) fp.innerHTML = kbFilterPanel(v, kbDeals(v).length); };
  const paintBulk = () => { bulk.innerHTML = kbBulkBanner(v); wireBulk(); };
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

  /* Redraws the banner alone, keeping focus and the caret — the same reason
     the filter panel has its own repaint. */
  function repaintBulk() {
    const el = document.activeElement;
    const id = el && el.id;
    const at = el && el.selectionStart;
    paintBulk();
    if (!id) return;
    const back = bulk.querySelector('#' + id);
    if (!back) return;
    back.focus();
    if (at != null && back.setSelectionRange) { try { back.setSelectionRange(at, at); } catch (e) {} }
  }

  function wireBulk() {
    const x = bulk.querySelector('[data-kb-bulkexit]');
    if (x) x.addEventListener('click', (e) => {
      e.stopPropagation();
      v.selected.clear(); v.bulk = null; v.note = ''; kbResetPending(v);
      paintBoard(); paintBulk();
    });

    bulk.querySelectorAll('[data-kb-bulkopen]').forEach(b => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const k = b.dataset.kbBulkopen;
      v.bulk = v.bulk === k ? null : k;
      kbResetPending(v);
      paintBulk();
    }));

    const close = bulk.querySelector('[data-kb-bulkclose]');
    if (close) close.addEventListener('click', (e) => {
      e.stopPropagation();
      v.bulk = null; kbResetPending(v); paintBulk();
    });

    /* Typing inside a form only redraws the form. */
    bulk.querySelectorAll('[data-kb-bulkq]').forEach(inp => inp.addEventListener('input', () => {
      v.pending[inp.dataset.kbBulkq] = inp.value;
      repaintBulk();
    }));

    bulk.querySelectorAll('[data-kb-bulkpick]').forEach(opt => opt.addEventListener('click', (e) => {
      e.stopPropagation();
      v.pending[opt.dataset.kbBulkpick] = opt.dataset.val;
      paintBulk();
    }));

    /* Removing the chosen person puts the search field back. */
    bulk.querySelectorAll('.kbf__tag').forEach(tag => tag.addEventListener('click', (e) => {
      if (!e.target.closest('.chip-person__x')) return;
      e.stopPropagation();
      if (v.bulk === 'broker') { v.pending.broker = null; v.pending.brokerQuery = ''; }
      else { v.pending.taskWho = null; v.pending.taskWhoQuery = ''; }
      paintBulk();
    }));

    const save = bulk.querySelector('[data-kb-bulksave]');
    if (save) save.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!kbBulkReady(v)) return;
      v.note = kbBulkNote(v);
      v.bulk = null; kbResetPending(v);
      paintBulk();
      /* The line clears itself, so the banner goes back to being the
         actions rather than a receipt nobody dismissed. */
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => { v.note = ''; paintBulk(); }, 4000);
    });

    /* The form hangs under the chip that opened it, pulled back inside the
       screen if that would push it off the right edge. */
    const pop = bulk.querySelector('[data-kb-pop]');
    const chip = bulk.querySelector('.kb-bb__act.is-on');
    if (pop && chip) {
      const edge = app.querySelector('.kb').getBoundingClientRect();
      const at = chip.getBoundingClientRect();
      const left = Math.min(at.left - edge.left, edge.width - pop.offsetWidth - 20);
      pop.style.left = `${Math.max(20, left)}px`;
    }

    bulk.addEventListener('click', (e) => e.stopPropagation());
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
      kbApplySaved(v, Number(el.dataset.kbSaved));
      v.selected.clear();
      closeMenus(); paintAll();
    }));

    app.querySelectorAll('[data-kb-editsaved]').forEach(el => el.addEventListener('click', (e) => {
      e.stopPropagation();
      v.editSaved = el.dataset.kbEditsaved === 'on';
      paintBar();
      /* The menu is rebuilt with the bar, so put it back on screen. */
      const menu = app.querySelector('[data-kb-menufor="views"]');
      if (menu) menu.classList.add('is-open');
    }));

    /* Renaming is live: there is no second step to forget to press. */
    app.querySelectorAll('[data-kb-rename]').forEach(inp => inp.addEventListener('input', () => {
      KB_SAVED[Number(inp.dataset.kbRename)].label = inp.value;
    }));

    app.querySelectorAll('[data-kb-adjust]').forEach(el => el.addEventListener('click', (e) => {
      e.stopPropagation();
      /* Adjusting is applying it and then showing the broker what it is
         made of, so the filter panel opens on its saved elements. */
      kbApplySaved(v, Number(el.dataset.kbAdjust));
      v.editSaved = false;
      closeMenus();
      paintAll();
      fp.classList.add('is-open');
      fp.innerHTML = kbFilterPanel(v, kbDeals(v).length);
      wireFilters();
    }));

    app.querySelectorAll('[data-kb-delsaved]').forEach(el => el.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = Number(el.dataset.kbDelsaved);
      KB_SAVED.splice(i, 1);
      if (v.saved === i) v.saved = null;
      else if (v.saved !== null && v.saved > i) v.saved -= 1;
      if (!KB_SAVED.length) v.editSaved = false;
      paintBar();
      const menu = app.querySelector('[data-kb-menufor="views"]');
      if (menu) menu.classList.add('is-open');
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
      if (!v.select) { v.selected.clear(); v.bulk = null; v.note = ''; kbResetPending(v); }
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
      Object.keys(v.query).forEach(k => { v.query[k] = ''; });
      v.min = 0; v.max = 700000; v.from = ''; v.to = '';
      refilter();
    });

    /* Typing narrows the suggestions but changes no filter, so only the
       panel is redrawn — the board stays as it is until a name is picked. */
    fp.querySelectorAll('[data-kb-search]').forEach(inp => inp.addEventListener('input', () => {
      v.query[inp.dataset.kbSearch] = inp.value;
      repaintPanel();
    }));

    fp.querySelectorAll('[data-kb-addtag]').forEach(opt => opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const k = opt.dataset.kbAddtag;
      if (!v.picked[k].includes(opt.dataset.val)) v.picked[k].push(opt.dataset.val);
      v.query[k] = '';
      refilter();
      const back = fp.querySelector(`#kbf-${k}`);
      if (back) back.focus();
    }));

    /* The cross on a tag is what removes it, so the rest of the tag can stay
       inert rather than being a button that deletes on any click. */
    fp.querySelectorAll('[data-kb-group]').forEach(g => g.addEventListener('click', (e) => {
      const x = e.target.closest('.chip-person__x');
      if (!x) return;
      e.stopPropagation();
      const tag = x.closest('.kbf__tag');
      const k = g.dataset.kbGroup;
      v.picked[k] = v.picked[k].filter(n => n !== tag.dataset.val);
      refilter();
    }));

    fp.querySelectorAll('[data-kb-pickfilter]').forEach(opt => opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const k = opt.dataset.kbPickfilter, val = opt.dataset.val;
      const at = v.picked[k].indexOf(val);
      at === -1 ? v.picked[k].push(val) : v.picked[k].splice(at, 1);
      refilter();
    }));

    /* Dragging must not redraw the panel: replacing the input mid-drag
       drops the pointer and the handle stops following. So the slider and
       its readout are updated in place, and only the board behind changes.
       The panel catches up on release. */
    const slider = fp.querySelector('.kbf__slider');
    const retouch = () => {
      if (slider) {
        slider.style.setProperty('--lo', `${(v.min / 700000) * 100}%`);
        slider.style.setProperty('--hi', `${(v.max / 700000) * 100}%`);
      }
      const read = fp.querySelector('.kbf__range');
      if (read) read.innerHTML = `${money(v.min)} &ndash; ${money(v.max)}${v.max >= 700000 ? '+' : ''}`;
      const count = fp.querySelector('.kbf__count');
      if (count) count.textContent = `Showing ${kbDeals(v).length} of ${DEALS.length} deals`;
    };

    fp.querySelectorAll('[data-kb-amount]').forEach(r => {
      r.addEventListener('input', () => {
        const which = r.dataset.kbAmount;
        v[which] = Number(r.value);
        /* Keep the pair the right way round rather than letting them cross. */
        if (v.min > v.max) {
          if (which === 'min') v.max = v.min; else v.min = v.max;
          const other = fp.querySelector(`[data-kb-amount="${which === 'min' ? 'max' : 'min'}"]`);
          if (other) other.value = which === 'min' ? v.max : v.min;
        }
        v.saved = null;
        retouch();
        paintBar(); paintBoard(); paintBulk();
      });
      r.addEventListener('change', () => repaintPanel());
    });

    fp.querySelectorAll('[data-kb-date]').forEach(inp => inp.addEventListener('change', () => {
      v[inp.dataset.kbDate] = inp.value;
      refilter();
    }));

    const name = fp.querySelector('[data-kb-savename]');
    if (name) name.addEventListener('input', () => { v.saveName = name.value; repaintPanel(); });

    const save = fp.querySelector('[data-kb-saveview]');
    if (save) save.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!v.saveName.trim() || !kbFilterCount(v)) return;
      KB_SAVED.push({ label: v.saveName.trim(), filters: kbSnapshot(v) });
      v.saved = KB_SAVED.length - 1;
      v.saveName = '';
      paintBar(); repaintPanel();
    });
  }

  /* Redraws the panel alone, keeping focus and the caret where they were —
     which is what makes typing into a person field feel like one field
     rather than a field that keeps being replaced. */
  function repaintPanel() {
    const el = document.activeElement;
    const id = el && el.id;
    const at = el && el.selectionStart;
    fp.innerHTML = kbFilterPanel(v, kbDeals(v).length);
    wireFilters();
    if (!id) return;
    const back = fp.querySelector('#' + id);
    if (!back) return;
    back.focus();
    if (at != null && back.setSelectionRange) { try { back.setSelectionRange(at, at); } catch (e) {} }
  }

  /* A filter change repaints everything the filter touches: the board, the
     bar's badge, the bulk count, and the panel's own counts and ticks. */
  function refilter() {
    /* Changing a filter by hand means this is no longer the saved view it
       was loaded from, so the dropdown stops claiming to be it. */
    v.saved = null;
    paintBar(); paintBoard(); paintBulk();
    repaintPanel();
  }

  app.addEventListener('click', () => { closeMenus(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeMenus();
    fp.classList.remove('is-open');
  });

  wireBar(); wireBoard(); paintBulk();
}

/* ---------- + New lead -----------------------------------------------------
   The panel behind the toolbar's "+ New lead", from the Figma frame of the
   same name. It is the second full-height sidebar on this screen, so it
   borrows the filter panel's geometry rather than inventing a third one:
   anchored right, rounded on the leading edge, sliding in off the board.

   Only "Main details" is drawn. The other two tabs are marked optional in
   the design and have no fields behind them yet, so they say so rather than
   showing an empty form.
   -------------------------------------------------------------------------- */

const KB_NL_TABS = [
  ['main', 'Main details', ''],
  ['enquiry', 'Enquiry details', '(optional)'],
  ['lead', 'Lead details', '(optional)']
];

/* A labelled field. `small` is the 12px label the assignment fields carry —
   those already name a person, so they sit quieter than the ones still
   waiting to be typed into. */
const kbNlField = (label, body, small) => `
  <div class="kbnl__f">
    <span class="kbnl__lab ${small ? 'kbnl__lab--sm' : ''}">${label}</span>
    ${body}
  </div>`;

const kbNlText = (ph) => `<span class="kbnl__in"><input class="kbnl__input" placeholder="${ph}"></span>`;
const kbNlPerson = (who) => `<div class="kbnl__in kbnl__in--chip">${personChip(who)}</div>`;

const kbNlMain = () => `
  ${kbNlField('Mobile no.', `
    <span class="kbnl__in">
      <span class="kbnl__cc">+61 ${icon('chevron-down', 10)}</span>
      <span class="kbnl__rule"></span>
      <input class="kbnl__input" placeholder="e.g. 04123 456 789">
    </span>`)}
  ${kbNlField('Email address', kbNlText('e.g. johnsmith@gmail.com'))}
  <div class="kbnl__pair">
    ${kbNlField('First name', kbNlText('e.g. John'))}
    ${kbNlField('Last name', kbNlText('e.g. Smith'))}
  </div>
  ${kbNlField('Applicant type', `
    <div class="kbnl__seg">
      <span class="kbnl__segbtn is-on" data-kb-nlseg>Person</span>
      <span class="kbnl__segbtn" data-kb-nlseg>Business</span>
    </div>`)}
  <div class="kbnl__pair">
    ${kbNlField('Assign broker', kbNlPerson(['JK', 'Jesse K.']), true)}
    ${kbNlField('Assign partner', kbNlPerson(['CE', 'Cielo E.']), true)}
  </div>
  <div class="kbnl__pair">
    ${kbNlField('Referral source (optional)', kbNlPerson(['JK', 'Jesse K.']), true)}
    ${kbNlField('Referring person (optional)', kbNlPerson(['CE', 'Cielo E.']), true)}
  </div>`;

const kbNlCheck = (label) => `
  <span class="kbnl__check" data-kb-nlcheck>
    <span class="kb-box">${icon('check-sm', 10)}</span>
    <span class="t-body-sm">${label}</span>
  </span>`;

function kbNewLeadPanel(tab) {
  const t = ([id, label, opt]) => `
    <span class="kbnl__tab ${tab === id ? 'is-on' : ''}" data-kb-nltab="${id}">
      <span class="kbnl__tab-l">${label}</span>
      ${opt ? `<span class="kbnl__tab-o">${opt}</span>` : ''}
    </span>`;
  return `
    <div class="kbnl__head">
      <span class="kbnl__title">New lead</span>
      <span class="kbnl__x" data-kb-nlclose>${icon('close', 12)}</span>
    </div>
    <div class="kbnl__tabs">${KB_NL_TABS.map(t).join('')}</div>
    <div class="kbnl__body">
      ${tab === 'main' ? kbNlMain() : `
        <p class="kbnl__soon t-body-sm">
          These details are optional, and the form behind this tab has not been drawn yet.
        </p>`}
    </div>
    <div class="kbnl__foot">
      <div class="kbnl__checks">
        ${kbNlCheck('Don&rsquo;t send welcome SMS &amp; Email')}
        ${kbNlCheck('Send broker notifications')}
      </div>
      <span class="kbnl__add">Add now</span>
    </div>`;
}

/* Delegated from the screen rather than bound to the button: v1 repaints its
   toolbar whenever a view, filter or sort changes, which would take any
   handler on "+ New lead" with it. */
function mountKbNewLead(app) {
  const panel = app.querySelector('#kbnew');
  if (!panel) return;
  let tab = 'main';
  const paint = () => { panel.innerHTML = kbNewLeadPanel(tab); };
  const close = () => panel.classList.remove('is-open');

  app.addEventListener('click', (e) => {
    if (e.target.closest('.kb-new')) {
      tab = 'main';
      paint();
      panel.classList.add('is-open');
      return;
    }
    if (!e.target.closest('#kbnew')) { close(); return; }

    const tb = e.target.closest('[data-kb-nltab]');
    if (tb) { tab = tb.dataset.kbNltab; paint(); return; }
    if (e.target.closest('[data-kb-nlclose]')) { close(); return; }

    const seg = e.target.closest('[data-kb-nlseg]');
    if (seg) {
      seg.parentElement.querySelectorAll('[data-kb-nlseg]').forEach(s => s.classList.remove('is-on'));
      seg.classList.add('is-on');
      return;
    }
    const chk = e.target.closest('[data-kb-nlcheck]');
    if (chk) { chk.classList.toggle('is-on'); return; }

    const x = e.target.closest('.chip-person__x');
    if (x) x.closest('.kbnl__in').innerHTML = personChip(null);
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  const mode = KB_MODES[window.KB_VARIANT || 'v1'];
  if (!app || !mode) return;

  const v = kbDefaultView();
  app.innerHTML = renderKanban(mode, v);
  mountCardActions(app, mode);
  mountKanbanBar(app, mode);
  mountKbNewLead(app);
});
