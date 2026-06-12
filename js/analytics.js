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

  initMobileNav();
  initDemoModal(lenis);
  DE.initCursorGlow();
  DE.initNavScroll();
  DE.initFade();
  initLiveTicker();
  if (typeof initVideoBoatSections === 'function') {
    initVideoBoatSections();
    DE.on(window.matchMedia('(prefers-reduced-motion: reduce)'), 'change', initVideoBoatSections);
  }

  /* ─────────────────────────────────────────────────────────────
     BEAT ANIMS — dispatch keys for the act engine
     ───────────────────────────────────────────────────────────── */
  const animCleanups = new WeakMap();

  const BEAT_ANIMS = {
    'an-late': playLate,
    'an-tabs': playTabs,
    'an-connect': playConnect, // dormant — beat replaced by an-fullreport (kept for easy restore)
    'an-fullreport': playFullReport,
    'an-live': playLive,
    'an-clarity': playClarity, // dormant — beat replaced by an-clicks
    'an-clicks': playSteps,
    'an-funnel': playFunnel, // dormant — beat replaced by an-sold-path
    'an-sold-path': playSteps,
    'an-vanity': playVanity, // dormant — cut from Act 2 (Act 1 beat 5 owns clicks-vanity)
    'an-lag': playLag,
    'an-optimize': playOptimize,
    'an-chain': playChain,
    'an-comms': playComms,
    'an-close': playClose, // dormant — folded into an-brief
    'an-brief': playBrief,
  };

  DE.initActs(lenis, { anims: BEAT_ANIMS, cleanups: animCleanups });

  /* ─────────────────────────────────────────────────────────────
     Helpers
     ───────────────────────────────────────────────────────────── */
  function tick(stillCurrent, fn) {
    if (typeof stillCurrent === 'function' && !stillCurrent()) return;
    fn();
  }

  function schedule(stillCurrent, delay, fn) {
    return setTimeout(() => tick(stillCurrent, fn), reduceMotion ? Math.min(delay, 60) : delay);
  }

  function storeCleanup(beatEl, cleanup) {
    const prev = animCleanups.get(beatEl);
    if (prev) prev();
    animCleanups.set(beatEl, cleanup);
  }

  function staggerIn(stillCurrent, els, start, step, className = 'is-in') {
    els.forEach((el, i) => schedule(stillCurrent, start + i * step, () => el.classList.add(className)));
  }

  // rAF number tween → returns a cancel function (collect into storeCleanup)
  function tweenNum(stillCurrent, el, target, duration, format) {
    const fmt = format || ((v) => Math.round(v).toLocaleString('en-US'));
    if (reduceMotion) { el.textContent = fmt(target); return () => {}; }
    let raf = 0;
    const start = performance.now();
    const step = (now) => {
      if (!stillCurrent()) return;
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
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

  /* ═════════════════════════════════════════════════════════════
     ACT 1 · BEAT 1 — the month-end PDF arrives late
     ═════════════════════════════════════════════════════════════ */
  function playLate(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const doc = beatEl.querySelector('[data-pdf-doc]');
    const stamp = beatEl.querySelector('[data-pdf-stamp]');
    const budget = beatEl.querySelector('[data-pdf-budget]');
    const amount = beatEl.querySelector('[data-pdf-amount]');
    const bar = beatEl.querySelector('[data-pdf-bar]');
    const gone = beatEl.querySelector('[data-pdf-gone]');
    if (!doc || !budget) return;

    doc.classList.remove('is-in');
    stamp?.classList.remove('is-in');
    budget.classList.remove('is-in');
    bar?.classList.remove('is-full');
    gone?.classList.remove('is-in');
    if (amount) amount.textContent = '$0';

    let cancelTween = () => {};
    storeCleanup(beatEl, () => cancelTween());

    schedule(stillCurrent, 250, () => doc.classList.add('is-in'));
    schedule(stillCurrent, 1000, () => stamp?.classList.add('is-in'));
    schedule(stillCurrent, 1650, () => budget.classList.add('is-in'));
    schedule(stillCurrent, 2050, () => {
      bar?.classList.add('is-full');
      if (amount) {
        cancelTween = tweenNum(stillCurrent, amount, 9301.6, 1600,
          (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      }
    });
    schedule(stillCurrent, 3750, () => gone?.classList.add('is-in'));
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 1 · BEAT 3 — seven separate logins (none agree)
     ═════════════════════════════════════════════════════════════ */
  function playTabs(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const q = beatEl.querySelector('[data-tabs-q]');
    const tabs = [...beatEl.querySelectorAll('[data-tab]')];
    const verdict = beatEl.querySelector('[data-tabs-verdict]');
    if (!tabs.length) return;

    q?.classList.remove('is-in');
    tabs.forEach((t) => t.classList.remove('is-in', 'is-flagged'));
    verdict?.classList.remove('is-in');

    schedule(stillCurrent, 250, () => q?.classList.add('is-in'));
    staggerIn(stillCurrent, tabs, 700, 190);
    staggerIn(stillCurrent, tabs, 2200, 110, 'is-flagged');
    schedule(stillCurrent, 3100, () => verdict?.classList.add('is-in'));
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 1 · BEAT 3 — every source, wired in
     ═════════════════════════════════════════════════════════════ */
  function playConnect(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const sources = [...beatEl.querySelectorAll('[data-connect-source]')];
    const tokens = [...beatEl.querySelectorAll('[data-connect-token]')];
    const core = beatEl.querySelector('[data-connect-core]');
    const count = beatEl.querySelector('[data-connect-count]');
    const badge = beatEl.querySelector('[data-connect-badge]');
    if (!core) return;

    sources.forEach((s) => s.classList.remove('is-in', 'is-live'));
    tokens.forEach((t) => t.classList.remove('is-in'));
    core.classList.remove('is-in');
    badge?.classList.remove('is-in');
    if (count) count.textContent = '0';

    let cancelTween = () => {};
    storeCleanup(beatEl, () => cancelTween());

    staggerIn(stillCurrent, sources, 250, 140);
    staggerIn(stillCurrent, tokens, 1300, 75);
    schedule(stillCurrent, 2150, () => {
      core.classList.add('is-in');
      if (count) cancelTween = tweenNum(stillCurrent, count, 7, 900);
    });
    schedule(stillCurrent, 3100, () => {
      badge?.classList.add('is-in');
      sources.forEach((s) => s.classList.add('is-live'));
    });
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 1 · BEAT 3 — the live report (count-up KPIs + self-drawing trend chart)
     ═════════════════════════════════════════════════════════════ */
  function playLive(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const steps = [...beatEl.querySelectorAll('[data-step]')];
    const counters = [...beatEl.querySelectorAll('[data-count-to]')];
    if (!steps.length) return;

    // reset for clean re-entry
    steps.forEach((el) => el.classList.remove('is-in'));
    counters.forEach((c) => {
      const prefix = c.dataset.countPrefix || '';
      const suffix = c.dataset.countSuffix || '';
      c.textContent = `${prefix}0${suffix}`;
    });

    const cancels = [];
    storeCleanup(beatEl, () => cancels.forEach((fn) => fn()));

    // head → cards → chart reveal in sequence; the chart's .is-in also draws the line
    staggerIn(stillCurrent, steps, 200, 140);

    // count each KPI up as its card lands
    counters.forEach((c, i) => {
      const prefix = c.dataset.countPrefix || '';
      const suffix = c.dataset.countSuffix || '';
      const target = Number(c.dataset.countTo || 0);
      schedule(stillCurrent, 500 + i * 120, () => {
        cancels.push(tweenNum(stillCurrent, c, target, 850, (v) => `${prefix}${Math.round(v)}${suffix}`));
      });
    });
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 1 · BEAT 4 — the full live report (real screenshot auto-pans)
     ═════════════════════════════════════════════════════════════ */
  function playFullReport(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const win = beatEl.querySelector('[data-fullreport-window]');
    const viewport = beatEl.querySelector('[data-fullreport-viewport]');
    const shot = beatEl.querySelector('[data-fullreport-shot]');
    const chip = beatEl.querySelector('[data-fullreport-chip]');
    const meta = beatEl.querySelector('[data-fullreport-meta]');
    if (!win || !shot) return;

    win.classList.remove('is-in');
    chip?.classList.remove('is-in');
    meta?.classList.remove('is-in');
    shot.style.transition = 'none';
    shot.style.transform = 'translateY(0)';

    storeCleanup(beatEl, () => { shot.style.transition = 'none'; });

    schedule(stillCurrent, 250, () => win.classList.add('is-in'));
    schedule(stillCurrent, 900, () => chip?.classList.add('is-in'));
    schedule(stillCurrent, 1300, () => {
      if (reduceMotion || !viewport) return;
      const dist = shot.offsetHeight - viewport.offsetHeight;
      if (dist <= 0) return;
      // force the reset frame before transitioning down the report
      void shot.offsetHeight;
      shot.style.transition = 'transform 7s cubic-bezier(0.45, 0, 0.3, 1)';
      shot.style.transform = 'translateY(-' + dist + 'px)';
    });
    schedule(stillCurrent, 1700, () => meta?.classList.add('is-in'));
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 1 · BEATS 5 & 6 — path diagrams (clicks-stop / sold-path)
     Generic [data-step] stagger reveal (ported from V1 playSequential).
     ═════════════════════════════════════════════════════════════ */
  function playSteps(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const steps = [...beatEl.querySelectorAll('[data-step]')];
    steps.forEach((el) => el.classList.remove('is-in'));
    staggerIn(stillCurrent, steps, 200, 160);
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 2 · BEAT 5 — the owner's daily brief (D); stagger + count the outcome
     ═════════════════════════════════════════════════════════════ */
  function playBrief(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const steps = [...beatEl.querySelectorAll('[data-step]')];
    steps.forEach((el) => el.classList.remove('is-in'));
    const num = beatEl.querySelector('[data-brief-num]');
    if (num) num.textContent = '0';

    const cancels = [];
    storeCleanup(beatEl, () => cancels.forEach((fn) => fn()));

    staggerIn(stillCurrent, steps, 200, 220);
    if (num) {
      schedule(stillCurrent, 200 + steps.length * 220 + 150, () => {
        cancels.push(tweenNum(stillCurrent, num, 12, 900, (v) => Math.round(v)));
      });
    }
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 1 · BEAT 5 — plain English: working vs not
     ═════════════════════════════════════════════════════════════ */
  function playClarity(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const rows = [...beatEl.querySelectorAll('[data-clarity-row]')];
    const note = beatEl.querySelector('[data-clarity-note]');
    if (!rows.length) return;

    rows.forEach((r) => r.classList.remove('is-in'));
    note?.classList.remove('is-in');

    staggerIn(stillCurrent, rows, 300, 320);
    schedule(stillCurrent, 300 + rows.length * 320 + 350, () => note?.classList.add('is-in'));
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 1 · BEAT 6 — the full funnel, to sold
     ═════════════════════════════════════════════════════════════ */
  function playFunnel(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const stages = [...beatEl.querySelectorAll('[data-funnel-stage]')];
    const nums = [...beatEl.querySelectorAll('[data-funnel-num]')];
    const note = beatEl.querySelector('[data-funnel-note]');
    if (!stages.length) return;

    stages.forEach((s) => s.classList.remove('is-in'));
    note?.classList.remove('is-in');
    nums.forEach((n) => { n.textContent = '0'; });

    const cancels = [];
    storeCleanup(beatEl, () => cancels.forEach((c) => c()));

    stages.forEach((stage, i) => {
      schedule(stillCurrent, 300 + i * 340, () => {
        stage.classList.add('is-in');
        const num = stage.querySelector('[data-funnel-num]');
        if (num) cancels.push(tweenNum(stillCurrent, num, Number(num.dataset.target || 0), 900));
      });
    });
    schedule(stillCurrent, 300 + stages.length * 340 + 700, () => note?.classList.add('is-in'));
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 2 · BEAT 1 — the vanity slide
     ═════════════════════════════════════════════════════════════ */
  function playVanity(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const stats = [...beatEl.querySelectorAll('[data-vanity-stat]')];
    const missing = beatEl.querySelector('[data-vanity-missing]');
    if (!stats.length) return;

    stats.forEach((s) => s.classList.remove('is-in'));
    missing?.classList.remove('is-in');

    staggerIn(stillCurrent, stats, 350, 330);
    schedule(stillCurrent, 1900, () => missing?.classList.add('is-in'));
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 2 · BEAT 2 — too late to matter (the lag timeline)
     ═════════════════════════════════════════════════════════════ */
  function playLag(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const fill = beatEl.querySelector('[data-lag-fill]');
    const stops = [...beatEl.querySelectorAll('[data-lag-stop]')];
    const cost = beatEl.querySelector('[data-lag-cost]');
    if (!stops.length) return;

    fill?.classList.remove('is-full');
    stops.forEach((s) => s.classList.remove('is-in'));
    cost?.classList.remove('is-in');

    schedule(stillCurrent, 300, () => fill?.classList.add('is-full'));
    staggerIn(stillCurrent, stops, 450, 560);
    schedule(stillCurrent, 3000, () => cost?.classList.add('is-in'));
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 2 · BEAT 3 — the AI optimization log
     ═════════════════════════════════════════════════════════════ */
  function playOptimize(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const rows = [...beatEl.querySelectorAll('[data-opt-row]')];
    const note = beatEl.querySelector('[data-optimize-note]');
    if (!rows.length) return;

    rows.forEach((r) => r.classList.remove('is-in'));
    note?.classList.remove('is-in');

    staggerIn(stillCurrent, rows, 350, 480);
    schedule(stillCurrent, 350 + rows.length * 480 + 350, () => note?.classList.add('is-in'));
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 2 · BEAT 4 — the chain to the boat (attribution)
     ═════════════════════════════════════════════════════════════ */
  function playChain(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const links = [...beatEl.querySelectorAll('[data-chain-link]')];
    const note = beatEl.querySelector('[data-chain-note]');
    if (!links.length) return;

    links.forEach((l) => l.classList.remove('is-lit'));
    note?.classList.remove('is-in');

    staggerIn(stillCurrent, links, 400, 520, 'is-lit');
    schedule(stillCurrent, 400 + links.length * 520 + 350, () => note?.classList.add('is-in'));
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 2 · BEAT 5 — comms analytics (real screenshot + chips)
     ═════════════════════════════════════════════════════════════ */
  function playComms(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const win = beatEl.querySelector('[data-comms-window]');
    const chips = [...beatEl.querySelectorAll('[data-comms-chip]')];
    if (!win) return;

    win.classList.remove('is-in');
    chips.forEach((c) => c.classList.remove('is-in'));

    schedule(stillCurrent, 300, () => win.classList.add('is-in'));
    staggerIn(stillCurrent, chips, 1200, 300);
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 2 · BEAT 6 — sold boats, not clicks (the close)
     ═════════════════════════════════════════════════════════════ */
  function playClose(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const dims = [...beatEl.querySelectorAll('[data-close-dim]')];
    const win = beatEl.querySelector('[data-close-win]');
    const num = beatEl.querySelector('[data-close-num]');
    const margin = beatEl.querySelector('[data-close-margin]');
    if (!win) return;

    dims.forEach((d) => d.classList.remove('is-in'));
    win.classList.remove('is-in');
    margin?.classList.remove('is-in');
    if (num) num.textContent = '0';

    let cancelTween = () => {};
    storeCleanup(beatEl, () => cancelTween());

    staggerIn(stillCurrent, dims, 300, 260);
    schedule(stillCurrent, 1150, () => {
      win.classList.add('is-in');
      if (num) cancelTween = tweenNum(stillCurrent, num, 12, 1100);
    });
    schedule(stillCurrent, 2500, () => margin?.classList.add('is-in'));
  }

} };

DE.boot('analytics');
