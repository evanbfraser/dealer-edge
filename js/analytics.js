/* ═══════════════════════════════════════════════════════════════
   ANALYTICS PAGE (candidate 2) - scroll choreography
   ═══════════════════════════════════════════════════════════════
   The act engine is shared (DE.initActs in js/de-core.js); this
   file owns the page's BEAT_ANIMS handlers + the hero live ticker.
   Conventions (see CLAUDE.md): every handler resets its own state
   first, guards async steps with stillCurrent, and marks the beat
   is-playing.
   Lifecycle: registered as DE.pages.analytics, booted by the
   DE.boot('analytics') call at the bottom (see js/de-core.js).
   ─────────────────────────────────────────────────────────────── */

DE.pages.analytics = { boot() {
  'use strict';

  const reduceMotion = DE.reduceMotion;

  // shared engine (js/de-core.js): Lenis + cursor glow + nav state + fade
  const lenis = DE.createLenis();

  let deActCssPromise = null;
  function loadDeActCss() {
    const href = 'css/de-act.min.css?v=20260703b';
    if (document.querySelector(`link[href="${href}"]`)) return deActCssPromise || Promise.resolve();
    if (!deActCssPromise) {
      deActCssPromise = new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = resolve;
        document.head.appendChild(link);
      });
    }
    return deActCssPromise;
  }

  let analyticsLateContentPromise = null;
  let analyticsLateContentReady = false;
  function loadAnalyticsLateContent() {
    const root = document.querySelector('[data-analytics-late-root]');
    if (!root) return Promise.resolve();
    if (analyticsLateContentReady || root.dataset.loaded === 'true') return analyticsLateContentPromise || Promise.resolve();
    if (!analyticsLateContentPromise) {
      analyticsLateContentPromise = fetch('partials/analytics-late-content.html?v=20260706a')
        .then((response) => response.ok ? response.text() : '')
        .then((html) => {
          if (!html || root.dataset.loaded === 'true') return;
          root.innerHTML = html;
          root.dataset.loaded = 'true';
          analyticsLateContentReady = true;
          DE.initFade();
          DE.initSectionViews();
          DE.initLazyVideoBoatSections();
        })
        .catch(() => {});
    }
    return analyticsLateContentPromise;
  }

  function loadAnalyticsLateExperience() {
    return Promise.all([loadAnalyticsLateContent(), loadDeActCss(), loadAnalyticsLateCss()])
      .then(() => loadAnalyticsLateJs())
      .then(() => {
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
  }

  DE.initMobileNav(); // not shipped to the platform (DeHeader owns nav)
  DE.initLazyDemoModal(lenis);
  DE.initCursorGlow();
  DE.initNavScroll();
  DE.initScrollHint();
  DE.initEntryCue();
  DE.initFade();
  initLiveTicker();

  initAnalyticsLateJs();

  let analyticsLateJsPromise = null;
  let analyticsLateInitialized = false;
  function loadAnalyticsLateJs() {
    const src = 'js/analytics-late.min.js?v=20260630a';
    if (!analyticsLateJsPromise) {
      analyticsLateJsPromise = Promise.all([DE.loadScrollLibs(lenis), loadAnalyticsLateContent()])
        .then(() => new Promise((resolve) => {
          const existing = document.querySelector(`script[src="${src}"]`);
          if (existing) {
            existing.addEventListener('load', resolve, { once: true });
            existing.addEventListener('error', resolve, { once: true });
            return;
          }
          const script = document.createElement('script');
          script.src = src;
          script.defer = true;
          script.onload = resolve;
          script.onerror = resolve;
          document.head.appendChild(script);
        }));
    }
    return analyticsLateJsPromise.then(() => {
      if (!analyticsLateInitialized && DE.initAnalyticsLate) {
        analyticsLateInitialized = true;
        DE.initAnalyticsLate(lenis, reduceMotion);
      }
    });
  }

  function initAnalyticsLateJs() {
    let requested = false;

    const load = () => {
      if (requested) return;
      requested = true;
      loadAnalyticsLateExperience();
    };

    document.querySelectorAll('a[href="#includes"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        loadAnalyticsLateExperience().then(() => {
          const target = document.getElementById('includes');
          if (!target) return;
          const y = target.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
          lenis.resize?.();
        });
      });
    });

    const target = document.querySelector('[data-analytics-late-root]');
    if (!target) return;

    const maybeLoad = () => {
      if (window.scrollY > 430 && target.getBoundingClientRect().top < window.innerHeight + 450) {
        scheduleLoad();
      }
    };
    let lateLoadTimer = 0;
    function scheduleLoad() {
      if (lateLoadTimer) return;
      lateLoadTimer = setTimeout(() => {
        lateLoadTimer = 0;
        load();
      }, 850);
    }
    DE.addDisposer(() => clearTimeout(lateLoadTimer));
    DE.on(window, 'scroll', maybeLoad, { passive: true });
    DE.on(window, 'resize', maybeLoad, { passive: true });
  }

  let analyticsLateCssPromise = null;
  function initAnalyticsLateCss() {
    return loadAnalyticsLateCss();
  }

  function loadAnalyticsLateCss() {
    const href = 'css/analytics-late.min.css?v=20260703b';
    if (document.querySelector(`link[href="${href}"]`)) return analyticsLateCssPromise || Promise.resolve();
    if (!analyticsLateCssPromise) {
      analyticsLateCssPromise = new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => {
        if (window.ScrollTrigger) ScrollTrigger.refresh();
          resolve();
      };
        link.onerror = resolve;
      document.head.appendChild(link);
      });
    }
    return analyticsLateCssPromise;
  }

  /* ─────────────────────────────────────────────────────────────
     Hero — the "updated Ns ago" ticker (simulated live refresh)
     ───────────────────────────────────────────────────────────── */
  function initLiveTicker() {
    const seconds = document.querySelector('[data-live-seconds]');
    if (!seconds || reduceMotion) return;
    const tickEl = seconds.closest('.a2-live-tick');
    let s = 8;
    seconds.textContent = s;
    DE.interval(() => {
      s += 1;
      if (s > 14) {
        s = 1;
        tickEl?.classList.add('is-refresh');
        setTimeout(() => tickEl?.classList.remove('is-refresh'), 700);
      }
      seconds.textContent = s;
    }, 1000);
  }


} };

DE.boot('analytics');
