/* ═══════════════════════════════════════════════════════════════
   INVENTORY PAGE - scroll choreography
   ═══════════════════════════════════════════════════════════════
   The act engine is shared (DE.initActs in js/de-core.js); this
   file owns the page's BEAT_ANIMS handlers + the before/after
   scrub slider. Conventions (see CLAUDE.md): every handler resets
   its own state first, guards async steps with stillCurrent, and
   marks the beat is-playing.
   ─────────────────────────────────────────────────────────────── */

(() => {
  'use strict';

  const reduceMotion = DE.reduceMotion;

  // shared engine (js/de-core.js): Lenis + cursor glow + nav state + fade
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

  /* ─────────────────────────────────────────────────────────────
     BEAT ANIMS — dispatch keys for the act engine
     ───────────────────────────────────────────────────────────── */
  const animCleanups = new WeakMap();

  const BEAT_ANIMS = {
    'inv-buried': playBuried,
    'inv-ingest': playIngest,
    'inv-rawshot': playRawshot,
    'inv-pipeline': playPipeline,
    'inv-ba': playBeforeAfter,
    'inv-spine': playSpine,
    'inv-invisible': playInvisible,
    'inv-rank': playRank,
    'inv-stale': playStale,
    'inv-synd': playSynd,
    'inv-dash': playDash,
    'inv-price': playPrice,
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

  function countUp(el, to, ms, stillCurrent, format) {
    const start = performance.now();
    const fmt = format || ((v) => Math.round(v).toLocaleString('en-US'));
    function frame(now) {
      if (typeof stillCurrent === 'function' && !stillCurrent()) return;
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * eased);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 1 · BEAT 1 — the buried record (65 fields in, 3 out)
     ═════════════════════════════════════════════════════════════ */
  function playBuried(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const rows = [...beatEl.querySelectorAll('[data-buried-row]')];
    const count = beatEl.querySelector('[data-buried-count]');
    const gate = beatEl.querySelector('[data-buried-gate]');
    const listing = beatEl.querySelector('[data-buried-listing]');
    const misses = [...beatEl.querySelectorAll('[data-buried-miss]')];
    if (!rows.length || !listing) return;

    rows.forEach((r) => r.classList.remove('is-in'));
    gate?.classList.remove('is-in');
    listing.classList.remove('is-in');
    misses.forEach((m) => m.classList.remove('is-in'));
    if (count) count.textContent = '…';

    staggerIn(stillCurrent, rows, 250, 110);
    if (count) schedule(stillCurrent, 250 + rows.length * 110, () => { count.textContent = '65+'; });
    schedule(stillCurrent, 1500, () => gate?.classList.add('is-in'));
    schedule(stillCurrent, 1950, () => listing.classList.add('is-in'));
    staggerIn(stillCurrent, misses, 2450, 170);
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 1 · BEAT 2 — ingestion from 10+ DMSs
     ═════════════════════════════════════════════════════════════ */
  function playIngest(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const sources = [...beatEl.querySelectorAll('[data-ingest-source]')];
    const tokens = [...beatEl.querySelectorAll('[data-ingest-token]')];
    const record = beatEl.querySelector('[data-ingest-record]');
    const specs = [...beatEl.querySelectorAll('[data-ingest-spec]')];
    const badge = beatEl.querySelector('[data-ingest-badge]');
    if (!record) return;

    sources.forEach((s) => s.classList.remove('is-in', 'is-live'));
    tokens.forEach((t) => t.classList.remove('is-in'));
    record.classList.remove('is-in');
    specs.forEach((s) => s.classList.remove('is-in'));
    badge?.classList.remove('is-in');

    staggerIn(stillCurrent, sources, 250, 160);
    staggerIn(stillCurrent, tokens, 850, 75);
    schedule(stillCurrent, 1750, () => record.classList.add('is-in'));
    staggerIn(stillCurrent, specs, 2150, 150);
    schedule(stillCurrent, 2850, () => {
      badge?.classList.add('is-in');
      sources.forEach((s) => s.classList.add('is-live'));
    });
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 1 · BEAT 3 — the photo problem
     ═════════════════════════════════════════════════════════════ */
  function playRawshot(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const photos = [...beatEl.querySelectorAll('[data-rawshot-photo]')];
    const chips = [...beatEl.querySelectorAll('[data-rawshot-chip]')];
    if (!photos.length) return;

    photos.forEach((p) => p.classList.remove('is-in'));
    chips.forEach((c) => c.classList.remove('is-in'));

    staggerIn(stillCurrent, photos, 250, 280);
    staggerIn(stillCurrent, chips, 1050, 380);
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 1 · BEAT 4 — the pipeline: inputs feed in, studio shot out
     ═════════════════════════════════════════════════════════════ */
  function playPipeline(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const tiles = [...beatEl.querySelectorAll('[data-pipe-tile]')];
    const core = beatEl.querySelector('[data-pipe-core]');
    const steps = [...beatEl.querySelectorAll('[data-pipe-step]')];
    const out = beatEl.querySelector('[data-pipe-out]');
    const badge = beatEl.querySelector('[data-pipe-badge]');
    if (!core || !out) return;

    tiles.forEach((t) => t.classList.remove('is-in', 'is-sent'));
    core.classList.remove('is-in', 'is-running');
    steps.forEach((s) => s.classList.remove('is-in'));
    out.classList.remove('is-in');
    badge?.classList.remove('is-in');

    staggerIn(stillCurrent, tiles, 250, 260);
    schedule(stillCurrent, 1150, () => core.classList.add('is-in'));
    schedule(stillCurrent, 1550, () => {
      core.classList.add('is-running');
      tiles.forEach((t) => t.classList.add('is-sent'));
    });
    staggerIn(stillCurrent, steps, 1700, 550);
    schedule(stillCurrent, 3400, () => out.classList.add('is-in'));
    schedule(stillCurrent, 4350, () => badge?.classList.add('is-in'));
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 1 · BEAT 5 — before/after scrub slider
     The drag wiring attaches ONCE; each activation replays the
     auto-sweep unless the user is mid-drag.
     ═════════════════════════════════════════════════════════════ */
  function wireBaDrag(frame) {
    if (frame.dataset.baWired) return;
    frame.dataset.baWired = '1';
    const setFromEvent = (e) => {
      const rect = frame.getBoundingClientRect();
      const pct = Math.min(98, Math.max(2, ((e.clientX - rect.left) / rect.width) * 100));
      frame.style.setProperty('--ba', pct + '%');
    };
    frame.addEventListener('pointerdown', (e) => {
      frame.__baDragging = true;
      frame.setPointerCapture?.(e.pointerId);
      setFromEvent(e);
    });
    frame.addEventListener('pointermove', (e) => {
      if (frame.__baDragging) setFromEvent(e);
    });
    const release = () => { frame.__baDragging = false; };
    frame.addEventListener('pointerup', release);
    frame.addEventListener('pointercancel', release);
  }

  function playBeforeAfter(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const frame = beatEl.querySelector('[data-ba-frame]');
    const thumbs = [...beatEl.querySelectorAll('[data-ba-thumb]')];
    if (!frame) return;

    wireBaDrag(frame);
    thumbs.forEach((t) => t.classList.remove('is-in'));
    frame.__baDragging = false;

    let sweepRaf = 0;
    storeCleanup(beatEl, () => cancelAnimationFrame(sweepRaf));

    if (reduceMotion) {
      frame.style.setProperty('--ba', '50%');
      thumbs.forEach((t) => t.classList.add('is-in'));
      return;
    }

    // auto-sweep: all-raw → reveal the studio shot → settle at 50/50
    frame.style.setProperty('--ba', '96%');
    const start = performance.now();
    const D1 = 1500;
    const D2 = 900;
    const HOLD = 350;
    function sweep(now) {
      if (!stillCurrent() || frame.__baDragging) return;
      const t = now - start;
      let pct;
      if (t < D1) {
        const p = 1 - Math.pow(1 - t / D1, 3);
        pct = 96 - 88 * p; // 96 → 8
      } else if (t < D1 + HOLD) {
        pct = 8;
      } else if (t < D1 + HOLD + D2) {
        const p = 1 - Math.pow(1 - (t - D1 - HOLD) / D2, 3);
        pct = 8 + 42 * p; // 8 → 50
      } else {
        frame.style.setProperty('--ba', '50%');
        return;
      }
      frame.style.setProperty('--ba', pct + '%');
      sweepRaf = requestAnimationFrame(sweep);
    }
    sweepRaf = requestAnimationFrame(sweep);

    staggerIn(stillCurrent, thumbs, 2900, 200);
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 1 · BEAT 6 — the sales spine
     ═════════════════════════════════════════════════════════════ */
  const SPINE_HEADLINE_BEFORE = 'Great condition. Call for details.';
  const SPINE_HEADLINE_AFTER = 'Surf-ready. Family-spec. On the water this weekend.';

  function playSpine(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const card = beatEl.querySelector('[data-spine-card]');
    const headline = beatEl.querySelector('[data-spine-headline]');
    const adds = [...beatEl.querySelectorAll('[data-spine-add]')];
    const tags = [...beatEl.querySelectorAll('[data-spine-tag]')];
    if (!card) return;

    card.classList.remove('is-in');
    adds.forEach((a) => a.classList.remove('is-in'));
    tags.forEach((t) => t.classList.remove('is-in'));
    if (headline) headline.textContent = SPINE_HEADLINE_BEFORE;

    schedule(stillCurrent, 250, () => card.classList.add('is-in'));
    schedule(stillCurrent, 1000, () => { if (headline) headline.textContent = SPINE_HEADLINE_AFTER; });
    staggerIn(stillCurrent, adds, 1400, 420);
    staggerIn(stillCurrent, tags, 2700, 180);
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 2 · BEAT 1 — invisible on page one
     ═════════════════════════════════════════════════════════════ */
  function playInvisible(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const results = [...beatEl.querySelectorAll('[data-serp-result]')];
    const you = beatEl.querySelector('[data-serp-you]');
    if (!results.length) return;

    results.forEach((r) => r.classList.remove('is-in'));
    you?.classList.remove('is-in');

    staggerIn(stillCurrent, results, 300, 230);
    schedule(stillCurrent, 1550, () => you?.classList.add('is-in'));
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 2 · BEAT 2 — category pages rank + AI answer types in
     ═════════════════════════════════════════════════════════════ */
  const FOUND_ANSWER_PLAIN = 'Premier Watersports — the largest in-stock pontoon selection near Nashville, with transparent pricing and same-week showings.';
  const FOUND_ANSWER_HTML = '<b>Premier Watersports</b> — the largest in-stock pontoon selection near Nashville, with transparent pricing and same-week showings.';

  function playRank(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const rich = beatEl.querySelector('[data-found-step]');
    const chips = [...beatEl.querySelectorAll('[data-found-chip]')];
    const ai = beatEl.querySelector('[data-found-ai]');
    const answer = beatEl.querySelector('[data-found-answer]');
    const cite = beatEl.querySelector('[data-found-cite]');
    if (!rich || !answer) return;

    rich.classList.remove('is-in');
    chips.forEach((c) => c.classList.remove('is-in'));
    ai?.classList.remove('is-in');
    cite?.classList.remove('is-in');
    answer.classList.remove('is-typing');
    answer.textContent = '';

    let typeTimer = 0;
    storeCleanup(beatEl, () => clearInterval(typeTimer));

    schedule(stillCurrent, 300, () => rich.classList.add('is-in'));
    staggerIn(stillCurrent, chips, 800, 180);
    schedule(stillCurrent, 1300, () => ai?.classList.add('is-in'));
    schedule(stillCurrent, 1750, () => {
      if (reduceMotion) {
        answer.innerHTML = FOUND_ANSWER_HTML;
        cite?.classList.add('is-in');
        return;
      }
      answer.classList.add('is-typing');
      let i = 0;
      typeTimer = setInterval(() => {
        if (!stillCurrent()) { clearInterval(typeTimer); return; }
        i += 2;
        answer.textContent = FOUND_ANSWER_PLAIN.slice(0, i);
        if (i >= FOUND_ANSWER_PLAIN.length) {
          clearInterval(typeTimer);
          answer.classList.remove('is-typing');
          answer.innerHTML = FOUND_ANSWER_HTML;
          cite?.classList.add('is-in');
        }
      }, 24);
    });
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 2 · BEAT 3 — the marketplace grind
     ═════════════════════════════════════════════════════════════ */
  function playStale(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const rows = [...beatEl.querySelectorAll('[data-stale-row]')];
    const statuses = [...beatEl.querySelectorAll('[data-stale-status]')];
    const cost = beatEl.querySelector('[data-stale-cost]');
    if (!rows.length) return;

    rows.forEach((r) => r.classList.remove('is-in'));
    statuses.forEach((s) => s.classList.remove('is-in'));
    cost?.classList.remove('is-in');

    rows.forEach((row, i) => {
      schedule(stillCurrent, 300 + i * 380, () => row.classList.add('is-in'));
      const status = row.querySelector('[data-stale-status]');
      if (status) schedule(stillCurrent, 620 + i * 380, () => status.classList.add('is-in'));
    });
    schedule(stillCurrent, 1850, () => cost?.classList.add('is-in'));
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 2 · BEAT 4 — syndication fan-out
     ═════════════════════════════════════════════════════════════ */
  function playSynd(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const unit = beatEl.querySelector('[data-synd-unit]');
    const packets = [...beatEl.querySelectorAll('[data-synd-packet]')];
    const channels = [...beatEl.querySelectorAll('[data-synd-channel]')];
    if (!unit || !channels.length) return;

    unit.classList.remove('is-in');
    packets.forEach((p) => p.classList.remove('is-send'));
    channels.forEach((c) => c.classList.remove('is-live'));

    schedule(stillCurrent, 250, () => unit.classList.add('is-in'));
    channels.forEach((channel, i) => {
      schedule(stillCurrent, 950 + i * 420, () => packets[i]?.classList.add('is-send'));
      schedule(stillCurrent, 1350 + i * 420, () => channel.classList.add('is-live'));
    });
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 2 · BEAT 5 — unit management dashboard
     ═════════════════════════════════════════════════════════════ */
  function playDash(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const rows = [...beatEl.querySelectorAll('[data-dash-row]')];
    const checks = [...beatEl.querySelectorAll('[data-dash-check]')];
    const bulk = beatEl.querySelector('[data-dash-bulk]');
    const prices = [...beatEl.querySelectorAll('[data-dash-price]')];
    const note = beatEl.querySelector('[data-dash-note]');
    if (!rows.length) return;

    rows.forEach((r) => r.classList.remove('is-in'));
    checks.forEach((c) => c.classList.remove('is-checked'));
    bulk?.classList.remove('is-in');
    note?.classList.remove('is-in');
    prices.forEach((p) => {
      p.classList.remove('is-drop');
      if (p.dataset.from) p.textContent = p.dataset.from;
    });

    staggerIn(stillCurrent, rows, 250, 170);
    staggerIn(stillCurrent, checks, 1200, 180, 'is-checked');
    schedule(stillCurrent, 1900, () => bulk?.classList.add('is-in'));
    prices.forEach((price, i) => {
      if (!price.dataset.to) return;
      schedule(stillCurrent, 2500 + i * 220, () => {
        price.textContent = price.dataset.to;
        price.classList.add('is-drop');
      });
    });
    schedule(stillCurrent, 3400, () => note?.classList.add('is-in'));
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 2 · BEAT 6 — territory-aware pricing engine
     ═════════════════════════════════════════════════════════════ */
  function playPrice(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const rows = [...beatEl.querySelectorAll('[data-price-row]')];
    const result = beatEl.querySelector('[data-price-result]');
    const value = beatEl.querySelector('[data-price-value]');
    const badge = beatEl.querySelector('[data-price-badge]');
    if (!result || !value) return;

    rows.forEach((r) => r.classList.remove('is-in'));
    result.classList.remove('is-in');
    badge?.classList.remove('is-in');
    value.textContent = '$0';

    const target = Number(value.dataset.to) || 0;
    staggerIn(stillCurrent, rows, 300, 240);
    schedule(stillCurrent, 1500, () => {
      result.classList.add('is-in');
      countUp(value, target, reduceMotion ? 60 : 900, stillCurrent, (v) => '$' + Math.round(v).toLocaleString('en-US'));
    });
    schedule(stillCurrent, 2700, () => badge?.classList.add('is-in'));
  }
})();
