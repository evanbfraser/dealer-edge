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

  let marketingLateCssPromise = null;
  let marketingLateContentPromise = null;
  let marketingLateContentReady = false;
  function loadMarketingLateCss() {
    const href = 'css/marketing-late.min.css?v=20260630b';
    if (document.querySelector(`link[href="${href}"]`)) {
      return marketingLateCssPromise || Promise.resolve();
    }
    if (!marketingLateCssPromise) {
      marketingLateCssPromise = new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = resolve;
        document.head.appendChild(link);
      });
    }
    return marketingLateCssPromise;
  }

  function loadMarketingLateContent() {
    const root = document.querySelector('[data-marketing-late-root]');
    if (!root) return Promise.resolve();
    if (marketingLateContentReady || root.dataset.loaded === 'true') return marketingLateContentPromise || Promise.resolve();
    if (!marketingLateContentPromise) {
      marketingLateContentPromise = fetch('partials/marketing-late-content.html?v=20260630b')
        .then((response) => response.ok ? response.text() : '')
        .then((html) => {
          if (!html || root.dataset.loaded === 'true') return;
          root.innerHTML = html;
          root.dataset.loaded = 'true';
          marketingLateContentReady = true;
          DE.initFade();
          initDeferredShowcaseMedia();
          initShowcase();
          DE.initLazyVideoBoatSections();
        })
        .catch(() => {});
    }
    return marketingLateContentPromise;
  }

  /* One-shot: cached so the per-scroll loader can't re-run the trailing
     ScrollTrigger.refresh() — refresh's pin-revert scrollTo() fires more
     scroll events, which re-invoked this on every event: a self-sustaining
     full-refresh loop that crushed mobile WebKit. Refresh exactly once. */
  let marketingLateExperiencePromise = null;
  function loadMarketingLateExperience() {
    if (!marketingLateExperiencePromise) {
      marketingLateExperiencePromise = Promise.all([loadMarketingLateContent(), loadDeActCss(), loadMarketingLateCss()])
        .then(() => loadMarketingLateJs())
        .then(() => {
          if (window.ScrollTrigger) ScrollTrigger.refresh();
        });
    }
    return marketingLateExperiencePromise;
  }

  function initLateCssLoader() {
    const sec = document.querySelector('[data-marketing-late-root]');
    let requested = false;
    const load = () => {
      if (requested) return;
      requested = true;
      loadMarketingLateExperience();
    };

    if (!sec) return;
    const check = () => {
      if (requested) return;
      const rect = sec.getBoundingClientRect();
      // +450px approach margin (matches inventory/analytics): the pre-late
      // page is barely taller than one viewport, so an exact
      // `top < innerHeight` gate can sit forever at the scroll clamp — it
      // only ever passed on phones because the URL-bar resize re-ran it.
      if (window.scrollY > 0 && rect.top < window.innerHeight + 450) load();
    };
    DE.on(window, 'scroll', check, { passive: true });
    DE.on(window, 'resize', check, { passive: true });
  }

  let scrollLibsPromise = null;
  let heroInitialized = false;
  function loadMarketingScrollLibs() {
    if (!scrollLibsPromise) {
      scrollLibsPromise = DE.loadScrollLibs(lenis);
    }
    return scrollLibsPromise;
  }

  function initMarketingHeroWhenReady() {
    if (heroInitialized) return;
    heroInitialized = true;
    loadMarketingScrollLibs().then(() => {
      initHero();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }

  function initHeroScrollLibLoader() {
    DE.prewarm(initMarketingHeroWhenReady, 250);
  }

  DE.initMobileNav(); // not shipped to the platform (DeHeader owns nav)
  DE.initLazyDemoModal(lenis);
  DE.initCursorGlow();
  DE.initNavScroll();
  DE.initScrollHint();
  DE.initEntryCue();
  DE.initFade();
  initLateCssLoader();
  initHeroScrollLibLoader();
  // act engine: DE.initActs — invoked below, after BEAT_ANIMS is declared

  /* ─────────────────────────────────────────────────────────────
     PROOF SHOWCASE — Premier Watersports.
     Not scroll-pinned. Plays once when it scrolls into view: the
     device trio "loads" (blur clears, slow 13.8s flips to fast 2.3s),
     the PageSpeed score counts to 99, and the stat counters tick up.
     ───────────────────────────────────────────────────────────── */
  function hydrateShowcaseMedia(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-defer-showcase-media]').forEach((picture) => {
      if (picture.dataset.hydrated === 'true') return;
      picture.dataset.hydrated = 'true';
      picture.querySelectorAll('source[data-srcset]').forEach((source) => {
        source.srcset = source.dataset.srcset;
        source.removeAttribute('data-srcset');
      });
      picture.querySelectorAll('img[data-src]').forEach((img) => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    });
  }

  function initDeferredShowcaseMedia() {
    const sec = document.querySelector('[data-showcase]');
    if (!sec) return;
    const check = () => {
      const rect = sec.getBoundingClientRect();
      if (rect.top < window.innerHeight + 360 && rect.bottom > -360) hydrateShowcaseMedia(sec);
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        hydrateShowcaseMedia(sec);
        observer.disconnect();
      }, { rootMargin: '360px 0px' });
      observer.observe(sec);
    }
    DE.on(window, 'scroll', check, { passive: true });
    DE.on(window, 'resize', check, { passive: true });
    check();
  }

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
      hydrateShowcaseMedia(sec);

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
        // Reset to 0 at animation start so the static HTML can hold the real
        // value as the no-JS/crawler fallback (countTo reads its start from
        // textContent) while the count-up still plays on reveal.
        counters.forEach((c) => { c.textContent = '0'; countTo(c, Number(c.dataset.count) || 0, 1100); });
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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  let marketingLateJsPromise = null;
  let marketingLateInitialized = false;
  function loadMarketingLateJs() {
    const src = 'js/marketing-late.min.js?v=20260630b';
    if (!marketingLateJsPromise) {
      marketingLateJsPromise = new Promise((resolve) => {
        const existing = document.querySelector('script[src="' + src + '"]');
        if (existing) {
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', resolve, { once: true });
          return;
        }
        Promise.all([loadMarketingScrollLibs(), loadMarketingLateContent()]).then(() => {
          const script = document.createElement('script');
          script.src = src;
          script.defer = true;
          script.onload = resolve;
          script.onerror = resolve;
          document.head.appendChild(script);
        });
      });
    }
    return marketingLateJsPromise.then(() => {
      if (!marketingLateInitialized && typeof DE.initMarketingLate === 'function') {
        marketingLateInitialized = true;
        DE.initMarketingLate(lenis, reduceMotion);
      }
    });
  }

} };

DE.boot('marketing');
