/* ==========================================================================
   Application view — everything the screen is built from.
   --------------------------------------------------------------------------
   The deal state, the submission gates, the one task list, the form and its
   sections, the panel bodies, the two full views and every header atom.
   What is NOT here is the screen's *shape* — how the window divides into
   columns and where the task strip sits — which is js/appview-view.js and
   css/appview-layout.css.

   The names are `AP_` / `ap…`. The view supplies `AP.render`, which is what
   `apPaint()` calls. Each page may load one skin stylesheet after the
   layout; a skin changes nothing in this file, which is the point of it.
   ========================================================================== */

/* ---------- The stage spine ------------------------------------------------
   The board's master stages, plus the terminal one it has no column for, so
   a deal's colour here is the colour it had on the kanban.
   -------------------------------------------------------------------------- */

const AP_STAGES = [
  ...MASTER_STAGES.filter(s => !s.custom).map(s =>
    ({ id: s.id, label: s.label, colour: s.colour, tint: s.tint, ink: s.ink })),
  { id: 'settled', label: 'Settled', colour: 'var(--neutral-600)',
    tint: 'var(--neutral-200)', ink: 'var(--neutral-800)', locks: true }
];

const apStage   = (id) => AP_STAGES.find(s => s.id === id) || AP_STAGES[0];
const apStageIx = () => AP_STAGES.findIndex(s => s.id === AP.stage);
const apLocked  = () => apStage(AP.stage).locks;

/* How far through the pipeline the deal is. The stage itself is a step, so
   a deal in the first of six is one-sixth of the way, not nowhere. */
const apProgress = () => Math.round(((apStageIx() + 1) / AP_STAGES.length) * 100);

/* ---------- Facts the model does not carry yet ----------------------------- */

const AP_MOCK = {
  visaExpiry: '14/04/26',
  visaHolder: 'Maria Josephin',
  followUp:   '27 Jan, 10:00am',
  settledOn:  '18/03/26'
};

/* The mock detail under the header — applicants, the company, notes,
   signatures, activity — was written about one client, Maria Josephin of
   Josephin Haulage, referred by Acme Autos. Opened from the board, the
   screen can be showing anyone, and her name under somebody else's header
   reads as broken rather than as sample data. So every mock string passes
   through here on its way to the page and takes the open deal's people:
   its client's first and last name and its current partner.

   For Maria's own deal every substitution maps a name to itself, so the
   standalone pages render exactly as they did. The order matters: the
   longer forms go first so "Maria Josephin" is not half-replaced as
   "Maria" and "Josephin" separately. */
function apName(str, d = AP && AP.deal) {
  if (!str || !d) return str;
  const parts = d.name.split(' ');
  const first = parts[0];
  const last = parts.slice(1).join(' ') || first;
  const partner = (AP && AP.deal === d ? AP.partner : d.partner);
  const pname = partner ? partner[1] : null;
  return String(str)
    .replace(/Maria Josephin/g, d.name)
    .replace(/Maria J\./g, `${first} ${last[0]}.`)
    .replace(/M\. Josephin/g, `${first[0]}. ${last}`)
    .replace(/maria@/g, `${first.toLowerCase()}@`)
    .replace(/Maria/g, first)
    .replace(/Josephin/g, last)
    .replace(/^Acme Autos/g, pname || 'The partner')
    .replace(/Acme Autos/g, pname || 'the partner');
}

/* Who a deal can be handed to. Three avatars in a row said nothing about
   what any of them was for, so each slot now carries its role as a label
   and opens a list of the people who could hold it. The rosters are the
   names the board already uses — `assigned`, `associate` and `partner`
   across DEALS — so reassigning here reassigns to someone who exists. */
const apRoster = (key) => {
  const seen = new Map();
  DEALS.forEach(d => { const p = d[key]; if (p) seen.set(p[1], p); });
  return [...seen.values()];
};

const AP_ROLES = {
  broker:    { label: 'Broker',    glyph: 'user-plus', list: () => apRoster('assigned'),
               hint: 'Owns the deal', none: null },
  associate: { label: 'Associate', glyph: 'assist',    list: () => apRoster('associate'),
               hint: 'Works it with the broker', none: 'No associate' },
  partner:   { label: 'Partner',   glyph: 'building',  list: () => apRoster('partner'),
               hint: 'Where the deal came from', none: 'Direct — no partner' }
};

const AP_FOLLOWUPS = [
  'Today, 4:00pm', 'Tomorrow, 9:00am', '27 Jan, 10:00am', '30 Jan, 2:00pm', 'Next Monday, 8:30am'
];

const AP_QUICK = [
  { glyph: 'article',       label: 'Send privacy form' },
  { glyph: 'paperclip',     label: 'Request documents' },
  { glyph: 'bolt',          label: 'Run credit check' },
  { glyph: 'save',          label: 'Generate documents' },
  { glyph: 'note',          label: 'Add note' },
  { glyph: 'check-circle',  label: 'Add task' },
  { glyph: 'arrow-forward', label: 'Change stage', rule: true }
];

/* ==========================================================================
   State
   --------------------------------------------------------------------------
   Documents and signatures live in state rather than being read off the
   deal each time, because on this version they actually change: accepting
   a document in the panel moves it, and moving it is what eventually lets
   the application be submitted.
   ========================================================================== */

let AP = null;

function apFresh(d) {
  return {
    deal: d,
    render: null,                /* the shell's own renderer, set at mount */
    root: null,

    segment: d.segment,
    stage:   d.master,
    entity:  'company',

    /* The three roles and the date are state because they can be changed
       from the header, which was the other half of the ask. */
    broker:    d.assigned,
    associate: d.associate,
    partner:   d.partner,
    followUp:  AP_MOCK.followUp,

    docs:    [...d.docs],        /* live, not the deal's own array */
    signed:  new Set(AP_SIGNED.map((s, i) => s.state === 'signed' ? i : -1).filter(i => i >= 0)),
    done:    new Set(),          /* next-actions the broker has ticked off */
    submitted: false,

    applicants: [
      { id: 1, first: apName('Maria', d), last: apName('Josephin', d), dob: '15/03/1985', phone: '0412 345 678',
        email: apName('maria@email.com', d), residency: 'Visa — subclass 482', primary: true },
      { id: 2, first: 'David', last: apName('Josephin', d), dob: '02/11/1983', phone: '0431 998 220',
        email: 'david@email.com', residency: 'Citizen', primary: false }
    ],
    directors: [
      { id: 1, name: apName('Maria Josephin', d), pct: '60', appointed: '04/2019', guarantor: true, primary: true },
      { id: 2, name: apName('David Josephin', d), pct: '40', appointed: '04/2019', guarantor: true, primary: false }
    ],
    beneficiaries: [
      { id: 1, name: apName('Maria Josephin', d),    kind: 'Primary' },
      { id: 2, name: apName('David Josephin', d),    kind: 'Primary' },
      { id: 3, name: apName('Josephin Children', d), kind: 'General class' }
    ],
    seq: 10,

    optional: { employment: false, expenses: false },

    view:    'form',             /* 'form' | 'activity' | 'documents' */
    section: 'loan',
    scroll:  0,

    checked: new Set(),          /* checklist items ticked by hand */
    checkTab: 'compliance',
    noteFilter: 'internal',
    removed: new Set(),          /* tasks deleted from the work card */
    rowMenu: null,               /* which task row has its options open */

    closed:  new Set(),          /* folded panel sections */
    touched: false,
    bands:   new Set(),          /* folded bands inside the next-actions card */
    nextShut: false,             /* the whole work card folded to its one line */
    nextTouched: false,          /* the broker folded it by hand; stop driving it */

    menu:    null,               /* quick | stage | segment | submit | who-* | followup */
    saved:   'clean',
    savedAt: 'All changes saved'
  };
}

const apDocCounts = () =>
  AP.docs.reduce((a, s) => (a[s]++, a), { ok: 0, review: 0, rejected: 0, pending: 0 });

/* ==========================================================================
   Submission — the gates, and what is standing in the way
   --------------------------------------------------------------------------
   The brief asked for a way to submit once the application is complete,
   which means the screen has to be able to say what "complete" is and what
   is missing. Each gate is answered by something the broker can actually do
   on this screen, so the button can genuinely come alive: tick the blocking
   actions, accept the documents, chase the signatures.
   ========================================================================== */

const AP_GATES = [
  { id: 'contact', label: 'Client contacted',         hint: 'Log the first call' },
  { id: 'privacy', label: 'Privacy form sent',        hint: 'Quick actions → Send privacy form' },
  { id: 'docs',    label: 'Documents approved',       hint: 'Accept each one in Documents' },
  { id: 'sigs',    label: 'Signatures received',      hint: 'Chase what is outstanding' },
  { id: 'fields',  label: 'Required fields complete', hint: 'Every field marked * has a value' }
];

function apReadiness() {
  const c = apDocCounts();
  return AP_GATES.map(g => {
    let ok = false, detail = '';
    if (g.id === 'contact') {
      ok = AP.done.has('call');
      detail = ok ? 'Call logged today' : 'Nothing logged since the enquiry arrived';
    } else if (g.id === 'privacy') {
      ok = AP.done.has('privacy');
      detail = ok ? 'Sent and acknowledged' : 'Not sent';
    } else if (g.id === 'docs') {
      ok = c.ok === AP.docs.length;
      detail = `${c.ok} of ${AP.docs.length} approved`;
    } else if (g.id === 'sigs') {
      ok = AP.signed.size === AP_SIGNED.length;
      detail = `${AP.signed.size} of ${AP_SIGNED.length} received`;
    } else {
      ok = true;
      detail = 'All required fields have a value';
    }
    return { ...g, ok, detail };
  });
}

const apReady    = () => apReadiness().every(g => g.ok);
const apBlockers = () => apReadiness().filter(g => !g.ok).length;

/* The button and the panel behind it. Disabled would hide the reason, so it
   stays pressable and answers with what is missing. */
function apSubmitBtn() {
  const ready = apReady();
  const n = apBlockers();
  if (AP.submitted) {
    return `<span class="ap-submit is-sent">${icon('check-circle', 15)} Submitted</span>`;
  }
  return `
    <div class="ap-submitwrap">
      <button class="ap-submit ${ready ? 'is-ready' : 'is-blocked'}" data-ap-menu="submit">
        ${icon(ready ? 'send' : 'lock', 15)}
        ${ready ? 'Submit application' : `Submit — ${n} to go`}
      </button>
      <div class="ap-ready ${AP.menu === 'submit' ? 'is-open' : ''}">
        <div class="ap-ready__head">
          <span class="t-label-md">${ready ? 'Ready to submit' : `${n} thing${n > 1 ? 's' : ''} still to do`}</span>
          <span class="t-caption">Everything below has to pass before this goes to the lender.</span>
        </div>
        ${apReadiness().map(g => `
          <div class="ap-gate ${g.ok ? 'is-ok' : ''}">
            <span class="ap-gate__icon">${icon(g.ok ? 'check-circle' : 'x-circle', 15)}</span>
            <span class="ap-gate__body">
              <span class="ap-gate__label">${g.label}</span>
              <span class="ap-gate__detail t-caption">${g.ok ? g.detail : g.hint}</span>
            </span>
            <span class="ap-gate__state t-caption">${g.detail}</span>
          </div>`).join('')}
        <button class="ap-btn ${ready ? 'ap-btn--brand' : ''} ap-btn--wide"
                ${ready ? 'data-ap-submit' : 'disabled'}>
          ${ready ? 'Submit to the lender' : 'Not ready yet'}
        </button>
      </div>
    </div>`;
}

/* ==========================================================================
   What to do next at this stage
   --------------------------------------------------------------------------
   The one piece the feedback asked for most. It is not a list of three
   sentences any more: the work is banded by what it is doing to the deal —
   **blocking** submission, **due now**, or **when you can** — each band has
   its own colour, count and fold, and every item carries the control that
   does the thing rather than making the broker go and find it.
   ========================================================================== */

/* Three bands, read as dates rather than as process words: what is late,
   what is about to be, and the broker's own running list. `mine` is the
   one that grows, so it is the one that scrolls. */
const AP_BANDS = [
  { id: 'overdue', label: 'Overdue',    short: 'overdue',  tone: 'error' },
  { id: 'due',     label: 'Due soon',   short: 'due soon', tone: 'warn'  },
  { id: 'mine',    label: 'Your tasks', short: 'yours',    tone: 'calm'  }
];

const AP_NEXT = {
  qualifying: [
    { id: 'call',    band: 'overdue', label: 'Call and qualify the enquiry',
      why: 'Nothing logged since the enquiry arrived on 15/01', due: '1 day overdue', days: -1,
      act: ['phone', 'Call now'] },
    { id: 'privacy', band: 'due', label: 'Send the privacy form',
      why: 'The credit check cannot run until this is signed', due: 'Today', days: 0,
      act: ['send', 'Send'] },
    { id: 'quote',   band: 'due', label: 'Confirm the asset and amount',
      why: 'The quote from Acme Autos expires 09/02/26', due: 'In 2 days', days: 2,
      act: ['article', 'Open quote'] },
    { id: 'credit',  band: 'mine', label: 'Run the credit check',
      why: 'Once the privacy form comes back signed', due: '6 Feb', days: 9,
      act: ['bolt', 'Run'] }
  ],
  discovery: [
    { id: 'chase',   band: 'overdue', label: 'Chase the outstanding documents',
      why: 'Three never supplied, the oldest requested 6 days ago', due: '2 days overdue', days: -2,
      act: ['send', 'Chase'] },
    { id: 'review',  band: 'due', label: 'Review the payslips that came back',
      why: 'Sitting unchecked since 20/01', due: 'Today', days: 0,
      act: ['eye', 'Review'] },
    { id: 'credit',  band: 'due', label: 'Run the credit check',
      why: 'The privacy form is signed', due: 'In 2 days', days: 2, act: ['bolt', 'Run'] },
    { id: 'notes',   band: 'mine', label: 'Write the file note for the lender',
      why: 'Useful before submission, not required yet', due: '9 Feb', days: 12, act: ['note', 'Write'] }
  ],
  progress: [
    { id: 'conds',   band: 'due', label: 'Answer the lender\u2019s conditions',
      why: 'Two conditions outstanding on the approval', due: 'In 2 days', days: 2,
      act: ['send', 'Respond'] },
    { id: 'quote2',  band: 'due', label: 'Confirm the quote is still current',
      why: 'Expires 09/02/26', due: 'This week', days: 5, act: ['article', 'Open'] },
    { id: 'client',  band: 'mine', label: 'Update the client on where it is',
      why: 'Last spoken to on 22/01', due: '12 Feb', days: 15, act: ['phone', 'Call'] }
  ],
  approval: [
    { id: 'docs',    band: 'due', label: 'Send the loan documents to sign',
      why: 'Approval lapses if nothing is signed within 21 days', due: 'Today', days: 0,
      act: ['signature', 'Send'] },
    { id: 'ins',     band: 'due', label: 'Confirm insurance is in place',
      why: 'The lender will not settle without a certificate', due: 'This week', days: 5,
      act: ['upload', 'Upload'] },
    { id: 'book',    band: 'mine', label: 'Book the settlement date',
      why: 'Once the documents come back', due: '16 Feb', days: 19, act: ['calendar-clock', 'Book'] }
  ],
  settlement: [
    { id: 'figs',    band: 'overdue', label: 'Confirm the settlement figures',
      why: 'The lender needed them signed off yesterday', due: '1 day overdue', days: -1,
      act: ['check-circle', 'Confirm'] },
    { id: 'inv',     band: 'due', label: 'Check the invoice matches the quote',
      why: '$250,000 against a quote of $248,400', due: 'Today', days: 0, act: ['eye', 'Compare'] },
    { id: 'pack',    band: 'mine', label: 'Send the client the settlement pack',
      why: 'After the funds move', due: '20 Feb', days: 23, act: ['send', 'Send'] }
  ],
  settled: [
    { id: 'none',    band: 'mine', label: 'Nothing outstanding — it is settled',
      why: `Settled ${AP_MOCK.settledOn}. The record is locked.`, due: '', days: 99, act: null }
  ]
};

/* The broker's own list for this deal. It is deliberately longer than the
   stage's own steps, because *Your tasks* is the band that grows and the
   screen has to cope with that without taking more room — which is what
   the band's own scroll is for. None of these repeats a stage action. */
const AP_MY_TASKS = [
  { id: 'mt-0', label: 'Send the lender the updated payslips',      due: '3 days overdue', days: -3 },
  { id: 'mt-1', label: 'Chase the accountant for the BAS',          due: 'In 3 days',  days: 3  },
  { id: 'mt-2', label: 'Send the client the comparison rate sheet', due: 'This week',  days: 5  },
  { id: 'mt-3', label: 'Book the settlement call with Maria',       due: '9 Feb',      days: 12 },
  { id: 'mt-4', label: 'Update Acme Autos on progress',             due: '10 Feb',     days: 13 },
  { id: 'mt-5', label: 'File the signed credit guide',              due: '11 Feb',     days: 14 },
  { id: 'mt-6', label: 'Review the servicing calculator output',    due: '12 Feb',     days: 15 }
];

const apNextItems = () => AP_NEXT[AP.stage] || AP_NEXT.qualifying;

/* ==========================================================================
   One list of work, not three
   --------------------------------------------------------------------------
   The banner *Not yet contacted*, the blocking action *Call and qualify the
   enquiry* and the task *Call client - 1 day overdue* were the same job
   written three times in three places, and the broker had to work that out
   before the screen made any sense.

   So the strip of banners now keeps only what is a **state of the record**
   rather than a job: a possible duplicate, an expiring visa, a settled
   lock. The warning that *was* a job becomes a flag on the action that does
   it, and brings that task's date and face onto the same row. The deal's
   own tasks live in these bands too, and the only ones to get a row of
   their own are the ones no stage action already covers.
   ========================================================================== */

function apWork() {
  const d = AP.deal;
  const items = apNextItems().map(i => ({ ...i }));
  if (apLocked()) return items;

  const b = AP.broker, mate = AP.associate || AP.broker;
  const days = (n) => `${n} day${n > 1 ? 's' : ''}`;

  /* The board's own immediate rule, landing on the action that answers it.
     The overdue task said this as well, so its date and its face come
     here rather than onto a second row that reads the same. */
  const call = items.find(i => i.id === 'call');
  if (call && d.urgency === 'high' && !d.snoozed) {
    call.flag = 'Not yet contacted';
    call.who  = b[0];
    if (d.tasksOverdue > 0) { call.due = `${days(d.tasksOverdue)} overdue`; call.days = -d.tasksOverdue; }
  }
  const quote = items.find(i => i.id === 'quote');
  if (quote) quote.who = mate[0];
  items.forEach(i => { i.label = apName(i.label); i.why = apName(i.why); });

  /* What the stage's own list does not already cover: the broker's own
     tasks on this deal, which all land in *Your tasks*. */
  if (d.tasksDue > 0) items.push({
    id: 'task-handover', band: 'mine', task: true, who: mate[0],
    label: `Hand the file to ${mate[1]}`,
    why: `Raised by ${b[1]} — this deal only`,
    due: `In ${days(d.tasksDue)}`, days: d.tasksDue, act: null
  });
  AP_MY_TASKS.forEach(t => items.push({
    ...t, label: apName(t.label), band: 'mine', task: true, who: b[0],
    why: `Raised by ${b[1]} — this deal only`, act: null
  }));

  /* Late is late, whoever raised it: anything past its date is in the
     first band, so *Overdue* means what it says and *Your tasks* is the
     running list rather than a second place to hide a missed one.

     Then soonest first inside each band. The point of the bands is
     urgency, so the order inside them has to be urgency too — otherwise
     the row three days late sits under one due next month. */
  return items
    .filter(i => !AP.removed.has(i.id))
    .map(i => (i.days < 0 ? { ...i, band: 'overdue' } : i))
    .sort((x, y) => (x.days ?? 99) - (y.days ?? 99));
}

const apNextOpen = () => apWork().filter(i => !AP.done.has(i.id));

/* `layout` is 'stack' for a narrow column and 'wide' for the three bands
   side by side, which is how v4 uses the room across the workspace. */
/* Tasks to action
   --------------------------------------------------------------------------
   The deal's whole task list, not the stage's: it is set in neutral and
   carries no stage name, because a task does not stop being a task when
   the deal moves on. Three bands by date — late, soon, and the broker's
   own running list — and inside each, soonest first, because the point of
   the bands is urgency and an order that ignores urgency undoes them.

   Every row is the same shape: the tick, the task, and its options at the
   top right where they always are; the date and whose it is on the line
   under it. There is no action button — these are tasks, and a task is
   something you tick.

   The card is short on purpose, folds to its one line by hand, and folds
   itself as soon as the broker scrolls into the form.
   ========================================================================== */
function apNextCard(layout = 'stack') {
  const all = apWork();
  const open = all.filter(i => !AP.done.has(i.id));
  const shut = AP.nextShut;

  const row = (i, tone) => {
    const done = AP.done.has(i.id);
    const menu = AP.rowMenu === i.id;
    const meta = [
      i.flag ? `<span class="ap-flag">${icon('alarm', 11)}${i.flag}</span>` : '',
      i.due  ? `<span class="ap-due is-${tone}">${icon('calendar-clock', 11)}${i.due}</span>` : '',
      i.who  ? `<span class="ap-ava ap-ava--xs" title="Assigned to ${i.who}">${i.who}</span>` : ''
    ].join('');

    return `
      <article class="ap-todo ${done ? 'is-done' : ''} ${i.task ? 'is-task' : ''}" title="${i.why}">
        <span class="ap-tick ${done ? 'is-on' : ''}" data-ap-done="${i.id}"
              title="${done ? 'Undo' : 'Mark done'}">${done ? icon('check-sm', 12) : ''}</span>
        <div class="ap-todo__body">
          <span class="ap-todo__label">${i.label}</span>
          <span class="ap-todo__why t-caption">${i.why}</span>
        </div>
        ${apLocked() ? '<span class="ap-todo__gap"></span>' : `
        <span class="ap-opt">
          <span class="ap-opt__dot" data-ap-rowmenu="${i.id}" title="Options">${icon('kebab', 14)}</span>
          <ul class="ap-menu ap-menu--opt ${menu ? 'is-open' : ''}">
            <li class="ap-menu__row" data-ap-task="edit:${i.id}">${icon('pencil', 14)}Edit task</li>
            <li class="ap-menu__row" data-ap-task="due:${i.id}">${icon('calendar-clock', 14)}Change the due date</li>
            <li class="ap-menu__row" data-ap-task="reassign:${i.id}">${icon('user-plus', 14)}Reassign</li>
            <li class="ap-menu__row is-danger has-rule" data-ap-task="delete:${i.id}">${icon('trash', 14)}Delete</li>
          </ul>
        </span>`}
        ${meta ? `<div class="ap-todo__meta">${meta}</div>` : ''}
      </article>`;
  };

  const band = (b) => {
    const items = all.filter(i => i.band === b.id);
    if (!items.length) return '';
    const live = items.filter(i => !AP.done.has(i.id)).length;
    const folded = AP.bands.has(b.id);

    return `
      <section class="ap-band is-${b.tone} ${folded ? 'is-folded' : ''} ${b.id === 'mine' ? 'is-long' : ''}">
        <header class="ap-band__head" data-ap-band="${b.id}">
          <span class="ap-band__pip"></span>
          <span class="ap-band__label">${b.label}</span>
          <span class="ap-band__count">${live}</span>
          <span class="ap-band__chev">${icon('chevron-down', 14)}</span>
        </header>
        <div class="ap-band__body">${items.map(i => row(i, b.tone)).join('')}</div>
      </section>`;
  };

  /* Folded, the head still has to say what is waiting, or folding it would
     be hiding rather than tidying. The pips are always rendered so that
     the scroll can fold the card with a class instead of a repaint. */
  const pips = AP_BANDS.map(b => {
    const n = all.filter(i => i.band === b.id && !AP.done.has(i.id)).length;
    return n ? `<span class="ap-next__pip is-${b.tone}">${n} ${b.short}</span>` : '';
  }).join('');

  return `
    <section class="ap-next ap-next--${layout} ${shut ? 'is-shut' : ''}">
      <header class="ap-next__head" data-ap-next>
        <span class="ap-next__eyebrow t-overline">Tasks to action</span>
        <span class="ap-next__pips">${pips}</span>
        <span class="ap-spacer"></span>
        ${apLocked() ? '' : `<button class="ap-btn ap-btn--ghost ap-btn--sm ap-next__add"
          data-ap-act="New task on this deal">${icon('plus', 13)} Add a task</button>`}
        <span class="ap-next__count">${open.length} of ${all.length} left</span>
        <span class="ap-next__chev">${icon('chevron-down', 15)}</span>
      </header>
      <div class="ap-next__fold">
        <div class="ap-next__inner">
          <div class="ap-next__bands">${AP_BANDS.map(band).join('')}</div>
          ${apLocked() ? '' : `<footer class="ap-next__foot">
            <button class="ap-btn ap-btn--ghost ap-btn--sm" data-ap-act="New task on this deal">
              ${icon('plus', 13)} Add a task
            </button>
            <span class="t-caption">Every task on this deal, soonest first.</span>
          </footer>`}
        </div>
      </div>
    </section>`;
}

/* ==========================================================================
   Stage progress — the thing v2 lost and v1 had
   --------------------------------------------------------------------------
   Built rather than dropped in as a picture. v1's run of chevrons was an
   export because a clip-path chevron run cannot both interlock and leave
   room for "Application submitted". This sidesteps that instead of fighting
   it: a segmented track with no notches, where the *current* step is given
   the slack, so its label always has room and the finished ones compress.
   ========================================================================== */

function apStageTrack(opts = {}) {
  const ix = apStageIx();
  return `
    <div class="ap-track ${opts.compact ? 'is-compact' : ''}">
      ${AP_STAGES.map((s, i) => {
        const state = i < ix ? 'done' : i === ix ? 'now' : 'next';
        return `
          <button class="ap-step is-${state}" data-ap-stage="${s.id}"
                  style="--ap-stage:${s.colour};--ap-tint:${s.tint};--ap-ink:${s.ink}"
                  title="${s.label}">
            ${state === 'done' ? `<span class="ap-step__tick">${icon('check-sm', 11)}</span>` : ''}
            ${state === 'now'  ? '<span class="ap-step__dot"></span>' : ''}
            <span class="ap-step__label">${s.label}</span>
          </button>`;
      }).join('')}
      <span class="ap-track__pct t-label-sm">${apProgress()}%</span>
    </div>`;
}

/* The same spine stood on its end, for a shell that has a column to put it
   in. It carries how many actions each stage is holding, which the flat
   track has no room for. */
function apStageSteps() {
  const ix = apStageIx();
  return `
    <ol class="ap-spine">
      ${AP_STAGES.map((s, i) => {
        const state = i < ix ? 'done' : i === ix ? 'now' : 'next';
        const left = i === ix ? apNextOpen().length : 0;
        return `
          <li class="ap-spine__step is-${state}" data-ap-stage="${s.id}"
              style="--ap-stage:${s.colour}">
            <span class="ap-spine__node">
              ${state === 'done' ? icon('check-sm', 11) : ''}
            </span>
            <span class="ap-spine__label">${s.label}</span>
            ${left ? `<span class="ap-spine__n">${left}</span>` : ''}
          </li>`;
      }).join('')}
    </ol>`;
}

/* ==========================================================================
   Header atoms — each shell arranges these its own way
   ========================================================================== */

/* ==========================================================================
   The alert bar
   --------------------------------------------------------------------------
   Two kinds of thing only: **documents waiting on the broker**, and
   **system warnings** about the record itself. Jobs do not belong here —
   they are rows in the work card, and putting them in both places is what
   made this strip read as a second to-do list.

   The glyph is the board's own alarm, not a calendar: a calendar on this
   screen means a date on a task, and these are neither tasks nor dates.
   ========================================================================== */

function apWarnings() {
  const d = AP.deal, st = apStage(AP.stage), c = apDocCounts(), out = [];

  if (st.locks) out.push({ tone: 'locked', glyph: 'lock', label: 'Settled — record locked',
    note: `Settled ${AP_MOCK.settledOn}`, action: 'Unlock' });

  /* Documents sitting on the broker's side of the fence. */
  if (c.review) out.push({ tone: 'error', glyph: 'alarm',
    label: `${c.review} document${c.review > 1 ? 's' : ''} to review`,
    note: 'Waiting on you since 20/01', action: 'Review', view: 'documents' });

  if (c.rejected) out.push({ tone: 'warn', glyph: 'alarm',
    label: `${c.rejected} document rejected`,
    note: 'No replacement from the client yet', action: 'Open', view: 'documents' });

  /* System warnings about the record. */
  if (d.duplicate) out.push({ tone: 'dark', glyph: 'alert', label: 'Possible duplicate',
    note: 'Same client and amount on #APP-2026-0702', action: 'Compare' });

  if (AP_MOCK.visaExpiry) out.push({ tone: 'warn', glyph: 'alarm', label: 'Visa expiring',
    note: `${apName(AP_MOCK.visaHolder)} \u00b7 482 expires ${AP_MOCK.visaExpiry}`, action: 'View' });

  return out;
}

const apWarnStrip = () => {
  const w = apWarnings();
  if (!w.length) return '';
  return `<div class="ap-warns">${w.map(x => `
    <span class="ap-warn is-${x.tone}">
      ${icon(x.glyph, 14)}<b>${x.label}</b>
      <span class="ap-warn__note">${x.note}</span>
      <span class="ap-warn__act"
            ${x.view ? `data-ap-view="${x.view}"` : `data-ap-act="${x.action} — ${x.label}"`}
            >${x.action}</span>
    </span>`).join('')}</div>`;
};

/* The record band. The deal is a window opened over the board, so there is
   no product nav above it and no trail back through one: the broker got
   here by opening this deal and closes it to return. What is left is the
   client, what kind of deal it is, and the two facts worth carrying at the
   top — which one it is, and when it last moved. */
function apIdentity() {
  const d = AP.deal;
  return `
    <div class="ap-who">
      <div class="ap-who__line">
        <h1 class="ap-who__name t-h4">${d.name}</h1>
        <span class="ap-segpick">
          <span class="ap-seg" data-ap-menu="segment">
            ${AP.segment === 'commercial' ? icon('building', 13) : icon('user-plus', 13)}
            ${AP.segment === 'commercial' ? 'Commercial' : 'Consumer'}${icon('chevron-down', 13)}
          </span>
          <ul class="ap-menu ap-menu--seg ${AP.menu === 'segment' ? 'is-open' : ''}">
            <li class="ap-menu__row ${AP.segment === 'consumer' ? 'is-on' : ''}" data-ap-segment="consumer">
              ${icon('user-plus', 15)}Consumer
              <span class="ap-menu__sub">Employment and living expenses required</span>
            </li>
            <li class="ap-menu__row ${AP.segment === 'commercial' ? 'is-on' : ''}" data-ap-segment="commercial">
              ${icon('building', 15)}Commercial
              <span class="ap-menu__sub">Adds entity and directors; those two become optional</span>
            </li>
          </ul>
        </span>
      </div>
      <span class="ap-who__meta t-caption">
        <b>${d.ref}</b><span class="ap-who__sep">\u00b7</span>latest activity ${d.activity}
      </span>
    </div>`;
}

/* The money is the deal, so it is set at headline size next to the name
   rather than filed as one more labelled column. */
const apMoney = () => `
  <div class="ap-money">
    <span class="ap-money__n">${money(AP.deal.amount)}</span>
    <span class="ap-money__t t-caption">${AP.deal.product}</span>
  </div>`;

function apContact() {
  const p = AP.applicants.find(a => a.primary) || AP.applicants[0];
  return `
    <div class="ap-contact">
      <div class="ap-contact__lines">
        <span class="ap-contact__line">${icon('phone', 13)}${p.phone}
          <span class="ap-cp ap-cp--ghost" data-ap-copy="${p.phone}" title="Copy">${icon('copy', 12)}</span>
        </span>
        <span class="ap-contact__line">${icon('mail', 13)}${p.email}
          <span class="ap-cp ap-cp--ghost" data-ap-copy="${p.email}" title="Copy">${icon('copy', 12)}</span>
        </span>
      </div>
      <div class="ap-contact__pills">
        <span class="ap-cp ap-cp--on" data-ap-act="Calling ${p.first}">${icon('phone', 14)} Call</span>
        <span class="ap-cp" data-ap-act="New SMS to ${p.first}">${icon('chat', 14)}</span>
        <span class="ap-cp" data-ap-act="New email to ${p.first}">${icon('mail', 14)}</span>
      </div>
    </div>`;
}

/* The deal's people. Three bare avatars in a row said *someone was here*
   rather than *this deal is assigned to these people*, so each slot now
   carries its role as a label above the control, and the control is a
   picker: the role is legible at a glance and changeable without leaving
   the header. */
function apAssign(key) {
  const role = AP_ROLES[key], who = AP[key];
  const open = AP.menu === 'who-' + key;
  const pava = key === 'partner' ? 'ap-ava--p' : '';

  /* Broker and associate are two people, not one person twice, so each
     list leaves out whoever is already holding the other role. */
  const taken = key === 'broker' ? AP.associate : key === 'associate' ? AP.broker : null;
  const list  = role.list().filter(p => !taken || p[1] !== taken[1]);

  return `
    <div class="ap-assign">
      <span class="ap-assign__label t-overline">${role.label}</span>
      <button class="ap-assign__ctl ${who ? '' : 'is-empty'} ${apLocked() ? 'is-fixed' : ''}"
              ${apLocked() ? '' : `data-ap-menu="who-${key}"`}
              title="${role.label} — ${who ? who[1] : role.none}${apLocked() ? '' : '. Click to change.'}">
        ${who
          ? `<span class="ap-ava ${pava}">${who[0]}</span><span class="ap-assign__name">${who[1]}</span>`
          : `<span class="ap-ava ap-ava--none">${icon(role.glyph, 13)}</span>
             <span class="ap-assign__name is-empty">${role.none}</span>`}
        ${apLocked() ? '' : icon('chevron-down', 12)}
      </button>
      ${apLocked() ? '' : `
      <ul class="ap-menu ap-menu--assign ${open ? 'is-open' : ''}">
        <li class="ap-menu__head t-overline">${role.label} · ${role.hint}</li>
        ${list.map(p => `
          <li class="ap-menu__row ${who && who[1] === p[1] ? 'is-on' : ''}"
              data-ap-who="${key}:${p[0]}:${p[1]}">
            <span class="ap-ava ${pava}">${p[0]}</span>${p[1]}
            ${who && who[1] === p[1] ? `<span class="ap-menu__tick">${icon('check-sm', 12)}</span>` : ''}
          </li>`).join('')}
        ${role.none ? `
          <li class="ap-menu__row has-rule" data-ap-who="${key}::">
            <span class="ap-ava ap-ava--none">${icon('close', 12)}</span>${role.none}
          </li>` : ''}
      </ul>`}
    </div>`;
}

function apFollowUp() {
  const open = AP.menu === 'followup';
  return `
    <div class="ap-assign ap-assign--date">
      <span class="ap-assign__label t-overline">Next follow-up</span>
      <button class="ap-assign__ctl ${apLocked() ? 'is-fixed' : ''}"
              ${apLocked() ? '' : 'data-ap-menu="followup"'}
              title="Next follow-up${apLocked() ? '' : ' — click to reschedule'}">
        <span class="ap-assign__cal">${icon('calendar-clock', 14)}</span>
        <span class="ap-assign__name ${AP.followUp ? '' : 'is-empty'}">${AP.followUp || 'Not scheduled'}</span>
        ${apLocked() ? '' : icon('chevron-down', 12)}
      </button>
      ${apLocked() ? '' : `
      <ul class="ap-menu ap-menu--assign ${open ? 'is-open' : ''}">
        <li class="ap-menu__head t-overline">Reschedule the follow-up</li>
        ${AP_FOLLOWUPS.map(f => `
          <li class="ap-menu__row ${AP.followUp === f ? 'is-on' : ''}" data-ap-followup="${f}">
            ${icon('calendar-clock', 14)}${f}
            ${AP.followUp === f ? `<span class="ap-menu__tick">${icon('check-sm', 12)}</span>` : ''}
          </li>`).join('')}
        <li class="ap-menu__row has-rule" data-ap-followup="">
          ${icon('close', 13)}Clear the follow-up
        </li>
      </ul>`}
    </div>`;
}

/* The assignment strip: who owns it, who helps, where it came from, and
   when it is next touched. */
const apAssignees = () => `
  <div class="ap-assigns">
    ${apAssign('broker')}
    ${apAssign('associate')}
    ${apAssign('partner')}
    <span class="ap-assigns__rule"></span>
    ${apFollowUp()}
  </div>`;

/* The quick-actions button carries the stage menu too. Its *Change stage*
   row has to open one, and this is the header's only positioned box, so the
   menu lives here rather than being pinned to the spine, which is a column
   away and scrolls. */
const apQuickBtn = () => `
  <div class="ap-quick">
    <button class="ap-btn" data-ap-menu="quick">${icon('bolt', 15)} Quick actions ${icon('chevron-down', 14)}</button>
    <ul class="ap-menu ap-menu--quick ${AP.menu === 'quick' ? 'is-open' : ''}">
      ${AP_QUICK.map(q => `
        <li class="ap-menu__row ${q.rule ? 'has-rule' : ''}"
            ${q.label === 'Change stage' ? 'data-ap-menu="stage"' : `data-ap-act="${q.label}"`}>
          ${icon(q.glyph, 15)}${q.label}
        </li>`).join('')}
    </ul>
    ${apStageMenu()}
  </div>`;

/* Top-right of the window, where a window's controls belong: what can be
   done to the application as a whole, then the way out. */
const AP_MORE = [
  { glyph: 'columns',    label: 'Scenarios' },
  { glyph: 'user-plus',  label: 'Add another applicant' },
  { glyph: 'copy',       label: 'Duplicate application' },
  { glyph: 'trash',      label: 'Delete', danger: true }
];

const apWinActs = () => `
  <div class="ap-winmore">
    <span class="ap-ip" data-ap-menu="more" title="More">${icon('kebab', 16)}</span>
    <ul class="ap-menu ap-menu--more ${AP.menu === 'more' ? 'is-open' : ''}">
      ${AP_MORE.map(m => `
        <li class="ap-menu__row ${m.danger ? 'is-danger has-rule' : ''}"
            data-ap-act="${m.label}">${icon(m.glyph, 15)}${m.label}</li>`).join('')}
    </ul>
  </div>
  <span class="ap-ip ap-ip--close" data-ap-close
        title="Close and go back to the board">${icon('close', 16)}</span>`;

/* Closing. On its own page there is nothing behind the window to go back
   to, so it says so; opened from the board (`?embed=1`), the page is inside
   the board's overlay and asks the board to take it away. */
const apEmbedded = () => document.documentElement.classList.contains('is-embedded');

function apClose() {
  if (apEmbedded() && window.parent !== window) {
    window.parent.postMessage({ type: 'apv:close' },
      location.origin === 'null' ? '*' : location.origin);
    return;
  }
  apToast('Closed \u2014 back to the board');
}

const apSaveChip = () => `
  <div class="ap-save ${AP.saved === 'saving' ? 'is-saving' : ''}">
    ${AP.saved === 'saving' ? icon('clock', 14) : icon('check-circle', 14)}
    <span>${AP.saved === 'saving' ? 'Saving…' : AP.savedAt}</span>
  </div>`;

const apStageMenu = () => `
  <ul class="ap-menu ap-menu--stage ${AP.menu === 'stage' ? 'is-open' : ''}">
    ${AP_STAGES.map(s => `
      <li class="ap-menu__row ${s.id === AP.stage ? 'is-on' : ''}" data-ap-stage="${s.id}">
        <span class="ap-dot" style="background:${s.colour}"></span>${s.label}
        ${s.id === AP.stage ? `<span class="ap-menu__tick">${icon('check-sm', 12)}</span>` : ''}
      </li>`).join('')}
  </ul>`;

/* ==========================================================================
   Panel content
   --------------------------------------------------------------------------
   The pinned containers the feedback liked, minus "what to do next", which
   has been promoted out of the panel into a component of its own.
   ========================================================================== */

const AP_NOTES = [
  { who: 'Kenn Z.', when: '22 Jan, 2:51pm', partner: false,
    body: 'Client wants settlement before the end of Feb — the truck is off the road until then.' },
  { who: 'Jess F.', when: '21 Jan, 9:14am', partner: true,
    body: 'Acme Autos confirmed the quote is good for 30 days from 19/01.' },
  { who: 'Kenn Z.', when: '20 Jan, 11:03am', partner: false,
    body: 'Second applicant is on a 482 visa — check the lender\u2019s policy before submitting.' },
  { who: 'Cara E.', when: '20 Jan, 9:40am', partner: false,
    body: 'Payslips came in for the wrong period. Asked for Nov to Jan instead.' },
  { who: 'Jess F.', when: '19 Jan, 4:05pm', partner: true,
    body: 'Partner asked whether we can bring settlement forward if the deposit lands early.' },
  { who: 'Kenn Z.', when: '19 Jan, 10:12am', partner: false,
    body: 'Director guarantee will be needed — the entity has traded under two years.' },
  { who: 'Sam M.',  when: '18 Jan, 2:30pm', partner: false,
    body: 'Credit file is clean. One small default from 2021, paid, outside the window.' },
  { who: 'Kenn Z.', when: '17 Jan, 1:20pm', partner: true,
    body: 'Told Acme Autos we are targeting approval by the end of the month.' },
  { who: 'System',  when: '15 Jan, 11:35am', partner: false,
    body: 'Deal created from a partner referral. Source: Acme Autos.' }
];

/* The client's own process, as three preset lists. An item with an `auto`
   is ticked by the system when the thing it watches is true — the broker
   cannot untick that — and everything else is theirs to tick, because a
   checklist that only the system can fill is a checklist that stalls the
   moment the system misses something. */
const AP_CHECKLISTS = [
  { id: 'compliance', label: 'Compliance', items: [
    { id: 'c-privacy', label: 'Privacy form sent and signed', auto: () => AP.done.has('privacy') },
    { id: 'c-id',      label: 'Identity verified for every applicant', auto: () => AP.docs[0] === 'ok' },
    { id: 'c-guide',   label: 'Credit guide issued',          auto: () => AP.signed.has(2) },
    { id: 'c-needs',   label: 'Needs and objectives recorded' },
    { id: 'c-fee',     label: 'Fee disclosure acknowledged' }
  ]},
  { id: 'submission', label: 'Submission', items: [
    { id: 's-docs',   label: 'All requested documents approved',
      auto: () => apDocCounts().ok === AP.docs.length },
    { id: 's-credit', label: 'Credit check run',               auto: () => AP.done.has('credit') },
    { id: 's-entity', label: 'Entity and directors confirmed' },
    { id: 's-serv',   label: 'Servicing calculated' },
    { id: 's-lender', label: 'Lender selected' },
    { id: 's-pack',   label: 'Submission pack sent',           auto: () => AP.submitted }
  ]},
  { id: 'settlement', label: 'Settlement', items: [
    { id: 't-sign', label: 'Loan documents signed',
      auto: () => AP.signed.size === AP_SIGNED.length },
    { id: 't-ins',  label: 'Insurance certificate received' },
    { id: 't-inv',  label: 'Invoice matches the approved amount' },
    { id: 't-date', label: 'Settlement date booked' }
  ]}
];

const apCheckOn   = (it) => (it.auto && it.auto()) || AP.checked.has(it.id);
const apCheckDone = (l) => l.items.filter(apCheckOn).length;

const AP_SIGNED = [
  { who: 'Maria Josephin', what: 'Privacy consent', when: '18/01/26', state: 'signed' },
  { who: 'David Josephin', what: 'Privacy consent', when: '',          state: 'awaiting' },
  { who: 'Maria Josephin', what: 'Credit guide',    when: '18/01/26', state: 'signed' },
  { who: 'Josephin Haulage Pty Ltd', what: 'Director guarantee', when: '', state: 'not-sent' }
];

/* Date, time, who and what, kept apart so the string can set them in the
   hierarchy v1 used: the date in bold, the time and the person beside it,
   and the event itself on the line underneath. A `note` is somebody
   writing rather than the system logging, and is drawn as v1 drew a
   comment. */
const AP_HISTORY = [
  { date: '23 Jan 2026', time: '11:12am', who: 'Kenn Z.',  kind: 'call',
    text: 'Logged a call with Maria — wants settlement before the end of February.' },
  { date: '23 Jan 2026', time: '9:20am',  who: 'Kenn Z.',  kind: 'note',
    text: 'Initial application review completed. All primary documents received and verified.' },
  { date: '22 Jan 2026', time: '3:20pm',  who: 'Jess F.',  kind: 'doc',
    text: 'Requested documents from the client' },
  { date: '22 Jan 2026', time: '9:17am',  who: 'System',   kind: 'system',
    text: 'Credit check completed — score 720' },
  { date: '20 Jan 2026', time: '4:40pm',  who: 'Kenn Z.',  kind: 'doc',
    text: 'Payslips rejected — wrong period' },
  { date: '20 Jan 2026', time: '11:03am', who: 'Kenn Z.',  kind: 'note',
    text: 'Second applicant is on a 482 visa — check the lender\u2019s policy before submitting.' },
  { date: '19 Jan 2026', time: '2:15pm',  who: 'Jess F.',  kind: 'doc',
    text: 'Asset quote received from Acme Autos' },
  { date: '18 Jan 2026', time: '5:02pm',  who: 'Maria J.', kind: 'sign',
    text: 'Signed the privacy consent' },
  { date: '18 Jan 2026', time: '10:30am', who: 'Kenn Z.',  kind: 'doc',
    text: 'Sent the privacy form' },
  { date: '17 Jan 2026', time: '1:05pm',  who: 'Sarah M.', kind: 'system',
    text: 'Viewed the application' },
  { date: '16 Jan 2026', time: '4:35pm',  who: 'Kenn Z.',  kind: 'note',
    text: 'Client asked whether a two-year term changes the rate. Quoted both.' },
  { date: '15 Jan 2026', time: '11:35am', who: 'System',   kind: 'system',
    text: 'Deal created from a partner referral' }
];

const AP_HIST_GLYPH = { call: 'phone', note: 'note', doc: 'article', sign: 'signature', system: 'bolt' };
const AP_SIGN_STATE = {
  signed:     { label: 'Signed',   glyph: 'check-circle', tone: 'ok' },
  awaiting:   { label: 'Awaiting', glyph: 'clock',        tone: 'wait' },
  'not-sent': { label: 'Not sent', glyph: 'x-circle',     tone: 'none' }
};

/* The actions each document state deserves. The label doubles as the
   confirmation, and `to` is the state the action moves it to — which is
   what makes accepting documents able to unblock the submit button. */
const AP_DOC_ACTS = {
  pending:  [['upload', 'Upload', 'review'], ['send', 'Request', 'pending']],
  review:   [['eye', 'View', null], ['check-circle', 'Accept', 'ok'], ['x-circle', 'Reject', 'rejected']],
  ok:       [['eye', 'View', null], ['download', 'Download', null]],
  rejected: [['upload', 'Replace', 'review'], ['send', 'Re-request', 'pending']]
};

const apDocs = () => AP.docs.map((state, i) => ({
  i, name: DOC_TYPES[i], state, status: DOC_STATUS[state], acts: AP_DOC_ACTS[state]
}));

/* There is no `apTasks` and no Tasks card any more. The deal's tasks were
   a third copy of the same list - see `apWork`, which now carries them. */

/* Notes, not *pinned notes*: this is where every note on the deal lives,
   internal and partner-visible alike. A deal can easily carry twenty, so
   the list scrolls inside the card instead of showing three and offering
   to show more — a *read more* that reveals seventeen is not a summary,
   it is a trapdoor. */
/* Notes, not *pinned notes*: every note on the deal lives here. Two tabs,
   internal and external, because that is the only distinction that
   matters and it is the same distinction the composer needs — so the tab
   says what you are reading *and* what you are about to write, and the
   switch that used to sit under the box has gone. A deal can carry
   twenty, so the list scrolls rather than offering to show more. */
const AP_NOTE_TABS = [
  { id: 'internal', label: 'Internal', partner: false },
  { id: 'external', label: 'External', partner: true }
];

function apPanelNotes() {
  const tab = AP_NOTE_TABS.find(t => t.id === AP.noteFilter) || AP_NOTE_TABS[0];
  const shown = AP_NOTES.filter(n => !!n.partner === tab.partner);

  return `
    <div class="ap-ctabs">
      ${AP_NOTE_TABS.map(t => `
        <span class="ap-ctab ${t.id === AP.noteFilter ? 'is-on' : ''}" data-ap-notefilter="${t.id}">
          ${t.partner ? icon('user-plus', 13) : icon('lock', 13)}${t.label}
          <span class="ap-ctab__n">${AP_NOTES.filter(n => !!n.partner === t.partner).length}</span>
        </span>`).join('')}
    </div>
    <div class="ap-notes" data-ap-notes>
      ${shown.length ? shown.map(n => `
        <div class="ap-note">
          <div class="ap-note__top">
            <span class="ap-ava">${n.who.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
            <span class="ap-note__who t-label-sm">${n.who}</span>
            <span class="ap-note__when t-caption">${n.when}</span>
          </div>
          <p class="ap-note__body">${apName(n.body)}</p>
        </div>`).join('')
        : `<p class="ap-empty">No ${tab.label.toLowerCase()} notes yet.</p>`}
    </div>
    <div class="ap-compose">
      <div class="ap-compose__field">
        <input class="ap-input ap-input--note"
               placeholder="${tab.partner ? 'Add a note the partner can see\u2026' : 'Add an internal note\u2026'}">
        <span class="ap-ip ap-ip--send" data-ap-act="${tab.label} note added">${icon('send', 15)}</span>
      </div>
    </div>`;
}

/* The panel's documents are a summary — the counts and the ones that need
   something — with the whole library a click away in the workspace. */
function apPanelDocs() {
  const c = apDocCounts();
  const needy = apDocs().filter(d => d.state !== 'ok');
  return `
    <div class="ap-docsum">
      ${[['ok', 'approved'], ['review', 'in review'], ['rejected', 'rejected'], ['pending', 'to request']]
        .map(([k, label]) => `
          <span class="ap-docsum__cell is-${k} ${c[k] ? '' : 'is-zero'}">
            <b>${c[k]}</b><span>${label}</span>
          </span>`).join('')}
    </div>
    ${needy.length
      ? needy.slice(0, 4).map(doc => `
          <div class="ap-doc">
            <span class="ap-doc__pip" style="background:${doc.status.colour}"></span>
            <span class="ap-doc__name">${doc.name}</span>
            <span class="ap-chip" style="background:${doc.status.bg};color:${doc.status.text}">${doc.status.label}</span>
            <span class="ap-doc__acts">
              ${doc.acts.map(([g, label, to]) => `
                <span class="ap-ip ap-ip--sm" title="${label}"
                      data-ap-doc="${doc.i}:${to || ''}:${label}">${icon(g, 14)}</span>`).join('')}
            </span>
          </div>`).join('')
      : '<p class="ap-empty">Every document is in and approved.</p>'}
    <button class="ap-btn ap-btn--ghost ap-btn--wide" data-ap-view="documents">
      ${icon('grid', 14)} Open the document library
    </button>`;
}

/* Three preset lists behind three tabs, because compliance, submission and
   settlement are three different moments and nobody works two of them at
   once. The system ticks what it can see; the broker can tick the rest,
   and the ones the system owns say so rather than looking like something
   that was forgotten. */
function apPanelChecks() {
  const list = AP_CHECKLISTS.find(l => l.id === AP.checkTab) || AP_CHECKLISTS[0];
  const done = apCheckDone(list);

  return `
    <div class="ap-ctabs">
      ${AP_CHECKLISTS.map(l => `
        <span class="ap-ctab ${l.id === AP.checkTab ? 'is-on' : ''}" data-ap-checktab="${l.id}">
          ${l.label}
          <span class="ap-ctab__n">${apCheckDone(l)}/${l.items.length}</span>
        </span>`).join('')}
    </div>
    <span class="ap-meter ap-meter--wide">
      <span class="ap-meter__fill ${done === list.items.length ? 'is-done' : ''}"
            style="width:${Math.round((done / list.items.length) * 100)}%"></span>
    </span>
    <div class="ap-clist">
      ${list.items.map(it => {
        const auto = !!(it.auto && it.auto());
        const on = auto || AP.checked.has(it.id);
        return `
          <div class="ap-citem ${on ? 'is-on' : ''} ${auto ? 'is-auto' : ''}">
            <span class="ap-tick ${on ? 'is-on' : ''}"
                  ${auto || apLocked() ? '' : `data-ap-check="${it.id}"`}
                  title="${auto ? 'Ticked by the system' : on ? 'Untick' : 'Tick this off'}">
              ${on ? icon('check-sm', 12) : ''}</span>
            <span class="ap-citem__label">${it.label}</span>
            ${auto ? `<span class="ap-citem__auto t-caption" title="The system ticked this">auto</span>` : ''}
          </div>`;
      }).join('')}
    </div>`;
}

const apPanelSigned = () => AP_SIGNED.map((s, i) => {
  const on = AP.signed.has(i);
  const st = AP_SIGN_STATE[on ? 'signed' : s.state];
  return `
    <div class="ap-row ap-row--sign">
      <span class="ap-sign__icon is-${st.tone}">${icon(st.glyph, 14)}</span>
      <span class="ap-row__main">
        <span class="ap-sign__what">${s.what}</span>
        <span class="ap-sign__who t-caption">${apName(s.who)}</span>
      </span>
      ${on
        ? `<span class="ap-row__meta">${s.when || 'Today'}</span>`
        : `<button class="ap-btn ap-btn--sm" data-ap-sign="${i}">${icon('signature', 13)} Chase</button>`}
    </div>`;
}).join('');

/* The activity string, laid out the way v1 laid it out: a badge running
   down the left, the stamp above the event, and the date carrying the
   weight — **18 Jan 2026** 10:30am by Kenn Z. — with what happened on the
   line underneath. A note is somebody writing rather than the system
   logging, so it keeps v1's brand rule down its left edge; everything
   else is set as a log. */
function apEvent(e, dated = true) {
  const note = e.kind === 'note';
  return `
    <div class="ap-ev ${note ? 'ap-ev--note' : ''}">
      <span class="ap-ev__badge ${note ? 'is-brand' : ''}">${icon(AP_HIST_GLYPH[e.kind], 13)}</span>
      <div class="ap-ev__body">
        <div class="ap-ev__stamp t-body-sm">
          ${dated ? `<b>${e.date}</b> ${e.time}` : `<b>${e.time}</b>`} <span>by ${apName(e.who)}</span>
        </div>
        <div class="ap-ev__text t-body-sm ${note ? '' : 'is-log'}">${apName(e.text)}</div>
      </div>
    </div>`;
}

const apPanelActivity = () => `
  <div class="ap-string">${AP_HISTORY.slice(0, 4).map(apEvent).join('')}</div>
  <button class="ap-btn ap-btn--ghost ap-btn--wide" data-ap-view="activity">
    ${icon('history', 14)} View the full history
  </button>`;

/* The pinned containers, in priority order with "what to do next" lifted
   out of the list. Each still says enough in its header to be useful
   folded. */
function apPanelSections() {
  const c = apDocCounts();
  return [
    { id: 'notes',     title: 'Notes',               glyph: 'note',
      count: `${AP_NOTES.length}`, body: apPanelNotes() },  /* every note, both kinds */
    { id: 'docs',      title: 'Documents',           glyph: 'article', view: 'documents',
      count: `${c.ok} of ${AP.docs.length}`,
      tone: c.rejected ? 'error' : (c.review ? 'warn' : ''), body: apPanelDocs() },
    { id: 'checklist', title: 'Checklist progress',  glyph: 'sliders',
      count: `${AP_CHECKLISTS.reduce((a, l) => a + apCheckDone(l), 0)} of ${AP_CHECKLISTS.reduce((a, l) => a + l.items.length, 0)}`,
      body: apPanelChecks() },
    { id: 'signed',    title: 'What\u2019s signed',        glyph: 'signature',
      count: `${AP.signed.size} of ${AP_SIGNED.length}`, body: apPanelSigned() },
    { id: 'activity',  title: 'Latest activity',     glyph: 'history', view: 'activity',
      count: `${AP_HISTORY.length}`, body: apPanelActivity() }
  ];
}

/* A card whose subject has a full view of its own says so in its header,
   not only at the bottom of its body: the panel folds, and an affordance
   that disappears when the card is shut is no affordance at all. The two
   that have one are documents and activity, and they are marked `has-view`
   so the pair reads as a set. */
const apCard = (s, i) => `
  <section class="ap-card ${AP.closed.has(s.id) ? 'is-closed' : ''} ${s.view ? 'has-view' : ''}"
           data-ap-card="${s.id}">
    <header class="ap-card__head" data-ap-fold="${s.id}">
      <span class="ap-card__glyph">${icon(s.glyph, 15)}</span>
      <span class="ap-card__title t-label-md">${s.title}</span>
      ${s.count ? `<span class="ap-card__count ${s.tone ? 'is-' + s.tone : ''}">${s.count}</span>` : ''}
      ${s.view ? `<button class="ap-card__open" data-ap-view="${s.view}"
                   title="Open the full ${s.view === 'documents' ? 'document library' : 'activity history'}">
                   ${icon('expand', 12)} Full view
                 </button>` : ''}
      <span class="ap-card__chev">${icon('chevron-down', 15)}</span>
    </header>
    <div class="ap-card__body">${s.body}</div>
  </section>`;

/* ==========================================================================
   The form
   ========================================================================== */

const AP_SECTIONS = [
  { id: 'loan',       title: 'Loan & structure',     glyph: 'bolt' },
  { id: 'entity',     title: 'Entity',               glyph: 'building',  only: 'commercial' },
  { id: 'directors',  title: 'Directors',            glyph: 'user-plus', only: 'commercial' },
  { id: 'applicants', title: 'Applicants',           glyph: 'user-plus' },
  { id: 'employment', title: 'Employment',           glyph: 'article',   optional: 'employment' },
  { id: 'expenses',   title: 'Income & expenses',    glyph: 'note',      optional: 'expenses' },
  { id: 'assets',     title: 'Assets & liabilities', glyph: 'apps' }
];

const apSections = () => AP_SECTIONS.filter(s => !s.only || s.only === AP.segment);
const apSkipped  = (s) => !!s.optional && AP.segment === 'commercial' && !AP.optional[s.optional];
const apDis      = () => apLocked() ? 'disabled' : '';

function apInput(label, value, o = {}) {
  const inner = o.options
    ? `<span class="ap-ctl ap-ctl--select">
         <select class="ap-sel" ${apDis()}>
           ${o.options.map(x => `<option ${x === value ? 'selected' : ''}>${x}</option>`).join('')}
         </select>
         <span class="ap-ctl__chev">${icon('chevron-down', 14)}</span></span>`
    : `<span class="ap-ctl">
         ${o.prefix ? `<i class="ap-ctl__fix">${o.prefix}</i>` : ''}
         <input class="ap-input" value="${value}" ${apDis()}>
         ${o.suffix ? `<i class="ap-ctl__fix">${o.suffix}</i>` : ''}</span>`;
  return `
    <label class="ap-field ${o.wide ? 'is-wide' : ''}">
      <span class="ap-field__label t-caption">${label}${o.req ? '<i class="ap-req">*</i>' : ''}</span>
      ${inner}
    </label>`;
}

const apGrid = (f) => `<div class="ap-grid">${f.join('')}</div>`;

function apRep(o, inner) {
  return `
    <div class="ap-rep ${o.primary ? 'is-primary' : ''}">
      <div class="ap-rep__head">
        <span class="ap-ava">${o.initials}</span>
        <span class="ap-rep__name t-label-md">${o.name}</span>
        ${o.role ? `<span class="ap-rep__role t-caption">${o.role}</span>` : ''}
        ${o.primary ? '<span class="ap-tag is-primary">Primary</span>'
          : (o.makePrimary && !apLocked()
              ? `<span class="ap-ap" ${o.makePrimary}>${icon('star', 13)} Make primary</span>` : '')}
        <span class="ap-spacer"></span>
        ${o.remove && !apLocked()
          ? `<span class="ap-ip ap-ip--sm" ${o.remove} title="Remove">${icon('trash', 14)}</span>` : ''}
      </div>
      ${inner}
    </div>`;
}

const apAdd = (attr, label) => apLocked() ? ''
  : `<button class="ap-btn ap-btn--dashed" ${attr}>${icon('plus', 14)} ${label}</button>`;

const AP_BODIES = {
  loan: () => apGrid([
    apInput('Loan amount', AP.deal.amount.toLocaleString('en-AU'), { prefix: '$', req: true }),
    apInput('Loan type', AP.deal.product, { options: ['Asset finance', 'Vehicle finance', 'Equipment finance', 'Working capital'], req: true }),
    apInput('Term (years)', '5', { options: ['1', '2', '3', '4', '5', '7'] }),
    apInput('Interest rate', '6.5', { suffix: '%' }),
    apInput('Repayment', '1,472', { prefix: '$', suffix: '/mo' }),
    apInput('Deposit', '25,000', { prefix: '$' }),
    apInput('Purpose', AP.segment === 'commercial' ? 'Business use — haulage fleet' : 'Personal use', { wide: true }),
    apInput('Supplier', AP.deal.partner ? AP.deal.partner[1] : 'Private sale'),
    apInput('Asset being financed', '2024 Kenworth T410 prime mover', { wide: true }),
    apInput('Asset condition', 'New', { options: ['New', 'Used', 'Demo'] })
  ]),

  entity: () => {
    const types = [
      ['sole', 'Sole trader', 'One person trading in their own name'],
      ['company', 'Company', 'Pty Ltd — directors and shareholdings'],
      ['trust', 'Trust', 'Trust, its trustee and its beneficiaries']
    ];
    const pick = `<div class="ap-pick">${types.map(([id, label, note]) => `
      <span class="ap-pick__opt ${AP.entity === id ? 'is-on' : ''}" data-ap-entity="${id}">
        <span class="ap-pick__label t-label-md">${label}</span>
        <span class="ap-pick__note t-caption">${note}</span>
      </span>`).join('')}</div>`;

    if (AP.entity === 'sole') return pick + apGrid([
      apInput('Trading name', apName('M. Josephin Haulage'), { req: true }),
      apInput('ABN', '54 112 887 330', { req: true }),
      apInput('Registered since', '04/2019')
    ]);

    if (AP.entity === 'company') return pick + apGrid([
      apInput('Company name', apName('Josephin Haulage Pty Ltd'), { req: true, wide: true }),
      apInput('ACN', '112 887 330', { req: true }),
      apInput('ABN', '54 112 887 330', { req: true }),
      apInput('Registered', '04/2019'),
      apInput('Industry', 'Road freight transport'),
      apInput('Registered address', '42 Collins Street, Melbourne VIC 3000', { wide: true })
    ]);

    /* A trust is three things, not one — the trust, the trustee acting for
       it, and the beneficiaries behind it. Treating it as a company with a
       different name is what this section exists to stop. */
    return pick + `
      <div class="ap-sub">
        <span class="ap-sub__title t-label-sm">${icon('building', 14)} The trust</span>
        ${apGrid([
          apInput('Trust name', apName('Josephin Family Trust'), { req: true, wide: true }),
          apInput('Trust type', 'Discretionary', { options: ['Discretionary', 'Unit', 'Hybrid', 'SMSF'] }),
          apInput('Trust ABN', '71 440 902 118'),
          apInput('Established', '08/2016'),
          apInput('Deed held', 'Yes', { options: ['Yes', 'No — to be supplied'] })
        ])}
      </div>
      <div class="ap-sub">
        <span class="ap-sub__title t-label-sm">${icon('user-plus', 14)} The trustee</span>
        ${apGrid([
          apInput('Trustee type', 'Corporate', { options: ['Corporate', 'Individual'], req: true }),
          apInput('Trustee name', apName('Josephin Holdings Pty Ltd'), { req: true, wide: true }),
          apInput('Trustee ACN', '112 887 330'),
          apInput('Acts for the trust since', '08/2016')
        ])}
      </div>
      <div class="ap-sub">
        <span class="ap-sub__title t-label-sm">${icon('apps', 14)} Beneficiaries</span>
        ${AP.beneficiaries.map(b => `
          <div class="ap-line">
            <span class="ap-line__main">${b.name}</span>
            <span class="ap-tag">${b.kind}</span>
            ${apLocked() ? '' : `<span class="ap-ip ap-ip--sm" data-ap-del="ben:${b.id}"
              title="Remove">${icon('trash', 14)}</span>`}
          </div>`).join('')}
        ${apAdd('data-ap-add="ben"', 'Add a beneficiary')}
      </div>`;
  },

  directors: () => `
    ${AP.directors.map(x => apRep({
      initials: x.name.split(' ').map(p => p[0]).join('').slice(0, 2),
      name: x.name, role: `${x.pct}% · appointed ${x.appointed}`, primary: x.primary,
      makePrimary: `data-ap-primary="dir:${x.id}"`,
      remove: AP.directors.length > 1 ? `data-ap-del="dir:${x.id}"` : null
    }, apGrid([
      apInput('Full name', x.name, { req: true }),
      apInput('Date of birth', '15/03/1985'),
      apInput('Shareholding', x.pct, { suffix: '%' }),
      apInput('Appointed', x.appointed),
      apInput('Guarantor', x.guarantor ? 'Yes' : 'No', { options: ['Yes', 'No'] }),
      apInput('Residential address', '42 Collins Street, Melbourne VIC 3000', { wide: true })
    ]))).join('')}
    ${apAdd('data-ap-add="dir"', 'Add a director')}`,

  applicants: () => `
    ${AP.applicants.map(a => apRep({
      initials: a.first[0] + a.last[0], name: `${a.first} ${a.last}`,
      role: a.residency, primary: a.primary,
      makePrimary: `data-ap-primary="app:${a.id}"`,
      remove: AP.applicants.length > 1 ? `data-ap-del="app:${a.id}"` : null
    }, apGrid([
      apInput('First name', a.first, { req: true }),
      apInput('Last name', a.last, { req: true }),
      apInput('Date of birth', a.dob, { req: true }),
      apInput('Mobile', a.phone, { req: true }),
      apInput('Email', a.email, { req: true }),
      apInput('Residency', a.residency, { options: ['Citizen', 'Permanent resident', 'Visa — subclass 482', 'Visa — other'] }),
      apInput('Marital status', 'Married', { options: ['Single', 'Married', 'De facto', 'Separated'] }),
      apInput('Dependants', '2'),
      apInput('Address', '42 Collins Street, Melbourne VIC 3000', { wide: true })
    ]))).join('')}
    ${apAdd('data-ap-add="app"', 'Add an applicant')}`,

  employment: () => AP.applicants.map(a => `
    <div class="ap-sub">
      <span class="ap-sub__title t-label-sm">${icon('user-plus', 14)} ${a.first} ${a.last}</span>
      ${apGrid([
        apInput('Status', 'Full time', { options: ['Full time', 'Part time', 'Casual', 'Self-employed'] }),
        apInput('Employer', 'Northbridge Logistics'),
        apInput('Occupation', 'Operations Manager'),
        apInput('Years in role', '4'),
        apInput('Gross income', '142,000', { prefix: '$' }),
        apInput('Pay frequency', 'Monthly', { options: ['Weekly', 'Fortnightly', 'Monthly'] })
      ])}
    </div>`).join(''),

  expenses: () => apGrid([
    apInput('Household income', '218,000', { prefix: '$' }),
    apInput('Rent or mortgage', '2,400', { prefix: '$', suffix: '/mo' }),
    apInput('Living expenses', '3,150', { prefix: '$', suffix: '/mo' }),
    apInput('Other commitments', '640', { prefix: '$', suffix: '/mo' }),
    apInput('Credit card limits', '12,000', { prefix: '$' }),
    apInput('Dependants', '2')
  ]),

  assets: () => {
    const rows = [
      ['Property — 42 Collins Street', 'Asset', '$1,250,000'],
      ['Vehicle — 2021 Ranger', 'Asset', '$48,000'],
      ['Savings', 'Asset', '$86,400'],
      ['Mortgage — 42 Collins Street', 'Liability', '$620,000'],
      ['Equipment loan — Macquarie', 'Liability', '$74,300']
    ];
    return `
      <div class="ap-table">
        <div class="ap-table__head"><span>Item</span><span>Type</span><span>Value</span><span></span></div>
        ${rows.map(([name, kind, value]) => `
          <div class="ap-table__row">
            <span>${name}</span>
            <span><span class="ap-tag ${kind === 'Asset' ? 'is-asset' : 'is-liability'}">${kind}</span></span>
            <span class="is-num">${value}</span>
            <span>${apLocked() ? '' : `<span class="ap-ip ap-ip--sm" title="Remove">${icon('trash', 14)}</span>`}</span>
          </div>`).join('')}
      </div>
      ${apAdd('data-ap-act="New asset or liability"', 'Add an asset or liability')}`;
  }
};

function apFormBody() {
  return apSections().map(s => {
    const skipped = apSkipped(s);
    const optional = !!s.optional && AP.segment === 'commercial';
    return `
      <section class="ap-sec ${skipped ? 'is-skipped' : ''}" id="ap-sec-${s.id}" data-ap-sec="${s.id}">
        <header class="ap-sec__head">
          <span class="ap-sec__glyph">${icon(s.glyph, 16)}</span>
          <span class="ap-sec__title t-label-lg">${s.title}</span>
          ${optional ? '<span class="ap-tag is-optional">Optional for commercial</span>' : ''}
          <span class="ap-spacer"></span>
          ${optional
            ? `<span class="ap-ap" data-ap-optional="${s.optional}">
                 ${skipped ? icon('plus', 13) + ' Include it' : icon('x-circle', 13) + ' Not needed'}</span>`
            : `<span class="ap-sec__ok">${icon('check-circle', 16)}</span>`}
        </header>
        ${skipped
          ? '<p class="ap-sec__skip">Not collected on a commercial deal. Include it if this lender asks for it.</p>'
          : `<div class="ap-sec__body">${AP_BODIES[s.id]()}</div>`}
      </section>`;
  }).join('');
}

/* ==========================================================================
   The two full views — in the workspace, not over it
   --------------------------------------------------------------------------
   The feedback asked for both: a summary that is always to hand in the
   panel, and a full view that takes over the middle of the screen rather
   than floating above everything. So these render into the same column the
   form uses, and the form is one of three things that column can hold.
   ========================================================================== */

const apViewActivity = () => {
  /* The same string as the panel, at full length and broken by day, so a
     fortnight of events reads as a fortnight rather than as one list. The
     day carries the date here, so the events under it drop theirs and the
     time takes the weight the date was carrying. */
  const days = [];
  AP_HISTORY.forEach(e => {
    const last = days[days.length - 1];
    if (last && last.date === e.date) last.items.push(e);
    else days.push({ date: e.date, items: [e] });
  });

  return `
    <div class="ap-filters">
      ${['Everything', 'Calls', 'Notes', 'Documents', 'Signatures', 'System']
        .map((f, i) => `<span class="ap-ap ${i === 0 ? 'is-on' : ''}">${f}</span>`).join('')}
    </div>
    ${days.map(d => `
      <section class="ap-day">
        <h3 class="ap-day__date t-overline">${d.date}</h3>
        <div class="ap-string ap-string--full">${d.items.map(e => apEvent(e, false)).join('')}</div>
      </section>`).join('')}`;
};

const apViewDocuments = () => {
  const c = apDocCounts();
  return `
    <div class="ap-filters">
      <span class="ap-ap is-on">All ${AP.docs.length}</span>
      <span class="ap-ap">Received ${c.ok + c.review + c.rejected}</span>
      <span class="ap-ap">Outstanding ${c.pending}</span>
      <span class="ap-spacer"></span>
      <button class="ap-btn ap-btn--brand" data-ap-act="Upload a document">${icon('upload', 14)} Upload</button>
    </div>
    <div class="ap-lib">
      ${apDocs().map(doc => `
        <article class="ap-lib__card is-${doc.state}">
          <div class="ap-lib__top">
            <span class="ap-lib__glyph">${icon('article', 18)}</span>
            <span class="ap-chip" style="background:${doc.status.bg};color:${doc.status.text}">${doc.status.label}</span>
          </div>
          <span class="ap-lib__name t-label-md">${doc.name}</span>
          <span class="ap-lib__meta t-caption">
            ${doc.state === 'pending' ? 'Never supplied' : `v${(doc.i % 2) + 1} · received 20/01/26`}</span>
          <div class="ap-lib__acts">
            ${doc.acts.map(([g, label, to]) => `
              <span class="ap-ap" data-ap-doc="${doc.i}:${to || ''}:${label}">${icon(g, 13)} ${label}</span>`).join('')}
          </div>
        </article>`).join('')}
    </div>`;
};

/* `tab` is the short name the switchers use, `count` the live number each
   one carries. A view that can say how much is behind it looks like a
   place to go; one that cannot looks like a label. */
const AP_VIEWS = {
  form:      { title: 'Application form',      tab: 'Application form', glyph: 'article',
               body: apFormBody,      count: () => '' },
  documents: { title: 'Document library',      tab: 'Document library', glyph: 'grid',
               body: apViewDocuments, count: () => `${apDocCounts().ok} of ${AP.docs.length}` },
  activity:  { title: 'Full activity history', tab: 'Activity history', glyph: 'history',
               body: apViewActivity,  count: () => `${AP_HISTORY.length}` }
};

/* The workspace: whichever of the three the broker is in, with a bar that
   says so and a way back to the form. The form keeps the section rail's
   anchors; the other two are plain panes. */
function apWorkspace(opts = {}) {
  const v = AP_VIEWS[AP.view];
  const onForm = AP.view === 'form';

  const tabs = opts.tabs
    ? `<div class="ap-tabs">
         ${Object.entries(AP_VIEWS).map(([id, x]) => {
           const n = x.count();
           return `
           <button class="ap-tab ${id === AP.view ? 'is-on' : ''}" data-ap-view="${id}">
             ${icon(x.glyph, 14)}${x.tab}
             ${n ? `<span class="ap-tab__n">${n}</span>` : ''}
           </button>`;
         }).join('')}
         ${onForm ? '' : '<span class="ap-tabs__hint t-caption">Esc goes back to the application</span>'}
       </div>`
    : `<div class="ap-wshead">
         ${onForm ? '' : `<span class="ap-back" data-ap-view="form" title="Back to the application">
           ${icon('chevron-right', 16)}</span>`}
         <span class="ap-wshead__glyph">${icon(v.glyph, 16)}</span>
         <span class="ap-wshead__title t-label-lg">${v.title}</span>
         ${onForm ? '' : '<span class="ap-wshead__hint t-caption">Esc goes back to the application</span>'}
       </div>`;

  return `
    <div class="ap-ws">
      ${tabs}
      <div class="ap-ws__body ${onForm ? 'is-form' : 'is-view'}" data-ap-scroll>
        ${v.body()}
        ${onForm ? `<div class="ap-ws__end">
            ${apSubmitBtn()}
            <span class="t-caption">Every change above is already saved. Submitting sends it to the lender.</span>
          </div>` : ''}
      </div>
    </div>`;
}

/* The rail of form sections. Only meaningful on the form, so it says so
   when the workspace is showing something else. */
function apSectionRail() {
  return `
    <nav class="ap-rail ${AP.view === 'form' ? '' : 'is-idle'}">
      ${apSections().map(s => `
        <a class="ap-rail__item ${s.id === AP.section && AP.view === 'form' ? 'is-on' : ''}"
           data-ap-jump="${s.id}" href="#ap-sec-${s.id}">
          ${icon(s.glyph, 15)}<span>${s.title}</span>
          ${apSkipped(s) ? '<span class="ap-rail__skip">skipped</span>' : ''}
        </a>`).join('')}
    </nav>`;
}

/* Where a shell has no tabs over its workspace, the three views are a rail
   of their own above the form's sections — the coarse navigation (which
   view am I in) over the fine one (where in the form am I). It sits at the
   top of the column, so the two full views are the first thing read when
   the deal opens rather than something found at the bottom of a card. */
const apViewRail = () => `
  <nav class="ap-rail ap-rail--views">
    ${['form', 'documents', 'activity'].map(id => {
      const v = AP_VIEWS[id], n = v.count();
      return `
        <span class="ap-rail__item ${AP.view === id ? 'is-on' : ''}" data-ap-view="${id}">
          ${icon(v.glyph, 15)}<span>${v.tab}</span>
          ${n ? `<span class="ap-rail__n">${n}</span>` : ''}
          ${id === 'form' ? '' : `<span class="ap-rail__go" title="Takes over the middle column">${icon('expand', 12)}</span>`}
        </span>`;
    }).join('')}
  </nav>`;

/* ==========================================================================
   Paint, fit, wiring
   ========================================================================== */

/* ==========================================================================
   The scroller
   --------------------------------------------------------------------------
   Bound to the scrolling element itself, and rebound after every repaint,
   because a repaint replaces it. This used to be a capturing listener on
   the persistent root, on the belief that a `scroll` event does not bubble
   but does capture. It does neither: the event is dispatched at the
   element and no ancestor hears it, capturing or not. The rail never
   followed the form, and this is the fix.
   ========================================================================== */

function apOnScroll(box) {
  if (AP.view !== 'form') return;

  /* Reading the form is the signal that the work card has been read, so it
     folds itself out of the way on the way down and comes back at the top.
     A class rather than a repaint, because this runs on every scroll frame
     - which is why the head renders its pips whether folded or not. Once
     the broker folds or unfolds it by hand, their choice stands. */
  if (!AP.nextTouched) {
    const want = box.scrollTop > 80;
    if (want !== AP.nextShut && (want || box.scrollTop < 24)) {
      AP.nextShut = want;
      AP.root.querySelector('.ap-next')?.classList.toggle('is-shut', want);
    }
  }

  const secs = [...box.querySelectorAll('[data-ap-sec]')];
  if (!secs.length) return;
  const line = box.getBoundingClientRect().top + 80;
  let active = secs[0];
  secs.forEach(sec => { if (sec.getBoundingClientRect().top <= line) active = sec; });

  /* Bottomed out, the last sections can never reach the line, so a rail
     driven by the line alone could never point at the last one. */
  if (box.scrollTop + box.clientHeight >= box.scrollHeight - 2) active = secs[secs.length - 1];

  const id = active.dataset.apSec;
  if (id === AP.section) return;
  AP.section = id;
  AP.root.querySelectorAll('[data-ap-jump]')
    .forEach(a => a.classList.toggle('is-on', a.dataset.apJump === id));
}

function apBindScroll() {
  const box = AP.root.querySelector('[data-ap-scroll]');
  if (!box || box.dataset.apBound) return;
  box.dataset.apBound = '1';
  box.addEventListener('scroll', () => apOnScroll(box), { passive: true });
}

function apPaint() {
  const old = AP.root.querySelector('[data-ap-scroll]');
  if (old) AP.scroll = old.scrollTop;

  AP.root.innerHTML = AP.render(AP.deal);

  /* The restore is instant on purpose. While the scroller carried
     `scroll-behavior: smooth`, every repaint animated the form from the
     top back down to where it was — which is what folding a band looked
     like from the broker's side. The CSS rule has gone and the jump from
     the section rail asks for smooth itself, where it is wanted. */
  const now = AP.root.querySelector('[data-ap-scroll]');
  if (now) now.scrollTop = AP.scroll;

  apBindScroll();
  apFit();
}

/* The panel folds to fit, filling rather than trimming: close everything,
   then walk down the priority order opening whatever still has room,
   skipping a section that does not rather than stopping there. It stands
   down the moment the broker folds something by hand. */
function apFit() {
  if (AP.touched) return;
  const panel = AP.root.querySelector('[data-ap-panel]');
  if (!panel) return;

  const cards = [...panel.querySelectorAll('[data-ap-card]')];
  if (!cards.length) return;

  cards.forEach((c, i) => c.classList.toggle('is-closed', i !== 0));
  for (let i = 1; i < cards.length; i++) {
    cards[i].classList.remove('is-closed');
    if (panel.scrollHeight > panel.clientHeight + 1) cards[i].classList.add('is-closed');
  }
  AP.closed = new Set(cards.filter(c => c.classList.contains('is-closed')).map(c => c.dataset.apCard));
}

function apToast(text) {
  const host = AP.root.querySelector('[data-ap-toasts]');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'ap-toast';
  el.innerHTML = `${icon('check-circle', 14)}<span>${text}</span>`;
  host.appendChild(el);
  setTimeout(() => el.classList.add('is-out'), 1800);
  setTimeout(() => el.remove(), 2200);
}

let apSaveTimer = null;
function apSaving() {
  AP.saved = 'saving';
  apMark();
  clearTimeout(apSaveTimer);
  apSaveTimer = setTimeout(() => {
    AP.saved = 'saved';
    AP.savedAt = 'Saved just now';
    apMark();
  }, 700);
}

/* Only the indicator — a full repaint would take the caret with it. */
function apMark() {
  const el = AP.root.querySelector('.ap-save');
  if (!el) return;
  el.classList.toggle('is-saving', AP.saved === 'saving');
  el.innerHTML = (AP.saved === 'saving' ? icon('clock', 14) : icon('check-circle', 14))
    + `<span>${AP.saved === 'saving' ? 'Saving…' : AP.savedAt}</span>`;
}

const apNextId = () => ++AP.seq;

function apWire(root) {
  root.addEventListener('click', (e) => {
    const hit = (s) => e.target.closest(s);
    let t;

    if ((t = hit('[data-ap-menu]'))) {
      const w = t.dataset.apMenu;
      AP.menu = AP.menu === w ? null : w;
      apPaint();
      return;
    }

    if ((t = hit('[data-ap-stage]'))) {
      AP.stage = t.dataset.apStage;
      AP.menu = null;
      apPaint();
      apToast(`Stage changed to ${apStage(AP.stage).label}`);
      return;
    }

    /* Reassigning. The value carries the role, the initials and the name,
       so an empty pair is "nobody in this role" rather than a lookup that
       found nothing. */
    if ((t = hit('[data-ap-who]'))) {
      const [key, ini, name] = t.dataset.apWho.split(':');
      AP[key] = name ? [ini, name] : null;
      AP.menu = null;
      apPaint(); apSaving();
      apToast(name ? `${AP_ROLES[key].label} changed to ${name}` : `${AP_ROLES[key].label} cleared`);
      return;
    }

    if ((t = hit('[data-ap-followup]'))) {
      AP.followUp = t.dataset.apFollowup || null;
      AP.menu = null;
      apPaint(); apSaving();
      apToast(AP.followUp ? `Follow-up set for ${AP.followUp}` : 'Follow-up cleared');
      return;
    }

    if ((t = hit('[data-ap-segment]'))) {
      AP.segment = t.dataset.apSegment;
      AP.menu = null;
      if (!apSections().some(s => s.id === AP.section)) AP.section = 'loan';
      apPaint();
      apToast(`Switched to a ${AP.segment} deal`);
      return;
    }

    if ((t = hit('[data-ap-entity]')))   { AP.entity = t.dataset.apEntity; apPaint(); return; }
    if ((t = hit('[data-ap-optional]'))) {
      const k = t.dataset.apOptional;
      AP.optional[k] = !AP.optional[k];
      apPaint();
      return;
    }

    if ((t = hit('[data-ap-add]'))) {
      const k = t.dataset.apAdd;
      if (k === 'app') AP.applicants.push({ id: apNextId(), first: 'New', last: 'applicant',
        dob: '', phone: '', email: '', residency: 'Citizen', primary: false });
      if (k === 'dir') AP.directors.push({ id: apNextId(), name: 'New director',
        pct: '0', appointed: '', guarantor: false, primary: false });
      if (k === 'ben') AP.beneficiaries.push({ id: apNextId(), name: 'New beneficiary', kind: 'General class' });
      apPaint(); apSaving();
      return;
    }

    if ((t = hit('[data-ap-del]'))) {
      const [kind, id] = t.dataset.apDel.split(':');
      const list = kind === 'app' ? 'applicants' : kind === 'dir' ? 'directors' : 'beneficiaries';
      const gone = AP[list].find(x => String(x.id) === id);
      AP[list] = AP[list].filter(x => String(x.id) !== id);
      /* Removing the primary one hands the badge on rather than leaving
         the deal without one. */
      if (gone && gone.primary && AP[list].length) AP[list][0].primary = true;
      apPaint(); apSaving();
      return;
    }

    if ((t = hit('[data-ap-primary]'))) {
      const [kind, id] = t.dataset.apPrimary.split(':');
      const list = kind === 'app' ? 'applicants' : 'directors';
      AP[list].forEach(x => x.primary = String(x.id) === id);
      apPaint(); apSaving();
      return;
    }

    /* Ticking a next-action is what moves the submission gates, so it is a
       repaint rather than a class flip: the button above may have just
       changed what it says. */
    if ((t = hit('[data-ap-done]'))) {
      const id = t.dataset.apDone;
      if (AP.done.has(id)) AP.done.delete(id); else AP.done.add(id);
      apPaint(); apSaving();
      return;
    }

    if ((t = hit('[data-ap-doc]'))) {
      const [i, to, label] = t.dataset.apDoc.split(':');
      if (to) { AP.docs[Number(i)] = to; apPaint(); apSaving(); }
      apToast(`${label} — ${DOC_TYPES[Number(i)]}`);
      return;
    }

    if ((t = hit('[data-ap-sign]'))) {
      AP.signed.add(Number(t.dataset.apSign));
      apPaint(); apSaving();
      apToast('Signature received');
      return;
    }

    /* A task row's options. */
    if ((t = hit('[data-ap-rowmenu]'))) {
      const id = t.dataset.apRowmenu;
      AP.rowMenu = AP.rowMenu === id ? null : id;
      apPaint();
      return;
    }

    if ((t = hit('[data-ap-task]'))) {
      const [what, id] = t.dataset.apTask.split(':');
      const job = apWork().find(x => x.id === id);
      const name = job ? job.label : 'the task';
      AP.rowMenu = null;
      if (what === 'delete') {
        AP.removed.add(id);
        apPaint(); apSaving();
        apToast(`Deleted — ${name}`);
      } else if (what === 'reassign') {
        const to = AP.associate || AP.broker;
        apPaint();
        apToast(`Reassigned to ${to[1]} — ${name}`);
      } else {
        apPaint();
        apToast(`${what === 'due' ? 'Change the due date' : 'Edit'} — ${name}`);
      }
      return;
    }

    if ((t = hit('[data-ap-check]'))) {
      const id = t.dataset.apCheck;
      if (AP.checked.has(id)) AP.checked.delete(id); else AP.checked.add(id);
      apPaint(); apSaving();
      return;
    }

    if ((t = hit('[data-ap-checktab]'))) {
      AP.checkTab = t.dataset.apChecktab;
      AP.touched = true;          /* opening a tab is reason enough to keep the card open */
      apPaint();
      return;
    }

    if ((t = hit('[data-ap-notefilter]'))) {
      AP.noteFilter = t.dataset.apNotefilter;
      AP.touched = true;
      apPaint();
      return;
    }

    if ((t = hit('[data-ap-view]'))) {
      AP.view = t.dataset.apView;
      AP.scroll = 0;
      apPaint();
      return;
    }

    if ((t = hit('[data-ap-fold]'))) {
      const id = t.dataset.apFold;
      AP.touched = true;
      if (AP.closed.has(id)) AP.closed.delete(id); else AP.closed.add(id);
      t.closest('[data-ap-card]').classList.toggle('is-closed');
      return;
    }

    /* The head folds the card, but it also carries Add a task, so a click
       on a control inside it belongs to that control. */
    if (hit('[data-ap-next]') && !hit('[data-ap-act]')) {
      AP.nextShut = !AP.nextShut;
      AP.nextTouched = true;      /* the broker has an opinion; stop having one */
      AP.root.querySelector('.ap-next')?.classList.toggle('is-shut', AP.nextShut);
      return;
    }

    /* A class flip rather than a repaint, so the form behind it does not
       move at all. */
    if ((t = hit('[data-ap-band]'))) {
      const id = t.dataset.apBand;
      if (AP.bands.has(id)) AP.bands.delete(id); else AP.bands.add(id);
      t.closest('.ap-band').classList.toggle('is-folded');
      return;
    }

    if ((t = hit('[data-ap-jump]'))) {
      e.preventDefault();
      const id = t.dataset.apJump;
      if (AP.view !== 'form') { AP.view = 'form'; AP.section = id; apPaint(); }
      const sec = AP.root.querySelector(`#ap-sec-${id}`);
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (hit('[data-ap-submit]')) {
      AP.submitted = true;
      AP.menu = null;
      AP.stage = 'progress';
      apPaint();
      apToast('Application submitted to the lender');
      return;
    }

    if ((t = hit('[data-ap-copy]'))) { apToast(`Copied ${t.dataset.apCopy}`); return; }

    if ((t = hit('.ap-tick:not([data-ap-done])'))) {
      t.classList.toggle('is-on');
      t.innerHTML = t.classList.contains('is-on') ? icon('check-sm', 12) : '';
      t.closest('.ap-row')?.classList.toggle('is-done', t.classList.contains('is-on'));
      apSaving();
      return;
    }

    if (hit('[data-ap-close]')) { apClose(); return; }

    if ((t = hit('[data-ap-act]'))) { apToast(t.dataset.apAct); return; }

    if (AP.menu || AP.rowMenu) { AP.menu = null; AP.rowMenu = null; apPaint(); }
  });

  root.addEventListener('input',  (e) => { if (e.target.matches('.ap-input, .ap-sel')) apSaving(); });
  root.addEventListener('change', (e) => { if (e.target.matches('.ap-sel')) apSaving(); });

  /* The rail follows the scroll. On the root and in the capture phase: a
     scroll event does not bubble but it does capture, and the scroller is
     replaced by every repaint. */
  apBindScroll();

  /* Esc peels one layer at a time: an open menu, then a full view back to
     the form, and only then — when the window was opened from the board —
     the window itself. */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (AP.menu || AP.rowMenu)   { AP.menu = null; AP.rowMenu = null; apPaint(); }
    else if (AP.view !== 'form') { AP.view = 'form'; apPaint(); }
    else if (apEmbedded())       apClose();
  });

  /* A click on the dimmed board around the window closes it, as it would
     any window opened over a page. Only when there is a board behind it. */
  const scrim = root.parentElement;
  if (scrim && scrim.classList.contains('ap')) {
    scrim.addEventListener('click', (e) => { if (e.target === scrim && apEmbedded()) apClose(); });
  }

  window.addEventListener('resize', () => apFit());
}

/* Each shell calls this with its own renderer. */
function apMount(app, render, deal = DEALS[0]) {
  const root = app.querySelector('#appview');
  if (!root) return;
  AP = apFresh(deal);
  AP.root = root;
  AP.render = render;
  root.innerHTML = render(deal);
  apWire(root);
  apBindScroll();
  apFit();
}

