/* ═══════════════════════════════════════════════════════════════
   HOW IT WORKS (2026-11-17). Page chrome from de-core, plus the series:
   every [data-series] tile or Watch button opens the shared series player
   (DE.openSeries) on that episode, and the player offers the next one.
   A link to how-it-works.html#play-e03 opens episode 03 on arrival.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  function boot() {
    const DE = window.DE;
    if (!DE) return;
    DE.initCursorGlow && DE.initCursorGlow();
    DE.initNavScroll && DE.initNavScroll();
    DE.initMobileNav && DE.initMobileNav();
    DE.initFade && DE.initFade();
    DE.initEntryCue && DE.initEntryCue();
    DE.initLazyDemoModal && DE.initLazyDemoModal(null);

    document.querySelectorAll('[data-series]').forEach((el) => {
      el.addEventListener('click', () => DE.openSeries(el.dataset.series, el));
    });

    // "Or skip to a section": a disclosure menu of pillars and episodes.
    // Esc or a click outside closes it; choosing a link closes it and jumps.
    const skip = document.querySelector('[data-skip]');
    if (skip) {
      const btn = skip.querySelector('.hiw-skip-btn');
      const menu = skip.querySelector('.hiw-skip-menu');
      const setOpen = (open) => {
        menu.hidden = !open;
        btn.setAttribute('aria-expanded', String(open));
        if (open) menu.querySelector('a')?.focus({ preventScroll: true });
      };
      btn.addEventListener('click', () => setOpen(menu.hidden));
      menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
      document.addEventListener('click', (e) => { if (!menu.hidden && !skip.contains(e.target)) setOpen(false); });
      skip.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !menu.hidden) { setOpen(false); btn.focus(); }
      });
    }

    const m = location.hash.match(/^#play-(e\d\d)$/);
    if (m) DE.openSeries(m[1], document.querySelector(`.hiw-tile[data-series="${m[1]}"]`));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
