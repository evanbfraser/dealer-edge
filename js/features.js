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

// ─── DEPARTMENT DATA ───
const DEPARTMENTS = [
  {
    id: 'marketing',
    name: 'Marketing',
    tagline: 'Attract buyers before they find the competition.',
    stat: { value: '3.2×', label: 'Average ROI on ad spend' },
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
    features: [
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
        title: 'AI Ad Creative',
        body: 'Auto-generate platform-specific ad creatives for Google, Meta, and YouTube, continuously tested and optimized.',
        detail: ['Dynamic A/B testing across platforms', 'Brand-consistent visuals at scale', 'One-click publishing to all accounts'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
        title: 'SEO & AIO Content',
        body: 'AI-written blog posts, landing pages, and listings that rank first in search results and AI overviews.',
        detail: ['Keyword research and content briefs', 'Automatic internal linking', 'AI Overview optimization'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
        title: 'Social Media Automation',
        body: 'Schedule and publish across all platforms with AI-crafted captions, images, and short-form video clips.',
        detail: ['Multi-platform scheduling', 'Reels and TikToks from inventory', 'Engagement monitoring'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
        title: 'Listing Syndication',
        body: 'Push your entire inventory to Boat Trader, RV Trader, Cycle Trader, and 30+ marketplaces automatically.',
        detail: ['Real-time inventory sync', '30+ marketplace connections', 'Per-listing performance analytics'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
        title: 'Email Campaigns',
        body: 'Personalized nurture sequences that bring cold leads back into your pipeline at exactly the right moment.',
        detail: ['Behavioral trigger automations', 'Drip sequences for every lead stage', 'Open and click reporting'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
        title: 'Brand Asset Library',
        body: 'AI-generated photography, video thumbnails, and branded content, professional quality without an agency.',
        detail: ['Virtual studio photography', 'Video thumbnail generation', 'Brand style enforcement'],
      },
    ],
  },
  {
    id: 'sales',
    name: 'Sales',
    tagline: 'Close more deals without adding headcount.',
    stat: { value: '47s', label: 'Average lead response time' },
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    features: [
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        title: 'Instant AI Lead Response',
        body: 'Every inquiry answered in under 60 seconds, 24/7, even on weekends when competitors go completely silent.',
        detail: ['SMS, email, and web chat response', 'Inventory-aware answers', 'Handoff alerts to your team'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
        title: 'Smart Follow-Up Sequences',
        body: 'Multi-touch automated follow-ups that adapt to prospect behavior and keep every deal moving forward.',
        detail: ['Behavior-triggered sequences', 'Tone adapts based on engagement', 'Zero leads fall through'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        title: 'Appointment Scheduling',
        body: "Let leads book directly into your team's calendar with automatic confirmations and reminders.",
        detail: ['2-way calendar sync', 'Automated reminders', 'No-show re-engagement'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><circle cx="19" cy="5" r="3"/></svg>`,
        title: 'AI Sales Assistant',
        body: 'Live chat on your website with a trained AI that knows your inventory, pricing, and availability inside out.',
        detail: ['Trained on your inventory', 'Escalates hot leads instantly', 'Learns from every conversation'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
        title: 'Lead Qualification',
        body: 'Automatically score and prioritize leads so your team always focuses on the buyers most likely to close.',
        detail: ['Intent scoring', 'Trade-in pre-qualification', 'Priority inbox for your team'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
        title: 'CRM Integration',
        body: "Sync every lead, conversation, and deal stage into your existing CRM, nothing falls through the cracks.",
        detail: ['DMS and CRM connectors', 'Two-way data sync', 'Custom field mapping'],
      },
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory',
    tagline: 'Move more units, faster, at the right price.',
    stat: { value: '28%', label: 'Faster average inventory turns' },
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z"/><polyline points="2.32 6.16 12 11 21.68 6.16"/><line x1="12" y1="22.76" x2="12" y2="11"/></svg>`,
    features: [
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
        title: 'Smart Pricing Engine',
        body: 'AI pricing recommendations based on real-time market demand, seasonality, days on lot, and competitor data.',
        detail: ['Live competitor price tracking', 'Seasonality adjustments', 'Margin protection guardrails'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`,
        title: 'Automated Listings',
        body: 'Compelling descriptions, complete specs, and optimized photos for every unit, generated automatically on arrival.',
        detail: ['AI-written unit descriptions', 'Spec auto-population', 'Image enhancement'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
        title: 'Inventory Intelligence',
        body: "Know which units are stalling, which are moving fast, and what you should be stocking next season.",
        detail: ['Demand forecasting', 'Stale inventory alerts', 'Model popularity trends'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>`,
        title: 'Market Trend Alerts',
        body: 'Real-time alerts when competitor pricing shifts, new models launch, or demand spikes in your market.',
        detail: ['Regional demand mapping', 'Competitor monitoring', 'Price drop recommendations'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
        title: 'Lot Analytics',
        body: 'Track views, saves, and inquiries per unit so your sales team knows exactly where to focus their energy.',
        detail: ['Per-unit performance score', 'Time-on-lot tracking', 'Inquiry-to-listing ratio'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        title: 'Multi-Location Sync',
        body: 'Manage inventory across all your locations from one dashboard, no spreadsheets, no duplicate entries.',
        detail: ['Unified inventory view', 'Inter-lot transfer requests', 'Per-location performance'],
      },
    ],
  },
  {
    id: 'service',
    name: 'Service',
    tagline: 'Turn one-time buyers into lifelong customers.',
    stat: { value: '62%', label: 'Higher service retention rate' },
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    features: [
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.29 6.29l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
        title: 'Automated Service Reminders',
        body: 'Reach customers at the perfect moment for oil changes, winterization, and service intervals.',
        detail: ['Mileage and time-based triggers', 'Multi-channel delivery (SMS, email)', 'Opt-out handled automatically'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        title: 'Work Order Updates',
        body: 'Keep customers informed with automated status texts and emails throughout the service process.',
        detail: ['Real-time status updates', 'Parts arrival notifications', 'Pick-up ready alerts'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
        title: 'Service Upsell AI',
        body: 'Surface upsell opportunities to your service advisor automatically, at exactly the right moment in every visit.',
        detail: ['Unit history analysis', 'Service interval cross-sell', 'Advisor prompt suggestions'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
        title: 'Post-Service Follow-Up',
        body: 'Automated satisfaction checks and review requests after every visit, building your reputation on autopilot.',
        detail: ['CSAT surveys', 'Google review requests', 'Issue escalation detection'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        title: 'Seasonal Campaigns',
        body: 'Pre-season and post-season service campaigns that drive bookings before your competition starts advertising.',
        detail: ['Winterization campaigns', 'Spring prep campaigns', 'Storage package upsells'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        title: 'Customer Re-Engagement',
        body: "Automatically win back customers who haven't visited in 6–12 months with targeted re-activation campaigns.",
        detail: ['Lapsed customer identification', 'Win-back offers and incentives', 'Multi-touch re-engagement'],
      },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    tagline: 'See everything. Decide faster. Grow smarter.',
    stat: { value: '100%', label: 'Visibility across every channel' },
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    features: [
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
        title: 'Unified Dashboard',
        body: 'Every KPI your dealership cares about, leads, response time, conversions, and revenue, in one place.',
        detail: ['Customizable widget layout', 'Real-time data refresh', 'Executive and ops views'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 1 0 .14 14.14"/></svg>`,
        title: 'Lead Source Tracking',
        body: 'Know exactly which channels, campaigns, and listings are generating your highest-quality leads.',
        detail: ['Attribution modeling', 'Cost-per-lead by source', 'Channel ROI comparison'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
        title: 'ROI Reporting',
        body: 'See the dollar return on every campaign, ad spend, and platform, updated in real time.',
        detail: ['Campaign-level P&L', 'Custom date ranges', 'Benchmark comparisons'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 12h-5l-3-9-3 9h-3"/><polyline points="2 17 5 20 8 17"/><polyline points="22 7 19 4 16 7"/></svg>`,
        title: 'Sales Pipeline View',
        body: 'Track every deal from first inquiry to closed sale, with full conversation history at a glance.',
        detail: ['Deal stage visualization', 'Revenue forecasting', 'Time-to-close tracking'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        title: 'Team Performance',
        body: 'Monitor response times, conversion rates, and activity per rep, drive accountability with data.',
        detail: ['Individual leaderboards', 'Response time scoring', 'Activity feed per rep'],
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
        title: 'Custom Reports',
        body: "Build, schedule, and export reports tailored exactly to your dealership's goals and stakeholder needs.",
        detail: ['Drag-and-drop report builder', 'Scheduled email delivery', 'PDF and CSV export'],
      },
    ],
  },
];

// ─── MAIN ───
window.addEventListener('DOMContentLoaded', () => {

  // Custom cursor tracking
  const cursor = document.getElementById('custom-cursor');
  if (cursor) {
    window.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    }, { passive: true });
  }

  // ─── SCROLL FADE ───
  document.querySelectorAll('[data-fade]').forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 28, duration: 0.75,
      delay: parseFloat(el.dataset.delay || 0),
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  // ─── (no cycling headline) ───
  let cycleTimer;


  // ─── BUILD EXPLORER ───
  const deptNav   = document.getElementById('fp-dept-nav');
  const contentEl = document.getElementById('fp-content');

  // Department tab buttons
  DEPARTMENTS.forEach((dept, i) => {
    const btn = document.createElement('button');
    btn.className   = 'fp-dept-btn' + (i === 0 ? ' is-active' : '');
    btn.dataset.dept = dept.id;
    btn.setAttribute('aria-label', dept.name);
    btn.innerHTML = `
      <span class="fp-dept-btn-icon">${dept.icon}</span>
      <span class="fp-dept-btn-name">${dept.name}</span>
      <span class="fp-dept-count">${dept.features.length}</span>
    `;
    btn.addEventListener('click', () => activateDept(dept.id));
    btn.addEventListener('mouseenter', () => cursor?.classList.add('journey-active'));
    btn.addEventListener('mouseleave', () => cursor?.classList.remove('journey-active'));
    deptNav.appendChild(btn);
  });

  // Content panels
  DEPARTMENTS.forEach((dept) => {
    const panel = document.createElement('div');
    panel.className = 'fp-panel';
    panel.id = `fp-panel-${dept.id}`;
    panel.innerHTML = `
      <div class="fp-panel-header">
        <div class="fp-panel-eyebrow">
          <div class="fp-panel-icon">${dept.icon}</div>
          <span class="fp-panel-dept-name">${dept.name}</span>
        </div>
        <h2 class="fp-panel-headline">${dept.tagline}</h2>
      </div>
      <div class="fp-stat-highlight">
        <span class="fp-stat-value" data-raw="${dept.stat.value}">${dept.stat.value}</span>
        <div class="fp-stat-divider"></div>
        <span class="fp-stat-label">${dept.stat.label}</span>
      </div>
      <div class="fp-grid">
        ${dept.features.map(f => `
          <div class="fp-card">
            <div class="fp-card-icon">${f.icon}</div>
            <div class="fp-card-title">${f.title}</div>
            <div class="fp-card-body">${f.body}</div>
            <div class="fp-card-detail">
              <div class="fp-card-detail-inner">
                <ul class="fp-card-detail-list">
                  ${f.detail.map(d => `<li>${d}</li>`).join('')}
                </ul>
              </div>
            </div>
            <button class="fp-card-toggle" aria-label="Toggle details">
              <span>What's included</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
        `).join('')}
      </div>
    `;
    contentEl.appendChild(panel);
  });

  // ─── CARD EXPAND ───
  contentEl.addEventListener('click', (e) => {
    const card   = e.target.closest('.fp-card');
    if (!card) return;
    const toggle = card.querySelector('.fp-card-toggle span');
    const wasExp = card.classList.contains('is-expanded');
    card.closest('.fp-grid').querySelectorAll('.fp-card.is-expanded').forEach(c => {
      c.classList.remove('is-expanded');
      c.querySelector('.fp-card-toggle span').textContent = "What's included";
    });
    if (!wasExp) {
      card.classList.add('is-expanded');
      toggle.textContent = 'Show less';
    }
  });

  // Cursor on cards
  contentEl.addEventListener('mouseover', (e) => { if (e.target.closest('.fp-card')) cursor?.classList.add('journey-active'); });
  contentEl.addEventListener('mouseout',  (e) => { if (e.target.closest('.fp-card')) cursor?.classList.remove('journey-active'); });

  // ─── STAT COUNTER ───
  function animateStat(el) {
    const raw   = el.dataset.raw;
    const match = raw.match(/^([+\-]?)(\d+\.?\d*)(.*)/);
    if (!match) return;
    const prefix  = match[1];
    const num     = parseFloat(match[2]);
    const suffix  = match[3];
    const isFloat = match[2].includes('.');
    el.textContent = prefix + (isFloat ? '0.0' : '0') + suffix;
    gsap.to({ val: 0 }, {
      val: num, duration: 1.4, ease: 'power3.out',
      onUpdate: function () {
        const v = this.targets()[0].val;
        el.textContent = prefix + (isFloat ? v.toFixed(1) : Math.round(v)) + suffix;
      },
      onComplete: () => { el.textContent = raw; },
    });
  }

  // ─── DEPT SWITCHING ───
  let currentDept = 'marketing';

  function activateDept(id) {
    if (id === currentDept) return;

    const oldPanel = document.getElementById(`fp-panel-${currentDept}`);
    const newPanel = document.getElementById(`fp-panel-${id}`);

    // Tabs
    document.querySelectorAll('.fp-dept-btn').forEach(b =>
      b.classList.toggle('is-active', b.dataset.dept === id)
    );

    // Slide out old
    gsap.to(oldPanel, {
      opacity: 0, x: -22, duration: 0.24, ease: 'power2.in',
      onComplete: () => {
        gsap.set(oldPanel, { display: 'none', x: 0 });

        // Slide in new
        gsap.set(newPanel, { display: 'block', opacity: 0, x: 22 });
        gsap.to(newPanel,  { opacity: 1, x: 0, duration: 0.36, ease: 'power2.out' });

        // Stagger cards
        const cards = newPanel.querySelectorAll('.fp-card');
        gsap.fromTo(cards, { opacity: 0, y: 14 }, {
          opacity: 1, y: 0, duration: 0.38, stagger: 0.055, ease: 'power2.out',
        });

        // Stat counter
        animateStat(newPanel.querySelector('.fp-stat-value'));
      },
    });

    currentDept = id;
  }

  // ─── KEYBOARD NAV (arrow keys while hovering explorer) ───
  const explorerEl = document.getElementById('fp-explorer');
  explorerEl.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const ids  = DEPARTMENTS.map(d => d.id);
    const idx  = ids.indexOf(currentDept);
    const next = e.key === 'ArrowDown'
      ? ids[Math.min(idx + 1, ids.length - 1)]
      : ids[Math.max(idx - 1, 0)];
    activateDept(next);
  });
  explorerEl.setAttribute('tabindex', '0');

  // ─── INIT FIRST PANEL ───
  const firstPanel = document.getElementById('fp-panel-marketing');
  gsap.set(firstPanel, { display: 'block' });

  ScrollTrigger.create({
    trigger: '#fp-explorer',
    start: 'top 78%',
    once: true,
    onEnter: () => {
      const cards = firstPanel.querySelectorAll('.fp-card');
      gsap.fromTo(cards, { opacity: 0, y: 18 }, {
        opacity: 1, y: 0, duration: 0.45, stagger: 0.065, ease: 'power2.out',
      });
      animateStat(firstPanel.querySelector('.fp-stat-value'));
    },
  });

  // ─── DEPARTMENT CHAT MODAL ───
  (function initDeptModal() {
    const backdrop = document.getElementById('dm-backdrop');
    const modal    = document.getElementById('dm-modal');
    const closeBtn = document.getElementById('dm-close');
    if (!backdrop || !modal) return;

    const DEPT_INSIGHTS = {
      marketing: {
        headline: 'Attract more buyers before they find your competitors.',
        body: 'Your marketing team gets a full AI engine, from ad creation to content to syndication across every channel.',
        points: [
          'AI-generated ads for Google, Meta & YouTube, tested and optimized automatically',
          'SEO and AIO content that ranks in search results and AI overviews',
          'Inventory listings pushed to 30+ marketplaces in real time',
        ],
        stat: '3.2× average ROI on ad spend',
      },
      sales: {
        headline: 'Close more deals without adding a single headcount.',
        body: 'Every lead gets a response in under 60 seconds, 24/7. Your team shows up to qualified conversations, the AI handles everything before.',
        points: [
          '47-second average lead response time, around the clock including weekends',
          'Smart follow-up sequences that adapt to each buyer\'s behavior',
          'Lead scoring so your team always works the hottest prospects first',
        ],
        stat: '47s average lead response time',
      },
      inventory: {
        headline: 'Move more units, faster, at exactly the right price.',
        body: 'From smart pricing to automated listings, your inventory team gets real-time intelligence to turn units faster and stop leaving money on the table.',
        points: [
          'AI pricing based on live demand, competitor rates, and days on lot',
          'Auto-generated listing descriptions and optimized photos for every unit',
          'Stale inventory alerts and demand forecasting to guide what you stock next',
        ],
        stat: '28% faster average inventory turns',
      },
      service: {
        headline: 'Turn every service visit into a long-term relationship.',
        body: 'Automated reminders, AI-surfaced upsells, and re-engagement campaigns keep customers coming back without your service team lifting a finger.',
        points: [
          'Timed service reminders by mileage and seasonal intervals across SMS and email',
          'AI-surfaced upsell opportunities served directly to your service advisors',
          'Automated win-back campaigns for customers who haven\'t visited in 6–12 months',
        ],
        stat: '62% higher service retention rate',
      },
      analytics: {
        headline: 'See everything happening across your dealership in one place.',
        body: 'One real-time dashboard for every KPI, leads, response times, conversions, team performance, and revenue, with zero manual reporting.',
        points: [
          'Unified dashboard with live data across every channel and department',
          'Full lead source attribution and ROI reporting per campaign',
          'Team performance leaderboards and custom report builder',
        ],
        stat: '100% visibility across every channel',
      },
    };

    const DEPT_CHAT_REPLIES = {
      marketing: 'That\'s a challenge we hear from almost every marketing team. DealerEdge handles ad creation, testing, and optimization automatically so you stop burning budget on underperforming creative and start seeing consistent ROI.',
      sales: 'Speed is everything in sales, and that\'s exactly what DealerEdge solves. Every inbound lead gets a response in under 60 seconds, around the clock, so your team only shows up to conversations that are already warm.',
      inventory: 'Slow-moving units and reactive pricing are margin killers. DealerEdge uses live market data to price your inventory dynamically and auto-generates optimized listings so units move faster and at better margins.',
      service: 'Keeping customers coming back takes consistent follow-up, which is hard to do manually at scale. DealerEdge automates reminders, upsell prompts, and win-back campaigns so your service bay stays full.',
      analytics: 'Flying blind across departments is one of the most common issues we solve. DealerEdge brings every KPI into one live dashboard so you always know exactly what\'s working and where to push harder.',
    };

    let selectedDept     = null;
    let selectedDeptName = null;
    let userData         = {};
    let chatPhase        = 0; // 0 = waiting for first reply

    // Build dept list in step 1
    const deptListEl = document.getElementById('dm-dept-list');
    DEPARTMENTS.forEach(dept => {
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
      selectedDept     = id;
      selectedDeptName = name;
      const insight    = DEPT_INSIGHTS[id];

      document.getElementById('dm-insight').innerHTML = `
        <p class="dm-insight-eyebrow">${name} Department</p>
        <p class="dm-insight-headline">${insight.headline}</p>
        <p class="dm-insight-body">${insight.body}</p>
        <ul class="dm-insight-points">
          ${insight.points.map(p => `<li>${p}</li>`).join('')}
        </ul>
        <span class="dm-insight-stat">${insight.stat}</span>
      `;

      document.getElementById('dm-dept-eyebrow').textContent   = `${name} Department`;
      document.getElementById('dm-dept-eyebrow-2').textContent = `${name} Department`;

      showDmStep(2);
    }

    function showDmStep(n) {
      modal.querySelectorAll('.ms-step').forEach((s, i) => {
        s.classList.toggle('ms-step--hidden', i + 1 !== n);
      });
      setTimeout(() => modal.querySelector('.ms-step:not(.ms-step--hidden) input')?.focus(), 80);
    }

    // ─── CHAT LOGIC ───
    function appendMsg(text, type) {
      const msgs = document.getElementById('dm-chat-messages');
      const el   = document.createElement('div');
      el.className = `dm-chat-msg dm-chat-msg--${type}`;
      el.textContent = text;
      msgs.appendChild(el);
      msgs.scrollTop = msgs.scrollHeight;
      return el;
    }

    function showTyping() {
      const msgs = document.getElementById('dm-chat-messages');
      const el   = document.createElement('div');
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
      const text  = input.value.trim();
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
    document.getElementById('dm-chat-input').addEventListener('keydown', e => {
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

    document.getElementById('dm-name').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('dm-next-4').click(); });
    document.getElementById('dm-email').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('dm-phone').focus(); });
    document.getElementById('dm-phone').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('dm-next-5').click(); });

    function openDeptModal(e) {
      e.preventDefault();
      selectedDept     = null;
      selectedDeptName = null;
      userData         = {};
      chatPhase        = 0;
      modal.querySelectorAll('input').forEach(i => i.value = '');
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

    document.querySelectorAll('.js-dept-modal').forEach(btn => btn.addEventListener('click', openDeptModal));
    closeBtn.addEventListener('click', closeDeptModal);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) closeDeptModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && backdrop.classList.contains('is-open')) closeDeptModal(); });
  }());

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
      let html = `<div class="cal-header"><button class="cal-nav" id="cal-prev">&#8592;</button><span class="cal-month">${MONTHS[m]} ${y}</span><button class="cal-nav" id="cal-next">&#8594;</button></div><div class="cal-grid">${DAYS.map(d => `<div class="cal-day-name">${d}</div>`).join('')}${Array(firstDay).fill('<div></div>').join('')}`;
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

  ScrollTrigger.refresh();
});
