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
     ACT 1 + ACT 2  —  scroll-pinned beat sequence
     Pin the inner section, advance through 4 beats as user scrolls.
     ───────────────────────────────────────────────────────────── */
  const acts = document.querySelectorAll('.s-act');

  acts.forEach((act) => {
    const inner = act.querySelector('.s-act-inner');
    const beats = act.querySelectorAll('.s-beat');
    const beatCopies = act.querySelectorAll('.s-act-beat');
    const totalBeats = beats.length;

    if (!inner || !beats.length) return;

    // Only pin on larger screens — on mobile we stack everything naturally
    if (window.innerWidth < 1100) return;

    function setActiveBeat(idx) {
      beats.forEach((b, i) => b.classList.toggle('is-active', i === idx));
      beatCopies.forEach((b, i) => b.classList.toggle('is-active', i === idx));

      // Trigger Act 2 beat 2 conversation when it becomes active
      if (act.id === 'act2' && idx === 1) {
        playAct2Convo();
      }
    }

    ScrollTrigger.create({
      trigger: act,
      start: 'top top',
      end: 'bottom bottom',
      scrub: false,
      onUpdate: (self) => {
        // self.progress goes 0 → 1 across the full act
        const p = self.progress;
        const idx = Math.min(totalBeats - 1, Math.floor(p * totalBeats));
        if (act._currentBeat !== idx) {
          act._currentBeat = idx;
          setActiveBeat(idx);
        }
      },
    });

    // initial state
    setActiveBeat(0);
  });

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
    { role: 'in',  text: "Yes — still on the lot. I have a 23 LSV in Pearl White and a 21 LX. Both same engine package. Want me to book you a Saturday morning showing?" },
    { role: 'out', text: "Sure. 10 AM Saturday?" },
    { role: 'in',  text: "Booked. 10 AM Saturday — both boats ready, Mike will meet you. Sending a calendar invite to john.c@gmail.com. Sleep well." },
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
    "Could I see it Saturday morning?",
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
    "Absolutely. Want me to book you a Saturday morning showing? Mike (our GM) is in from 9 to noon.",
    "Booked — Saturday 10 AM. I'm sending you a calendar invite now. Mike will text you Friday afternoon to confirm. Sleep well.",
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
     ACT 4  —  cycle the dashboard tabs to feel alive
     ───────────────────────────────────────────────────────────── */
  const tabs = document.querySelectorAll('.s-dash-tab');
  let tabIdx = 0;
  if (tabs.length) {
    setInterval(() => {
      tabs.forEach((t) => t.classList.remove('is-active'));
      tabIdx = (tabIdx + 1) % tabs.length;
      tabs[tabIdx].classList.add('is-active');
    }, 3400);
  }

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
