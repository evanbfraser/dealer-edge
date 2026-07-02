/* Demo request modal — name, email, phone → confirmation */
function initDemoModal(lenis) {
  function ensureDemoModalMarkup() {
    if (document.getElementById('modal-backdrop')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop" aria-hidden="true">
        <div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="demo-modal-title">
          <button class="modal-close" id="modal-close" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div class="ms-step" id="ms-step-1">
            <span class="modal-eyebrow">Schedule a Demo</span>
            <h2 class="ms-headline" id="demo-modal-title">Tell us how to reach you.</h2>
            <p class="ms-sub">We'll follow up within one business day to get your demo on the calendar.</p>
            <div class="form-group"><input type="text" id="ms-name" placeholder="Your name" aria-label="Your name" autocomplete="name"></div>
            <div class="form-group"><input type="email" id="ms-email" placeholder="Email address" aria-label="Email address" autocomplete="email"></div>
            <div class="form-group"><input type="tel" id="ms-phone" placeholder="Phone number" aria-label="Phone number" autocomplete="tel"></div>
            <p class="ms-error" id="ms-error" role="alert" hidden></p>
            <button class="btn-primary ms-next-btn" id="ms-submit" type="button">Schedule My Demo</button>
            <p class="ms-legal">By submitting, you agree to our <a href="/legal/privacy">Privacy Policy</a>.</p>
          </div>

          <div class="ms-step ms-step--hidden" id="ms-step-2">
            <div class="ms-confirm">
              <div class="ms-confirm-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 class="ms-confirm-title">You're all set!</h2>
              <p class="ms-confirm-text" id="ms-confirm-text"></p>
              <button class="btn-primary ms-next-btn" id="ms-done" type="button">Done</button>
            </div>
          </div>
        </div>
      </div>
    `.trim();
    document.body.appendChild(wrapper.firstElementChild);
  }

  ensureDemoModalMarkup();
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
  const errorEl = document.getElementById('ms-error');
  if (!stepForm || !stepConfirm || !nameInput || !emailInput || !phoneInput || !submitBtn) return;

  // Loose-but-real email shape check: requires a single @, a dot in the domain,
  // and no whitespace. Catches the "foo" case QA flagged while staying lenient.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function showError(msg, field) {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.hidden = false;
    }
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    }
  }

  function clearError() {
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
    [nameInput, emailInput, phoneInput].forEach((i) => i.removeAttribute('aria-invalid'));
  }

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
    clearError();
    if (!name) return showError('Please enter your name.', nameInput);
    if (!email) return showError('Please enter your email address.', emailInput);
    if (!EMAIL_RE.test(email)) return showError('Please enter a valid email address.', emailInput);
    if (!phone) return showError('Please enter your phone number.', phoneInput);

    const confirmSuccess = () => {
      if (confirmText) {
        confirmText.textContent = `Thanks, ${name}! We'll reach out at ${email} or ${phone} within one business day to schedule your demo.`;
      }
      showStep(2);
      setTimeout(launchConfetti, 80);
    };

    // Platform bridge: when hosted as an island, the route shell wraps the
    // fragment in [data-de-page] carrying the persistent visitor id — POST a
    // real lead into the platform pipeline. On the standalone static site
    // the wrapper doesn't exist and we confirm immediately. NEVER set the
    // x-website-hp header — it's the honeypot.
    //
    // The POST is AWAITED and validation failures are surfaced: the old
    // fire-and-forget confirmed "Thanks!" even when the API rejected the
    // submission (e.g. a phone format the server won't accept), silently
    // losing the lead. A NETWORK failure still confirms — don't dead-end a
    // real buyer over transient wiring.
    const bridge = document.querySelector('[data-de-page]');
    if (!bridge) {
      confirmSuccess();
      return;
    }

    submitBtn.disabled = true;
    fetch(bridge.dataset.leadsEndpoint || '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_id: bridge.dataset.visitorId || undefined,
        form_type: 'request_demo',
        form_data: { name, email, phone },
        page_url: window.location.pathname,
      }),
    }).then(async (res) => {
      submitBtn.disabled = false;
      if (res.ok) {
        confirmSuccess();
        return;
      }
      let message = 'Something went wrong — please check your details and try again.';
      let field = null;
      try {
        const body = await res.json();
        const first = body && body.errors && body.errors[0];
        if (first && first.field === 'phone') {
          message = 'Please enter a valid phone number, e.g. (425) 555-0123.';
          field = phoneInput;
        } else if (first && first.field === 'email') {
          message = 'Please enter a valid email address.';
          field = emailInput;
        } else if (first && first.message) {
          message = first.message;
        } else if (body && body.error && body.error !== 'Validation failed') {
          message = body.error;
        }
      } catch (e) { /* non-JSON error body — keep the generic message */ }
      showError(message, field || undefined);
    }).catch(() => {
      submitBtn.disabled = false;
      confirmSuccess();
    });
  }

  submitBtn.addEventListener('click', submitForm);
  [nameInput, emailInput, phoneInput].forEach((input) => {
    input.addEventListener('input', clearError);
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
    clearError();
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

  (window.DE?.on || ((t, e, f) => t.addEventListener(e, f)))(document, 'click', (e) => {
    if (e.target.closest('.js-modal')) openModal(e);
  });
  closeBtn?.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
  // long-lived document listener: route through the DE lifecycle when present
  // so an SPA host's DE.destroy() detaches it (fallback = plain listener)
  (window.DE?.on || ((t, e, f) => t.addEventListener(e, f)))(document, 'keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('is-open')) closeModal();
  });
}
