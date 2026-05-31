function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const panel = document.getElementById('nav-mobile-panel');
  if (!toggle || !panel) return;
  if (toggle.dataset.mobileNavBound === 'true') return;
  toggle.dataset.mobileNavBound = 'true';

  function closeNav() {
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function openNav() {
    toggle.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  toggle.addEventListener('click', () => {
    if (panel.classList.contains('is-open')) closeNav();
    else openNav();
  });

  panel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => closeNav());
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) closeNav();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNav, { once: true });
} else {
  initMobileNav();
}
