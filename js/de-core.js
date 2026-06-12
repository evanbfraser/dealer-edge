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
  function boot(key) {
    const page = pages[key];
    if (!page) return;
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

  /* Lenis smooth scroll + GSAP/ScrollTrigger wiring (canonical options) */
  function createLenis(options = {}) {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      ...options,
    });
    lifecycle().lenis = lenis;
    rafLoop((time) => lenis.raf(time));

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ limitCallbacks: true });
    lenis.on('scroll', ScrollTrigger.update);
    const tickerCb = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerCb);
    addDisposer(() => gsap.ticker.remove(tickerCb));
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
    addDisposer(() => clearTimeout(snapTimer));
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
        const anim = anims[beatEl?.dataset.anim];
        if (anim) {
          requestAnimationFrame(() => {
            tick(() => token === runToken, () => {
              anim(beatEl, () => token === runToken);
              // anims grow beats over several seconds — re-fit as they land
              if (fitBeats && mobileActMedia.matches) {
                [120, 520, 1000, 1800, 2800, 4200, 6200].forEach((delay) => {
                  setTimeout(() => {
                    if (token === runToken) scheduleFitActiveBeat();
                  }, delay);
                });
              }
            });
          });
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
        const replay = beatIdx === activeBeat && !beatEl?.classList.contains('is-playing') && !(hasIntro && scene === 0);
        applyScene(scene, { force: replay });
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
    createLenis, initCursorGlow, initNavScroll, initFade, attachSceneSnap, initActs,
    pages, boot, destroy, on, interval, rafLoop, ready,
  };
})();
