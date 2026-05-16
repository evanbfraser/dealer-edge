// ─── CURSOR GLOW (red ambient) ───
(function () {
  const glow = document.getElementById('cursor-glow');
  if (!glow) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
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

// ─── LENIS SMOOTH SCROLL ───
const lenis = new Lenis({
  lerp: 0.085,
  smoothWheel: true,
});

// Connect Lenis RAF to GSAP ticker for ScrollTrigger sync
gsap.registerPlugin(ScrollTrigger);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
lenis.on('scroll', ScrollTrigger.update);

// ─── NAVBAR SCROLL STATE ───
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ─── HERO ENTRANCE ANIMATION ───
function animateHero() {
  const content = document.getElementById('hero-content');
  if (!content) return;

  const eyebrow = content.querySelector('.hero-eyebrow');
  const headline = content.querySelector('.hero-headline');
  const sub = content.querySelector('.hero-sub');
  const actions = content.querySelector('.hero-actions');

  gsap.set(content, { opacity: 1 });

  gsap.timeline({ delay: 0.2 })
    .from(eyebrow,  { opacity: 0, y: 18, duration: 0.75, ease: 'power2.out' })
    .from(headline, { opacity: 0, y: 28, duration: 0.95, ease: 'power2.out' }, '-=0.45')
    .from(sub,      { opacity: 0, y: 20, duration: 0.85, ease: 'power2.out' }, '-=0.55')
    .from(actions,  { opacity: 0, y: 18, duration: 0.8,  ease: 'power2.out' }, '-=0.5');
}

// ─── SECTION ENTRANCE ANIMATIONS ───
function animateSections() {
  document.querySelectorAll('[data-animation]').forEach((el) => {
    const delay = parseFloat(el.getAttribute('data-delay') || '0');
    gsap.fromTo(
      el,
      { opacity: 0, y: 44 },
      {
        opacity: 1,
        y: 0,
        duration: 0.95,
        delay,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 87%',
          toggleActions: 'play none none none',
        },
      }
    );
  });
}

// ─── COUNTER ANIMATIONS ───
function animateCounters() {
  document.querySelectorAll('.stat-number').forEach((el) => {
    const end = parseInt(el.getAttribute('data-count'), 10);
    const obj = { val: 0 };
    gsap.to(obj, {
      val: end,
      duration: 2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true,
      },
      onUpdate() {
        el.textContent = Math.floor(obj.val);
      },
    });
  });
}

// ─── CANVAS FRAME SCRUBBING ───
const canvas = document.getElementById('hero-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const FRAME_COUNT = 192;
const IMAGE_SCALE = 1.32;
const images = [];
let loaded = 0;
let currentFrame = 1;

function preloadFrames() {
  for (let i = 1; i <= FRAME_COUNT; i++) {
    const img = new Image();
    img.src = `assets/frames/frame_${String(i).padStart(4, '0')}.webp`;
    img.onload = () => {
      loaded++;
      if (loaded === 1) requestAnimationFrame(() => drawFrame(1));
    };
    images.push(img);
  }
}

function drawFrame(idx) {
  if (!canvas || !ctx) return;
  const img = images[idx - 1];
  if (!img || !img.complete || img.naturalWidth === 0) return;

  // Size canvas to its container (the right panel), not the full window
  const container = canvas.parentElement;
  const w = (canvas.width = container ? container.offsetWidth : window.innerWidth);
  const h = (canvas.height = container ? container.offsetHeight : window.innerHeight);
  const scale = Math.min(w / img.width, h / img.height) * IMAGE_SCALE;
  const iw = img.width * scale;
  const ih = img.height * scale;

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
  currentFrame = idx;
}

function bindScrollToFrames() {
  if (!canvas) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const hero = document.getElementById('hero');
        if (!hero) { ticking = false; return; }

        const scrollY = Math.max(0, -hero.getBoundingClientRect().top);
        const maxScroll = window.innerHeight * 0.62;
        const progress = Math.min(1, scrollY / maxScroll);
        const frameIdx = Math.min(FRAME_COUNT, Math.max(1, Math.round(progress * (FRAME_COUNT - 1)) + 1));

        if (frameIdx !== currentFrame) drawFrame(frameIdx);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ─── RIPPLE EFFECT ───
function initRippleEffect() {
  const canvas = document.getElementById('ripple-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const SCALE = 0.5, DAMPING = 0.985, STRENGTH = 220, BRUSH = 6;
  let w = 0, h = 0, buf1, buf2, srcData, outImg;
  let mouseX = 0, mouseY = 0, hovering = false, lastAuto = 0;

  function setup(img) {
    const cssW = canvas.parentElement ? canvas.parentElement.offsetWidth : 0;
    if (!cssW || !img.naturalWidth) return false;
    const cssH = Math.round(cssW * img.naturalHeight / img.naturalWidth);
    w = Math.round(cssW * SCALE);
    h = Math.round(cssH * SCALE);
    canvas.width = w;
    canvas.height = h;
    canvas.style.height = cssH + 'px';
    buf1 = new Float32Array(w * h);
    buf2 = new Float32Array(w * h);
    outImg = ctx.createImageData(w, h);
    // Draw image to an offscreen canvas we own, then read pixels.
    // getImageData on an owned canvas is permitted on localhost (same-origin).
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const offCtx = off.getContext('2d');
    offCtx.drawImage(img, 0, 0, w, h);
    try {
      srcData = offCtx.getImageData(0, 0, w, h).data;
    } catch (e) {
      return false; // file:// strict security — graceful fallback to CSS bg
    }
    return true;
  }

  function disturb(ix, iy) {
    ix = Math.round(ix); iy = Math.round(iy);
    for (let dy = -BRUSH; dy <= BRUSH; dy++) {
      for (let dx = -BRUSH; dx <= BRUSH; dx++) {
        const nx = ix + dx, ny = iy + dy;
        if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) buf1[ny * w + nx] = STRENGTH;
      }
    }
  }

  function tick(ts) {
    requestAnimationFrame(tick);
    if (!w || !srcData) return;

    // Auto-disturb every 2s so ripples are visible without hovering
    if (ts - lastAuto > 2000) {
      disturb(
        w * 0.25 + Math.random() * w * 0.5,
        h * 0.25 + Math.random() * h * 0.5
      );
      lastAuto = ts;
    }

    // Wave physics
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        buf2[i] = (buf1[i - 1] + buf1[i + 1] + buf1[i - w] + buf1[i + w]) * 0.5 - buf2[i];
        buf2[i] *= DAMPING;
      }
    }
    const tmp = buf1; buf1 = buf2; buf2 = tmp;

    // Render: displace each pixel by the local wave gradient
    const dst = outImg.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        let sx = x, sy = y;
        if (x > 0 && x < w - 1 && y > 0 && y < h - 1) {
          sx = Math.max(0, Math.min(w - 1, Math.round(x + (buf1[i - 1] - buf1[i + 1]) * 0.025)));
          sy = Math.max(0, Math.min(h - 1, Math.round(y + (buf1[i - w] - buf1[i + w]) * 0.025)));
        }
        const si = (sy * w + sx) << 2;
        const di = i << 2;
        dst[di]     = srcData[si];
        dst[di + 1] = srcData[si + 1];
        dst[di + 2] = srcData[si + 2];
        dst[di + 3] = 255;
      }
    }
    ctx.putImageData(outImg, 0, 0);
  }

  const section = canvas.parentElement;
  section.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    if (r.width > 0) {
      mouseX = (e.clientX - r.left) * (w / r.width);
      mouseY = (e.clientY - r.top)  * (h / r.height);
    }
    if (hovering) disturb(mouseX, mouseY);
  }, { passive: true });
  section.addEventListener('mouseenter', () => { hovering = true; });
  section.addEventListener('mouseleave', () => { hovering = false; });
  window.addEventListener('resize', () => {
    if (img.complete && img.naturalWidth) setup(img);
  }, { passive: true });

  const img = new Image();
  img.onload = () => { setTimeout(() => { if (setup(img)) requestAnimationFrame(tick); }, 100); };
  img.src = 'assets/dealer-edge-case-studies-background.jpg';
}

// ─── VIDEO SECTION ───
function animateVideoSection() {
  const inner   = document.getElementById('video-inner');
  const overlay = document.getElementById('video-overlay-text');
  const section = document.getElementById('video-section');
  if (!inner || !section) return;

  // Expand from 800px to full viewport width on scroll
  gsap.to(inner, {
    width: '100vw',
    borderRadius: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top 65%',
      end: 'center center',
      scrub: 1,
    },
  });

  // Text fades in once image is centred in the viewport
  ScrollTrigger.create({
    trigger: inner,
    start: 'center center',
    onEnter:     () => overlay.classList.add('visible'),
    onLeaveBack: () => overlay.classList.remove('visible'),
  });
}

// ─── JOURNEY TIMELINE ───
function animateJourney() {
  const lineFill = document.querySelector('.journey-line-fill');
  const timeline = document.querySelector('.journey-timeline');
  if (!lineFill || !timeline) return;

  // Line grows downward as user scrolls through the section
  gsap.to(lineFill, {
    height: '100%',
    ease: 'none',
    scrollTrigger: {
      trigger: timeline,
      start: 'top 70%',
      end: 'bottom 65%',
      scrub: 0.8,
    },
  });

  // Each point: card slides in + dot activates
  document.querySelectorAll('.journey-point').forEach((point) => {
    const card = point.querySelector('.journey-card');
    const isLeft = point.classList.contains('journey-point--left');

    gsap.fromTo(
      card,
      { opacity: 0, x: isLeft ? -36 : 36 },
      {
        opacity: 1,
        x: 0,
        duration: 0.85,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: point,
          start: 'top 72%',
          toggleActions: 'play none none none',
          onEnter: () => point.classList.add('active'),
        },
      }
    );
  });
}

// ─── CUSTOM CURSOR + JOURNEY MODAL ───
function initCustomCursor() {
  const cursor   = document.getElementById('custom-cursor');
  const backdrop = document.getElementById('journey-modal-backdrop');
  const cards = document.querySelectorAll('.journey-card[data-journey]');
  if (!cursor) return;

  // Position updates instantly on every mousemove, no lerp, pixel-perfect
  window.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  }, { passive: true });

  // Video section hover, dot grows into play circle
  const videoInner = document.getElementById('video-inner');
  if (videoInner) {
    videoInner.addEventListener('mouseenter', () => cursor.classList.add('video-active'));
    videoInner.addEventListener('mouseleave', () => cursor.classList.remove('video-active'));
  }

  // Case study card hover, same "Learn More" cursor
  document.querySelectorAll('.cs-card').forEach((card) => {
    card.addEventListener('mouseenter', () => cursor.classList.add('journey-active'));
    card.addEventListener('mouseleave', () => cursor.classList.remove('journey-active'));
  });

  // Journey card hover, dot grows into glass circle in place
  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => cursor.classList.add('journey-active'));
    card.addEventListener('mouseleave', () => cursor.classList.remove('journey-active'));

    card.addEventListener('click', () => {
      const title = card.getAttribute('data-journey');

      // Show only the matching content panel
      document.querySelectorAll('[data-journey-content]').forEach((panel) => {
        panel.style.display = panel.getAttribute('data-journey-content') === title ? '' : 'none';
      });

      backdrop.classList.add('is-open');
      backdrop.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      lenis.stop();
      cursor.classList.remove('journey-active');
    });
  });

  // Nav arrows, switch between panels
  function showPanel(title) {
    document.querySelectorAll('[data-journey-content]').forEach((panel) => {
      panel.style.display = panel.getAttribute('data-journey-content') === title ? '' : 'none';
    });
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.jm-nav-btn');
    if (!btn) return;
    const target = btn.getAttribute('data-nav-to');
    if (target) showPanel(target);
  });

  function closeJourneyModal() {
    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lenis.start();
  }

  // Close button, handle all .jm-close buttons via delegation
  if (backdrop) backdrop.addEventListener('click', (e) => {
    if (e.target.closest('.jm-close')) closeJourneyModal();
  });
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeJourneyModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop?.classList.contains('is-open')) closeJourneyModal();
  });
}

// ─── BOAT SECTION ───
function initBoatSection() {
  const section = document.getElementById('boat-section');
  const video   = document.getElementById('boat-video');
  const headOut = document.querySelector('.boat-headline--out');
  const headIn  = document.querySelector('.boat-headline--in');
  const boatSub = document.getElementById('boat-sub');
  const boatCta = document.getElementById('boat-cta');
  if (!section || !video) return;

  // Keep video paused, scroll drives currentTime
  video.pause();

  function scrub(progress) {
    if (video.readyState >= 1 && video.duration) {
      video.currentTime = progress * video.duration;
    }
  }

  // Scroll drives video playback
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end:   'bottom bottom',
    onUpdate: (self) => scrub(self.progress),
  });

  // Text swap: out at 20%, second headline in at 28%, sub at 33%, button at 37%
  gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end:   'bottom bottom',
      scrub: 1,
    }
  })
  .to(headOut,     { opacity: 0, y: -30, duration: 0.1,  ease: 'power2.in'  }, 0.20)
  .fromTo(headIn,  { opacity: 0, y:  30 }, { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, 0.28)
  .fromTo(boatSub, { opacity: 0, y:  16, pointerEvents: 'none' }, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.1, ease: 'power2.out' }, 0.33)
  .fromTo(boatCta, { opacity: 0, y:  20, pointerEvents: 'none' }, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.1, ease: 'power2.out' }, 0.37);
}

// ─── CASE STUDIES ───
function initCaseStudyCarousel() {
  const CASES = [
    {
      logo:  'assets/dealer-logo-1.svg',
      stats: [
        { value: '+150%', label: 'Increase in Sales'    },
        { value: '3×',    label: 'Qualified Leads'      },
        { value: '+40%',  label: 'Lead Conversion Rate' },
      ],
      quote: 'Since switching to DealerEdge, our team handles twice the leads in half the time. The AI follow-up alone has completely changed our business.',
      name:  'Jake Morrison, Sales Manager',
    },
    {
      logo:  'assets/dealer-logo-2.svg',
      stats: [
        { value: '+170%', label: 'Increase in Sales'    },
        { value: '4×',    label: 'Qualified Leads'      },
        { value: '+49%',  label: 'Lead Conversion Rate' },
      ],
      quote: "We were skeptical at first, but the numbers don't lie. Three months in and we're closing deals we never would have captured before.",
      name:  'Rachel Torres, General Manager',
    },
    {
      logo:  'assets/dealer-logo-3.svg',
      stats: [
        { value: '+220%', label: 'Increase in Sales'    },
        { value: '2.5×',  label: 'Qualified Leads'      },
        { value: '+33%',  label: 'Lead Conversion Rate' },
      ],
      quote: "DealerEdge doesn't just bring in leads, it brings in the right leads. Our close rate has never been higher and our team is less stressed.",
      name:  'Marcus Webb, Owner',
    },
    {
      logo:  'assets/dealer-logo-4.svg',
      stats: [
        { value: '+195%', label: 'Increase in Sales'    },
        { value: '5×',    label: 'Qualified Leads'      },
        { value: '+55%',  label: 'Lead Conversion Rate' },
      ],
      quote: 'The platform paid for itself in the first month. Our customers love the faster response times and our team loves not chasing cold leads anymore.',
      name:  'Sandra Kim, Dealer Principal',
    },
  ];

  const detail      = document.getElementById('cs-detail');
  const detailLogo  = document.getElementById('cs-detail-logo');
  const detailStats = document.getElementById('cs-detail-stats');
  const detailQuote = document.getElementById('cs-detail-quote');
  const detailAttr  = document.getElementById('cs-detail-attribution');
  const btns        = Array.from(document.querySelectorAll('.cs-logo-btn'));
  if (!detail || !btns.length) return;

  function render(idx) {
    const c = CASES[idx];
    detailLogo.src = c.logo;
    detailStats.innerHTML = c.stats.map(s => `
      <div class="cs-detail-stat">
        <span class="cs-detail-stat-value">${s.value}</span>
        <span class="cs-detail-stat-label">${s.label}</span>
      </div>`).join('');
    detailQuote.textContent = `"${c.quote}"`;
    detailAttr.textContent  = `${c.name}`;
  }

  function select(idx) {
    btns.forEach((b, i) => b.classList.toggle('cs-logo-btn--active', i === idx));
    detail.classList.add('is-switching');
    setTimeout(() => {
      render(idx);
      detail.classList.remove('is-switching');
    }, 200);
  }

  btns.forEach((btn, i) => btn.addEventListener('click', () => select(i)));

  // Initialise with first item
  render(0);
}

// ─── CHATBOT ───
function initChatbot() {
  const widget   = document.getElementById('chatbot-widget');
  const trigger  = document.getElementById('chatbot-trigger');
  const closeBtn = document.getElementById('chatbot-close');
  const messages = document.getElementById('chatbot-messages');
  const input    = document.getElementById('chatbot-input');
  const sendBtn  = document.getElementById('chatbot-send');
  if (!widget || !trigger) return;

  // ── Responses ──
  const responses = [
    { match: /hello|hi|hey|howdy/i,
      reply: "Hey! Great to have you here. What can I help you with today, features, pricing, or getting started?" },
    { match: /price|pricing|cost|how much|plans/i,
      reply: "Pricing is tailored to your dealership's size and needs. The best way to get a number is a quick call with our team, want me to point you to the contact form?" },
    { match: /feature|what can|what does|offer|include/i,
      reply: "DealerEdge covers the full customer journey: AI marketing, smart listings, instant lead response, and sales analytics, all in one platform. Which area interests you most?" },
    { match: /market|ad|advertis|social|seo/i,
      reply: "Our AI generates high-converting ads, SEO content, and social posts tailored to your live inventory, automatically, no agency needed." },
    { match: /listing|inventory|vehicle|car|boat|rv/i,
      reply: "DealerEdge publishes polished listings across every major platform in seconds. AI writes the descriptions, optimises photos, and manages pricing for you." },
    { match: /lead|response|inquiry|follow.?up/i,
      reply: "Our AI responds to leads in seconds, qualifies buyers, and books appointments 24/7, even while your team sleeps." },
    { match: /analytic|track|dashboard|report|data/i,
      reply: "Real-time dashboards show every deal from first touch to close, broken down by channel, salesperson, and vehicle type." },
    { match: /loyalt|repeat|retention|customer/i,
      reply: "DealerEdge keeps customers engaged after the sale through automated follow-ups, service reminders, and personalised outreach, turning buyers into advocates." },
    { match: /start|demo|trial|sign.?up|onboard/i,
      reply: "Getting started is simple! Fill out the contact form on this page and our team will reach out within one business day. Want me to scroll you there?" },
    { match: /contact|email|phone|call|reach|talk/i,
      reply: "You can reach us at contact@dealeredge.com or use the Get Started form on this page. Our team typically responds within a few hours." },
    { match: /thank|thanks|great|awesome|perfect/i,
      reply: "Happy to help! Anything else you'd like to know about DealerEdge?" },
    { match: /bye|goodbye|see you/i,
      reply: "Talk soon! Feel free to come back any time. 👋" },
  ];

  function getReply(text) {
    for (const { match, reply } of responses) {
      if (match.test(text)) return reply;
    }
    return "That's a great question! For the most detailed answer I'd recommend chatting with our team directly. Want me to point you to the contact form?";
  }

  // ── DOM helpers ──
  function addMessage(text, type) {
    const div = document.createElement('div');
    div.className = `chat-msg chat-msg--${type}`;
    const p = document.createElement('p');
    p.textContent = text;
    div.appendChild(p);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg--bot chat-msg--typing';
    div.innerHTML = '<p><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></p>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function send() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    addMessage(text, 'user');
    const typing = showTyping();

    setTimeout(() => {
      typing.remove();
      addMessage(getReply(text), 'bot');
    }, 900 + Math.random() * 500);
  }

  // ── Open / close ──
  let hasOpened = false;

  function open() {
    widget.classList.add('is-open');
    input.focus();
    if (!hasOpened) {
      hasOpened = true;
      setTimeout(() => {
        const div = addMessage('Want to see how your dealership can respond to every lead instantly and close more deals?', 'bot');
        div.classList.add('chat-msg--animate-in');
      }, 800);
    }
  }

  function close() { widget.classList.remove('is-open'); }

  trigger.addEventListener('click', () => widget.classList.contains('is-open') ? close() : open());
  closeBtn.addEventListener('click', close);
  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
}

// ─── MODAL (multi-step) ───
function initModal() {
  const backdrop = document.getElementById('modal-backdrop');
  const modal    = document.getElementById('modal');
  const closeBtn = document.getElementById('modal-close');
  if (!backdrop || !modal) return;

  // ── State ──
  let userData = {};

  // ── Step navigation ──
  const DOT_STEPS = { 1: 1, 2: 2, 3: 3, 4: 3 }; // calendar is still "step 3"
  const dots = modal.querySelectorAll('.ms-dot');

  function showStep(n) {
    modal.querySelectorAll('.ms-step').forEach((s, i) => {
      s.classList.toggle('ms-step--hidden', i + 1 !== n);
    });
    const active = DOT_STEPS[n] || n;
    dots.forEach((d, i) => {
      const dotN = i + 1;
      d.classList.toggle('is-active', dotN === active);
      d.classList.toggle('is-done',   dotN < active);
      d.classList.remove(...(dotN === active ? ['is-done'] : dotN < active ? ['is-active'] : ['is-active', 'is-done']));
    });
    // Hide dots on confirmation
    modal.querySelector('#ms-dots').style.display = n === 5 ? 'none' : 'flex';
    setTimeout(() => modal.querySelector(`.ms-step:not(.ms-step--hidden) input`)?.focus(), 80);
  }

  // ── Calendar ──
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const TIMES  = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM'];

  let calView = new Date();
  calView.setDate(1);

  function renderCal() {
    const el    = document.getElementById('ms-calendar');
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
      const date    = new Date(y, m, d);
      const past    = date < today;
      const weekend = date.getDay() === 0 || date.getDay() === 6;
      const sel     = userData.date && userData.date.toDateString() === date.toDateString();
      html += `<button class="cal-day${sel ? ' cal-day--selected' : ''}" data-ts="${date.getTime()}" ${past || weekend ? 'disabled' : ''}>${d}</button>`;
    }
    html += `</div>`;
    el.innerHTML = html;

    el.querySelector('#cal-prev').addEventListener('click', () => { calView.setMonth(m - 1); renderCal(); });
    el.querySelector('#cal-next').addEventListener('click', () => { calView.setMonth(m + 1); renderCal(); });
    el.querySelectorAll('.cal-day:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        userData.date = new Date(+btn.dataset.ts);
        userData.time = null;
        renderCal();
        renderTimes();
      });
    });
  }

  function renderTimes() {
    const el = document.getElementById('ms-times');
    if (!userData.date) { el.innerHTML = ''; return; }
    el.innerHTML = TIMES.map(t =>
      `<button class="ms-time-btn${userData.time === t ? ' ms-time-btn--selected' : ''}" data-time="${t}">${t}</button>`
    ).join('');
    el.querySelectorAll('.ms-time-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        userData.time = btn.dataset.time;
        renderTimes();
        setTimeout(() => showConfirm(), 380);
      });
    });
  }

  function launchConfetti() {
    const modalEl = document.getElementById('modal');
    const rect = modalEl ? modalEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    const COLORS = ['#ee3a39','#ff6b6a','#cc2222','#ff9999','#ff4444','#ffffff','#ffcccc'];
    const particles = Array.from({ length: 160 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 6 + Math.random() * 14;
      return {
        x:     cx,
        y:     cy,
        vx:    Math.cos(angle) * speed,
        vy:    Math.sin(angle) * speed - 4,
        w:     5 + Math.random() * 8,
        h:     3 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        angle: Math.random() * Math.PI * 2,
        spin:  (Math.random() - 0.5) * 0.18,
        alpha: 0.85 + Math.random() * 0.15,
      };
    });

    let running = true;
    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.vx    *= 0.985;
        p.vy    += 0.35;
        p.x     += p.vx;
        p.y     += p.vy;
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
      ctx.clearRect(0, 0, W, H);
      canvas.remove();
    }, 4000);
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
    setTimeout(launchConfetti, 80);
  }

  // ── Button wiring ──
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

  modal.querySelector('#ms-yes').addEventListener('click', () => {
    userData.wantsSchedule = true;
    userData.date = null; userData.time = null;
    renderCal(); renderTimes();
    showStep(4);
  });

  modal.querySelector('#ms-no').addEventListener('click', () => {
    userData.wantsSchedule = false;
    showConfirm();
  });

  modal.querySelector('#ms-done').addEventListener('click', closeModal);

  // Enter key advances steps
  modal.querySelector('#ms-name').addEventListener('keydown',  e => { if (e.key === 'Enter') modal.querySelector('#ms-next-1').click(); });
  modal.querySelector('#ms-email').addEventListener('keydown', e => { if (e.key === 'Enter') modal.querySelector('#ms-phone').focus(); });
  modal.querySelector('#ms-phone').addEventListener('keydown', e => { if (e.key === 'Enter') modal.querySelector('#ms-next-2').click(); });

  // ── Open / close ──
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
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && backdrop.classList.contains('is-open')) closeModal();
  });
}

// ─── FISHING GAME ───
function initFishingGame() {
  const overlay      = document.getElementById('fishing-game');
  const hookEl       = document.getElementById('fishing-hook');
  const lineEl       = document.getElementById('fishing-line');
  const popupEl      = document.getElementById('fishing-popup');
  const popupTxtEl   = document.getElementById('fishing-popup-text');
  const fishLayer    = document.getElementById('fishing-fish-layer');
  const closeBtnEl   = document.getElementById('fishing-close');
  const flashEl      = document.getElementById('game-catch-flash');
  const endScreen    = document.getElementById('game-end-screen');
  const endScoreEl   = document.getElementById('end-score');
  const endComboEl   = document.getElementById('end-best-combo');
  const endRateEl    = document.getElementById('end-catch-rate');
  const endCtaBtn    = document.getElementById('game-end-cta');
  const endRestartBtn= document.getElementById('game-end-restart');
  const scoreWrap    = document.getElementById('game-score-wrap');
  const scoreCurr    = document.getElementById('score-curr');
  const scorePrev    = document.getElementById('score-prev');
  const scorePanel   = document.querySelector('.game-hud-score');
  const progressFill = document.getElementById('score-progress-fill');
  const milestoneEl  = document.getElementById('score-milestone');
  const timerRing    = document.getElementById('timer-ring-fill');
  const timerNum     = document.getElementById('timer-number');
  const comboPanel   = document.getElementById('game-combo');
  if (!overlay) return;

  const BENEFITS = [
    'Respond to every lead in under 60 seconds, automatically.',
    'Our AI Sales Assistant works 24/7, even on weekends and holidays.',
    'Dealers see an average 3× increase in qualified leads within 90 days.',
    'Automated follow-ups keep your pipeline warm without lifting a finger.',
    'Inventory optimization ensures you always show your best stock first.',
    'Digital ad automation cuts wasted spend and drives more qualified clicks.',
    'High-conversion websites built specifically for powersport dealerships.',
    'Full CRM integration keeps your entire team in sync, every day.',
    "Data-driven insights reveal exactly what's working, and what isn't.",
    'Most dealerships are fully onboarded and live within 2 weeks.',
  ];

  const FISH_PALETTE = [
    ['#4ecdc4', '#2aab9f'],
    ['#ff6b6b', '#d94f4f'],
    ['#ffd93d', '#c9ac00'],
    ['#6bcb77', '#45a852'],
    ['#4d96ff', '#1f6fe0'],
    ['#ff9f43', '#d97a1a'],
    ['#a29bfe', '#7b72e9'],
    ['#fd79a8', '#d84f82'],
  ];

  const MILESTONES = [5, 10, 15, 20, 30];
  const MILESTONE_LABELS = { 5:'On a Roll!', 10:'Crushing It!', 15:'Unstoppable!', 20:'Legend!', 30:'Maximum Edge!' };
  const TIMER_CIRC = 213.6; // 2π × 34

  let score = 0;
  let hookX  = window.innerWidth  / 2;
  let hookY  = window.innerHeight / 2;
  let fishes = [];
  let raf, popupTimer, firstBenefitTimer, gameTimerInterval;
  let benefitIdx    = 0;
  let isOpen        = false;
  let gameTimeLeft  = 60;
  let lastCatchTime = 0;
  let comboCount    = 0;
  let bestCombo     = 0;
  let milestoneTimeout = null;

  function makeFishSVG(body, fin) {
    return `<svg viewBox="0 0 100 50" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <polygon points="84,25 100,10 100,40" fill="${body}"/>
      <ellipse cx="47" cy="25" rx="37" ry="18" fill="${body}"/>
      <ellipse cx="42" cy="29" rx="25" ry="10" fill="${fin}" opacity="0.3"/>
      <path d="M38,7 Q50,1 62,8" stroke="${fin}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M44,43 Q52,49 61,43" stroke="${fin}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="18" cy="21" r="5.5" fill="white"/>
      <circle cx="17" cy="20" r="2.8" fill="#1a1a2e"/>
      <path d="M8,25 Q11,28 8,31" stroke="${fin}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  function spawnFish() {
    const pal   = FISH_PALETTE[Math.floor(Math.random() * FISH_PALETTE.length)];
    const dir   = Math.random() > 0.5 ? 1 : -1;
    const scale = 0.65 + Math.random() * 0.85;
    const w     = Math.round(100 * scale);
    const h     = Math.round(50  * scale);
    const y     = 90 + Math.random() * (window.innerHeight - 220);
    const speed = (1.4 + Math.random() * 2.6) * dir;
    const x     = dir === 1 ? -w - 10 : window.innerWidth + 10;
    const el = document.createElement('div');
    el.className = 'fishing-fish';
    el.style.cssText = `width:${w}px;height:${h}px;left:${x}px;top:${y}px;transform:scaleX(${dir > 0 ? -1 : 1})`;
    el.innerHTML = makeFishSVG(pal[0], pal[1]);
    fishLayer.appendChild(el);
    return { el, x, y, w, h, speed, alive: true };
  }

  function hookTip() {
    return { x: hookX - 14, y: hookY + 48 };
  }

  // ── Score display ──
  function updateScoreDisplay(newScore) {
    // Rolling digit
    scorePrev.textContent = scoreCurr.textContent;
    scoreCurr.textContent = newScore;
    scorePrev.style.cssText = 'transform:translateY(0);opacity:1';
    scoreCurr.style.cssText = 'transform:translateY(100%);opacity:0';
    void scoreWrap.offsetWidth;
    scoreWrap.classList.add('score-rolling');
    scoreCurr.style.cssText = '';
    scorePrev.style.cssText = 'transform:translateY(-100%);opacity:0';
    setTimeout(() => scoreWrap.classList.remove('score-rolling'), 260);

    // Panel pulse
    scorePanel.classList.remove('scoring');
    void scorePanel.offsetWidth;
    scorePanel.classList.add('scoring');
    setTimeout(() => scorePanel.classList.remove('scoring'), 450);

    // Progress bar
    const next = MILESTONES.find(m => m > newScore) || MILESTONES[MILESTONES.length - 1];
    const prev = [...MILESTONES].reverse().find(m => m <= newScore) || 0;
    const pct  = Math.min(((newScore - prev) / (next - prev)) * 100, 100);
    progressFill.style.width = pct + '%';

    // Milestone
    if (MILESTONES.includes(newScore)) {
      clearTimeout(milestoneTimeout);
      milestoneEl.textContent = MILESTONE_LABELS[newScore] || 'Amazing!';
      milestoneEl.classList.add('visible');
      milestoneTimeout = setTimeout(() => milestoneEl.classList.remove('visible'), 2200);
    }
  }

  // ── Combo ──
  function handleCombo() {
    const now = Date.now();
    if (now - lastCatchTime < 2000) {
      comboCount++;
      if (comboCount > bestCombo) bestCombo = comboCount;
    } else {
      comboCount = 0;
    }
    lastCatchTime = now;
  }

  // ── Screen flash ──
  function triggerCatchFlash() {
    flashEl.classList.remove('flash');
    void flashEl.offsetWidth;
    flashEl.classList.add('flash');
  }

  // ── Timer ──
  function startGameTimer() {
    gameTimeLeft = 60;
    timerRing.style.strokeDashoffset = 0;
    timerRing.classList.remove('urgent');
    timerNum.classList.remove('urgent');
    timerNum.textContent = '60';

    gameTimerInterval = setInterval(() => {
      gameTimeLeft--;
      timerNum.textContent = gameTimeLeft;
      timerRing.style.strokeDashoffset = TIMER_CIRC * (1 - gameTimeLeft / 60);
      if (gameTimeLeft <= 10) {
        timerRing.classList.add('urgent');
        timerNum.classList.add('urgent');
      }
      if (gameTimeLeft <= 0) {
        clearInterval(gameTimerInterval);
        endGame();
      }
    }, 1000);
  }

  // ── End game ──
  function endGame() {
    isOpen = false;
    clearTimeout(firstBenefitTimer);
    clearInterval(popupTimer);
    popupEl.classList.remove('is-visible');

    endScoreEl.textContent = score;
    endComboEl.textContent = bestCombo > 0 ? '×' + (bestCombo + 1) : '—';
    endRateEl.textContent  = score + '/min';
    endScreen.classList.add('visible');
  }

  function gameLoop() {
    const W   = window.innerWidth;
    const tip = hookTip();

    fishes.forEach(f => {
      if (!f.alive) return;
      f.x += f.speed;
      f.el.style.left = f.x + 'px';
      if ((f.speed > 0 && f.x > W + 20) || (f.speed < 0 && f.x < -f.w - 20)) {
        f.speed = -f.speed;
        f.x     = f.speed > 0 ? -f.w - 10 : W + 10;
        f.y     = 90 + Math.random() * (window.innerHeight - 220);
        f.el.style.top       = f.y + 'px';
        f.el.style.left      = f.x + 'px';
        f.el.style.transform = `scaleX(${f.speed > 0 ? -1 : 1})`;
      }
      if (tip.x > f.x && tip.x < f.x + f.w && tip.y > f.y && tip.y < f.y + f.h) {
        catchFish(f);
      }
    });

    raf = requestAnimationFrame(gameLoop);
  }

  function explodeFish(f) {
    const rect = f.el.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const cvs = document.createElement('canvas');
    cvs.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9000';
    cvs.width  = window.innerWidth;
    cvs.height = window.innerHeight;
    document.body.appendChild(cvs);
    const c = cvs.getContext('2d');
    const cols = ['#fff', '#ffe066', '#ff9f43', '#ff6b6b', '#4ecdc4', '#4d96ff', '#a29bfe'];
    const pts = Array.from({ length: 36 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const spd   = 4 + Math.random() * 10;
      return { x: cx, y: cy, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
               r: 3 + Math.random() * 5, col: cols[Math.floor(Math.random() * cols.length)], alpha: 1 };
    });
    let alive = true;
    function tick() {
      if (!alive) return;
      c.clearRect(0, 0, cvs.width, cvs.height);
      let done = true;
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.vx *= 0.94; p.alpha -= 0.025;
        if (p.alpha > 0) { done = false; }
        c.save(); c.globalAlpha = Math.max(0, p.alpha);
        c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fillStyle = p.col; c.fill(); c.restore();
      });
      if (done) { alive = false; cvs.remove(); } else { requestAnimationFrame(tick); }
    }
    tick();
  }

  function catchFish(f) {
    if (!isOpen) return;
    f.alive = false;
    score++;

    const rect = f.el.getBoundingClientRect();
    const fx = rect.left + rect.width  / 2;
    const fy = rect.top  + rect.height / 2;

    updateScoreDisplay(score);
    handleCombo(fx, fy);
    triggerCatchFlash();

    explodeFish(f);
    f.el.style.transition = 'opacity 0.2s, transform 0.2s';
    f.el.style.opacity    = '0';
    f.el.style.transform += ' scale(0.2)';
    setTimeout(() => {
      f.el.remove();
      fishes.splice(fishes.indexOf(f), 1);
      if (isOpen) fishes.push(spawnFish());
    }, 220);
  }

  function showBenefit() {
    if (!isOpen) return;
    popupTxtEl.textContent = BENEFITS[benefitIdx % BENEFITS.length];
    benefitIdx++;
    popupEl.classList.add('is-visible');
    setTimeout(() => popupEl.classList.remove('is-visible'), 5000);
  }

  const introEl = document.getElementById('fishing-intro');
  const wordEls  = introEl ? introEl.querySelectorAll('.fishing-word') : [];

  function runIntro(onDone) {
    introEl.style.display = 'flex';
    wordEls.forEach(w => { w.classList.remove('is-in', 'explode'); w.style.transform = ''; });
    wordEls.forEach((w, i) => { setTimeout(() => w.classList.add('is-in'), i * 380); });
    const explodeAt = wordEls.length * 380 + 700;
    setTimeout(() => {
      const dirs = [
        { tx: -380, ty: -260, r: -18, s: 0.4 },
        { tx:   20, ty:  320, r:   6, s: 0.3 },
        { tx:  360, ty: -200, r:  22, s: 0.5 },
      ];
      wordEls.forEach((w, i) => {
        const d = dirs[i] || dirs[0];
        w.style.transform = `translate(${d.tx}px, ${d.ty}px) rotate(${d.r}deg) scale(${d.s})`;
        w.classList.add('explode');
      });
      setTimeout(() => { introEl.style.display = 'none'; onDone(); }, 420);
    }, explodeAt);
  }

  function startGameplay() {
    fishes = [];
    score  = 0;
    comboCount  = 0;
    bestCombo   = 0;
    lastCatchTime = 0;
    updateScoreDisplay(0);
    progressFill.style.width = '0%';
    milestoneEl.classList.remove('visible');
    comboPanel.classList.remove('visible');
    endScreen.classList.remove('visible');
    timerRing.style.strokeDashoffset = 0;
    timerRing.classList.remove('urgent');
    timerNum.classList.remove('urgent');
    timerNum.textContent = '60';

    for (let i = 0; i < 8; i++) {
      const f = spawnFish();
      f.x = Math.random() * window.innerWidth;
      f.el.style.left = f.x + 'px';
      fishes.push(f);
    }
    benefitIdx = 0;
    firstBenefitTimer = setTimeout(() => {
      showBenefit();
      popupTimer = setInterval(showBenefit, 7000);
    }, 3000);

    startGameTimer();
    raf = requestAnimationFrame(gameLoop);
  }

  function openGame() {
    isOpen = true;
    overlay.classList.remove('fishing-game--hidden');
    document.body.style.overflow = 'hidden';
    lenis.stop();
    runIntro(startGameplay);
  }

  function closeGame() {
    isOpen = false;
    overlay.classList.add('fishing-game--hidden');
    cancelAnimationFrame(raf);
    clearInterval(gameTimerInterval);
    clearTimeout(firstBenefitTimer);
    clearInterval(popupTimer);
    fishes.forEach(f => f.el.remove());
    fishes = [];
    popupEl.classList.remove('is-visible');
    endScreen.classList.remove('visible');
    document.body.style.overflow = '';
    lenis.start();
  }

  overlay.addEventListener('mousemove', e => {
    hookX = e.clientX;
    hookY = e.clientY;
    hookEl.style.left   = (hookX - 14) + 'px';
    hookEl.style.top    = hookY + 'px';
    lineEl.style.left   = (hookX - 1) + 'px';
    lineEl.style.height = hookY + 'px';

  }, { passive: true });

  closeBtnEl.addEventListener('click', closeGame);

  endCtaBtn.addEventListener('click', () => {
    closeGame();
    const modal = document.getElementById('modal');
    if (modal) { modal.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
  });

  endRestartBtn.addEventListener('click', () => {
    endScreen.classList.remove('visible');
    clearInterval(gameTimerInterval);
    fishes.forEach(f => f.el.remove());
    fishes = [];
    popupEl.classList.remove('is-visible');
    clearTimeout(firstBenefitTimer);
    clearInterval(popupTimer);
    isOpen = true;
    startGameplay();
  });

  window.openFishingGame = openGame;
}

// ─── INIT ───
window.addEventListener('DOMContentLoaded', () => {
  animateHero();
  animateSections();
  animateCounters();
  initRippleEffect();
  animateVideoSection();
  initBoatSection();
  animateJourney();
  initCustomCursor();
  initModal();
  initCaseStudyCarousel();
  initChatbot();
  preloadFrames();
  bindScrollToFrames();
  initFishingGame();
  window.addEventListener('resize', () => drawFrame(currentFrame), { passive: true });
  window.addEventListener('load', () => drawFrame(currentFrame || 1), { once: true, passive: true });
});
