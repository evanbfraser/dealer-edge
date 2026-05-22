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

  /* ─────────────────────────────────────────────────────────────
     HERO HEADLINE — strike-through reveal after a beat
     ───────────────────────────────────────────────────────────── */
  const heroHeadline = document.querySelector('.s-hero-headline');
  if (heroHeadline) {
    setTimeout(() => heroHeadline.classList.add('is-revealed'), 1200);
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
