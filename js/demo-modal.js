/* Demo request modal — name, email, phone → confirmation */
function initDemoModal(lenis) {
  const backdrop = document.getElementById('modal-backdrop');
  const modal = document.getElementById('modal');
  const closeBtn = document.getElementById('modal-close');
  if (!backdrop || !modal) return;

  const stepForm = document.getElementById('ms-step-1');
  const stepConfirm = document.getElementById('ms-step-2');
  const nameInput = document.getElementById('ms-name');
  const emailInput = document.getElementById('ms-email');
  const phoneInput = document.getElementById('ms-phone');
  const submitBtn = document.getElementById('ms-submit');
  const confirmText = document.getElementById('ms-confirm-text');
  const doneBtn = document.getElementById('ms-done');
  if (!stepForm || !stepConfirm || !nameInput || !emailInput || !phoneInput || !submitBtn) return;

  function showStep(n) {
    stepForm.classList.toggle('ms-step--hidden', n !== 1);
    stepConfirm.classList.toggle('ms-step--hidden', n !== 2);
    if (n === 1) setTimeout(() => nameInput.focus(), 80);
  }

  function launchConfetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = modal.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const COLORS = ['#ee3a39', '#ff6b6a', '#cc2222', '#ff9999', '#ff4444', '#ffffff', '#ffcccc'];
    const particles = Array.from({ length: 140 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 6 + Math.random() * 14;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        w: 5 + Math.random() * 8,
        h: 3 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.18,
        alpha: 0.85 + Math.random() * 0.15,
      };
    });

    let running = true;
    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.vx *= 0.985;
        p.vy += 0.35;
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      requestAnimationFrame(tick);
    }
    tick();
    setTimeout(() => {
      running = false;
      canvas.remove();
    }, 4000);
  }

  function submitForm() {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    if (!name) return nameInput.focus();
    if (!email) return emailInput.focus();
    if (!phone) return phoneInput.focus();

    if (confirmText) {
      confirmText.textContent = `Thanks, ${name}! We'll reach out at ${email} or ${phone} within one business day to schedule your demo.`;
    }
    showStep(2);
    setTimeout(launchConfetti, 80);
  }

  submitBtn.addEventListener('click', submitForm);
  [nameInput, emailInput, phoneInput].forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitForm();
      }
    });
  });
  doneBtn?.addEventListener('click', closeModal);

  function openModal(e) {
    e?.preventDefault();
    nameInput.value = '';
    emailInput.value = '';
    phoneInput.value = '';
    showStep(1);
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lenis?.stop?.();
    setTimeout(() => nameInput.focus(), 320);
  }

  function closeModal() {
    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lenis?.start?.();
  }

  document.querySelectorAll('.js-modal').forEach((btn) => btn.addEventListener('click', openModal));
  closeBtn?.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('is-open')) closeModal();
  });
}
