/* ═══════════════════════════════════════════════════════════════
   HOMEPAGE (index.html) — Evan's original POC, ported onto the
   DE.boot/DE.destroy lifecycle (js/de-core.js) so the platform
   island host can mount/unmount it cleanly. On the static site
   nothing changes: DE.boot('index') at the bottom runs it exactly
   as the old DOMContentLoaded IIFE did. Long-lived window/document
   listeners, rAF self-loops and intervals go through DE.on /
   DE.rafLoop / DE.interval so DE.destroy() can tear them down.
   ═══════════════════════════════════════════════════════════════ */
DE.pages.index = (function () {
  function boot() {
    'use strict';

    function runWhenNear(selector, fn, rootMargin = '1200px 0px') {
      const el = document.querySelector(selector);
      if (!el) return;
      const margin = parseInt(rootMargin, 10) || 0;
      let didRun = false;
      let observer = null;

      const run = () => {
        if (didRun) return;
        didRun = true;
        if (observer) observer.disconnect();
        fn();
      };

      const check = () => {
        if (didRun) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + margin && rect.bottom > -margin) run();
      };

      if (!('IntersectionObserver' in window)) {
        DE.on(window, 'scroll', check, { passive: true });
        DE.on(window, 'resize', check, { passive: true });
        check();
        return;
      }

      observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        run();
      }, { rootMargin });

      observer.observe(el);
      DE.on(window, 'scroll', check, { passive: true });
      DE.on(window, 'resize', check, { passive: true });
      check();
    }

    let homeLateCssPromise = null;
    function loadHomeLateCss() {
      const href = 'css/home-late.min.css?v=20260630a';
      if (document.querySelector(`link[href="${href}"]`)) {
        return homeLateCssPromise || Promise.resolve();
      }
      if (!homeLateCssPromise) {
        homeLateCssPromise = new Promise((resolve) => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = href;
          link.onload = () => {
            if (window.ScrollTrigger) ScrollTrigger.refresh();
            resolve();
          };
          link.onerror = resolve;
          document.head.appendChild(link);
        });
      }
      return homeLateCssPromise;
    }

    function initHomeLateCss() {
      const load = () => loadHomeLateCss();

      ['wheel', 'touchmove', 'keydown'].forEach((eventName) => {
        window.addEventListener(eventName, load, { once: true, passive: true });
      });

      if (document.readyState === 'complete') {
        setTimeout(load, 2200);
      } else {
        window.addEventListener('load', () => setTimeout(load, 2200), { once: true });
      }
    }

    let homeLateJsPromise = null;
    let homeLateInitialized = false;
    function loadHomeLateJs() {
      const src = 'js/app-late.min.js?v=20260630a';
      if (!homeLateJsPromise) {
        homeLateJsPromise = DE.loadScrollLibs(lenis).then(() => new Promise((resolve) => {
          const existing = document.querySelector('script[src="' + src + '"]');
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
      return homeLateJsPromise.then(() => {
        if (!homeLateInitialized && typeof DE.initHomeLate === 'function') {
          homeLateInitialized = true;
          DE.initHomeLate({ lenis, runWhenNear, loadHomeLateCss });
        }
      });
    }

    function initHomeLateJs() {
      const load = () => loadHomeLateJs();
      runWhenNear('.journey-section', load, '0px 0px');
      const chatTrigger = document.getElementById('chatbot-trigger');
      if (chatTrigger) chatTrigger.addEventListener('pointerenter', load, { once: true, passive: true });
      if (chatTrigger) chatTrigger.addEventListener('focus', load, { once: true });
      if (chatTrigger) {
        chatTrigger.addEventListener('click', (event) => {
          if (homeLateInitialized) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          load().then(() => chatTrigger.click());
        }, { once: true });
      }
    }

    // ─── CURSOR GLOW (red ambient) + white-dot cursor ───
    (function initCursorGlowHome() {
      const glow = document.getElementById('cursor-glow');
      const cursor = document.getElementById('custom-cursor');
      if (!glow && !cursor) return;

      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;
      let currentX = mouseX;
      let currentY = mouseY;

      DE.on(window, 'mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        // Drive the white-dot cursor from page load. The native cursor is hidden
        // globally (cursor: none), and the dot's follow logic otherwise lives in
        // js/app-late.js, which doesn't load until the journey section scrolls
        // into view — so above the fold the homepage had no visible cursor. Use
        // left/top to match app-late.js (both set the same values, so once the
        // late handler also binds there's no double-offset).
        if (cursor) {
          cursor.style.left = e.clientX + 'px';
          cursor.style.top = e.clientY + 'px';
        }
        if (glow) glow.classList.add('visible');
      }, { passive: true });

      DE.on(window, 'mouseleave', () => glow?.classList.remove('visible'));

      if (glow) {
        DE.rafLoop(() => {
          currentX += (mouseX - currentX) * 0.1;
          currentY += (mouseY - currentY) * 0.1;
          glow.style.transform = `translate(${currentX - 300}px, ${currentY - 300}px)`;
        });
      }
    }());

    // ─── LENIS SMOOTH SCROLL (shared engine: GSAP/ScrollTrigger sync + teardown) ───
    const lenis = DE.createLenis({ lerp: 0.085, smoothWheel: true });

    // ─── NAVBAR SCROLL STATE ───
    const navbar = document.getElementById('navbar');
    if (navbar) {
      const onNavScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
      DE.on(window, 'scroll', onNavScroll, { passive: true });
      onNavScroll();
    }

// ─── HERO ENTRANCE ANIMATION ───
function animateHero() {
  // Show the hero copy immediately — no entrance fade. The old dark→light
  // reveal read as a slow page load (and could stall on the platform); the
  // hero visual appears at once, so the copy should match. `.hero-content` is
  // now visible by default in style.css; this guards against stale CSS and
  // clears any leftover transform from a prior run.
  const content = document.getElementById('hero-content');
  if (!content) return;
  content.style.opacity = '1';
  [
    content.querySelector('.hero-eyebrow'),
    content.querySelector('.hero-headline'),
    content.querySelector('.hero-sub'),
    content.querySelector('.hero-actions'),
  ].filter(Boolean).forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = '';
  });
}

// ─── SECTION ENTRANCE ANIMATIONS ───
function animateSections() {
  const items = Array.from(document.querySelectorAll('[data-animation]'));
  if (!items.length) return;

  const reveal = (el) => {
    const delay = parseFloat(el.getAttribute('data-delay') || '0');
    if (delay) el.style.transitionDelay = `${delay}s`;
    el.classList.add('is-visible');
  };

  if (!('IntersectionObserver' in window)) {
    items.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

  items.forEach((el) => observer.observe(el));
  DE.addDisposer(() => observer.disconnect());
}

// ─── COUNTER ANIMATIONS ───
function animateCounters() {
  const counters = Array.from(document.querySelectorAll('.stat-number'));
  if (!counters.length) return;

  const startCounter = (el) => {
    if (el.dataset.counted === 'true') return;
    el.dataset.counted = 'true';
    const end = parseInt(el.getAttribute('data-count'), 10);
    if (!Number.isFinite(end)) return;
    const duration = 1800;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.floor(end * eased);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = end;
    };
    requestAnimationFrame(tick);
  };

  if (!('IntersectionObserver' in window)) {
    counters.forEach(startCounter);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      startCounter(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -10% 0px' });

  counters.forEach((el) => observer.observe(el));
  DE.addDisposer(() => observer.disconnect());
}

// ─── CANVAS FRAME SCRUBBING ───
const canvas = document.getElementById('hero-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const FRAME_COUNT = 192;
const IMAGE_SCALE = 1.32;
const images = [];
const frameLoadPromises = [];
const loadedFrames = new Set();
let loaded = 0;
let currentFrame = 1;

function loadFrame(i) {
  if (images[i - 1]) return frameLoadPromises[i - 1] || Promise.resolve(images[i - 1]);
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.src = `assets/frames/frame_${String(i).padStart(4, '0')}.webp`;
    img.onload = () => {
      loaded++;
      loadedFrames.add(i);
      // First frame ready: paint now, then repaint a few times over ~2s. The
      // React island host regenerates this subtree shortly after hydration
      // (swapping #hero-canvas); repainting the freshly re-queried node a few
      // times outlasts that swap, so the hero isn't left blank when the user
      // hasn't scrolled. On the static site there's no swap — harmless.
      if (loaded === 1) {
        // Paint, then keep retrying until a draw actually STICKS (the live
        // canvas ends up sized, not the 300x150 default). The React island host
        // swaps #hero-canvas ~1s after hydration, and we can't predict exactly
        // when the replacement node is mounted AND its container is laid out AND
        // frame 1 has loaded — so poll until drawFrame succeeds (or stop ~6s).
        let tries = 30;
        const iv = setInterval(() => {
          drawFrame(currentFrame);
          const c = document.getElementById('hero-canvas');
          if ((c && c.width > 300) || --tries <= 0) clearInterval(iv);
        }, 200);
      }
      resolve(img);
    };
    img.onerror = () => resolve(img);
    images[i - 1] = img;
  });
  frameLoadPromises[i - 1] = promise;
  return promise;
}

function preloadFrames() {
  loadFrame(1);
  const preloadRest = () => {
    for (let i = 2; i <= FRAME_COUNT; i++) {
      setTimeout(() => loadFrame(i), (i - 2) * 18);
    }
  };
  const schedule = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  DE.on(window, 'load', () => {
    setTimeout(() => schedule(preloadRest, { timeout: 2400 }), 1200);
  }, { once: true, passive: true });
}

function getNearestLoadedFrame(idx) {
  if (loadedFrames.has(idx)) return idx;
  loadFrame(idx);
  for (let distance = 1; distance < FRAME_COUNT; distance++) {
    const prev = idx - distance;
    const next = idx + distance;
    if (prev >= 1 && loadedFrames.has(prev)) return prev;
    if (next <= FRAME_COUNT && loadedFrames.has(next)) return next;
  }
  return 1;
}

function drawFrame(idx) {
  // Re-acquire the live node each draw. On the platform, the React island host
  // regenerates this subtree shortly after hydration, swapping in a fresh
  // #hero-canvas — the module-level ref captured at load would be orphaned, so
  // we'd paint a detached node and the visible hero would stay blank.
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  if (!canvas || !ctx) return;
  const frameIdx = getNearestLoadedFrame(idx);
  const img = images[frameIdx - 1];
  if (!img || !img.complete || img.naturalWidth === 0) return;

  // Size canvas to its container (the right panel), not the full window
  const container = canvas.parentElement;
  const w = (canvas.width = container ? container.offsetWidth : window.innerWidth);
  const h = (canvas.height = container ? container.offsetHeight : window.innerHeight);
  const scale = Math.min(w / img.width, h / img.height) * IMAGE_SCALE;
  const iw = img.width * scale;
  const ih = img.height * scale;

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
  currentFrame = idx;
}

function bindScrollToFrames() {
  if (!canvas) return;

  // Cross-fade reveal (desktop + mobile): the hero is pinned (sticky at all
  // widths — see style.css) while the Features section rises in FRONT of it
  // (transparent bg, higher z-index). The copy clears and the visual fades to
  // transparent, so it dissipates behind the incoming Features copy. Because the
  // pinned hero's own rect is frozen at top:0, drive progress off window.scrollY.
  const desktopMq = window.matchMedia('(min-width: 769px)');
  let ticking = false;

  DE.on(window, 'scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const hero = document.getElementById('hero');
        if (!hero) { ticking = false; return; }

        const vh = window.innerHeight;
        const desktop = desktopMq.matches;
        const scrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);

        const heroLeft = hero.querySelector('.hero-left');
        const heroRight = hero.querySelector('.hero-right');

        // Copy bounce — SAME ease + bounce on desktop AND mobile (mobile is a
        // first-class citizen: ~7x the traffic, social-ad visitors land here
        // first). A half-sine dip (down, then back up) over a slow-start cubic
        // exit, so the copy/CTAs sink ~32px, spring, then launch up and out. The
        // easing sells the bounce.
        if (heroLeft) {
          const t = Math.min(1, scrollY / (vh * 0.6));
          const dip = 42 * Math.sin(Math.PI * Math.min(t / 0.45, 1));
          const exit = vh * 0.95 * (t * t * t);
          heroLeft.style.transform = `translateY(${(dip - exit).toFixed(1)}px)`;
          if (heroLeft.style.opacity) heroLeft.style.opacity = '';
        }

        // Visual dissipates to transparent — from full on desktop, from its 0.45
        // backdrop baseline on mobile.
        if (heroRight) {
          const fade = 1 - Math.min(1, Math.max(0, (scrollY - vh * 0.35) / (vh * 0.55)));
          heroRight.style.opacity = ((desktop ? 1 : 0.45) * fade).toFixed(3);
        }

        // Hidden once gone so the sticky layer can't paint over lower sections.
        const want = scrollY >= vh * 0.95 ? 'hidden' : '';
        if (hero.style.visibility !== want) hero.style.visibility = want;

        // Frame scrub spread over ~0.9vh (desktop) / 0.62vh (mobile) so the
        // animation plays across the cross-fade instead of finishing early.
        const maxScroll = vh * (desktop ? 0.9 : 0.62);
        const progress = Math.min(1, scrollY / maxScroll);
        const frameIdx = Math.min(FRAME_COUNT, Math.max(1, Math.round(progress * (FRAME_COUNT - 1)) + 1));

        if (frameIdx !== currentFrame) drawFrame(frameIdx);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

    // ─── INIT ───
    initHomeLateCss();
    animateHero();
    animateSections();
    animateCounters();
    initHomeLateJs();
    DE.initLazyDemoModal(lenis);
    DE.initMobileNav(); // not shipped to the platform (DeHeader owns nav)
    preloadFrames();
    bindScrollToFrames();
    DE.initScrollHint();
    DE.initEntryCue();
    DE.on(window, 'resize', () => drawFrame(currentFrame), { passive: true });
    DE.on(window, 'load', () => drawFrame(currentFrame || 1), { once: true, passive: true });
  }

  return { boot };
})();

DE.boot('index');
