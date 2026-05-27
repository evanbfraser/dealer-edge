/* ═══════════════════════════════════════════════════════════════
   SALES PAGE  —  scroll choreography + interactive SMS demo
   ═══════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     LENIS smooth scroll + GSAP / ScrollTrigger init
     ───────────────────────────────────────────────────────────── */
  const lenis = new Lenis({
    duration: 1.15,
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
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ─────────────────────────────────────────────────────────────
     CUSTOM CURSOR + GLOW (shared with rest of site)
     ───────────────────────────────────────────────────────────── */
  const cursor = document.getElementById('custom-cursor');
  const glow = document.getElementById('cursor-glow');
  let cx = window.innerWidth / 2,
    cy = window.innerHeight / 2,
    tx = cx,
    ty = cy;
  document.addEventListener('mousemove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
    if (cursor) cursor.style.transform = `translate(${tx}px, ${ty}px)`;
    if (glow) {
      glow.classList.add('visible');
      glow.style.transform = `translate(${tx}px, ${ty}px)`;
    }
  });
  document.addEventListener('mouseleave', () => glow && glow.classList.remove('visible'));

  /* ─────────────────────────────────────────────────────────────
     CONTACT MODAL — minimal opener so the CTA buttons work
     ───────────────────────────────────────────────────────────── */
  document.querySelectorAll('.js-modal').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'index.html#contact';
    });
  });

  const marineModal = document.querySelector('[data-marine-modal]');
  const marineOpen = document.querySelector('[data-marine-modal-open]');
  const marineClose = document.querySelector('[data-marine-modal-close]');
  if (marineModal && marineOpen) {
    marineOpen.addEventListener('click', () => {
      if (typeof marineModal.showModal === 'function') marineModal.showModal();
      else marineModal.setAttribute('open', '');
    });
    marineClose?.addEventListener('click', () => marineModal.close());
    marineModal.addEventListener('click', (e) => {
      if (e.target === marineModal) marineModal.close();
    });
  }

  /* ─────────────────────────────────────────────────────────────
     [data-fade] reveal on scroll-into-view
     ───────────────────────────────────────────────────────────── */
  const faders = document.querySelectorAll('[data-fade]');
  const faderObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = parseFloat(entry.target.dataset.delay || 0);
          entry.target.style.transitionDelay = `${delay}s`;
          entry.target.classList.add('is-visible');
          faderObs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
  );
  faders.forEach((el) => faderObs.observe(el));

  /* ═════════════════════════════════════════════════════════════
     HERO + STATS  —  one pinned 6-beat prospect-launch experience
     Hero stat + headline swap per beat; prospects collide with h1.
     ═════════════════════════════════════════════════════════════ */

  const statsSection = document.querySelector('[data-stats-section]');
  if (statsSection) initStatsSection(statsSection);

  function initStatsSection(section) {
    const subSlides = section.querySelectorAll('.s-hero-sub-slides [data-slide]');
    const heroInner = section.querySelector('.s-hero-inner--pinned');
    const sceneStage = section.querySelector('[data-scene-stage]');
    const beatWall = section.querySelector('[data-beat-wall]');
    const wallHeadline = section.querySelector('[data-wall-headline]');
    const heroStatEl = section.querySelector('[data-hero-stat]');
    const heroHeadlineBody = section.querySelector('[data-hero-headline-body]');
    const prospectLane = section.querySelector('[data-prospect-lane]');
    const convertZone = section.querySelector('[data-convert-zone]');
    const gaveUpZone = section.querySelector('[data-gave-up-zone]');
    const barStackPassed = section.querySelector('[data-bar-stack-passed]');
    const barStackLost = section.querySelector('[data-bar-stack-lost]');
    const barFramePassed = section.querySelector('[data-bar-frame-passed]');
    const barFrameLost = section.querySelector('[data-bar-frame-lost]');
    const zoneCountEl = section.querySelector('[data-zone-count]');
    const sceneLostEl = section.querySelector('[data-scene-lost]');
    const fxLayer = section.querySelector('[data-fx-layer]');
    const sceneNext = section.querySelector('[data-scene-next]');
    const sceneContextEl = section.querySelector('[data-scene-context]');
    const zoneLabelGoodEl = section.querySelector('[data-zone-label-good]');
    const zoneLabelBadEl = section.querySelector('[data-zone-label-bad]');
    const barCaptionGoodEl = section.querySelector('[data-bar-caption-good]');
    const barCaptionBadEl = section.querySelector('[data-bar-caption-bad]');
    const sceneScaleEl = section.querySelector('[data-scene-scale]');

    const TOTAL_BEATS = 6;
    const VISUAL_COUNT = 15;
    const LAUNCH_STAGGER_MS = 180;

    const BEAT_SCENES = [
      {
        beat: 1,
        statNum: '78',
        statSuffix: '%',
        statFix: false,
        headlineHtml: 'of buyers go with whoever<br><span class="s-headline-strike">answers first.</span> <span class="s-headline-accent">answers.</span>',
        passIndices: [1, 7, 12],
        wallMode: 'strike',
        contextLabel: 'Buyers choosing who answered',
        passLabel: 'Reached you',
        failLabel: 'Went elsewhere',
        passCaption: 'Reached you',
        failCaption: 'Went elsewhere',
        scaleLabel: '15 dots visualize buyers choosing whoever answered first.',
      },
      {
        beat: 2,
        statNum: '-7',
        statSuffix: '%',
        statFix: false,
        headlineHtml: 'per second over 3s your site takes to load.',
        passIndices: [0, 6, 13],
        wallMode: 'solid',
        contextLabel: 'Visitors waiting on your site',
        passLabel: 'Still here',
        failLabel: 'Bounced',
        passCaption: 'Still here',
        failCaption: 'Bounced',
        scaleLabel: '15 dots visualize how slow load time bleeds site visitors away.',
      },
      {
        beat: 3,
        statNum: '57',
        statSuffix: '%',
        statFix: false,
        headlineHtml: 'never get a response in 24 hours.',
        passIndices: [0, 2, 5, 8, 11, 13],
        wallMode: 'solid',
        contextLabel: 'Leads still waiting after 24 hours',
        passLabel: 'Got a reply',
        failLabel: 'Still waiting',
        passCaption: 'Got a reply',
        failCaption: 'Still waiting',
        scaleLabel: '15 dots visualize the inbox split once the first 24 hours are gone.',
      },
      {
        beat: 4,
        statNum: '80',
        statSuffix: '%',
        statFix: false,
        headlineHtml: 'of callers who hit voicemail hang up and never call back.',
        passIndices: [2, 9, 14],
        wallMode: 'solid',
        contextLabel: 'Callers who hit voicemail',
        passLabel: 'Stayed on',
        failLabel: 'Hung up',
        passCaption: 'Stayed on',
        failCaption: 'Hung up',
        scaleLabel: '15 dots visualize callers who stay engaged vs callers who vanish.',
      },
      {
        beat: 5,
        statNum: '19',
        statSuffix: '',
        statFix: false,
        headlineHtml: 'of every 1,000 visitors ever book a showing.',
        passIndices: [7],
        wallMode: 'solid',
        contextLabel: 'Visitors who ever book a showing',
        passLabel: 'Booked',
        failLabel: 'Walked',
        passCaption: 'Booked',
        failCaption: 'Walked',
        scaleLabel: '15 dots visualize the booking truth. The real outcome is 19 of 1,000.',
      },
      {
        beat: 6,
        statNum: '',
        statSuffix: '',
        statFix: true,
        headlineHtml: 'Recover buyers you already paid to attract.',
        passIndices: [0, 1, 2, 4, 5, 6, 7, 8, 10, 11, 13, 14],
        wallMode: 'dissolve',
        contextLabel: 'Same traffic. Fewer dead ends.',
        passLabel: 'Booked',
        failLabel: 'Still lost',
        passCaption: 'Booked',
        failCaption: 'Still lost',
        scaleLabel: 'No new traffic required. Just fewer buyers disappearing in the handoff.',
      },
    ];

    let currentBeat = 0;
    let sceneGen = 0;
    let sectionVisible = false;
    let counts = { converted: 0, lost: 0 };
    let barTargets = { pass: 0, fail: 0 };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function tick(stillCurrent, fn) {
      if (typeof stillCurrent === 'function' && !stillCurrent()) return;
      fn();
    }

    function setActiveBeatVisual(beat) {
      subSlides.forEach((s) => {
        s.classList.toggle('is-active', +s.dataset.slide === beat);
      });
      section.setAttribute('data-active-beat', String(Math.max(1, beat)));
    }

    function updateCounters() {
      if (zoneCountEl) zoneCountEl.textContent = Math.round(counts.converted).toLocaleString('en-US');
      if (sceneLostEl) sceneLostEl.textContent = Math.round(counts.lost).toLocaleString('en-US');
    }

    function getPassCount(cfg) {
      return Array.isArray(cfg?.passIndices) ? cfg.passIndices.length : 0;
    }

    function setSceneMeta(cfg) {
      if (!cfg) return;
      if (sceneContextEl) sceneContextEl.textContent = cfg.contextLabel || '';
      if (zoneLabelGoodEl) zoneLabelGoodEl.textContent = cfg.passLabel || 'Converted';
      if (zoneLabelBadEl) zoneLabelBadEl.textContent = cfg.failLabel || 'Gave up';
      if (barCaptionGoodEl) barCaptionGoodEl.textContent = cfg.passCaption || cfg.passLabel || 'Converted';
      if (barCaptionBadEl) barCaptionBadEl.textContent = cfg.failCaption || cfg.failLabel || 'Gave up';
      if (sceneScaleEl) sceneScaleEl.textContent = cfg.scaleLabel || '15 dots visualize the split · counts scale to 1,000 buyers';
    }

    function resetSceneUI() {
      counts = { converted: 0, lost: 0 };
      updateCounters();
      if (barStackPassed) barStackPassed.innerHTML = '';
      if (barStackLost) barStackLost.innerHTML = '';
      if (prospectLane) {
        prospectLane.style.removeProperty('--bar-pass-pct');
        prospectLane.style.removeProperty('--bar-fail-pct');
        prospectLane.style.removeProperty('--bar-pass-live-pct');
        prospectLane.style.removeProperty('--bar-fail-live-pct');
      }
      if (heroInner) {
        heroInner.querySelectorAll('.s-prospect').forEach((p) => p.remove());
      }
      if (beatWall) {
        beatWall.classList.remove('is-dissolved');
      }
      if (wallHeadline) {
        wallHeadline.classList.remove('is-revealed');
      }
      if (heroHeadlineBody) {
        heroHeadlineBody.classList.remove('s-hero-headline-body--fix');
      }
      if (heroStatEl) {
        heroStatEl.classList.remove('s-hero-stat--fix', 's-hero-stat--empty', 'is-swap');
        heroStatEl._lastVal = null;
      }
      if (sceneNext) {
        sceneNext.setAttribute('hidden', '');
        sceneNext.classList.remove('is-active');
      }
    }

    function applyWallForBeat(beat) {
      const cfg = BEAT_SCENES[beat - 1];
      if (!cfg) return;

      if (heroStatEl) {
        heroStatEl.classList.add('is-swap');
        requestAnimationFrame(() => {
          heroStatEl.innerHTML = cfg.statNum ? cfg.statNum + (cfg.statSuffix ? `<span class="s-hero-stat-suffix">${cfg.statSuffix}</span>` : '') : '';
          heroStatEl.classList.toggle('s-hero-stat--fix', cfg.statFix);
          heroStatEl.classList.toggle('s-hero-stat--empty', !cfg.statNum);
          heroStatEl.classList.remove('is-swap');
        });
      }

      if (heroHeadlineBody) {
        heroHeadlineBody.innerHTML = cfg.headlineHtml;
        heroHeadlineBody.classList.toggle('s-hero-headline-body--fix', cfg.statFix);
      }

      if (wallHeadline) {
        wallHeadline.classList.remove('is-revealed');
        if (cfg.wallMode === 'strike') {
          const delay = beat === 1 && !section.dataset.strikeShown ? 1200 : 400;
          setTimeout(() => {
            wallHeadline.classList.add('is-revealed');
            section.dataset.strikeShown = '1';
          }, delay);
        }
      }

      if (beatWall) beatWall.classList.remove('is-dissolved');
      setSceneMeta(cfg);
    }

    function spawnBurst(atX, atY) {
      if (!fxLayer || !heroInner) return;
      const innerR = heroInner.getBoundingClientRect();
      const fxR = fxLayer.getBoundingClientRect();
      const cx = atX != null ? atX - (fxR.left - innerR.left) : fxR.width * 0.5;
      const cy = atY != null ? atY - (fxR.top - innerR.top) : fxR.height * 0.5;
      const count = 18;
      for (let i = 0; i < count; i += 1) {
        const p = document.createElement('span');
        p.className = 's-fx-particle s-fx-particle--burst';
        p.style.left = `${cx}px`;
        p.style.top = `${cy}px`;
        const angle = (i / count) * Math.PI * 2;
        const dist = 50 + Math.random() * 60;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        fxLayer.appendChild(p);
        p.animate(
          [
            { transform: 'translate(0, 0) scale(0.6)', opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px) scale(0.15)`, opacity: 0 },
          ],
          { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
        ).onfinish = () => p.remove();
      }
    }

    function spawnImpact(atX, atY) {
      if (!fxLayer || !heroInner) return;
      const innerR = heroInner.getBoundingClientRect();
      const fxR = fxLayer.getBoundingClientRect();
      const cx = atX != null ? atX - (fxR.left - innerR.left) : fxR.width * 0.5;
      const cy = atY != null ? atY - (fxR.top - innerR.top) : fxR.height * 0.5;
      const count = 10;
      for (let i = 0; i < count; i += 1) {
        const p = document.createElement('span');
        p.className = 's-fx-particle s-fx-particle--impact';
        p.style.left = `${cx}px`;
        p.style.top = `${cy}px`;
        const angle = (-Math.PI / 2) + ((i - count / 2) * 0.22);
        const dist = 18 + Math.random() * 24;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        fxLayer.appendChild(p);
        p.animate(
          [
            { transform: 'translate(0, 0) scale(0.85)', opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px) scale(0.1)`, opacity: 0 },
          ],
          { duration: 320 + Math.random() * 120, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
        ).onfinish = () => p.remove();
      }
    }

    function pulseWallHit(stillCurrent, x, y) {
      tick(stillCurrent, () => {
        spawnImpact(x, y);
      });
    }

    function getSceneMetrics() {
      if (!heroInner || !beatWall || !sceneStage) {
        return {
          rootR: { left: 0, top: 0, width: 1, height: 1 },
          wallLeft: 0,
          wallTop: 0,
          wallW: 1,
          wallH: 1,
        };
      }
      const rootR = heroInner.getBoundingClientRect();
      const wallR = beatWall.getBoundingClientRect();

      return {
        rootR,
        wallLeft: wallR.left - rootR.left,
        wallTop: wallR.top - rootR.top,
        wallW: wallR.width,
        wallH: wallR.height,
      };
    }

    function setBarFill(passCount) {
      if (!prospectLane) return;
      const failCount = VISUAL_COUNT - passCount;
      const passPct = Math.max(12, (passCount / VISUAL_COUNT) * 100);
      const failPct = Math.max(12, (failCount / VISUAL_COUNT) * 100);
      barTargets = { pass: passCount, fail: failCount };
      prospectLane.style.setProperty('--bar-pass-pct', `${passPct}%`);
      prospectLane.style.setProperty('--bar-fail-pct', `${failPct}%`);
      prospectLane.style.setProperty('--bar-pass-live-pct', '0%');
      prospectLane.style.setProperty('--bar-fail-live-pct', '0%');
    }

    function updateBarLiveFill() {
      if (!prospectLane) return;
      const passLive = barTargets.pass ? Math.min(100, (counts.converted / barTargets.pass) * 100) : 0;
      const failLive = barTargets.fail ? Math.min(100, (counts.lost / barTargets.fail) * 100) : 0;
      prospectLane.style.setProperty('--bar-pass-live-pct', `${passLive}%`);
      prospectLane.style.setProperty('--bar-fail-live-pct', `${failLive}%`);
    }

    function getBarLandingPoint(frameEl, rootR, willPass) {
      if (!frameEl) return { x: 0, y: 0 };
      const r = frameEl.getBoundingClientRect();
      const target = willPass ? barTargets.pass : barTargets.fail;
      const current = willPass ? counts.converted : counts.lost;
      const next = target ? Math.min(target, current + 1) : 0;
      const fillRatio = target ? next / target : 0;
      const dot = 13;
      return {
        x: r.left - rootR.left + (r.width / 2) - (dot / 2),
        y: r.bottom - rootR.top - (r.height * fillRatio) - (dot / 2),
      };
    }

    function finishProspect(el, willPass, dest, stillCurrent) {
      if (!stillCurrent()) return;
      if (willPass) {
        el.classList.add('is-passed');
        if (dest) spawnBurst(dest.x + 6.5, dest.y + 6.5);
      } else {
        el.classList.add('is-blocked');
      }
      onProspectResult(willPass);
      gsap.to(el, {
        scale: 1.6,
        opacity: 0,
        duration: 0.22,
        ease: 'power2.out',
        onComplete: () => el.remove(),
      });
    }

    function launchProspect(el, willPass, stillCurrent) {
      const m = getSceneMetrics();
      const idx = +el.dataset.idx || 0;
      const frame = willPass ? barFramePassed : barFrameLost;

      const spreadT = (idx + 0.5) / VISUAL_COUNT;
      const startX = m.wallLeft + m.wallW * spreadT;
      const startY = m.wallTop - 22 - (idx % 4) * 3;
      const wallX = startX;
      const wallY = m.wallTop + m.wallH * 0.52;

      el.classList.add('is-flying');
      heroInner.appendChild(el);
      gsap.set(el, { left: startX, top: startY, x: 0, y: 0, clearProps: 'transform' });

      const durDrop = 0.52 + Math.random() * 0.14;
      const durBar = 0.42 + Math.random() * 0.12;

      const tl = gsap.timeline();
      tl.to(el, {
        left: wallX,
        top: wallY,
        duration: durDrop,
        ease: 'power2.in',
        onComplete: () => {
          if (!willPass) pulseWallHit(stillCurrent, m.rootR.left + wallX, m.rootR.top + wallY);
        },
      });
      tl.add(() => tick(stillCurrent, () => {
        const dest = getBarLandingPoint(frame, m.rootR, willPass);
        gsap.to(el, {
          left: dest.x,
          top: dest.y,
          duration: durBar,
          ease: 'power2.out',
          onComplete: () => tick(stillCurrent, () => finishProspect(el, willPass, dest, stillCurrent)),
        });
      }));
    }

    function onProspectResult(willPass) {
      if (willPass) counts.converted += 1;
      else counts.lost += 1;
      updateCounters();
      updateBarLiveFill();
    }

    function buildPassFlags(cfg) {
      const flags = Array(VISUAL_COUNT).fill(false);
      (cfg.passIndices || []).forEach((idx) => {
        if (idx >= 0 && idx < VISUAL_COUNT) flags[idx] = true;
      });
      return flags;
    }

    function playScene(beat, stillCurrent) {
      const cfg = BEAT_SCENES[beat - 1];
      if (!cfg || !heroInner || !sectionVisible) return;
      const passCount = getPassCount(cfg);

      resetSceneUI();
      setBarFill(passCount);
      if (sceneStage) void sceneStage.offsetHeight;

      if (beat === 6) {
        playBeat6Finale(stillCurrent, cfg);
        return;
      }

      const passFlags = buildPassFlags(cfg);

      for (let i = 0; i < VISUAL_COUNT; i += 1) {
        const delay = i * LAUNCH_STAGGER_MS;
        setTimeout(() => tick(stillCurrent, () => {
          const el = document.createElement('span');
          el.className = 's-prospect';
          el.dataset.idx = String(i);
          heroInner.appendChild(el);
          launchProspect(el, passFlags[i], stillCurrent);
        }), delay);
      }
    }

    function playBeat6Finale(stillCurrent, cfg) {
      const passCount = getPassCount(cfg);
      if (beatWall) beatWall.classList.remove('is-dissolved');
      if (wallHeadline) wallHeadline.classList.remove('is-revealed');

      setTimeout(() => tick(stillCurrent, () => {
        if (beatWall) beatWall.classList.add('is-dissolved');
        if (wallHeadline) wallHeadline.classList.add('is-revealed');
      }), 400);

      setTimeout(() => tick(stillCurrent, () => {
        setBarFill(passCount);
        const passFlags = buildPassFlags(cfg);
        for (let i = 0; i < VISUAL_COUNT; i += 1) {
          const delay = i * LAUNCH_STAGGER_MS;
          setTimeout(() => tick(stillCurrent, () => {
            const el = document.createElement('span');
            el.className = 's-prospect';
            el.dataset.idx = String(i);
            heroInner.appendChild(el);
            launchProspect(el, passFlags[i], stillCurrent);
          }), delay);
        }
      }), 900);

      setTimeout(() => tick(stillCurrent, () => {
        if (sceneNext) {
          sceneNext.removeAttribute('hidden');
          requestAnimationFrame(() => sceneNext.classList.add('is-active'));
        }
      }), 2200);
    }

    function playSceneStatic(beat) {
      const cfg = BEAT_SCENES[beat - 1];
      if (!cfg) return;
      const passCount = getPassCount(cfg);
      resetSceneUI();
      setBarFill(passCount);
      counts.converted = passCount;
      counts.lost = VISUAL_COUNT - passCount;
      if (beat === 6) {
        if (beatWall) beatWall.classList.add('is-dissolved');
        if (sceneNext) {
          sceneNext.removeAttribute('hidden');
          sceneNext.classList.add('is-active');
        }
      }
      updateCounters();
      updateBarLiveFill();
    }

    function enterBeat(beat) {
      if (beat === currentBeat) return;
      currentBeat = beat;
      const gen = ++sceneGen;
      const stillCurrent = () => gen === sceneGen && currentBeat === beat;

      setActiveBeatVisual(beat);
      applyWallForBeat(beat);

      if (prefersReducedMotion) {
        playSceneStatic(beat);
        return;
      }

      if (sectionVisible) playScene(beat, stillCurrent);
    }

    const sectionObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        sectionVisible = e.isIntersecting;
        if (sectionVisible && currentBeat >= 1 && !prefersReducedMotion) {
          const gen = ++sceneGen;
          const beat = currentBeat;
          const stillCurrent = () => gen === sceneGen && currentBeat === beat;
          playScene(beat, stillCurrent);
        }
      });
    }, { threshold: 0.12 });
    sectionObs.observe(section);

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const beat = Math.min(TOTAL_BEATS, Math.max(1, Math.floor(self.progress * TOTAL_BEATS) + 1));
        if (beat !== currentBeat) enterBeat(beat);
      },
    });

    currentBeat = 0;
    enterBeat(1);

    window.addEventListener('resize', () => {
      if (prefersReducedMotion) {
        playSceneStatic(currentBeat);
      } else if (sectionVisible && currentBeat >= 1) {
        const gen = ++sceneGen;
        const beat = currentBeat;
        const stillCurrent = () => gen === sceneGen && currentBeat === beat;
        playScene(beat, stillCurrent);
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────
     ACT 1 + ACT 2 + ACT 4  —  scroll-pinned beat sequence + per-beat anim
     Pin the inner section, advance through N beats as user scrolls.
     Each beat with [data-anim] fires its choreographed animation when
     it becomes active — so left text + right visual stay in lockstep
     with scroll position.
     ───────────────────────────────────────────────────────────── */

  // Dispatch map populated lazily so function declarations are hoisted by the
  // time the closure here runs. (Keeping it as a let avoids TDZ on first
  // setActiveBeat call which fires during the acts.forEach loop below.)
  let BEAT_ANIMS = {};

  const acts = document.querySelectorAll('.s-act');

  acts.forEach((act) => {
    const inner = act.querySelector('.s-act-inner');
    const beats = act.querySelectorAll('.s-beat');
    const beatCopies = act.querySelectorAll('.s-act-beat');
    const totalBeats = beats.length;

    if (!inner || !beats.length) return;

    // Track an animation token per beat so a re-entry cancels the prior run
    const animTokens = new Array(totalBeats).fill(0);
    // Has this act been scrolled into view yet? Gates animation firing so
    // off-screen acts don't pre-play their stories before the user arrives.
    let actEntered = false;

    function setActiveBeatClass(idx) {
      beats.forEach((b, i) => b.classList.toggle('is-active', i === idx));
      beatCopies.forEach((b, i) => b.classList.toggle('is-active', i === idx));
    }

    function fireBeatAnim(idx) {
      const beatEl = beats[idx];
      if (!beatEl) return;
      animTokens[idx] += 1;
      const token = animTokens[idx];
      const key = beatEl.dataset.anim;
      const fn = BEAT_ANIMS[key];
      if (typeof fn === 'function') {
        // tiny defer so opacity transition gets a frame to settle first
        setTimeout(() => {
          if (animTokens[idx] === token) fn(beatEl, () => animTokens[idx] === token);
        }, 220);
      }
    }

    // Full activation: class toggle + fire animation (only if entered)
    function setActiveBeat(idx) {
      setActiveBeatClass(idx);
      if (actEntered) fireBeatAnim(idx);
    }

    // IntersectionObserver flips actEntered the first time the act becomes
    // visible. Then we fire whatever beat is currently active.
    const enterObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !actEntered) {
          actEntered = true;
          const currentIdx = act._currentBeat ?? 0;
          fireBeatAnim(currentIdx);
          enterObs.unobserve(act);
        }
      });
    }, { threshold: 0.08 });
    enterObs.observe(act);

    // Only scroll-pin on larger screens — on mobile we stack naturally
    if (window.innerWidth >= 1100) {
      ScrollTrigger.create({
        trigger: act,
        start: 'top top',
        end: 'bottom bottom',
        scrub: false,
        onUpdate: (self) => {
          const p = self.progress;
          const idx = Math.min(totalBeats - 1, Math.floor(p * totalBeats));
          if (act._currentBeat !== idx) {
            act._currentBeat = idx;
            setActiveBeat(idx);
          }
        },
      });
    } else {
      // On mobile, observe each beat individually and fire its animation
      // when scrolled into view (so all of them eventually play)
      beats.forEach((beat, i) => {
        const obs = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              beat.classList.add('is-active');
              if (beatCopies[i]) beatCopies[i].classList.add('is-active');
              animTokens[i] += 1;
              const token = animTokens[i];
              const key = beat.dataset.anim;
              const fn = BEAT_ANIMS[key];
              if (typeof fn === 'function') {
                fn(beat, () => animTokens[i] === token);
              }
              obs.unobserve(beat);
            }
          });
        }, { threshold: 0.35 });
        obs.observe(beat);
      });
    }

    // Init: only toggle the class. Animation will fire when the act
    // enters the viewport via ScrollTrigger.onUpdate (desktop) or
    // IntersectionObserver (mobile), guaranteeing each beat starts
    // in its "before" state until the user actually arrives.
    setActiveBeatClass(0);
  });

  /* ─────────────────────────────────────────────────────────────
     PER-BEAT ANIMATION HELPERS
     Each function receives (beatEl, stillCurrent) where stillCurrent
     is a predicate — call it before each step to bail if a newer
     activation has superseded this run.
     ───────────────────────────────────────────────────────────── */
  function tick(stillCurrent, fn) {
    if (typeof stillCurrent === 'function' && !stillCurrent()) return;
    fn();
  }

  function typeInto(targetEl, text, perChar, done) {
    let i = 0;
    function step() {
      if (i > text.length) { if (done) done(); return; }
      targetEl.textContent = text.slice(0, i);
      i += 1;
      setTimeout(step, perChar);
    }
    step();
  }

  /* ----- ACT 1 BEAT 1 — animated form fill + submit + confirm ----- */
  function playAct1Beat1(beatEl, stillCurrent) {
    const form = beatEl.querySelector('[data-form]');
    if (!form) return;
    const nameField = form.querySelector('[data-field="name"]');
    const emailField = form.querySelector('[data-field="email"]');
    const nameTyped = nameField && nameField.querySelector('[data-typed]');
    const emailTyped = emailField && emailField.querySelector('[data-typed]');
    const submitBtn = form.querySelector('[data-submit-btn]');

    // reset
    form.classList.remove('is-confirmed');
    [nameField, emailField].forEach((f) => f && f.classList.remove('is-focused'));
    if (nameTyped) nameTyped.textContent = '';
    if (emailTyped) emailTyped.textContent = '';
    if (submitBtn) submitBtn.classList.remove('is-pressed');

    // Beat 1 timeline:
    //  - 300ms: focus name, start typing
    //  - 1300ms: focus email, start typing
    //  - 2900ms: press submit
    //  - 3300ms: confirmation in
    setTimeout(() => tick(stillCurrent, () => {
      if (nameField) nameField.classList.add('is-focused');
      if (nameTyped) typeInto(nameTyped, 'John Castillo', 55);
    }), 300);

    setTimeout(() => tick(stillCurrent, () => {
      if (nameField) nameField.classList.remove('is-focused');
      if (emailField) emailField.classList.add('is-focused');
      if (emailTyped) typeInto(emailTyped, 'j.castillo@gmail.com', 50);
    }), 1500);

    setTimeout(() => tick(stillCurrent, () => {
      if (emailField) emailField.classList.remove('is-focused');
      if (submitBtn) submitBtn.classList.add('is-pressed');
    }), 2900);

    setTimeout(() => tick(stillCurrent, () => {
      form.classList.add('is-confirmed');
    }), 3300);
  }

  /* ----- ACT 1 BEAT 2 — auto-reply lands, then competitor blasts bury it ----- */
  const act1Beat2Messages = [
    { ours: true,  from: 'Your Dealership',          subj: "Thanks for your inquiry — we'll be in touch Monday", time: 'Sat 11:17 PM' },
    { ours: false, from: 'Lakeside Realty (newsletter)', subj: 'Weekend Open Houses you might love',              time: 'Sat 11:34 PM' },
    { ours: false, from: 'Wakeboarder Magazine',     subj: 'New: 2026 Wake Boat Buyer Guide is here',            time: 'Sun 6:14 AM' },
    { ours: false, from: 'North Lake Marine',        subj: 'Hey John — Mike from North Lake about the Wakesetter…', time: 'Sun 7:02 AM' },
    { ours: false, from: 'Boat Trader Alerts',       subj: '3 new wake boats matching your saved search',        time: 'Sun 8:30 AM' },
    { ours: false, from: 'Crosswind Watersports',    subj: 'Showings open Sunday from 10 AM — wakesetters in stock', time: 'Sun 8:47 AM' },
    { ours: false, from: 'Premier Marine',           subj: 'We have the same Wakesetter in Pearl White — call me?', time: 'Sun 9:18 AM' },
  ];

  function playAct1Beat2(beatEl, stillCurrent) {
    const list = beatEl.querySelector('[data-inbox-list]');
    const count = beatEl.querySelector('[data-inbox-count]');
    const silence = beatEl.querySelector('[data-inbox-silence]');
    if (!list) return;

    // reset
    list.innerHTML = '';
    if (silence) silence.classList.remove('is-in');
    if (count) count.textContent = '0 unread';

    let unread = 0;
    act1Beat2Messages.forEach((m, i) => {
      setTimeout(() => tick(stillCurrent, () => {
        const row = document.createElement('div');
        row.className = 's-inbox-msg' + (m.ours ? ' s-inbox-msg--ours' : '');
        row.innerHTML = `
          <div class="s-inbox-msg-main">
            <div class="s-inbox-from">${m.from}</div>
            <div class="s-inbox-subj">${m.subj}</div>
          </div>
          <div class="s-inbox-time">${m.time}</div>`;
        // insert newest at top
        list.prepend(row);
        requestAnimationFrame(() => row.classList.add('is-in'));
        unread += 1;
        if (count) count.textContent = `${unread} unread`;
        // bury the original auto-reply once 3+ messages stack on top
        if (i >= 3) {
          const ours = list.querySelector('.s-inbox-msg--ours');
          if (ours) ours.classList.add('is-buried');
        }
      }), 250 + i * 450);
    });

    // silence indicator appears at the end
    setTimeout(() => tick(stillCurrent, () => {
      if (silence) silence.classList.add('is-in');
    }), 250 + act1Beat2Messages.length * 450 + 200);
  }

  /* ----- ACT 1 BEAT 3 — timeline of competitor messages ----- */
  const act1Beat3Events = [
    { ours: true,  time: '11:17 PM Sat', from: 'Your dealership (auto)',  msg: '"A representative will contact you Monday morning."' },
    { ours: false, time: '11:58 PM Sat', from: 'North Lake Marine',       msg: '"Hey John — Mike, GM at North Lake. Saw you were looking at the Wakesetter. I\'m up — want me to pull a few specs?"' },
    { ours: false, time: '6:42 AM Sun',  from: 'Crosswind Watersports',   msg: '"Saw your inquiry. We have two on the lot. Showings open Sunday from 10 AM."' },
    { ours: false, time: '9:18 AM Sun',  from: 'Premier Marine',          msg: '"Hi John — we\'ve got the same Wakesetter in Pearl White. Can I call you this morning?"' },
    { ours: false, time: '11:04 AM Sun', from: 'North Lake Marine',       msg: '"Good news — manager just approved a price we think you\'ll like. Free to chat?"' },
  ];

  function playAct1Beat3(beatEl, stillCurrent) {
    const list = beatEl.querySelector('[data-timeline-events]');
    if (!list) return;

    // reset
    list.innerHTML = '';

    act1Beat3Events.forEach((e, i) => {
      setTimeout(() => tick(stillCurrent, () => {
        const ev = document.createElement('div');
        ev.className = 's-tl-event' + (e.ours ? ' s-tl-event--ours' : '');
        ev.innerHTML = `
          <span class="s-tl-time">${e.time}</span>
          <span class="s-tl-from">${e.from}</span>
          <span class="s-tl-msg">${e.msg}</span>`;
        list.appendChild(ev);
        requestAnimationFrame(() => ev.classList.add('is-in'));
        // bury the auto-reply once 2+ rivals have replied
        if (i >= 3) {
          const ours = list.querySelector('.s-tl-event--ours');
          if (ours) ours.classList.add('is-buried');
        }
      }), 250 + i * 600);
    });
  }

  /* ----- ACT 1 BEAT 4 — the call. Buyer already with competitor. ----- */
  const act1Beat4Convo = [
    { role: 'us',   text: '"Hi John, this is Steve from Lakeshore Marine returning your inquiry on the 2022 Wakesetter…"' },
    { role: 'them', text: '"Oh hey… yeah, I actually went with North Lake on Sunday. Sorry about that — they reached out Saturday night."' },
    { role: 'us silent', text: '. . .' },
  ];

  function playAct1Beat4(beatEl, stillCurrent) {
    const convo = beatEl.querySelector('[data-lost-convo]');
    const stamp = beatEl.querySelector('[data-lost-stamp]');
    const ageEl = beatEl.querySelector('[data-age]');
    if (!convo) return;

    // reset
    convo.innerHTML = '';
    if (stamp) stamp.classList.remove('is-in');

    // animate the age counter ticking up from 0 to 59h 25m over ~1.6s
    if (ageEl) {
      const startedAt = performance.now();
      const totalMs = 1600;
      const target = 59 * 60 + 25; // minutes
      function tickAge() {
        if (!stillCurrent()) return;
        const t = Math.min(1, (performance.now() - startedAt) / totalMs);
        const eased = 1 - Math.pow(1 - t, 3);
        const mins = Math.round(target * eased);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        ageEl.textContent = `${h}h ${String(m).padStart(2, '0')}m`;
        if (t < 1) requestAnimationFrame(tickAge);
      }
      requestAnimationFrame(tickAge);
    }

    // bubbles
    act1Beat4Convo.forEach((b, i) => {
      setTimeout(() => tick(stillCurrent, () => {
        const div = document.createElement('div');
        const classes = b.role.split(' ').map((c) => 's-lost-bubble--' + c).join(' ');
        div.className = 's-lost-bubble ' + classes;
        div.textContent = b.text;
        convo.appendChild(div);
        requestAnimationFrame(() => div.classList.add('is-in'));
      }), 1800 + i * 1500);
    });

    // stamp
    setTimeout(() => tick(stillCurrent, () => {
      if (stamp) stamp.classList.add('is-in');
    }), 1800 + act1Beat4Convo.length * 1500 + 300);
  }

  /* ----- ACT 2 BEAT 1 — sequential stack reveal ----- */
  function playAct2Beat1(beatEl, stillCurrent) {
    const steps = beatEl.querySelectorAll('[data-stack-step]');
    if (!steps.length) return;
    steps.forEach((s) => s.classList.remove('is-in'));
    steps.forEach((step, i) => {
      setTimeout(() => tick(stillCurrent, () => step.classList.add('is-in')), 250 + i * 700);
    });
  }

  /* ----- ACT 2 BEAT 2 — SMS conversation (existing playAct2Convo) ----- */
  function playAct2Beat2() {
    // delegate to existing implementation
    act2Played = false; // allow replay on re-entry
    playAct2Convo();
  }

  /* ----- ACT 2 BEAT 3 — appointment first, then profile rows ----- */
  function playAct2Beat3(beatEl, stillCurrent) {
    const cards = beatEl.querySelectorAll('[data-reveal-step]');
    const rows = beatEl.querySelectorAll('[data-row]');
    cards.forEach((c) => c.classList.remove('is-in'));
    rows.forEach((r) => r.classList.remove('is-in'));

    // card 1 (calendar)
    setTimeout(() => tick(stillCurrent, () => cards[0] && cards[0].classList.add('is-in')), 200);
    // card 2 (profile shell)
    setTimeout(() => tick(stillCurrent, () => cards[1] && cards[1].classList.add('is-in')), 800);
    // rows cascade
    rows.forEach((row, i) => {
      setTimeout(() => tick(stillCurrent, () => row.classList.add('is-in')), 1100 + i * 180);
    });
  }

  /* ----- ACT 2 BEAT 4 — auto-cycle through dashboard tabs ----- */
  function playAct2Beat4(beatEl, stillCurrent) {
    const tabs = beatEl.querySelectorAll('[data-dash-tabs] .s-dash-tab');
    const panels = beatEl.querySelectorAll('[data-dash-panels] .s-dash-panel');
    if (!tabs.length || !panels.length) return;
    let idx = 0;
    function showTab(i) {
      if (!stillCurrent()) return;
      tabs.forEach((t, j) => t.classList.toggle('is-active', i === j));
      panels.forEach((p, j) => p.classList.toggle('is-active', i === j));
    }
    showTab(0);
    function loop() {
      if (!stillCurrent()) return;
      idx = (idx + 1) % tabs.length;
      showTab(idx);
      setTimeout(loop, 2400);
    }
    setTimeout(loop, 2400);
  }

  /* ═════════════════════════════════════════════════════════════
     ACT 4 ANIMATIONS (the sales-team-side beats)
     ═════════════════════════════════════════════════════════════ */

  /* ----- ACT 4 BEAT 1 — Lead particles funnelling into validator ----- */
  // We spawn small dots from each source tile, fly them to the validator
  // node, briefly hold, then route ~30% to trash and ~70% to sales team.
  function playAct4Beat1OneFunnel(beatEl, stillCurrent) {
    const particles = beatEl.querySelector('[data-funnel-particles]');
    const funnelNode = beatEl.querySelector('[data-funnel-node]');
    const trash = beatEl.querySelector('[data-funnel-trash]');
    const team = beatEl.querySelector('[data-funnel-team]');
    const sources = beatEl.querySelectorAll('[data-src]');
    if (!particles || !funnelNode || !trash || !team || !sources.length) return;

    function centerOf(el) {
      const cr = particles.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { x: r.left - cr.left + r.width / 2, y: r.top - cr.top + r.height / 2 };
    }

    function spawnOne() {
      if (!stillCurrent()) return;
      const src = sources[Math.floor(Math.random() * sources.length)];
      const from = centerOf(src);
      const to = centerOf(funnelNode);
      const isSpam = Math.random() < 0.3;
      const dot = document.createElement('div');
      dot.className = 's-lead-dot';
      dot.style.left = from.x + 'px';
      dot.style.top = from.y + 'px';
      particles.appendChild(dot);

      // Leg 1: source → validator (~750ms)
      const dx1 = to.x - from.x;
      const dy1 = to.y - from.y;
      dot.style.transition = 'transform 0.75s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';
      requestAnimationFrame(() => {
        dot.style.transform = `translate(${dx1}px, ${dy1}px)`;
      });

      setTimeout(() => {
        if (!stillCurrent()) { dot.remove(); return; }
        funnelNode.classList.add('is-pulse');
        setTimeout(() => funnelNode.classList.remove('is-pulse'), 450);

        // Leg 2: validator → trash or team
        const dest = isSpam ? trash : team;
        const toD = centerOf(dest);
        const dx2 = toD.x - from.x;
        const dy2 = toD.y - from.y;
        dot.classList.add(isSpam ? 's-lead-dot--spam' : 's-lead-dot--good');
        dot.style.transition = 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease 0.4s';
        dot.style.transform = `translate(${dx2}px, ${dy2}px)`;
        setTimeout(() => {
          dot.style.opacity = '0';
        }, 350);
        setTimeout(() => dot.remove(), 1100);
      }, 800);
    }

    // staggered initial salvo, then steady cadence
    [0, 240, 520, 820, 1140].forEach((d) => setTimeout(() => tick(stillCurrent, spawnOne), d));
    const interval = setInterval(() => {
      if (!stillCurrent()) { clearInterval(interval); return; }
      spawnOne();
    }, 650);
  }

  /* ----- ACT 4 BEAT 2 — Rep getting pelted, then AI shield, then validator ----- */
  const act4Beat2JunkLeads = [
    { x: 'X', label: 'qwerty@mailinator.com' },
    { x: 'X', label: '+1 (555) 555-5555' },
    { x: 'X', label: '[BOT] form-fill' },
    { x: 'X', label: 'spy@rivaldealer.net' },
    { x: 'X', label: 'aaaaa@bbbb.cc' },
    { x: 'X', label: 'disposable email' },
  ];
  // After the shield goes up, a couple of valid leads pass through cleanly
  const act4Beat2ValidLeads = [
    { label: 'John Castillo' },
    { label: 'Sarah Bennett' },
    { label: 'Tom Whittaker' },
  ];

  function playAct4Beat2Garbage(beatEl, stillCurrent) {
    const scene = beatEl.querySelector('[data-bounce-scene]');
    const feed = beatEl.querySelector('[data-bs-feed]');
    const shield = beatEl.querySelector('[data-bs-shield]');
    const rep = beatEl.querySelector('[data-bs-rep]');
    const caption = beatEl.querySelector('[data-bs-caption]');
    const validator = beatEl.querySelector('[data-validator]');
    if (!scene || !feed || !shield || !rep || !validator) return;

    // reset
    scene.classList.remove('is-faded');
    shield.classList.remove('is-up');
    rep.classList.remove('is-tired', 'is-shake');
    validator.classList.remove('is-revealed');
    feed.innerHTML = '';
    if (caption) caption.textContent = 'Reading leads…';

    const sceneRect = scene.getBoundingClientRect();
    // Rep is centered; figure out its center via getBoundingClientRect
    function shootLead(text, opts) {
      if (!stillCurrent()) return;
      const lead = document.createElement('div');
      lead.className = 's-bs-lead';
      lead.innerHTML = `<span>${text}</span><span class="s-bs-lead-x">${opts.x || ''}</span>`;
      feed.appendChild(lead);

      // start position: left edge, random vertical jitter
      const startY = (Math.random() * 0.4 + 0.3) * sceneRect.height;
      lead.style.top = startY + 'px';
      lead.style.left = '-220px';
      lead.style.transform = 'translateX(0)';
      lead.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.3s ease';

      // fly to the rep (center)
      requestAnimationFrame(() => {
        const targetX = sceneRect.width * 0.52 + 220 - 32;
        lead.style.transform = `translateX(${targetX}px)`;
      });

      if (opts.bounce) {
        // Mid-flight, hit happens. Rep shakes, lead X'd, lead bounces away.
        setTimeout(() => {
          if (!stillCurrent()) { lead.remove(); return; }
          rep.classList.add('is-shake');
          setTimeout(() => rep.classList.remove('is-shake'), 250);
          lead.classList.add('is-rejected');
          // bounce off down-right, fading
          const bounceX = sceneRect.width * 0.52 + 220 + 200;
          const bounceY = startY + 140;
          lead.style.transition = 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.6s ease 0.15s';
          lead.style.transform = `translate(${bounceX}px, ${bounceY - startY}px) rotate(20deg)`;
          setTimeout(() => { lead.style.opacity = '0'; }, 200);
          setTimeout(() => lead.remove(), 900);
        }, opts.bounceAt || 450);
      } else {
        // valid lead: passes through to rep, lands gently
        setTimeout(() => {
          if (!stillCurrent()) { lead.remove(); return; }
          lead.style.transition = 'transform 0.4s ease-out, opacity 0.6s ease 0.3s';
          lead.style.opacity = '0';
          setTimeout(() => lead.remove(), 900);
        }, 600);
      }
    }

    // ─── PHASE 1: rep gets pelted ───────────────────────────────
    act4Beat2JunkLeads.forEach((lead, i) => {
      setTimeout(() => shootLead(lead.label, { x: lead.x, bounce: true, bounceAt: 450 }), 300 + i * 380);
    });
    // mid-phase: rep starts to tire
    setTimeout(() => tick(stillCurrent, () => {
      rep.classList.add('is-tired');
      if (caption) caption.textContent = '80% garbage. Reps give up.';
    }), 300 + 4 * 380);

    // ─── PHASE 2: AI shield slides in ───────────────────────────
    const shieldAt = 300 + act4Beat2JunkLeads.length * 380 + 400;
    setTimeout(() => tick(stillCurrent, () => {
      shield.classList.add('is-up');
      rep.classList.remove('is-tired');
      if (caption) caption.textContent = 'AI intercepts. Rep gets the good stuff.';
    }), shieldAt);

    // ─── PHASE 3: clean leads flow through ──────────────────────
    const cleanStart = shieldAt + 900;
    act4Beat2ValidLeads.forEach((lead, i) => {
      setTimeout(() => shootLead(lead.label, { bounce: false }), cleanStart + i * 380);
    });

    // ─── PHASE 4: fade scene, reveal validator UI ───────────────
    const fadeAt = cleanStart + act4Beat2ValidLeads.length * 380 + 600;
    setTimeout(() => tick(stillCurrent, () => {
      scene.classList.add('is-faded');
      validator.classList.add('is-revealed');
    }), fadeAt);
  }

  /* ----- ACT 4 BEAT 3 — Forensic enrichment, sequential reveal ----- */
  function playAct4Beat3Forensic(beatEl, stillCurrent) {
    const header = beatEl.querySelector('[data-fr-reveal]');
    const judge = beatEl.querySelector('[data-fr-judge]');
    const rows = beatEl.querySelectorAll('[data-row]');

    // reset
    if (header) header.classList.remove('is-in');
    if (judge) judge.classList.remove('is-in', 'is-pulse');
    rows.forEach((r) => r.classList.remove('is-in'));

    setTimeout(() => tick(stillCurrent, () => { if (header) header.classList.add('is-in'); }), 150);
    rows.forEach((r, i) => {
      setTimeout(() => tick(stillCurrent, () => r.classList.add('is-in')), 400 + i * 120);
    });
    const judgeAt = 400 + rows.length * 120 + 200;
    setTimeout(() => tick(stillCurrent, () => {
      if (judge) {
        judge.classList.add('is-in');
        setTimeout(() => judge.classList.add('is-pulse'), 250);
      }
    }), judgeAt);
  }

  /* ----- ACT 4 BEAT 4 — Routing simulation ----- */
  function playAct4Beat4Routing(beatEl, stillCurrent) {
    const lead = beatEl.querySelector('[data-routing-lead]');
    const router = beatEl.querySelector('[data-routing-router]');
    const reps = beatEl.querySelectorAll('[data-rep]');
    const tag = beatEl.querySelector('[data-routing-tag]');
    const result = beatEl.querySelector('[data-routing-result]');
    if (!lead || !router || !reps.length || !tag || !result) return;

    // reset
    lead.classList.remove('is-in', 'is-dropping');
    router.classList.remove('is-pulse');
    reps.forEach((r) => r.classList.remove('is-considered-skip', 'is-matched'));
    tag.classList.remove('is-on', 'is-match');
    tag.style.transform = 'translate(-50%, -50%) scale(0)';
    result.classList.remove('is-in');

    // 1. lead card fades in
    setTimeout(() => tick(stillCurrent, () => lead.classList.add('is-in')), 200);

    // 2. lead card drops into router
    setTimeout(() => tick(stillCurrent, () => lead.classList.add('is-dropping')), 900);

    // 3. router pulses
    setTimeout(() => tick(stillCurrent, () => {
      router.classList.add('is-pulse');
      setTimeout(() => router.classList.remove('is-pulse'), 600);
    }), 1300);

    // 4. tag emerges & visits each rep in sequence
    const routerRect = router.getBoundingClientRect();
    const beatRect = beatEl.querySelector('.s-routing').getBoundingClientRect();
    function showTagOver(repEl, isMatch) {
      const repRect = repEl.getBoundingClientRect();
      const cx = repRect.left - beatRect.left + repRect.width / 2;
      const cy = repRect.top - beatRect.top + 24;
      tag.style.left = cx + 'px';
      tag.style.top = cy + 'px';
      tag.style.transform = 'translate(-50%, -50%) scale(1)';
      tag.classList.add('is-on');
      tag.classList.toggle('is-match', isMatch);
    }

    setTimeout(() => tick(stillCurrent, () => {
      // initial position: above router
      const rx = router.getBoundingClientRect();
      tag.style.left = (rx.left - beatRect.left + rx.width / 2) + 'px';
      tag.style.top = (rx.top - beatRect.top - 22) + 'px';
      tag.style.transform = 'translate(-50%, -50%) scale(1)';
      tag.classList.add('is-on');
    }), 1600);

    // Bob
    setTimeout(() => tick(stillCurrent, () => {
      showTagOver(reps[0], false);
      reps[0].classList.add('is-considered-skip');
    }), 2000);
    // Mike
    setTimeout(() => tick(stillCurrent, () => {
      showTagOver(reps[1], true);
      reps[1].classList.add('is-matched');
    }), 2500);
    // Sarah
    setTimeout(() => tick(stillCurrent, () => {
      showTagOver(reps[2], false);
      tag.classList.remove('is-match');
      reps[2].classList.add('is-considered-skip');
    }), 3000);
    // Back to Mike (settle)
    setTimeout(() => tick(stillCurrent, () => {
      showTagOver(reps[1], true);
    }), 3500);

    // 5. result slides up
    setTimeout(() => tick(stillCurrent, () => {
      tag.classList.remove('is-on');
      result.classList.add('is-in');
    }), 4100);
  }

  /* ----- ACT 4 BEAT 5 — ROI cursor demo + hint ----- */
  function playAct4Beat5RoiDemo(beatEl, stillCurrent) {
    const hint = beatEl.querySelector('[data-roi-hint]');
    const cursor = beatEl.querySelector('[data-roi-cursor]');
    const leadsSlider = beatEl.querySelector('#roi-leads');
    const closeSlider = beatEl.querySelector('#roi-close');
    const roi = beatEl.querySelector('.s-roi');
    if (!hint || !cursor || !leadsSlider || !closeSlider || !roi) return;

    // reset
    hint.classList.remove('is-on');
    cursor.classList.remove('is-on', 'is-pressed');

    function getRoiOffset(el) {
      const rr = roi.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      return { x: er.left - rr.left, y: er.top - rr.top, w: er.width, h: er.height };
    }
    function moveCursorTo(x, y, duration) {
      cursor.style.transition = `left ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), top ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, transform 0.12s ease`;
      cursor.style.left = x + 'px';
      cursor.style.top = y + 'px';
    }
    function dragSliderTo(slider, targetValue, durationMs) {
      const start = +slider.value;
      const startedAt = performance.now();
      function step() {
        if (!stillCurrent()) return;
        const t = Math.min(1, (performance.now() - startedAt) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        slider.value = String(start + (targetValue - start) * eased);
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        // keep cursor pinned to the thumb position
        const sliderOff = getRoiOffset(slider);
        const ratio = (+slider.value - +slider.min) / (+slider.max - +slider.min);
        cursor.style.left = (sliderOff.x + ratio * sliderOff.w) + 'px';
        cursor.style.top = (sliderOff.y + sliderOff.h / 2) + 'px';
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    // show hint
    setTimeout(() => tick(stillCurrent, () => hint.classList.add('is-on')), 200);

    // cursor appears off-screen-ish, then moves to the leads slider thumb
    setTimeout(() => tick(stillCurrent, () => {
      const off = getRoiOffset(leadsSlider);
      cursor.style.left = (off.x - 30) + 'px';
      cursor.style.top = (off.y + off.h / 2 + 30) + 'px';
      cursor.classList.add('is-on');
      // glide to leads thumb (starting position based on current value)
      const ratio = (+leadsSlider.value - +leadsSlider.min) / (+leadsSlider.max - +leadsSlider.min);
      setTimeout(() => moveCursorTo(off.x + ratio * off.w, off.y + off.h / 2, 700), 50);
    }), 900);

    // press + drag leads 80 → 160
    setTimeout(() => tick(stillCurrent, () => {
      cursor.classList.add('is-pressed');
      dragSliderTo(leadsSlider, 160, 1400);
    }), 1700);

    setTimeout(() => tick(stillCurrent, () => cursor.classList.remove('is-pressed')), 3200);

    // glide to close-rate slider
    setTimeout(() => tick(stillCurrent, () => {
      const off = getRoiOffset(closeSlider);
      const ratio = (+closeSlider.value - +closeSlider.min) / (+closeSlider.max - +closeSlider.min);
      moveCursorTo(off.x + ratio * off.w, off.y + off.h / 2, 700);
    }), 3500);

    // press + drag close 6 → 9
    setTimeout(() => tick(stillCurrent, () => {
      cursor.classList.add('is-pressed');
      dragSliderTo(closeSlider, 9, 1200);
    }), 4300);

    setTimeout(() => tick(stillCurrent, () => cursor.classList.remove('is-pressed')), 5600);

    // fade cursor + hint
    setTimeout(() => tick(stillCurrent, () => {
      cursor.classList.remove('is-on');
    }), 6000);
    setTimeout(() => tick(stillCurrent, () => {
      hint.classList.remove('is-on');
    }), 7000);
  }

  /* ----- ACT 4 BEAT 6 — Philosophy: reveal + counter + roadmap ----- */
  function playAct4Beat6Philosophy(beatEl, stillCurrent) {
    const reveals = beatEl.querySelectorAll('[data-cl-reveal]');
    const counters = beatEl.querySelectorAll('[data-counter]');
    const roadmapItems = beatEl.querySelectorAll('[data-roadmap-item]');
    const zeroEl = beatEl.querySelector('[data-counter-zero]');
    const stats = beatEl.querySelectorAll('.s-closer-stat');

    // reset
    reveals.forEach((r) => r.classList.remove('is-in', 'is-pulse'));
    roadmapItems.forEach((r) => r.classList.remove('is-in'));
    counters.forEach((c) => {
      const prefix = c.getAttribute('data-counter-prefix') || '';
      c.textContent = prefix + '0';
    });

    function countUp(el, target, durationMs) {
      const prefix = el.getAttribute('data-counter-prefix') || '';
      const startedAt = performance.now();
      function step() {
        if (!stillCurrent()) return;
        const t = Math.min(1, (performance.now() - startedAt) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        const n = Math.round(target * eased);
        el.textContent = prefix + n;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    // reveal[0] = quote, reveal[1..3] = three stat cards, reveal[4] = foreshadow
    if (reveals[0]) setTimeout(() => tick(stillCurrent, () => reveals[0].classList.add('is-in')), 200);

    // stat cards stagger; each kicks off its counter
    [1, 2, 3].forEach((idx, i) => {
      const baseDelay = 800 + i * 280;
      const r = reveals[idx];
      if (!r) return;
      setTimeout(() => tick(stillCurrent, () => {
        r.classList.add('is-in');
        // kick off the counter for this stat (if it has one)
        const counter = r.querySelector('[data-counter]');
        if (counter) {
          const target = parseInt(counter.getAttribute('data-counter') || '0', 10);
          countUp(counter, target, 1100);
        }
        // pulse for the zero stat
        if (idx === 3 && zeroEl) {
          r.classList.add('is-pulse');
          setTimeout(() => r.classList.remove('is-pulse'), 450);
        }
      }), baseDelay);
    });

    // foreshadow card
    const foreshadowAt = 800 + 3 * 280 + 700;
    if (reveals[4]) setTimeout(() => tick(stillCurrent, () => reveals[4].classList.add('is-in')), foreshadowAt);

    // roadmap items reveal sequentially
    roadmapItems.forEach((item, i) => {
      setTimeout(() => tick(stillCurrent, () => item.classList.add('is-in')), foreshadowAt + 350 + i * 250);
    });
  }

  /* ----- DISPATCH MAP (populate the let declared above) ----- */
  BEAT_ANIMS = {
    'act1-beat1': playAct1Beat1,
    'act1-beat2': playAct1Beat2,
    'act1-beat3': playAct1Beat3,
    'act1-beat4': playAct1Beat4,
    'act2-beat1': playAct2Beat1,
    'act2-beat2': playAct2Beat2,
    'act2-beat3': playAct2Beat3,
    'act2-beat4': playAct2Beat4,
    'act4-beat1': playAct4Beat1OneFunnel,
    'act4-beat2': playAct4Beat2Garbage,
    'act4-beat3': playAct4Beat3Forensic,
    'act4-beat4': playAct4Beat4Routing,
    'act4-beat5': playAct4Beat5RoiDemo,
    'act4-beat6': playAct4Beat6Philosophy,
  };

  // First-paint animation firing is handled per-act by the IntersectionObserver
  // inside the acts.forEach loop above. Act 1 fires immediately (in viewport
  // on load), Act 2 / Act 4 fire when the user scrolls them into view.

  /* ─────────────────────────────────────────────────────────────
     ACT 2 BEAT 2  —  scripted SMS conversation in the convo panel
     ───────────────────────────────────────────────────────────── */
  const act2Convo = document.getElementById('act2-convo');
  let act2Played = false;
  const act2Script = [
    { role: 'in',  text: "Hey John — saw you were checking out the Wakesetter. Riley here from the overnight desk. Want me to pull a few specs?" },
    { role: 'out', text: "Yeah, what's the engine package on it?" },
    { role: 'in',  text: "It's the Indmar Raptor 575. 0-30 in about 4.2 sec. Towing 3,400 lbs with the ballast loaded." },
    { role: 'out', text: "Nice. Is it still available? And do you have a similar one in white?" },
    { role: 'in',  text: "Yes — still on the lot. I have a 23 LSV in Pearl White and a 21 LX. Both same engine package. Want me to book you a showing Tuesday morning?" },
    { role: 'out', text: "Sure. 10 AM Tuesday?" },
    { role: 'in',  text: "Booked. 10 AM Tuesday — both boats ready, Mike will meet you. Sending a calendar invite to john.c@gmail.com. Sleep well." },
  ];

  function playAct2Convo() {
    if (act2Played || !act2Convo) return;
    act2Played = true;
    act2Convo.innerHTML = '';

    let delay = 200;
    act2Script.forEach((m, i) => {
      // typing indicator (only before incoming messages, skip first)
      if (m.role === 'in' && i > 0) {
        setTimeout(() => {
          const t = document.createElement('div');
          t.className = 's-typing';
          t.innerHTML = '<span></span><span></span><span></span>';
          act2Convo.appendChild(t);
          requestAnimationFrame(() => t.classList.add('is-visible'));
          act2Convo.scrollTop = act2Convo.scrollHeight;
          setTimeout(() => t.remove(), 900);
        }, delay);
        delay += 900;
      }

      setTimeout(() => {
        const msg = document.createElement('div');
        msg.className = `s-msg is-${m.role}`;
        msg.textContent = m.text;
        act2Convo.appendChild(msg);
        requestAnimationFrame(() => msg.classList.add('is-visible'));
        act2Convo.scrollTop = act2Convo.scrollHeight;
      }, delay);

      delay += 1100;
    });
  }

  /* ─────────────────────────────────────────────────────────────
     ACT 3  —  Interactive "text me" demo (fake-for-now)
     ───────────────────────────────────────────────────────────── */
  const tryInput = document.getElementById('try-phone');
  const trySend = document.getElementById('try-send');
  const tryReset = document.getElementById('try-reset');
  const tryStatus = document.getElementById('try-status');
  const phoneThread = document.getElementById('phone-thread');
  const tryScript = document.getElementById('try-script');

  // Simulated buyer responses chosen randomly to feel live
  const buyerResponses = [
    "What's the engine package?",
    "Is it still available? Do you have it in white?",
    "What's your best price out the door?",
    "Could I see it Tuesday morning?",
    "Do you offer financing?",
    "What's included in the warranty?",
  ];

  // The "behind the scenes" agent narration shown on the right
  const tryScriptBeats = [
    { text: "<strong>AI Sales Captain</strong> picks up the inquiry — knows the dealer is closed, takes the lead." },
    { text: "Looks up <strong>the actual boat</strong> on your inventory feed. Pulls live specs." },
    { text: "Drafts a reply <strong>in your dealership's brand voice</strong>. Sends as SMS, not email." },
    { text: "Reads buyer's reply. <strong>Answers the question that was actually asked</strong> — not a canned script." },
    { text: "Detects buying intent. Pulls <strong>showing availability</strong> from your sales manager's calendar." },
    { text: "Books the showing. <strong>Pushes notification</strong> to the rep's phone. Creates a lead record." },
    { text: "Enriches the lead with <strong>public profile data</strong>. Tags as Hot. Done. Total rep time: 0 minutes." },
  ];

  // Pre-scripted AI replies (so it feels natural without a backend)
  const aiReplies = [
    "Hey there — Riley from the overnight desk. I see you were checking out the 2022 Malibu Wakesetter 23 LSV. Happy to help. What can I tell you about it?",
    "It's running the Indmar Raptor 575 — 0-30 in about 4.2 seconds. Towing 3,400 lbs with the ballast loaded. Pretty quick boat.",
    "Yes, still on the lot. I actually have one in Pearl White and another in Carbon Black. Both same engine package. Which one's pulling at you?",
    "Sticker is $162,900, but the manager has some room on it. Want me to text you what we could do out the door with tax & title?",
    "Absolutely. Want me to book you a showing Tuesday morning? Mike (our GM) is in from 9 to noon.",
    "Booked — Tuesday 10 AM. I'm sending you a calendar invite now. Mike will text you Monday afternoon to confirm. Sleep well.",
  ];

  let demoState = {
    running: false,
    step: 0,
    timers: [],
  };

  function clearTimers() {
    demoState.timers.forEach(clearTimeout);
    demoState.timers = [];
  }

  function resetDemo() {
    clearTimers();
    demoState = { running: false, step: 0, timers: [] };
    if (phoneThread) {
      phoneThread.innerHTML =
        '<div class="s-phone-empty"><span>Enter a number and tap Text me</span><span class="s-phone-empty-sub">to see the conversation play out</span></div>';
    }
    if (tryScript) tryScript.innerHTML = '';
    if (tryStatus) {
      tryStatus.textContent = 'Idle';
      tryStatus.classList.remove('is-active');
    }
    if (trySend) {
      trySend.disabled = false;
      trySend.textContent = 'Text me';
    }
  }

  function appendPhoneMsg(role, text) {
    const msg = document.createElement('div');
    msg.className = `s-phone-msg is-${role}`;
    msg.textContent = text;
    phoneThread.appendChild(msg);
    requestAnimationFrame(() => msg.classList.add('is-visible'));
    phoneThread.scrollTop = phoneThread.scrollHeight;
    return msg;
  }

  function appendPhoneTyping() {
    const t = document.createElement('div');
    t.className = 's-phone-typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    phoneThread.appendChild(t);
    phoneThread.scrollTop = phoneThread.scrollHeight;
    return t;
  }

  function appendScriptBeat(idx) {
    if (!tryScriptBeats[idx]) return;
    const item = document.createElement('div');
    item.className = 's-try-script-item';
    item.innerHTML = `<div class="s-try-script-dot"></div><div class="s-try-script-text">${tryScriptBeats[idx].text}</div>`;
    tryScript.appendChild(item);
    requestAnimationFrame(() => item.classList.add('is-visible'));
  }

  function startDemo(phoneRaw) {
    if (demoState.running) return;
    resetDemo();
    demoState.running = true;
    if (tryStatus) {
      tryStatus.textContent = 'AI working…';
      tryStatus.classList.add('is-active');
    }
    if (trySend) {
      trySend.disabled = true;
      trySend.textContent = 'Texting you…';
    }
    if (phoneThread) phoneThread.innerHTML = '';

    // Beat 0: AI sees the inquiry
    demoState.timers.push(setTimeout(() => appendScriptBeat(0), 200));
    demoState.timers.push(setTimeout(() => appendScriptBeat(1), 900));
    demoState.timers.push(setTimeout(() => appendScriptBeat(2), 1600));

    // First AI message (after a typing indicator)
    demoState.timers.push(
      setTimeout(() => {
        const t = appendPhoneTyping();
        demoState.timers.push(
          setTimeout(() => {
            t.remove();
            appendPhoneMsg('in', aiReplies[0]);
          }, 1100)
        );
      }, 2200)
    );

    // From here, the buyer (user's surrogate) replies, AI responds, looping the scripted thread
    const beatOrder = [
      { delay: 4800,  buyer: 0, ai: 1, scriptBeat: null },        // engine package
      { delay: 9200,  buyer: 1, ai: 2, scriptBeat: 3 },           // availability + color
      { delay: 14200, buyer: 2, ai: 3, scriptBeat: null },        // best price
      { delay: 19200, buyer: 3, ai: 4, scriptBeat: 4 },           // saturday showing
      { delay: 24400, buyer: 4, ai: 5, scriptBeat: 5 },           // book it
    ];

    beatOrder.forEach((b) => {
      // buyer message (outbound from phone POV)
      demoState.timers.push(
        setTimeout(() => {
          appendPhoneMsg('out', buyerResponses[b.buyer]);
        }, b.delay)
      );
      // typing then AI reply
      demoState.timers.push(
        setTimeout(() => {
          const t = appendPhoneTyping();
          demoState.timers.push(
            setTimeout(() => {
              t.remove();
              appendPhoneMsg('in', aiReplies[b.ai]);
            }, 1300)
          );
        }, b.delay + 1400)
      );
      // optional script beat
      if (b.scriptBeat !== null) {
        demoState.timers.push(setTimeout(() => appendScriptBeat(b.scriptBeat), b.delay + 700));
      }
    });

    // Final beat — done
    demoState.timers.push(
      setTimeout(() => {
        appendScriptBeat(6);
        if (tryStatus) {
          tryStatus.textContent = 'Showing booked ✓';
        }
        if (trySend) {
          trySend.disabled = false;
          trySend.textContent = 'Run it again';
        }
        demoState.running = false;
      }, 30200)
    );
  }

  // Wire input + buttons
  if (trySend) {
    trySend.addEventListener('click', () => {
      const num = tryInput && tryInput.value.trim();
      if (!num || num.length < 7) {
        if (tryInput) {
          tryInput.style.borderColor = 'var(--accent)';
          tryInput.focus();
          setTimeout(() => (tryInput.style.borderColor = ''), 1000);
        }
        return;
      }
      startDemo(num);
    });
  }

  if (tryReset) {
    tryReset.addEventListener('click', resetDemo);
  }

  if (tryInput) {
    tryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        trySend.click();
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────
     ACT 4 BEAT 5  —  Live ROI calculator
     Inputs: leads/mo, current close rate, margin per deal
     Outputs: today vs with-DealerEdge deals + revenue + annual lift
     Math anchor: Pied Piper ILE Study — dealers improving response
     score (<40 → >80) sell 50% more units from the same leads.
     ───────────────────────────────────────────────────────────── */
  const fmt = (n) =>
    Math.round(n).toLocaleString('en-US');
  const fmt1 = (n) => (Math.round(n * 10) / 10).toLocaleString('en-US');

  function paintRange(input) {
    const v = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.background = `linear-gradient(90deg, var(--good) 0%, var(--good) ${v}%, var(--line) ${v}%, var(--line) 100%)`;
  }

  function updateROI() {
    const leadsEl = document.getElementById('roi-leads');
    const closeEl = document.getElementById('roi-close');
    const marginEl = document.getElementById('roi-margin');
    if (!leadsEl || !closeEl || !marginEl) return;

    const leads = +leadsEl.value;
    const closeRate = +closeEl.value; // %
    const margin = +marginEl.value;

    // Conservative close-rate lift: 1.5x (50% more from same leads)
    const liftMultiplier = 1.5;
    const closeRateWith = Math.min(100, closeRate * liftMultiplier);

    const dealsNow = leads * (closeRate / 100);
    const dealsWith = leads * (closeRateWith / 100);
    const revNow = dealsNow * margin;
    const revWith = dealsWith * margin;
    const annualLift = (revWith - revNow) * 12;

    // value labels
    document.getElementById('roi-leads-val').textContent = leads;
    document.getElementById('roi-close-val').textContent = closeRate;
    document.getElementById('roi-margin-val').textContent = fmt(margin);

    // result cells
    document.getElementById('roi-now-deals').textContent = fmt1(dealsNow);
    document.getElementById('roi-de-deals').textContent = fmt1(dealsWith);
    document.getElementById('roi-now-rev').textContent = fmt(revNow);
    document.getElementById('roi-de-rev').textContent = fmt(revWith);
    document.getElementById('roi-lift').textContent = fmt(annualLift);

    // range fill
    paintRange(leadsEl);
    paintRange(closeEl);
    paintRange(marginEl);
  }

  ['roi-leads', 'roi-close', 'roi-margin'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateROI);
    }
  });
  // initial paint
  updateROI();

  /* ─────────────────────────────────────────────────────────────
     NAVBAR — same scroll-hide behavior as rest of site
     ───────────────────────────────────────────────────────────── */
  const navbar = document.getElementById('navbar');
  let lastY = 0;
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      if (navbar) {
        if (y > 80) navbar.classList.add('is-scrolled');
        else navbar.classList.remove('is-scrolled');
      }
      lastY = y;
    },
    { passive: true }
  );
})();
