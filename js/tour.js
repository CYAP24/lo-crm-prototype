/* ==========================================================================
   Points of interest — a short spotlight tour of each version.
   ------------------------------------------------------------------------
   One step at a time: everything dims except the control being introduced,
   and the step only advances once the viewer actually uses that control.
   Nothing is blocked — the dim is purely visual, so the prototype stays
   fully explorable and a step simply waits until its turn is taken.

   The tour lives inside the version page rather than the shell, so it
   scales with the frame and works the same opened full size. The shell
   drives it through the `tour` URL parameter:

     tour=auto   start unless this version's tour is already finished  (default)
     tour=force  start from the top, whatever was seen before
     tour=off    never start — used for the side-by-side compare view

   Progress is per-version in sessionStorage, so switching versions and
   coming back resumes where you left off. It clears when the tab closes,
   which is the "exited the prototype" case.
   ========================================================================== */

const TOUR_KEY = (v) => `lo-tour:${v}`;

/* Each step names the thing it is introducing, and says what counts as
   using it. `spot` narrows the lit area when the element itself is the
   wrong shape to point at — the scrollbar, for instance. */
const TOURS = {
  v1: [
    {
      sel: '#v1cog',
      title: 'Customise your columns',
      body: 'This view can show eighteen columns. Click the cog to pick the ones you care about.',
      cue: 'Click the cog'
    },
    {
      sel: '.v1-row .ai-btn',
      title: 'Ask Broker Assist',
      body: 'The mark sits on every deal. It summarises where that one is up to and what is blocking it.',
      cue: 'Click the Broker Assist mark'
    },
    {
      sel: '.v1-row .v1-acts',
      within: '[data-pop]',
      title: 'Tasks, notes and activity',
      body: 'Each of the three opens that deal’s card over the table — outstanding actions, the note thread, or the full history.',
      cue: 'Click any of the three'
    },
    {
      sel: '.v1-scroll',
      spot: (el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.bottom - 16, width: r.width, height: 16 };
      },
      title: 'There is more to the right',
      body: 'Lender, partner and the rest of the columns sit off-screen. The table scrolls sideways; the controls on the right stay pinned.',
      cue: 'Scroll the table sideways',
      /* A scroll, not a click — the step is done once it has actually moved. */
      watch: (el, done) => {
        const onScroll = () => { if (el.scrollLeft > 60) done(); };
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
      }
    }
  ],

  /* v2 repeats nothing: the column chooser and the sideways scroll work
     exactly as they do in v1, so only what changed is worth pointing at. */
  v2: [
    {
      sel: '.v1-row .qai',
      within: '[data-open-deal]',
      title: 'Quick actions',
      body: 'Tasks, notes and activity open the deal’s quick-view sidebar on that section, rather than a card over the table.',
      cue: 'Click any of the three'
    },
    {
      sel: '.v1-row .ai-btn',
      title: 'Broker Assist lives in the sidebar',
      body: 'In this version the mark opens Broker Assist as a fourth tab of that same sidebar — one surface instead of two.',
      cue: 'Click the Broker Assist mark'
    }
  ]
};

function mountTour(variant) {
  const steps = TOURS[variant];
  if (!steps || !steps.length) return;

  const params = new URLSearchParams(location.search);
  const mode = params.get('tour') || 'auto';
  if (mode === 'off') return;

  const saved = sessionStorage.getItem(TOUR_KEY(variant));
  if (mode === 'auto' && saved === 'done') return;

  /* Resume where they left off, unless this is a deliberate replay. */
  let i = mode === 'force' ? 0 : Math.min(Number(saved) || 0, steps.length - 1);

  const el = document.createElement('div');
  el.className = 'tour';
  el.innerHTML = `
    <div class="tour__hole"></div>
    <div class="tour__pop">
      <div class="tour__step"></div>
      <div class="tour__title"></div>
      <div class="tour__body"></div>
      <div class="tour__foot">
        <span class="tour__cue"></span>
        <button class="tour__skip" type="button">Skip</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  document.body.classList.add('tour-on');

  const hole = el.querySelector('.tour__hole');
  const pop  = el.querySelector('.tour__pop');
  let cleanup = null;
  let target = null;
  let spotFn = null;

  const save = (v) => { try { sessionStorage.setItem(TOUR_KEY(variant), String(v)); } catch (e) {} };

  const end = () => {
    if (cleanup) cleanup();
    save('done');
    document.body.classList.remove('tour-on');
    el.classList.add('is-gone');
    window.removeEventListener('resize', place);
    document.removeEventListener('scroll', place, true);
    setTimeout(() => el.remove(), 260);
  };

  /* The lit rectangle, in viewport coordinates. */
  function rectOf() {
    if (!target) return null;
    if (spotFn) return spotFn(target);
    const r = target.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }

  function place() {
    const r = rectOf();
    if (!r) return;
    const pad = 6;
    hole.style.left   = `${r.left - pad}px`;
    hole.style.top    = `${r.top - pad}px`;
    hole.style.width  = `${r.width + pad * 2}px`;
    hole.style.height = `${r.height + pad * 2}px`;

    /* Below the target when there is room, above it when there is not,
       and always clamped inside the frame. */
    const pw = pop.offsetWidth, ph = pop.offsetHeight, gap = 16;
    const below = r.top + r.height + gap;
    const above = r.top - gap - ph;
    const top = (below + ph <= window.innerHeight - 16) ? below
              : (above >= 16) ? above
              : Math.max(16, window.innerHeight - ph - 16);

    let left = r.left + r.width / 2 - pw / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - pw - 16));

    pop.style.left = `${left}px`;
    pop.style.top  = `${top}px`;
  }

  function show() {
    if (cleanup) { cleanup(); cleanup = null; }
    if (i >= steps.length) return end();
    save(i);

    const step = steps[i];
    target = document.querySelector(step.sel);
    if (!target) { i++; return show(); }      // nothing to point at — move on
    spotFn = step.spot || null;

    el.querySelector('.tour__step').textContent  = `${i + 1} of ${steps.length}`;
    el.querySelector('.tour__title').textContent = step.title;
    el.querySelector('.tour__body').textContent  = step.body;
    el.querySelector('.tour__cue').textContent   = step.cue;

    target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    /* A timer rather than requestAnimationFrame: a frame that is not being
       painted — offscreen, backgrounded, a hidden preview — never runs its
       rAF callbacks, and the tour would silently never appear. */
    setTimeout(place, 0);

    const done = () => {
      if (cleanup) { cleanup(); cleanup = null; }
      i++;
      /* A beat before the next spotlight, so whatever they just opened is
         actually seen — then dismiss it, or it sits over the next callout.
         Clicking the app root is how every controller here already closes
         its overlay, so their internal state stays honest. */
      el.classList.add('is-waiting');
      setTimeout(() => {
        document.getElementById('app')?.click();
        el.classList.remove('is-waiting');
        show();
      }, 900);
    };

    if (step.watch) {
      cleanup = step.watch(target, done);
    } else {
      /* Capture, so the step still completes if the control stops the
         click from bubbling — which most of them do. */
      const onClick = (e) => {
        const hit = step.within ? e.target.closest(step.within) : e.target.closest(step.sel);
        if (hit && target.contains(hit)) done();
      };
      document.addEventListener('click', onClick, true);
      cleanup = () => document.removeEventListener('click', onClick, true);
    }
  }

  el.querySelector('.tour__skip').addEventListener('click', (e) => {
    e.stopPropagation();
    end();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') end(); });
  window.addEventListener('resize', place);
  document.addEventListener('scroll', place, true);

  show();
}

/* variants.js renders on DOMContentLoaded; this listener is registered after
   its, so the table is already built by the time the timer fires. */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => mountTour(window.VARIANT), 60);
});
