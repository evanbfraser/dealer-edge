/* ───────────────────────────────────────────────────────────────────────
   features.js — the "system overview" page.
   Reuses the shared chassis (js/de-core.js): Lenis + cursor + nav + fade +
   the DE.initActs scroll controller. The system-loop act is one persistent
   scene; each beat just calls setLoopStage(N) to advance which nodes/arcs
   are lit. Also owns the contact modal + the department-chat modal.
   ─────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const lenis = DE.createLenis();

  initMobileNav();
  DE.initCursorGlow();
  DE.initNavScroll();
  DE.initFade();
  if (typeof initVideoBoatSections === 'function') {
    initVideoBoatSections();
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', initVideoBoatSections);
  }

  // ─── SYSTEM LOOP ───────────────────────────────────────────────────
  // The scene persists; setLoopStage(n) is idempotent + absolute (lights
  // everything with data-order <= n, dims the rest), so scrolling up
  // reverses cleanly. n: 0 = broken, 1..4 = build, 5 = closed flywheel.
  const loopStage = document.querySelector('[data-loop-stage]');
  if (loopStage) buildLoopFX(loopStage);
  // scope spans the sticky so the metric (a sibling of the loop stage) still lights
  const loopScope = loopStage ? (loopStage.closest('.de-act-stage-sticky') || loopStage) : null;
  const loopEls = loopScope ? [...loopScope.querySelectorAll('[data-order]')] : [];

  // Premium FX: a faint always-on base circuit behind each arc, a bright
  // "packet" layer that flows along it once lit, and ambient particles.
  // Base layers drop data-order (always faint); flow layers keep it so
  // setLoopStage lights them in step with the arc they trace.
  function buildLoopFX(stage) {
    const svg = stage.querySelector('.f-traces');
    if (svg) {
      [...svg.querySelectorAll('.f-arc')].forEach((arc) => {
        const base = arc.cloneNode();
        base.removeAttribute('data-order');
        base.setAttribute('class', 'f-arc-base');
        svg.insertBefore(base, svg.firstChild);
        const flow = arc.cloneNode();
        flow.setAttribute('class', 'f-arc-flow'); // keeps data-order → lights with its arc
        svg.appendChild(flow);
      });
    }
    const field = document.createElement('div');
    field.className = 'f-particles';
    field.setAttribute('aria-hidden', 'true');
    [[12, 22], [27, 68], [44, 14], [63, 82], [78, 30], [88, 58], [8, 46], [70, 12], [34, 88], [92, 26], [54, 38], [20, 80]]
      .forEach(([x, y], i) => {
        const d = document.createElement('span');
        d.className = 'f-particle';
        d.style.cssText = `left:${x}%;top:${y}%;--dur:${7 + (i % 5)}s;--dly:-${(i * 0.7).toFixed(1)}s`;
        field.appendChild(d);
      });
    stage.insertBefore(field, stage.firstChild);
  }

  function setLoopStage(n) {
    if (!loopStage) return;
    loopStage.classList.toggle('is-broken', n === 0);
    loopStage.classList.toggle('is-flywheel', n >= 5);
    loopStage.classList.toggle('is-closed', n >= 5);
    loopEls.forEach((el) => {
      const lit = n >= 1 && Number(el.dataset.order) <= n;
      el.classList.toggle('is-lit', lit);
    });
    // safety: once we're past the Sales beat, make sure its SMS is shown even if
    // the type-in handler didn't run (e.g. a scroll jump straight to the end)
    if (n >= 4) {
      document.querySelectorAll('.f-node--sales .f-sms-bubble, .f-node--sales .f-sms-stamp')
        .forEach((el) => el.classList.add('is-in'));
    }
    setDetail(n);
  }

  // active-node detail (mobile): the real proof for the current beat. Per node:
  // inventory = before→after loop, sales = SMS that types in, others = the screenshot.
  const detailEl = document.querySelector('[data-detail]');

  // type the SMS bubbles in — used by the Sales NODE on desktop and its detail card on mobile
  function animateSMS(scope) {
    if (!scope) return;
    const items = [...scope.querySelectorAll('.f-sms-bubble, .f-sms-stamp')];
    if (!items.length) return;
    items.forEach((el) => el.classList.remove('is-in'));
    const delays = DE.reduceMotion ? [0, 0, 0] : [250, 1150, 1700];
    items.forEach((el, i) => setTimeout(() => el.classList.add('is-in'), delays[i] != null ? delays[i] : 250 + i * 500));
  }

  // mobile detail card: clone the active node's panel (inventory = before/after,
  // sales = SMS, etc.). Desktop shows the nodes' own panels, so this is mobile-only.
  function setDetail(n) {
    if (!detailEl || !loopStage) return;
    const key = { 1: 'inventory', 2: 'marketing', 3: 'sales', 4: 'analytics' }[n];
    if (!key) { detailEl.classList.remove('is-shown'); detailEl.removeAttribute('data-node'); return; }
    if (detailEl.dataset.node !== key) {
      detailEl.dataset.node = key;
      const win = loopStage.querySelector('.f-node--' + key + ' .f-win');
      detailEl.innerHTML = win ? win.outerHTML : '';
      if (key === 'sales') animateSMS(detailEl);
    }
    detailEl.classList.add('is-shown');
  }

  // the compounding payoff: count the metric up as the wheel spins (final beat)
  function runMetric(stillCurrent) {
    const el = document.querySelector('.f-metric [data-count]');
    if (!el) return;
    const end = Number(el.dataset.count) || 0;
    if (DE.reduceMotion) { el.textContent = '+' + end; return; }
    const dur = 2200;
    let startT = null;
    el.textContent = '+0';
    function step(now) {
      if (typeof stillCurrent === 'function' && !stillCurrent()) return;
      if (startT === null) startT = now;
      const t = Math.min(1, (now - startT) / dur);
      el.textContent = '+' + Math.round((1 - Math.pow(1 - t, 3)) * end);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const animCleanups = new WeakMap();

  const BEAT_ANIMS = {
    'f-loop-broken': () => setLoopStage(0),
    'f-loop-1': () => setLoopStage(1),
    'f-loop-2': () => setLoopStage(2),
    'f-loop-3': () => { setLoopStage(3); animateSMS(document.querySelector('.f-node--sales')); },
    'f-loop-4': () => setLoopStage(4),
    'f-loop-5': (beatEl, stillCurrent) => { setLoopStage(5); runMetric(stillCurrent); },
  };

  // Must run AFTER the BEAT_ANIMS declaration (TDZ).
  DE.initActs(lenis, { anims: BEAT_ANIMS, cleanups: animCleanups });

  // ─── DEPARTMENTS (id/name/icon only — drives the chat modal list) ───
  const DEPARTMENTS = [
    { id: 'marketing', name: 'Marketing', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>` },
    { id: 'sales', name: 'Sales', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>` },
    { id: 'inventory', name: 'Inventory', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z"/><polyline points="2.32 6.16 12 11 21.68 6.16"/><line x1="12" y1="22.76" x2="12" y2="11"/></svg>` },
    { id: 'service', name: 'Service', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>` },
    { id: 'analytics', name: 'Analytics', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>` },
  ];

  // ─── DEPARTMENT CHAT MODAL ──────────────────────────────────────────
  (function initDeptModal() {
    const backdrop = document.getElementById('dm-backdrop');
    const modal = document.getElementById('dm-modal');
    const closeBtn = document.getElementById('dm-close');
    if (!backdrop || !modal) return;

    const DEPT_INSIGHTS = {
      marketing: {
        headline: 'Attract more buyers before they find your competitors.',
        body: 'Your marketing team gets a full AI engine, from ad creation to content to syndication across every channel.',
        points: [
          'AI-generated ads for Google, Meta & YouTube, tested and optimized automatically',
          'SEO and AIO content that ranks in search results and AI overviews',
          'Inventory listings pushed to Boat Trader, YachtWorld & more in real time',
        ],
        stat: 'More qualified demand, in',
      },
      sales: {
        headline: 'Close more deals without adding a single headcount.',
        body: 'Every lead gets a response in seconds, 24/7. Your team shows up to qualified conversations, the AI handles everything before.',
        points: [
          'Inquiries answered in seconds, around the clock including weekends',
          'Smart follow-up sequences that adapt to each buyer\'s behavior',
          'Lead scoring so your team always works the hottest prospects first',
        ],
        stat: 'Faster response, out',
      },
      inventory: {
        headline: 'Every boat sales-ready, automatically.',
        body: 'From your DMS to a polished listing everywhere buyers look, your inventory team gets every unit online complete and consistent.',
        points: [
          'Synced from your DMS with specs auto-populated per unit',
          'AI-written descriptions and studio-grade photos for every boat',
          'Syndicated to Boat Trader, YachtWorld, Facebook Marketplace & more',
        ],
        stat: 'Every boat, sales-ready',
      },
      service: {
        headline: 'Turn every service visit into a long-term relationship.',
        body: 'Automated reminders, AI-surfaced upsells, and re-engagement campaigns keep customers coming back without your service team lifting a finger.',
        points: [
          'Timed service reminders by mileage and seasonal intervals across SMS and email',
          'AI-surfaced upsell opportunities served directly to your service advisors',
          'Automated win-back campaigns for customers who haven\'t visited in 6–12 months',
        ],
        stat: 'More repeat customers',
      },
      analytics: {
        headline: 'See everything happening across your dealership in one place.',
        body: 'One live dashboard for every KPI, leads, response times, conversions, and revenue, with zero manual reporting.',
        points: [
          'Unified dashboard with live data across every channel and department',
          'Full attribution from campaign to closed deal',
          'The AI acts on it continuously, on real data',
        ],
        stat: 'Optimize to sold boats',
      },
    };

    const DEPT_CHAT_REPLIES = {
      marketing: 'That\'s a challenge we hear from almost every marketing team. DealerEdge handles ad creation, testing, and optimization automatically so you stop burning budget on underperforming creative and start seeing consistent ROI.',
      sales: 'Speed is everything in sales, and that\'s exactly what DealerEdge solves. Every inbound lead gets a response in seconds, around the clock, so your team only shows up to conversations that are already warm.',
      inventory: 'Getting every unit online, complete and consistent, is a grind by hand. DealerEdge syncs straight from your DMS, writes the listings, cleans up the photos, and syndicates everywhere buyers look.',
      service: 'Keeping customers coming back takes consistent follow-up, which is hard to do manually at scale. DealerEdge automates reminders, upsell prompts, and win-back campaigns so your service bay stays full.',
      analytics: 'Flying blind across departments is one of the most common issues we solve. DealerEdge brings every KPI into one live dashboard so you always know exactly what\'s working and where to push harder.',
    };

    let selectedDept = null;
    let selectedDeptName = null;
    let userData = {};
    let chatPhase = 0;

    const deptListEl = document.getElementById('dm-dept-list');
    DEPARTMENTS.forEach((dept) => {
      const btn = document.createElement('button');
      btn.className = 'dm-dept-option';
      btn.dataset.dept = dept.id;
      btn.innerHTML = `
        <span class="dm-dept-option-icon">${dept.icon}</span>
        <span>${dept.name}</span>
        <svg class="dm-dept-option-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      `;
      btn.addEventListener('click', () => selectDept(dept.id, dept.name));
      deptListEl.appendChild(btn);
    });

    function selectDept(id, name) {
      selectedDept = id;
      selectedDeptName = name;
      const insight = DEPT_INSIGHTS[id];

      document.getElementById('dm-insight').innerHTML = `
        <p class="dm-insight-eyebrow">${name} Department</p>
        <p class="dm-insight-headline">${insight.headline}</p>
        <p class="dm-insight-body">${insight.body}</p>
        <ul class="dm-insight-points">
          ${insight.points.map((p) => `<li>${p}</li>`).join('')}
        </ul>
        <span class="dm-insight-stat">${insight.stat}</span>
      `;

      document.getElementById('dm-dept-eyebrow').textContent = `${name} Department`;
      document.getElementById('dm-dept-eyebrow-2').textContent = `${name} Department`;

      showDmStep(2);
    }

    function showDmStep(n) {
      modal.querySelectorAll('.ms-step').forEach((s, i) => {
        s.classList.toggle('ms-step--hidden', i + 1 !== n);
      });
      setTimeout(() => modal.querySelector('.ms-step:not(.ms-step--hidden) input')?.focus(), 80);
    }

    function appendMsg(text, type) {
      const msgs = document.getElementById('dm-chat-messages');
      const el = document.createElement('div');
      el.className = `dm-chat-msg dm-chat-msg--${type}`;
      el.textContent = text;
      msgs.appendChild(el);
      msgs.scrollTop = msgs.scrollHeight;
      return el;
    }

    function showTyping() {
      const msgs = document.getElementById('dm-chat-messages');
      const el = document.createElement('div');
      el.className = 'dm-chat-msg dm-chat-msg--bot dm-chat-typing';
      el.innerHTML = '<span></span><span></span><span></span>';
      msgs.appendChild(el);
      msgs.scrollTop = msgs.scrollHeight;
      return el;
    }

    function startChat() {
      const msgs = document.getElementById('dm-chat-messages');
      msgs.innerHTML = '';
      chatPhase = 0;
      const input = document.getElementById('dm-chat-input');
      input.value = '';
      input.disabled = true;
      document.getElementById('dm-chat-send').disabled = true;
      showDmStep(3);

      setTimeout(() => {
        const typing = showTyping();
        setTimeout(() => {
          typing.remove();
          appendMsg(`What are the specific frustrations in your ${selectedDeptName} department?`, 'bot');
          input.disabled = false;
          document.getElementById('dm-chat-send').disabled = false;
          input.focus();
        }, 900);
      }, 400);
    }

    function sendChatMessage() {
      const input = document.getElementById('dm-chat-input');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      input.disabled = true;
      document.getElementById('dm-chat-send').disabled = true;

      appendMsg(text, 'user');

      if (chatPhase === 0) {
        chatPhase = 1;
        setTimeout(() => {
          const typing = showTyping();
          setTimeout(() => {
            typing.remove();
            appendMsg(DEPT_CHAT_REPLIES[selectedDept] || 'Thanks for sharing. Let me connect you with the right person.', 'bot');
            setTimeout(() => {
              appendMsg('Just need a couple quick details to connect you with the right specialist.', 'bot');
              const msgs = document.getElementById('dm-chat-messages');
              const continueBtn = document.createElement('button');
              continueBtn.className = 'dm-chat-continue';
              continueBtn.innerHTML = `Let's do it <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
              continueBtn.addEventListener('click', () => showDmStep(4));
              msgs.appendChild(continueBtn);
              msgs.scrollTop = msgs.scrollHeight;
            }, 600);
          }, 1100);
        }, 500);
      }
    }

    document.getElementById('dm-chat-send').addEventListener('click', sendChatMessage);
    document.getElementById('dm-chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendChatMessage();
    });

    document.getElementById('dm-back').addEventListener('click', () => showDmStep(1));
    document.getElementById('dm-next-2').addEventListener('click', startChat);

    document.getElementById('dm-next-4').addEventListener('click', () => {
      const val = document.getElementById('dm-name').value.trim();
      if (!val) return document.getElementById('dm-name').focus();
      userData.name = val;
      document.getElementById('dm-name-display').textContent = val;
      showDmStep(5);
    });

    document.getElementById('dm-next-5').addEventListener('click', () => {
      const email = document.getElementById('dm-email').value.trim();
      if (!email) return document.getElementById('dm-email').focus();
      userData.email = email;
      userData.phone = document.getElementById('dm-phone').value.trim();
      document.getElementById('dm-confirm-text').textContent =
        `Thanks, ${userData.name}! A specialist from our ${selectedDeptName} team will reach out to ${userData.email} within one business day.`;
      showDmStep(6);
    });

    document.getElementById('dm-done').addEventListener('click', closeDeptModal);

    document.getElementById('dm-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('dm-next-4').click(); });
    document.getElementById('dm-email').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('dm-phone').focus(); });
    document.getElementById('dm-phone').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('dm-next-5').click(); });

    function openDeptModal(e) {
      e.preventDefault();
      selectedDept = null;
      selectedDeptName = null;
      userData = {};
      chatPhase = 0;
      modal.querySelectorAll('input').forEach((i) => (i.value = ''));
      showDmStep(1);
      backdrop.classList.add('is-open');
      backdrop.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      lenis.stop();
    }

    function closeDeptModal() {
      backdrop.classList.remove('is-open');
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lenis.start();
    }

    document.querySelectorAll('.js-dept-modal').forEach((btn) => btn.addEventListener('click', openDeptModal));
    closeBtn.addEventListener('click', closeDeptModal);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeDeptModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && backdrop.classList.contains('is-open')) closeDeptModal(); });
  }());

  // ─── CONTACT MODAL ──────────────────────────────────────────────────
  (function initModal() {
    const backdrop = document.getElementById('modal-backdrop');
    const modal = document.getElementById('modal');
    const closeBtn = document.getElementById('modal-close');
    if (!backdrop || !modal) return;

    let userData = {};
    const DOT_STEPS = { 1: 1, 2: 2, 3: 3, 4: 3 };
    const dots = modal.querySelectorAll('.ms-dot');

    function showStep(n) {
      modal.querySelectorAll('.ms-step').forEach((s, i) => s.classList.toggle('ms-step--hidden', i + 1 !== n));
      const active = DOT_STEPS[n] || n;
      dots.forEach((d, i) => {
        const dotN = i + 1;
        d.classList.remove('is-active', 'is-done');
        if (dotN === active) d.classList.add('is-active');
        else if (dotN < active) d.classList.add('is-done');
      });
      modal.querySelector('#ms-dots').style.display = n === 5 ? 'none' : 'flex';
      setTimeout(() => modal.querySelector('.ms-step:not(.ms-step--hidden) input')?.focus(), 80);
    }

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const TIMES = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM'];
    let calView = new Date();
    calView.setDate(1);

    function renderCal() {
      const el = document.getElementById('ms-calendar');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const y = calView.getFullYear();
      const m = calView.getMonth();
      const firstDay = new Date(y, m, 1).getDay();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      let html = `<div class="cal-header"><button class="cal-nav" id="cal-prev">&#8592;</button><span class="cal-month">${MONTHS[m]} ${y}</span><button class="cal-nav" id="cal-next">&#8594;</button></div><div class="cal-grid">${DAYS.map((d) => `<div class="cal-day-name">${d}</div>`).join('')}${Array(firstDay).fill('<div></div>').join('')}`;
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(y, m, d);
        const past = date < today;
        const weekend = date.getDay() === 0 || date.getDay() === 6;
        const sel = userData.date && userData.date.toDateString() === date.toDateString();
        html += `<button class="cal-day${sel ? ' cal-day--selected' : ''}" data-ts="${date.getTime()}" ${past || weekend ? 'disabled' : ''}>${d}</button>`;
      }
      html += '</div>';
      el.innerHTML = html;
      el.querySelector('#cal-prev').addEventListener('click', () => { calView.setMonth(calView.getMonth() - 1); renderCal(); });
      el.querySelector('#cal-next').addEventListener('click', () => { calView.setMonth(calView.getMonth() + 1); renderCal(); });
      el.querySelectorAll('.cal-day:not(:disabled)').forEach((btn) => {
        btn.addEventListener('click', () => { userData.date = new Date(+btn.dataset.ts); userData.time = null; renderCal(); renderTimes(); });
      });
    }

    function renderTimes() {
      const el = document.getElementById('ms-times');
      if (!userData.date) { el.innerHTML = ''; return; }
      el.innerHTML = TIMES.map((t) => `<button class="ms-time-btn${userData.time === t ? ' ms-time-btn--selected' : ''}" data-time="${t}">${t}</button>`).join('');
      el.querySelectorAll('.ms-time-btn').forEach((btn) => {
        btn.addEventListener('click', () => { userData.time = btn.dataset.time; renderTimes(); setTimeout(() => showConfirm(), 380); });
      });
    }

    function showConfirm() {
      const el = document.getElementById('ms-confirm-text');
      if (userData.wantsSchedule && userData.date && userData.time) {
        const dateStr = userData.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        el.textContent = `You're booked for ${dateStr} at ${userData.time}. We'll send a confirmation to ${userData.email}.`;
      } else {
        el.textContent = `Thanks, ${userData.name}! Our team will reach out to ${userData.email} within one business day.`;
      }
      showStep(5);
    }

    modal.querySelector('#ms-next-1').addEventListener('click', () => {
      const val = modal.querySelector('#ms-name').value.trim();
      if (!val) return modal.querySelector('#ms-name').focus();
      userData.name = val;
      document.getElementById('ms-name-display').textContent = val;
      showStep(2);
    });
    modal.querySelector('#ms-next-2').addEventListener('click', () => {
      const email = modal.querySelector('#ms-email').value.trim();
      if (!email) return modal.querySelector('#ms-email').focus();
      userData.email = email;
      userData.phone = modal.querySelector('#ms-phone').value.trim();
      showStep(3);
    });
    modal.querySelector('#ms-yes').addEventListener('click', () => { userData.wantsSchedule = true; userData.date = null; userData.time = null; renderCal(); renderTimes(); showStep(4); });
    modal.querySelector('#ms-no').addEventListener('click', () => { userData.wantsSchedule = false; showConfirm(); });
    modal.querySelector('#ms-done').addEventListener('click', closeModal);
    modal.querySelector('#ms-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') modal.querySelector('#ms-next-1').click(); });
    modal.querySelector('#ms-email').addEventListener('keydown', (e) => { if (e.key === 'Enter') modal.querySelector('#ms-phone').focus(); });
    modal.querySelector('#ms-phone').addEventListener('keydown', (e) => { if (e.key === 'Enter') modal.querySelector('#ms-next-2').click(); });

    function openModal(e) {
      e.preventDefault();
      userData = {};
      modal.querySelectorAll('input').forEach((i) => (i.value = ''));
      showStep(1);
      backdrop.classList.add('is-open');
      backdrop.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      lenis.stop();
      setTimeout(() => modal.querySelector('#ms-name')?.focus(), 320);
    }

    function closeModal() {
      backdrop.classList.remove('is-open');
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lenis.start();
    }

    document.querySelectorAll('.js-modal').forEach((btn) => btn.addEventListener('click', openModal));
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && backdrop.classList.contains('is-open')) closeModal(); });
  }());

  ScrollTrigger.refresh();
})();
