(() => {
  const root = document.documentElement;
  const body = document.body;

  // ---------- Theme ----------
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('sanqi-theme'); } catch {}
  const preferredDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (preferredDark ? 'dark' : 'light');
  root.classList.toggle('dark', initialTheme === 'dark');

  const updateThemeLabels = () => {
    const isDark = root.classList.contains('dark');
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.textContent = isDark ? btn.dataset.lightLabel : btn.dataset.darkLabel;
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    });
  };
  updateThemeLabels();

  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const nextDark = !root.classList.contains('dark');
      root.classList.toggle('dark', nextDark);
      try { localStorage.setItem('sanqi-theme', nextDark ? 'dark' : 'light'); } catch {}
      updateThemeLabels();
    });
  });

  // ---------- Shared modal focus helper ----------
  const focusableSelector = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])',
    'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const trapFocus = (event, container) => {
    if (event.key !== 'Tab' || !container) return;
    const nodes = [...container.querySelectorAll(focusableSelector)].filter(el => {
      return !el.hidden && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none';
    });
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  // ---------- Mobile drawer ----------
  const drawerLayer = document.querySelector('[data-drawer-layer]');
  const drawerOpen = document.querySelector('[data-drawer-open]');
  const drawerClose = document.querySelector('[data-drawer-close]');
  const drawerBackdrop = document.querySelector('[data-drawer-backdrop]');
  let lastDrawerFocus = null;

  const openDrawer = () => {
    if (!drawerLayer) return;
    lastDrawerFocus = document.activeElement;
    drawerLayer.classList.add('open');
    drawerLayer.setAttribute('aria-hidden', 'false');
    drawerOpen?.setAttribute('aria-expanded', 'true');
    body.classList.add('no-scroll');
    drawerClose?.focus();
  };

  const closeDrawer = () => {
    if (!drawerLayer) return;
    drawerLayer.classList.remove('open');
    drawerLayer.setAttribute('aria-hidden', 'true');
    drawerOpen?.setAttribute('aria-expanded', 'false');
    body.classList.remove('no-scroll');
    if (lastDrawerFocus instanceof HTMLElement) lastDrawerFocus.focus();
  };

  drawerOpen?.addEventListener('click', openDrawer);
  drawerClose?.addEventListener('click', closeDrawer);
  drawerBackdrop?.addEventListener('click', closeDrawer);
  drawerLayer?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

  // ---------- Lightbox ----------
  const lightbox = document.querySelector('[data-lightbox-root]');
  const lightboxImage = document.querySelector('[data-lightbox-image] img');
  const lightboxClose = document.querySelector('[data-lightbox-close]');
  const lightboxPrev = document.querySelector('[data-lightbox-prev]');
  const lightboxNext = document.querySelector('[data-lightbox-next]');
  const lightboxStage = document.querySelector('[data-lightbox-stage]');
  let lightboxItems = [];
  let lightboxIndex = 0;
  let lightboxFocus = null;
  let touchStartX = null;

  const updateLightbox = () => {
    const item = lightboxItems[lightboxIndex];
    if (!item || !lightboxImage) return;
    lightboxImage.src = item.dataset.lightboxSrc || item.querySelector('img')?.src || '';
    lightboxImage.alt = item.dataset.lightboxAlt || item.querySelector('img')?.alt || '';
    const many = lightboxItems.length > 1;
    if (lightboxPrev) lightboxPrev.hidden = !many;
    if (lightboxNext) lightboxNext.hidden = !many;
  };

  const openLightbox = source => {
    if (!lightbox) return;
    lightboxFocus = document.activeElement;
    const group = source.dataset.lightboxGroup;
    lightboxItems = group
      ? [...document.querySelectorAll(`[data-lightbox][data-lightbox-group="${CSS.escape(group)}"]`)]
      : [source];
    lightboxIndex = Math.max(0, lightboxItems.indexOf(source));
    updateLightbox();
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    body.classList.add('no-scroll');
    lightboxClose?.focus();
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    if (!drawerLayer?.classList.contains('open')) body.classList.remove('no-scroll');
    if (lightboxFocus instanceof HTMLElement) lightboxFocus.focus();
  };

  const moveLightbox = dir => {
    if (lightboxItems.length < 2) return;
    lightboxIndex = (lightboxIndex + dir + lightboxItems.length) % lightboxItems.length;
    updateLightbox();
  };

  document.addEventListener('click', e => {
    const source = e.target.closest('[data-lightbox]');
    if (!source) return;
    e.preventDefault();
    openLightbox(source);
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxPrev?.addEventListener('click', () => moveLightbox(-1));
  lightboxNext?.addEventListener('click', () => moveLightbox(1));
  lightboxStage?.addEventListener('click', e => {
    if (e.target === lightboxStage) closeLightbox();
  });
  lightboxStage?.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  lightboxStage?.addEventListener('touchend', e => {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 45) moveLightbox(dx < 0 ? 1 : -1);
    touchStartX = null;
  }, { passive: true });

  document.addEventListener('keydown', e => {
    if (lightbox?.classList.contains('open')) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') moveLightbox(-1);
      else if (e.key === 'ArrowRight') moveLightbox(1);
      else trapFocus(e, lightbox);
      return;
    }

    if (drawerLayer?.classList.contains('open')) {
      if (e.key === 'Escape') closeDrawer();
      else trapFocus(e, drawerLayer);
    }
  });
})();
