/* ═══════════════════════════════════════════════════════════════
   ROI CALCULATOR  ·  js/roi.js
   ───────────────────────────────────────────────────────────────
   A focused interactive page (not a scroll-pinned act page): the
   dealer enters their funnel (visitors → leads → showings → sold)
   plus two sliders (avg sale price, gross margin %), and the math
   shows the gross margin slow sites + slow follow-up cost them.

   The lifts are GROUNDED, not invented (see CLAUDE.md canon):
     · visitors  ×1.25  — DealerEdge marketing (99-score site, SEO, AI ads)
     · leads     ×1.75  — fast site (no 17.3s bounce) + 24/7 capture
     · showings  ×3.16  — Killer Proof Chain cohort: 19 → 60 / 1,000 buyers
     · boats sold +50%  — Pied Piper ILE: +50% units from the SAME leads
   The DOLLAR figure rests on the +50% alone (the conservative, the
   independently-verified one). The 3.16× showings is shown as the
   leading indicator only — we deliberately put money on the proven
   number, anchored to The Offer's 20% guarantee.

   ─────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initCursorGlow() {
    const cursor = document.getElementById('custom-cursor');
    const glow = document.getElementById('cursor-glow');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!finePointer || (!cursor && !glow)) return;
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let gx = mx;
    let gy = my;
    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (cursor) cursor.style.transform = `translate(${mx}px, ${my}px)`;
      glow?.classList.add('visible');
    }, { passive: true });
    document.addEventListener('mouseleave', () => glow?.classList.remove('visible'));
    function tick() {
      gx += (mx - gx) * 0.1;
      gy += (my - gy) * 0.1;
      glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    }
    if (glow) tick();
  }

  function initNavScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    const onScroll = () => navbar.classList.toggle('is-scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initFade() {
    const faders = document.querySelectorAll('[data-fade]');
    if (!faders.length) return;
    if (!('IntersectionObserver' in window)) {
      faders.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = parseFloat(entry.target.dataset.delay || 0);
        if (delay) entry.target.style.transitionDelay = `${delay}s`;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    faders.forEach((el) => obs.observe(el));
  }

  function initScrollHint() {
    if (document.querySelector('.de-scroll-hint')) return;
    const el = document.createElement('div');
    el.className = 'de-scroll-hint';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="de-scroll-hint__label">Scroll</span><span class="de-scroll-hint__chevron"></span>';
    document.body.appendChild(el);
    let idleMs = 0;
    const hide = () => el.classList.remove('is-visible');
    const blocked = () => {
      const vh = window.innerHeight;
      const atBottom = (vh + window.scrollY) >= (document.documentElement.scrollHeight - vh);
      return atBottom
        || document.getElementById('modal-backdrop')?.classList.contains('is-open');
    };
    window.addEventListener('scroll', () => { idleMs = 0; hide(); }, { passive: true });
    setInterval(() => {
      if (blocked()) { hide(); return; }
      idleMs += 500;
      if (idleMs >= 1000) el.classList.add('is-visible');
    }, 500);
  }

  function initLazyDemoModal() {
    const triggers = [...document.querySelectorAll('.js-modal')];
    if (!triggers.length) return;

    const src = 'js/demo-modal.min.js?v=20260630a';
    let loading = null;
    let initialized = false;

    const load = () => {
      if (!loading) {
        loading = new Promise((resolve) => {
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
        });
      }

      return loading.then(() => {
        if (!initialized && typeof initDemoModal === 'function') {
          initialized = true;
          initDemoModal(null);
        }
      });
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        if (initialized) return;
        event.preventDefault();
        load().then(() => trigger.click());
      }, { once: true });
    });

    ['pointerenter', 'focus'].forEach((eventName) => {
      triggers.forEach((trigger) => trigger.addEventListener(eventName, load, { once: true, passive: true }));
    });
  }

  function initLazyVideoBoatSections() {
    const target = document.getElementById('video-section') || document.getElementById('boat-section');
    if (!target) return;

    let requested = false;
    let observer = null;
    let cssPromise = null;
    const loadCss = () => {
      const href = 'css/video-boat.min.css?v=20260630a';
      const existing = document.querySelector(`link[href="${href}"]`);
      if (existing) return cssPromise || Promise.resolve();
      cssPromise = new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = resolve;
        document.head.appendChild(link);
      });
      return cssPromise;
    };
    const load = () => {
      if (requested) return;
      requested = true;
      observer?.disconnect();
      const readyForLayout = loadCss();
      if (typeof initVideoBoatSections === 'function') {
        readyForLayout.then(initVideoBoatSections);
        return;
      }
      const script = document.createElement('script');
      script.src = 'js/section-video-boat.min.js?v=20260630a';
      script.defer = true;
      script.onload = () => {
        if (typeof initVideoBoatSections === 'function') readyForLayout.then(initVideoBoatSections);
      };
      document.head.appendChild(script);
    };
    const checkNear = () => {
      const rect = target.getBoundingClientRect();
      const margin = 500;
      if (rect.top < window.innerHeight + margin && rect.bottom > -margin) load();
    };

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) load();
      }, { rootMargin: '500px 0px' });
      observer.observe(target);
    }
    window.addEventListener('scroll', checkNear, { passive: true });
    window.addEventListener('resize', checkNear, { passive: true });
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
      if (requested && typeof initVideoBoatSections === 'function') initVideoBoatSections();
    });
    checkNear();
  }

  function boot() {
  if (typeof initMobileNav === 'function') initMobileNav(); // not shipped to the platform (DeHeader owns nav)
  initLazyDemoModal();
  initCursorGlow();
  initNavScroll();
  initScrollHint();
  initFade();
  initLazyVideoBoatSections();

  /* ─────────────────────────────────────────────────────────────
     Calculator
     ───────────────────────────────────────────────────────────── */
  const LIFT = { traffic: 1.25, leads: 1.75, showings: 3.16, sold: 1.5 };

  // Marine/RV funnel benchmarks — the "average" each stage is compared to,
  // and what we back-calculate visitors from when the dealer doesn't know
  // their traffic. lead→showing 19% is canon (Killer Proof Chain); the
  // other two are labeled placeholders pending Jason's real industry numbers.
  const BENCH = { lead: 0.03, show: 0.19, close: 0.30 };
  const CONV = [
    { key: 'lead', up: 'traffic', down: 'leads', verb: 'become leads' },
    { key: 'show', up: 'leads', down: 'showings', verb: 'book a showing' },
    { key: 'close', up: 'showings', down: 'sold', verb: 'buy' },
  ];

  const els = {
    traffic: document.getElementById('roi-traffic'),
    leads: document.getElementById('roi-leads'),
    showings: document.getElementById('roi-showings'),
    sold: document.getElementById('roi-sold'),
    price: document.getElementById('roi-price'),
    margin: document.getElementById('roi-margin'),
  };
  if (!els.sold || !els.price || !els.margin) return; // markup missing — graceful no-op

  const out = {
    priceVal: document.getElementById('roi-price-val'),
    marginVal: document.getElementById('roi-margin-val'),
    marginDollars: document.getElementById('roi-margin-dollars'),
    nowTraffic: document.querySelector('[data-roi-now-traffic]'),
    withTraffic: document.querySelector('[data-roi-with-traffic]'),
    nowLeads: document.querySelector('[data-roi-now-leads]'),
    withLeads: document.querySelector('[data-roi-with-leads]'),
    nowShowings: document.querySelector('[data-roi-now-showings]'),
    withShowings: document.querySelector('[data-roi-with-showings]'),
    nowSold: document.querySelector('[data-roi-now-sold]'),
    withSold: document.querySelector('[data-roi-with-sold]'),
    annual: document.querySelector('[data-roi-annual]'),
    monthly: document.querySelector('[data-roi-monthly]'),
    extraSold: document.querySelector('[data-roi-extra-sold]'),
    headline: document.querySelector('.roi-headline-num'),
    estNote: document.querySelector('[data-roi-est-note]'),
  };
  // fixed per-stage badges (the lifts don't change with input)
  setBadge('[data-roi-badge-traffic]', '×' + round1(LIFT.traffic));
  setBadge('[data-roi-badge-leads]', '×' + round1(LIFT.leads));
  setBadge('[data-roi-badge-showings]', '×' + round1(LIFT.showings));
  setBadge('[data-roi-badge-sold]', '+50%');

  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const fmt1 = (n) => (Math.round(n * 10) / 10).toLocaleString('en-US');
  function round1(n) { return Math.round(n * 10) / 10; }

  // Non-linear avg-price slider: the common $75k–$300k band gets most of the
  // travel; $300k → $2M (yachts — a small segment) is compressed into the
  // right ~30%. The slider value is a 0–1000 position mapped to dollars.
  const PRICE_STOPS = [[0, 15000], [0.15, 75000], [0.70, 300000], [0.88, 1000000], [1, 5000000]];
  function priceFromPos(pos) {
    pos = Math.max(0, Math.min(1, pos));
    for (let i = 1; i < PRICE_STOPS.length; i += 1) {
      const [p1, v1] = PRICE_STOPS[i - 1];
      const [p2, v2] = PRICE_STOPS[i];
      if (pos <= p2) return v1 + (v2 - v1) * ((pos - p1) / (p2 - p1));
    }
    return PRICE_STOPS[PRICE_STOPS.length - 1][1];
  }
  function roundPrice(p) {
    if (p < 100000) return Math.round(p / 1000) * 1000;
    if (p < 500000) return Math.round(p / 5000) * 5000;
    if (p < 2000000) return Math.round(p / 25000) * 25000;
    return Math.round(p / 100000) * 100000;
  }

  function setBadge(sel, txt) { const el = document.querySelector(sel); if (el) el.textContent = txt; }
  function val(el) { const v = parseFloat(el && el.value); return isFinite(v) && v > 0 ? v : 0; }
  function set(el, txt) { if (el) el.textContent = txt; }

  function paintRange(input) {
    if (!input) return;
    const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.background = `linear-gradient(90deg, var(--good) 0%, var(--good) ${pct}%, var(--line) ${pct}%, var(--line) 100%)`;
  }

  function fmtPct(r) { const p = r * 100; return (p < 10 ? Math.round(p * 10) / 10 : Math.round(p)) + '%'; }

  // For each gap, compute the dealer's actual conversion rate and compare it
  // to the marine/RV average: above (green) / on par / below (red = the leak).
  function renderConversions(v) {
    CONV.forEach((c) => {
      const rateEl = document.querySelector(`[data-roi-rate="${c.key}"]`);
      const noteEl = document.querySelector(`[data-roi-note="${c.key}"]`);
      const verdEl = document.querySelector(`[data-roi-verdict="${c.key}"]`);
      if (!rateEl) return;
      const box = rateEl.closest('.roi-conv');
      const up = v[c.up];
      const down = v[c.down];
      const benchPct = Math.round(BENCH[c.key] * 100);
      if (verdEl) verdEl.textContent = `vs ~${benchPct}% avg`;  // desktop rail (color carries the verdict)
      if (up <= 0) {
        rateEl.textContent = '—';
        if (noteEl) noteEl.textContent = c.verb;
        if (box) box.className = 'roi-conv is-par';
        return;
      }
      const rate = down / up;
      const ratio = rate / BENCH[c.key];
      let verdict, cls;
      if (ratio >= 1.12) { verdict = `above the ~${benchPct}% marine avg`; cls = 'is-above'; }
      else if (ratio <= 0.88) { verdict = `below the ~${benchPct}% marine avg`; cls = 'is-below'; }
      else { verdict = `on par with the ~${benchPct}% marine avg`; cls = 'is-par'; }
      rateEl.textContent = fmtPct(rate);
      if (noteEl) noteEl.textContent = `${c.verb} · ${verdict}`;
      if (box) box.className = 'roi-conv ' + cls;
    });
  }

  let lastAnnual = null;
  let countToken = 0;
  let firstPaint = true;

  function update() {
    const traffic = val(els.traffic);
    const leads = val(els.leads);
    const showings = val(els.showings);
    const sold = val(els.sold);
    const price = roundPrice(priceFromPos((+els.price.value) / 1000));
    const marginPct = +els.margin.value;
    const marginDollars = price * (marginPct / 100);

    const soldWith = sold * LIFT.sold;
    const extraSold = soldWith - sold;
    const monthly = extraSold * marginDollars;
    const annual = monthly * 12;

    // funnel rows
    set(out.nowTraffic, fmt(traffic));
    set(out.withTraffic, fmt(traffic * LIFT.traffic));
    set(out.nowLeads, fmt(leads));
    set(out.withLeads, fmt(leads * LIFT.leads));
    set(out.nowShowings, fmt(showings));
    set(out.withShowings, fmt(showings * LIFT.showings));
    set(out.nowSold, fmt1(sold));
    set(out.withSold, fmt1(soldWith));

    // per-stage conversion vs the marine/RV average
    renderConversions({ traffic, leads, showings, sold });

    // sliders
    set(out.priceVal, fmt(price));
    set(out.marginVal, marginPct);
    set(out.marginDollars, fmt(marginDollars));
    paintRange(els.price);
    paintRange(els.margin);

    // headline
    set(out.monthly, '$' + fmt(monthly));
    set(out.extraSold, '+' + fmt1(extraSold));

    if (firstPaint && !reduceMotion) {
      firstPaint = false;
      countUp(out.annual, 0, annual, 900);
    } else {
      set(out.annual, fmt(annual));
      if (annual !== lastAnnual && lastAnnual !== null) bump();
    }
    lastAnnual = annual;
  }

  function bump() {
    if (reduceMotion || !out.headline) return;
    out.headline.classList.remove('is-bumped');
    void out.headline.offsetWidth; // reflow so the animation restarts
    out.headline.classList.add('is-bumped');
  }

  function countUp(el, from, to, dur) {
    if (!el) return;
    const token = ++countToken;
    const start = performance.now();
    function frame(now) {
      if (token !== countToken) return; // a newer update superseded this run
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ── funnel state (Jason, 2026-06-16): each stage is either an 'est'
  // (industry-average / derived) value or a 'manual' value the dealer typed.
  // Editing a stage cascades DOWNSTREAM only and never overwrites a manual
  // field; estimates re-derive from the nearest stage above them.
  const DEFAULT_TRAFFIC = 3000;
  const STAGE = [
    { key: 'traffic', el: els.traffic },
    { key: 'leads', el: els.leads, rate: 'lead' },
    { key: 'showings', el: els.showings, rate: 'show' },
    { key: 'sold', el: els.sold, rate: 'close' },
  ];
  const EST_LABEL = { traffic: 'estimate', leads: 'industry avg', showings: 'industry avg', sold: 'industry avg' };
  const state = { traffic: 'est', leads: 'est', showings: 'est', sold: 'est' };

  function cascade() {
    let prev = val(els.traffic);
    for (let i = 1; i < STAGE.length; i++) {
      const s = STAGE[i];
      if (state[s.key] === 'manual') { prev = val(s.el); continue; }
      const v = Math.max(0, Math.round(prev * BENCH[s.rate]));
      s.el.value = v;          // programmatic — does not fire 'input', so no loop
      prev = v;
    }
  }

  function renderStatus() {
    STAGE.forEach((s) => {
      const wrap = document.querySelector(`[data-roi-status="${s.key}"]`);
      if (!wrap) return;
      const txt = wrap.querySelector('.roi-status-text');
      const manual = state[s.key] === 'manual';
      wrap.className = 'roi-status ' + (manual ? 'is-you' : 'is-est');
      if (txt) txt.textContent = manual ? 'your number' : EST_LABEL[s.key];
    });
  }

  function recalc() { cascade(); update(); renderStatus(); }

  // "Don't know? Estimate it for me" — back-calc visitors from the most
  // reliable number the dealer has (boats sold), else from leads.
  function estimateTraffic() {
    const sold = val(els.sold);
    const leads = val(els.leads);
    if (sold > 0) return Math.round(sold / (BENCH.lead * BENCH.show * BENCH.close));
    if (leads > 0) return Math.round(leads / BENCH.lead);
    return DEFAULT_TRAFFIC;
  }

  const estimateBtn = document.querySelector('[data-roi-estimate]');
  if (estimateBtn) {
    estimateBtn.addEventListener('click', () => {
      els.traffic.value = estimateTraffic();
      state.traffic = 'est';
      if (out.estNote) out.estNote.hidden = false;
      countToken++;           // paint instantly, not as a count-up reveal
      firstPaint = false;
      recalc();
    });
  }

  // typing a funnel field locks it as 'manual', then cascades the stages below
  STAGE.forEach((s) => {
    if (!s.el) return;
    s.el.addEventListener('input', () => {
      state[s.key] = 'manual';
      if (s.key === 'traffic' && out.estNote) out.estNote.hidden = true;
      recalc();
    });
  });

  // "use avg" reset — revert a field to its industry-average estimate
  document.querySelectorAll('[data-roi-reset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.roiReset;
      state[k] = 'est';
      if (k === 'traffic') { els.traffic.value = DEFAULT_TRAFFIC; if (out.estNote) out.estNote.hidden = true; }
      recalc();
    });
  });

  // sliders only affect the dollar math, not the funnel counts
  [els.price, els.margin].forEach((el) => { if (el) el.addEventListener('input', update); });

  recalc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}());
