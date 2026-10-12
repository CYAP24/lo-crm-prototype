/* ==========================================================================
   Row popups — Tasks / Notes / Activity (v1)
   ------------------------------------------------------------------------
   Clicking one of the three quick-action pills on a row floats a card next
   to it. The cards are static mock-ups of the three designed screens; only
   the content varies, seeded off the deal so every row reads differently
   but the same row always reads the same way.
   ========================================================================== */

/* Deterministic PRNG — same deal, same story, every reload. */
function seeded(seed) {
  let s = seed * 2654435761 % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = s * 16807 % 2147483647) / 2147483647;
}
const pickFrom = (rng) => (arr) => arr[Math.floor(rng() * arr.length) % arr.length];

const LOREM = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.',
  'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua, ut enim ad minim veniam.',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.'
];

const TASK_TITLES = [
  'Verify privacy documents', 'Request additional bank statements', 'Confirm employment details',
  'Re-request Driver Licence (back)', 'Chase outstanding payslips', 'Book follow-up call',
  'Review asset quote', 'Send updated figures to lender', 'Upload signed privacy consent',
  'Confirm deposit amount', 'Check serviceability calculator', 'Prepare submission pack'
];

const DONE_TITLES = [
  'Verify identity document', 'Log initial enquiry', 'Send welcome pack',
  'Confirm loan purpose', 'Record consent to credit check'
];

const ACTIVITY_LINES = [
  'Personal Document rejected', 'Application assigned to Sarah M.',
  'Requested additional documentation for employment verification',
  'Stage moved to Discovery', 'Privacy consent received',
  'Submission pack sent to lender', 'Conditional approval received',
  'Client uploaded 2 documents', 'Follow-up call scheduled'
];

const COMMENTS = [
  'Initial application review completed. All primary documents received and verified. Personal Document is missing back of Driver’s Licence.',
  'Spoke with the client, happy to proceed at the current rate. Submission pack to follow once the final payslip lands.',
  'Lender has come back asking for an updated asset quote before assessment can continue.',
  'Documents re-checked after the second upload. Pay period now matches the application.'
];

const PEOPLE = [['SM', 'Sarah M.'], ['KZ', 'Kenn Z.'], ['JF', 'Jess F.'], ['CE', 'Cara E.'], ['DP', 'Dev P.'], ['RH', 'Ruby H.']];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* Dates are drawn from a small window around the deal's own dates so the
   timeline stays plausible rather than scattered across the year. */
const shortDate = (day) => `${String(day).padStart(2, '0')}/01/26`;
const longDate  = (day) => `${day} ${MONTHS[0]} 2026`;
const timeOf = (rng) => {
  const h = 9 + Math.floor(rng() * 8);
  const m = Math.floor(rng() * 60);
  return `${h > 12 ? h - 12 : h}:${String(m).padStart(2, '0')}${h >= 12 ? 'pm' : 'am'}`;
};

const popAv = (who, cls = '') => {
  const palette = ['var(--brand-600)', 'var(--accent-orange)', '#E8457C', '#0E9F6E', 'var(--info-base)'];
  const hue = palette[[...who[0]].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
  return `<span class="pop-av ${cls}" style="background:${hue}">${who[0]}</span>`;
};

/* ---------- Next required actions ---------------------------------------- */

function popTasks(d, i) {
  const rng = seeded(i + 11);
  const pick = pickFrom(rng);
  const n = 3 + Math.floor(rng() * 2);

  /* Titles are drawn without replacement so a card never repeats itself. */
  const pool = [...TASK_TITLES];
  const titles = [];
  while (titles.length < n && pool.length) titles.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);

  const task = (title) => {
    const created = shortDate(12 + Math.floor(rng() * 6));
    const due = shortDate(26 + Math.floor(rng() * 5));
    const by = pick(PEOPLE);
    const to = pick(PEOPLE);
    return `
      <div class="pop-task">
        <span class="pop-radio"></span>
        <div class="pop-task__body">
          <div class="pop-task__title t-body-md">${title}</div>
          <div class="pop-task__desc t-body-sm">${pick(LOREM)}</div>
          <div class="pop-task__meta t-body-sm">
            ${popAv(by)}<span class="pop-meta-label">Created</span><span class="pop-meta-val">${created}</span>
            <span class="pop-meta-label">Date due</span>
            <span class="pop-due">${due}<i class="pop-due__x">×</i></span>
            <span class="pop-meta-label">Assigned to</span>${popAv(to)}
          </div>
        </div>
        <span class="pop-kebab">${icon('kebab', 14)}</span>
      </div>`;
  };

  const done = (title) => `
    <div class="pop-task pop-task--done">
      <span class="pop-tick">${icon('check-sm', 11)}</span>
      <div class="pop-task__title t-body-md">${title}</div>
    </div>`;

  return {
    glyph: 'alarm',
    title: 'Next required actions',
    add: true,
    cls: 'pop--tasks',
    body: titles.map(task).join('') + done(pick(DONE_TITLES))
  };
}

/* ---------- Activity ------------------------------------------------------ */

function popActivity(d, i) {
  const rng = seeded(i + 29);
  const pick = pickFrom(rng);

  let day = 20 + Math.floor(rng() * 2);
  const stamp = () => {
    const out = { date: longDate(day), time: timeOf(rng), who: pick(PEOPLE)[1] };
    if (rng() > 0.55) day -= 1 + Math.floor(rng() * 3);
    return out;
  };

  const comment = () => {
    const s = stamp();
    return `
      <div class="pop-ev pop-ev--comment">
        <span class="pop-ev__badge pop-ev__badge--brand">${icon('bubble', 13)}</span>
        <div class="pop-ev__body">
          <div class="pop-ev__stamp t-body-sm">
            <span class="pop-ev__date">${s.date}</span> <span class="pop-ev__time">${s.time}</span>
            <span class="pop-ev__by">by ${s.who}</span>
          </div>
          <div class="pop-ev__text t-body-sm">${pick(COMMENTS)}</div>
        </div>
      </div>`;
  };

  const logged = (text, group) => {
    const s = stamp();
    return `
      <div class="pop-ev">
        <span class="pop-ev__badge">${icon('history', 13)}</span>
        <div class="pop-ev__body">
          <div class="pop-ev__stamp t-body-sm">
            <span class="pop-ev__date">${s.date}</span> <span class="pop-ev__time">${s.time}</span>
            <span class="pop-ev__by">by ${s.who}</span>
          </div>
          <div class="pop-ev__text pop-ev__text--log t-body-sm">
            ${group ? `<span class="pop-ev__chev">${icon('chevron-down', 11)}</span>` : ''}${text}
          </div>
        </div>
      </div>`;
  };

  const rows = [comment()];
  const lines = [...ACTIVITY_LINES];
  const n = 3 + Math.floor(rng() * 2);
  for (let k = 0; k < n; k++) {
    const text = lines.splice(Math.floor(rng() * lines.length), 1)[0];
    rows.push(logged(text, k === 1));
  }
  rows.push(logged(`Application assigned to ${pick(PEOPLE)[1]}`, false));

  return {
    glyph: null,
    title: 'Activity',
    tabs: ['External', 'Internal'],
    cls: 'pop--activity',
    body: rows.join('')
  };
}

/* ---------- Internal notes ------------------------------------------------ */

function popNotes(d, i) {
  const rng = seeded(i + 47);
  const pick = pickFrom(rng);

  let day = 10 + Math.floor(rng() * 3);
  const note = (first) => {
    const who = pick(PEOPLE)[1];
    const row = `
      <div class="pop-note ${first ? 'pop-note--clipped' : ''}">
        ${first ? '' : `<div class="pop-note__head">
          <span class="pop-note__who t-label-sm">${who}</span>
          <span class="pop-note__when t-body-sm">${longDate(day)}</span>
          <span class="pop-note__when t-body-sm">${timeOf(rng)}</span>
          <span class="pop-kebab">${icon('kebab', 14)}</span>
        </div>`}
        <div class="pop-note__text t-body-sm">${pick(LOREM)}</div>
      </div>`;
    day += 1 + Math.floor(rng() * 4);
    return row;
  };

  const n = 4 + Math.floor(rng() * 2);
  const rows = [note(true)];
  for (let k = 0; k < n; k++) rows.push(note(false));

  return {
    glyph: 'rows',
    title: 'Internal notes',
    cls: 'pop--notes',
    composer: true,
    body: rows.join('')
  };
}

const POPUPS = { tasks: popTasks, notes: popNotes, activity: popActivity };

/* ---------- Shell + controller -------------------------------------------- */

function popShell(spec) {
  return `
    <div class="pop__head">
      ${spec.glyph ? `<span class="pop__glyph">${icon(spec.glyph, 15)}</span>` : ''}
      <span class="pop__title t-label-md">${spec.title}</span>
      ${spec.tabs ? `<span class="pop__tabs t-body-sm">
          ${spec.tabs.map((t, k) => `<span class="pop__tab ${k === 0 ? 'is-active' : ''}">${t}</span>`).join('')}
        </span>` : ''}
      <span class="pop__spacer"></span>
      ${spec.add ? `<span class="pop__add" title="Add task">${icon('plus', 15)}</span>` : ''}
      <span class="pop__close" title="Close">${icon('close', 14)}</span>
    </div>
    <div class="pop__body">${spec.body}</div>
    ${spec.composer ? `
      <div class="pop__composer">
        <div class="pop-field t-body-sm">Your note&hellip;</div>
        <span class="pop-send">${icon('send', 14)}</span>
      </div>` : ''}`;
}

/* Wires every `[data-pop]` trigger to the floating card. Only v1 renders
   them, so the other versions pick nothing up. */
function mountPopups(app, closeOthers) {
  const el = app.querySelector('#rowpop');
  if (!el) return null;
  let openKey = null;

  const close = () => {
    openKey = null;
    el.classList.remove('is-open');
    app.querySelectorAll('[data-pop]').forEach(t => t.classList.remove('is-on'));
  };

  const open = (trigger) => {
    const i = Number(trigger.dataset.deal);
    const kind = trigger.dataset.pop;
    const spec = POPUPS[kind](DEALS[i], i);

    el.className = `pop ${spec.cls} is-open`;
    el.innerHTML = popShell(spec);

    /* Anchored under the pill, then nudged back inside the viewport so a
       row near the bottom or the right edge still shows the whole card. */
    const r = trigger.getBoundingClientRect();
    const w = el.offsetWidth, h = el.offsetHeight;
    let left = r.left;
    let top = r.bottom + 8;
    if (left + w > window.innerWidth - 16) left = window.innerWidth - w - 16;
    if (top + h > window.innerHeight - 16) top = Math.max(16, r.top - h - 8);
    el.style.left = `${Math.max(16, left)}px`;
    el.style.top = `${top}px`;

    app.querySelectorAll('[data-pop]').forEach(t => t.classList.remove('is-on'));
    trigger.classList.add('is-on');
    openKey = `${i}:${kind}`;

    el.querySelector('.pop__close').addEventListener('click', (e) => { e.stopPropagation(); close(); });
  };

  app.querySelectorAll('[data-pop]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = `${trigger.dataset.deal}:${trigger.dataset.pop}`;
      if (openKey === key) { close(); return; }
      if (closeOthers) closeOthers();
      open(trigger);
    });
  });

  el.addEventListener('click', (e) => e.stopPropagation());
  app.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  return close;
}
