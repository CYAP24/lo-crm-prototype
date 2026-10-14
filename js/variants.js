/* ==========================================================================
   Concept renderers.
   Each HTML shell sets window.VARIANT and this file builds the screen.
   ========================================================================== */


/* ---------- Board bar controls ---------- */

/* The view is the primary object in the bar — its name, a chevron hinting at
   other saved views, and the filter/group control beside it. */
const viewName = (name = 'Default View') => `
  <div class="vx-view">
    <span class="vx-view__name t-h4">${name}</span>
    ${icon('chevron-down', 16)}
  </div>`;

const filterBtn = () => `
  <span class="vx-iconbtn" title="Filter and group deals">${icon('filter', 16)}</span>`;

const portfolio = () => `
  <div class="select t-body-lg" style="width:210px">
    Asset Finance &middot; AU
    <svg width="16" height="16" style="color:var(--text-secondary)"><use href="#i-chevron-down"/></svg>
  </div>`;

const viewToggle = () => `
  <div class="toggle">
    <div class="toggle__item t-body-md">
      <svg width="16" height="16"><use href="#i-grid"/></svg>Kanban
    </div>
    <div class="toggle__item toggle__item--active t-label-md" style="color:var(--text-brand)">
      <svg width="16" height="16"><use href="#i-rows"/></svg>Worklist
    </div>
  </div>`;

const newActionBtn = () => `<span class="actionbtn t-label-lg">${icon('plus', 18)} New</span>`;

/* ---------- Row parts ---------- */

/* Quick-contact buttons: rounded tiles with gradient glyphs. */
const contactButtons = () => `
  <div class="contactbtns">
    <span class="contactbtn" title="Call">${icon('phone-duo', 22)}</span>
    <span class="contactbtn" title="Email">${icon('mail-duo', 22)}</span>
    <span class="contactbtn" title="Message">${icon('chat-duo', 22)}</span>
  </div>`;

/* Hard cap rather than relying on CSS overflow, so the cut is predictable
   and the ellipsis is part of the text. */
const clamp = (text, max) => (text.length > max ? text.slice(0, max).trimEnd() + '…' : text);

const stageOf = (d) => MASTER_STAGES.find(s => s.id === d.master) || MASTER_STAGES[0];

/* Sub-stage tag, coloured to its master stage so the two read as one system:
   a Discovery deal's tag is the same teal as the Discovery container. */
const subStageTag = (d) => {
  const s = stageOf(d);
  return `<span class="substage t-label-sm" style="background:${s.tint};color:${s.ink}">
      <span class="substage__dot" style="background:${s.colour}"></span>Day ${d.day} · ${d.stage}
    </span>`;
};

/* ---------- Split quick-action cells (v3) ----------------------------------
   Tasks, Notes and Activity as three columns instead of one pill group.
   A zero reads as a dash in muted grey; only real counts take colour.
   -------------------------------------------------------------------------- */

const qaNum = (n, tone) =>
  n > 0
    ? `<span class="qa-stat qa-stat--${tone}">${String(n).padStart(2, '0')}`
    : `<span class="qa-stat qa-stat--none">--`;

const tasksCell = (d) => `
  <div class="qa qa--tasks">
    <span class="qa__icon">${icon('alarm', 18)}</span>
    <span class="qa__body t-body-sm">
      ${qaNum(d.tasksDue, 'due')} Due soon</span>
      <span class="qa-sep">/</span>
      ${qaNum(d.tasksOverdue, 'over')} Overdue</span>
    </span>
  </div>`;

const notesCell = (d) => `
  <div class="qa qa--notes">
    <span class="qa__icon">${icon('bubble', 18)}</span>
    <span class="qa__body t-body-sm">
      <span class="qa-total">(${d.notes})</span>
      ${qaNum(d.notesUnread, 'unread')} Unread</span>
    </span>
  </div>`;

const activityCell = (d) => `
  <div class="qa qa--stack qa--activity">
    <span class="qa__icon">${icon('history', 18)}</span>
    <span class="qa__lines">
      <span class="qa__line t-body-md">${clamp(d.activityText, 34)}</span>
      <span class="qa__time t-body-sm">${relativeDate(d.activity)} ${d.activityTime}</span>
    </span>
  </div>`;

/* ---------- Inline quick actions (v2) --------------------------------------
   One line of plain text rather than a pill group. Clicking any of the three
   opens the deal panel on that section.
   -------------------------------------------------------------------------- */

const qaInline = (d, i) => {
  const pad = (v) => String(v).padStart(2, '0');
  const item = (tab, ic, label, n, alert) => `
    <span class="qai__item" data-open-deal="${i}" data-tab="${tab}">
      ${icon(ic, 15)}<span class="qai__label">${label}</span>
      <span class="qai__n ${alert ? 'is-alert' : ''}">${pad(n)}${alert ? '<i class="qai__dot"></i>' : ''}</span>
    </span>`;
  return `
    <div class="qai t-body-sm">
      ${item('tasks', 'alarm', 'Action tasks', d.tasks, false)}
      <span class="qai__sep">-</span>
      ${item('notes', 'bubble', 'Notes', d.notes, d.notesUnread > 0)}
      <span class="qai__sep">-</span>
      ${item('activity', 'history', 'Activity', d.events, false)}
    </div>`;
};

/* ---------- Deal panel: Tasks / Notes / Activity ---------------------------
   Full-height overlay on the right. Content is mock, derived from the deal so
   each one tells its own story.
   -------------------------------------------------------------------------- */

const avatarDot = (who, cls = '') => {
  const palette = ['var(--brand-600)', 'var(--accent-orange)', '#E8457C', '#0E9F6E', 'var(--info-base)'];
  const hue = palette[[...who[0]].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
  return `<span class="dp-av ${cls}" style="background:${hue}">${who[0]}</span>`;
};

const panelTasks = (d) => {
  const rejected = DOC_TYPES.filter((t, i) => d.docs[i] === 'rejected');
  const pending  = DOC_TYPES.filter((t, i) => d.docs[i] === 'pending');
  const mate = d.associate || d.assigned;

  const open = [];
  rejected.forEach(t => open.push([`Re-request ${t.toLowerCase()} — previous upload rejected`, d.assigned, 'Overdue by 2 days', 'overdue']));
  pending.slice(0, 2).forEach(t => open.push([`Chase ${t.toLowerCase()} from the client`, mate, 'Due tomorrow', 'due']));
  open.push([`Book follow-up call with ${d.name.split(' ')[0]}`, d.assigned, 'Due 28/01/26', 'open']);
  if (d.lender) open.push([`Send updated figures to ${d.lender[1]}`, mate, 'Due 30/01/26', 'open']);

  const done = [
    [`Verify ID document`, d.assigned, 'Completed 19/01/26'],
    [`Log initial enquiry`, d.assigned, 'Completed 15/01/26']
  ];

  const task = ([title, who, due, state], checked) => `
    <div class="dp-task ${checked ? 'is-done' : ''}">
      <span class="dp-check ${checked ? 'is-on' : ''}">${checked ? icon('check-sm', 11) : ''}</span>
      <div class="dp-task__body">
        <div class="dp-task__title t-body-md">${title}</div>
        <div class="dp-task__meta t-body-sm">
          ${avatarDot(who, 'dp-av--xs')}<span>${who[1]}</span>
          <span class="dp-dot">·</span>
          <span class="dp-due dp-due--${state || 'done'}">${due}</span>
        </div>
      </div>
    </div>`;

  return `
    <div class="dp-actionbar">
      <span class="dp-addbtn t-label-md">${icon('plus', 14)} Add task</span>
      <span class="dp-filter t-body-sm">All assignees ${icon('chevron-down', 12)}</span>
    </div>
    <div class="dp-section t-overline">Open · ${open.length}</div>
    ${open.map(t => task(t, false)).join('')}
    <div class="dp-section t-overline">Completed · ${done.length}</div>
    ${done.map(t => task(t, true)).join('')}`;
};

const panelNotes = (d) => {
  const mate = d.associate || d.assigned;
  const first = d.name.split(' ')[0];
  const notes = [
    [d.assigned, 'Today 9:33am',
     `Spoke with ${first}. Happy to proceed at the current rate. <span class="dp-tag">@${mate[1]}</span> can you prep the submission pack?`,
     null],
    [mate, 'Yesterday 4:12pm',
     `Uploaded the latest payslips — the first set was the wrong pay period.`,
     'Payslips-Jan-2026.pdf'],
    [d.assigned, '20/01/26 11:05am',
     `${d.lender ? d.lender[1] + ' flagged' : 'Credit flagged'} that we need an updated asset quote before assessment.`,
     null],
    [mate, '18/01/26 2:40pm',
     `Initial call done. ${first} is comparing two lenders, decision expected this week.`,
     null]
  ];

  const note = ([who, when, body, file]) => `
    <div class="dp-note">
      ${avatarDot(who)}
      <div class="dp-note__body">
        <div class="dp-note__head">
          <span class="t-label-md">${who[1]}</span>
          <span class="dp-note__time t-body-sm">${when}</span>
        </div>
        <div class="dp-note__text t-body-md">${body}</div>
        ${file ? `<span class="dp-file t-body-sm">${icon('paperclip', 13)} ${file}</span>` : ''}
      </div>
    </div>`;

  return `
    ${notes.map(note).join('')}
    <div class="dp-composer">
      <div class="dp-composer__field t-body-md">Write a note…</div>
      <div class="dp-composer__tools">
        <span class="dp-tool t-body-sm">@ Tag someone</span>
        <span class="dp-tool t-body-sm">${icon('paperclip', 13)} Attach</span>
        <span class="dp-send">${icon('send', 14)}</span>
      </div>
    </div>`;
};

const panelActivity = (d) => {
  const mate = d.associate || d.assigned;
  const st = stageOf(d);
  const first = d.name.split(' ')[0];
  const rows = [
    ['status', `Stage moved to ${st.label}`, 'System', `${relativeDate(d.activity)} ${d.activityTime}`],
    ['broker', d.activityText, d.assigned[1], `${relativeDate(d.activity)} ${d.activityTime}`],
    ['client', `${first} uploaded a document`, 'Client', 'Yesterday 4:12pm'],
    ...(d.lender ? [['lender', `${d.lender[1]} acknowledged the submission`, 'Lender', '20/01/26 1:20pm']] : []),
    ['broker', `${mate[1]} added a file note`, mate[1], '20/01/26 11:05am'],
    ...(d.partner ? [['partner', `Referred by ${d.partner[1]}`, 'Partner', `${d.created}`]] : []),
    ['status', `Application created`, 'System', d.created]
  ];

  const row = ([kind, text, who, when]) => `
    <div class="dp-ev">
      <span class="dp-ev__rail"><i class="dp-ev__dot dp-ev__dot--${kind}"></i></span>
      <div class="dp-ev__body">
        <div class="dp-ev__text t-body-md">${text}</div>
        <div class="dp-ev__meta t-body-sm">
          <span class="dp-kind dp-kind--${kind}">${who}</span>
          <span class="dp-dot">·</span>${when}
        </div>
      </div>
    </div>`;

  return `<div class="dp-timeline">${rows.map(row).join('')}</div>`;
};

/* Broker Assist as a panel section rather than its own floating card — same
   summary, same vocabulary, just living inside the quick-view sidebar. */
const panelAssist = (d) => {
  const s = hailoSummary(d);
  const li = (a) => a.map(x => `<li>${x}</li>`).join('');
  return `
    <div class="dp-assist">
      <div class="hailo-msg t-body-md">Where is this one up to?</div>

      <div class="hailo-card">
        <div class="hailo-card__h t-label-sm">${icon('check-sm', 12)} Done in the last 7 days</div>
        <ul class="hailo-list t-body-md">${li(s.done)}</ul>
      </div>

      <div class="hailo-card hailo-card--next">
        <div class="hailo-card__h t-label-sm">${icon('bolt', 12)} Next priority</div>
        <ul class="hailo-list t-body-md">${li(s.next)}</ul>
      </div>

      <div class="hailo-sugg">
        ${s.chips.map(c => `<span class="hailo-sugg__chip t-body-sm">${icon(c[0], 12)} ${c[1]}</span>`).join('')}
      </div>
    </div>`;
};

const PANEL_TABS = {
  tasks:    { label: 'Action tasks', render: panelTasks,    count: (d) => d.tasks },
  notes:    { label: 'Notes',        render: panelNotes,    count: (d) => d.notes },
  activity: { label: 'Activity',     render: panelActivity, count: (d) => d.events },
  /* No count — a summary is one thing, so a number would say nothing. */
  assist:   { label: 'Broker Assist', render: panelAssist,  glyph: 'assist' }
};

/* Which sections the panel offers. v2 folds Broker Assist in; the others
   keep it as its own card. */
const PANEL_SETS = {
  base:   ['tasks', 'notes', 'activity'],
  assist: ['tasks', 'notes', 'activity', 'assist']
};

const dealPanelInner = (d, tab, keys = PANEL_SETS.base) => `
  <div class="dp__head">
    <div style="flex:1;min-width:0">
      <!-- The panel names itself first; the deal is the subject under it. -->
      <div class="t-h4 dp__title">Quick actions</div>
      <div class="t-label-lg dp__name">${d.name}</div>
      <div class="t-body-sm dp__meta">
        ${d.ref} &nbsp;·&nbsp; ${money(d.amount)} &nbsp;·&nbsp; ${d.product}
      </div>
    </div>
    <span class="dp__close" title="Close">${icon('close', 15)}</span>
  </div>
  <div class="dp__tabs">
    ${keys.map(k => {
      const t = PANEL_TABS[k];
      return `
      <span class="dp__tab ${k === tab ? 'is-active' : ''} ${t.glyph ? 'dp__tab--glyph' : ''}" data-tab="${k}">
        ${t.glyph ? `<span class="dp__tabmark">${icon(t.glyph, 13)}</span>` : ''}${t.label}
        ${t.count ? `<span class="dp__tabn">${String(t.count(d)).padStart(2, '0')}</span>` : ''}
      </span>`;
    }).join('')}
  </div>
  <div class="dp__body">${PANEL_TABS[tab].render(d)}</div>
  ${tab === 'assist' ? `
    <div class="dp__ask t-body-md">
      <span>Ask Broker Assist about this deal&hellip;</span>
      <span class="hailo-send">${icon('send', 14)}</span>
    </div>` : ''}`;

/* Four status boxes — the colour-coded take on the documents cell. */
const docBoxes = (d) => {
  const c = docCounts(d);
  const pad = (v) => String(v).padStart(2, '0');
  /* Each status keeps its slot so the four always sit in the same places.
     An empty one collapses to a bare dash — no box, no label. */
  const box = (k, label) =>
    c[k] === 0
      ? `<span class="docbox docbox--empty">–</span>`
      : `<span class="docbox docbox--${k}"><b>${pad(c[k])}</b>${label}</span>`;
  return `<div class="docboxes">
      ${box('review', 'Review')}${box('rejected', 'Rejected')}
      ${box('ok', 'Complete')}${box('pending', 'Pending')}
    </div>`;
};

/* Fuller document meter: counts sit inside their own segments, with a legend
   underneath. Used by v1; v2 uses the status boxes above. */
const docMeter = (d) => {
  const c = docCounts(d), n = d.docs.length;
  const pct = (k) => (c[k] / n) * 100;
  const pad = (v) => String(v).padStart(2, '0');

  /* Only label a segment that is wide enough to hold two digits. */
  const seg = (k, labelled) =>
    c[k] === 0 ? '' :
    `<i class="docbar__seg docbar__seg--${k}" style="width:${pct(k).toFixed(1)}%">${
      labelled && pct(k) >= 8 ? pad(c[k]) : ''}</i>`;

  const key = (k, label) =>
    c[k] === 0 ? '' :
    `<span class="docbar__key t-body-sm"><i class="docbar__dot docbar__dot--${k}"></i>${label}</span>`;

  return `
    <div class="docbar">
      <div class="docbar__track">
        ${seg('ok', false)}
        ${seg('review', true)}
        ${seg('rejected', true)}
        ${seg('pending', false)}
      </div>
      <div class="docbar__cap">
        <span class="docbar__count t-label-sm">${c.ok} of ${n}</span>
        ${key('review', 'Review')}
        ${key('rejected', 'Rejected')}
        <span class="docbar__pending t-label-sm">${pad(c.pending)} Pending</span>
      </div>
    </div>`;
};


/* ---------- Hailo: per-deal summary, generated from the same data ---------- */

function hailoSummary(d) {
  const named = (s) => DOC_TYPES.filter((t, i) => d.docs[i] === s);
  const approved = named('ok'), rejected = named('rejected'),
        review = named('review'), pending = named('pending');
  /* Lowercase for prose, but leave acronyms like "ID" alone. */
  const lc = (s) => (s === s.toUpperCase() ? s : s.toLowerCase());
  const list = (a) => a.map(lc).join(', ').replace(/, ([^,]*)$/, ' and $1');

  const done = [];
  if (approved.length) done.push(`<b>${approved.length} approved</b> — ${list(approved.slice(0, 3))}${approved.length > 3 ? ` +${approved.length - 3} more` : ''}`);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  if (rejected.length) done.push(`${cap(list(rejected))} came back <b>rejected</b> — client must resend`);
  if (review.length)   done.push(`${cap(list(review))} uploaded, now in review`);
  done.push(`${d.events} activities logged, last on ${d.activity}`);

  const next = [];
  if (rejected.length)      next.push(`<b>Re-request ${lc(rejected[0])}</b> — blocking submission`);
  if (pending.length)       next.push(`${pending.length} still outstanding: ${list(pending.slice(0, 2))}${pending.length > 2 ? '…' : ''}`);
  if (!rejected.length && !pending.length) next.push(`<b>All documents collected</b> — ready to submit to the lender`);
  next.push(`Day ${d.day} of contact · ${d.stage.toLowerCase()}`);

  const chips = [];
  if (rejected.length) chips.push([ 'mail', 'Draft the re-request email' ]);
  else if (pending.length) chips.push([ 'mail', `Chase the ${pending.length} outstanding docs` ]);
  else chips.push([ 'send', 'Prepare the lender submission' ]);
  chips.push([ 'clock', 'Book a follow-up' ], [ 'note', 'Log a file note' ]);

  return { done, next, chips };
}

function hailoPanelInner(d) {
  const s = hailoSummary(d);
  const li = (a) => a.map(x => `<li>${x}</li>`).join('');
  return `
    <div class="hailo__head">
      <span class="hailo__mark">${icon('assist', 18)}</span>
      <div style="flex:1;min-width:0">
        <div class="t-label-md" style="color:var(--text-primary)">Broker Assist</div>
        <div class="t-caption" style="color:var(--text-tertiary)">Summarising ${d.name}</div>
      </div>
      <span class="hailo__close" title="Close">${icon('close', 14)}</span>
    </div>

    <div class="hailo__body">
      <div class="hailo-msg t-body-md">Where is this one up to?</div>

      <div class="hailo-card">
        <div class="hailo-card__h t-label-sm">${icon('check-sm', 12)} Done in the last 7 days</div>
        <ul class="hailo-list t-body-md">${li(s.done)}</ul>
      </div>

      <div class="hailo-card hailo-card--next">
        <div class="hailo-card__h t-label-sm">${icon('bolt', 12)} Next priority</div>
        <ul class="hailo-list t-body-md">${li(s.next)}</ul>
      </div>

      <div class="hailo-sugg">
        ${s.chips.map(c => `<span class="hailo-sugg__chip t-body-sm">${icon(c[0], 12)} ${c[1]}</span>`).join('')}
      </div>
    </div>

    <div class="hailo__input t-body-md">
      <span>Ask Broker Assist about this deal&hellip;</span>
      <span class="hailo-send">${icon('send', 14)}</span>
    </div>`;
}

/* Shared: wires every .ai-btn to the #hailo popup. Any version that renders
   both picks up the behaviour without its own controller. */
function mountHailo(app) {
  const panel = app.querySelector('#hailo');
  if (!panel) return null;
  let open = null;

  const setOpen = (idx) => {
    open = idx;
    app.querySelectorAll('[data-deal-row]').forEach(r =>
      r.classList.toggle('is-active', Number(r.dataset.dealRow) === idx));
    app.querySelectorAll('.ai-btn').forEach(b =>
      b.classList.toggle('is-on', Number(b.dataset.dealBtn) === idx));

    if (idx === null) { panel.classList.remove('is-open'); return; }
    panel.innerHTML = hailoPanelInner(DEALS[idx]);
    panel.classList.add('is-open');
    panel.querySelector('.hailo__close').addEventListener('click', () => setOpen(null));
  };

  app.querySelectorAll('.ai-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = Number(btn.dataset.dealBtn);
      setOpen(open === i ? null : i);
    });
  });

  /* Clicking anywhere off the popup dismisses it, as a popup should. */
  app.addEventListener('click', (e) => {
    if (open !== null && !panel.contains(e.target)) setOpen(null);
  });

  return setOpen;
}


/* ==========================================================================
   v1 — priority pipeline, with a sticky column chooser and the
   quick-action columns restored. No contextual CTA.
   ========================================================================== */

/* Avatar + name + dismiss, in one pill. `who` is [initials, name] or null.
   The avatar colour is derived from the initials so a person keeps the same
   colour everywhere they appear. */
function personChip(who) {
  if (!who) return `<span class="chip-person chip-person--empty t-body-sm">${icon('plus', 12)} Assign</span>`;
  const [initials, name] = who;
  const palette = ['var(--brand-600)', 'var(--accent-orange)', '#E8457C', '#0E9F6E', 'var(--info-base)'];
  const hue = palette[[...initials].reduce((a, ch) => a + ch.charCodeAt(0), 0) % palette.length];
  return `
    <span class="chip-person">
      <span class="chip-person__av" style="background:${hue}">${initials}</span>
      <span class="chip-person__name t-body-sm">${name}</span>
      <span class="chip-person__x">${icon('close', 12)}</span>
    </span>`;
}

/* Shared column-chooser markup; `cols` is [label, isOn]. */
function colPanel(cols) {
  const row = ([label, on]) => `
    <div class="colpanel__row ${on ? '' : 'colpanel__row--off'} t-body-md">
      <span class="colpanel__box ${on ? 'colpanel__box--on' : ''}">${on ? icon('check-sm', 12) : ''}</span>${label}
    </div>`;
  return `
    <div class="colpanel__title t-label-sm" style="text-transform:uppercase;letter-spacing:.06em">Columns in this view</div>
    ${cols.map(row).join('')}
    <div class="colpanel__foot">
      <span class="btn btn--primary t-label-md" style="height:34px;padding:0 16px">Apply</span>
      <span class="btn btn--secondary t-label-md" style="height:34px;padding:0 16px">Reset</span>
    </div>`;
}

/* One worklist renderer, two skins. `colourful` swaps the documents cell for
   status boxes and paints each stage container in its own hue. */
function renderWorklist(opts = {}) {
  const colourful = !!opts.colourful;
  const splitActions = !!opts.splitActions;
  const inlineActions = !!opts.inlineActions;

  /* Grouped by the master pipeline stage. Snoozed is broker-set, so it wins
     over whatever stage the application is technically in. */
  const bucket = (d) => (d.snoozed ? 'snoozed' : d.master);

  /* `kind` + `idx` make the pill a popup trigger — see js/popups.js. */
  const pill = (ic, label, n, on, kind, idx) => `
    <span class="v1-pill ${on ? 'v1-pill--on' : ''} t-body-sm"
          ${kind ? `data-pop="${kind}" data-deal="${idx}"` : ''}>
      ${icon(ic, 13)}${label}<span class="v1-pill__n t-label-sm">${String(n).padStart(2, '0')}</span>
      ${on ? '<span class="v1-pill__dot"></span>' : ''}
    </span>`;

  const row = (d) => {
    const c = docCounts(d);
    const i = DEALS.indexOf(d);
    return `
    <div class="v1-row v1-grid" data-deal-row="${i}">

      <span class="v1-checkcell"><span class="v1-check" data-check="${i}"></span></span>

      <!-- Lead details: name + application number -->
      <div class="v1-lead" style="gap:2px;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;min-width:0">
          ${d.pinned ? `<span style="color:var(--text-brand);display:flex">${icon('pin', 13)}</span>` : ''}
          <span class="v1-lead__name t-label-md" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.name}</span>
        </div>
        <div class="t-body-sm" style="color:var(--text-tertiary);white-space:nowrap">${d.ref}</div>
      </div>

      ${contactButtons()}

      <!-- Loan details: amount + loan type -->
      <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
        <span class="t-label-md" style="color:var(--text-primary);white-space:nowrap">${money(d.amount)}</span>
        <span class="t-body-sm" style="color:var(--text-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.product}</span>
      </div>

      ${colourful ? docBoxes(d) : docMeter(d)}

      ${splitActions
        ? `${tasksCell(d)}${notesCell(d)}${activityCell(d)}`
        : inlineActions
        ? qaInline(d, i)
        : `<div class="v1-acts">
             ${pill('clock', 'Tasks', d.tasks, false, 'tasks', i)}
             ${pill('note', 'Notes', d.notes, d.unread, 'notes', i)}
             ${pill('activity', 'Activity', d.events, false, 'activity', i)}
           </div>`}

      <!-- Last updated: how long ago, with the date underneath -->
      <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
        <span class="t-body-md" style="color:var(--text-primary);white-space:nowrap">${relativeDate(d.activity)}</span>
        <span class="t-body-sm" style="color:var(--text-tertiary);white-space:nowrap">${d.activity}</span>
      </div>

      <div>${subStageTag(d)}</div>

      <span class="t-body-md" style="color:var(--text-secondary)">${d.created}</span>

      <span class="t-body-md" style="color:${d.settlement ? 'var(--text-primary)' : 'var(--text-placeholder)'}">${d.settlement || '—'}</span>

      ${personChip(d.assigned)}
      ${personChip(d.associate)}
      ${personChip(d.lender)}
      ${personChip(d.partner)}

      <span class="v1-sticky">
        <span class="ai-btn" data-deal-btn="${i}" title="Ask Broker Assist to summarise this deal">${icon('assist', 18)}</span>
        <span class="v1-kebab">${icon('kebab')}</span>
      </span>
    </div>`;
  };

  /* Each master stage is its own container, so the sections read as distinct
     blocks rather than as one continuous list with headings in it. */
  const group = (g) => {
    const items = DEALS.filter(d => bucket(d) === g.id);
    if (!items.length) return '';
    return `
      <section class="v1-stage ${g.custom ? 'v1-stage--muted' : ''} ${g.collapsed ? 'is-collapsed' : ''}"
               data-stage="${g.id}"
               ${colourful && g.tint ? `style="--stage-tint:${g.tint};--stage-ink:${g.ink};--stage-key:${g.colour}"` : ''}>
        <div class="v1-group v1-group--toggle">
          <span class="v1-group__chev">${icon('chevron-down', 16)}</span>
          ${g.glyph
            ? `<span class="v1-group__glyph">${icon(g.glyph, 17)}</span>`
            : `<span class="vx-dot" style="background:${g.colour}"></span>`}
          <span class="t-h4" ${colourful && g.ink ? `style="color:${g.ink}"` : ''}>${g.label}</span>
        </div>
        ${items.map(row).join('')}
      </section>`;
  };

  const COLUMNS = [
    ['Lead details', true], ['Contact', true], ['Loan details', true], ['Documents', true],
    ...(splitActions ? [['Tasks', true], ['Notes', true], ['Activity', true]] : [['Quick actions', true]]), ['Last updated', true], ['Sub-stage', true],
    ['Date created', true], ['Projected settlement', true],
    ['Assigned broker', true], ['Associate broker', true], ['Lender', true], ['Partner', true],
    ['AI assist', true], ['Last contacted', false], ['Referrer', false], ['Next action', false]
  ];

  return `
  ${navBar()}
  <div class="vx-bar vx-bar--views">
    ${viewName()}
    ${filterBtn()}
    ${portfolio()}
    ${viewToggle()}
    <span class="vx-spacer"></span>
    ${newActionBtn()}
  </div>

  <div class="vx-content">
    <div class="v1-scroll">
      <div class="v1-headwrap">
      <div class="v1-head v1-grid t-overline">
        <span class="v1-checkcell"><span class="v1-check" id="v1checkall" title="Select all"></span></span>
        <span>Lead details</span><span>Contact</span><span>Loan details</span><span>Documents</span>
        ${splitActions ? '<span class="qh--tasks">Tasks</span><span>Notes</span><span class="qh--activity">Activity</span>' : '<span>Quick actions</span>'}<span>Last updated</span><span>Sub-stage</span>
        <span>Date created</span><span>Projected settlement</span>
        <span>Assigned broker</span><span>Associate broker</span><span>Lender</span><span>Partner</span>
        <!-- Sticky: stays pinned to the right edge when the table scrolls -->
        <span class="v1-sticky"><span class="v1-cog" id="v1cog" title="Customise columns">${icon('sliders', 15)}</span></span>
      </div>
      </div>
      ${MASTER_STAGES.map(group).join('')}
    </div>
  </div>

  <div class="colpanel" id="v1panel" style="top:214px;right:28px">${colPanel(COLUMNS)}</div>
  <aside class="hailo" id="hailo"></aside>

  <!-- Full-height deal panel: Tasks / Notes / Activity -->
  <aside class="dp" id="dealpanel"></aside>

  <!-- Floating row popup: Tasks / Notes / Activity -->
  <div class="pop" id="rowpop"></div>

  <!-- Full-screen application view, opened by clicking into a deal -->
  <div class="av" id="appview"></div>`;
}

function mountV1(app, opts = {}) {
  /* With Broker Assist folded into the sidebar there is nothing left for the
     floating card to do, so v2 does not wire it up at all. */
  const assistInPanel = !!opts.assistInPanel;
  const setOpen = assistInPanel ? null : mountHailo(app);

  /* The customise control is clickable: it toggles the column checklist,
     and each row in the checklist toggles its own tick. */
  const cog = app.querySelector('#v1cog');
  const panel = app.querySelector('#v1panel');

  const setPanel = (on) => {
    panel.classList.toggle('is-open', on);
    cog.classList.toggle('is-on', on);
  };

  cog.addEventListener('click', (e) => {
    e.stopPropagation();
    const opening = !panel.classList.contains('is-open');
    if (opening && setOpen) setOpen(null);   // never stack the two overlays
    setPanel(opening);
  });

  panel.addEventListener('click', (e) => {
    e.stopPropagation();
    const r = e.target.closest('.colpanel__row');
    if (!r) return;
    const off = r.classList.toggle('colpanel__row--off');
    const box = r.querySelector('.colpanel__box');
    box.classList.toggle('colpanel__box--on', !off);
    box.innerHTML = off ? '' : icon('check-sm', 12);
  });

  app.addEventListener('click', () => setPanel(false));

  /* Deal panel: any of the inline quick actions opens it on that tab, and the
     tabs switch within it. Mutually exclusive with the other two overlays. */
  const dp = app.querySelector('#dealpanel');
  let dpDeal = null;

  const tabKeys = assistInPanel ? PANEL_SETS.assist : PANEL_SETS.base;

  /* Which row the panel is about, and — when Broker Assist lives in it —
     which AI button is holding it open. */
  const markRow = (idx, tab) => {
    app.querySelectorAll('[data-deal-row]').forEach(r =>
      r.classList.toggle('is-active', Number(r.dataset.dealRow) === idx));
    app.querySelectorAll('.ai-btn').forEach(b =>
      b.classList.toggle('is-on', assistInPanel && tab === 'assist' && Number(b.dataset.dealBtn) === idx));
  };

  const closeDp = () => {
    dp.classList.remove('is-open');
    dpDeal = null;
    markRow(null, null);
  };

  const renderPanel = (idx, tab) => {
    dpDeal = idx;
    dp.innerHTML = dealPanelInner(DEALS[idx], tab, tabKeys);
    dp.classList.add('is-open');
    markRow(idx, tab);
    dp.querySelector('.dp__close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeDp();
    });
    dp.querySelectorAll('.dp__tab').forEach(t => t.addEventListener('click', (e) => {
      e.stopPropagation();
      renderPanel(dpDeal, t.dataset.tab);
    }));
  };

  if (dp) {
    app.querySelectorAll('[data-open-deal]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (setOpen) setOpen(null);          // never stack overlays
        renderPanel(Number(el.dataset.openDeal), el.dataset.tab);
      });
    });
    /* The AI button is the fourth way into the same sidebar — it opens the
       panel on Broker Assist rather than floating its own card. */
    if (assistInPanel) {
      app.querySelectorAll('.ai-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const i = Number(btn.dataset.dealBtn);
          const alreadyHere = dpDeal === i && dp.querySelector('.dp__tab.is-active')?.dataset.tab === 'assist';
          if (alreadyHere) { closeDp(); return; }
          renderPanel(i, 'assist');
        });
      });
    }

    dp.addEventListener('click', (e) => e.stopPropagation());
    app.addEventListener('click', closeDp);
  }

  /* Collapsible stages — currently only Snoozed, which starts collapsed. */
  app.querySelectorAll('.v1-group--toggle').forEach(head => {
    head.addEventListener('click', (e) => {
      e.stopPropagation();
      head.closest('.v1-stage').classList.toggle('is-collapsed');
    });
  });

  /* Multi-select. Row boxes toggle themselves; the header box selects or
     clears everything and shows a dash while the selection is partial. */
  const boxes = [...app.querySelectorAll('.v1-check[data-check]')];
  const selectAll = app.querySelector('#v1checkall');

  const paint = (box, on) => {
    box.classList.toggle('is-checked', on);
    box.innerHTML = on ? icon('check-sm', 12) : '';
    const r = box.closest('.v1-row');
    if (r) r.classList.toggle('is-selected', on);
  };

  const syncHeader = () => {
    const n = boxes.filter(b => b.classList.contains('is-checked')).length;
    selectAll.classList.toggle('is-checked', n > 0);
    selectAll.innerHTML = n === 0 ? ''
      : n === boxes.length ? icon('check-sm', 12)
      : '<span class="v1-dash"></span>';
  };

  boxes.forEach(box => box.addEventListener('click', (e) => {
    e.stopPropagation();
    paint(box, !box.classList.contains('is-checked'));
    syncHeader();
  }));

  selectAll.addEventListener('click', (e) => {
    e.stopPropagation();
    const turnOn = boxes.some(b => !b.classList.contains('is-checked'));
    boxes.forEach(b => paint(b, turnOn));
    syncHeader();
  });

  /* Flag the scroll container once it has moved, so the pinned cells only
     cast an edge when something is genuinely tucked behind them. */
  const scroller = app.querySelector('.v1-scroll');
  if (scroller) {
    const sync = () => scroller.classList.toggle('is-scrolled', scroller.scrollLeft > 0);
    scroller.addEventListener('scroll', sync, { passive: true });
    sync();
  }

  /* The two overlays are mutually exclusive — opening Hailo dismisses the
     column list rather than stacking one popup on top of the other. */
  app.querySelectorAll('.ai-btn').forEach(b =>
    b.addEventListener('click', () => setPanel(false)));

  /* Row popups — Tasks / Notes / Activity. They close the other two overlays
     on the way up, and the cog closes them in turn. */
  const closePop = mountPopups(app, () => { setPanel(false); if (setOpen) setOpen(null); });
  if (closePop) {
    cog.addEventListener('click', closePop);
    app.querySelectorAll('.ai-btn').forEach(b => b.addEventListener('click', closePop));
  }

  /* Clicking into a deal opens the full application view. v1 only: the
     other versions are list experiments and stop at the row. */
  if (opts.appView) mountAppView(app);

  /* Nothing opens on load — the view lands clean, and the column chooser is
     one click on the cog. */
}

/* ---------- Mount ---------- */

const renderV1 = () => renderWorklist();
const renderV2 = () => renderWorklist({ colourful: true, inlineActions: true });
const renderV3 = () => renderWorklist({ splitActions: true });

const RENDERERS = { v1: renderV1, v2: renderV2, v3: renderV3 };
/* Every version opens a deal into the application view now; v2 keeps its
   own difference, which is Broker Assist living in the quick-view sidebar
   rather than floating as its own card. */
const MOUNTERS  = {
  v1: (app) => mountV1(app, { appView: true }),
  v2: (app) => mountV1(app, { appView: true, assistInPanel: true }),
  v3: (app) => mountV1(app, { appView: true })
};

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  const fn = RENDERERS[window.VARIANT];
  if (!app || !fn) return;
  app.innerHTML = fn();
  const mount = MOUNTERS[window.VARIANT];
  if (mount) mount(app);
});
