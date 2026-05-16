// ─── CURSOR GLOW ───
(function () {
  const glow = document.getElementById('cursor-glow');
  if (!glow) return;
  let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
  let currentX = mouseX, currentY = mouseY;
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    glow.classList.add('visible');
  }, { passive: true });
  window.addEventListener('mouseleave', () => glow.classList.remove('visible'));
  function tick() {
    currentX += (mouseX - currentX) * 0.1;
    currentY += (mouseY - currentY) * 0.1;
    glow.style.transform = `translate(${currentX - 300}px, ${currentY - 300}px)`;
    requestAnimationFrame(tick);
  }
  tick();
}());

// ─── SMOOTH SCROLL ───
const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
gsap.registerPlugin(ScrollTrigger);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
lenis.on('scroll', ScrollTrigger.update);

// ─── NAVBAR ───
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ─── INIT ───
window.addEventListener('DOMContentLoaded', () => {

  // Custom cursor
  const cursor = document.getElementById('custom-cursor');
  if (cursor) {
    window.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    }, { passive: true });

    document.querySelectorAll('.csp-card').forEach(card => {
      card.addEventListener('mouseenter', () => cursor.classList.add('journey-active'));
      card.addEventListener('mouseleave', () => cursor.classList.remove('journey-active'));
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const id = card.dataset.csId;
        const img = card.querySelector('.csp-card-img');
        const rect = img.getBoundingClientRect();
        const overlay = document.createElement('div');
        overlay.style.cssText = `position:fixed;z-index:9998;background-image:url('${img.src}');background-size:cover;background-position:center;border-radius:20px;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;`;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        gsap.to(overlay, {
          top: 0, left: 0, width: '100vw', height: '100vh', borderRadius: 0,
          duration: 0.6, ease: 'power3.inOut',
          onComplete: () => { sessionStorage.setItem('csd-from-transition', '1'); window.location.href = `case-study.html?id=${id}`; }
        });
      });
    });
  }

  // Scroll fade-in for [data-fade] elements
  document.querySelectorAll('[data-fade]').forEach(el => {
    gsap.from(el, {
      opacity: 0,
      y: 28,
      duration: 0.75,
      delay: parseFloat(el.dataset.delay || 0),
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
      },
    });
  });

  // ─── CONTACT MODAL ───
  (function initModal() {
    const backdrop = document.getElementById('modal-backdrop');
    const modal    = document.getElementById('modal');
    const closeBtn = document.getElementById('modal-close');
    if (!backdrop || !modal) return;

    let userData = {};

    const DOT_STEPS = { 1: 1, 2: 2, 3: 3, 4: 3 };
    const dots = modal.querySelectorAll('.ms-dot');

    function showStep(n) {
      modal.querySelectorAll('.ms-step').forEach((s, i) => {
        s.classList.toggle('ms-step--hidden', i + 1 !== n);
      });
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

    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
    const TIMES  = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM'];
    let calView = new Date(); calView.setDate(1);

    function renderCal() {
      const el = document.getElementById('ms-calendar');
      const today = new Date(); today.setHours(0,0,0,0);
      const y = calView.getFullYear(), m = calView.getMonth();
      const firstDay = new Date(y, m, 1).getDay();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      let html = `<div class="cal-header">
        <button class="cal-nav" id="cal-prev">&#8592;</button>
        <span class="cal-month">${MONTHS[m]} ${y}</span>
        <button class="cal-nav" id="cal-next">&#8594;</button>
      </div><div class="cal-grid">
        ${DAYS.map(d => `<div class="cal-day-name">${d}</div>`).join('')}
        ${Array(firstDay).fill('<div></div>').join('')}`;
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(y, m, d);
        const past = date < today, weekend = date.getDay() === 0 || date.getDay() === 6;
        const sel  = userData.date && userData.date.toDateString() === date.toDateString();
        html += `<button class="cal-day${sel ? ' cal-day--selected' : ''}" data-ts="${date.getTime()}" ${past || weekend ? 'disabled' : ''}>${d}</button>`;
      }
      html += '</div>';
      el.innerHTML = html;
      el.querySelector('#cal-prev').addEventListener('click', () => { calView.setMonth(calView.getMonth() - 1); renderCal(); });
      el.querySelector('#cal-next').addEventListener('click', () => { calView.setMonth(calView.getMonth() + 1); renderCal(); });
      el.querySelectorAll('.cal-day:not(:disabled)').forEach(btn => {
        btn.addEventListener('click', () => { userData.date = new Date(+btn.dataset.ts); userData.time = null; renderCal(); renderTimes(); });
      });
    }

    function renderTimes() {
      const el = document.getElementById('ms-times');
      if (!userData.date) { el.innerHTML = ''; return; }
      el.innerHTML = TIMES.map(t => `<button class="ms-time-btn${userData.time === t ? ' ms-time-btn--selected' : ''}" data-time="${t}">${t}</button>`).join('');
      el.querySelectorAll('.ms-time-btn').forEach(btn => {
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
    modal.querySelector('#ms-no').addEventListener('click',  () => { userData.wantsSchedule = false; showConfirm(); });
    modal.querySelector('#ms-done').addEventListener('click', closeModal);
    modal.querySelector('#ms-name').addEventListener('keydown',  e => { if (e.key === 'Enter') modal.querySelector('#ms-next-1').click(); });
    modal.querySelector('#ms-email').addEventListener('keydown', e => { if (e.key === 'Enter') modal.querySelector('#ms-phone').focus(); });
    modal.querySelector('#ms-phone').addEventListener('keydown', e => { if (e.key === 'Enter') modal.querySelector('#ms-next-2').click(); });

    function openModal(e) {
      e.preventDefault();
      userData = {};
      modal.querySelectorAll('input').forEach(i => i.value = '');
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

    document.querySelectorAll('.js-modal').forEach(btn => btn.addEventListener('click', openModal));
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && backdrop.classList.contains('is-open')) closeModal(); });
  }());

});
