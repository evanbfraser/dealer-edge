/* ═══════════════════════════════════════════════════════════════
   SALES PAGE  —  scroll choreography + interactive SMS demo
   ═══════════════════════════════════════════════════════════════
   Lifecycle: registered as DE.pages.sales and booted by the
   DE.boot('sales') call at the bottom — identical to the old
   self-executing IIFE on the static site; an SPA host can call
   DE.destroy() / DE.boot('sales') across soft navigations.
   ═══════════════════════════════════════════════════════════════ */

DE.pages.sales = { boot() {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     shared engine (js/de-core.js): Lenis + cursor glow + nav state
     ───────────────────────────────────────────────────────────── */
  const lenis = DE.createLenis();
  DE.initCursorGlow();
  DE.initNavScroll();
  DE.initScrollHint();
  DE.initEntryCue();

  let salesScrollLibsPromise = null;
  let statsInitialized = false;
  function loadSalesScrollLibs() {
    if (!salesScrollLibsPromise) salesScrollLibsPromise = DE.loadScrollLibs(lenis);
    return salesScrollLibsPromise;
  }

  function initStatsEngine() {
    if (statsInitialized) return salesScrollLibsPromise || Promise.resolve();
    statsInitialized = true;
    return loadSalesScrollLibs().then(() => {
      const statsSection = document.querySelector('[data-stats-section]');
      if (statsSection) initCohortStatsSection(statsSection);

      DE.attachSceneSnap(
        lenis,
        document.querySelector('.s-hero.s-stats-section'),
        document.querySelectorAll('.s-cohort-headline[data-stage]').length
      );

      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }

  function initStatsEngineLoader() {
    const statsSection = document.querySelector('[data-stats-section]');
    const run = () => { initStatsEngine(); };

    DE.prewarm(run, 250);

    document.querySelectorAll('a[href="#stats"]').forEach((link) => {
      link.addEventListener('click', run, { once: true });
    });

    if (window.location.hash === '#stats') run();

    if (!statsSection) return;
    const check = () => {
      if (statsInitialized) return;
      const rect = statsSection.getBoundingClientRect();
      if (rect.top < window.innerHeight) run();
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        run();
      }, { threshold: 0.05, rootMargin: '-1px 0px' });
      observer.observe(statsSection);
      DE.addDisposer(() => observer.disconnect());
    }

    DE.on(window, 'scroll', check, { passive: true });
    DE.on(window, 'resize', check, { passive: true });
  }

  let deActCssPromise = null;
  function loadDeActCss() {
    const href = 'css/de-act.min.css?v=20260702b';
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

  let salesLateCssPromise = null;
  let salesLateContentPromise = null;
  let salesLateContentReady = false;
  function loadSalesLateCss() {
    const href = 'css/sales-late.min.css?v=20260702d';
    if (document.querySelector(`link[href="${href}"]`)) {
      return salesLateCssPromise || Promise.resolve();
    }
    if (!salesLateCssPromise) {
      salesLateCssPromise = new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = resolve;
        document.head.appendChild(link);
      });
    }
    return salesLateCssPromise;
  }

  function initMarineModal() {
    const marineModal = document.querySelector('[data-marine-modal]');
    const marineOpen = document.querySelector('[data-marine-modal-open]');
    const marineClose = document.querySelector('[data-marine-modal-close]');
    if (!marineModal || !marineOpen || marineOpen.dataset.bound === 'true') return;
    marineOpen.dataset.bound = 'true';
    marineOpen.addEventListener('click', () => {
      if (typeof marineModal.showModal === 'function') marineModal.showModal();
      else marineModal.setAttribute('open', '');
    });
    marineClose?.addEventListener('click', () => marineModal.close());
    marineModal.addEventListener('click', (e) => {
      if (e.target === marineModal) marineModal.close();
    });
  }

  function loadSalesLateContent() {
    const root = document.querySelector('[data-sales-late-root]');
    if (!root) return Promise.resolve();
    if (salesLateContentReady || root.dataset.loaded === 'true') return salesLateContentPromise || Promise.resolve();
    if (!salesLateContentPromise) {
      salesLateContentPromise = fetch('partials/sales-late-content.html?v=20260701a')
        .then((response) => response.ok ? response.text() : '')
        .then((html) => {
          if (!html || root.dataset.loaded === 'true') return;
          root.innerHTML = html;
          root.dataset.loaded = 'true';
          salesLateContentReady = true;
          initMarineModal();
          DE.initFade();
          DE.initLazyVideoBoatSections();
          if (typeof window.initDemoModal === 'function') window.initDemoModal(lenis);
        })
        .catch(() => {});
    }
    return salesLateContentPromise;
  }

  /* One-shot: cached so repeat calls (the scroll-driven loader fires on
     every scroll event) can't re-run the chain. Before this guard, every
     scroll past the hero resolved the already-cached loads and hit the
     trailing ScrollTrigger.refresh() — whose pin-revert scrollTo() fires
     more scroll events — a self-sustaining full-refresh loop (~20/s) that
     ground mobile WebKit into the dirt and got worse the deeper the page
     loaded. Keep the refresh exactly once. */
  let salesLateExperiencePromise = null;
  function loadSalesLateExperience() {
    if (!salesLateExperiencePromise) {
      salesLateExperiencePromise = Promise.all([loadSalesLateContent(), loadDeActCss(), loadSalesLateCss()])
        .then(() => loadSalesLateJs())
        .then(() => {
          if (window.ScrollTrigger) ScrollTrigger.refresh();
        });
    }
    return salesLateExperiencePromise;
  }

  function initLateCssAndJsLoader() {
    const target = document.querySelector('[data-stats-section]');
    let requested = false;
    const load = () => {
      if (requested) return;
      requested = true;
      initStatsEngine().then(() => loadSalesLateExperience());
    };

    ['wheel', 'touchstart', 'keydown'].forEach((eventName) => {
      window.addEventListener(eventName, load, { once: true, passive: true });
    });

    document.querySelectorAll('a[href="#stats"]').forEach((link) => {
      link.addEventListener('click', load, { once: true });
    });

    if (!target) return;
    const check = () => {
      if (requested) return;
      const rect = target.getBoundingClientRect();
      if (window.scrollY > 0 && rect.top < window.innerHeight) load();
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        load();
      }, { threshold: 0.05, rootMargin: '-1px 0px' });
      observer.observe(target);
      DE.addDisposer(() => observer.disconnect());
    }
    DE.on(window, 'scroll', check, { passive: true });
    DE.on(window, 'resize', check, { passive: true });
  }

  /* ─────────────────────────────────────────────────────────────
     MOBILE NAV (mobile-nav.js — not shipped to the platform, where
     DeHeader owns the nav; guard so the island boot doesn't throw)
     ───────────────────────────────────────────────────────────── */
  DE.initMobileNav();

  /* ─────────────────────────────────────────────────────────────
     DEMO REQUEST MODAL
     ───────────────────────────────────────────────────────────── */
  DE.initLazyDemoModal(lenis);
  initLateCssAndJsLoader();

  /* [data-fade] reveal — shared observer in js/de-core.js */
  DE.initFade();

  /* ═════════════════════════════════════════════════════════════
     HERO + STATS  —  continuous 1,000-buyer cohort experience
     A legacy prospect-launch prototype remains below for reference.
     ═════════════════════════════════════════════════════════════ */

  const statsSection = document.querySelector('[data-stats-section]');
  initStatsEngineLoader();

  // Current hero: one continuous 1,000-buyer cohort story.
  function initCohortStatsSection(section) {
    const headlines = Array.from(section.querySelectorAll('[data-stage]'));
    const headlinesEl = section.querySelector('[data-cohort-headlines]');
    const labelEl = section.querySelector('[data-cohort-label]');
    const aliveLabelEl = section.querySelector('[data-cohort-alive-label]');
    const aliveValueEl = section.querySelector('[data-cohort-alive]');
    const lostLabelEl = section.querySelector('[data-cohort-lost-label]');
    const lostValueEl = section.querySelector('[data-cohort-lost]');
    const grid = section.querySelector('[data-cohort-grid]');
    const captionEl = section.querySelector('[data-cohort-caption]');
    const popupEl = section.querySelector('[data-cohort-popup]');
    const fixStackEl = section.querySelector('[data-cohort-fix-stack]');
    const sceneNext = section.querySelector('[data-scene-next]');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!headlines.length || !grid || !aliveValueEl || !lostValueEl) return;

    const TOTAL_DOTS = 100;
    const stages = [
      {
        alive: 1000,
        lost: 0,
        aliveLabel: 'Still here',
        lostLabel: 'Lost so far',
        label: 'All 1,000 buyers - still in your funnel',
        caption: '100 dots = 1,000 buyers. Each dot represents 10 people.',
        lostThrough: 0,
      },
      {
        alive: 300,
        lost: 700,
        aliveLabel: 'Still here',
        lostLabel: 'Lost to slow site',
        label: '700 bounced before your page even loaded',
        caption: '17.3s mobile LCP x 70% bounce rate = 700 buyers, gone.',
        lostThrough: 70,
      },
      {
        alive: 129,
        lost: 871,
        aliveLabel: 'Still engaged',
        lostLabel: 'Lost so far',
        label: '171 more vanished waiting for a 24-hour reply',
        caption: '57% of 300 = 171 leads that never heard back.',
        lostThrough: 87,
      },
      {
        alive: 49,
        lost: 951,
        aliveLabel: 'Still engaged',
        lostLabel: 'Lost so far',
        label: '80 more hung up on your voicemail and never called back',
        caption: '80% of callers hit voicemail. Most call the next dealer.',
        lostThrough: 95,
      },
      {
        alive: 19,
        lost: 981,
        aliveLabel: 'Booked',
        lostLabel: 'Paid for. Gone.',
        label: 'Only 19 of 1,000 ever booked a showing',
        caption: '19 of 1,000 is the industry baseline. The 981 are your real opportunity.',
        lostThrough: 98,
      },
      {
        alive: 60,
        lost: 41,
        aliveLabel: 'Booked',
        lostLabel: 'Deals recovered',
        label: 'Same 1,000 buyers. Every leak plugged.',
        caption: 'Same traffic. Fewer dead ends. More buyers make it through.',
        lostThrough: 98,
        isRecovery: true,
      },
    ];

    const recoverySteps = [
      { dotIdx: 25, count: 31, delta: '+12', fix: 'Instant page load', caption: 'Speed leak plugged. Buyers no longer bounce before the site renders.' },
      { dotIdx: 75, count: 47, delta: '+16', fix: 'AI replies in 60 seconds', caption: '24-hour gap closed. Every lead gets answered instantly, day or night.' },
      { dotIdx: 82, count: 53, delta: '+6', fix: 'Automated follow-up', caption: 'Conversation kept alive. The chat keeps going even after hours.' },
      { dotIdx: 90, count: 60, delta: '+7', fix: 'Smart voicemail capture', caption: 'Hangups turn into callbacks. No buyer disappears into the void.' },
    ];

    const baselineDotLabels = {
      98: 'Baseline booking',
      99: 'Baseline booking',
    };

    let currentStage = -1;
    let cohortGen = 0;
    let lastAlive = 1000;
    let lastLost = 0;
    let labelCarouselTimer = null;
    let labelCarouselIdx = 0;
    let labelCarouselPaused = false;
    let labelCarouselGen = 0;

    if (!grid.children.length) {
      for (let i = 0; i < TOTAL_DOTS; i += 1) {
        const dot = document.createElement('span');
        dot.className = 's-cohort-dot';
        dot.dataset.dot = String(i);
        grid.appendChild(dot);
      }
    }

    const dots = Array.from(grid.querySelectorAll('.s-cohort-dot'));

    function formatNumber(value) {
      return Number(value).toLocaleString('en-US');
    }

    const innerEl = section.querySelector('.s-hero-inner--pinned');
    const gridWrapEl = section.querySelector('.s-cohort-grid-wrap');
    const mobileHeroMedia = window.matchMedia('(max-width: 1100px)');

    /* Mobile: shrink the dot grid until the whole pinned stack (headline +
       label + grid + counters + caption) fits the pin. Headline height
       varies per beat and syncHeadlineSlot's inline min-height overrides
       any CSS cap on the headline slot, so a fixed grid size can't work —
       measure the pin's real overflow and cap the viz width instead (the
       grid is 1:1, so a width budget IS a height budget). The cap is
       cleared before measuring, so every call re-derives from the natural
       size — no compounding shrink. */
    function fitCohortViz() {
      if (!innerEl || !gridWrapEl) return;
      section.style.removeProperty('--s-cohort-viz-cap');
      if (!mobileHeroMedia.matches) return;
      const overflow = innerEl.scrollHeight - innerEl.clientHeight;
      if (overflow <= 0) return;
      const cap = Math.max(120, gridWrapEl.offsetHeight - overflow - 6);
      section.style.setProperty('--s-cohort-viz-cap', `${Math.round(cap)}px`);
    }

    function syncHeadlineSlot() {
      const active = headlines.find((headline) => headline.classList.contains('is-active'));
      if (!headlinesEl || !active) return;
      headlinesEl.style.minHeight = `${active.offsetHeight}px`;
      fitCohortViz();
    }

    function setText(el, value) {
      if (el) el.textContent = value;
    }

    function tweenNumber(el, from, to, opts = {}) {
      if (!el) return;
      const { duration = 0.65, prefix = '' } = opts;
      gsap.killTweensOf(el);
      const state = { value: from };
      gsap.to(state, {
        value: to,
        duration: prefersReducedMotion ? 0 : duration,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = `${prefix}${formatNumber(Math.round(state.value))}`;
        },
        onComplete: () => {
          el.textContent = `${prefix}${formatNumber(to)}`;
        },
      });
    }

    function applyLossBands(lostThrough) {
      dots.forEach((dot, idx) => {
        dot.className = 's-cohort-dot';
        if (idx >= 98) dot.classList.add('is-baseline');
        if (idx < lostThrough) {
          dot.classList.add(
            idx < 70 ? 'is-lost-1' :
              idx < 87 ? 'is-lost-2' :
                idx < 95 ? 'is-lost-3' : 'is-lost-4'
          );
        }
      });
    }

    function markDotRestored(dot) {
      if (!dot) return;
      dot.classList.remove('is-lost-1', 'is-lost-2', 'is-lost-3', 'is-lost-4');
      dot.classList.add('is-restored');
    }

    function setFixCards(activeCount = 0) {
      if (!fixStackEl) return;
      fixStackEl.innerHTML = recoverySteps.map((step, idx) => `
        <div class="s-cohort-fix-card ${idx < activeCount ? 'is-in' : ''}">
          <span class="s-cohort-fix-check">✓</span>
          <strong>${step.fix}</strong>
          <span>${step.delta}</span>
        </div>
      `).join('');
    }

    function isGreenDot(dot) {
      return dot.classList.contains('is-restored')
        || dot.classList.contains('is-baseline');
    }

    function getGreenDots() {
      return dots.filter(isGreenDot);
    }

    function getCarouselItems() {
      return recoverySteps
        .map((step) => ({
          dot: dots[step.dotIdx],
          label: `${step.delta} ${step.fix}`.trim(),
        }))
        .filter((item) => item.dot);
    }

    function getDotLabel(dotIdx) {
      const step = recoverySteps.find((item) => item.dotIdx === dotIdx);
      if (step) return `${step.delta} ${step.fix}`.trim();
      if (baselineDotLabels[dotIdx]) return baselineDotLabels[dotIdx];
      return 'Recovered booking';
    }

    function clearLabelHighlight() {
      dots.forEach((dot) => dot.classList.remove('is-label-active'));
    }

    function stopLabelCarousel() {
      if (labelCarouselTimer) {
        clearTimeout(labelCarouselTimer);
        labelCarouselTimer = null;
      }
      labelCarouselGen += 1;
      clearLabelHighlight();
    }

    function showPopupForDot(dot, label) {
      if (!popupEl || !grid || !dot) return;
      clearLabelHighlight();
      dot.classList.add('is-label-active');
      popupEl.textContent = label;
      if (window.matchMedia('(max-width: 640px)').matches) {
        popupEl.style.left = '50%';
        popupEl.style.top = '0px';
      } else {
        const gridR = grid.getBoundingClientRect();
        const dotR = dot.getBoundingClientRect();
        popupEl.style.left = `${dotR.left - gridR.left + dotR.width / 2}px`;
        popupEl.style.top = `${dotR.top - gridR.top}px`;
      }
      popupEl.classList.remove('is-in');
      void popupEl.offsetWidth;
      popupEl.classList.add('is-in');
    }

    function showPopup(step) {
      const dot = dots[step.dotIdx];
      if (!dot) return;
      showPopupForDot(dot, `${step.delta} ${step.fix}`.trim());
    }

    function startLabelCarousel(gen) {
      stopLabelCarousel();
      const carouselGen = ++labelCarouselGen;
      const items = getCarouselItems();
      if (!items.length) return;
      labelCarouselIdx = 0;
      labelCarouselPaused = false;

      const cycle = () => {
        if (gen !== cohortGen || carouselGen !== labelCarouselGen || labelCarouselPaused) return;
        const item = items[labelCarouselIdx % items.length];
        showPopupForDot(item.dot, item.label);
        labelCarouselIdx += 1;
        labelCarouselTimer = setTimeout(cycle, prefersReducedMotion ? 2400 : 1650);
      };

      cycle();
    }

    function pauseLabelCarouselForDot(dot) {
      if (currentStage !== stages.length - 1 || !isGreenDot(dot)) return;
      labelCarouselPaused = true;
      stopLabelCarousel();
      showPopupForDot(dot, getDotLabel(Number(dot.dataset.dot)));
    }

    function resumeLabelCarousel() {
      if (currentStage !== stages.length - 1) return;
      labelCarouselPaused = false;
      if (popupEl) popupEl.classList.remove('is-in');
      clearLabelHighlight();
      startLabelCarousel(cohortGen);
    }

    function setGreenDotInteractivity(enabled) {
      dots.forEach((dot) => {
        if (enabled && isGreenDot(dot)) {
          dot.setAttribute('tabindex', '0');
          dot.setAttribute('role', 'button');
          dot.setAttribute('aria-label', getDotLabel(Number(dot.dataset.dot)));
        } else {
          dot.removeAttribute('tabindex');
          dot.removeAttribute('role');
          dot.removeAttribute('aria-label');
        }
      });
    }

    dots.forEach((dot) => {
      dot.addEventListener('mouseenter', () => pauseLabelCarouselForDot(dot));
      dot.addEventListener('mouseleave', () => resumeLabelCarousel());
      dot.addEventListener('focusin', () => pauseLabelCarouselForDot(dot));
      dot.addEventListener('focusout', (e) => {
        if (currentStage !== stages.length - 1) return;
        const next = e.relatedTarget;
        if (next && next.classList && next.classList.contains('s-cohort-dot') && isGreenDot(next)) return;
        resumeLabelCarousel();
      });
    });

    function clearRecoveryUI() {
      stopLabelCarousel();
      labelCarouselPaused = false;
      setGreenDotInteractivity(false);
      if (popupEl) popupEl.classList.remove('is-in');
      if (sceneNext) {
        sceneNext.setAttribute('hidden', '');
        sceneNext.classList.remove('is-active');
      }
      if (fixStackEl) fixStackEl.innerHTML = '';
    }

    function runRecovery(stage, gen) {
      applyLossBands(stage.lostThrough);
      setFixCards(0);
      tweenNumber(aliveValueEl, 19, 19);
      tweenNumber(lostValueEl, 0, 0, { prefix: '+' });
      lastAlive = 19;
      lastLost = 0;

      const restoreFinal = () => {
        if (gen !== cohortGen) return;
        setText(aliveValueEl, formatNumber(60));
        setText(lostValueEl, '+41');
        lastAlive = 60;
        lastLost = 41;
        setText(captionEl, 'Same traffic. Fewer dead ends. More buyers make it through.');
        if (sceneNext) {
          sceneNext.removeAttribute('hidden');
          requestAnimationFrame(() => sceneNext.classList.add('is-active'));
        }
        if (popupEl) popupEl.classList.remove('is-in');
        setGreenDotInteractivity(true);
        startLabelCarousel(gen);
      };

      if (prefersReducedMotion) {
        recoverySteps.forEach((step) => {
          markDotRestored(dots[step.dotIdx]);
        });
        setFixCards(recoverySteps.length);
        setText(captionEl, stage.caption);
        restoreFinal();
        return;
      }

      recoverySteps.forEach((step, idx) => {
        const delay = prefersReducedMotion ? 0 : 520 + idx * 620;
        setTimeout(() => {
          if (gen !== cohortGen) return;
          markDotRestored(dots[step.dotIdx]);
          showPopup(step);
          setFixCards(idx + 1);
          setText(captionEl, step.caption);
          tweenNumber(aliveValueEl, lastAlive, step.count);
          tweenNumber(lostValueEl, lastLost, step.count - 19, { prefix: '+' });
          lastAlive = step.count;
          lastLost = step.count - 19;
          if (idx === recoverySteps.length - 1) {
            setTimeout(restoreFinal, prefersReducedMotion ? 0 : 760);
          }
        }, delay);
      });
    }

    function setStage(idx) {
      if (idx === currentStage) return;
      currentStage = idx;
      const gen = ++cohortGen;
      const stage = stages[idx];
      if (!stage) return;

      section.setAttribute('data-active-beat', String(idx + 1));
      section.classList.toggle('is-cohort-recovery', !!stage.isRecovery);
      headlines.forEach((headline, i) => headline.classList.toggle('is-active', i === idx));

      requestAnimationFrame(() => {
        syncHeadlineSlot();
        requestAnimationFrame(syncHeadlineSlot);
      });
      // beat content lands asynchronously (fonts, beat-6 fix cards +
      // scene-next banner) — re-fit the viz as it settles
      [420, 1100, 2200, 3600].forEach((delay) => {
        setTimeout(() => {
          if (gen === cohortGen) fitCohortViz();
        }, delay);
      });

      setText(labelEl, stage.label);
      setText(aliveLabelEl, stage.aliveLabel);
      setText(lostLabelEl, stage.lostLabel);
      setText(captionEl, stage.caption);
      clearRecoveryUI();

      if (stage.isRecovery) {
        runRecovery(stage, gen);
        return;
      }

      applyLossBands(stage.lostThrough);
      tweenNumber(aliveValueEl, lastAlive, stage.alive);
      tweenNumber(lostValueEl, lastLost, stage.lost);
      lastAlive = stage.alive;
      lastLost = stage.lost;
    }

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const idx = Math.min(stages.length - 1, Math.floor(self.progress * stages.length));
        setStage(idx);
      },
    });

    setStage(0);
    syncHeadlineSlot();
    DE.on(window, 'resize', syncHeadlineSlot);
  }


  /* ─────────────────────────────────────────────────────────────
     SNAP-TO-SCENE for the pinned hero — shared tuned implementation
     in js/de-core.js. Attached in the core file so the opening
     cohort story keeps its premium scroll feel before late acts load.
     ───────────────────────────────────────────────────────────── */
  let salesLateJsPromise = null;
  let salesLateInitialized = false;
  function loadSalesLateJs() {
    const src = 'js/sales-late.min.js?v=20260701a';
    if (!salesLateJsPromise) {
      salesLateJsPromise = Promise.all([initStatsEngine(), loadSalesLateContent()]).then(() => new Promise((resolve) => {
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
    return salesLateJsPromise.then(() => {
      if (!salesLateInitialized && typeof DE.initSalesLate === 'function') {
        salesLateInitialized = true;
        DE.initSalesLate(lenis);
      }
    });
  }

} };

DE.boot('sales');
