/* ==========================================================================
   Kanban view — the board the work list can switch to.
   --------------------------------------------------------------------------
   A rebuild of the Figma frame "Draft #2 - 1440 px" (node 4235:8867) on the
   CRM-2026 working file, laid out on this project's 1920x1080 artboard
   rather than the frame's 1440: the measurements inside a column are the
   frame's (340 wide, 12px gutter, 312 cards), so the wider artboard shows
   more of the board instead of a different board.

   It runs on the shared model in js/data.js — the same deals the work list
   shows — so the board and the list tell the same story. The columns are
   MASTER_STAGES in order, and `snoozed` wins over the pipeline stage the
   way it does everywhere else.

   Interactions are thin, as they are on the other screens: the columns
   scroll, the board scrolls sideways, and the controls are presentational.
   Nothing drags yet.
   ========================================================================== */

/* Initials for the lead avatar. The data carries people as initials
   already; only the applicant is a full name. */
const kbInitials = (name) =>
  name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

/* Identity colours for the assignee stack. The frame gives each person
   their own hue; these are this project's accents rather than the frame's
   raw values, so the board stays inside the palette the rest of the
   screens use. Anyone not listed falls back to the brand. */
const KB_PERSON = {
  KZ: 'var(--brand-400)',
  JF: 'var(--accent-orange)',
  CE: 'var(--accent-red)',
  SM: 'var(--success-text)',
  RH: 'var(--accent-teal)',
  DP: 'var(--accent-blue)'
};
const kbPersonColour = (who) => KB_PERSON[who] || 'var(--brand-600)';

/* ---------- Card pieces ---------------------------------------------------- */

/* Documents collected, as a ring that follows the deal's own documents
   rather than a flat image — change the docs and the arc follows. At 0 the
   round cap leaves a single dot at twelve o'clock, which is what the frame
   shows for a deal with nothing collected. */
function kbRing(pct) {
  const r = 15.5, c = 2 * Math.PI * r;
  return `
    <div class="kb-ring">
      <svg viewBox="0 0 38 38" width="38" height="38" aria-hidden="true">
        <g transform="rotate(-90 19 19)">
          <circle cx="19" cy="19" r="${r}" fill="none" stroke="var(--neutral-200)" stroke-width="5"></circle>
          <circle cx="19" cy="19" r="${r}" fill="none" stroke="var(--brand-600)" stroke-width="5"
                  stroke-linecap="round" stroke-dasharray="${(c * pct / 100).toFixed(2)} ${c.toFixed(2)}"></circle>
        </g>
      </svg>
      <span class="kb-ring__n">${pct}%</span>
    </div>`;
}

/* The three document counts beside the ring. Each takes its colour from the
   status it reports, through the semantic tokens. */
const kbCount = (n, label, colour) => `
  <div class="kb-count">
    <span class="kb-count__n" style="color:${colour}">${String(n).padStart(2, '0')}</span>
    <span class="kb-count__label">${label}</span>
  </div>`;

/* Who is on the deal. Four faces at most, then a control for the rest —
   the frame overlaps them by about a third. */
function kbPeople(d) {
  const faces = d.people.slice(0, 4).map(p => `
    <span class="kb-face" style="background:${kbPersonColour(p)};border-color:${kbPersonColour(p)}">${p}</span>`).join('');
  return `
    <div class="kb-people" title="${d.people.join(', ')}${d.extra ? ` and ${d.extra} more` : ''}">
      ${faces}
      <span class="kb-face kb-face--add">${icon('plus', 10)}</span>
    </div>`;
}

/* Tasks, notes and activity, as the frame's bordered cluster. Notes carry
   the brand and the dot when something is unread. */
const kbCounters = (d) => `
  <div class="kb-counters">
    <span class="kb-counter">${icon('alarm', 14)}<span class="kb-counter__n">${String(d.tasks).padStart(2, '0')}</span></span>
    <span class="kb-counter ${d.unread ? 'is-unread' : ''}">${icon('bubble', 14)}<span class="kb-counter__n">${String(d.notes).padStart(2, '0')}</span></span>
    <span class="kb-counter">${icon('history', 14)}<span class="kb-counter__n">${String(d.events).padStart(2, '0')}</span></span>
    ${d.unread ? '<span class="kb-counters__dot"></span>' : ''}
  </div>`;

function kbCard(d, i) {
  const c = docCounts(d);
  return `
  <article class="kb-card" data-deal-row="${i}">

    <div class="kb-card__top">
      ${d.pinned ? `<span class="kb-card__pin">${icon('pin', 15)}</span>` : ''}
      <span class="kb-card__meta"><i>Last activity</i><b>${d.activity}</b></span>
      <span class="kb-card__kebab">${icon('kebab', 12)}</span>
    </div>

    <div class="kb-card__body">

      <div class="kb-card__id">
        <span class="kb-lead">${kbInitials(d.name)}</span>
        <div class="kb-card__who">
          <div class="kb-card__names">
            <span class="kb-card__name">${d.name}</span>
            <span class="kb-card__ref">${d.ref}</span>
            <span class="kb-card__go">${icon('chevron-right', 10)}</span>
          </div>
          <div class="kb-card__created"><i>Created</i><b>${d.created}</b></div>
        </div>
        <span class="kb-card__act">${icon('mail', 16)}</span>
      </div>

      <div class="kb-card__deal">
        <div class="kb-card__amount">
          <span class="kb-card__money">${money(d.amount)}</span>
          <span class="kb-card__product">${d.product}</span>
        </div>
        <span class="kb-card__stage">Day ${d.day} - ${d.stage}</span>
      </div>

      <div class="kb-card__docs">
        ${kbRing(docPct(d))}
        <span class="kb-card__docs-label">Documents<br>Collected</span>
        <div class="kb-card__counts">
          ${kbCount(c.review, 'Review', 'var(--info-base)')}
          ${kbCount(c.rejected, 'Rejected', 'var(--error-base)')}
          ${kbCount(c.pending, 'Pending', 'var(--warning-text)')}
        </div>
      </div>

      <div class="kb-card__foot">
        ${kbPeople(d)}
        ${kbCounters(d)}
      </div>

    </div>
  </article>`;
}

/* ==========================================================================
   The alert-state card — v2, v3 and v4.
   --------------------------------------------------------------------------
   A rebuild of the three card directions on the CRM-2026 "To upload" page
   (node 4622:10931). The three share one card and differ only in how the
   middle of it is treated:

     v2  Visual cues 1   tasks as full-bleed bands, hairline-separated
     v3  Visual cues 2   tasks as rounded tinted blocks inside one body
     v4  Text & colour   tasks as a labelled two-column list, documents as
                         text with no bar

   The chrome around them — banner, who, stage, owner, actions — is the same
   in all three, so a change there lands in all three.
   ========================================================================== */

/* The four states, in the order a broker should notice them. Each one is
   read off the deal rather than set by hand:

     immediate  a high-urgency deal still in Qualifying — nobody has worked it
     urgent     documents the client has sent that nobody has checked, or a
                task past its due date
     warning    flagged by the system rather than by the pipeline
     (none)     nothing wants attention

   `duplicate` is the one thing the model could not express, so js/data.js
   gained it. Everything else was already there. */
function kbState(d) {
  const c = docCounts(d);

  if (d.urgency === 'high' && d.master === 'qualifying' && !d.snoozed)
    return { id:'immediate', glyph:'alarm', label:'New lead - call now', action:'Call by today 4:07pm' };

  if (c.review > 0)
    return { id:'urgent', glyph:'alarm',
             label:`${c.review} document${c.review > 1 ? 's' : ''} to review`, action:'Review now' };

  if (d.tasksOverdue > 0)
    return { id:'urgent', glyph:'alarm',
             label:`${d.tasksOverdue} task${d.tasksOverdue > 1 ? 's' : ''} overdue`, action:'Action now' };

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

function kbCardAlt(d, i, mode) {
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

  /* v2 — the tasks are bands across the whole card, separated by hairlines. */
  if (mode === 'cues1') {
    return `${open}
      ${banner}
      <div class="kb-c__body">${head}</div>
      ${tasks.map(t => `
        <div class="kb-c__band ${t.overdue ? 'is-overdue' : ''}">
          <span class="kb-c__band-label">${icon(t.overdue ? 'alarm' : 'clock', 16)}${t.label}</span>
          <span class="kb-c__band-due">${t.due}</span>
        </div>`).join('')}
      <div class="kb-c__body">${kbDocBar(d, c)}${owner}</div>
      ${actions}
    </article>`;
  }

  /* v3 — one body, and the tasks are blocks inside it. */
  if (mode === 'cues2') {
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

  /* v4 — no tints and no bar: the state is carried by the words and their
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

/* The board itself is the same in every version — only the card differs, so
   each version passes its own card renderer rather than its own board. `mod`
   carries the one thing a card can change about the board around it: how wide
   a column has to be to hold it. */
function renderKanban(card = kbCard, mod = '') {
  return `
  <div class="kb ${mod}">
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
   the page. A second version goes here as a skin over the same render. */
const KB_RENDERERS = {
  v1: () => renderKanban(kbCard),
  v2: () => renderKanban((d, i) => kbCardAlt(d, i, 'cues1'), 'kb--wide'),
  v3: () => renderKanban((d, i) => kbCardAlt(d, i, 'cues2'), 'kb--wide'),
  v4: () => renderKanban((d, i) => kbCardAlt(d, i, 'text'), 'kb--wide')
};
const KB_MOUNTERS = {
  v1: mountKanban,
  v2: mountKanban,
  v3: mountKanban,
  v4: mountKanban
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
