/* ═══════════════════════════════════════════════════════════════
   INVENTORY PAGE - scroll choreography
   ═══════════════════════════════════════════════════════════════
   The act engine is shared (DE.initActs in js/de-core.js); this
   file owns the page's BEAT_ANIMS handlers + the before/after
   scrub slider. Conventions (see CLAUDE.md): every handler resets
   its own state first, guards async steps with stillCurrent, and
   marks the beat is-playing.
   Lifecycle: registered as DE.pages.inventory, booted by the
   DE.boot('inventory') call at the bottom (see js/de-core.js).
   ─────────────────────────────────────────────────────────────── */

DE.pages.inventory = { boot() {
  'use strict';

  const reduceMotion = DE.reduceMotion;

  // shared engine (js/de-core.js): Lenis + cursor glow + nav state + fade
  const lenis = DE.createLenis();

  let deActCssPromise = null;
  function loadDeActCss() {
    const href = 'css/de-act.min.css?v=20260703b';
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

  let inventoryLateContentPromise = null;
  let inventoryLateContentReady = false;
  function loadInventoryLateContent() {
    const root = document.querySelector('[data-inventory-late-root]');
    if (!root) return Promise.resolve();
    if (inventoryLateContentReady || root.dataset.loaded === 'true') return inventoryLateContentPromise || Promise.resolve();
    if (!inventoryLateContentPromise) {
      inventoryLateContentPromise = fetch('partials/inventory-late-content.html?v=20260630a')
        .then((response) => response.ok ? response.text() : '')
        .then((html) => {
          if (!html || root.dataset.loaded === 'true') return;
          root.innerHTML = html;
          root.dataset.loaded = 'true';
          inventoryLateContentReady = true;
          DE.initFade();
          initDeferredInventoryImages();
          initImageCompareCursorRelief();
          DE.initLazyVideoBoatSections();
        })
        .catch(() => {});
    }
    return inventoryLateContentPromise;
  }

  /* One-shot: cached so the debounced per-scroll loader can't re-run the
     trailing ScrollTrigger.refresh() every 850ms forever (refresh's
     pin-revert scrollTo() fires scroll events that re-arm the loader —
     a perpetual refresh loop that dragged mobile WebKit down). */
  let inventoryLateExperiencePromise = null;
  function loadInventoryLateExperience() {
    if (!inventoryLateExperiencePromise) {
      inventoryLateExperiencePromise = Promise.all([loadInventoryLateContent(), loadDeActCss(), loadInventoryLateCss()])
        .then(() => loadInventoryLateJs())
        .then(() => {
          if (window.ScrollTrigger) ScrollTrigger.refresh();
        });
    }
    return inventoryLateExperiencePromise;
  }

  DE.initMobileNav(); // not shipped to the platform (DeHeader owns nav)
  DE.initLazyDemoModal(lenis);
  DE.initCursorGlow();
  DE.initNavScroll();
  DE.initScrollHint();
  DE.initEntryCue();
  DE.initFade();
  initImageCompareCursorRelief();
  initInventoryLateJs();

  let inventoryLateJsPromise = null;
  let inventoryLateInitialized = false;
  function loadInventoryLateJs() {
    const src = 'js/inventory-late.min.js?v=20260630a';
    if (!inventoryLateJsPromise) {
      inventoryLateJsPromise = new Promise((resolve) => {
        const existing = document.querySelector('script[src="' + src + '"]');
        if (existing) {
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', resolve, { once: true });
          return;
        }
        Promise.all([DE.loadScrollLibs(lenis), loadInventoryLateContent()]).then(() => {
          const script = document.createElement('script');
          script.src = src;
          script.defer = true;
          script.onload = resolve;
          script.onerror = resolve;
          document.head.appendChild(script);
        });
      });
    }
    return inventoryLateJsPromise.then(() => {
      if (!inventoryLateInitialized && typeof DE.initInventoryLate === 'function') {
        inventoryLateInitialized = true;
        DE.initInventoryLate(lenis, reduceMotion);
      }
    });
  }

  function initInventoryLateJs() {
    const target = document.querySelector('[data-inventory-late-root]');
    if (!target) return;
    const load = () => loadInventoryLateExperience();

    document.querySelectorAll('a[href="#includes"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        load().then(() => {
          const target = document.getElementById('includes');
          if (!target) return;
          const y = target.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
          lenis.resize?.();
        });
      });
    });

    let requested = false;
    const check = () => {
      if (requested) return;
      const rect = target.getBoundingClientRect();
      if (window.scrollY > 430 && rect.top < window.innerHeight + 450) scheduleLoad();
    };
    let lateLoadTimer = 0;
    function scheduleLoad() {
      if (lateLoadTimer || requested) return;
      lateLoadTimer = setTimeout(() => {
        lateLoadTimer = 0;
        requested = true;
        load();
      }, 850);
    }
    DE.addDisposer(() => clearTimeout(lateLoadTimer));
    DE.on(window, 'scroll', check, { passive: true });
    DE.on(window, 'resize', check, { passive: true });
  }

  let inventoryLateCssPromise = null;
  function initInventoryLateCss() {
    return loadInventoryLateCss();
  }

  function loadInventoryLateCss() {
    const href = 'css/inventory-late.min.css?v=20260703b';
    if (document.querySelector(`link[href="${href}"]`)) return inventoryLateCssPromise || Promise.resolve();
    if (!inventoryLateCssPromise) {
      inventoryLateCssPromise = new Promise((resolve) => {
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
    return inventoryLateCssPromise;
  }

  function initImageCompareCursorRelief() {
    const compares = [...document.querySelectorAll('[data-hero-wipe], [data-ba]')];
    if (!compares.length) return;

    const showImagesCleanly = () => document.body.classList.add('is-image-compare-hover');
    const restoreGlow = () => document.body.classList.remove('is-image-compare-hover');

    compares.forEach((compare) => {
      let hovering = false;
      let dragging = false;

      compare.addEventListener('pointerenter', () => {
        hovering = true;
        showImagesCleanly();
      });
      compare.addEventListener('pointerleave', () => {
        hovering = false;
        if (!dragging) restoreGlow();
      });
      compare.addEventListener('pointerdown', () => {
        dragging = true;
        showImagesCleanly();
      });
      const endDrag = () => {
        dragging = false;
        if (!hovering) restoreGlow();
      };
      DE.on(window, 'pointerup', endDrag);
      DE.on(window, 'pointercancel', endDrag);
    });
  }

  function initDeferredInventoryImages() {
    const deferred = [...document.querySelectorAll('img[data-defer-src]')];
    const deferredBgs = [...document.querySelectorAll('[data-defer-bg]')];
    if (!deferred.length && !deferredBgs.length) return;

    const loadImage = (img) => {
      const src = img.dataset.deferSrc;
      if (!src) return;
      img.src = src;
      img.removeAttribute('data-defer-src');
      img.addEventListener('load', () => {
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }, { once: true });
    };

    const loadBackground = (el) => {
      const src = el.dataset.deferBg;
      if (!src) return;
      el.style.backgroundImage = `url('${src}')`;
      el.removeAttribute('data-defer-bg');
    };

    if (!('IntersectionObserver' in window)) {
      deferred.forEach(loadImage);
      deferredBgs.forEach(loadBackground);
      return;
    }

    const groups = new Map();
    const addToGroup = (el) => {
      const root = el.closest('.de-act, .pillar-nav-section, .boat-section') || el;
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(el);
    };
    deferred.forEach(addToGroup);
    deferredBgs.forEach(addToGroup);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        (groups.get(entry.target) || [entry.target]).forEach((el) => {
          if (el.matches('img[data-defer-src]')) loadImage(el);
          else if (el.matches('[data-defer-bg]')) loadBackground(el);
        });
      });
    }, { rootMargin: '900px 0px' });

    groups.forEach((_, root) => observer.observe(root));
  }


} };

DE.boot('inventory');
