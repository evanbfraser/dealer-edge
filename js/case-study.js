// ─── CURSOR GLOW ───
(function () {
  const glow = document.getElementById('cursor-glow');
  if (!glow) return;
  let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
  let currentX = mouseX, currentY = mouseY;
  window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; glow.classList.add('visible'); }, { passive: true });
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

// ─── READING PROGRESS BAR ───
lenis.on('scroll', () => {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) return;
  const pct = Math.min(100, (window.scrollY / docHeight) * 100);
  const bar = document.getElementById('csd-progress-bar');
  if (bar) bar.style.width = pct + '%';
});

// ─── NAVBAR ───
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => { navbar.classList.toggle('scrolled', window.scrollY > 40); }, { passive: true });

// ─── CASE STUDY DATA ───
const CASE_STUDIES = [
  {
    id: 1,
    dealer: 'Galati Yacht Sales',
    image: 'assets/case-study-image-1.jpg',
    logo: 'assets/dealer-logo-1.svg',
    headline: 'How Galati Yacht Sales tripled their qualified leads in 90 days',
    intro: 'Galati Yacht Sales had a strong reputation and a healthy inventory, but their lead follow-up process was entirely manual. Inquiries came in around the clock, and by the time a salesperson responded, the prospect had often moved on. They needed a smarter way to engage buyers instantly, at any hour, without adding headcount.',
    body: 'After deploying DealerEdge, Galati Yacht Sales saw their lead response time drop from hours to seconds. The AI system engaged every inbound inquiry immediately, qualifying prospects, answering questions, and booking appointments directly into the sales team\'s calendar. Within 90 days, qualified lead volume had tripled and the sales team was closing deals they would have previously lost.',
    stats: [
      { value: '+150%', label: 'Increase in Sales' },
      { value: '3×', label: 'Qualified Leads' },
      { value: '+40%', label: 'Lead Conversion Rate' },
    ],
    quote: 'DealerEdge transformed the way we handle leads. We\'re now responding in seconds instead of hours, and our team only talks to buyers who are already qualified. The results spoke for themselves within the first month.',
    attribution: 'Tom Galati, President, Galati Yacht Sales',
    excerpt: 'After struggling with slow lead response times, Galati Yacht Sales turned to DealerEdge\'s AI system, and saw immediate results across every metric.',
    subheadline: 'From hours to seconds, how instant AI response turned missed opportunities into closed deals.',
  },
  {
    id: 2,
    dealer: 'Marine Elite',
    image: 'assets/case-study-image-2.jpg',
    logo: 'assets/dealer-logo-2.svg',
    headline: 'Marine Elite\'s 170% sales increase through AI-powered follow-up',
    intro: 'Marine Elite was generating plenty of leads through their website and third-party listings, but converting them was a different story. Their sales team was spending hours each week on manual follow-up, often reaching out too late to make an impact. They needed automation that felt personal and moved fast.',
    body: 'With DealerEdge in place, Marine Elite\'s entire follow-up sequence became automated and intelligent. The AI adapted messaging based on what each prospect was interested in, sent timely nudges, and flagged hot leads for immediate human attention. The result was a 170% jump in closed sales and a pipeline the team could actually trust.',
    stats: [
      { value: '+170%', label: 'Increase in Sales' },
      { value: '4×', label: 'Qualified Leads' },
      { value: '+49%', label: 'Lead Conversion Rate' },
    ],
    quote: 'We were losing deals we didn\'t even know we had. DealerEdge surfaced those opportunities and kept them warm until our team was ready to close. It\'s the best investment we\'ve made in years.',
    attribution: 'Sarah Mitchell, Sales Director, Marine Elite',
    excerpt: 'Marine Elite replaced their entire manual follow-up process with DealerEdge automation, within 60 days, their pipeline had never looked better.',
    subheadline: 'Smart automation that keeps every lead warm, and converts more of them than ever before.',
  },
  {
    id: 3,
    dealer: 'LMC Marine Center',
    image: 'assets/case-study-image-3.jpg',
    logo: 'assets/dealer-logo-3.svg',
    headline: 'LMC Marine Center\'s journey to 220% revenue growth in one quarter',
    intro: 'Operating multiple locations, LMC Marine Center faced a challenge that many multi-site dealers know well: inconsistency. Each location had its own follow-up habits, response times, and conversion rates. Leadership needed a way to standardize excellence across the board without micromanaging every team.',
    body: 'DealerEdge gave LMC Marine Center a centralized AI layer that worked consistently across all locations. Every lead received the same immediate, intelligent response regardless of which dealership they contacted. Reporting gave leadership a clear view of performance across sites, and individual teams were freed to focus entirely on closing. Revenue grew 220% in a single quarter.',
    stats: [
      { value: '+220%', label: 'Revenue Growth' },
      { value: '2.5×', label: 'Qualified Leads' },
      { value: '+33%', label: 'Lead Conversion Rate' },
    ],
    quote: 'We went from inconsistent results across three locations to a unified, high-performing operation. DealerEdge is the backbone of our sales process now. I wouldn\'t run a dealership without it.',
    attribution: 'James Chen, COO, LMC Marine Center',
    excerpt: 'Operating multiple locations, LMC Marine Center needed a system that could scale. DealerEdge gave them centralized AI and individual dealership insights.',
    subheadline: 'Consistent, scalable excellence across every location, powered by one centralized AI platform.',
  },
  {
    id: 4,
    dealer: 'Ventura Marine',
    image: 'assets/case-study-image-4.jpg',
    logo: 'assets/dealer-logo-4.svg',
    headline: 'How Ventura Marine achieved 5× lead volume without adding headcount',
    intro: 'Ventura Marine was no stranger to strong seasons, but they were leaving money on the table. Hundreds of inbound inquiries were going unworked each month because the team simply didn\'t have the bandwidth. Hiring more salespeople wasn\'t the answer. They needed the system to work smarter.',
    body: 'After implementing DealerEdge, Ventura Marine effectively multiplied their capacity without hiring a single additional person. The AI handled all first-touch engagement, qualified every lead, and filled the sales team\'s calendar with ready-to-buy appointments. Lead volume grew 5× and the team\'s close rate improved because they were only spending time with genuinely motivated buyers.',
    stats: [
      { value: '+195%', label: 'Increase in Sales' },
      { value: '5×', label: 'Qualified Leads' },
      { value: '+55%', label: 'Lead Conversion Rate' },
    ],
    quote: 'We were drowning in leads we couldn\'t work. DealerEdge didn\'t just help us handle the volume, it helped us convert more of it. Our revenue is up and our team is less stressed. That\'s a win on every level.',
    attribution: 'Mike Reyes, Owner, Ventura Marine',
    excerpt: 'Ventura Marine was drowning in unworked leads. DealerEdge\'s AI response system turned every inquiry into a qualified opportunity, automatically.',
    subheadline: '5× the leads, the same team, how AI capacity changed everything without adding a single hire.',
  },
];

// ─── RENDER PAGE ───
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id     = parseInt(params.get('id'), 10) || 1;
  const cs     = CASE_STUDIES.find(c => c.id === id) || CASE_STUDIES[0];

  // Custom cursor
  const cursor = document.getElementById('custom-cursor');
  if (cursor) {
    window.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    }, { passive: true });
    document.querySelectorAll('.csd-related-card').forEach(card => {
      card.addEventListener('mouseenter', () => cursor.classList.add('journey-active'));
      card.addEventListener('mouseleave', () => cursor.classList.remove('journey-active'));
    });
  }

  // Hero
  const heroImg = document.getElementById('csd-hero-img');
  heroImg.style.backgroundImage = `url('${cs.image}')`;
  sessionStorage.removeItem('csd-from-transition');
  document.documentElement.classList.remove('csd-from-transition');

  // ─── HERO PARALLAX ───
  if (!window.matchMedia('(max-width: 768px)').matches) {
    gsap.to(heroImg, {
      yPercent: -30, ease: 'none', immediateRender: false,
      scrollTrigger: { trigger: '.csd-hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }
  const logoEl = document.getElementById('csd-hero-logo');
  logoEl.src = cs.logo;
  logoEl.alt = cs.dealer;

  // Content
  document.getElementById('csd-hero-headline').textContent = cs.headline;
  document.getElementById('csd-dealer').textContent = cs.dealer;
  document.getElementById('csd-subheadline').textContent = cs.subheadline;
  document.getElementById('csd-intro').textContent = cs.intro;
  document.getElementById('csd-body').textContent = cs.body;

  // Stats
  const STAT_MAXES = [250, 6, 65];
  function parseStat(str) {
    const match = str.match(/^([+\-]?)(\d+\.?\d*)(.*)/);
    if (!match) return null;
    return { prefix: match[1], number: parseFloat(match[2]), suffix: match[3], isFloat: match[2].includes('.') };
  }
  document.getElementById('csd-stats').innerHTML = cs.stats.map((s, i) => {
    const parsed = parseStat(s.value);
    const fillPct = parsed ? Math.min(100, (parsed.number / (STAT_MAXES[i] || 100)) * 100).toFixed(1) : 0;
    return `
    <div class="csd-stat">
      <span class="csd-stat-value">${s.value}</span>
      <span class="csd-stat-label">${s.label}</span>
      <div class="csd-stat-bar-track"><div class="csd-stat-bar" data-fill="${fillPct}"></div></div>
    </div>`;
  }).join('');

  // ─── STAT COUNTERS + BARS ───
  (function initStatCounters() {
    const statEls = document.querySelectorAll('.csd-stat');
    if (!statEls.length) return;
    statEls.forEach(statEl => {
      const el = statEl.querySelector('.csd-stat-value');
      const bar = statEl.querySelector('.csd-stat-bar');
      const original = el.textContent.trim();
      const parsed = parseStat(original);
      if (!parsed) return;
      el.textContent = parsed.prefix + (parsed.isFloat ? '0.0' : '0') + parsed.suffix;
      let triggered = false;
      ScrollTrigger.create({
        trigger: statEl.closest('.csd-stats-section'),
        start: 'top 80%',
        onEnter: () => {
          if (triggered) return;
          triggered = true;
          gsap.to({ val: 0 }, {
            val: parsed.number,
            duration: 1.8,
            ease: 'power3.out',
            onUpdate: function () {
              const v = this.targets()[0].val;
              el.textContent = parsed.prefix + (parsed.isFloat ? v.toFixed(1) : Math.round(v).toString()) + parsed.suffix;
            },
            onComplete: () => { el.textContent = original; }
          });
          if (bar) gsap.to(bar, { width: bar.dataset.fill + '%', duration: 1.8, ease: 'power3.out' });
        }
      });
    });
  }());

  // Testimonial
  const quoteEl = document.getElementById('csd-quote');
  quoteEl.innerHTML = `"${cs.quote}"`.split(' ').map(w => `<span class="csd-quote-word">${w}</span>`).join(' ');
  document.getElementById('csd-attribution').textContent = `${cs.attribution}`;

  // Related (2 others)
  const STAT_SHORT = ['Sales', 'Leads', 'Conversion'];
  const others = CASE_STUDIES.filter(c => c.id !== id).slice(0, 2);
  document.getElementById('csd-related').innerHTML = others.map(c => `
    <a class="csp-card csd-related-card" href="case-study.html?id=${c.id}">
      <div class="csp-card-img-wrap">
        <img src="${c.image}" alt="${c.dealer}" class="csp-card-img">
        <div class="csp-card-logo-badge">
          <img src="${c.logo}" alt="${c.dealer}">
        </div>
      </div>
      <div class="csp-card-body">
        <div class="csp-card-stats">
          ${c.stats.map((s, i) => `
          <div class="csp-card-stat">
            <span class="csp-card-stat-value">${s.value}</span>
            <span class="csp-card-stat-label">${STAT_SHORT[i] || s.label}</span>
          </div>`).join('')}
        </div>
        <h2 class="csp-card-headline">${c.headline}</h2>
        <p class="csp-card-excerpt">${c.excerpt}</p>
      </div>
    </a>
  `).join('');

  // Re-bind cursor hover for related cards (rendered dynamically)
  if (cursor) {
    document.querySelectorAll('.csd-related-card').forEach(card => {
      card.addEventListener('mouseenter', () => cursor.classList.add('journey-active'));
      card.addEventListener('mouseleave', () => cursor.classList.remove('journey-active'));
    });
  }

  // ─── ENTRANCE ANIMATION ───
  gsap.fromTo('.csd-hero-logo-wrap',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.8, delay: 0.35, ease: 'power2.out' }
  );
  gsap.fromTo('#csd-hero-headline',
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.9, delay: 0.5, ease: 'power2.out' }
  );


  // Scroll-triggered fade-ins
  document.querySelectorAll('[data-csd-fade]').forEach(el => {
    const delay = parseFloat(el.dataset.delay || 0);
    gsap.fromTo(el,
      { opacity: 0, y: 36 },
      { opacity: 1, y: 0, duration: 0.85, delay, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 87%', toggleActions: 'play none none none' }
      }
    );
  });

  // Related card click transition (same as card list page)
  document.querySelectorAll('.csd-related-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const href = card.getAttribute('href');
      const imgEl = card.querySelector('.csp-card-img');
      const rect  = imgEl.getBoundingClientRect();
      const overlay = document.createElement('div');
      overlay.style.cssText = `position:fixed;z-index:9998;background-image:url('${imgEl.src}');background-size:cover;background-position:center;border-radius:20px;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;`;
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      gsap.to(overlay, {
        top: 0, left: 0, width: '100vw', height: '100vh', borderRadius: 0,
        duration: 0.6, ease: 'power3.inOut',
        onComplete: () => { sessionStorage.setItem('csd-from-transition', '1'); window.location.href = href; }
      });
    });
  });

  // ─── TESTIMONIAL WORD REVEAL ───
  (function initTestimonialReveal() {
    const section     = document.getElementById('csd-section-testimonial');
    const quoteMark   = section?.querySelector('.csd-quote-mark');
    const words       = document.querySelectorAll('.csd-quote-word');
    const attribution = document.getElementById('csd-attribution');
    if (!section || !words.length) return;

    gsap.fromTo(quoteMark,
      { opacity: 0, y: 12 },
      { opacity: 0.7, y: 0, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 78%', toggleActions: 'play none none none' } }
    );

    ScrollTrigger.create({
      trigger: section,
      start: 'top 60%',
      end: 'center 40%',
      scrub: 0.4,
      onUpdate: (self) => {
        const litCount = Math.floor(self.progress * words.length);
        words.forEach((w, i) => w.classList.toggle('is-lit', i < litCount));
      },
      onLeave: () => { words.forEach(w => w.classList.add('is-lit')); }
    });

    gsap.fromTo(attribution,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'center 45%', toggleActions: 'play none none none' } }
    );
  }());

  // ─── SIDEBAR DOTS NAVIGATION ───
  (function initSidebarDots() {
    const nav = document.getElementById('csd-dots-nav');
    if (!nav) return;
    const SECTIONS = [
      { id: 'csd-section-hero',        label: 'Hero'        },
      { id: 'csd-section-intro',       label: 'Story'       },
      { id: 'csd-section-stats',       label: 'Results'     },
      { id: 'csd-section-body',        label: 'Full Story'  },
      { id: 'csd-section-testimonial', label: 'Testimonial' },
      { id: 'csd-section-related',     label: 'More'        },
    ];
    nav.innerHTML = SECTIONS.map((s, i) => `
      <div class="csd-dot-item" data-dot-index="${i}">
        <span class="csd-dot-label">${s.label}</span>
        <button class="csd-dot-btn" data-target="${s.id}" aria-label="Scroll to ${s.label}"></button>
      </div>
    `).join('');

    const buttons = nav.querySelectorAll('.csd-dot-btn');
    function setActive(index) {
      buttons.forEach((btn, i) => btn.classList.toggle('is-active', i === index));
    }
    setActive(0);

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        if (!target) return;
        lenis.scrollTo(target, { offset: -10, duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 3) });
      });
    });

    SECTIONS.forEach((s, i) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        end: 'bottom center',
        onEnter:     () => setActive(i),
        onEnterBack: () => setActive(i),
      });
    });
  }());

  // Recalculate all ScrollTrigger positions after dynamic content render
  ScrollTrigger.refresh();

});
