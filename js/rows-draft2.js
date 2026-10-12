/* ==========================================================================
   Draft 2 parity — rows.
   Deliberately carries its OWN data rather than sharing js/rows.js, because
   this file is a frozen reference copy of the original Figma draft. Editing
   ROWS for the redesign versions must not change what this page shows.
   ========================================================================== */

const DRAFT2_ROWS = [
  { name:'Maria Josephin', amount:'$250,000', ref:'#APP-2026-0892', product:'Asset finance', activity:'20/01/26',
    pinned:true,  pct:0, review:'03', rejected:'01', pending:'09',
    tasks:'05', notes:'02', events:'03', unread:true,
    stage:'Day 1 - First attempt to contact', people:['KZ','JF','CE','SM'] },

  { name:'Cielo Escandor', amount:'$80,000',  ref:'#APP-2026-0892', product:'Asset finance', activity:'20/01/26',
    pinned:false, pct:0, review:'01', rejected:'00', pending:'12',
    tasks:'05', notes:'02', events:'03', unread:true,
    stage:'Day 1 - First attempt to contact', people:['KZ','JF','CE','SM'] },

  { name:'Mikey Gahona',   amount:'$35,000',  ref:'#APP-2026-0892', product:'Asset finance', activity:'20/01/26',
    pinned:false, pct:0, review:'07', rejected:'02', pending:'08',
    tasks:'05', notes:'02', events:'03', unread:true,
    stage:'Day 1 - First attempt to contact', people:['KZ','JF','CE','SM'] }
];

const draftRing = (pct) => {
  const R = 14.5, C = 2 * Math.PI * R;
  const arc = pct > 0
    ? `<circle cx="16" cy="16" r="${R}" fill="none" stroke="var(--bg-brand)" stroke-width="3"
         stroke-linecap="round" stroke-dasharray="${(C * pct / 100).toFixed(2)} ${C.toFixed(2)}"/>`
    : `<circle cx="16" cy="1.5" r="2.2" fill="var(--bg-brand)" stroke="none"/>`;
  return `<div class="draft-ring">
      <svg width="32" height="32" viewBox="0 0 32 32">
        <circle class="draft-ring__track" cx="16" cy="16" r="${R}" fill="none" stroke-width="3"/>
        ${arc}
      </svg>
      <span class="draft-ring__label t-caption">${pct}%</span>
    </div>`;
};

const draftPill = (id, label, count, active) => `
  <span class="draft-pill ${active ? 'draft-pill--active' : ''} t-caption">
    ${icon(id, 13)}${label}<span class="draft-pill__count t-label-sm">${count}</span>
    ${active ? '<span class="draft-pill__dot"></span>' : ''}
  </span>`;

const draftStack = (people) => {
  const cls = ['a', 'b', 'c', 'd'];
  const faces = people.map((p, i) =>
    `<span class="draft-stack__item draft-stack__item--${cls[i % 4]} t-label-sm" style="font-size:10px">${p}</span>`).join('');
  return `<div class="draft-stack">${faces}<span class="draft-stack__item draft-stack__item--add">${icon('plus', 12)}</span></div>`;
};

const renderDraft2Rows = () => {
  const host = document.getElementById('rows');
  if (!host) return;
  host.innerHTML = DRAFT2_ROWS.map(d => `
    <div class="draft-row draft-grid">

      <span class="draft-check"></span>

      <div class="draft-lead">
        <div class="draft-lead__line1">
          ${d.pinned ? `<span class="draft-lead__pin">${icon('pin', 13)}</span>` : ''}
          <span class="draft-lead__name t-label-md">${d.name}</span>
          <span class="draft-lead__sep t-body-md">-</span>
          <span class="draft-lead__amount t-label-md">${d.amount}</span>
          <span class="draft-lead__sep t-body-md">-</span>
          <span class="draft-lead__ref t-body-md">${d.ref}</span>
        </div>
        <div class="draft-lead__meta t-caption">${d.product} &nbsp;&bull;&nbsp; Last activity ${d.activity}</div>
      </div>

      <div class="draft-contact">
        <span class="draft-icon-btn">${icon('phone', 14)}</span>
        <span class="draft-icon-btn">${icon('mail', 14)}</span>
        <span class="draft-icon-btn">${icon('chat', 14)}</span>
      </div>

      <div class="cell-docs">
        <div class="draft-docs">
          ${draftRing(d.pct)}
          <div class="draft-stats">
            <div class="draft-stat draft-stat--review"><span class="draft-stat__value t-label-sm">${d.review}</span><span class="draft-stat__label t-caption">Review</span></div>
            <div class="draft-stat draft-stat--rejected"><span class="draft-stat__value t-label-sm">${d.rejected}</span><span class="draft-stat__label t-caption">Rejected</span></div>
            <div class="draft-stat draft-stat--pending"><span class="draft-stat__value t-label-sm">${d.pending}</span><span class="draft-stat__label t-caption">Pending</span></div>
          </div>
        </div>
      </div>

      <div class="cell-actions">
        <div class="draft-actions">
          ${draftPill('clock', 'Action tasks', d.tasks, false)}
          ${draftPill('note', 'Notes', d.notes, d.unread)}
          ${draftPill('activity', 'Activity', d.events, false)}
        </div>
      </div>

      <div class="cell-stage">
        <span class="draft-stage t-caption">${d.stage}</span>
      </div>

      <div class="cell-people">${draftStack(d.people)}</div>

      <div class="cell-settle"><span class="draft-settle t-body-md">-</span></div>

      <span class="draft-overflow">${icon('kebab', 14)}</span>
    </div>`).join('');
};

document.addEventListener('DOMContentLoaded', renderDraft2Rows);
