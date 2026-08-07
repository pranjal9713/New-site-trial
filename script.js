/* =====================================================================
   FOREVER & ALWAYS — Premium Romantic Experience
   script.js — Pure vanilla JS, no dependencies.
   Sections: Loader / Particles / Floating Hearts / Cursor Glow /
   Scroll Reveal / Dot Nav / Parallax / Buttons & Ripple / Timeline /
   Surprise Reveal / Misc
   ===================================================================== */
(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* -------------------------------------------------------------------
     LOADER — simulate a graceful load, then reveal the site
     ------------------------------------------------------------------- */
  function initLoader() {
    const loader = document.getElementById('loader');
    const fill = document.getElementById('loaderBarFill');
    let progress = 0;

    const tick = () => {
      // Ease toward 100, slowing near the end for a premium feel
      progress += (100 - progress) * 0.09 + 0.6;
      if (progress > 99.4) progress = 100;
      fill.style.width = progress + '%';
      if (progress < 100) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          loader.classList.add('hidden');
          document.body.style.overflow = '';
          playHeroIntro();
          initMusic();
        }, 260);
      }
    };
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(tick);
  }

  function playHeroIntro() {
    // Hero card content already animates via CSS .reveal-line/.reveal-fade
    // Trigger a soft heart burst behind the card for a cinematic welcome
    spawnBurst(window.innerWidth / 2, window.innerHeight / 2, 10);
  }

  /* -------------------------------------------------------------------
     PARTICLE CANVAS — soft glowing bokeh + sparkles, 60fps, capped count
     ------------------------------------------------------------------- */
  function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let w, h, particles;
    const COUNT = window.innerWidth < 700 ? 26 : 46;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', debounce(resize, 200));

    function makeParticle() {
      const isSparkle = Math.random() > 0.6;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: isSparkle ? Math.random() * 1.6 + 0.6 : Math.random() * 4 + 2,
        baseAlpha: Math.random() * 0.35 + 0.15,
        alpha: 0,
        speed: Math.random() * 0.25 + 0.05,
        drift: (Math.random() - 0.5) * 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        sparkle: isSparkle,
        hue: Math.random() > 0.5 ? '255,157,184' : '216,160,90'
      };
    }
    particles = Array.from({ length: COUNT }, makeParticle);

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.twinklePhase += p.twinkleSpeed;
        p.alpha = p.baseAlpha * (0.5 + 0.5 * Math.sin(p.twinklePhase));
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        ctx.beginPath();
        if (p.sparkle) {
          drawSparkle(ctx, p.x, p.y, p.r * 3, p.alpha);
        } else {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          grad.addColorStop(0, `rgba(${p.hue},${p.alpha})`);
          grad.addColorStop(1, `rgba(${p.hue},0)`);
          ctx.fillStyle = grad;
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (!prefersReducedMotion) requestAnimationFrame(draw);
    }

    function drawSparkle(ctx, x, y, size, alpha) {
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fff8f4';
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.quadraticCurveTo(size * 0.15, -size * 0.15, size, 0);
      ctx.quadraticCurveTo(size * 0.15, size * 0.15, 0, size);
      ctx.quadraticCurveTo(-size * 0.15, size * 0.15, -size, 0);
      ctx.quadraticCurveTo(-size * 0.15, -size * 0.15, 0, -size);
      ctx.fill();
      ctx.restore();
    }

    draw();
  }

  /* -------------------------------------------------------------------
     FLOATING HEARTS — DOM-based, CSS-driven upward drift
     ------------------------------------------------------------------- */
  const HEART_SVG = `<svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg"><path d="M50 85 C20 60 0 40 0 20 C0 5 12 -2 25 3 C35 7 45 15 50 25 C55 15 65 7 75 3 C88 -2 100 5 100 20 C100 40 80 60 50 85 Z"/></svg>`;

  function initFloatingHearts() {
    const field = document.getElementById('heartField');
    const count = window.innerWidth < 700 ? 10 : 18;

    for (let i = 0; i < count; i++) {
      spawnHeart(field, true);
    }
  }

  function spawnHeart(field, initial) {
    const el = document.createElement('div');
    el.className = 'floating-heart';
    el.innerHTML = HEART_SVG;

    const size = Math.random() * 18 + 10;
    const duration = Math.random() * 10 + 12;
    const delay = initial ? Math.random() * duration : 0;
    const left = Math.random() * 100;
    const drift = (Math.random() * 80 - 40) + 'px';
    const rot = (Math.random() * 30 - 15) + 'deg';
    const scale = (Math.random() * 0.6 + 0.6).toFixed(2);
    const opacity = (Math.random() * 0.35 + 0.25).toFixed(2);

    el.style.left = left + 'vw';
    el.style.width = size + 'px';
    el.style.height = size * 0.9 + 'px';
    el.style.setProperty('--drift', drift);
    el.style.setProperty('--rot', rot);
    el.style.setProperty('--s', scale);
    el.style.setProperty('--o', opacity);
    el.style.animationDuration = duration + 's';
    el.style.animationDelay = '-' + delay + 's';

    field.appendChild(el);
  }

  /* -------------------------------------------------------------------
     CURSOR GLOW — desktop only, follows pointer with slight lag
     ------------------------------------------------------------------- */
  function initCursorGlow() {
    if (isTouch || prefersReducedMotion) return;
    const glow = document.getElementById('cursorGlow');
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let cx = tx, cy = ty;
    let active = false;

    window.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!active) { active = true; glow.classList.add('active'); }
    });

    function loop() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* -------------------------------------------------------------------
     PARALLAX — background blobs + hero card respond to pointer/touch
     ------------------------------------------------------------------- */
  function initParallax() {
    if (prefersReducedMotion) return;
    const blobs = document.querySelectorAll('.bg-blob');
    const heroCard = document.getElementById('heroCard');
    let px = 0, py = 0, cx = 0, cy = 0;

    function apply() {
      cx += (px - cx) * 0.06;
      cy += (py - cy) * 0.06;
      blobs.forEach((b, i) => {
        const depth = (i + 1) * 6;
        b.style.transform = `translate(${cx * depth}px, ${cy * depth}px)`;
      });
      if (heroCard) {
        heroCard.style.transform = `translate(${cx * 10}px, ${cy * 10}px)`;
      }
      requestAnimationFrame(apply);
    }

    function setFromPointer(x, y) {
      px = (x / window.innerWidth - 0.5) * 2;
      py = (y / window.innerHeight - 0.5) * 2;
    }

    window.addEventListener('mousemove', (e) => setFromPointer(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
      if (e.touches[0]) setFromPointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    apply();
  }

  /* -------------------------------------------------------------------
     SCROLL REVEAL — IntersectionObserver toggles .in-view
     ------------------------------------------------------------------- */
  function initScrollReveal() {
    const items = document.querySelectorAll('.reveal-on-scroll');
    items.forEach((el, i) => el.style.setProperty('--i', i % 8));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });

    items.forEach((el) => observer.observe(el));
  }

  /* -------------------------------------------------------------------
     SCROLL PROGRESS BAR + DOT NAV ACTIVE STATE
     ------------------------------------------------------------------- */
  function initScrollProgress() {
    const fill = document.getElementById('scrollProgressFill');
    const sections = document.querySelectorAll('[data-section]');
    const dots = document.querySelectorAll('.dot');

    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      fill.style.width = pct + '%';

      // Determine active section (closest to viewport center)
      let activeIndex = 0;
      let minDist = Infinity;
      sections.forEach((sec, i) => {
        const rect = sec.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
        if (dist < minDist) { minDist = dist; activeIndex = i; }
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === activeIndex));
    }

    window.addEventListener('scroll', throttle(update, 60), { passive: true });
    update();
  }

  function initDotNavClicks() {
    document.querySelectorAll('.dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        const target = document.getElementById(dot.dataset.target);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  /* -------------------------------------------------------------------
     TIMELINE FILL — line grows as the timeline scrolls into view
     ------------------------------------------------------------------- */
  function initTimelineFill() {
    const track = document.getElementById('timelineTrack');
    const fill = document.getElementById('timelineFill');
    if (!track || !fill) return;

    function update() {
      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height;
      let progressed = vh * 0.6 - rect.top;
      progressed = Math.max(0, Math.min(progressed, total));
      const pct = total > 0 ? (progressed / total) * 100 : 0;
      fill.style.height = pct + '%';
    }
    window.addEventListener('scroll', throttle(update, 40), { passive: true });
    update();
  }

  /* -------------------------------------------------------------------
     BUTTONS — ripple effect + smooth scroll for hero CTA
     ------------------------------------------------------------------- */
  function initButtons() {
    document.querySelectorAll('.glow-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height) * 1.4;
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });

    const beginBtn = document.getElementById('beginBtn');
    if (beginBtn) {
      beginBtn.addEventListener('click', () => {
        document.getElementById('story').scrollIntoView({ behavior: 'smooth' });
      });
    }

    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* -------------------------------------------------------------------
     SURPRISE SECTION — wax seal click reveals message + heart burst
     ------------------------------------------------------------------- */
  function initSurprise() {
    const seal = document.getElementById('waxSeal');
    const reveal = document.getElementById('surpriseReveal');
    if (!seal || !reveal) return;

    seal.addEventListener('click', () => {
      seal.classList.add('opened');
      reveal.classList.add('visible');
      const rect = seal.getBoundingClientRect();
      spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 16);
    });
  }

  function spawnBurst(x, y, count) {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '0';
    container.style.height = '0';
    container.style.zIndex = '80';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);

    for (let i = 0; i < count; i++) {
      const heart = document.createElement('div');
      heart.textContent = '♥';
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = Math.random() * 120 + 60;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 40;
      heart.style.position = 'fixed';
      heart.style.left = x + 'px';
      heart.style.top = y + 'px';
      heart.style.color = Math.random() > 0.5 ? '#e8567d' : '#d8a05a';
      heart.style.fontSize = (Math.random() * 14 + 12) + 'px';
      heart.style.opacity = '1';
      heart.style.transition = 'transform 1s cubic-bezier(0.22,1,0.36,1), opacity 1s ease-out';
      heart.style.willChange = 'transform, opacity';
      container.appendChild(heart);

      requestAnimationFrame(() => {
        heart.style.transform = `translate(${dx}px, ${dy}px) scale(0.4) rotate(${Math.random() * 60 - 30}deg)`;
        heart.style.opacity = '0';
      });
    }
    setTimeout(() => container.remove(), 1100);
  }

  /* -------------------------------------------------------------------
     BACKGROUND MUSIC — attempts autoplay, falls back to first interaction
     ------------------------------------------------------------------- */
  function initMusic() {
  const audio = document.getElementById("bgMusic");
  const toggle = document.getElementById("musicToggle");

  if (!audio) return;

  audio.volume = 0.55;

  function playMusic() {
    audio.play().catch(() => {});
  }

  // User ke pehle touch/click par music start hoga
  document.addEventListener("click", playMusic, { once: true });
  document.addEventListener("touchstart", playMusic, { once: true });

  if (toggle) {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();

      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    });
  }
  }

  /* -------------------------------------------------------------------
     UTILITIES
     ------------------------------------------------------------------- */
  function debounce(fn, wait) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }
  function throttle(fn, wait) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= wait) { last = now; fn(...args); }
    };
  }

  /* -------------------------------------------------------------------
     INIT — run once DOM is ready
     ------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initFloatingHearts();
    initCursorGlow();
    initScrollReveal();
    initScrollProgress();
    initDotNavClicks();
    initTimelineFill();
    initButtons();
    initSurprise();
    if (!prefersReducedMotion) {
      initParticles();
      initParallax();
    }
  });
})();
