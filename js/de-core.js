/* ═══════════════════════════════════════════════════════════════
   DE-CORE — shared scroll-engine utilities (marketing + sales)
   ═══════════════════════════════════════════════════════════════
   One implementation of the blocks both deep-dive pages used to
   duplicate: Lenis init, cursor glow, [data-fade] reveal, navbar
   scroll state, and snap-to-scene. Load AFTER the CDN libs
   (Lenis/GSAP/ScrollTrigger) and BEFORE the page script:

     <script src="js/de-core.js"></script>
     <script src="js/<page>.js"></script>

   Page scripts consume it via the DE global:
     const lenis = DE.createLenis();
     DE.initCursorGlow(); DE.initNavScroll(); DE.initFade();
     DE.attachSceneSnap(lenis, sectionEl, sceneCount);
     DE.initActs(lenis, { anims: BEAT_ANIMS, cleanups: weakMap });

   Lifecycle (added 2026-06-11 for the platform-island migration):
   page scripts register DE.pages['<key>'] = { boot() {...} } and end
   with DE.boot('<key>') — identical behavior on the static site. An
   SPA host calls DE.destroy() before unmounting, then DE.boot(key)
   again on remount. Long-lived window/document/matchMedia listeners,
   intervals and rAF self-loops inside page scripts must go through
   DE.on() / DE.interval() / DE.rafLoop() so destroy can reach them.
   ─────────────────────────────────────────────────────────────── */
window.DE = (() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Safari's trackpad momentum keeps emitting scroll events long after the
  // fingers lift, which re-triggers the settle timer and makes snap-to-scene
  // fight the user ("stick, then zoom past"). Leave Safari un-snapped.
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  /* ─────────────────────────────────────────────────────────────
     LIFECYCLE — boot/destroy contract for hosting these pages
     inside an SPA (the DealerEdge platform islands). On the static
     site nothing changes: each page script registers itself in
     DE.pages and calls DE.boot('<key>') as its last line, which
     runs the page exactly as the old self-executing IIFE did.
     A host calls DE.destroy() before unmounting the island:
     listeners registered through DE.on()/DE.interval()/DE.rafLoop()
     are torn down via one AbortController + disposer list, every
     ScrollTrigger is killed, Lenis is destroyed, and the act
     engine's runTokens are bumped so stillCurrent-guarded timer
     chains go inert. Element-level listeners need no registry —
     they die with the island DOM.
     ───────────────────────────────────────────────────────────── */
  const pages = {};
  let lc = null;          // current lifecycle: { ac, disposers, lenis }
  let currentPage = null;

  function lifecycle() {
    if (!lc) lc = { ac: new AbortController(), disposers: [], lenis: null };
    return lc;
  }
  /* addEventListener that auto-detaches on DE.destroy(). Use for
     window/document/matchMedia targets; element listeners don't need it. */
  function on(target, type, handler, opts = {}) {
    target.addEventListener(type, handler, { ...opts, signal: lifecycle().ac.signal });
  }
  function addDisposer(fn) {
    lifecycle().disposers.push(fn);
  }
  function interval(fn, ms) {
    const id = setInterval(fn, ms);
    addDisposer(() => clearInterval(id));
    return id;
  }
  /* self-rescheduling rAF loop that stops on destroy */
  function rafLoop(step) {
    const sig = lifecycle().ac.signal;
    function frame(time) {
      if (sig.aborted) return;
      step(time);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  /* run now if the DOM is already parsed (SPA boot), else on DOMContentLoaded */
  function ready(fn) {
    if (document.readyState === 'loading') on(document, 'DOMContentLoaded', fn, { once: true });
    else fn();
  }
  function prewarm(fn, delay = 350) {
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      fn();
    };
    ready(() => setTimeout(run, delay));
    return run;
  }
  function boot(key) {
    const page = pages[key];
    if (!page) return;
    // Idempotent. On the platform an island boots TWICE on first load: the
    // exported page script self-runs DE.boot(key) AND DeExperienceLoader calls
    // it. Without this guard the second boot builds a 2nd Lenis while the first
    // is orphaned (lc.lenis only holds the latest) — and the orphan's
    // passive:false `wheel` listener is never torn down, so it preventDefaults
    // every wheel event on the NEXT (CMS) page after a soft nav → no scroll.
    // Re-boot for the same key is a no-op until destroy() clears currentPage.
    if (lc && currentPage === key) return;
    // booting a different page without a teardown first — clean up to be safe
    if (lc) destroy();
    lifecycle();
    currentPage = key;
    page.boot();
  }
  function destroy() {
    if (!lc) return;
    try { pages[currentPage]?.destroy?.(); } catch (e) { /* best effort */ }
    lc.ac.abort();
    lc.disposers.forEach((d) => { try { d(); } catch (e) { /* best effort */ } });
    if (window.ScrollTrigger) ScrollTrigger.killAll();
    try { lc.lenis?.destroy(); } catch (e) { /* best effort */ }
    lc = null;
    currentPage = null;
  }

  function loadScriptOnce(src) {
    return new Promise((resolve) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === 'true') {
          resolve();
          return;
        }
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', resolve, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = resolve;
      document.head.appendChild(script);
    });
  }

  function attachScrollTrigger(lenis) {
    if (!lenis || !window.gsap || !window.ScrollTrigger || lenis.__deScrollTriggerAttached) return false;
    lenis.__deScrollTriggerAttached = true;
    gsap.registerPlugin(ScrollTrigger);
    // ignoreMobileResize: iOS fires window resize when the URL bar
    // collapses/expands mid-scroll; without this flag every direction
    // change near the bar triggers a full refresh of a ~28,000px page
    // (pin revert + re-measure + programmatic scroll writes) = visible
    // jump/flicker on phones.
    ScrollTrigger.config({ limitCallbacks: true, ignoreMobileResize: true });
    lenis.on('scroll', ScrollTrigger.update);
    // lenis.raf is ALREADY driven by createLenis's rafLoop. Do NOT also drive it
    // from gsap.ticker — when ScrollTrigger attaches late (e.g. the homepage,
    // where GSAP loads on approach to .journey-section, right after the
    // "Four capabilities" CTA), lenis would advance twice per frame, doubling
    // scroll speed and visibly breaking the smooth scroll. ScrollTrigger only
    // needs to update on lenis's scroll event (wired above); its own animations
    // still run on gsap.ticker.
    gsap.ticker.lagSmoothing(0);
    return true;
  }

  function loadScrollLibs(lenis) {
    if (window.gsap && window.ScrollTrigger) {
      attachScrollTrigger(lenis);
      return Promise.resolve();
    }
    const gsapSrc = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
    const scrollTriggerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js';
    return loadScriptOnce(gsapSrc)
      .then(() => loadScriptOnce(scrollTriggerSrc))
      .then(() => { attachScrollTrigger(lenis); });
  }

  /* Lenis smooth scroll + optional GSAP/ScrollTrigger wiring (canonical options).

     TOUCH-PRIMARY DEVICES GET A NATIVE-SCROLL SHIM INSTEAD OF LENIS.
     With smoothTouch off, Lenis adds nothing on phones — but its
     VirtualScroll still binds wheel/touchstart/touchmove with
     {passive: false}, and a non-passive touchmove forces iOS WebKit to
     synchronize EVERY touch-scroll frame with the main thread before the
     compositor may commit. On a page this heavy that turns busy main-thread
     moments directly into finger lag ("stuck in mud"). The shim keeps the
     lenis surface our code consumes (on/scrollTo/stop/start/raf/destroy)
     while scrolling stays 100% native and compositor-driven; ScrollTrigger
     still updates via the forwarded native scroll event. */
  function createLenis(options = {}) {
    if (window.matchMedia('(pointer: coarse)').matches) {
      const handlers = [];
      const shim = {
        isNativeShim: true,
        isStopped: false,
        velocity: 0,
        on(event, fn) { if (event === 'scroll') handlers.push(fn); },
        raf() {},
        resize() {},
        // parity with Lenis stop()/start(): real Lenis preventDefaults touch
        // while stopped (modal open) — the shim locks the root scroller instead
        stop() { this.isStopped = true; document.documentElement.style.overflow = 'hidden'; },
        start() { this.isStopped = false; document.documentElement.style.overflow = ''; },
        scrollTo(target, opts = {}) {
          const top = typeof target === 'number' ? target : 0;
          window.scrollTo({ top, behavior: reduceMotion || opts.immediate ? 'auto' : 'smooth' });
          if (opts.onComplete) setTimeout(opts.onComplete, 600);
        },
        destroy() { handlers.length = 0; },
      };
      on(window, 'scroll', () => { handlers.forEach((fn) => fn(shim)); }, { passive: true });
      lifecycle().lenis = shim;
      attachScrollTrigger(shim);
      return shim;
    }
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      ...options,
    });
    lifecycle().lenis = lenis;
    rafLoop((time) => lenis.raf(time));
    attachScrollTrigger(lenis);
    return lenis;
  }

  /* Custom cursor dot + lerped glow (shared with the rest of the site).
     The trailing translate keeps the glow centered — a bare translate(x, y)
     would drop the CSS -50%/-50% centering and park it 300px off-cursor. */
  function initCursorGlow() {
    const cursor = document.getElementById('custom-cursor');
    const glow = document.getElementById('cursor-glow');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!finePointer || (!cursor && !glow)) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let gx = mx;
    let gy = my;
    on(document, 'mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (cursor) cursor.style.transform = `translate(${mx}px, ${my}px)`;
      glow?.classList.add('visible');
    });
    on(document, 'mouseleave', () => glow?.classList.remove('visible'));
    if (glow) {
      rafLoop(() => {
        gx += (mx - gx) * 0.1;
        gy += (my - gy) * 0.1;
        glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -50%)`;
      });
    }
  }

  /* Navbar gradient-blur state (.is-scrolled — styled in style.css) */
  function initNavScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    const onScroll = () => navbar.classList.toggle('is-scrolled', window.scrollY > 40);
    on(window, 'scroll', onScroll, { passive: true });
    onScroll();
  }

  function initMobileNav() {
    const toggle = document.getElementById('nav-toggle');
    const panel = document.getElementById('nav-mobile-panel');
    if (!toggle || !panel) return;
    if (toggle.dataset.mobileNavBound === 'true') return;
    toggle.dataset.mobileNavBound = 'true';

    function closeNav() {
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    function openNav() {
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    on(toggle, 'click', () => {
      if (panel.classList.contains('is-open')) closeNav();
      else openNav();
    });

    panel.querySelectorAll('a').forEach((link) => {
      on(link, 'click', closeNav);
    });

    on(document, 'keydown', (event) => {
      if (event.key === 'Escape' && panel.classList.contains('is-open')) closeNav();
    });

    panel.querySelectorAll('.nav-mobile-group-trigger').forEach((trigger) => {
      const sub = trigger.nextElementSibling;
      if (!sub || !sub.classList.contains('nav-mobile-sub')) return;
      if (sub.querySelector('a.nav-link--active')) {
        trigger.classList.add('is-open');
        sub.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
      on(trigger, 'click', () => {
        const open = sub.classList.toggle('is-open');
        trigger.classList.toggle('is-open', open);
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  /* [data-fade] reveal on scroll-into-view (styles in style.css);
     optional data-delay="0.2" staggers the transition */
  function initFade() {
    const faders = document.querySelectorAll('[data-fade]');
    if (!faders.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const delay = parseFloat(entry.target.dataset.delay || 0);
          if (delay) entry.target.style.transitionDelay = `${delay}s`;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
    );
    faders.forEach((el) => obs.observe(el));
    addDisposer(() => obs.disconnect());
  }

  /* ─────────────────────────────────────────────────────────────
     IDLE / PROGRESS SCROLL-HINT — one faint bottom-center "Scroll ⌄"
     per page. Re-appears after ~1s of stillness at each rest point (so
     it keeps signalling "more below" as the reader moves through),
     vanishes instantly on any scroll. Stays hidden while a page's own
     hero scroll-cue is on screen (homepage .hero-scroll-hint OR the
     prominent .de-entry-cue), within ~1 viewport of the page bottom,
     mid section-snap (.de-snapping), and while a modal has stopped
     Lenis. Reduced-motion keeps it static (CSS drops the chevron bounce).
     Injected once; removed on DE.destroy(). Tier 1 (the prominent
     per-hero entry cue) is initEntryCue() below.
     ───────────────────────────────────────────────────────────── */
  function initScrollHint() {
    if (document.querySelector('.de-scroll-hint')) return;   // guard double-inject
    const el = document.createElement('div');
    el.className = 'de-scroll-hint';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="de-scroll-hint__label">Scroll</span><span class="de-scroll-hint__chevron"></span>';
    document.body.appendChild(el);
    addDisposer(() => el.remove());

    const hide = () => el.classList.remove('is-visible');
    const heroCueShown = () => {
      // suppress while a page's OWN hero scroll-cue is on screen — the homepage
      // .hero-scroll-hint OR the prominent .de-entry-cue (Item 7) — so the faint
      // progress hint never doubles a louder hero cue.
      const cue = document.querySelector('.hero-scroll-hint, .de-entry-cue, .s-prehero-cue');
      if (!cue) return false;
      const cs = getComputedStyle(cue);
      const r = cue.getBoundingClientRect();
      return cs.visibility !== 'hidden' && +cs.opacity > 0.05 && r.bottom > 0 && r.top < window.innerHeight;
    };
    const blocked = () => {
      const vh = window.innerHeight;
      const lenis = lifecycle().lenis;
      const atBottom = (vh + window.scrollY) >= (document.documentElement.scrollHeight - vh);
      return atBottom || heroCueShown()
        || document.body.classList.contains('de-snapping')   // mid section-transition
        || !!(lenis && lenis.isStopped);                     // modal open (modals call lenis.stop())
    };

    // ~1s of stillness re-reveals it at each rest point; any scroll hides it.
    let idleMs = 0;
    on(window, 'scroll', () => { idleMs = 0; hide(); }, { passive: true });
    interval(() => {
      if (blocked()) { hide(); return; }
      idleMs += 500;
      if (idleMs >= 1000) el.classList.add('is-visible');
    }, 500);
  }

  /* ─────────────────────────────────────────────────────────────
     ENTRY CUE (Tier 1) — a prominent, per-hero "Scroll to explore"
     that lives INSIDE the hero, so it can sit in the empty vertical
     space some heroes leave (e.g. the features void). Opt-in + sized
     via the hero's data-scroll-entry="prominent|compact" attribute;
     heroes that already fill the viewport simply omit it (and pages
     with their own cue — homepage, sales, marketing — don't opt in,
     so nothing doubles). Reveals on arrival (after the hero copy
     settles), retires the instant the visitor scrolls (its only job
     is "you've arrived — there's more"). Shows on touch too;
     reduced-motion keeps it static. Removed on DE.destroy().
     ───────────────────────────────────────────────────────────── */
  function initEntryCue() {
    const host = document.querySelector('[data-scroll-entry]');
    if (!host || host.querySelector(':scope > .de-entry-cue')) return;   // none / already injected
    const variant = host.dataset.scrollEntry === 'compact' ? 'compact' : 'prominent';
    const cue = document.createElement('div');
    cue.className = 'de-entry-cue de-entry-cue--' + variant;
    cue.setAttribute('aria-hidden', 'true');
    cue.innerHTML = '<span class="de-entry-cue__label">Scroll to explore</span><span class="de-entry-cue__chevron"></span>';
    host.appendChild(cue);

    // reveal after the hero copy has settled
    const reveal = setTimeout(() => cue.classList.add('is-in'), 1300);
    addDisposer(() => { clearTimeout(reveal); cue.remove(); });

    let gone = false;
    const retire = () => {
      if (gone) return;
      gone = true;
      clearTimeout(reveal);
      cue.classList.remove('is-in');
      cue.classList.add('is-gone');
    };
    on(window, 'scroll', () => { if (window.scrollY > 8) retire(); }, { passive: true });
  }

  function initLazyVideoBoatSections(options = {}) {
    const target = document.getElementById('video-section') || document.getElementById('boat-section');
    if (!target) return;

    const src = options.src || 'js/section-video-boat.min.js?v=20260630a';
    const cssHref = options.cssHref || 'css/video-boat.min.css?v=20260702b';
    const rootMargin = options.rootMargin || '1400px 0px';
    let requested = false;
    let observer = null;
    let cssPromise = null;

    function loadCss() {
      if (!cssHref) return Promise.resolve();
      const existing = document.querySelector(`link[href="${cssHref}"]`);
      if (existing) return cssPromise || Promise.resolve();
      cssPromise = new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssHref;
        link.onload = resolve;
        link.onerror = resolve;
        document.head.appendChild(link);
      });
      return cssPromise;
    }

    function run() {
      if (typeof window.initVideoBoatSections !== 'function') return;
      window.initVideoBoatSections();
      if (typeof window.killVideoBoatTriggers === 'function') {
        addDisposer(() => window.killVideoBoatTriggers());
      }
    }

    function load() {
      if (requested) return;
      requested = true;
      observer?.disconnect();
      const readyForLayout = loadCss();
      if (typeof window.initVideoBoatSections === 'function') {
        readyForLayout.then(run);
        return;
      }
      window.__deVideoBoatScript = window.__deVideoBoatScript || new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      Promise.all([readyForLayout, window.__deVideoBoatScript]).then(run).catch(() => {});
    }

    function checkNear() {
      const margin = Number.parseInt(rootMargin, 10) || 1400;
      const rect = target.getBoundingClientRect();
      if (rect.top < window.innerHeight + margin && rect.bottom > -margin) load();
    }

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) load();
      }, { rootMargin });
      observer.observe(target);
      addDisposer(() => observer?.disconnect());
    }

    on(window, 'scroll', checkNear, { passive: true });
    on(window, 'resize', checkNear, { passive: true });
    on(window.matchMedia('(prefers-reduced-motion: reduce)'), 'change', () => {
      if (requested && typeof window.initVideoBoatSections === 'function') window.initVideoBoatSections();
    });
    checkNear();
  }

  let demoModalPromise = null;
  function loadDemoModalScript() {
    if (typeof window.initDemoModal === 'function') return Promise.resolve();
    const src = 'js/demo-modal.min.js?v=20260630a';
    if (!demoModalPromise) {
      demoModalPromise = new Promise((resolve) => {
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
    return demoModalPromise;
  }

  function initLazyDemoModal(lenis) {
    if (typeof window.initDemoModal === 'function') {
      window.initDemoModal(lenis);
      return;
    }

    let initialized = false;
    const init = () => loadDemoModalScript().then(() => {
      if (!initialized && typeof window.initDemoModal === 'function') {
        initialized = true;
        window.initDemoModal(lenis);
      }
    });

    on(document, 'click', (event) => {
      const trigger = event.target.closest?.('.js-modal');
      if (!trigger || initialized) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      init().then(() => trigger.click());
    }, { capture: true });

    on(document, 'pointerover', (event) => {
      if (initialized || !event.target.closest?.('.js-modal')) return;
      init();
    }, { passive: true });

    on(document, 'focusin', (event) => {
      if (initialized || !event.target.closest?.('.js-modal')) return;
      init();
    });
  }

  /* ─────────────────────────────────────────────────────────────
     SNAP-TO-SCENE — once scrolling settles inside a fully-pinned
     section, ease to the nearest scene center so we always rest
     cleanly on one beat. Directional: a push >28% past the current
     scene's center advances to the adjacent scene instead of
     recoiling backward. Desktop + fine-pointer only; disabled on
     Safari and for reduced motion. Attach ONCE per section — never
     inside re-runnable setup code, or duplicate listeners stack up.
     Tuned values verified with headless wheel-event tests — don't
     re-derive them.
     ───────────────────────────────────────────────────────────── */
  function attachSceneSnap(lenis, section, sceneCount) {
    if (!lenis || !section || !sceneCount) return;
    const clampN = (v, min, max) => Math.min(max, Math.max(min, v));
    let snapTimer = 0;
    let snapping = false;
    let lastDir = 0;
    let lastY = window.scrollY;
    // FIRM SNAP: our committed scene within the act (-1 = outside it, no clamp).
    // A momentum flick can carry Lenis 2-3 scenes before it settles; clamping the
    // snap target to ±1 of this collapses the overshoot to a single step — the
    // user lands on the NEXT scene, never skates past one. It is set synchronously
    // to whatever scene each snap targets (so it's correct even while the snap
    // animates, which is what keeps a rapid second flick from overshooting),
    // seeded from the true rest scene on the first wheel/touch after entering the
    // act, and dropped only when we leave the pinned section.
    let anchorScene = -1;
    let touching = false;
    let snapGen = 0;        // bumped on each snap / user-takeover so stale timers can't clear a newer snap
    // isTouch routes the coasting check (touch can't use lenis.velocity); it's the
    // PRIMARY pointer, so a touch laptop driven by its mouse still reads as fine.
    const isTouch = () => window.matchMedia('(pointer: coarse)').matches;
    // gate is pointer-based, NOT width-based: snap on any fine pointer (desktop at
    // any window width, excl. Safari's fighting trackpad momentum). Touch devices
    // are EXCLUDED (reverts the 2026-06-15 "snap on mobile too" experiment): a
    // lenis.scrollTo after every settled flick fights native momentum and reads
    // as scroll-jacking on iPhones — mobile scroll must stay fully native.
    // (In practice touch snap almost never fired anyway — the late-loader refresh
    // loop kept resetting the settle timer — so removing it changes nothing users
    // ever saw; it just prevents the yank from AWAKENING now that the loop is fixed.)
    const canSnapFine = () => !isSafari && window.matchMedia('(pointer: fine)').matches;
    const canSnap = () => !reduceMotion && canSnapFine();
    const isLocked = () => {
      const rect = section.getBoundingClientRect();
      return rect.top <= 2 && rect.bottom >= window.innerHeight - 2;
    };
    const travel = () => Math.max(1, section.offsetHeight - window.innerHeight);
    const sceneAt = () => clampN((window.scrollY - section.offsetTop) / travel(), 0, 0.9999) * sceneCount;
    const restScene = () => Math.floor(sceneAt());
    const sceneCenterY = (n) => Math.round(section.offsetTop + ((n + 0.5) / sceneCount) * travel());
    const setSnapping = (v) => {
      snapping = v;
      // exposed for the idle scroll-hint (Item 4) so it stays hidden mid-transition
      document.body.classList.toggle('de-snapping', v);
    };
    const dropAnchor = () => { anchorScene = -1; };
    function trySnap() {
      snapTimer = 0;
      if (snapping) return;
      if (!canSnap() || !isLocked()) { dropAnchor(); return; }
      // still coasting? wait for a real settle — snapping mid-momentum fights
      // the user. Desktop reads Lenis velocity; on touch smoothTouch is off so
      // velocity is unreliable — instead we only block while a finger is down,
      // since the 150ms requeue already waits out native momentum (scroll
      // events keep firing through the flick, then go silent at rest).
      if (isTouch() ? touching : Math.abs(lenis.velocity || 0) > 0.15) {
        queueSnap();
        return;
      }
      const f = sceneAt();
      let scene = Math.floor(f);
      const frac = f - scene;
      // directional bias: tiny nudges still rest on the current beat, but a
      // real push in the direction of travel hands the user to the next one
      if (lastDir > 0 && frac > 0.78) scene += 1;
      else if (lastDir < 0 && frac < 0.22) scene -= 1;
      // firm-snap clamp: at most one scene from our committed anchor, so a
      // momentum overshoot — even a second flick that starts mid-snap — can't
      // skip a section.
      if (anchorScene >= 0) scene = clampN(scene, anchorScene - 1, anchorScene + 1);
      scene = clampN(scene, 0, sceneCount - 1);
      anchorScene = scene;                 // commit synchronously: this is our rest/destination
      const targetY = sceneCenterY(scene);
      if (Math.abs(window.scrollY - targetY) < 4) return;
      setSnapping(true);
      const gen = ++snapGen;
      lenis.scrollTo(targetY, {
        duration: 0.5,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        onComplete: () => { if (gen === snapGen) setSnapping(false); },
      });
      // safety: clear the guard even if onComplete is pre-empted — gen-tagged so
      // a stale safety timer can't clear a newer snap
      setTimeout(() => { if (gen === snapGen) setSnapping(false); }, 850);
    }
    function queueSnap() {
      // direction from real position deltas — lenis.velocity isn't reliably
      // populated at event-callback time, and deltas can't lie
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 1) lastDir = y > lastY ? 1 : -1;
      lastY = y;
      if (snapping) return;
      if (snapTimer) clearTimeout(snapTimer);
      snapTimer = setTimeout(trySnap, 150);
    }
    // seed the anchor for the FIRST gesture after entering the act: a wheel/
    // touchstart fires before Lenis integrates the delta, so scrollY is still at
    // rest. Once a snap has committed an anchor, that wins (anchorScene<0 guard);
    // the commit is what survives a rapid second flick mid-snap.
    const seedAnchor = () => {
      if (anchorScene < 0 && !snapping && canSnap() && isLocked()) anchorScene = restScene();
    };
    // real user input mid-snap = they're taking over. Release our snap (Lenis
    // cancels the interrupted scrollTo itself) and bump the gen so the old snap's
    // pending timers can't clear the next one. anchorScene (the committed target)
    // stays, so the next flick still clamps ±1 from where we were headed.
    const yieldSnap = () => { if (snapping) { snapGen++; setSnapping(false); } };
    lenis.on('scroll', queueSnap);
    on(window, 'wheel', () => { yieldSnap(); seedAnchor(); }, { passive: true });
    on(window, 'touchstart', () => { touching = true; yieldSnap(); seedAnchor(); }, { passive: true });
    on(window, 'touchend', () => { touching = false; queueSnap(); }, { passive: true });
    on(window, 'touchcancel', () => { touching = false; }, { passive: true });
    addDisposer(() => { clearTimeout(snapTimer); document.body.classList.remove('de-snapping'); });
  }

  /* ─────────────────────────────────────────────────────────────
     ACT CONTROLLER — the scroll-pinned act engine shared by ALL
     act pages (marketing, inventory, analytics, features, sales):
     per-beat data-phase couplets + data-anim dispatch + intro
     scenes.

       DE.initActs(lenis, { anims: BEAT_ANIMS, cleanups: weakMap, fitBeats: true });

     `anims` maps data-anim keys → fn(beatEl, stillCurrent). Every
     anim fn must add .is-playing to its beat as its FIRST statement
     — that class is the replay gate (without it the engine force-
     replays the anim on every scroll update inside the beat).
     `cleanups` is the page's WeakMap of per-beat cleanup fns (the
     page's storeCleanup() writes into it; the controller runs the
     previous beat's cleanup on every transition). `fitBeats` opts
     into the mobile beat-fit pass (≤1100px): an active beat whose
     content overflows the pinned stage is scaled down via
     --de-beat-fit-scale (consumed by de-act.css). Sales uses it.
     Phase: a stage beat's data-phase drives the act's accent
     couplet; beats without one fall back to the act's own static
     data-phase from the HTML (sales), then 'good'. Scene math: one
     scene per .de-act-line (fallback .de-act-beat), +1 when the act
     carries data-act-intro. Heights come from the de-act--N classes
     in css/de-act.css — never hand-write them.
     ───────────────────────────────────────────────────────────── */
  function initActs(lenis, { anims = {}, cleanups = new WeakMap(), fitBeats = false } = {}) {
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const tick = (stillCurrent, fn) => {
      if (typeof stillCurrent === 'function' && !stillCurrent()) return;
      fn();
    };

    const acts = [...document.querySelectorAll('[data-act]')];
    acts.forEach((act) => {
      // "Scene" mode: a leading headline scene (data-act-intro) that shrinks
      // as the first beat arrives, then one big copy line per beat (.de-act-line).
      // Falls back to the classic beat-list (.de-act-beat) when those are absent.
      const hasIntro = act.hasAttribute('data-act-intro');
      const lines = [...act.querySelectorAll('.de-act-line')];
      const copyBeats = lines.length ? lines : [...act.querySelectorAll('.de-act-beat')];
      const stageBeats = [...act.querySelectorAll('.de-beat')];
      const beatCount = Math.min(copyBeats.length || stageBeats.length, stageBeats.length);
      if (!beatCount) return;
      const sceneCount = beatCount + (hasIntro ? 1 : 0);
      // captured before any applyScene mutates it — beats without their own
      // data-phase resolve to the act's static phase from the HTML
      const basePhase = act.dataset.phase || 'good';

      let activeBeat = -1;
      let introActive = false;
      let runToken = 0;
      let entered = false;

      /* Mobile beat-fit (opt-in via fitBeats — ported from sales' old
         controller): scale an overflowing active beat down so the full
         card fits the pinned stage. No-op above 1100px and on pages
         that don't pass fitBeats. */
      const mobileActMedia = window.matchMedia('(max-width: 1100px)');
      function fitActiveBeatToStage() {
        if (!fitBeats) return;
        const beatEl = stageBeats[activeBeat];
        const stageEl = act.querySelector('.de-act-stage-sticky');

        stageBeats.forEach((beat) => beat.style.removeProperty('--de-beat-fit-scale'));
        if (!mobileActMedia.matches || !beatEl || !stageEl) return;

        const children = Array.from(beatEl.children).filter((child) => {
          const childStyle = window.getComputedStyle(child);
          return childStyle.display !== 'none';
        });
        if (!children.length) return;

        const beatStyle = window.getComputedStyle(beatEl);
        const gap = Number.parseFloat(beatStyle.rowGap || beatStyle.gap) || 0;
        const paddingY =
          (Number.parseFloat(beatStyle.paddingTop) || 0) +
          (Number.parseFloat(beatStyle.paddingBottom) || 0);
        const contentHeight = children.reduce((sum, child) => {
          return sum + Math.max(child.scrollHeight, child.getBoundingClientRect().height);
        }, paddingY + gap * Math.max(0, children.length - 1));
        const availableHeight = stageEl.clientHeight;
        if (!contentHeight || !availableHeight) return;

        const bottomBuffer = 22;
        const minScale = 0.6;
        const scale = Math.min(1, Math.max(minScale, (availableHeight - bottomBuffer) / contentHeight));
        beatEl.style.setProperty('--de-beat-fit-scale', scale.toFixed(3));
      }
      function scheduleFitActiveBeat() {
        if (!fitBeats) return;
        requestAnimationFrame(() => {
          fitActiveBeatToStage();
          requestAnimationFrame(fitActiveBeatToStage);
        });
      }
      if (fitBeats) {
        on(window, 'resize', scheduleFitActiveBeat);
        on(mobileActMedia, 'change', scheduleFitActiveBeat);
      }

      const enterObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) entered = true;
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -18% 0px' }
      );
      enterObs.observe(act);
      addDisposer(() => {
        enterObs.disconnect();
        runToken += 1; // go inert: stillCurrent-guarded timer chains bail
        if (scrollRaf) cancelAnimationFrame(scrollRaf);
        const activeEl = stageBeats[activeBeat];
        if (activeEl) cleanups.get(activeEl)?.(); // clear the live beat's timers
      });

      function clearBeats() {
        const prevBeatEl = stageBeats[activeBeat];
        if (prevBeatEl) cleanups.get(prevBeatEl)?.();
        copyBeats.forEach((beat) => beat.classList.remove('is-active'));
        stageBeats.forEach((beat) => {
          beat.classList.remove('is-active', 'is-playing');
          delete beat.dataset.animStarted;
          beat.querySelectorAll('[data-step]').forEach((el) => el.classList.remove('is-in'));
          beat.querySelectorAll('video').forEach((video) => video.pause?.());
          if (fitBeats) beat.style.removeProperty('--de-beat-fit-scale');
        });
        activeBeat = -1;
      }

      function activate(index, options = {}) {
        const { force = false, animate = true } = options;
        const next = clamp(index, 0, beatCount - 1);
        if (next === activeBeat && !force) return;
        const prevBeatEl = stageBeats[activeBeat];
        if (prevBeatEl && activeBeat !== next) {
          cleanups.get(prevBeatEl)?.();
        }
        activeBeat = next;
        runToken += 1;
        const token = runToken;

        copyBeats.forEach((beat, i) => beat.classList.toggle('is-active', i === next));
        stageBeats.forEach((beat, i) => {
          const active = i === next;
          beat.classList.toggle('is-active', active);
          beat.classList.remove('is-playing');
          if (!active) delete beat.dataset.animStarted;
          beat.querySelectorAll('[data-step]').forEach((el) => el.classList.remove('is-in'));
          beat.querySelectorAll('video').forEach((video) => {
            if (active) video.play?.().catch(() => {});
            else video.pause?.();
          });
        });

        // diptych phase: red "pain" beats vs green "fix" beats recolor the
        // left rail + crossfade the act watermark (data-phase on the stage beat;
        // beats without one inherit the act's static phase)
        act.dataset.phase = stageBeats[next]?.dataset.phase || basePhase;

        fitActiveBeatToStage();
        scheduleFitActiveBeat();

        if (!animate) return;

        const beatEl = stageBeats[next];
        playBeatAnimation(beatEl, token);
      }

      function playBeatAnimation(beatEl, token) {
        const anim = anims[beatEl?.dataset.anim];
        if (anim && beatEl?.dataset.animStarted !== 'true' && beatEl?.dataset.animPending !== 'true') {
          beatEl.dataset.animPending = 'true';
          let started = false;
          const play = () => {
            if (started) return;
            tick(() => token === runToken || beatEl.classList.contains('is-active'), () => {
              started = true;
              delete beatEl.dataset.animPending;
              beatEl.dataset.animStarted = 'true';
              anim(beatEl, () => token === runToken || beatEl.classList.contains('is-active'));
              // anims grow beats over several seconds — re-fit as they land
              if (fitBeats && mobileActMedia.matches) {
                [120, 520, 1000, 1800, 2800, 4200, 6200].forEach((delay) => {
                  setTimeout(() => {
                    if (token === runToken) scheduleFitActiveBeat();
                  }, delay);
                });
              }
            });
          };
          requestAnimationFrame(play);
          play();
          setTimeout(play, 80);
        }
      }

      // map a scene index → intro or beat
      function applyScene(scene, options = {}) {
        const s = clamp(scene, 0, sceneCount - 1);
        if (hasIntro && s === 0) {
          if (!introActive || options.force) {
            introActive = true;
            act.classList.remove('is-engaged');
            clearBeats();
            act.dataset.phase = stageBeats[0]?.dataset.phase || basePhase;
          }
          return;
        }
        introActive = false;
        act.classList.add('is-engaged');
        activate(hasIntro ? s - 1 : s, options);
      }

      function isLocked() {
        const rect = act.getBoundingClientRect();
        return rect.top <= 2 && rect.bottom >= window.innerHeight - 2;
      }

      function currentScene() {
        const travel = Math.max(1, act.offsetHeight - window.innerHeight);
        const progress = clamp((window.scrollY - act.offsetTop) / travel, 0, 0.9999);
        return Math.min(sceneCount - 1, Math.floor(progress * sceneCount));
      }

      let scrollRaf = 0;
      function updateLockedBeat() {
        scrollRaf = 0;
        const rect = act.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
          act.classList.remove('is-locked');
          return;
        }
        entered = true;
        const locked = isLocked();
        act.classList.toggle('is-locked', locked);
        if (!locked) return;
        const scene = currentScene();
        const beatIdx = hasIntro ? scene - 1 : scene;
        const beatEl = stageBeats[beatIdx];
        const replay = beatIdx === activeBeat && beatEl?.dataset.animStarted !== 'true' && !(hasIntro && scene === 0);
        applyScene(scene, { force: replay });
        if (beatEl && beatIdx === activeBeat && beatEl.dataset.animStarted !== 'true') {
          playBeatAnimation(beatEl, runToken);
        }
      }

      function queueLockedBeatUpdate() {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(updateLockedBeat);
      }

      applyScene(0, { animate: false, force: true });
      on(window, 'scroll', queueLockedBeatUpdate, { passive: true });
      lenis.on('scroll', queueLockedBeatUpdate);

      ScrollTrigger.create({
        trigger: act,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        invalidateOnRefresh: true,
        onEnter: () => {
          entered = true;
          if (isLocked()) applyScene(currentScene(), { force: true });
        },
        onEnterBack: () => {
          entered = true;
        },
        onUpdate: (self) => {
          if (!entered || !self.isActive || !isLocked()) return;
          updateLockedBeat();
        },
        onLeave: () => act.classList.remove('is-locked'),
        onLeaveBack: () => {
          act.classList.remove('is-locked');
          applyScene(0, { animate: false, force: true });
        },
      });

      // snap-to-scene — shared tuned implementation above
      attachSceneSnap(lenis, act, sceneCount);
    });
  }

  return {
    reduceMotion, isSafari,
    createLenis, loadScrollLibs, prewarm, initCursorGlow, initNavScroll, initMobileNav, initFade, initScrollHint, initEntryCue, initLazyVideoBoatSections, initLazyDemoModal, attachSceneSnap, initActs,
    pages, boot, destroy, on, addDisposer, interval, rafLoop, ready,
  };
})();
