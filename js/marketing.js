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

  function initHero() {
    const hero = document.querySelector('[data-marketing-hero]');
    if (!hero) return;

    const slides = [...hero.querySelectorAll('[data-hero-stage]')];
    const metrics = [...hero.querySelectorAll('[data-proof-stage]')];
    let active = -1;

    function setStage(index) {
      const next = clamp(index, 0, slides.length - 1);
      if (next === active) return;
      active = next;
      hero.dataset.activeStage = String(next + 1);
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === next));
      metrics.forEach((metric, i) => metric.classList.toggle('is-active', i === next));
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
  };

  function initActs() {
    const acts = [...document.querySelectorAll('[data-act]')];
    acts.forEach((act) => {
      const copyBeats = [...act.querySelectorAll('.m-act-beat')];
      const stageBeats = [...act.querySelectorAll('.m-beat')];
      const beatCount = Math.min(copyBeats.length, stageBeats.length);
      if (!beatCount) return;

      let activeBeat = -1;
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

        if (!animate) return;

        const beatEl = stageBeats[next];
        const anim = BEAT_ANIMS[beatEl?.dataset.anim];
        if (anim) {
          requestAnimationFrame(() => {
            tick(() => token === runToken, () => anim(beatEl, () => token === runToken));
          });
        }
      }

      function isLocked() {
        const rect = act.getBoundingClientRect();
        return rect.top <= 2 && rect.bottom >= window.innerHeight - 2;
      }

      function currentBeatIndex() {
        const travel = Math.max(1, act.offsetHeight - window.innerHeight);
        const progress = clamp((window.scrollY - act.offsetTop) / travel, 0, 0.9999);
        return Math.min(beatCount - 1, Math.floor(progress * beatCount));
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
        const next = currentBeatIndex();
        const beatEl = stageBeats[next];
        activate(next, { force: next === activeBeat && !beatEl?.classList.contains('is-playing') });
      }

      function queueLockedBeatUpdate() {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(updateLockedBeat);
      }

      activate(0, { animate: false, force: true });
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
          if (isLocked()) activate(0, { force: true });
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
          activate(0, { animate: false, force: true });
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
