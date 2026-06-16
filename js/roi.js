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

   Lifecycle: registered as DE.pages.roi, booted by DE.boot('roi')
   at the bottom (see js/de-core.js).
   ─────────────────────────────────────────────────────────────── */

DE.pages.roi = { boot() {
  'use strict';

  const reduceMotion = DE.reduceMotion;

  // shared engine (js/de-core.js): Lenis + cursor glow + nav state + fade
  const lenis = DE.createLenis();

  if (typeof initMobileNav === 'function') initMobileNav(); // not shipped to the platform (DeHeader owns nav)
  if (typeof initDemoModal === 'function') initDemoModal(lenis);
  DE.initCursorGlow();
  DE.initNavScroll();
  DE.initScrollHint();
  DE.initEntryCue();
  DE.initFade();
  if (typeof initVideoBoatSections === 'function') {
    initVideoBoatSections();
    DE.on(window.matchMedia('(prefers-reduced-motion: reduce)'), 'change', initVideoBoatSections);
  }

  /* ─────────────────────────────────────────────────────────────
     Calculator
     ───────────────────────────────────────────────────────────── */
  const LIFT = { traffic: 1.25, leads: 1.75, showings: 3.16, sold: 1.5 };

  // Default marine funnel ratios — used to back-calculate visitors when
  // the dealer doesn't know their traffic (every dealer knows boats sold).
  const RATE = { leadPerVisit: 0.08, showPerLead: 0.1875, soldPerShow: 1 / 3 };

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
  function setBadge(sel, txt) { const el = document.querySelector(sel); if (el) el.textContent = txt; }
  function val(el) { const v = parseFloat(el && el.value); return isFinite(v) && v > 0 ? v : 0; }
  function set(el, txt) { if (el) el.textContent = txt; }

  function paintRange(input) {
    if (!input) return;
    const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.background = `linear-gradient(90deg, var(--good) 0%, var(--good) ${pct}%, var(--line) ${pct}%, var(--line) 100%)`;
  }

  let lastAnnual = null;
  let countToken = 0;
  let firstPaint = true;

  function update() {
    const traffic = val(els.traffic);
    const leads = val(els.leads);
    const showings = val(els.showings);
    const sold = val(els.sold);
    const price = +els.price.value;
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

  // "Don't know? Estimate it for me" — back-calc visitors from the most
  // reliable number the dealer has (boats sold), else from leads.
  function estimateTraffic() {
    const sold = val(els.sold);
    const leads = val(els.leads);
    if (sold > 0) return Math.round(sold / (RATE.leadPerVisit * RATE.showPerLead * RATE.soldPerShow));
    if (leads > 0) return Math.round(leads / RATE.leadPerVisit);
    return 1000;
  }

  const estimateBtn = document.querySelector('[data-roi-estimate]');
  if (estimateBtn) {
    estimateBtn.addEventListener('click', () => {
      els.traffic.value = estimateTraffic();
      if (out.estNote) out.estNote.hidden = false;
      countToken++; // let the estimate paint instantly, not as a count-up reveal
      firstPaint = false;
      update();
    });
  }
  // dealer typing their own traffic clears the "estimated" note
  if (els.traffic) {
    els.traffic.addEventListener('input', () => { if (out.estNote) out.estNote.hidden = true; });
  }

  // element listeners die with the island DOM — no DE.on() needed (see de-core lifecycle note)
  [els.traffic, els.leads, els.showings, els.sold, els.price, els.margin].forEach((el) => {
    if (el) el.addEventListener('input', update);
  });

  update();
}};

DE.boot('roi');
