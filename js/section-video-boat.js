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
  if (!section || !video || !headOut || !headIn || !boatSub || !boatCta) return;

  video.pause();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
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
    if (video.readyState >= 1 && video.duration) {
      video.currentTime = video.duration * 0.37;
    }
    return;
  }

  function scrub(progress) {
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

  videoBoatTriggers.push(scrubTrigger, textTimeline.scrollTrigger);
}

function initVideoBoatSections() {
  killVideoBoatTriggers();
  animateVideoSection();
  initBoatSection();
  ScrollTrigger.refresh();
}
