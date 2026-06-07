/* ═══════════════════════════════════════════════════════════════
   ANALYTICS PAGE - scroll choreography
   ═══════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  const reduceMotion = DE.reduceMotion;
  const lenis = DE.createLenis();

  initMobileNav();
  initDemoModal(lenis);
  DE.initCursorGlow();
  DE.initNavScroll();
  DE.initFade();
  if (typeof initVideoBoatSections === 'function') {
    initVideoBoatSections();
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', initVideoBoatSections);
  }

  initHero();

  const animCleanups = new WeakMap();
  const BEAT_ANIMS = {
    'ana-late-report': playSequential,
    'ana-live-report': playLiveReport,
    'ana-scattered': playSequential,
    'ana-unify': playSequential,
    'ana-clicks': playSequential,
    'ana-sold-path': playSequential,
    'ana-slow-response': playSequential,
    'ana-comms': playSequential,
    'ana-quality': playSequential,
    'ana-funnel': playSequential,
    'ana-optimize': playSequential,
    'ana-brief': playSequential,
  };

  DE.initActs(lenis, { anims: BEAT_ANIMS, cleanups: animCleanups });

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function tick(stillCurrent, fn) {
    if (typeof stillCurrent === 'function' && !stillCurrent()) return;
    fn();
  }

  function schedule(stillCurrent, delay, fn) {
    return setTimeout(() => tick(stillCurrent, fn), reduceMotion ? Math.min(delay, 60) : delay);
  }

  function initHero() {
    const hero = document.querySelector('[data-analytics-hero]');
    if (!hero) return;

    const slides = [...hero.querySelectorAll('[data-hero-stage]')];
    const reportTitle = hero.querySelector('[data-hero-report-title]');
    let active = -1;

    function setStage(index) {
      const next = clamp(index, 0, slides.length - 1);
      if (next === active) return;
      active = next;
      hero.dataset.activeStage = String(next + 1);
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === next));
      if (reportTitle) {
        reportTitle.textContent = next === 0
          ? 'month-end-report.pdf'
          : next === 1
            ? 'DealerEdge live analytics'
            : 'sold-boat optimization loop';
      }
    }

    setStage(0);

    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const next = Math.min(slides.length - 1, Math.floor(self.progress * slides.length));
        setStage(next);
      },
      onLeaveBack: () => setStage(0),
    });
  }

  function resetSteps(beatEl) {
    const steps = [...beatEl.querySelectorAll('[data-step]')];
    steps.forEach((el) => el.classList.remove('is-in'));
    return steps;
  }

  function playSequential(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const steps = resetSteps(beatEl);
    steps.forEach((el, i) => schedule(stillCurrent, 220 + i * 145, () => el.classList.add('is-in')));
  }

  function playLiveReport(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const steps = resetSteps(beatEl);
    steps.forEach((el, i) => schedule(stillCurrent, 200 + i * 140, () => el.classList.add('is-in')));

    const counters = [...beatEl.querySelectorAll('[data-count-to]')];
    counters.forEach((counter, i) => {
      const prefix = counter.dataset.countPrefix || '';
      const suffix = counter.dataset.countSuffix || '';
      counter.textContent = `${prefix}0${suffix}`;
      schedule(stillCurrent, 500 + i * 120, () => animateCounter(counter, stillCurrent));
    });
  }

  function animateCounter(el, stillCurrent) {
    const target = Number(el.dataset.countTo || 0);
    const prefix = el.dataset.countPrefix || '';
    const suffix = el.dataset.countSuffix || '';
    const duration = reduceMotion ? 1 : 850;
    const start = performance.now();
    let raf = 0;

    function frame(now) {
      if (typeof stillCurrent === 'function' && !stillCurrent()) {
        if (raf) cancelAnimationFrame(raf);
        return;
      }
      const progress = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = `${prefix}${value}${suffix}`;
      if (progress < 1) {
        raf = requestAnimationFrame(frame);
      }
    }

    raf = requestAnimationFrame(frame);
  }
})();
