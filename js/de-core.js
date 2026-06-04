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
   ─────────────────────────────────────────────────────────────── */
window.DE = (() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Safari's trackpad momentum keeps emitting scroll events long after the
  // fingers lift, which re-triggers the settle timer and makes snap-to-scene
  // fight the user ("stick, then zoom past"). Leave Safari un-snapped.
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  /* Lenis smooth scroll + GSAP/ScrollTrigger wiring (canonical options) */
  function createLenis(options = {}) {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      ...options,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ limitCallbacks: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
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
    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (cursor) cursor.style.transform = `translate(${mx}px, ${my}px)`;
      glow?.classList.add('visible');
    });
    document.addEventListener('mouseleave', () => glow?.classList.remove('visible'));
    if (glow) {
      (function follow() {
        gx += (mx - gx) * 0.1;
        gy += (my - gy) * 0.1;
        glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -50%)`;
        requestAnimationFrame(follow);
      })();
    }
  }

  /* Navbar gradient-blur state (.is-scrolled — styled in style.css) */
  function initNavScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    const onScroll = () => navbar.classList.toggle('is-scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
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
    const canSnap = () =>
      !reduceMotion && !isSafari && window.matchMedia('(min-width: 1101px) and (pointer: fine)').matches;
    const isLocked = () => {
      const rect = section.getBoundingClientRect();
      return rect.top <= 2 && rect.bottom >= window.innerHeight - 2;
    };
    function trySnap() {
      snapTimer = 0;
      if (snapping || !canSnap() || !isLocked()) return;
      // still coasting (wheel/trackpad momentum)? wait for a real settle —
      // snapping mid-momentum fights the user's scroll.
      if (Math.abs(lenis.velocity || 0) > 0.1) {
        queueSnap();
        return;
      }
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      const f = clampN((window.scrollY - section.offsetTop) / travel, 0, 0.9999) * sceneCount;
      let scene = Math.floor(f);
      const frac = f - scene;
      // directional bias: tiny nudges still rest on the current beat, but a
      // real push in the direction of travel hands the user to the next one
      if (lastDir > 0 && frac > 0.78) scene += 1;
      else if (lastDir < 0 && frac < 0.22) scene -= 1;
      scene = clampN(scene, 0, sceneCount - 1);
      const targetY = Math.round(section.offsetTop + ((scene + 0.5) / sceneCount) * travel);
      if (Math.abs(window.scrollY - targetY) < 4) return;
      snapping = true;
      lenis.scrollTo(targetY, {
        duration: 0.5,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        onComplete: () => { snapping = false; },
      });
      // safety: clear the guard even if onComplete is pre-empted by user input
      setTimeout(() => { snapping = false; }, 850);
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
    lenis.on('scroll', queueSnap);
  }

  return { reduceMotion, isSafari, createLenis, initCursorGlow, initNavScroll, initFade, attachSceneSnap };
})();
