(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const yearEl = $('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Revelação ao rolar */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  $$('[data-reveal], [data-wipe]').forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    const i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty('--d', `${Math.min(i, 4) * 0.08}s`);
    io.observe(el);
  });

  /* Menu */
  const nav = $('[data-nav]');
  const toggle = $('[data-menu-toggle]');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('.nav__links a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* Galeria horizontal presa ao rolar (desktop) */
  const gallery = $('[data-gallery]');
  const track = $('[data-track]');
  const desktop = matchMedia('(min-width: 900px)');
  let maxX = 0;

  const measureGallery = () => {
    const pin = !reduced && desktop.matches;
    gallery.classList.toggle('is-pinned', pin);
    if (!pin) {
      gallery.style.height = '';
      track.style.transform = '';
      maxX = 0;
      return;
    }
    maxX = Math.max(0, track.scrollWidth - innerWidth);
    gallery.style.height = `${maxX + innerHeight}px`;
  };
  measureGallery();
  addEventListener('resize', measureGallery);
  addEventListener('load', measureGallery);
  document.fonts?.ready.then(measureGallery);

  /* Efeitos ligados à rolagem */
  const pole = $('.pole');
  const poleStripes = $('.pole__stripes');
  const parallax = $('[data-parallax]');
  const drifts = $$('[data-drift]');
  const POLE_STEP = 76.37; // altura de um ciclo de listras
  let lastY = scrollY;
  let ticking = false;

  const onFrame = () => {
    ticking = false;
    const y = scrollY;
    const vh = innerHeight;
    const docH = document.documentElement.scrollHeight - vh;

    nav.classList.toggle('is-solid', y > 40);
    if (!nav.classList.contains('is-open')) {
      nav.classList.toggle('is-hidden', y > vh * 0.8 && y > lastY + 2);
      if (y < lastY - 2) nav.classList.remove('is-hidden');
    }
    lastY = y;

    pole.style.setProperty('--p', docH > 0 ? (y / docH).toFixed(4) : 0);

    if (reduced) return;

    poleStripes.style.setProperty('--shift', `${((y * 0.35) % POLE_STEP).toFixed(1)}px`);

    if (y < vh * 1.2) parallax.style.transform = `translate3d(0, ${(y * 0.14).toFixed(1)}px, 0)`;

    drifts.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const t = (r.top + r.height / 2 - vh / 2) / vh;
      img.style.transform = `translate3d(0, ${(t * +img.dataset.drift - 24).toFixed(1)}px, 0)`;
    });

    if (maxX > 0) {
      const top = gallery.getBoundingClientRect().top;
      const x = Math.min(maxX, Math.max(0, -top));
      track.style.transform = `translate3d(${-x.toFixed(1)}px, 0, 0)`;
    }
  };

  const requestFrame = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onFrame);
  };
  addEventListener('scroll', requestFrame, { passive: true });
  addEventListener('resize', requestFrame);
  onFrame();

  /* Lightbox */
  const lb = $('[data-lb]');
  const lbImg = $('[data-lb-img]');
  const lbCap = $('[data-lb-cap]');
  const shots = $$('[data-shot]');
  let current = 0;

  const show = (i) => {
    current = (i + shots.length) % shots.length;
    const shot = shots[current];
    const img = $('img', shot);
    lbImg.src = shot.dataset.shot;
    lbImg.alt = img.alt;
    lbCap.textContent = $('span', shot).textContent;
  };

  shots.forEach((shot, i) => shot.addEventListener('click', () => {
    show(i);
    lb.showModal();
  }));
  $('[data-lb-close]').addEventListener('click', () => lb.close());
  $('[data-lb-prev]').addEventListener('click', () => show(current - 1));
  $('[data-lb-next]').addEventListener('click', () => show(current + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
})();
