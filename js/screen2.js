/* ==========================================================================
   Screen 2 — a standalone copy of the application view, to be reworked
   into a different screen.
   --------------------------------------------------------------------------
   A copy of js/appview.js with the `av` prefix renamed to `s2`, so the two
   can diverge without touching each other. It still renders the three
   columns of the Figma frame "Draft #2 - 1920px TO CODE" — 420 / 790 / 420
   with the frame's 113px gutters — and still leans on the shared
   js/data.js and js/icons.js.

   What differs, because this is a screen in its own right rather than an
   overlay the work list opens:
     - it renders itself on load, from DEALS[0], instead of waiting for a
       row to be clicked
     - the close control is gone from the top bar — there is nothing behind
       this screen to close back to
   The interactions that were asked for stay: sections collapse, panels
   expand, the external/internal tabs switch, lists scroll.
   ========================================================================== */

/* The stage pipeline is a flat export of the frame's own run of chevrons
   (assets/brand/stage-path.png, 1305x32). Building it in CSS did not hold
   up: the chevrons have to interlock tightly, and a clip-path run either
   leaves gaps between the steps or eats the labels. Static for now — when
   it needs to reflect a real stage, this is the piece to rebuild. */
const S2_PATH_IMG = 'assets/brand/stage-path.png';

/* Score gauges. The maximum differs — the lead score is out of 100, the
   credit scores out of 1000 — so each one carries its own. */
const S2_SCORES = [
  { value: 720, max: 1000, label: 'Credit Score 1.1', colour: 'var(--success-base)' },
  { value: 650, max: 1000, label: 'CCR Credit Score', colour: 'var(--accent-orange)' },
  { value: 500, max: 1000, label: 'One Score',        colour: 'var(--error-base)' },
  { value: 62,  max: 100,  label: 'Lead Score',       colour: 'var(--accent-amber)' }
];

/* A 270-degree dial, drawn rather than dropped in as artwork so the arc
   follows the value. Rotated so the gap sits at the bottom. */
function s2Gauge(s) {
  const r = 27, c = 2 * Math.PI * r, sweep = 0.75;
  const pct = Math.max(0, Math.min(1, s.value / s.max));
  return `
    <div class="s2-gauge">
      <div class="s2-gauge__dial">
        <svg viewBox="0 0 64 64" width="61" height="61" aria-hidden="true">
          <g transform="rotate(135 32 32)">
            <circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--neutral-200)"
                    stroke-width="6.5" stroke-linecap="round"
                    stroke-dasharray="${c * sweep} ${c}"></circle>
            <circle cx="32" cy="32" r="${r}" fill="none" stroke="${s.colour}"
                    stroke-width="6.5" stroke-linecap="round"
                    stroke-dasharray="${c * sweep * pct} ${c}"></circle>
          </g>
        </svg>
        <span class="s2-gauge__n">${s.value}</span>
      </div>
      <span class="s2-gauge__label">${s.label}</span>
    </div>`;
}

/* ---------- Field primitives --------------------------------------------- */

const s2Field = (label, value, opts = {}) => `
  <div class="s2-field">
    <span class="s2-field__label">${label}</span>
    <div class="s2-input ${opts.select ? 's2-input--select' : ''}">
      ${opts.prefix ? `<span class="s2-input__fix s2-input__fix--pre">${opts.prefix}</span>` : ''}
      <span class="s2-input__val ${opts.select ? 's2-input__val--mid' : ''}">${value}</span>
      ${opts.suffix ? `<span class="s2-input__fix s2-input__fix--suf">${opts.suffix}</span>` : ''}
      ${opts.select ? `<span class="s2-input__chev">${icon('chevron-down', 16)}</span>` : ''}
    </div>
  </div>`;

/* Sections fold away, so the header is the control. */
const s2Section = (title, fields, opts = {}) => `
  <section class="s2-section ${opts.open === false ? 'is-collapsed' : ''}">
    <div class="s2-section__head">
      <span class="s2-section__title t-label-lg">${title}</span>
      ${opts.ai ? `<span class="s2-section__ai">${icon('sparkle', 15)}</span>` : ''}
      <span class="s2-spacer"></span>
      ${opts.done ? `<span class="s2-section__ok">${icon('check-circle', 16)}</span>` : ''}
      <span class="s2-section__chev">${icon('chevron-down', 16)}</span>
    </div>
    <div class="s2-section__body">
      <div class="s2-fields">${fields.map(f => s2Field(f[0], f[1], f[2])).join('')}</div>
    </div>
  </section>`;

/* ---------- Left column --------------------------------------------------- */

function s2Left(d) {
  const mate = d.associate || d.assigned;
  const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.';

  const acts = [
    ['comment', '20 Jan 2026', '9:20am', 'Jane D.',
     'Initial application review completed. All primary documents received and verified.', false],
    ['log', '20 Jan 2026', '9:17am', 'Jane D.', '4 documents verified', true],
    ['log', '18 Jan 2026', '3:20pm', 'Sarah M.',
     'Requested additional documentation for employment verification', false],
    ['log', '17 Jan 2026', '1:05pm', 'Sarah M.', 'Viewed application', false],
    ['log', '17 Jan 2026', '1:05pm', 'Sarah M.', `Assigned to ${mate[1]}`, false],
    ['log', '15 Jan 2026', '9:02am', 'System', 'Application created', false]
  ];

  const notes = [
    ['Kenn Z.', '13 Jan 2026', '6:45pm'],
    ['Kenn Z.', '16 Jan 2026', '4:35pm'],
    ['Kenn Z.', '20 Jan 2026', '11:03am'],
    ['Jess F.', '21 Jan 2026', '9:14am'],
    ['Kenn Z.', '22 Jan 2026', '2:51pm']
  ];

  const ev = (row) => {
    const kind = row[0], date = row[1], time = row[2], who = row[3], text = row[4], group = row[5];
    const isComment = kind === 'comment';
    return `
      <div class="s2-ev ${isComment ? 's2-ev--comment' : ''}">
        <span class="s2-ev__badge ${isComment ? 'is-brand' : ''}">
          ${icon(isComment ? 'bubble' : 'history', 13)}
        </span>
        <div class="s2-ev__body">
          <div class="s2-ev__stamp t-body-sm">
            <b>${date}</b> ${time} <span>by ${who}</span>
          </div>
          <div class="s2-ev__text t-body-sm ${isComment ? '' : 'is-log'}">
            ${group ? `<i class="s2-ev__chev">${icon('chevron-right', 11)}</i>` : ''}${text}
          </div>
        </div>
      </div>`;
  };

  return `
  <div class="s2-col s2-col--left">

    <div class="s2-ident">
      <div class="s2-ident__row">
        <span class="s2-ident__av">${d.assigned[0]}</span>
        <div class="s2-ident__who">
          <span class="t-label-lg">${d.name}</span>
          <span class="t-body-sm">${d.ref}</span>
        </div>
        <span class="s2-ident__edit">${icon('pencil', 18)}</span>
      </div>
      <div class="s2-ident__acts">
        <span class="s2-cta">${icon('phone', 17)}<span>Call</span></span>
        <span class="s2-cta">${icon('mail', 17)}<span>Email</span></span>
        <span class="s2-cta">${icon('chat', 17)}<span>SMS</span></span>
      </div>
      <div class="s2-prog">
        <div class="s2-prog__top">
          <span class="t-body-sm">Overall Progress</span>
          <span class="t-label-sm">60%</span>
        </div>
        <div class="s2-prog__track"><i style="width:60%"></i></div>
      </div>
    </div>

    <div class="s2-card s2-card--activity">
      <div class="s2-card__head">
        <span class="t-label-lg">Activity</span>
        <span class="s2-spacer"></span>
        <span class="s2-tabs t-body-sm">
          <span class="s2-tab is-active">External</span><span class="s2-tab">Internal</span>
        </span>
        <span class="s2-grow" data-s2-grow>${icon('expand', 16)}</span>
      </div>
      <div class="s2-scroll s2-acts">${acts.map(ev).join('')}</div>
    </div>

    <div class="s2-card s2-card--notes">
      <div class="s2-card__head">
        <span class="s2-card__glyph">${icon('rows', 15)}</span>
        <span class="t-label-lg">Internal notes</span>
        <span class="s2-spacer"></span>
        <span class="s2-grow" data-s2-grow>${icon('expand', 16)}</span>
      </div>
      <div class="s2-scroll s2-notes">
        ${notes.map(n => `
          <div class="s2-note">
            <div class="s2-note__head">
              <span class="t-label-sm">${n[0]}</span>
              <span class="t-body-sm">${n[1]}</span>
              <span class="t-body-sm">${n[2]}</span>
              <span class="s2-kebab">${icon('kebab', 14)}</span>
            </div>
            <div class="s2-note__text t-body-sm">${lorem}</div>
          </div>`).join('')}
      </div>
      <div class="s2-composer">
        <span class="t-body-sm">Your note&hellip;</span>
        <span class="s2-send">${icon('send', 14)}</span>
      </div>
    </div>

  </div>`;
}

/* ---------- Middle column -------------------------------------------------- */

function s2Middle(d) {
  const amount = money(d.amount).replace('$', '');
  const first = d.name.split(' ')[0].toLowerCase();

  return `
  <div class="s2-col s2-col--mid">
    <div class="s2-midbar">
      <span class="s2-pick">${icon('sort', 15)} Quick Summary ${icon('chevron-down', 15)}</span>
      <span class="s2-spacer"></span>
      <span class="s2-save">${icon('save', 16)} Save Changes</span>
    </div>

    <div class="s2-scroll s2-mid">
      <div class="s2-summary">
        <div class="s2-summary__title t-label-lg">Quick Summary</div>
        <div class="s2-summary__row">
          <div class="s2-gauges">${S2_SCORES.map(s2Gauge).join('')}</div>
          <div class="s2-attn">
            <span class="s2-attn__label">Needs attention</span>
            <span class="s2-attn__item t-body-sm">
              <i class="s2-attn__ic is-warn">${icon('warn-tri', 14)}</i>Credit Enquiries</span>
            <span class="s2-attn__item t-body-sm">
              <i class="s2-attn__ic is-err">${icon('x-circle', 14)}</i>Serviceability</span>
          </div>
        </div>
        <div class="s2-summary__foot">
          <span class="s2-link t-body-sm">View All Assessments</span>
        </div>
      </div>

      ${s2Section('Loan Details', [
        ['Loan Amount ($)', amount, { prefix: '$' }],
        ['Loan Type', d.product, { select: true }],
        ['Term (Years)', '5', { select: true }],
        ['Interest Rate (%)', '6.5', { suffix: '%' }],
        ['LVR (%)', '80', { suffix: '%' }],
        ['Monthly Repayment ($)', '1,472', { prefix: '$' }]
      ], { done: true })}

      ${s2Section('Personal Details', [
        ['Full Name', d.name],
        ['Date of Birth', '15/03/1985'],
        ['Email', `${first}@email.com`],
        ['Phone', '0412 345 678'],
        ['Marital Status', 'Married', { select: true }],
        ['Address', '42 Collins Street, Melbourne VIC 3000']
      ], { done: true, ai: true })}

      ${s2Section('Employment Details', [
        ['Employment Status', 'Full time', { select: true }],
        ['Employer', 'Northbridge Logistics'],
        ['Occupation', 'Operations Manager'],
        ['Years in Role', '4'],
        ['Gross Income ($)', '142,000', { prefix: '$' }],
        ['Pay Frequency', 'Monthly', { select: true }]
      ], { done: true, ai: true })}

      ${s2Section('Financial Position', [
        ['Total Assets ($)', '610,000', { prefix: '$' }],
        ['Total Liabilities ($)', '228,400', { prefix: '$' }],
        ['Net Position ($)', '381,600', { prefix: '$' }],
        ['Monthly Expenses ($)', '4,250', { prefix: '$' }],
        ['Dependants', '2', { select: true }],
        ['Residency Status', 'Citizen', { select: true }]
      ], { done: true })}

      ${s2Section('Assets &amp; Liabilities', [
        ['Property Value ($)', '540,000', { prefix: '$' }],
        ['Vehicle Value ($)', '38,000', { prefix: '$' }],
        ['Savings ($)', '32,000', { prefix: '$' }],
        ['Mortgage Balance ($)', '198,400', { prefix: '$' }],
        ['Credit Card Limit ($)', '15,000', { prefix: '$' }],
        ['Other Loans ($)', '15,000', { prefix: '$' }]
      ], { open: false })}

      <div class="s2-mid__foot">
        <span class="s2-submit t-label-md">Submit application</span>
      </div>
    </div>
  </div>`;
}

/* ---------- Right column --------------------------------------------------- */

function s2Right(d) {
  const open = [
    'Verify employment documents',
    'Confirm income sources',
    'Request additional bank statements'
  ];
  const done = ['Review credit report', 'Verify identity documents'];

  /* Document states come from the deal's own row, so the view keeps telling
     the same story as the list it was opened from. */
  const PILL = {
    ok: null,
    review: ['Review', 'is-review'],
    pending: ['Pending', 'is-pending'],
    rejected: ['Rejected', 'is-rejected']
  };
  const MARK = {
    ok: ['check-fill', 'is-ok'],
    review: ['', ''],
    pending: ['', ''],
    rejected: ['x-circle', 'is-rejected']
  };

  const doc = (name, st) => {
    const m = MARK[st], p = PILL[st];
    return `
      <div class="s2-doc">
        <span class="s2-doc__mark ${m[1]}">${m[0] ? icon(m[0], 17) : '<i class="s2-radio"></i>'}</span>
        <span class="s2-doc__name t-body-md">${name}</span>
        <span class="s2-doc__go">${icon('chevron-right', 13)}</span>
        <span class="s2-spacer"></span>
        ${p ? `<span class="s2-pill ${p[1]} t-label-sm">${p[0]}</span>` : ''}
        <span class="s2-kebab">${icon('kebab', 14)}</span>
      </div>`;
  };

  return `
  <div class="s2-col s2-col--right">

    <div class="s2-card">
      <div class="s2-card__head">
        <span class="s2-card__glyph">${icon('alarm', 15)}</span>
        <span class="t-label-lg">Next required actions</span>
        <span class="s2-spacer"></span>
        <span class="s2-plus">${icon('plus', 15)}</span>
      </div>
      <div class="s2-scroll s2-tasks">
        ${open.map(t => `
          <div class="s2-task">
            <span class="s2-radio"></span>
            <span class="s2-task__t t-body-md">${t}</span>
            <span class="s2-kebab">${icon('kebab', 14)}</span>
          </div>`).join('')}
        ${done.map(t => `
          <div class="s2-task is-done">
            <span class="s2-tick">${icon('check-fill', 16)}</span>
            <span class="s2-task__t t-body-md">${t}</span>
            <span class="s2-kebab">${icon('kebab', 14)}</span>
          </div>`).join('')}
      </div>
    </div>

    <div class="s2-card">
      <div class="s2-card__head">
        <span class="s2-card__glyph">${icon('article', 15)}</span>
        <span class="t-label-lg">Documents</span>
        <span class="s2-spacer"></span>
        <span class="s2-plus">${icon('plus', 15)}</span>
      </div>
      <div class="s2-scroll s2-docs">
        ${DOC_TYPES.map((t, i) => doc(t, d.docs[i])).join('')}
      </div>
    </div>

    <div class="s2-card s2-card--ai">
      <div class="s2-card__head s2-card__head--ai" data-s2-expand>
        <span class="s2-card__glyph s2-card__glyph--assist">${icon('assist', 16)}</span>
        <span class="t-label-lg">Broker Assist</span>
        <span class="s2-spacer"></span>
        <span class="s2-card__chev">${icon('chevron-up', 15)}</span>
      </div>
      <div class="s2-card__body">
        <div class="s2-ai__msg">
          <div class="s2-ai__stamp t-body-sm"><b>Support</b> 15 Jan 2026 &nbsp; 11:35am</div>
          <div class="s2-ai__text t-body-sm">
            Type in <span class="s2-link">/AskAILO</span> for loan related queries or select
            <span class="s2-link">Matching Engine</span> for lender options.
          </div>
        </div>
        <div class="s2-ai__input">
          <span class="s2-ai__ph t-body-sm">Prompt here&hellip;</span>
          <div class="s2-ai__tools">
            <span class="s2-chip t-body-sm">/AskAILO</span>
            <span class="s2-chip t-body-sm">${icon('sparkle', 12)} Matching Engine</span>
            <span class="s2-spacer"></span>
            <span class="s2-send">${icon('send', 14)}</span>
          </div>
        </div>
      </div>
    </div>

  </div>`;
}

/* ---------- Shell ---------------------------------------------------------- */

function screen2Inner(d) {
  return `
  <div class="s2__top">
    <span class="s2__logo"><svg width="30" height="18"><use href="#i-logo"/></svg></span>
    <span class="s2-spacer"></span>
    <img class="s2-path" src="${S2_PATH_IMG}" width="1305" height="32" alt="Application pending — stage 3 of 9">
    <span class="s2-assign t-body-sm">(04) <b>Assign</b> ${icon('arrow-forward', 14)}</span>
    <span class="s2__rule"></span>
    <span class="s2__kebab">${icon('kebab', 14)}</span>
  </div>

  <div class="s2__body">
    ${s2Left(d)}
    ${s2Middle(d)}
    ${s2Right(d)}
  </div>`;
}

/* Renders the screen and wires the interactions that were asked for —
   collapse, expand, tabs. Scrolling is CSS, and nothing submits.

   The deal is DEALS[0] rather than one the user picked: there is no work
   list in front of this screen to pick from, and the fields only need
   something plausible in them while the layout is being reworked. */
function mountScreen2(app, deal = DEALS[0]) {
  const root = app.querySelector('#screen2');
  if (!root) return;

  root.innerHTML = screen2Inner(deal);

  root.querySelectorAll('.s2-section__head').forEach(h =>
    h.addEventListener('click', () => h.closest('.s2-section').classList.toggle('is-collapsed')));

  root.querySelectorAll('[data-s2-expand]').forEach(h =>
    h.addEventListener('click', () => h.closest('.s2-card').classList.toggle('is-raised')));

  /* Only one can be expanded: they occupy the same space. */
  root.querySelectorAll('[data-s2-grow]').forEach(b =>
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = b.closest('.s2-card');
      const opening = !card.classList.contains('is-tall');
      root.querySelectorAll('.s2-card.is-tall').forEach(c => c.classList.remove('is-tall'));
      card.classList.toggle('is-tall', opening);
    }));

  root.querySelectorAll('.s2-tab').forEach(t =>
    t.addEventListener('click', () => {
      root.querySelectorAll('.s2-tab').forEach(o => o.classList.remove('is-active'));
      t.classList.add('is-active');
    }));
}

/* One entry per version of this screen, the way the work list does it: the
   page sets `window.S2_VARIANT` and the shell's version list points at the
   page. A second version goes here as a skin over the same mount rather
   than another copy of it. */
const S2_MOUNTERS = {
  v1: (app) => mountScreen2(app)
};

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  const mount = S2_MOUNTERS[window.S2_VARIANT] || S2_MOUNTERS.v1;
  if (app) mount(app);
});
