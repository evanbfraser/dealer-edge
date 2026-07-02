/* ───────────────────────────────────────────────────────────────────────
   features.js — the "system overview" page.
   Reuses the shared chassis (js/de-core.js): Lenis + cursor + nav + fade +
   the DE.initActs scroll controller. The system-loop act is one persistent
   scene; each beat just calls setLoopStage(N) to advance which nodes/arcs
   are lit. Also owns the contact modal + the department-chat modal.
   Lifecycle: registered as DE.pages.features, booted by the
   DE.boot('features') call at the bottom (see js/de-core.js).
   ─────────────────────────────────────────────────────────────────────── */
DE.pages.features = { boot() {
  'use strict';

  const lenis = DE.createLenis();

  let featuresLateContentPromise = null;
  let featuresLateContentReady = false;
  function loadFeaturesLateContent() {
    const root = document.querySelector('[data-features-late-root]');
    if (!root) return Promise.resolve();
    if (featuresLateContentReady || root.dataset.loaded === 'true') return featuresLateContentPromise || Promise.resolve();
    if (!featuresLateContentPromise) {
      featuresLateContentPromise = fetch('partials/features-late-content.html?v=20260630a')
        .then((response) => response.ok ? response.text() : '')
        .then((html) => {
          if (!html || root.dataset.loaded === 'true') return;
          root.innerHTML = html;
          root.dataset.loaded = 'true';
          featuresLateContentReady = true;
          DE.initFade();
          DE.initLazyVideoBoatSections();
          document.querySelectorAll('.js-modal, .js-dept-modal').forEach((trigger) => {
            trigger.addEventListener('pointerenter', () => loadFeaturesLate(), { once: true, passive: true });
            trigger.addEventListener('focus', () => loadFeaturesLate(), { once: true });
          });
        })
        .catch(() => {});
    }
    return featuresLateContentPromise;
  }

  function initFeaturesLateContentLoader() {
    const root = document.querySelector('[data-features-late-root]');
    const load = () => loadFeaturesLateContent();

    if (!root) return;
    const check = () => {
      const rect = root.getBoundingClientRect();
      if (window.scrollY > 0 && rect.top < window.innerHeight + 1200) load();
    };
    DE.on(window, 'scroll', check, { passive: true });
    DE.on(window, 'resize', check, { passive: true });
  }

  DE.initMobileNav(); // not shipped to the platform (DeHeader owns nav)
  DE.initCursorGlow();
  DE.initNavScroll();
  DE.initScrollHint();
  DE.initEntryCue();
  DE.initFade();
  DE.initLazyVideoBoatSections();
  initFeaturesLateContentLoader();

  // ─── SYSTEM LOOP ───────────────────────────────────────────────────
  // The scene persists; setLoopStage(n) is idempotent + absolute (lights
  // everything with data-order <= n, dims the rest), so scrolling up
  // reverses cleanly. n: 0 = broken, 1..4 = build, 5 = closed flywheel.
  const loopStage = document.querySelector('[data-loop-stage]');
  if (loopStage) buildLoopFX(loopStage);
  if (loopStage) initDeferredLoopMedia(loopStage);
  // scope spans the sticky so the metric (a sibling of the loop stage) still lights
  const loopScope = loopStage ? (loopStage.closest('.de-act-stage-sticky') || loopStage) : null;
  const loopEls = loopScope ? [...loopScope.querySelectorAll('[data-order]')] : [];

  function hydrateLoopMedia(stage) {
    if (!stage || stage.dataset.mediaHydrated === 'true') return;
    stage.dataset.mediaHydrated = 'true';
    stage.querySelectorAll('source[data-loop-srcset]').forEach((source) => {
      source.srcset = source.dataset.loopSrcset;
      source.removeAttribute('data-loop-srcset');
    });
    stage.querySelectorAll('img[data-loop-src]').forEach((img) => {
      img.src = img.dataset.loopSrc;
      img.removeAttribute('data-loop-src');
    });
  }

  function initDeferredLoopMedia(stage) {
    const check = () => {
      if (window.scrollY < 240) return;
      const rect = stage.getBoundingClientRect();
      if (rect.top < window.innerHeight + 180 && rect.bottom > -180) hydrateLoopMedia(stage);
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        check();
        if (stage.dataset.mediaHydrated === 'true') observer.disconnect();
      }, { rootMargin: '180px 0px' });
      observer.observe(stage);
    }
    DE.on(window, 'scroll', check, { passive: true });
    DE.on(window, 'resize', check, { passive: true });
    check();
  }

  // Premium FX: a faint always-on base circuit behind each arc, a bright
  // "packet" layer that flows along it once lit, and ambient particles.
  // Base layers drop data-order (always faint); flow layers keep it so
  // setLoopStage lights them in step with the arc they trace.
  function buildLoopFX(stage) {
    const svg = stage.querySelector('.f-traces');
    if (svg) {
      [...svg.querySelectorAll('.f-arc')].forEach((arc) => {
        const base = arc.cloneNode();
        base.removeAttribute('data-order');
        base.setAttribute('class', 'f-arc-base');
        svg.insertBefore(base, svg.firstChild);
        const flow = arc.cloneNode();
        flow.setAttribute('class', 'f-arc-flow'); // keeps data-order → lights with its arc
        svg.appendChild(flow);
      });
    }
    const field = document.createElement('div');
    field.className = 'f-particles';
    field.setAttribute('aria-hidden', 'true');
    [[12, 22], [27, 68], [44, 14], [63, 82], [78, 30], [88, 58], [8, 46], [70, 12], [34, 88], [92, 26], [54, 38], [20, 80]]
      .forEach(([x, y], i) => {
        const d = document.createElement('span');
        d.className = 'f-particle';
        d.style.cssText = `left:${x}%;top:${y}%;--dur:${7 + (i % 5)}s;--dly:-${(i * 0.7).toFixed(1)}s`;
        field.appendChild(d);
      });
    stage.insertBefore(field, stage.firstChild);
  }

  function setLoopStage(n) {
    if (!loopStage) return;
    if (n > 0) hydrateLoopMedia(loopStage);
    loopStage.classList.toggle('is-broken', n === 0);
    loopStage.classList.toggle('is-flywheel', n >= 5);
    loopStage.classList.toggle('is-closed', n >= 5);
    loopEls.forEach((el) => {
      const lit = n >= 1 && Number(el.dataset.order) <= n;
      el.classList.toggle('is-lit', lit);
    });
    // safety: once we're past the Sales beat, make sure its SMS is shown even if
    // the type-in handler didn't run (e.g. a scroll jump straight to the end)
    if (n >= 4) {
      document.querySelectorAll('.f-node--sales .f-sms-bubble, .f-node--sales .f-sms-stamp')
        .forEach((el) => el.classList.add('is-in'));
    }
    setDetail(n);
  }

  // active-node detail (mobile): the real proof for the current beat. Per node:
  // inventory = before→after loop, sales = SMS that types in, others = the screenshot.
  const detailEl = document.querySelector('[data-detail]');

  // type the SMS bubbles in — used by the Sales NODE on desktop and its detail card on mobile
  function animateSMS(scope) {
    if (!scope) return;
    const items = [...scope.querySelectorAll('.f-sms-bubble, .f-sms-stamp')];
    if (!items.length) return;
    items.forEach((el) => el.classList.remove('is-in'));
    const delays = DE.reduceMotion ? [0, 0, 0] : [250, 1150, 1700];
    items.forEach((el, i) => setTimeout(() => el.classList.add('is-in'), delays[i] != null ? delays[i] : 250 + i * 500));
  }

  // mobile detail card: clone the active node's panel (inventory = before/after,
  // sales = SMS, etc.). Desktop shows the nodes' own panels, so this is mobile-only.
  function setDetail(n) {
    if (!detailEl || !loopStage) return;
    const key = { 1: 'inventory', 2: 'marketing', 3: 'sales', 4: 'analytics' }[n];
    if (!key) { detailEl.classList.remove('is-shown'); detailEl.removeAttribute('data-node'); return; }
    if (detailEl.dataset.node !== key) {
      detailEl.dataset.node = key;
      const win = loopStage.querySelector('.f-node--' + key + ' .f-win');
      detailEl.innerHTML = win ? win.outerHTML : '';
      if (key === 'sales') animateSMS(detailEl);
    }
    detailEl.classList.add('is-shown');
  }

  // the compounding payoff: count the metric up as the wheel spins (final beat)
  function runMetric(stillCurrent) {
    const el = document.querySelector('.f-metric [data-count]');
    if (!el) return;
    const end = Number(el.dataset.count) || 0;
    if (DE.reduceMotion) { el.textContent = '+' + end; return; }
    const dur = 2200;
    let startT = null;
    el.textContent = '+0';
    function step(now) {
      if (typeof stillCurrent === 'function' && !stillCurrent()) return;
      if (startT === null) startT = now;
      const t = Math.min(1, (now - startT) / dur);
      el.textContent = '+' + Math.round((1 - Math.pow(1 - t, 3)) * end);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const animCleanups = new WeakMap();

  const BEAT_ANIMS = {
    'f-loop-broken': () => setLoopStage(0),
    'f-loop-1': () => setLoopStage(1),
    'f-loop-2': () => setLoopStage(2),
    'f-loop-3': () => { setLoopStage(3); animateSMS(document.querySelector('.f-node--sales')); },
    'f-loop-4': () => setLoopStage(4),
    'f-loop-5': (beatEl, stillCurrent) => { setLoopStage(5); runMetric(stillCurrent); },
  };

  let scrollLibsPromise = null;
  let actsInitialized = false;
  function loadFeatureScrollLibs() {
    if (!scrollLibsPromise) scrollLibsPromise = DE.loadScrollLibs(lenis);
    return scrollLibsPromise;
  }

  function initFeatureActsWhenReady() {
    if (actsInitialized) return;
    actsInitialized = true;
    loadFeatureScrollLibs().then(() => {
      DE.initActs(lenis, { anims: BEAT_ANIMS, cleanups: animCleanups });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }

  function initFeatureScrollLibLoader() {
    DE.prewarm(initFeatureActsWhenReady, 250);
  }

  // Must run AFTER the BEAT_ANIMS declaration (TDZ), but can wait until scroll intent.
  initFeatureScrollLibLoader();

  let featuresLatePromise = null;
  let featuresLateInitialized = false;
  function loadFeaturesLate() {
    const src = 'js/features-late.min.js?v=20260702f';
    if (!featuresLatePromise) {
      featuresLatePromise = new Promise((resolve) => {
        const existing = document.querySelector('script[src="' + src + '"]');
        if (existing) {
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', resolve, { once: true });
          return;
        }
        loadFeaturesLateContent().then(() => {
          const script = document.createElement('script');
          script.src = src;
          script.defer = true;
          script.onload = resolve;
          script.onerror = resolve;
          document.head.appendChild(script);
        });
      });
    }
    return featuresLatePromise.then(() => {
      if (!featuresLateInitialized && typeof DE.initFeaturesLate === 'function') {
        featuresLateInitialized = true;
        return DE.initFeaturesLate(lenis);
      }
      return window.DE.__featuresLateReady || Promise.resolve();
    });
  }

  DE.on(document, 'click', (event) => {
    const trigger = event.target.closest?.('.js-modal, .js-dept-modal');
    if (!trigger || featuresLateInitialized) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    loadFeaturesLate().then(() => trigger.click());
  }, { capture: true });

  document.querySelectorAll('.js-modal, .js-dept-modal').forEach((trigger) => {
    trigger.addEventListener('pointerenter', () => loadFeaturesLate(), { once: true, passive: true });
    trigger.addEventListener('focus', () => loadFeaturesLate(), { once: true });
  });

  if (window.ScrollTrigger) ScrollTrigger.refresh();
} };

DE.boot('features');
