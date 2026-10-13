/* ==========================================================================
   Icon sprite — shared by every version.
   Each glyph is a <symbol> carrying its own viewBox, so icon() only has to
   set a pixel size and the symbol scales to fit.
   16-grid glyphs are hand-drawn; 24-grid glyphs follow the Feather geometry.
   ========================================================================== */

const ICON_SPRITE = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>

  <!-- ---------- 16 grid: row + control glyphs ---------- -->
  <symbol id="i-phone" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4.5 2.5h2l1 2.5-1.4 1a8.5 8.5 0 0 0 3.9 3.9l1-1.4 2.5 1v2a1 1 0 0 1-1.1 1A10.6 10.6 0 0 1 3.5 3.6a1 1 0 0 1 1-1.1z"/>
  </symbol>
  <symbol id="i-mail" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="3.5" width="12" height="9" rx="2"/><path d="m2.6 4.8 5.4 4 5.4-4"/>
  </symbol>
  <symbol id="i-chat" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13.5 9.2A1.8 1.8 0 0 1 11.7 11H6.2L3.2 13.4V4.3a1.8 1.8 0 0 1 1.8-1.8h6.7a1.8 1.8 0 0 1 1.8 1.8z"/>
  </symbol>
  <symbol id="i-clock" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="8" cy="8" r="5.6"/><path d="M8 4.8V8.2l2.2 1.3"/>
  </symbol>
  <symbol id="i-note" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="2.2" width="10" height="11.6" rx="2"/><path d="M5.6 6.2h4.8M5.6 9.2h4.8"/>
  </symbol>
  <symbol id="i-activity" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2.8 8a5.2 5.2 0 1 1 1.7 3.9"/><path d="M2.6 4.9v3.2h3.2"/>
  </symbol>
  <symbol id="i-pin" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 2.2h4l-.9 1.3v3.2l2.3 2.6H4.6l2.3-2.6V3.5z"/><path d="M8 9.3v4"/>
  </symbol>
  <symbol id="i-kebab" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="8" cy="3.4" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="8" cy="12.6" r="1.3"/>
  </symbol>
  <symbol id="i-chevron-down" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="m4 6.3 4 4 4-4"/>
  </symbol>
  <symbol id="i-chevron-up" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="m4 9.7 4-4 4 4"/>
  </symbol>
  <symbol id="i-search" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="7.2" cy="7.2" r="4.6"/><path d="m10.6 10.6 2.9 2.9"/>
  </symbol>
  <symbol id="i-grid" viewBox="0 0 16 16" fill="currentColor">
    <rect x="2" y="2" width="5.2" height="5.2" rx="1.4"/><rect x="8.8" y="2" width="5.2" height="5.2" rx="1.4"/>
    <rect x="2" y="8.8" width="5.2" height="5.2" rx="1.4"/><rect x="8.8" y="8.8" width="5.2" height="5.2" rx="1.4"/>
  </symbol>
  <symbol id="i-rows" viewBox="0 0 16 16" fill="currentColor">
    <rect x="2" y="3" width="12" height="2.2" rx="1.1"/><rect x="2" y="6.9" width="12" height="2.2" rx="1.1"/>
    <rect x="2" y="10.8" width="12" height="2.2" rx="1.1"/>
  </symbol>

  <symbol id="i-plus" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
    <path d="M8 3.4v9.2M3.4 8h9.2"/>
  </symbol>
  <symbol id="i-sort" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4.4 3v10M2.4 5l2-2 2 2"/><path d="M11.6 13V3M9.6 11l2 2 2-2"/>
  </symbol>

  <!-- Contact glyphs: one stroke per icon, carrying a purple-to-red gradient.
       userSpaceOnUse keeps every element on a single ramp across the 16x16
       box — otherwise each dot of the chat icon would run the full range. -->
  <linearGradient id="contactGradient" gradientUnits="userSpaceOnUse" x1="1.5" y1="1.5" x2="14.5" y2="14.5">
    <stop offset="0%"   stop-color="var(--brand-600)"/>
    <stop offset="55%"  stop-color="var(--brand-500)"/>
    <stop offset="100%" stop-color="var(--accent-red)"/>
  </linearGradient>

  <symbol id="i-phone-duo" viewBox="0 0 16 16" fill="none" stroke="url(#contactGradient)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5.9 2.3a1 1 0 0 1 1 .6l.9 2.2a1 1 0 0 1-.27 1.15l-1 .83a8.6 8.6 0 0 0 3.4 3.4l.83-1a1 1 0 0 1 1.15-.27l2.2.9a1 1 0 0 1 .6 1v1.8a1.2 1.2 0 0 1-1.3 1.2A11.6 11.6 0 0 1 2.3 3.6 1.2 1.2 0 0 1 3.5 2.3z"/>
  </symbol>
  <symbol id="i-mail-duo" viewBox="0 0 16 16" fill="none" stroke="url(#contactGradient)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <rect x="1.7" y="3.3" width="12.6" height="9.4" rx="2.2"/>
    <path d="m2.4 4.8 4.6 3.6a1.6 1.6 0 0 0 2 0l4.6-3.6"/>
  </symbol>
  <symbol id="i-chat-duo" viewBox="0 0 16 16" fill="none" stroke="url(#contactGradient)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13.7 8.8a1.9 1.9 0 0 1-1.9 1.9H6.3L3 13.4V4.3a1.9 1.9 0 0 1 1.9-1.9h6.9a1.9 1.9 0 0 1 1.9 1.9z"/>
    <g fill="url(#contactGradient)" stroke="none">
      <circle cx="5.8" cy="6.6" r=".9"/><circle cx="8.4" cy="6.6" r=".9"/><circle cx="11" cy="6.6" r=".9"/>
    </g>
  </symbol>

  <!-- Split quick-action columns: alarm (tasks), bubble (notes), history (activity) -->
  <symbol id="i-alarm" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="8" cy="9" r="5.3"/><path d="M8 6.5V9l1.8 1.1"/>
    <path d="M2.4 3.2 4.3 1.7M13.6 3.2 11.7 1.7"/>
  </symbol>
  <symbol id="i-bubble" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13.6 9A1.8 1.8 0 0 1 11.8 10.8H6.3L3.2 13.2V4.4a1.8 1.8 0 0 1 1.8-1.8h6.8a1.8 1.8 0 0 1 1.8 1.8z"/>
    <path d="M5.8 5.9h5M5.8 8.1h3.2"/>
  </symbol>
  <symbol id="i-history" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2.6 8a5.4 5.4 0 1 0 1.6-3.8"/><path d="M2.3 2.6v3.2h3.2"/>
    <path d="M8 5.4V8.2l2 1.2"/>
  </symbol>

  <symbol id="i-paperclip" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13.2 7.4 8 12.6a3.2 3.2 0 0 1-4.5-4.5l5.6-5.6a2.1 2.1 0 1 1 3 3l-5.5 5.6a1 1 0 0 1-1.5-1.5l4.9-4.9"/>
  </symbol>

  <symbol id="i-check-sm" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m3.4 8.4 3 3 6.2-6.8"/>
  </symbol>
  <symbol id="i-close" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
    <path d="m4.4 4.4 7.2 7.2M11.6 4.4 4.4 11.6"/>
  </symbol>
  <symbol id="i-star" viewBox="0 0 16 16" fill="currentColor" stroke="none">
    <path d="m8 1.8 1.86 3.77 4.16.6-3.01 2.94.71 4.14L8 11.3l-3.72 1.95.71-4.14L1.98 6.17l4.16-.6z"/>
  </symbol>
  <symbol id="i-columns" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round">
    <rect x="2" y="2.6" width="12" height="10.8" rx="1.8"/><path d="M6 2.6v10.8M10 2.6v10.8"/>
  </symbol>
  <symbol id="i-bolt" viewBox="0 0 16 16" fill="currentColor" stroke="none">
    <path d="M9.3 1.4 3.6 9h3.4l-.7 5.6L12.6 7H9.1z"/>
  </symbol>
  <symbol id="i-send" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.2 1.8 7.3 8.7M14.2 1.8l-4.4 12.4-2.5-5.5-5.5-2.5z"/>
  </symbol>
  <symbol id="i-alert" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 2.2 14.6 13.4H1.4z"/><path d="M8 6.4v3M8 11.6h.01"/>
  </symbol>
  <symbol id="i-sparkle" viewBox="0 0 16 16" fill="currentColor" stroke="none">
    <path d="M8 1.2 9.5 5.4 13.7 6.9 9.5 8.4 8 12.6 6.5 8.4 2.3 6.9 6.5 5.4z"/>
    <path d="M12.9 10.4l.62 1.73 1.73.62-1.73.62-.62 1.73-.62-1.73-1.73-.62 1.73-.62z"/>
  </symbol>
  <symbol id="i-filter" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2.4 3.1h11.2L9.1 8.5v4.3l-2.2 1.1V8.5z"/>
  </symbol>
  <symbol id="i-sliders" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
    <path d="M2.6 4.6h10.8M2.6 11.4h10.8"/>
    <circle cx="6" cy="4.6" r="1.9" fill="var(--bg-base)"/><circle cx="10.4" cy="11.4" r="1.9" fill="var(--bg-base)"/>
  </symbol>

  <!-- ---------- Brand mark (kept exactly as the LO logo) ---------- -->
  <symbol id="i-logo" viewBox="0 0 21 17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 14 8 3l6 11 5-9"/>
  </symbol>

  <!-- ---------- 24 grid: top navigation glyphs ---------- -->
  <symbol id="i-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </symbol>
  <symbol id="i-user-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>
  </symbol>
  <symbol id="i-settings" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </symbol>
  <symbol id="i-help" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
  </symbol>
  <symbol id="i-apps" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="5" r="1.9"/><circle cx="12" cy="5" r="1.9"/><circle cx="19" cy="5" r="1.9"/>
    <circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/>
    <circle cx="5" cy="19" r="1.9"/><circle cx="12" cy="19" r="1.9"/><circle cx="19" cy="19" r="1.9"/>
  </symbol>


  <!-- ---------- Application view ---------- -->
  <symbol id="i-pencil" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11.2 2.6a1.6 1.6 0 0 1 2.2 2.2L5.6 12.6l-3 .8.8-3z"/>
  </symbol>
  <symbol id="i-expand" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9.6 2.4h4v4M6.4 13.6h-4v-4M13.6 2.4 9.2 6.8M2.4 13.6l4.4-4.4"/>
  </symbol>
  <symbol id="i-check-circle" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="8" cy="8" r="6.2"/><path d="m5.3 8.2 1.9 1.9 3.5-3.9"/>
  </symbol>
  <symbol id="i-check-fill" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="7" fill="currentColor"/>
    <path d="m5 8.2 2 2 4-4.3" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </symbol>
  <symbol id="i-warn-tri" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 2.6 14.4 13.4H1.6z"/><path d="M8 6.6v3M8 11.6v.01"/>
  </symbol>
  <symbol id="i-x-circle" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="7" fill="currentColor"/>
    <path d="m5.8 5.8 4.4 4.4M10.2 5.8l-4.4 4.4" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
  </symbol>
  <symbol id="i-save" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3.4 2.6h7l3 3v8a.8.8 0 0 1-.8.8H3.4a.8.8 0 0 1-.8-.8V3.4a.8.8 0 0 1 .8-.8z"/>
    <path d="M5.2 2.6v4h5.2v-4M5.2 10.2h5.6"/>
  </symbol>
  <symbol id="i-arrow-forward" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9.4 3.4 14 8l-4.6 4.6"/><path d="M14 8H4.6A2.6 2.6 0 0 0 2 10.6v2"/>
  </symbol>
  <symbol id="i-article" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2.4" y="2.4" width="11.2" height="11.2" rx="2"/><path d="M5 5.8h6M5 8.4h6M5 11h3.6"/>
  </symbol>
  <symbol id="i-chevron-right" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="m6.3 4 4 4-4 4"/>
  </symbol>
  <symbol id="i-sort" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4.4 2.8v10.4M2.2 11l2.2 2.2L6.6 11M11.6 13.2V2.8M9.4 5l2.2-2.2L13.8 5"/>
  </symbol>
  <symbol id="i-ai-agent" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2.6" y="5" width="10.8" height="8" rx="2.4"/>
    <path d="M8 5V2.6M5.6 8.6v1M10.4 8.6v1M1 8.4v2M15 8.4v2"/>
    <circle cx="8" cy="2" r="1"/>
  </symbol>

</defs></svg>`;

document.addEventListener('DOMContentLoaded', () => {
  document.body.insertAdjacentHTML('afterbegin', ICON_SPRITE);
});

/** Render an icon at a given pixel size. The symbol's own viewBox does the scaling. */
const icon = (id, size = 16) =>
  `<svg width="${size}" height="${size}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
