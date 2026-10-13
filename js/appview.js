/* ==========================================================================
   Application view — the screen a deal opens into.
   ------------------------------------------------------------------------
   A rebuild of the Figma frame "Draft #2 - 1920px TO CODE" (node 4124:6173).
   Three columns on the 1920 artboard: 420 / 790 / 420, with the 113px
   gutters the frame uses.

   Interactions are deliberately thin, as asked: sections collapse, panels
   expand, lists scroll. The fields are presentational — nothing submits.
   ========================================================================== */

/* The pipeline across the top. The first two are done, so they show a tick
   and no label, exactly as the frame does. */
const AV_STEPS = [
  { done: true }, { done: true },
  { label: 'Application pending', active: true },
  { label: 'Loan docs pending' },
  { label: 'Application submitted' },
  { label: 'Application approved' },
  { label: 'Tax invoice' },
  { label: 'Settlement' },
  { label: 'Closed' }
];

/* Score gauges. The maximum differs — the lead score is out of 100, the
   credit scores out of 1000 — so each one carries its own. */
const AV_SCORES = [
  { value: 720, max: 1000, label: 'Credit Score 1.1', colour: 'var(--success-base)' },
  { value: 650, max: 1000, label: 'CCR Credit Score', colour: 'var(--accent-orange)' },
  { value: 500, max: 1000, label: 'One Score',        colour: 'var(--error-base)' },
  { value: 62,  max: 100,  label: 'Lead Score',       colour: 'var(--accent-amber)' }
];

/* A 270-degree dial, drawn rather than dropped in as artwork so the arc
   follows the value. Rotated so the gap sits at the bottom. */
function avGauge(s) {
  const r = 27, c = 2 * Math.PI * r, sweep = 0.75;
  const pct = Math.max(0, Math.min(1, s.value / s.max));
  return `
    <div class="av-gauge">
      <div class="av-gauge__dial">
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
        <span class="av-gauge__n">${s.value}</span>
      </div>
      <span class="av-gauge__label">${s.label}</span>
    </div>`;
}

/* ---------- Field primitives --------------------------------------------- */

const avField = (label, value, opts = {}) => `
  <div class="av-field">
    <span class="av-field__label">${label}</span>
    <div class="av-input ${opts.select ? 'av-input--select' : ''}">
      ${opts.prefix ? `<span class="av-input__fix av-input__fix--pre">${opts.prefix}</span>` : ''}
      <span class="av-input__val ${opts.select ? 'av-input__val--mid' : ''}">${value}</span>
      ${opts.suffix ? `<span class="av-input__fix av-input__fix--suf">${opts.suffix}</span>` : ''}
      ${opts.select ? `<span class="av-input__chev">${icon('chevron-down', 16)}</span>` : ''}
    </div>
  </div>`;

/* Sections fold away, so the header is the control. */
const avSection = (title, fields, opts = {}) => `
  <section class="av-section ${opts.open === false ? 'is-collapsed' : ''}">
    <div class="av-section__head">
      <span class="av-section__title t-label-lg">${title}</span>
      ${opts.ai ? `<span class="av-section__ai">${icon('sparkle', 15)}</span>` : ''}
      <span class="av-spacer"></span>
      ${opts.done ? `<span class="av-section__ok">${icon('check-circle', 16)}</span>` : ''}
      <span class="av-section__chev">${icon('chevron-down', 16)}</span>
    </div>
    <div class="av-section__body">
      <div class="av-fields">${fields.map(f => avField(f[0], f[1], f[2])).join('')}</div>
    </div>
  </section>`;

/* ---------- Left column --------------------------------------------------- */

function avLeft(d) {
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
      <div class="av-ev ${isComment ? 'av-ev--comment' : ''}">
        <span class="av-ev__badge ${isComment ? 'is-brand' : ''}">
          ${icon(isComment ? 'bubble' : 'history', 13)}
        </span>
        <div class="av-ev__body">
          <div class="av-ev__stamp t-body-sm">
            <b>${date}</b> ${time} <span>by ${who}</span>
          </div>
          <div class="av-ev__text t-body-sm ${isComment ? '' : 'is-log'}">
            ${group ? `<i class="av-ev__chev">${icon('chevron-right', 11)}</i>` : ''}${text}
          </div>
        </div>
      </div>`;
  };

  return `
  <div class="av-col av-col--left">

    <div class="av-ident">
      <div class="av-ident__row">
        <span class="av-ident__av">${d.assigned[0]}</span>
        <div class="av-ident__who">
          <span class="t-label-lg">${d.name}</span>
          <span class="t-body-sm">${d.ref}</span>
        </div>
        <span class="av-ident__edit">${icon('pencil', 18)}</span>
      </div>
      <div class="av-ident__acts">
        <span class="av-cta">${icon('phone', 17)}<span>Call</span></span>
        <span class="av-cta">${icon('mail', 17)}<span>Email</span></span>
        <span class="av-cta">${icon('chat', 17)}<span>SMS</span></span>
      </div>
      <div class="av-prog">
        <div class="av-prog__top">
          <span class="t-body-sm">Overall Progress</span>
          <span class="t-label-sm">60%</span>
        </div>
        <div class="av-prog__track"><i style="width:60%"></i></div>
      </div>
    </div>

    <div class="av-card av-card--activity">
      <div class="av-card__head">
        <span class="t-label-lg">Activity</span>
        <span class="av-spacer"></span>
        <span class="av-tabs t-body-sm">
          <span class="av-tab is-active">External</span><span class="av-tab">Internal</span>
        </span>
        <span class="av-grow" data-av-grow>${icon('expand', 16)}</span>
      </div>
      <div class="av-scroll av-acts">${acts.map(ev).join('')}</div>
    </div>

    <div class="av-card av-card--notes">
      <div class="av-card__head">
        <span class="av-card__glyph">${icon('rows', 15)}</span>
        <span class="t-label-lg">Internal notes</span>
        <span class="av-spacer"></span>
        <span class="av-grow" data-av-grow>${icon('expand', 16)}</span>
      </div>
      <div class="av-scroll av-notes">
        ${notes.map(n => `
          <div class="av-note">
            <div class="av-note__head">
              <span class="t-label-sm">${n[0]}</span>
              <span class="t-body-sm">${n[1]}</span>
              <span class="t-body-sm">${n[2]}</span>
              <span class="av-kebab">${icon('kebab', 14)}</span>
            </div>
            <div class="av-note__text t-body-sm">${lorem}</div>
          </div>`).join('')}
      </div>
      <div class="av-composer">
        <span class="t-body-sm">Your note&hellip;</span>
        <span class="av-send">${icon('send', 14)}</span>
      </div>
    </div>

  </div>`;
}

/* ---------- Middle column -------------------------------------------------- */

function avMiddle(d) {
  const amount = money(d.amount).replace('$', '');
  const first = d.name.split(' ')[0].toLowerCase();

  return `
  <div class="av-col av-col--mid">
    <div class="av-midbar">
      <span class="av-pick t-body-md">${icon('sort', 15)} Quick Summary ${icon('chevron-down', 15)}</span>
      <span class="av-spacer"></span>
      <span class="av-save t-label-md">${icon('save', 16)} Save Changes</span>
    </div>

    <div class="av-scroll av-mid">
      <div class="av-summary">
        <div class="av-summary__title t-label-lg">Quick Summary</div>
        <div class="av-summary__row">
          <div class="av-gauges">${AV_SCORES.map(avGauge).join('')}</div>
          <div class="av-attn">
            <span class="av-attn__label">Needs attention</span>
            <span class="av-attn__item t-body-sm">
              <i class="av-attn__ic is-warn">${icon('warn-tri', 14)}</i>Credit Enquiries</span>
            <span class="av-attn__item t-body-sm">
              <i class="av-attn__ic is-err">${icon('x-circle', 14)}</i>Serviceability</span>
          </div>
        </div>
        <div class="av-summary__foot">
          <span class="av-link t-body-sm">View All Assessments</span>
        </div>
      </div>

      ${avSection('Loan Details', [
        ['Loan Amount ($)', amount, { prefix: '$' }],
        ['Loan Type', d.product, { select: true }],
        ['Term (Years)', '5', { select: true }],
        ['Interest Rate (%)', '6.5', { suffix: '%' }],
        ['LVR (%)', '80', { suffix: '%' }],
        ['Monthly Repayment ($)', '1,472', { prefix: '$' }]
      ], { done: true })}

      ${avSection('Personal Details', [
        ['Full Name', d.name],
        ['Date of Birth', '15/03/1985'],
        ['Email', `${first}@email.com`],
        ['Phone', '0412 345 678'],
        ['Marital Status', 'Married', { select: true }],
        ['Address', '42 Collins Street, Melbourne VIC 3000']
      ], { done: true, ai: true })}

      ${avSection('Employment Details', [
        ['Employment Status', 'Full time', { select: true }],
        ['Employer', 'Northbridge Logistics'],
        ['Occupation', 'Operations Manager'],
        ['Years in Role', '4'],
        ['Gross Income ($)', '142,000', { prefix: '$' }],
        ['Pay Frequency', 'Monthly', { select: true }]
      ], { done: true, ai: true })}

      ${avSection('Financial Position', [
        ['Total Assets ($)', '610,000', { prefix: '$' }],
        ['Total Liabilities ($)', '228,400', { prefix: '$' }],
        ['Net Position ($)', '381,600', { prefix: '$' }],
        ['Monthly Expenses ($)', '4,250', { prefix: '$' }],
        ['Dependants', '2', { select: true }],
        ['Residency Status', 'Citizen', { select: true }]
      ], { done: true })}

      ${avSection('Assets &amp; Liabilities', [
        ['Property Value ($)', '540,000', { prefix: '$' }],
        ['Vehicle Value ($)', '38,000', { prefix: '$' }],
        ['Savings ($)', '32,000', { prefix: '$' }],
        ['Mortgage Balance ($)', '198,400', { prefix: '$' }],
        ['Credit Card Limit ($)', '15,000', { prefix: '$' }],
        ['Other Loans ($)', '15,000', { prefix: '$' }]
      ], { open: false })}

      <div class="av-mid__foot">
        <span class="av-submit t-label-md">Submit application</span>
      </div>
    </div>
  </div>`;
}

/* ---------- Right column --------------------------------------------------- */

function avRight(d) {
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
      <div class="av-doc">
        <span class="av-doc__mark ${m[1]}">${m[0] ? icon(m[0], 17) : '<i class="av-radio"></i>'}</span>
        <span class="av-doc__name t-body-md">${name}</span>
        <span class="av-doc__go">${icon('chevron-right', 13)}</span>
        <span class="av-spacer"></span>
        ${p ? `<span class="av-pill ${p[1]} t-label-sm">${p[0]}</span>` : ''}
        <span class="av-kebab">${icon('kebab', 14)}</span>
      </div>`;
  };

  return `
  <div class="av-col av-col--right">

    <div class="av-card">
      <div class="av-card__head">
        <span class="av-card__glyph">${icon('alarm', 15)}</span>
        <span class="t-label-lg">Next required actions</span>
        <span class="av-spacer"></span>
        <span class="av-plus">${icon('plus', 15)}</span>
      </div>
      <div class="av-scroll av-tasks">
        ${open.map(t => `
          <div class="av-task">
            <span class="av-radio"></span>
            <span class="av-task__t t-body-md">${t}</span>
            <span class="av-kebab">${icon('kebab', 14)}</span>
          </div>`).join('')}
        ${done.map(t => `
          <div class="av-task is-done">
            <span class="av-tick">${icon('check-fill', 16)}</span>
            <span class="av-task__t t-body-md">${t}</span>
            <span class="av-kebab">${icon('kebab', 14)}</span>
          </div>`).join('')}
      </div>
    </div>

    <div class="av-card">
      <div class="av-card__head">
        <span class="av-card__glyph">${icon('article', 15)}</span>
        <span class="t-label-lg">Documents</span>
        <span class="av-spacer"></span>
        <span class="av-plus">${icon('plus', 15)}</span>
      </div>
      <div class="av-scroll av-docs">
        ${DOC_TYPES.map((t, i) => doc(t, d.docs[i])).join('')}
      </div>
    </div>

    <div class="av-card av-card--ai">
      <div class="av-card__head av-card__head--ai" data-av-collapse>
        <span class="av-card__glyph">${icon('ai-agent', 15)}</span>
        <span class="t-label-lg">AI Support Agent</span>
        <span class="av-spacer"></span>
        <span class="av-card__chev">${icon('chevron-down', 15)}</span>
      </div>
      <div class="av-card__body">
        <div class="av-ai__msg">
          <div class="av-ai__stamp t-body-sm"><b>Support</b> 15 Jan 2026 &nbsp; 11:35am</div>
          <div class="av-ai__text t-body-sm">
            Type in <span class="av-link">/AskAILO</span> for loan related queries or select
            <span class="av-link">Matching Engine</span> for lender options.
          </div>
        </div>
        <div class="av-ai__input">
          <span class="av-ai__ph t-body-sm">Prompt here&hellip;</span>
          <div class="av-ai__tools">
            <span class="av-chip t-body-sm">/AskAILO</span>
            <span class="av-chip t-body-sm">${icon('sparkle', 12)} Matching Engine</span>
            <span class="av-spacer"></span>
            <span class="av-send">${icon('send', 14)}</span>
          </div>
        </div>
      </div>
    </div>

  </div>`;
}

/* ---------- Shell ---------------------------------------------------------- */

function appViewInner(d) {
  const step = (s, i) => `
    <span class="av-step ${s.active ? 'is-active' : ''} ${s.done ? 'is-done' : ''} ${i === 0 ? 'is-first' : ''}">
      ${s.done ? icon('check-circle', 16) : `<span class="t-body-sm">${s.label}</span>`}
    </span>`;

  return `
  <div class="av__top">
    <span class="av__logo">${icon('logo', 26)}</span>
    <div class="av-path">${AV_STEPS.map(step).join('')}</div>
    <span class="av-spacer"></span>
    <span class="av-assign t-body-sm">(04) <b>Assign</b> ${icon('arrow-forward', 14)}</span>
    <span class="av__rule"></span>
    <span class="av__kebab">${icon('kebab', 14)}</span>
    <span class="av__rule"></span>
    <span class="av__close" data-av-close>${icon('close', 16)}</span>
  </div>

  <div class="av__body">
    ${avLeft(d)}
    ${avMiddle(d)}
    ${avRight(d)}
  </div>`;
}

/* Wires the view: opening from a row, closing, and the interactions that
   were asked for — collapse and expand. Scrolling is CSS. */
function mountAppView(app) {
  const av = app.querySelector('#appview');
  if (!av) return;

  const close = () => {
    av.classList.remove('is-open');
    document.body.classList.remove('appview-open');
  };

  const open = (i) => {
    av.innerHTML = appViewInner(DEALS[i]);
    av.classList.add('is-open');
    /* The tour's spotlight belongs to the worklist underneath, so it is
       parked while this is up and picked up again on close. */
    document.body.classList.add('appview-open');

    av.querySelector('[data-av-close]').addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });

    av.querySelectorAll('.av-section__head').forEach(h =>
      h.addEventListener('click', () => h.closest('.av-section').classList.toggle('is-collapsed')));

    av.querySelectorAll('[data-av-collapse]').forEach(h =>
      h.addEventListener('click', () => h.closest('.av-card').classList.toggle('is-collapsed')));

    av.querySelectorAll('[data-av-grow]').forEach(b =>
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        b.closest('.av-card').classList.toggle('is-tall');
      }));

    av.querySelectorAll('.av-tab').forEach(t =>
      t.addEventListener('click', () => {
        av.querySelectorAll('.av-tab').forEach(o => o.classList.remove('is-active'));
        t.classList.add('is-active');
      }));
  };

  /* The lead-details cell is the way in — the name and reference are what
     identify the deal, so that is what opens it. Every other cell in the row
     keeps doing its own job, and marking the cell here means the affordance
     only ever appears where the click actually works. */
  app.querySelectorAll('[data-deal-row] .v1-lead').forEach(cell => {
    cell.classList.add('is-openable');
    cell.addEventListener('click', (e) => {
      e.stopPropagation();
      open(Number(cell.closest('[data-deal-row]').dataset.dealRow));
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && av.classList.contains('is-open')) close();
  });
}
