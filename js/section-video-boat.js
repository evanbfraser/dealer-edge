/* Video expand + boat scroll-scrub sections (homepage pattern, reusable on sales page) */
let videoBoatTriggers = [];

function killVideoBoatTriggers() {
  videoBoatTriggers.forEach((st) => st.kill());
  videoBoatTriggers = [];
}

function animateVideoSection() {
  const inner = document.getElementById('video-inner');
  const overlay = document.getElementById('video-overlay-text');
  const section = document.getElementById('video-section');
  if (!inner || !section || !overlay) return;
  if (!window.gsap || !window.ScrollTrigger) {
    inner.style.width = '100%';
    inner.style.borderRadius = '0';
    overlay.classList.add('visible');
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobileVideo = window.matchMedia('(max-width: 960px)').matches;
  if (prefersReducedMotion) {
    gsap.set(inner, { width: '100%', borderRadius: 0 });
    if (isMobileVideo) inner.style.setProperty('--sales-video-width', '100vw');
    overlay.classList.add('visible');
    return;
  }

  const expandProps = {
    maxWidth: '100%',
    borderRadius: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top 65%',
      end: 'center center',
      scrub: 1,
    },
  };
  if (isMobileVideo) {
    expandProps['--sales-video-width'] = '100vw';
  } else {
    expandProps.width = '100%';
  }

  const expandTween = gsap.to(inner, expandProps);

  const overlayTrigger = ScrollTrigger.create({
    trigger: inner,
    start: 'center center',
    onEnter: () => overlay.classList.add('visible'),
    onLeaveBack: () => overlay.classList.remove('visible'),
  });

  videoBoatTriggers.push(expandTween.scrollTrigger, overlayTrigger);
}

function initBoatSection() {
  const section = document.getElementById('boat-section');
  const video = document.getElementById('boat-video');
  const headOut = document.querySelector('.boat-headline--out');
  const headIn = document.querySelector('.boat-headline--in');
  const boatSub = document.getElementById('boat-sub');
  const boatCta = document.getElementById('boat-cta');
  const boatRoi = document.getElementById('boat-roi'); // optional secondary ROI CTA (deep-dive closes)
  if (!section || !video || !headOut || !headIn || !boatSub || !boatCta) return;

  let videoRequested = false;
  function requestVideo() {
    if (videoRequested) return;
    const src = video.getAttribute('data-src');
    if (!src) {
      videoRequested = true;
      return;
    }
    videoRequested = true;
    video.preload = 'auto';
    video.src = src;
    video.load();
    video.pause();
  }

  function requestVideoWhenNear() {
    const rect = section.getBoundingClientRect();
    const margin = Number(section.dataset.videoPrewarm || 900);
    if (rect.top < window.innerHeight + margin && rect.bottom > -margin) requestVideo();
  }

  function isSectionNear() {
    const rect = section.getBoundingClientRect();
    const margin = Number(section.dataset.videoPrewarm || 900);
    return rect.top < window.innerHeight + margin && rect.bottom > -margin;
  }

  video.pause();
  const on = window.DE?.on || ((target, type, handler, opts) => target.addEventListener(type, handler, opts));
  on(window, 'scroll', requestVideoWhenNear, { passive: true });
  on(window, 'resize', requestVideoWhenNear, { passive: true });
  requestVideoWhenNear();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (!hasGsap) {
    const setText = (progress) => {
      const fade = (value, start, end) => Math.max(0, Math.min(1, (value - start) / (end - start)));
      const headOutOpacity = 1 - fade(progress, 0.16, 0.26);
      const headInOpacity = fade(progress, 0.22, 0.34);
      const subOpacity = fade(progress, 0.28, 0.42);
      const ctaOpacity = fade(progress, 0.34, 0.48);
      headOut.style.opacity = String(headOutOpacity);
      headOut.style.transform = `translateY(${-30 * (1 - headOutOpacity)}px)`;
      headIn.style.opacity = String(headInOpacity);
      headIn.style.transform = `translateY(${30 * (1 - headInOpacity)}px)`;
      boatSub.style.opacity = String(subOpacity);
      boatSub.style.transform = `translateY(${16 * (1 - subOpacity)}px)`;
      boatSub.style.pointerEvents = subOpacity > 0.9 ? 'auto' : 'none';
      boatCta.style.opacity = String(ctaOpacity);
      boatCta.style.transform = `translateY(${20 * (1 - ctaOpacity)}px)`;
      boatCta.style.pointerEvents = ctaOpacity > 0.9 ? 'auto' : 'none';
      if (boatRoi) {
        boatRoi.style.opacity = String(ctaOpacity);
        boatRoi.style.transform = `translateY(${18 * (1 - ctaOpacity)}px)`;
        boatRoi.style.pointerEvents = ctaOpacity > 0.9 ? 'auto' : 'none';
      }
    };
    const updateNative = () => {
      const rect = section.getBoundingClientRect();
      const total = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / total));
      scrub(progress);
      setText(progress);
    };
    on(window, 'scroll', updateNative, { passive: true });
    on(window, 'resize', updateNative, { passive: true });
    updateNative();
    return;
  }

  if (prefersReducedMotion) {
    requestVideo();
    gsap.set([headOut, headIn, boatSub, boatCta], { clearProps: 'opacity,transform' });
    headOut.style.opacity = '0';
    headIn.style.opacity = '1';
    headIn.style.transform = 'none';
    boatSub.style.opacity = '1';
    boatSub.style.transform = 'none';
    boatSub.style.pointerEvents = 'auto';
    boatCta.style.opacity = '1';
    boatCta.style.transform = 'none';
    boatCta.style.pointerEvents = 'auto';
    if (boatRoi) {
      boatRoi.style.opacity = '1';
      boatRoi.style.transform = 'none';
      boatRoi.style.pointerEvents = 'auto';
    }
    if (video.readyState >= 1 && video.duration) {
      video.currentTime = video.duration * 0.37;
    }
    return;
  }

  function scrub(progress) {
    if (progress > 0.001 || isSectionNear()) requestVideo();
    if (video.readyState >= 1 && video.duration) {
      video.currentTime = progress * video.duration;
    }
  }

  const isMobileBoat = window.matchMedia('(max-width: 960px)').matches;
  const headOutAt = 0.2;
  const headInAt = isMobileBoat ? 0.22 : 0.28;
  const subAt = isMobileBoat ? 0.25 : 0.33;
  const ctaAt = isMobileBoat ? 0.3 : 0.37;

  const scrubTrigger = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => scrub(self.progress),
  });

  const textTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
    },
  })
    .to(headOut, { opacity: 0, y: -30, duration: 0.1, ease: 'power2.in' }, headOutAt)
    .fromTo(headIn, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, headInAt)
    .fromTo(
      boatSub,
      { opacity: 0, y: 16, pointerEvents: 'none' },
      { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.1, ease: 'power2.out' },
      subAt
    )
    .fromTo(
      boatCta,
      { opacity: 0, y: 20, pointerEvents: 'none' },
      { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.1, ease: 'power2.out' },
      ctaAt
    );

  if (boatRoi) {
    textTimeline.fromTo(
      boatRoi,
      { opacity: 0, y: 18, pointerEvents: 'none' },
      { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.1, ease: 'power2.out' },
      ctaAt + 0.02
    );
  }

  videoBoatTriggers.push(scrubTrigger, textTimeline.scrollTrigger);
}

function initVideoBoatSections() {
  killVideoBoatTriggers();
  animateVideoSection();
  initBoatSection();
  if (window.ScrollTrigger) ScrollTrigger.refresh();
}
