(() => {
  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll('[data-slide]')];
  const prev = carousel.querySelector('[data-carousel-prev]');
  const next = carousel.querySelector('[data-carousel-next]');
  const title = carousel.querySelector('[data-carousel-title]');
  const count = carousel.querySelector('[data-carousel-count]');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  let timer = null;
  let touchStartX = null;

  const setSlide = i => {
    index = (i + slides.length) % slides.length;
    slides.forEach((slide, idx) => {
      const active = idx === index;
      slide.classList.toggle('active', active);
      slide.tabIndex = active ? 0 : -1;
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    const active = slides[index];
    if (title) {
      title.textContent = active.dataset.title || '';
      title.href = active.href;
    }
    if (count) count.textContent = `${String(index + 1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
  };
  const stop = () => { if (timer) clearInterval(timer); timer = null; };
  const start = () => {
    if (reducedMotion || slides.length < 2 || document.hidden) return;
    stop(); timer = setInterval(() => setSlide(index + 1), 6000);
  };
  const userMove = dir => { setSlide(index + dir); stop(); window.setTimeout(start, 10000); };

  prev?.addEventListener('click', e => { e.preventDefault(); userMove(-1); });
  next?.addEventListener('click', e => { e.preventDefault(); userMove(1); });
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', start);
  carousel.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); userMove(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); userMove(1); }
  });
  carousel.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; stop(); }, {passive:true});
  carousel.addEventListener('touchend', e => {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 45) userMove(dx < 0 ? 1 : -1); else start();
    touchStartX = null;
  }, {passive:true});
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  setSlide(0); start();
})();
