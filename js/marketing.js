/* ═══════════════════════════════════════════════════════════════
   MARKETING PAGE - scroll choreography
   ═══════════════════════════════════════════════════════════════
   Lifecycle: registered as DE.pages.marketing, booted by the
   DE.boot('marketing') call at the bottom (see js/de-core.js).
   ═══════════════════════════════════════════════════════════════ */

DE.pages.marketing = { boot() {
  'use strict';

  const reduceMotion = DE.reduceMotion;

  // shared engine (js/de-core.js): Lenis + cursor glow + nav state + fade
  const lenis = DE.createLenis();

  if (typeof initMobileNav === 'function') initMobileNav(); // not shipped to the platform (DeHeader owns nav)
  initDemoModal(lenis);
  DE.initCursorGlow();
  DE.initNavScroll();
  DE.initScrollHint();
  DE.initFade();
  initShowcase();
  initHero();
  // act engine: DE.initActs — invoked below, after BEAT_ANIMS is declared
  if (typeof initVideoBoatSections === 'function') {
    initVideoBoatSections();
    DE.on(window.matchMedia('(prefers-reduced-motion: reduce)'), 'change', initVideoBoatSections);
  }

  /* ─────────────────────────────────────────────────────────────
     PROOF SHOWCASE — Premier Watersports.
     Not scroll-pinned. Plays once when it scrolls into view: the
     device trio "loads" (blur clears, slow 13.8s flips to fast 2.3s),
     the PageSpeed score counts to 99, and the stat counters tick up.
     ───────────────────────────────────────────────────────────── */
  function initShowcase() {
    const sec = document.querySelector('[data-showcase]');
    if (!sec) return;
    const stage = sec.querySelector('[data-showcase-stage]');
    const score = sec.querySelector('[data-showcase-score]');
    const load = sec.querySelector('[data-showcase-load]');
    const loadLabel = sec.querySelector('[data-showcase-load-label]');
    const counters = [...sec.querySelectorAll('[data-count]')];
    let played = false;

    function countTo(el, to, ms, decimals = 0, suffix = '') {
      const from = parseFloat(el.textContent) || 0;
      const start = performance.now();
      function frame(now) {
        const p = Math.min(1, (now - start) / ms);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = from + (to - from) * eased;
        el.textContent = val.toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    function run() {
      if (played) return;
      played = true;

      if (reduceMotion) {
        stage?.classList.add('is-loaded');
        if (score) score.textContent = '99';
        if (load) load.textContent = '2.3s';
        if (loadLabel) loadLabel.textContent = 'loaded';
        counters.forEach((c) => { c.textContent = c.dataset.count; });
        return;
      }

      setTimeout(() => {
        stage?.classList.add('is-loaded');
        if (load) countTo(load, 2.3, 900, 1, 's');
        if (loadLabel) setTimeout(() => { loadLabel.textContent = 'loaded'; }, 950);
        if (score) countTo(score, 99, 1100);
        counters.forEach((c) => countTo(c, Number(c.dataset.count) || 0, 1100));
      }, 600);
    }

    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) run(); }),
      { threshold: 0.3 }
    );
    obs.observe(sec);
  }

  function initHero() {
    const hero = document.querySelector('[data-marketing-hero]');
    if (!hero) return;

    const slides = [...hero.querySelectorAll('[data-hero-stage]')];
    const metrics = [...hero.querySelectorAll('[data-proof-stage]')];
    const flow = initHeroFlow(hero);
    let active = -1;

    function setStage(index) {
      const next = clamp(index, 0, slides.length - 1);
      if (next === active) return;
      active = next;
      hero.dataset.activeStage = String(next + 1);
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === next));
      metrics.forEach((metric, i) => metric.classList.toggle('is-active', i === next));
      flow.setStage(next + 1);
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

  /* ─────────────────────────────────────────────────────────────
     HERO FLOW — the prospect particles.
     Same paid traffic enters in both beats. In the problem beat most
     bounce off the slow site; the rest slip past untagged and defect
     at the hand-off; a lucky few reach the finish green, then vanish
     uncounted. In the solution beat they flow straight through and
     stick. setStage() owns a generation token so scrolling between
     beats cancels every in-flight dot.
     ───────────────────────────────────────────────────────────── */
  function initHeroFlow(hero) {
    const spine = hero.querySelector('[data-flow-spine]');
    const layer = hero.querySelector('[data-flow-prospects]');
    const srcs = spine ? [...spine.querySelectorAll('[data-flow-src]')] : [];
    const elSite = hero.querySelector('[data-flow-node="site"]');
    const elData = hero.querySelector('[data-flow-node="data"]');
    const elSales = hero.querySelector('[data-flow-node="sales"]');
    const elOut = hero.querySelector('[data-flow-out]');
    if (!spine || !layer || !srcs.length || !elSite || !elData || !elSales || !elOut) {
      return { setStage() {} };
    }

    const paneEl = hero.querySelector('[data-proof-machine]');
    const spotlight = hero.querySelector('[data-flow-spotlight]');
    const spotBadge = hero.querySelector('[data-flow-spot-badge]');
    const spotName = hero.querySelector('[data-flow-spot-name]');
    const spotText = hero.querySelector('[data-flow-spot-text]');
    const reviewLayer = hero.querySelector('[data-flow-reviews]');

    // the guided tour: each item, its name, why it leaks (bad), the fix (good)
    const TOUR = [
      { el: srcs[0], name: 'SEO / GEO', bad: 'Not on page 1', good: 'Top of search' },
      { el: srcs[1], name: 'Ads', bad: 'Wasted spend', good: 'Inventory-aware' },
      { el: srcs[2], name: 'Social', bad: 'Off-inventory', good: 'On-brand, in-stock' },
      { el: elSite, name: 'Website', bad: 'Too slow · outdated', good: 'Loads instantly' },
      { el: elData, name: 'Analytics', bad: 'Traffic not tagged', good: 'Every boat attributed' },
      { el: elSales, name: 'Sales', bad: 'Slow to reply', good: 'Replies in 90s' },
    ].filter((t) => t.el);

    let gen = 0;
    let stage = 0;
    let srcIdx = 0;
    let prospectTimer = 0;
    let reviewTimer = 0;
    let spotEl = null;
    const narrow = () => window.matchMedia('(max-width: 1100px)').matches;

    function center(el) {
      const s = spine.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top };
    }

    function glide(dot, x, y, ms, opacity) {
      dot.style.transition = `transform ${ms}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${ms}ms ease`;
      dot.style.transform = `translate(${x}px, ${y}px)`;
      if (opacity != null) dot.style.opacity = String(opacity);
    }

    function path(dot, myGen, steps, done) {
      let i = 0;
      const step = () => {
        if (gen !== myGen || !dot.isConnected) return;
        if (i >= steps.length) { if (done) done(); return; }
        const s = steps[i++];
        glide(dot, s.x, s.y, s.ms, s.o);
        setTimeout(step, s.ms);
      };
      step();
    }

    const rand = (a, b) => a + Math.random() * (b - a);

    function peelAway(dot, myGen, x, y, ms) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      glide(dot, x + dir * rand(40, 72), y + rand(28, 52), ms, 0);
      setTimeout(() => { if (dot.isConnected) dot.remove(); }, ms + 90);
    }

    function spawnOne() {
      const myGen = gen;
      const src = srcs[srcIdx % srcs.length];
      srcIdx += 1;
      const dot = document.createElement('span');
      dot.className = 'm-flow-prospect';
      layer.appendChild(dot);

      const start = center(src);
      dot.style.transition = 'none';
      dot.style.transform = `translate(${start.x}px, ${start.y}px)`;
      dot.style.opacity = '1';
      void dot.offsetWidth;

      const site = center(elSite);
      const data = center(elData);
      const sales = center(elSales);
      const boats = center(elOut);

      if (stage >= 2) {
        // connected: flow straight through and stick at booked boats
        dot.classList.add('is-green');
        path(dot, myGen, [
          { x: site.x, y: site.y, ms: 360, o: 1 },
          { x: data.x, y: data.y, ms: 300, o: 1 },
          { x: sales.x, y: sales.y, ms: 300, o: 1 },
          { x: boats.x, y: boats.y, ms: 300, o: 1 },
        ], () => {
          glide(dot, boats.x, boats.y, 220, 0);
          setTimeout(() => { if (dot.isConnected) dot.remove(); }, 280);
        });
        return;
      }

      const roll = Math.random();
      if (roll < 0.64) {
        // most bounce off the slow website
        path(dot, myGen, [{ x: site.x, y: site.y, ms: 520, o: 1 }], () => {
          peelAway(dot, myGen, site.x, site.y, 520);
        });
      } else if (roll < 0.9) {
        // slip past, but analytics never tags them → defect at the hand-off
        path(dot, myGen, [
          { x: site.x, y: site.y, ms: 540, o: 1 },
          { x: data.x, y: data.y, ms: 460, o: 1 },
        ], () => {
          dot.classList.add('is-untracked');
          path(dot, myGen, [{ x: sales.x, y: sales.y, ms: 460, o: 0.55 }], () => {
            peelAway(dot, myGen, sales.x, sales.y, 520);
          });
        });
      } else {
        // a lucky few reach the finish green — then vanish, uncounted
        dot.classList.add('is-green');
        path(dot, myGen, [
          { x: site.x, y: site.y, ms: 560, o: 1 },
          { x: data.x, y: data.y, ms: 440, o: 1 },
          { x: sales.x, y: sales.y, ms: 440, o: 1 },
          { x: boats.x, y: boats.y - 12, ms: 440, o: 1 },
        ], () => {
          glide(dot, boats.x, boats.y - 12, 380, 0);
          setTimeout(() => { if (dot.isConnected) dot.remove(); }, 440);
        });
      }
    }

    // ---- reviews flywheel: green "Review!" dots from booked boats up
    //      the right gutter to traffic in (solution beat only) ----
    function spawnReview() {
      if (!reviewLayer) return;
      const myGen = gen;
      const boats = center(elOut);
      const top = center(srcs[Math.floor(rand(0, srcs.length))]);
      const gutterX = spine.getBoundingClientRect().width + 26;
      const r = document.createElement('span');
      r.className = 'm-flow-review';
      r.innerHTML = '<i></i><b>Review!</b>';
      reviewLayer.appendChild(r);
      r.style.transition = 'none';
      r.style.transform = `translate(${gutterX}px, ${boats.y}px)`;
      r.style.opacity = '0';
      void r.offsetWidth;
      glide(r, gutterX, boats.y - 6, 200, 1);
      setTimeout(() => {
        if (gen !== myGen || !r.isConnected) return;
        glide(r, gutterX, top.y, 1150, 1);            // travel up the gutter to traffic in
        setTimeout(() => {
          if (gen !== myGen || !r.isConnected) return;
          glide(r, gutterX, top.y, 280, 0);            // merge into the top of funnel
          setTimeout(() => { if (r.isConnected) r.remove(); }, 320);
        }, 1150);
      }, 220);
    }

    // ---- spotlight: one card at a time, naming each item + reason,
    //      highlighting it, looping down the system (desktop only) ----
    function clearSpotlight() {
      if (spotEl) { spotEl.classList.remove('is-spotlight'); spotEl = null; }
      if (spotlight) spotlight.classList.remove('is-on');
    }

    // place the card to the LEFT of the active item, clamped so it can
    // never spill past the pane edges (overlaps the spine if the gutter
    // is too tight — that's fine, it reads as an overlay)
    function placeSpotlight(el) {
      const sp = spine.getBoundingClientRect();
      const pane = (paneEl || spine).getBoundingClientRect();
      const er = el.getBoundingClientRect();
      const cw = spotlight.offsetWidth || 122;
      const ch = spotlight.offsetHeight || 44;
      // pin to the left gutter (just left of the spine) so it never sits on
      // top of a neighbouring chip — the highlight ring shows which item it is
      let left = -12 - cw;
      const minLeft = (pane.left - sp.left) + 8;        // never spill past the pane
      if (left < minLeft) left = minLeft;
      let top = (er.top + er.height / 2 - sp.top) - ch / 2;
      const minTop = (pane.top - sp.top) + 8;
      const maxTop = (pane.bottom - sp.top) - ch - 8;
      if (top < minTop) top = minTop;
      if (top > maxTop) top = maxTop;
      return { left, top };
    }

    function runSpotlight(myGen, i) {
      if (gen !== myGen || !spotlight || narrow() || !TOUR.length) return;
      const item = TOUR[i % TOUR.length];
      const good = stage >= 2;
      if (spotEl) spotEl.classList.remove('is-spotlight');
      spotEl = item.el;
      spotEl.classList.add('is-spotlight');
      // set content first so we can measure, then jump into place while hidden
      spotlight.classList.toggle('is-good', good);
      if (spotBadge) spotBadge.textContent = good ? '✓' : '✕';
      if (spotName) spotName.textContent = item.name;
      if (spotText) spotText.textContent = good ? item.good : item.bad;
      const pos = placeSpotlight(item.el);
      spotlight.style.transition = 'none';
      spotlight.style.left = `${pos.left}px`;
      spotlight.style.top = `${pos.top}px`;
      void spotlight.offsetWidth;
      spotlight.style.transition = '';
      spotlight.classList.add('is-on');
      setTimeout(() => {
        if (gen !== myGen) return;
        spotlight.classList.remove('is-on');
        setTimeout(() => runSpotlight(myGen, i + 1), 260);
      }, 1500);
    }

    function setStage(next) {
      if (next === stage) return;
      stage = next;
      gen += 1;
      const myGen = gen;
      if (prospectTimer) { clearInterval(prospectTimer); prospectTimer = 0; }
      if (reviewTimer) { clearInterval(reviewTimer); reviewTimer = 0; }
      layer.innerHTML = '';
      if (reviewLayer) reviewLayer.innerHTML = '';
      clearSpotlight();
      if (reduceMotion) return; // static CSS states already tell the story

      // prospects — dense when connected, slow trickle when broken
      spawnOne();
      prospectTimer = setInterval(spawnOne, stage >= 2 ? 300 : 720);

      // the explanatory spotlight tour (desktop only)
      if (!narrow()) setTimeout(() => runSpotlight(myGen, 0), 420);

      // reviews flywheel only spins once the system produces happy buyers
      // (kept sparse so it reads as a flywheel, not a swarm)
      if (stage >= 2) {
        setTimeout(() => { if (gen === myGen) spawnReview(); }, 800);
        reviewTimer = setInterval(spawnReview, 3400);
      }
    }

    return { setStage };
  }

  const OLD_SEARCH_QUERIES = [
    'Malibu Wakesetter near me',
    'best wake boat financing',
    'used surf boat Nashville',
  ];

  const oldAnimCleanups = new WeakMap();
  const SPEED_BUYER_COUNT = 14;
  const SPEED_FAST_LAND = 9;

  const BEAT_ANIMS = {
    'old-queue': playOldQueue,
    'old-speed': playOldSpeed,
    'old-form': playOldForm,
    'old-sleep': playOldSleep,
    'old-search': playOldSearch,
    'old-unify': playOldUnify,
    'site-demo': playGenSite,
    'site-thin': playThinListing,
    'site-inventory': playSpine,
    'site-seo': playSequential,
    'site-capture': playCapture,
    'dam-proof': playDamMorph,
    'dam-channels': playDamChannels,
    'dam-calendar': playSequential,
    'dam-article': playRankClimb,
    'hub-goals': playStrategy,
    'hub-reviews': playRevFix,
    'hub-handoff': playHandoff,
    'op-team': playOpTeam,
    'op-fanout': playFanout,
    'op-invads': playInvAds,
    'geo-miss': playGeoMiss,
    'geo-answer': playGeoAnswer,
  };

  // act engine lives in js/de-core.js now (shared with inventory.js);
  // the controller body that used to sit here is DE.initActs verbatim.
  DE.initActs(lenis, { anims: BEAT_ANIMS, cleanups: oldAnimCleanups });


  function storeCleanup(beatEl, cleanup) {
    const prev = oldAnimCleanups.get(beatEl);
    if (prev) prev();
    oldAnimCleanups.set(beatEl, cleanup);
  }

  function schedule(stillCurrent, delay, fn) {
    const ids = [];
    const id = setTimeout(() => tick(stillCurrent, fn), delay);
    ids.push(id);
    return id;
  }

  function animateRealTimer(el, targetSeconds, stillCurrent, onDone, speed = 1) {
    const start = performance.now();
    let rafId = 0;
    const cancel = () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
    function frame(now) {
      if (!stillCurrent()) {
        cancel();
        return;
      }
      const elapsed = ((now - start) / 1000) * speed;
      const value = Math.min(targetSeconds, elapsed);
      el.textContent = `${value.toFixed(1)}s`;
      if (value >= targetSeconds) {
        onDone?.(value);
        return;
      }
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
    return cancel;
  }

  function moveBuyerDot(dot, zoneEl, stillCurrent, className) {
    if (!stillCurrent() || !dot || !zoneEl) return;
    const zoneRect = zoneEl.getBoundingClientRect();
    const dotRect = dot.getBoundingClientRect();
    const landingIndex = Number(zoneEl.dataset.landCount || '0');
    zoneEl.dataset.landCount = String(landingIndex + 1);
    const col = landingIndex % 2;
    const row = Math.floor(landingIndex / 2);
    const tx = zoneRect.left + 8 + col * 12 - dotRect.left;
    const ty = zoneRect.top + 8 + row * 12 - dotRect.top;
    dot.style.transform = `translate(${tx}px, ${ty}px)`;
    dot.classList.add(className);
  }

  // Decimal counter (e.g. star ratings) with cubic ease-out; bails on beat change.
  function countFloat(el, from, to, ms, stillCurrent, decimals = 1) {
    if (!el) return;
    if (reduceMotion) { el.textContent = to.toFixed(decimals); return; }
    const start = performance.now();
    function frame(now) {
      if (typeof stillCurrent === 'function' && !stillCurrent()) return;
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (from + (to - from) * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // Generic integer counter with cubic ease-out; bails if the beat moved on.
  function countInt(el, from, to, ms, stillCurrent, prefix = '', suffix = '') {
    if (!el) return;
    if (reduceMotion) { el.textContent = `${prefix}${to.toLocaleString('en-US')}${suffix}`; return; }
    const start = performance.now();
    function frame(now) {
      if (typeof stillCurrent === 'function' && !stillCurrent()) return;
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(from + (to - from) * eased);
      el.textContent = `${prefix}${val.toLocaleString('en-US')}${suffix}`;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function playOldQueue(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const listing = beatEl.querySelector('[data-old-listing]');
    const updated = beatEl.querySelector('[data-old-updated]');
    const ready = beatEl.querySelector('[data-old-ready]');
    const gate = beatEl.querySelector('[data-old-gate]');
    const staleBuyer = beatEl.querySelector('[data-old-stale-buyer]');
    const tickets = [...beatEl.querySelectorAll('[data-old-ticket]')];
    // each ticket's ETA recedes: waiting → next sprint, etc.
    const etaPush = ['next sprint', 'next month', 'Q3 roadmap'];
    const timeouts = [];

    listing?.classList.remove('is-stale');
    updated?.classList.remove('is-red');
    if (updated) updated.textContent = 'Updated 71 days ago';
    if (ready) { ready.classList.remove('is-stuck'); ready.textContent = 'Ready to publish'; }
    gate?.classList.remove('is-down');
    staleBuyer?.classList.remove('is-in', 'is-out');
    tickets.forEach((t) => {
      t.classList.remove('is-in', 'is-stamped');
      const em = t.querySelector('[data-old-ticket-status]');
      if (em) em.classList.remove('is-pushed');
    });

    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));

    // the boat is ready — then the queue stamps it
    add(reduceMotion ? 40 : 300, () => updated?.classList.add('is-red'));
    add(reduceMotion ? 70 : 520, () => {
      listing?.classList.add('is-stale');
      if (ready) { ready.classList.add('is-stuck'); ready.textContent = 'Stuck in queue'; }
    });
    add(reduceMotion ? 90 : 640, () => gate?.classList.add('is-down'));
    add(reduceMotion ? 120 : 820, () => staleBuyer?.classList.add('is-in'));
    add(reduceMotion ? 220 : 1500, () => {
      staleBuyer?.classList.remove('is-in');
      staleBuyer?.classList.add('is-out');
    });

    // days pile up while nothing happens
    add(reduceMotion ? 60 : 900, () =>
      countInt(updated, 71, 88, reduceMotion ? 0 : 2600, stillCurrent, 'Updated ', ' days ago')
    );

    tickets.forEach((ticket, i) => {
      add((reduceMotion ? 150 : 900) + i * (reduceMotion ? 60 : 300), () => {
        ticket.classList.add('is-in', 'is-stamped');
      });
      // ETA recedes further out
      add((reduceMotion ? 260 : 2100) + i * (reduceMotion ? 60 : 280), () => {
        const em = ticket.querySelector('[data-old-ticket-status]');
        if (em) { em.textContent = etaPush[i] || em.textContent; em.classList.add('is-pushed'); }
      });
    });

    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  function playOldSpeed(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const scene = beatEl.querySelector('.m-old-speed-scene');
    const buyersHost = beatEl.querySelector('[data-old-speed-buyers]');
    const slowLoad = beatEl.querySelector('[data-old-load="slow"]');
    const fastLoad = beatEl.querySelector('[data-old-load="fast"]');
    const slowStatus = beatEl.querySelector('[data-old-speed-status="slow"]');
    const fastStatus = beatEl.querySelector('[data-old-speed-status="fast"]');
    const slowSite = beatEl.querySelector('.m-old-speed-site--slow');
    const fastSite = beatEl.querySelector('.m-old-speed-site--fast');
    const slowZone = beatEl.querySelector('[data-old-speed-zone="slow"]');
    const fastZone = beatEl.querySelector('[data-old-speed-zone="fast"]');
    const cancels = [];
    const timeouts = [];

    slowLoad.textContent = '0.0s';
    fastLoad.textContent = '0.0s';
    slowStatus.textContent = 'loading...';
    fastStatus.textContent = 'waiting for page';
    scene?.classList.remove('is-fast-loaded', 'is-buyers-leaving');
    slowSite?.classList.remove('is-flash', 'is-abandoned');
    fastSite?.classList.remove('is-flash', 'is-loaded');
    slowZone.innerHTML = '';
    fastZone.innerHTML = '';
    slowZone.dataset.landCount = '0';
    fastZone.dataset.landCount = '0';
    buyersHost.innerHTML = '';

    const buyers = [];
    for (let i = 0; i < SPEED_BUYER_COUNT; i += 1) {
      const dot = document.createElement('span');
      dot.className = 'm-old-buyer-dot';
      dot.dataset.oldBuyerDot = '';
      dot.dataset.idx = String(i);
      dot.style.transform = '';
      buyersHost.appendChild(dot);
      buyers.push(dot);
    }

    const pendingSlow = () => buyers.filter((d) => !d.classList.contains('is-green') && !d.classList.contains('is-lost'));
    const rightSideBuyers = (count) => buyers.slice(Math.max(0, buyers.length - count));

    function defectBatch(count, toFast = true) {
      const pool = pendingSlow().slice(0, count);
      pool.forEach((dot, i) => {
        if (toFast && fastZone) {
          moveBuyerDot(dot, fastZone, stillCurrent, 'is-green');
        } else {
          dot.style.transform = `translate(${(i - 1) * 16}px, 38px) scale(0.55)`;
          dot.classList.add('is-lost');
        }
      });
    }

    function onFastLoaded() {
      if (!stillCurrent()) return;
      fastStatus.textContent = 'loaded';
      scene?.classList.add('is-fast-loaded');
      fastSite?.classList.add('is-flash', 'is-loaded');
      timeouts.push(schedule(stillCurrent, 550, () => fastSite?.classList.remove('is-flash')));
      rightSideBuyers(SPEED_FAST_LAND).forEach((dot) => moveBuyerDot(dot, fastZone, stillCurrent, 'is-green'));
    }

    function onSlowLoaded() {
      if (!stillCurrent()) return;
      slowStatus.textContent = 'loaded too late';
      pendingSlow().slice(0, 3).forEach((d) => d.classList.add('is-stranded'));
      pendingSlow().forEach((d) => {
        if (!d.classList.contains('is-stranded')) d.classList.add('is-lost');
      });
    }

    const fastSpeed = reduceMotion ? 2.3 / 0.8 : 1;
    const slowSpeed = reduceMotion ? 17.3 / 1.2 : 1;

    cancels.push(
      animateRealTimer(fastLoad, 2.3, stillCurrent, onFastLoaded, fastSpeed)
    );
    cancels.push(
      animateRealTimer(slowLoad, 17.3, stillCurrent, onSlowLoaded, slowSpeed)
    );

    const t = (ms) => (reduceMotion ? Math.round(ms * 0.14) : ms);
    timeouts.push(schedule(stillCurrent, t(3200), () => {
      if (parseFloat(slowLoad.textContent) < 17.3) {
        slowStatus.textContent = 'buyers leaving...';
        scene?.classList.add('is-buyers-leaving');
        slowSite?.classList.add('is-abandoned');
      }
    }));
    timeouts.push(schedule(stillCurrent, t(3800), () => defectBatch(2, true)));
    timeouts.push(schedule(stillCurrent, t(5200), () => defectBatch(2, true)));
    timeouts.push(schedule(stillCurrent, t(7600), () => {
      slowStatus.textContent = 'still loading...';
      defectBatch(1, false);
    }));
    timeouts.push(schedule(stillCurrent, t(11000), () => defectBatch(1, false)));

    storeCleanup(beatEl, () => {
      cancels.forEach((fn) => fn?.());
      timeouts.forEach((id) => clearTimeout(id));
      scene?.classList.remove('is-fast-loaded', 'is-buyers-leaving');
      slowSite?.classList.remove('is-flash', 'is-abandoned');
      fastSite?.classList.remove('is-flash', 'is-loaded');
      buyers.forEach((d) => {
        d.style.transform = '';
        d.className = 'm-old-buyer-dot';
      });
    });
  }

  function playOldForm(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const packet = beatEl.querySelector('[data-old-intent-packet]');
    const formCard = beatEl.querySelector('[data-old-form-card]');
    const fields = [...beatEl.querySelectorAll('[data-old-field]')];
    const errors = [...beatEl.querySelectorAll('[data-old-error]')];
    const submit = beatEl.querySelector('[data-old-submit]');
    const lost = [...beatEl.querySelectorAll('[data-old-lost-chip]')];
    const timeouts = [];

    packet?.classList.remove('is-in', 'is-press');
    formCard?.classList.remove('is-reject');
    fields.forEach((el) => el.classList.remove('is-in', 'is-error'));
    submit?.classList.remove('is-shake');
    lost.forEach((el) => el.classList.remove('is-out'));

    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));
    const step = reduceMotion ? 50 : 140;

    add(reduceMotion ? 30 : 200, () => packet?.classList.add('is-in'));
    fields.forEach((field, i) => add(reduceMotion ? 80 : 420 + i * step, () => field.classList.add('is-in')));

    const submitAt = reduceMotion ? 280 : 1100;
    add(submitAt, () => {
      // intent compresses into the cold form and gets rejected — it never transfers
      packet?.classList.add('is-press');
      formCard?.classList.add('is-reject');
      errors.forEach((el) => el.classList.add('is-error'));
      submit?.classList.add('is-shake');
      timeouts.push(schedule(stillCurrent, 420, () => submit?.classList.remove('is-shake')));
    });

    lost.forEach((chip, i) => {
      add(submitAt + (reduceMotion ? 120 : 600) + i * (reduceMotion ? 60 : 180), () => chip.classList.add('is-out'));
    });

    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  function playOldSleep(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const milestones = [...beatEl.querySelectorAll('[data-old-milestone]')];
    const activityDots = [...beatEl.querySelectorAll('[data-old-activity-dot]')];
    const tasks = [...beatEl.querySelectorAll('[data-old-task]')];
    const timeouts = [];

    milestones.forEach((m, i) => {
      m.classList.toggle('is-active', i === 0);
      m.classList.toggle('is-night', i >= 2);
    });
    activityDots.forEach((d) => d.classList.remove('is-run'));
    tasks.forEach((t) => t.classList.remove('is-in'));

    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));
    const mileStep = reduceMotion ? 400 : 1400;

    add(reduceMotion ? 80 : 420, () => {
      activityDots.forEach((d, di) => {
        add(di * (reduceMotion ? 35 : 100), () => d.classList.add('is-run'));
      });
    });

    milestones.forEach((m, i) => {
      if (i === 0) return;
      add(i * mileStep, () => {
        milestones.forEach((x, j) => x.classList.toggle('is-active', j === i));
        activityDots.forEach((d, di) => {
          d.classList.remove('is-run');
          add(di * (reduceMotion ? 40 : 120), () => d.classList.add('is-run'));
        });
      });
    });

    tasks.forEach((task, i) => {
      add((reduceMotion ? 200 : 800) + i * (reduceMotion ? 50 : 200), () => task.classList.add('is-in'));
    });

    storeCleanup(beatEl, () => {
      timeouts.forEach((id) => clearTimeout(id));
      activityDots.forEach((d) => d.classList.remove('is-run'));
    });
  }

  function playOldSearch(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const queryEl = beatEl.querySelector('[data-old-query]');
    const you = beatEl.querySelector('[data-old-result="you"]');
    const competitor = beatEl.querySelector('[data-old-result="competitor"]');
    const cursor = beatEl.querySelector('[data-old-search-cursor]');
    const lost = beatEl.querySelector('[data-old-search-lost]');
    const timeouts = [];
    let queryIndex = 0;

    [you, competitor].forEach((el) => el?.classList.remove('is-in', 'is-picked', 'is-hesitate'));
    queryEl?.classList.remove('is-fade');
    cursor?.classList.remove('is-on', 'is-tap');
    lost?.classList.remove('is-run');
    if (queryEl) queryEl.textContent = OLD_SEARCH_QUERIES[0];

    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));

    function placeCursor(target) {
      if (!cursor || !target) return;
      const sceneRect = beatEl.querySelector('.m-old-search-scene')?.getBoundingClientRect();
      const r = target.getBoundingClientRect();
      if (!sceneRect) return;
      cursor.style.left = `${r.left - sceneRect.left + r.width * 0.72}px`;
      cursor.style.top = `${r.top - sceneRect.top + r.height * 0.55}px`;
    }

    add(reduceMotion ? 40 : 300, () => {
      you?.classList.add('is-in');
      competitor?.classList.add('is-in');
      competitor?.style.setProperty('order', '-1');
    });

    function cycleQuery() {
      if (!stillCurrent()) return;
      queryEl?.classList.add('is-fade');
      timeouts.push(
        schedule(stillCurrent, reduceMotion ? 30 : 200, () => {
          queryIndex = (queryIndex + 1) % OLD_SEARCH_QUERIES.length;
          if (queryEl) queryEl.textContent = OLD_SEARCH_QUERIES[queryIndex];
          queryEl?.classList.remove('is-fade');
        })
      );
    }

    add(reduceMotion ? 200 : 900, cycleQuery);
    add(reduceMotion ? 400 : 1800, cycleQuery);

    add(reduceMotion ? 500 : 2200, () => {
      cursor?.classList.add('is-on');
      placeCursor(you);
      you?.classList.add('is-hesitate');
    });

    add(reduceMotion ? 900 : 3200, () => {
      you?.classList.remove('is-hesitate');
      placeCursor(competitor);
      cursor?.classList.add('is-tap');
      competitor?.classList.add('is-picked');
      lost?.classList.add('is-run');
    });

    storeCleanup(beatEl, () => {
      timeouts.forEach((id) => clearTimeout(id));
      competitor?.style.removeProperty('order');
    });
  }

  function playOldUnify(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const scene = beatEl.querySelector('.m-old-unify-scene');
    const svg = beatEl.querySelector('[data-old-lines]');
    const labels = [...beatEl.querySelectorAll('[data-old-label]')];
    const ring = beatEl.querySelector('[data-old-ring]');
    const packet = beatEl.querySelector('[data-old-packet]');
    const sales = beatEl.querySelector('[data-old-sales]');
    const timeouts = [];

    scene?.classList.remove('is-done');
    labels.forEach((l) => l.classList.remove('is-linked', 'is-pulse'));
    ring?.classList.remove('is-in', 'is-pulse');
    packet?.classList.remove('is-in', 'is-send', 'is-arrived');
    sales?.classList.remove('is-in');
    if (svg) svg.innerHTML = '';

    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));

    add(reduceMotion ? 80 : 500, () => {
      if (!svg || !ring) return;
      const ringRect = ring.getBoundingClientRect();
      const sceneRect = scene.getBoundingClientRect();
      const cx = ((ringRect.left + ringRect.width / 2 - sceneRect.left) / sceneRect.width) * 400;
      const cy = ((ringRect.top + ringRect.height / 2 - sceneRect.top) / (sceneRect.height * 0.72)) * 280;
      labels.forEach((label) => {
        const lr = label.getBoundingClientRect();
        const lx = ((lr.left + lr.width / 2 - sceneRect.left) / sceneRect.width) * 400;
        const ly = ((lr.top + lr.height / 2 - sceneRect.top) / (sceneRect.height * 0.72)) * 280;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(cx));
        line.setAttribute('y1', String(cy));
        line.setAttribute('x2', String(lx));
        line.setAttribute('y2', String(ly));
        svg.appendChild(line);
        timeouts.push(schedule(stillCurrent, reduceMotion ? 30 : 120, () => line.classList.add('is-in')));
      });
    });

    add(reduceMotion ? 120 : 700, () => {
      ring?.classList.add('is-in');
      ring?.classList.add('is-pulse');
      timeouts.push(schedule(stillCurrent, 900, () => ring?.classList.remove('is-pulse')));
    });

    labels.forEach((label, i) => {
      add((reduceMotion ? 200 : 950) + i * (reduceMotion ? 80 : 220), () => {
        label.classList.add('is-linked', 'is-pulse');
        timeouts.push(schedule(stillCurrent, 500, () => label.classList.remove('is-pulse')));
      });
    });

    add(reduceMotion ? 500 : 2100, () => packet?.classList.add('is-in'));

    add(reduceMotion ? 700 : 2600, () => {
      packet?.classList.add('is-send');
      sales?.classList.add('is-in');
      timeouts.push(
        schedule(stillCurrent, reduceMotion ? 200 : 700, () => {
          packet?.classList.remove('is-send');
          packet?.classList.add('is-arrived');
          scene?.classList.add('is-done');
        })
      );
    });

    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  // Beat 3 — the stuck vendor queue dissolves and the site generates itself fast.
  function playGenSite(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const tickets = [...beatEl.querySelectorAll('[data-gen-ticket]')];
    const arrow = beatEl.querySelector('[data-gen-arrow]');
    const inputs = [...beatEl.querySelectorAll('[data-gen-input]')];
    const pages = [...beatEl.querySelectorAll('[data-gen-page]')];
    const vendorFill = beatEl.querySelector('[data-gen-fill="vendor"]');
    const deFill = beatEl.querySelector('[data-gen-fill="de"]');
    const sla = beatEl.querySelector('[data-gen-sla]');
    const timeouts = [];
    const rm = reduceMotion;

    tickets.forEach((t) => t.classList.remove('is-dissolve'));
    arrow?.classList.remove('is-in');
    inputs.forEach((el) => el.classList.remove('is-in'));
    pages.forEach((el) => el.classList.remove('is-in'));
    sla?.classList.remove('is-in');
    if (vendorFill) vendorFill.style.width = '0%';
    if (deFill) deFill.style.width = '0%';

    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));

    // the vendor queue stays on screen — the slow way you live in today —
    // then the arrow + your inputs land beside it (the AI way that replaces it)
    add(rm ? 80 : 600, () => arrow?.classList.add('is-in'));
    inputs.forEach((el, i) => add((rm ? 90 : 760) + i * (rm ? 30 : 150), () => el.classList.add('is-in')));
    // the full site assembles itself, page by page, fast
    pages.forEach((el, i) => add((rm ? 140 : 1300) + i * (rm ? 30 : 120), () => el.classList.add('is-in')));
    // 4) speed contrast — DealerEdge races, the vendor sprint crawls
    add(rm ? 60 : 720, () => { if (vendorFill) vendorFill.style.width = '16%'; });
    add(rm ? 160 : 1550, () => { if (deFill) deFill.style.width = '100%'; });
    // the guarantee stamps in last
    add(rm ? 200 : 2050, () => sla?.classList.add('is-in'));

    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  // Website Beat 3 — the thin "Call for details" listing; the spine (Beat 4) resolves it.
  function playThinListing(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const misses = [...beatEl.querySelectorAll('[data-thin-miss]')];
    const bounce = beatEl.querySelector('[data-thin-bounce]');
    const timeouts = [];
    const rm = reduceMotion;
    misses.forEach((m) => m.classList.remove('is-in'));
    bounce?.classList.remove('is-in');
    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));
    misses.forEach((m, i) => add((rm ? 20 : 300) + i * (rm ? 20 : 180), () => m.classList.add('is-in')));
    add(rm ? 120 : 1300, () => bounce?.classList.add('is-in'));
    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  // Beat 4 — the stale Beat-1 listing grows a sales spine, vertebra by vertebra.
  function playSpine(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const rail = beatEl.querySelector('[data-spine-rail]');
    const nodes = [...beatEl.querySelectorAll('[data-spine-node]')];
    const card = beatEl.querySelector('[data-spine-card]');
    const stamp = beatEl.querySelector('[data-spine-stamp]');
    const headline = beatEl.querySelector('[data-spine-headline]');
    const adds = [...beatEl.querySelectorAll('[data-spine-add]')];
    const tags = [...beatEl.querySelectorAll('[data-spine-tag]')];
    const order = ['copy', 'schema', 'financing', 'faq', 'related'];
    const timeouts = [];
    const rm = reduceMotion;

    rail?.classList.remove('is-grown');
    nodes.forEach((n) => n.classList.remove('is-lit'));
    card?.classList.remove('is-live');
    stamp?.classList.remove('is-live');
    if (stamp) stamp.textContent = 'Updated 71 days ago';
    if (headline) { headline.textContent = 'Great condition. Call for details.'; headline.style.opacity = ''; }
    adds.forEach((el) => el.classList.remove('is-in'));
    tags.forEach((el) => el.classList.remove('is-lit'));

    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));

    // the spine draws down the card
    add(rm ? 30 : 260, () => rail?.classList.add('is-grown'));

    // each vertebra lights and bolts on a selling capability
    order.forEach((key, i) => {
      add((rm ? 60 : 720) + i * (rm ? 40 : 360), () => {
        nodes[i]?.classList.add('is-lit');
        tags.find((t) => t.dataset.spineTag === key)?.classList.add('is-lit');
        adds.find((a) => a.dataset.spineAdd === key)?.classList.add('is-in');
        if (key === 'copy' && headline) {
          headline.style.opacity = '0';
          timeouts.push(schedule(stillCurrent, rm ? 20 : 200, () => {
            headline.textContent = '$162,900 — surf-ready, family-built.';
            headline.style.opacity = '1';
          }));
        }
      });
    });

    // the dead listing comes alive
    add((rm ? 220 : 900) + order.length * (rm ? 40 : 360), () => {
      card?.classList.add('is-live');
      stamp?.classList.add('is-live');
      if (stamp) stamp.textContent = 'Live · optimized';
    });

    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  // Beat 5 — same traffic streams in; capture nets switch on; 16 → 636.
  function playCapture(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const lane = beatEl.querySelector('[data-capture-lane]');
    const nets = [...beatEl.querySelectorAll('[data-capture-net]')];
    const tray = beatEl.querySelector('[data-capture-tray]');
    const count = beatEl.querySelector('[data-capture-count]');
    const timeouts = [];
    const rm = reduceMotion;

    nets.forEach((n) => n.classList.remove('is-on'));
    tray?.classList.remove('is-spiking');
    if (count) count.textContent = '16';

    // build the inbound traffic lane — same volume throughout
    if (lane) {
      lane.innerHTML = '';
      const N = 16;
      for (let i = 0; i < N; i += 1) {
        const dot = document.createElement('span');
        dot.className = 'm-capture-dot';
        dot.style.animationDelay = `${((i / N) * 2.8).toFixed(2)}s`;
        if (rm) dot.style.animation = 'none';
        lane.appendChild(dot);
      }
    }
    const dots = lane ? [...lane.querySelectorAll('.m-capture-dot')] : [];

    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));

    // the capture mechanisms switch on one at a time
    nets.forEach((net, i) => add((rm ? 40 : 620) + i * (rm ? 30 : 240), () => net.classList.add('is-on')));

    // the stream that used to leave now gets caught
    add(rm ? 120 : 1500, () => dots.forEach((d, i) => { if (i % 2 === 0) d.classList.add('is-caught'); }));

    // the money shot — same traffic, 16 → 636
    add(rm ? 140 : 1600, () => {
      tray?.classList.add('is-spiking');
      countInt(count, 16, 636, rm ? 0 : 1700, stillCurrent);
    });
    add(rm ? 200 : 3400, () => tray?.classList.remove('is-spiking'));

    storeCleanup(beatEl, () => {
      timeouts.forEach((id) => clearTimeout(id));
      if (lane) lane.innerHTML = '';
    });
  }

  // Content Beat 3 — raw DAM asset wipes into the on-brand ad in place.
  function playDamMorph(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const stage = beatEl.querySelector('[data-damx-stage]');
    const timeouts = [];
    stage?.classList.remove('is-branded');
    timeouts.push(schedule(stillCurrent, reduceMotion ? 30 : 600, () => stage?.classList.add('is-branded')));
    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  // Content Beat 4 — one source asset clones out to every channel.
  function playDamChannels(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const hub = beatEl.querySelector('[data-chan-hub]');
    const core = beatEl.querySelector('[data-chan-core]');
    const cards = [...beatEl.querySelectorAll('[data-chan-card]')];
    const timeouts = [];
    const rm = reduceMotion;
    cards.forEach((c) => c.classList.remove('is-in'));
    hub?.querySelectorAll('.m-chan-clone').forEach((n) => n.remove());
    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));
    cards.forEach((card, i) => {
      add((rm ? 40 : 520) + i * (rm ? 30 : 320), () => {
        if (!rm) flyClone(core, card, hub, stillCurrent, timeouts);
        card.classList.add('is-in');
      });
    });
    storeCleanup(beatEl, () => {
      timeouts.forEach((id) => clearTimeout(id));
      hub?.querySelectorAll('.m-chan-clone').forEach((n) => n.remove());
    });
  }

  function flyClone(core, card, hub, stillCurrent, timeouts) {
    if (!core || !card || !hub || !stillCurrent()) return;
    const srcImg = core.querySelector('img');
    const clone = document.createElement('img');
    clone.className = 'm-chan-clone';
    if (srcImg) clone.src = srcImg.currentSrc || srcImg.src;
    const hubRect = hub.getBoundingClientRect();
    const coreRect = core.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const startX = coreRect.left + coreRect.width / 2 - hubRect.left - 24;
    const startY = coreRect.top + coreRect.height / 2 - hubRect.top - 16;
    const endX = cardRect.left + cardRect.width / 2 - hubRect.left - 24;
    const endY = cardRect.top + 18 - hubRect.top;
    clone.style.left = `${startX}px`;
    clone.style.top = `${startY}px`;
    clone.style.opacity = '0';
    hub.appendChild(clone);
    requestAnimationFrame(() => {
      if (!stillCurrent()) { clone.remove(); return; }
      clone.style.opacity = '1';
      clone.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(1.05)`;
    });
    timeouts.push(schedule(stillCurrent, 560, () => { clone.style.opacity = '0'; }));
    timeouts.push(setTimeout(() => clone.remove(), 820));
  }

  // Content Beat 5 — modules snap into the page, then the SERP flips (Beat 1 payoff).
  function playRankClimb(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const article = beatEl.querySelector('[data-rank-article]');
    const mods = [...beatEl.querySelectorAll('[data-rank-mod]')];
    const ladder = beatEl.querySelector('[data-rank-ladder]');
    const rows = beatEl.querySelector('[data-rank-rows]');
    const count = beatEl.querySelector('[data-rank-count]');
    const timeouts = [];
    const rm = reduceMotion;
    article?.classList.remove('is-in');
    mods.forEach((m) => m.classList.remove('is-in'));
    ladder?.classList.remove('is-in');
    rows?.classList.remove('is-ranked');
    if (count) count.textContent = '7';
    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));
    add(rm ? 20 : 200, () => article?.classList.add('is-in'));
    mods.forEach((m, i) => add((rm ? 40 : 450) + i * (rm ? 30 : 130), () => m.classList.add('is-in')));
    add(rm ? 60 : 720, () => ladder?.classList.add('is-in'));
    // the climb — your listing rises past the competitor
    add(rm ? 120 : 1500, () => rows?.classList.add('is-ranked'));
    add(rm ? 160 : 2150, () => countInt(count, 7, 49, rm ? 0 : 1400, stillCurrent));
    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  // Content Beat 6 — the AI answer composes in real time and cites you.
  function playGeoAnswer(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const q = beatEl.querySelector('.m-geo-q[data-step]');
    const bubble = beatEl.querySelector('.m-geo-a');
    const answer = beatEl.querySelector('[data-geo-answer]');
    const cite = beatEl.querySelector('[data-geo-cite]');
    const timeouts = [];
    const rm = reduceMotion;
    const full = 'For wake boats around Knoxville, <b>Premier Watersports</b> is a standout — strong Malibu and Axis inventory, financing, and top-rated service.';
    const segs = [
      { t: 'For wake boats around Knoxville, ', b: false },
      { t: 'Premier Watersports', b: true },
      { t: ' is a standout — strong Malibu and Axis inventory, financing, and top-rated service.', b: false },
    ];
    q?.classList.remove('is-in');
    bubble?.classList.remove('is-in');
    cite?.classList.remove('is-in');
    answer?.classList.remove('is-typing');
    if (answer) answer.innerHTML = '';

    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));
    add(rm ? 20 : 220, () => q?.classList.add('is-in'));

    if (rm) {
      add(60, () => {
        bubble?.classList.add('is-in');
        if (answer) answer.innerHTML = full;
        cite?.classList.add('is-in');
      });
      storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
      return;
    }

    add(600, () => bubble?.classList.add('is-in'));

    // typewriter across segments, preserving the bold brand span
    add(900, () => {
      if (!answer || !stillCurrent()) return;
      answer.classList.add('is-typing');
      let si = 0;
      let ci = 0;
      let node = null;
      const typeNext = () => {
        if (!stillCurrent()) return;
        if (si >= segs.length) {
          answer.classList.remove('is-typing');
          cite?.classList.add('is-in');
          return;
        }
        const seg = segs[si];
        if (ci === 0) {
          node = seg.b ? document.createElement('b') : document.createTextNode('');
          answer.appendChild(node);
        }
        node.textContent += seg.t[ci];
        ci += 1;
        if (ci >= seg.t.length) { si += 1; ci = 0; }
        timeouts.push(setTimeout(typeNext, 18));
      };
      typeNext();
    });

    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  // Operation Beat 1 — the human team you'd hire ($200k) collapses into one system.
  function playOpTeam(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const roster = beatEl.querySelector('[data-roster]');
    const roles = [...beatEl.querySelectorAll('[data-roster-role]')];
    const count = beatEl.querySelector('[data-roster-count]');
    const timeouts = [];
    const rm = reduceMotion;
    roster?.classList.remove('is-merged');
    roles.forEach((r) => r.classList.remove('is-in'));
    if (count) count.textContent = '0';
    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));
    roles.forEach((r, i) => add((rm ? 20 : 180) + i * (rm ? 20 : 140), () => r.classList.add('is-in')));
    add(rm ? 60 : 750, () => countInt(count, 0, 200000, rm ? 0 : 1500, stillCurrent));
    add(rm ? 140 : 2500, () => roster?.classList.add('is-merged'));
    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  // Operation Beat 3 — one campaign brief fans out into every coordinated asset.
  function playFanout(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const brief = beatEl.querySelector('[data-fanout-brief]');
    const arrow = beatEl.querySelector('[data-fanout-arrow]');
    const assets = [...beatEl.querySelectorAll('[data-fanout-asset]')];
    const timeouts = [];
    const rm = reduceMotion;
    brief?.classList.remove('is-in');
    arrow?.classList.remove('is-in');
    assets.forEach((a) => a.classList.remove('is-in'));
    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));
    add(rm ? 20 : 220, () => brief?.classList.add('is-in'));
    add(rm ? 60 : 700, () => arrow?.classList.add('is-in'));
    assets.forEach((a, i) => add((rm ? 80 : 850) + i * (rm ? 30 : 160), () => a.classList.add('is-in')));
    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  // Operation Beat 4 — inventory feeds into dynamic Google/Meta ads that sell units.
  function playInvAds(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const scene = beatEl.querySelector('[data-invads]');
    const tiles = [...beatEl.querySelectorAll('[data-invads-tile]')];
    const ads = [...beatEl.querySelectorAll('[data-invads-ad]')];
    const sold = beatEl.querySelector('[data-invads-sold]');
    const timeouts = [];
    const rm = reduceMotion;
    scene?.classList.remove('is-flowing');
    tiles.forEach((t) => t.classList.remove('is-in'));
    ads.forEach((a) => a.classList.remove('is-in'));
    sold?.classList.remove('is-in');
    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));
    tiles.forEach((t, i) => add((rm ? 20 : 200) + i * (rm ? 20 : 120), () => t.classList.add('is-in')));
    add(rm ? 80 : 800, () => scene?.classList.add('is-flowing'));
    ads.forEach((a, i) => add((rm ? 90 : 1100) + i * (rm ? 30 : 380), () => a.classList.add('is-in')));
    add(rm ? 140 : 2150, () => sold?.classList.add('is-in'));
    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  // Operation Beat 1 — reviews rot; the rating slides 4.2 → 3.9 live.
  function playOpRot(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const steps = [...beatEl.querySelectorAll('[data-step]')];
    const rating = beatEl.querySelector('[data-rot-rating]');
    const timeouts = [];
    const rm = reduceMotion;
    steps.forEach((s) => s.classList.remove('is-in'));
    if (rating) rating.textContent = '4.2';
    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));
    steps.forEach((s, i) => add((rm ? 20 : 200) + i * (rm ? 30 : 240), () => s.classList.add('is-in')));
    add(rm ? 60 : 900, () => countFloat(rating, 4.2, 3.9, rm ? 0 : 1600, stillCurrent));
    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  // Operation Beat 2 — goals/persona/market/constraint feed one strategy brief.
  function playStrategy(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const inputs = [...beatEl.querySelectorAll('[data-strat-input]')];
    const arrow = beatEl.querySelector('[data-strat-arrow]');
    const brief = beatEl.querySelector('[data-strat-brief]');
    const timeouts = [];
    const rm = reduceMotion;
    inputs.forEach((el) => el.classList.remove('is-in'));
    arrow?.classList.remove('is-in');
    brief?.classList.remove('is-in');
    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));
    inputs.forEach((el, i) => add((rm ? 20 : 200) + i * (rm ? 30 : 180), () => el.classList.add('is-in')));
    add(rm ? 80 : 1000, () => arrow?.classList.add('is-in'));
    add(rm ? 100 : 1200, () => brief?.classList.add('is-in'));
    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  // Operation Beat 3 — separate vendor nodes wire into one team (the act anchor).
  function playTeamNet(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const hub = beatEl.querySelector('[data-teamnet-hub]');
    const lines = [...beatEl.querySelectorAll('[data-teamnet-line]')];
    const nodes = [...beatEl.querySelectorAll('[data-teamnet-node]')];
    const timeouts = [];
    const rm = reduceMotion;
    hub?.classList.remove('is-in');
    nodes.forEach((n) => n.classList.remove('is-wired'));
    lines.forEach((ln) => {
      const len = ln.getTotalLength ? ln.getTotalLength() : 200;
      ln.style.strokeDasharray = String(len);
      ln.style.strokeDashoffset = rm ? '0' : String(len);
    });
    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));
    add(rm ? 20 : 200, () => hub?.classList.add('is-in'));
    nodes.forEach((node, i) => {
      add((rm ? 40 : 600) + i * (rm ? 30 : 230), () => {
        if (lines[i]) lines[i].style.strokeDashoffset = '0';
        node.classList.add('is-wired');
      });
    });
    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  // Operation Beat 4 — a buyer dot flows Attract → Engage → Convert, gathering context.
  function playFunnelFlow(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const lanes = [...beatEl.querySelectorAll('[data-flow-lane]')];
    const dot = beatEl.querySelector('[data-flow-dot]');
    const chips = [...beatEl.querySelectorAll('[data-flow-chip]')];
    const timeouts = [];
    const rm = reduceMotion;
    const positions = ['16.6%', '50%', '83.3%'];
    const laneChips = [[0], [1, 2], [3]];
    lanes.forEach((l) => l.classList.remove('is-active'));
    chips.forEach((c) => c.classList.remove('is-in'));
    if (dot) dot.style.left = '16.6%';
    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));
    lanes.forEach((lane, i) => {
      add((rm ? 30 : 450) + i * (rm ? 40 : 850), () => {
        if (dot) dot.style.left = positions[i];
        lane.classList.add('is-active');
        laneChips[i].forEach((ci, k) => {
          timeouts.push(schedule(stillCurrent, (rm ? 20 : 300) + k * (rm ? 20 : 230), () => chips[ci]?.classList.add('is-in')));
        });
      });
    });
    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  // Operation Beat 5 — the rotting reviews from Beat 1 get handled; rating climbs 3.9 → 4.8.
  function playRevFix(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const steps = [...beatEl.querySelectorAll('[data-revfix-step]')];
    const rating = beatEl.querySelector('[data-revfix-rating]');
    const timeouts = [];
    const rm = reduceMotion;
    steps.forEach((s) => s.classList.remove('is-in'));
    if (rating) rating.textContent = '3.9';
    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));
    steps.forEach((s, i) => add((rm ? 20 : 200) + i * (rm ? 30 : 240), () => s.classList.add('is-in')));
    add(rm ? 60 : 1000, () => countFloat(rating, 3.9, 4.8, rm ? 0 : 1600, stillCurrent));
    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  // Operation Beat 6 — Marketing passes the context-loaded buyer to Mike like a baton.
  function playHandoff(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const profile = beatEl.querySelector('[data-ho-profile]');
    const packet = beatEl.querySelector('[data-ho-packet]');
    const sales = beatEl.querySelector('[data-ho-sales]');
    const timeouts = [];
    const rm = reduceMotion;
    profile?.classList.remove('is-in');
    sales?.classList.remove('is-in', 'is-live');
    packet?.classList.remove('is-travel');
    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));
    add(rm ? 20 : 250, () => profile?.classList.add('is-in'));
    add(rm ? 40 : 700, () => sales?.classList.add('is-in'));
    add(rm ? 60 : 1000, () => packet?.classList.add('is-travel'));
    add(rm ? 90 : 1850, () => sales?.classList.add('is-live'));
    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  // Content Beat 5 — the GEO miss: AI names the competitor (red mirror of Beat 6).
  function playGeoMiss(beatEl, stillCurrent) {
    if (!beatEl) return;
    beatEl.classList.add('is-playing');
    const q = beatEl.querySelector('.m-geo-q[data-step]');
    const bubble = beatEl.querySelector('.m-geo-a');
    const answer = beatEl.querySelector('[data-geo-answer]');
    const cite = beatEl.querySelector('[data-geo-cite]');
    const timeouts = [];
    const rm = reduceMotion;
    const full = 'For wake boats near Knoxville, <b>North Lake Marine</b> comes up first — better reviews, fresher listings, an active feed.';
    const segs = [
      { t: 'For wake boats near Knoxville, ', b: false },
      { t: 'North Lake Marine', b: true },
      { t: ' comes up first — better reviews, fresher listings, an active feed.', b: false },
    ];
    q?.classList.remove('is-in');
    bubble?.classList.remove('is-in');
    cite?.classList.remove('is-in');
    answer?.classList.remove('is-typing');
    if (answer) answer.innerHTML = '';
    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));
    add(rm ? 20 : 220, () => q?.classList.add('is-in'));
    if (rm) {
      add(60, () => {
        bubble?.classList.add('is-in');
        if (answer) answer.innerHTML = full;
        cite?.classList.add('is-in');
      });
      storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
      return;
    }
    add(600, () => bubble?.classList.add('is-in'));
    add(900, () => {
      if (!answer || !stillCurrent()) return;
      answer.classList.add('is-typing');
      let si = 0;
      let ci = 0;
      let node = null;
      const typeNext = () => {
        if (!stillCurrent()) return;
        if (si >= segs.length) {
          answer.classList.remove('is-typing');
          cite?.classList.add('is-in');
          return;
        }
        const seg = segs[si];
        if (ci === 0) {
          node = seg.b ? document.createElement('b') : document.createTextNode('');
          answer.appendChild(node);
        }
        node.textContent += seg.t[ci];
        ci += 1;
        if (ci >= seg.t.length) { si += 1; ci = 0; }
        timeouts.push(setTimeout(typeNext, 18));
      };
      typeNext();
    });
    storeCleanup(beatEl, () => timeouts.forEach((id) => clearTimeout(id)));
  }

  function playSequential(beatEl, stillCurrent) {
    if (!beatEl) return;
    const steps = [...beatEl.querySelectorAll('[data-step]')];
    beatEl.classList.remove('is-playing');
    steps.forEach((el) => el.classList.remove('is-in'));
    void beatEl.offsetWidth;
    beatEl.classList.add('is-playing');

    const delayStep = reduceMotion ? 20 : 145;
    const firstDelay = reduceMotion ? 20 : 120;
    steps.forEach((el, index) => {
      setTimeout(() => tick(stillCurrent, () => el.classList.add('is-in')), firstDelay + index * delayStep);
    });

    beatEl.querySelectorAll('video').forEach((video) => {
      video.currentTime = 0;
      video.play?.().catch(() => {});
    });
  }

  function tick(stillCurrent, fn) {
    if (typeof stillCurrent === 'function' && !stillCurrent()) return;
    fn();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
} };

DE.boot('marketing');
