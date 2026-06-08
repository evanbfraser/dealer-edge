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

  // Platform group accordion (mobile). The trigger is a <button>, not an <a>,
  // so the close-on-link handler above never fires for it.
  panel.querySelectorAll('.nav-mobile-group-trigger').forEach((trigger) => {
    const sub = trigger.nextElementSibling;
    if (!sub || !sub.classList.contains('nav-mobile-sub')) return;
    // Auto-open the group that contains the current page.
    if (sub.querySelector('a.nav-link--active')) {
      trigger.classList.add('is-open');
      sub.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }
    trigger.addEventListener('click', () => {
      const open = sub.classList.toggle('is-open');
      trigger.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNav, { once: true });
} else {
  initMobileNav();
}
