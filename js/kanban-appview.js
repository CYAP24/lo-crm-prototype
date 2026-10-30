/* ==========================================================================
   Kanban × App view — open a deal from the board.
   --------------------------------------------------------------------------
   Loaded after js/kanban.js on the kanban-x-appview-*.html pages only. The
   board underneath is the kanban exactly as it is on kanban.html — same
   renderer, same styles, same controls. This file adds one behaviour on
   top: press a deal and its application view opens over the board.

   The application view is not rebuilt here. It is the real page, opened in
   an overlay frame with `?deal=` and `?embed=1`, so there is one
   application view in the repo and every improvement to it lands here too.
   The frame keeps the two screens from touching each other: their page
   rules, their globals and their key handlers stay in their own documents.

   Each page says which application view it opens and what the board behind
   it should look like while it is open:

     window.KXA = { view: 'appview-v1.html', scrim: 'dark' }

   The scrim is drawn here, on the board, rather than inside the frame,
   because only this document can see the board to dim and blur it.
   ========================================================================== */

(function () {
  const cfg = Object.assign({ view: 'appview-v1.html', scrim: 'dark' }, window.KXA || {});

  /* Everything on a card that already does a job keeps doing it: the
     select box, the call / SMS / email keys, the note and task pills, the
     snooze label. A press anywhere else on the card is a press on the deal. */
  const OWN_JOB = [
    '.kb-cbox', '.kb-cp', '.kb-ap', '.kb-snooze',
    '[data-kb-panel]', '[data-pop]', '[data-kb-pick]',
    'a', 'button', 'input', 'select', 'textarea'
  ].join(', ');

  document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    if (!app) return;
    app.classList.add('kxa');

    const layer = document.createElement('div');
    layer.className = `kxa-layer is-${cfg.scrim}`;
    layer.hidden = true;
    layer.innerHTML = '<iframe class="kxa-frame" title="Application view"></iframe>';
    app.appendChild(layer);
    const frame = layer.querySelector('iframe');

    let loading = false;

    const mark = (i) => app.querySelectorAll('.kb-c').forEach(c =>
      c.classList.toggle('is-opened', i !== null && Number(c.dataset.dealRow) === i));

    const open = (i) => {
      const d = DEALS[i];
      if (!d) return;
      mark(i);
      loading = true;
      layer.hidden = false;
      layer.classList.remove('is-ready');
      /* Read a layout value so the browser commits the unhidden layer at
         opacity 0 before the class that fades it in. A requestAnimationFrame
         would do the same, but it never fires in a backgrounded tab, which
         would leave the layer stuck half-open. */
      void layer.offsetWidth;
      layer.classList.add('is-open');
      frame.src = `${cfg.view}?deal=${encodeURIComponent(d.ref.replace(/^#/, ''))}&embed=1`;
    };

    /* The window rises in once its page has loaded, so the broker sees the
       board dim and then the deal arrive, never a blank frame. */
    frame.addEventListener('load', () => {
      if (!loading) return;
      loading = false;
      layer.classList.add('is-ready');
      try { frame.contentWindow.focus(); } catch (e) { /* cross-origin: leave focus */ }
    });

    const close = () => {
      if (layer.hidden) return;
      loading = false;
      layer.classList.remove('is-open', 'is-ready');
      mark(null);
      setTimeout(() => {
        if (layer.classList.contains('is-open')) return;   /* reopened meanwhile */
        layer.hidden = true;
        frame.removeAttribute('src');
      }, 240);
    };

    /* Bubbling, not capturing: the board's own handlers run first, so a
       press on a pill opens its panel exactly as it does on kanban.html. */
    app.addEventListener('click', (e) => {
      const card = e.target.closest('.kb-c');
      if (!card || e.target.closest(OWN_JOB)) return;
      open(Number(card.dataset.dealRow));
    });

    /* The window asks to be closed by its × button, by Esc once it has
       nothing else to close, or by a press on the dimmed board around it. */
    window.addEventListener('message', (e) => {
      if (e.source !== frame.contentWindow) return;
      if (e.data && e.data.type === 'apv:close') close();
    });

    /* Esc pressed while focus is still on the board. */
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  });
})();
