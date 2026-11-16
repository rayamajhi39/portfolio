/* ============================================================
   ARAYA FILMS · effects.js — scroll reveals, cursor, 3D ring…
   ============================================================ */
(() => {
  const isHome = document.body.classList.contains('home-page');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // ── Scroll progress bar ────────────────────────────────
  const bar = document.createElement('div');
  if (isHome) bar.hidden = true;
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);

  // ── Reveal on scroll (auto-tagged) ─────────────────────
  const revealSel = [
    '.filter-bar', '.video-card', '.about__image', '.about__text p',
    '.contact__info > *', '.contact__form-wrap',
    '.explore .tile', '.marquee'
  ].join(',');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  if (!isHome) $$(revealSel).forEach((el, i) => {
    el.classList.add('reveal');
    const sibs = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
    el.style.setProperty('--delay', Math.min(sibs % 3, 3) * 120 + 'ms');
    io.observe(el);
  });
  // Re-trigger reveal for cards revealed by filter
  $$('.filter-bar__item').forEach(b => b.addEventListener('click', () =>
    $$('.video-card').forEach(c => c.classList.add('in-view'))));

  // ── Hero title letters ─────────────────────────────────
  if (!isHome) $$('.hero__title').forEach(t => {
    const text = t.textContent.trim();
    t.setAttribute('aria-label', text);
    t.innerHTML = [...text].map((ch, i) =>
      `<span aria-hidden="true" style="animation-delay:${0.15 + i * 0.05}s">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  });

  // ── Page transition on internal links ──────────────────
  if (!isHome) document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:)/.test(href)) return;
    e.preventDefault();
    document.body.classList.add('is-leaving');
    setTimeout(() => { window.location.href = href; }, 320);
  });
  window.addEventListener('pageshow', e => { if (e.persisted) document.body.classList.remove('is-leaving'); });

  // ── 3D Photo ring driven by scroll ─────────────────────
  const section = document.querySelector('.ring-section');
  if (section) {
    const ring = section.querySelector('.ring');
    const stage = section.querySelector('.ring-stage');
    const items = $$('.ring__item', section);
    const n = items.length;
    const countEl = section.querySelector('[data-count]');
    const fill = section.querySelector('.ring-stage__bar i');
    let radius = 520;
    const layout = () => {
      const vw = window.innerWidth;
      const cw = vw < 600 ? 190 : vw < 1024 ? 230 : 290;
      const ch = Math.round(cw * 1.36);
      radius = Math.round((cw + 40) / 2 / Math.tan(Math.PI / n));
      ring.style.setProperty('--r', radius + 'px');
      section.style.setProperty('--cw', cw + 'px');
      section.style.setProperty('--ch', ch + 'px');
      items.forEach((it, i) => it.style.setProperty('--a', (360 / n) * i + 'deg'));
    };
    layout();

    let target = 0, cur = 0;
    let frame = 0, lastTime = 0, lastFront = -1;
    const tick = (time) => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - stage.offsetHeight;
      target = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)));
      const dt = lastTime ? Math.min(time - lastTime, 64) : 1000 / 60;
      lastTime = time;
      // Time-based damping feels the same on standard and high-refresh screens.
      cur += (target - cur) * (reduce ? 1 : 1 - Math.exp(-dt / 100));
      if (target === 0 || target === 1 || Math.abs(target - cur) < 0.0001) cur = target;
      const rot = -cur * 360 * (1 - 1 / n);                  // end on last photo
      ring.style.transform = `translateY(-50%) rotateX(-6deg) rotateY(${rot}deg)`;
      let front = 0, best = -2;
      items.forEach((it, i) => {
        const ang = ((360 / n) * i + rot) * Math.PI / 180;
        const c = Math.cos(ang);
        it.style.setProperty('--shade', (0.36 * (1 - c)).toFixed(3));
        if (c > best) { best = c; front = i; }
      });
      if (countEl && front !== lastFront) countEl.textContent = String(front + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
      lastFront = front;
      if (fill) fill.style.transform = `scaleX(${cur})`;
      if (cur !== target) frame = requestAnimationFrame(tick);
      else lastTime = 0;
    };
    const update = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', () => { layout(); update(); });
    update();

  }

  // ── Global scroll progress ─────────────────────────────
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
