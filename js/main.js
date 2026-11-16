/* ============================================================
   ARAYA FILMS · main.js
   Handles: Video filter, Mobile nav, Contact form validation
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Repeat the same logo group so the scrolling loop has no visible seam.
  const brandTrack = document.querySelector('.brand-strip__track');
  if (brandTrack) {
    const logos = [...brandTrack.querySelectorAll('img')];
    logos.forEach(img => { img.loading = 'eager'; });
    const copy = brandTrack.querySelector('.brand-strip__group').cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    brandTrack.appendChild(copy);
    Promise.all([...brandTrack.querySelectorAll('img')].map(img => new Promise(resolve => {
      if (img.complete) return resolve();
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    }))).then(() => {
      brandTrack.classList.add('is-ready');
    });
  }

  // ── Active Nav Highlighting ──────────────────────────────
  (function highlightActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.header__nav a');
    if (document.body.classList.contains('home-page')) {
      const sections = [...navLinks].map(link => {
        const href = link.getAttribute('href');
        return href.startsWith('#') ? document.querySelector(href) : null;
      });
      const update = () => {
        const offset = document.querySelector('.site-header').offsetHeight + 80;
        let active = 0;
        sections.forEach((section, index) => {
          if (section && section.getBoundingClientRect().top <= offset) active = index;
        });
        navLinks.forEach((link, index) => {
          link.classList.toggle('active', index === active);
          if (index === active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      };
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
      return;
    }
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  })();

  // ── Mobile Hamburger Toggle ──────────────────────────────
  const hamburger = document.querySelector('.hamburger');
  const headerNav = document.querySelector('.header__nav');

  if (hamburger && headerNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      hamburger.setAttribute(
        'aria-expanded',
        hamburger.classList.contains('open') ? 'true' : 'false'
      );
      headerNav.classList.toggle('open');
      headerNav.inert = !headerNav.classList.contains('open');
      hamburger.setAttribute('aria-label', headerNav.inert ? 'Open menu' : 'Close menu');
    });

    // Close nav when a link is clicked
    headerNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        headerNav.classList.remove('open');
        headerNav.inert = true;
        hamburger.setAttribute('aria-label', 'Open menu');
      });
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && headerNav.classList.contains('open')) {
        hamburger.click();
        hamburger.focus();
      }
    });
    {
      const header = hamburger.closest('.site-header');
      header.addEventListener('pointerover', e => {
        if (e.pointerType !== 'mouse' || !e.target.closest('.hamburger')) return;
        hamburger.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        hamburger.setAttribute('aria-label', 'Close menu');
        headerNav.classList.add('open');
        headerNav.inert = false;
      });
      header.addEventListener('pointerleave', e => {
        if (e.pointerType === 'mouse' && headerNav.classList.contains('open') && !header.contains(document.activeElement)) {
          hamburger.click();
        }
      });
    }
  }

  // ── Video Filter ─────────────────────────────────────────
  const filterItems = document.querySelectorAll('.filter-bar__item');
  const videoCards  = document.querySelectorAll('.video-card');
  const videoLimit = document.body.classList.contains('home-page') ? 6 : Infinity;

  if (filterItems.length && videoCards.length) {
    filterItems.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active state
        filterItems.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const category = btn.dataset.filter;
        let visibleCount = 0;

        videoCards.forEach(card => {
          if ((category === 'all' || card.dataset.category === category) && visibleCount < videoLimit) {
            visibleCount++;
            card.classList.remove('hidden');
            // Animate in
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            requestAnimationFrame(() => {
              card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            });
          } else {
            card.classList.add('hidden');
            card.style.transition = '';
            card.style.opacity = '';
            card.style.transform = '';
          }
        });
      });
    });
  }

  // Fall back if YouTube removes or cannot serve a full-resolution thumbnail.
  document.querySelectorAll('.video-card__thumbnail').forEach(img => {
    const fallback = () => {
      if (img.naturalWidth > 120) return;
      img.removeEventListener('load', fallback);
      img.removeEventListener('error', fallback);
      img.src = img.src.replace('/maxresdefault.jpg', '/hqdefault.jpg');
    };
    img.addEventListener('load', fallback);
    img.addEventListener('error', fallback);
    if (img.complete) fallback();
  });

  // ── Video Lightbox ───────────────────────────────────────
  const ytCards = document.querySelectorAll('.video-card[data-youtube-id]');
  if (ytCards.length) {
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = '<button class="lightbox__close" aria-label="Close video">&times;</button><div class="lightbox__frame"></div>';
    document.body.appendChild(box);
    const frame = box.querySelector('.lightbox__frame');
    const close = () => { box.classList.remove('open'); frame.innerHTML = ''; };
    const open = (id) => {
      frame.innerHTML = '<iframe src="https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0" title="Video player" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
      box.classList.add('open');
    };
    ytCards.forEach(c => {
      c.addEventListener('click', () => open(c.dataset.youtubeId));
      c.addEventListener('keydown', e => { if (e.key === 'Enter') open(c.dataset.youtubeId); });
    });
    box.addEventListener('click', e => { if (e.target !== frame && !frame.contains(e.target)) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  // ── Contact Form Validation ──────────────────────────────
  const contactForm = document.getElementById('contact-form');
  const successMsg  = document.querySelector('.form__success');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let valid = true;
      const inputs = contactForm.querySelectorAll('[required]');

      inputs.forEach(input => {
        input.style.borderColor = '';
        if (!input.value.trim()) {
          input.style.borderColor = '#c0392b';
          valid = false;
        }
      });

      // Email format check
      const emailField = contactForm.querySelector('input[type="email"]');
      if (emailField && emailField.value.trim()) {
        const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRx.test(emailField.value.trim())) {
          emailField.style.borderColor = '#c0392b';
          valid = false;
        }
      }

      if (valid && successMsg) {
        contactForm.reset();
        successMsg.classList.add('visible');
        setTimeout(() => successMsg.classList.remove('visible'), 5000);
      }
    });

    // Clear error on input
    contactForm.querySelectorAll('input, textarea').forEach(field => {
      field.addEventListener('input', () => {
        field.style.borderColor = '';
      });
    });
  }

});
