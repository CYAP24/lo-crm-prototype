/* ==========================================================================
   Application view — the screen.
   --------------------------------------------------------------------------
   One layout, two looks. This file and css/appview-layout.css are the
   screen itself; css/appview-core.* is everything it is built from; and a
   page may load a skin on top, scoped to a class on `.screen`, which
   changes nothing about the markup or the behaviour. v1, Panels, loads
   none; v2, Tape, loads css/appview-ribbon.css and css/appview-tape.css.

   The layout's argument is that **the pipeline is the navigation**:

     - the left column is one navigator card from top to bottom: where the
       deal is, how far through it is, then the form's own sections
     - the middle is a workspace with tabs — Application form, Document
       library, Activity history — so the two full views are always a
       visible choice rather than something to go and find
     - over it, Tasks to action: every job on the deal in three bands by
       date, short by design and folding itself away as the broker reads
     - the right is the pinned panel

   Progress lives in the spine and nowhere else.
   ========================================================================== */

function apvHeader(d) {
  const warns = apWarnStrip();
  const st = apStage(AP.stage);

  return `
  <header class="apv-head">

    <div class="apv-head__top">
      ${apIdentity()}
      ${apMoney()}
      <span class="ap-spacer"></span>
      ${apContact()}
      <span class="apv-rule"></span>
      ${apSaveChip()}
      ${apSubmitBtn()}
      ${apQuickBtn()}
      ${apWinActs()}
    </div>

    <div class="apv-head__foot">
      ${apAssignees()}
      <span class="ap-spacer"></span>
      ${warns}
    </div>

  </header>`;
}

function apvRender(d) {
  const st = apStage(AP.stage);
  return `
    ${apvHeader(d)}

    <div class="ap-body apv-body ${apLocked() ? 'is-locked' : ''}">

      <aside class="apv-side">
        <section class="apv-card apv-card--tall">
          <div class="apv-prog">
            <span class="apv-card__title t-overline">Progress</span>
            <span class="apv-prog__line">
              <span class="apv-prog__now t-label-md">
                <span class="ap-dot" style="background:${st.colour}"></span>${st.label}
              </span>
              <span class="apv-prog__pct t-label-sm">${apProgress()}%</span>
            </span>
            <span class="apv-prog__meter">
              <span class="apv-prog__fill" style="width:${apProgress()}%;background:${st.colour}"></span>
            </span>
            <span class="apv-prog__of t-caption">Stage ${apStageIx() + 1} of ${AP_STAGES.length}</span>
          </div>
          ${apStageSteps()}
          <div class="apv-card__group">
            <span class="apv-card__title t-overline">In this application</span>
            ${apSectionRail()}
          </div>
        </section>
      </aside>

      <div class="apv-main">
        ${apNextCard('wide')}
        ${apWorkspace({ tabs: true })}
      </div>

      <aside class="ap-panel apv-panel" data-ap-panel>
        ${apPanelSections().map(apCard).join('')}
      </aside>

    </div>

    <div class="ap-toasts" data-ap-toasts></div>`;
}

/* Every page mounts the same screen. What differs between them is the
   skin class on `.screen` and the stylesheet that answers it.

   Two things can come in on the query string, both from the board:
   `?deal=APP-2026-0876` opens that deal instead of the first one, and
   `?embed=1` says the page is inside the board's overlay, so its ground
   goes clear and closing it hands control back to the board. */
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  if (!app) return;
  const q = new URLSearchParams(location.search);
  const ref = (q.get('deal') || '').replace(/^#/, '');
  const deal = (ref && DEALS.find(d => d.ref === '#' + ref)) || DEALS[0];
  if (q.get('embed') === '1') document.documentElement.classList.add('is-embedded');
  apMount(app, apvRender, deal);
});
