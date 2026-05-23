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
     HERO CASCADE  —  Physics-driven Killer Proof Chain
     A scroll-pinned 200vh section with a matter.js simulation:
     1,000 buyer-balls drop from the top, hit 3 filter walls
     (CWV / 24h response / voicemail) and 19 of them survive to
     a BOOKED container. Counters tick up in real time. Beat
     captions on the left activate as the user scrolls through
     the pin. Skipped entirely on mobile (canvas physics is a
     desktop experience); mobile shows a static counter version.
     ═════════════════════════════════════════════════════════════ */

  const cascadeSection = document.querySelector('.s-hero-cascade');
  if (cascadeSection) initHeroCascade(cascadeSection);

  function initHeroCascade(section) {
    const canvasWrap = section.querySelector('[data-canvas-wrap]');
    const canvasEl = section.querySelector('[data-cascade-canvas]');
    const stageLabels = section.querySelectorAll('[data-stage-label]');
    const beatCopies = section.querySelectorAll('[data-cbeat]');
    const counters = {
      arrived: section.querySelector('[data-cc="arrived"]'),
      lost:    section.querySelector('[data-cc="lost"]'),
      booked:  section.querySelector('[data-cc="booked"]'),
    };

    // ─── State ─────────────────────────────────────────────────
    const TARGET_TOTAL = 1000;      // Total buyers to spawn
    const RATES = {                  // pass-through rates per filter
      f1: 0.22,                      // 78% block on CWV → 22% survive
      f2: 0.43,                      // 57% no response → 43% survive
      f3: 0.20,                      // 80% voicemail walk → 20% survive
    };
    const counts = { arrived: 0, lost: 0, booked: 0 };

    function setCounter(key, value) {
      counts[key] = value;
      if (counters[key]) counters[key].textContent = value.toLocaleString('en-US');
    }
    function bump(key, delta = 1) {
      setCounter(key, counts[key] + delta);
    }

    // ─── Mobile fallback: simulate the math without canvas ───
    if (window.innerWidth < 1100 || !window.Matter) {
      // Just activate all 4 beat captions, animate the counters
      beatCopies.forEach((b) => b.classList.add('is-active'));
      stageLabels.forEach((l) => l.classList.add('is-active'));
      // Use IntersectionObserver to start counters when in view
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            obs.disconnect();
            animateCountersStatic();
          }
        });
      }, { threshold: 0.3 });
      obs.observe(section);
      return;
    }

    function animateCountersStatic() {
      const finalBooked = Math.round(TARGET_TOTAL * RATES.f1 * RATES.f2 * RATES.f3);
      const finalLost = TARGET_TOTAL - finalBooked;
      const start = performance.now();
      const dur = 2200;
      function step() {
        const t = Math.min(1, (performance.now() - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        setCounter('arrived', Math.round(TARGET_TOTAL * eased));
        setCounter('lost',    Math.round(finalLost   * eased));
        setCounter('booked',  Math.round(finalBooked * eased));
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    // ─── Matter.js physics setup ─────────────────────────────
    const M = window.Matter;
    const { Engine, Render, Runner, World, Bodies, Body, Events, Composite } = M;

    const engine = Engine.create({
      gravity: { x: 0, y: 1, scale: 0.0012 },
    });
    const world = engine.world;

    // Size the canvas to its wrapper
    function sizeCanvas() {
      const r = canvasWrap.getBoundingClientRect();
      canvasEl.width = r.width;
      canvasEl.height = r.height;
      return { w: r.width, h: r.height };
    }
    let { w, h } = sizeCanvas();

    const render = Render.create({
      canvas: canvasEl,
      engine: engine,
      options: {
        width: w,
        height: h,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio || 1,
      },
    });
    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Pause physics when the section is off-screen (CPU friendly)
    let physicsActive = true;
    const visObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          if (!physicsActive) { Runner.run(runner, engine); physicsActive = true; }
        } else {
          if (physicsActive) { Runner.stop(runner); physicsActive = false; }
        }
      });
    }, { threshold: 0 });
    visObs.observe(section);

    // ─── Build the world: walls + filters + sensors ──────────
    // Filter Y positions (as % of canvas height)
    const FILTER_Y = [0.30, 0.50, 0.70];   // 3 filters
    const BOOKED_Y = 0.93;                 // bottom container
    const WALL_T = 14;                     // wall thickness

    // Outer walls (left, right, bottom)
    const wallStyle = { isStatic: true, render: { fillStyle: 'transparent' } };
    Composite.add(world, [
      Bodies.rectangle(-WALL_T / 2,        h / 2,   WALL_T, h * 2, wallStyle),  // left
      Bodies.rectangle(w + WALL_T / 2,     h / 2,   WALL_T, h * 2, wallStyle),  // right
      Bodies.rectangle(w / 2,              h + WALL_T / 2, w * 2, WALL_T, wallStyle), // bottom
    ]);

    // Filter walls — each one is a wall with a centered gap.
    // gapW is sized to the survival rate; the rest is solid wall.
    const filterStyle = {
      isStatic: true,
      render: {
        fillStyle: 'rgba(238, 58, 57, 0.5)',
        strokeStyle: 'rgba(238, 58, 57, 0.8)',
        lineWidth: 1.5,
      },
    };
    const filters = []; // { y, gapLeft, gapRight, rate }
    FILTER_Y.forEach((yPct, i) => {
      const rate = [RATES.f1, RATES.f2, RATES.f3][i];
      const gapW = Math.max(28, w * rate * 0.85);  // gap a bit narrower than rate to compensate for bouncing
      const gapLeft  = (w - gapW) / 2;
      const gapRight = gapLeft + gapW;
      const yPx = h * yPct;
      const leftSegW = gapLeft;
      const rightSegW = w - gapRight;
      // left segment
      Composite.add(world, Bodies.rectangle(leftSegW / 2, yPx, leftSegW, 6, filterStyle));
      // right segment
      Composite.add(world, Bodies.rectangle(gapRight + rightSegW / 2, yPx, rightSegW, 6, filterStyle));
      filters.push({ yPx, gapLeft, gapRight, rate, idx: i });
    });

    // BOOKED container (a green-tinted rectangle drawn behind balls)
    // Visualized as a sensor strip + below-floor catcher
    const bookedZone = Bodies.rectangle(w / 2, h * BOOKED_Y, w * 0.42, 4, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: 'rgba(74, 222, 128, 0.35)' },
    });
    Composite.add(world, bookedZone);

    // Sensor strips RIGHT below each filter — when a ball crosses, it
    // means it passed through the gap (color upgrade). When it hits
    // a filter wall, the collision event downgrades it to red.
    // We use Events to detect "ball passed line N" via Y position.

    // ─── Spawn buyers ────────────────────────────────────────
    const BALL_R = 4;
    const SPAWN_INTERVAL_MS = 30;       // ~33/sec → 1000 in ~30s
    const SPAWN_BURST_GAP = 90;         // small pause between bursts
    const STAGE_COLORS = ['rgba(255,255,255,0.85)', '#fbbf24', '#fb923c', '#86efac', '#4ade80'];
    const REJECT_COLOR = '#ee3a39';
    let spawned = 0;
    let spawnTimer = null;

    function spawnBall() {
      if (spawned >= TARGET_TOTAL) {
        clearInterval(spawnTimer);
        return;
      }
      spawned += 1;
      bump('arrived');
      const x = w * 0.5 + (Math.random() - 0.5) * w * 0.6;
      const b = Bodies.circle(x, 12, BALL_R, {
        restitution: 0.45,
        friction: 0.005,
        frictionAir: 0.012,
        density: 0.002,
        render: { fillStyle: STAGE_COLORS[0] },
      });
      b.stage = 0;             // 0 = just spawned; 1-3 after each filter; 4 = booked; -1 = rejected
      b.counted = false;       // has it been counted as lost yet?
      Composite.add(world, b);
    }

    // Collision events: detect rejection (hit filter wall) and passage (cross filter Y)
    Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const a = pair.bodyA, b = pair.bodyB;
        // Ball hits filter wall → reject (downgrade to red, mark lost)
        [
          [a, b], [b, a],
        ].forEach(([ball, other]) => {
          if (ball.label === 'Circle Body' && other.isStatic && !other.isSensor) {
            // It hit a wall — check if it's a filter wall (between 0 and h-WALL_T)
            const wallY = other.position.y;
            if (wallY > 12 && wallY < h * 0.78 && ball.stage >= 0 && !ball.counted) {
              const filter = filters.find((f) => Math.abs(f.yPx - wallY) < 8);
              if (filter && ball.stage <= filter.idx) {
                ball.stage = -1;
                ball.render.fillStyle = REJECT_COLOR;
                ball.counted = true;
                bump('lost');
                // Give a small horizontal kick so they slide off to a side
                const dir = ball.position.x < w / 2 ? -1 : 1;
                Body.applyForce(ball, ball.position, { x: dir * 0.0005, y: 0 });
              }
            }
          }
        });
        // Ball reaches booked zone
        if ((a === bookedZone || b === bookedZone)) {
          const ball = a === bookedZone ? b : a;
          if (ball.label === 'Circle Body' && ball.stage >= 3 && ball.stage !== 4) {
            ball.stage = 4;
            ball.render.fillStyle = STAGE_COLORS[4];
            bump('booked');
          }
        }
      });
    });

    // On each engine update, check ball positions vs filter Ys to upgrade colors
    // (we detect "ball crossed filter Y while in the gap" — only those pass)
    Events.on(engine, 'beforeUpdate', () => {
      Composite.allBodies(world).forEach((body) => {
        if (body.label !== 'Circle Body' || body.stage < 0 || body.stage >= 4) return;
        for (let i = body.stage; i < filters.length; i += 1) {
          const f = filters[i];
          // ball is below this filter and inside the gap → upgrade stage
          if (body.position.y > f.yPx + 4 && body.position.x > f.gapLeft && body.position.x < f.gapRight && body.stage === i) {
            body.stage = i + 1;
            body.render.fillStyle = STAGE_COLORS[i + 1];
          }
        }
        // If a ball is below the booked zone but never got there, count as lost
        if (body.position.y > h - 10 && !body.counted) {
          if (body.stage < 3) {
            body.stage = -1;
            body.render.fillStyle = REJECT_COLOR;
            body.counted = true;
            bump('lost');
          }
        }
        // Cleanup: bodies that fall way off-screen
        if (body.position.y > h + 80) {
          Composite.remove(world, body);
        }
      });
    });

    // Kick off spawning once the section enters the viewport
    const spawnObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !spawnTimer) {
          spawnTimer = setInterval(spawnBall, SPAWN_INTERVAL_MS);
          spawnObs.disconnect();
        }
      });
    }, { threshold: 0.15 });
    spawnObs.observe(section);

    // ─── Scroll trigger: activate beat captions sequentially ──
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: false,
      onUpdate: (self) => {
        // Map progress 0→1 to beat 0-3 active
        const p = self.progress;
        const activeIdx = Math.min(3, Math.floor(p * 4.001));
        beatCopies.forEach((b, i) => b.classList.toggle('is-active', i <= activeIdx));
        stageLabels.forEach((l, i) => l.classList.toggle('is-active', i <= activeIdx));
      },
    });
    // Initially: only beat 0 active
    beatCopies.forEach((b, i) => b.classList.toggle('is-active', i === 0));
    stageLabels.forEach((l, i) => l.classList.toggle('is-active', i === 0));

    // ─── Resize handling ─────────────────────────────────────
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const dim = sizeCanvas();
        render.canvas.width = dim.w;
        render.canvas.height = dim.h;
        render.options.width = dim.w;
        render.options.height = dim.h;
        // (Filter positions don't auto-resize; reload to redraw correctly)
      }, 250);
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
