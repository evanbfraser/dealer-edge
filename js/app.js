/* ═══════════════════════════════════════════════════════════════
   HOMEPAGE (index.html) — Evan's original POC, ported onto the
   DE.boot/DE.destroy lifecycle (js/de-core.js) so the platform
   island host can mount/unmount it cleanly. On the static site
   nothing changes: DE.boot('index') at the bottom runs it exactly
   as the old DOMContentLoaded IIFE did. Long-lived window/document
   listeners, rAF self-loops and intervals go through DE.on /
   DE.rafLoop / DE.interval so DE.destroy() can tear them down.
   ═══════════════════════════════════════════════════════════════ */
DE.pages.index = (function () {
  function boot() {
    'use strict';

    // ─── CURSOR GLOW (red ambient) ───
    (function initCursorGlowHome() {
      const glow = document.getElementById('cursor-glow');
      if (!glow) return;

      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;
      let currentX = mouseX;
      let currentY = mouseY;

      DE.on(window, 'mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        glow.classList.add('visible');
      }, { passive: true });

      DE.on(window, 'mouseleave', () => glow.classList.remove('visible'));

      DE.rafLoop(() => {
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;
        glow.style.transform = `translate(${currentX - 300}px, ${currentY - 300}px)`;
      });
    }());

    // ─── LENIS SMOOTH SCROLL (shared engine: GSAP/ScrollTrigger sync + teardown) ───
    const lenis = DE.createLenis({ lerp: 0.085, smoothWheel: true });

    // ─── NAVBAR SCROLL STATE ───
    const navbar = document.getElementById('navbar');
    if (navbar) {
      const onNavScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
      DE.on(window, 'scroll', onNavScroll, { passive: true });
      onNavScroll();
    }

// ─── HERO ENTRANCE ANIMATION ───
function animateHero() {
  // Show the hero copy immediately — no entrance fade. The old dark→light
  // reveal read as a slow page load (and could stall on the platform); the
  // hero visual appears at once, so the copy should match. `.hero-content` is
  // now visible by default in style.css; this guards against stale CSS and
  // clears any leftover transform from a prior run.
  const content = document.getElementById('hero-content');
  if (!content) return;
  gsap.set(content, { opacity: 1 });
  gsap.set(
    [
      content.querySelector('.hero-eyebrow'),
      content.querySelector('.hero-headline'),
      content.querySelector('.hero-sub'),
      content.querySelector('.hero-actions'),
    ].filter(Boolean),
    { opacity: 1, y: 0, clearProps: 'transform' }
  );
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
      // First frame ready: paint now, then repaint a few times over ~2s. The
      // React island host regenerates this subtree shortly after hydration
      // (swapping #hero-canvas); repainting the freshly re-queried node a few
      // times outlasts that swap, so the hero isn't left blank when the user
      // hasn't scrolled. On the static site there's no swap — harmless.
      if (loaded === 1) {
        // Paint, then keep retrying until a draw actually STICKS (the live
        // canvas ends up sized, not the 300x150 default). The React island host
        // swaps #hero-canvas ~1s after hydration, and we can't predict exactly
        // when the replacement node is mounted AND its container is laid out AND
        // frame 1 has loaded — so poll until drawFrame succeeds (or stop ~6s).
        let tries = 30;
        const iv = setInterval(() => {
          drawFrame(currentFrame);
          const c = document.getElementById('hero-canvas');
          if ((c && c.width > 300) || --tries <= 0) clearInterval(iv);
        }, 200);
      }
    };
    images.push(img);
  }
}

function drawFrame(idx) {
  // Re-acquire the live node each draw. On the platform, the React island host
  // regenerates this subtree shortly after hydration, swapping in a fresh
  // #hero-canvas — the module-level ref captured at load would be orphaned, so
  // we'd paint a detached node and the visible hero would stay blank.
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
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

  // Desktop only: the hero pins at the top (sticky — see the min-width:769px
  // block in style.css) while the Features section rises and covers it, so the
  // animating visual disappears underneath the next section's copy/cards with no
  // extra scroll. Because the pinned hero's own rect is frozen at top:0, drive
  // progress off window.scrollY rather than the hero rect on desktop.
  const heroParallax = window.matchMedia('(min-width: 769px)');
  let ticking = false;

  DE.on(window, 'scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const hero = document.getElementById('hero');
        if (!hero) { ticking = false; return; }

        const vh = window.innerHeight;
        const desktop = heroParallax.matches;
        const scrollY = desktop
          ? Math.max(0, window.scrollY || window.pageYOffset || 0)
          : Math.max(0, -hero.getBoundingClientRect().top);

        // Desktop choreography while the hero is pinned: the copy exits upward a
        // touch faster than scroll (its own speed), and the visual fades to
        // transparent so it dissipates behind the incoming Features header
        // (transparent section bg, higher z-index — see style.css). Hidden once
        // gone so the sticky layer can't paint over lower sections. Reset on mobile.
        const heroLeft = hero.querySelector('.hero-left');
        const heroRight = hero.querySelector('.hero-right');
        if (desktop) {
          if (heroLeft) {
            // Copy bounce: a half-sine DIP (down, then back up) layered over a
            // slow-start cubic EXIT (up). The cubic's easing keeps the exit near
            // zero early, so the dip reads first — the copy sinks ~30px, springs
            // back, then launches up and is gone by ~0.6vh (before the visual
            // finishes fading). The easing is what sells the bounce.
            const t = Math.min(1, scrollY / (vh * 0.6));
            const dip = 42 * Math.sin(Math.PI * Math.min(t / 0.45, 1));
            const exit = vh * 0.95 * (t * t * t);
            heroLeft.style.transform = `translateY(${(dip - exit).toFixed(1)}px)`;
          }
          if (heroRight) {
            const fade = 1 - Math.min(1, Math.max(0, (scrollY - vh * 0.35) / (vh * 0.55)));
            heroRight.style.opacity = fade.toFixed(3);
          }
          const want = scrollY >= vh * 0.95 ? 'hidden' : '';
          if (hero.style.visibility !== want) hero.style.visibility = want;
        } else {
          if (heroLeft && heroLeft.style.transform) heroLeft.style.transform = '';
          if (heroRight && heroRight.style.opacity) heroRight.style.opacity = '';
          if (hero.style.visibility) hero.style.visibility = '';
        }

        // Frame scrub over ~0.9vh on desktop (was 0.62) so the animation plays
        // out across the cover-reveal instead of finishing early.
        const maxScroll = vh * (desktop ? 0.9 : 0.62);
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
  DE.on(window, 'resize', () => {
    if (img.complete && img.naturalWidth) setup(img);
  }, { passive: true });

  const img = new Image();
  img.onload = () => { setTimeout(() => { if (setup(img)) DE.rafLoop(tick); }, 100); };
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
    width: '100%',
    maxWidth: '100%',
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
  DE.on(window, 'mousemove', (e) => {
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

  DE.on(document, 'click', (e) => {
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
  DE.on(document, 'keydown', (e) => {
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

    // ─── INIT ───
    animateHero();
    animateSections();
    animateCounters();
    initRippleEffect();
    animateVideoSection();
    initBoatSection();
    animateJourney();
    initCustomCursor();
    initDemoModal(lenis);
    if (typeof initMobileNav === 'function') initMobileNav(); // not shipped to the platform (DeHeader owns nav)
    initCaseStudyCarousel();
    initChatbot();
    preloadFrames();
    bindScrollToFrames();
    DE.on(window, 'resize', () => drawFrame(currentFrame), { passive: true });
    DE.on(window, 'load', () => drawFrame(currentFrame || 1), { once: true, passive: true });
  }

  return { boot };
})();

DE.boot('index');
