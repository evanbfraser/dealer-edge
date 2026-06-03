/* ═══════════════════════════════════════════════════════════════
   MARKETING PAGE - scroll choreography
   ═══════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
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

  initMobileNav();
  initDemoModal(lenis);
  initCursor();
  initFade();
  initShowcase();
  initHero();
  initActs();

  function initCursor() {
    const cursor = document.getElementById('custom-cursor');
    const glow = document.getElementById('cursor-glow');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!finePointer || (!cursor && !glow)) return;

    document.addEventListener('mousemove', (e) => {
      if (cursor) cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      if (glow) {
        glow.classList.add('visible');
        glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    });
    document.addEventListener('mouseleave', () => glow?.classList.remove('visible'));
  }

  function initFade() {
    const faders = document.querySelectorAll('[data-fade]');
    if (!faders.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
    );
    faders.forEach((el) => obs.observe(el));
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
    'site-demo': playSequential,
    'site-inventory': playSequential,
    'site-seo': playSequential,
    'site-capture': playSequential,
    'dam-proof': playSequential,
    'dam-channels': playSequential,
    'dam-calendar': playSequential,
    'dam-article': playSequential,
    'hub-goals': playSequential,
    'hub-teams': playSequential,
    'hub-funnel': playSequential,
    'hub-reviews': playSequential,
    'hub-handoff': playSequential,
    'op-rot': playSequential,
    'geo-answer': playSequential,
  };

  function initActs() {
    const acts = [...document.querySelectorAll('[data-act]')];
    acts.forEach((act) => {
      // New "scene" mode: a leading headline scene (data-act-intro) that shrinks
      // as the first beat arrives, then one big copy line per beat (.m-act-line).
      // Falls back to the classic beat-list (.m-act-beat) when those are absent.
      const hasIntro = act.hasAttribute('data-act-intro');
      const lines = [...act.querySelectorAll('.m-act-line')];
      const copyBeats = lines.length ? lines : [...act.querySelectorAll('.m-act-beat')];
      const stageBeats = [...act.querySelectorAll('.m-beat')];
      const beatCount = Math.min(copyBeats.length || stageBeats.length, stageBeats.length);
      if (!beatCount) return;
      const sceneCount = beatCount + (hasIntro ? 1 : 0);

      let activeBeat = -1;
      let introActive = false;
      let runToken = 0;
      let entered = false;

      const enterObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) entered = true;
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -18% 0px' }
      );
      enterObs.observe(act);

      function clearBeats() {
        const prevBeatEl = stageBeats[activeBeat];
        if (prevBeatEl) oldAnimCleanups.get(prevBeatEl)?.();
        copyBeats.forEach((beat) => beat.classList.remove('is-active'));
        stageBeats.forEach((beat) => {
          beat.classList.remove('is-active', 'is-playing');
          beat.querySelectorAll('[data-step]').forEach((el) => el.classList.remove('is-in'));
          beat.querySelectorAll('video').forEach((video) => video.pause?.());
        });
        activeBeat = -1;
      }

      function activate(index, options = {}) {
        const { force = false, animate = true } = options;
        const next = clamp(index, 0, beatCount - 1);
        if (next === activeBeat && !force) return;
        const prevBeatEl = stageBeats[activeBeat];
        if (prevBeatEl && activeBeat !== next) {
          oldAnimCleanups.get(prevBeatEl)?.();
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
        // left rail + crossfade the act watermark (data-phase on the stage beat)
        act.dataset.phase = stageBeats[next]?.dataset.phase || 'good';

        if (!animate) return;

        const beatEl = stageBeats[next];
        const anim = BEAT_ANIMS[beatEl?.dataset.anim];
        if (anim) {
          requestAnimationFrame(() => {
            tick(() => token === runToken, () => anim(beatEl, () => token === runToken));
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
            act.dataset.phase = stageBeats[0]?.dataset.phase || 'good';
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
      window.addEventListener('scroll', queueLockedBeatUpdate, { passive: true });
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
    });
  }

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

  function playOldQueue(beatEl, stillCurrent) {
    beatEl.classList.add('is-playing');
    const listing = beatEl.querySelector('[data-old-listing]');
    const updated = beatEl.querySelector('[data-old-updated]');
    const staleBuyer = beatEl.querySelector('[data-old-stale-buyer]');
    const tickets = [...beatEl.querySelectorAll('[data-old-ticket]')];
    const timeouts = [];

    listing?.classList.remove('is-stale');
    updated?.classList.remove('is-red');
    staleBuyer?.classList.remove('is-in', 'is-out');
    tickets.forEach((t) => t.classList.remove('is-in', 'is-stamped'));

    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));

    add(reduceMotion ? 40 : 280, () => updated?.classList.add('is-red'));
    add(reduceMotion ? 80 : 520, () => listing?.classList.add('is-stale'));
    add(reduceMotion ? 120 : 780, () => staleBuyer?.classList.add('is-in'));
    add(reduceMotion ? 220 : 1400, () => {
      staleBuyer?.classList.remove('is-in');
      staleBuyer?.classList.add('is-out');
    });

    tickets.forEach((ticket, i) => {
      add((reduceMotion ? 160 : 900) + i * (reduceMotion ? 70 : 320), () => {
        ticket.classList.add('is-in');
        ticket.classList.add('is-stamped');
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
    const fields = [...beatEl.querySelectorAll('[data-old-field]')];
    const errors = [...beatEl.querySelectorAll('[data-old-error]')];
    const submit = beatEl.querySelector('[data-old-submit]');
    const lost = [...beatEl.querySelectorAll('[data-old-lost-chip]')];
    const timeouts = [];

    packet?.classList.remove('is-in', 'is-press');
    fields.forEach((el) => el.classList.remove('is-in', 'is-error'));
    submit?.classList.remove('is-shake');
    lost.forEach((el) => el.classList.remove('is-out'));

    const add = (ms, fn) => timeouts.push(schedule(stillCurrent, ms, fn));
    const step = reduceMotion ? 50 : 140;

    add(reduceMotion ? 30 : 200, () => packet?.classList.add('is-in'));
    fields.forEach((field, i) => add(reduceMotion ? 80 : 420 + i * step, () => field.classList.add('is-in')));

    const submitAt = reduceMotion ? 280 : 1100;
    add(submitAt, () => {
      packet?.classList.add('is-press');
      errors.forEach((el) => el.classList.add('is-error'));
      submit?.classList.add('is-shake');
      timeouts.push(schedule(stillCurrent, 420, () => submit?.classList.remove('is-shake')));
      packet?.classList.remove('is-in');
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
})();
