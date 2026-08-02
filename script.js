/* =========================
   script.js - Vanilla JS
   - Orchestrates cinematic intro
   - Manages hearts creation & lifecycle
   - Canvas particle system for sparkles, bokeh, soft blobs
   - Button ripple effect
   - Mouse/touch parallax (throttled)
   - Optimized for high-frame-rate via requestAnimationFrame
   ========================= */

/* -------------
   Configuration (easy to tweak)
   ------------- */
const CONFIG = {
  heartCount: 10,           // max simultaneous hearts during intro; keep low for perf
  heartSpawnInterval: 420,  // ms between heart spawns during initial reveal
  particleCount: 60,        // sparkles + bokeh combined
  sparkleMaxSize: 3.6,      // px
  canvasOpacity: 0.95,
  parallaxStrength: 0.03,   // small value for luxurious subtlety
};

/* DOM references */
const body = document.body;
const heartsContainer = document.getElementById('hearts');
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d', { alpha: true });
const cardWrap = document.querySelector('.card-wrap');
const card = document.querySelector('.glass-card');
const cardGlow = document.querySelector('.card-glow');
const gradientBg = document.getElementById('gradient-bg');
const introOverlay = document.getElementById('intro-overlay');
const cta = document.getElementById('cta');

/* Reduce motion detection */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Resize canvas to fit devicePixelRatio */
function resizeCanvas(){
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', () => {
  resizeCanvas();
  // reinitialize particle positions so they remain proportional
  initParticles();
});

/* ================
   Particle System (canvas)
   - draws sparkles, soft bokeh blobs, and drifting blobs
   ================ */
let particles = [];

function random(min, max){ return Math.random() * (max - min) + min; }

function initParticles(){
  particles = [];
  const w = window.innerWidth;
  const h = window.innerHeight;
  const total = Math.max(20, Math.min(CONFIG.particleCount, Math.floor((w*h)/70000)));
  for(let i=0;i<total;i++){
    particles.push(createParticle(w,h));
  }
}
function createParticle(w,h){
  const typeRand = Math.random();
  if(typeRand < 0.6){
    // sparkle
    return {
      kind: 'spark',
      x: random(0,w),
      y: random(0,h),
      size: random(0.8, CONFIG.sparkleMaxSize),
      alpha: random(0.05, 0.6),
      vx: random(-0.05, 0.05),
      vy: random(-0.08, -0.25),
      life: random(200, 900),
      t: 0,
      sway: random(0.2, 1.4),
    };
  } else {
    // bokeh / soft blob
    return {
      kind: 'bokeh',
      x: random(0,w),
      y: random(0,h),
      size: random(40, 220),
      alpha: random(0.02, 0.12),
      vx: random(-0.02, 0.02),
      vy: random(-0.01, 0.02),
      life: Infinity,
      t: random(0,1000),
      hue: random(300, 350), // pinky-peach hue
    };
  }
}

let lastFrame = performance.now();
function drawFrame(now){
  const dt = now - lastFrame;
  lastFrame = now;
  ctx.clearRect(0,0,canvas.width, canvas.height);
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);

  // gentle global tint for warmth (very subtle)
  ctx.save();
  ctx.globalAlpha = 0.9 * CONFIG.canvasOpacity;
  // draw particles
  particles.forEach(p => {
    if(p.kind === 'spark'){
      p.t += dt;
      p.x += p.vx * dt * 0.06;
      p.y += p.vy * dt * 0.06;
      // slight horizontal sway
      const sway = Math.sin((p.t+p.sway*1000)/1200) * (p.size*0.8);
      // reduce alpha as it drifts up
      const alpha = Math.max(0, p.alpha - (p.t / p.life) * 0.9);
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.arc(p.x + sway, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
      // twinkle: small cross
      if(alpha > 0.18){
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,235,245,${alpha*0.6})`;
        ctx.lineWidth = 0.6;
        ctx.moveTo(p.x+sway-2, p.y);
        ctx.lineTo(p.x+sway+2, p.y);
        ctx.moveTo(p.x+sway, p.y-2);
        ctx.lineTo(p.x+sway, p.y+2);
        ctx.stroke();
      }
      if(p.t > p.life){
        // recycle to bottom
        p.x = random(0,w);
        p.y = h + random(10,120);
        p.t = 0;
        p.life = random(200,900);
        p.alpha = random(0.05,0.6);
      }
    } else if(p.kind === 'bokeh'){
      // soft radial gradient blob
      p.t += dt * 0.0002;
      p.x += p.vx * dt * 0.02;
      p.y += p.vy * dt * 0.02;
      // loop around edges
      if(p.x < -p.size) p.x = w + p.size;
      if(p.x > w + p.size) p.x = -p.size;
      if(p.y < -p.size) p.y = h + p.size;
      if(p.y > h + p.size) p.y = -p.size;
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      const colorA = `rgba(255, 172, 196, ${p.alpha})`;
      const colorB = `rgba(255, 230, 218, 0)`;
      grd.addColorStop(0, colorA);
      grd.addColorStop(1, colorB);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    }
  });

  ctx.restore();

  // request next frame
  animFrame = requestAnimationFrame(drawFrame);
}
let animFrame;

/* ================
   Hearts (DOM) — creates hearts gradually (intro), then occasional floating
   ================ */

/* Heart SVG markup (keeps crisp vector) */
const heartSVG = (color='linear-gradient(180deg,#ff89b5,#ff6a98)') => {
  return `
  <svg viewBox="0 0 32 29" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="g" x1="0" x2="1">
        <stop offset="0" stop-color="#ffb6c1"/>
        <stop offset="1" stop-color="#ff6a98"/>
      </linearGradient>
    </defs>
    <path d="M23.6 2c-2.4 0-4.2 1.6-5.1 3.0-.9-1.4-2.7-3-5.1-3C7.5 2 4 6 4 10.9 4 16.7 8.1 20 16 26 23.9 20 28 16.7 28 10.9 28 6 24.5 2 23.6 2z"
      fill="url(#g)" opacity="0.98" />
  </svg>`;
}

/* create a heart element placed at (x, y) percent or px; we will animate it with CSS */
function spawnHeart({left, bottom, size=42, duration=8000, delay=0} = {}){
  const el = document.createElement('div');
  el.className = 'heart';
  el.style.left = (typeof left === 'number' ? left + 'px' : left);
  el.style.bottom = (typeof bottom === 'number' ? bottom + 'px' : bottom);
  el.style.width = size + 'px';
  el.style.height = (size * 0.9) + 'px';
  // random rotation and animation duration to avoid uniformity
  const animDuration = duration + Math.round(Math.random()*4000 - 1600);
  el.style.animationDuration = animDuration + 'ms, ' + (3 + Math.random()*5) + 's';
  el.style.opacity = 0;
  el.innerHTML = heartSVG();
  heartsContainer.appendChild(el);

  // trigger animation after slight delay
  setTimeout(()=> el.classList.add('animate'), delay);

  // remove element after animation completes
  setTimeout(()=> {
    // fade out gently
    el.style.transition = 'opacity 900ms ease';
    el.style.opacity = 0;
    setTimeout(()=> { if(el && el.parentNode) el.parentNode.removeChild(el); }, 1000);
  }, animDuration + 800);
}

/* spawn hearts across width with randomized sizes & timing */
function startHeartIntro(){
  const w = window.innerWidth;
  const h = window.innerHeight;
  let spawned = 0;
  const max = Math.max(6, CONFIG.heartCount);
  const interval = setInterval(()=>{
    const left = Math.random() * (w * 0.9) + (w * 0.05);
    const bottom = Math.random() * 40 + 10; // start near bottom
    const size = Math.round(random(32, 68));
    const dur = Math.round(random(7000, 12000));
    spawnHeart({left, bottom, size, duration:dur});
    spawned++;
    if(spawned >= max) clearInterval(interval);
  }, CONFIG.heartSpawnInterval);
}

/* occasionally spawn tiny hearts to keep the scene alive (but minimal for perf) */
let keepHeartsInterval;
function keepHeartsAlive(){
  keepHeartsInterval = setInterval(()=>{
    // small chance each tick
    if(Math.random() > 0.5) return;
    const w = window.innerWidth;
    const left = Math.random() * (w * 0.92) + (w * 0.04);
    spawnHeart({ left, bottom: random(8, 60), size: random(18, 44), duration: random(6000, 12000) });
  }, 1200);
}

/* ================
   Parallax — subtle card and background movement based on pointer
   ================ */
let parallax = {x:0,y:0};
let parallaxTarget = {x:0,y:0};
let rafId;
function onPointerMove(e){
  const ev = e.touches ? e.touches[0] : e;
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const dx = (ev.clientX - cx) / cx; // -1 .. 1
  const dy = (ev.clientY - cy) / cy;
  parallaxTarget.x = dx;
  parallaxTarget.y = dy;
}
function parallaxLoop(){
  // lerp current toward target
  parallax.x += (parallaxTarget.x - parallax.x) * 0.06;
  parallax.y += (parallaxTarget.y - parallax.y) * 0.06;
  const tx = parallax.x * 100 * CONFIG.parallaxStrength;
  const ty = parallax.y * 40 * CONFIG.parallaxStrength;

  // apply transforms: card (foreground) moves slightly opposite for depth
  if(cardWrap){
    cardWrap.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
  }
  // gradient background moves a bit with same vector for cohesion
  if(gradientBg){
    gradientBg.style.transform = `translate3d(${tx * -0.2}px, ${ty * -0.4}px, 0) scale(1.02)`;
  }
  // cardGlow subtle lag
  if(cardGlow){
    cardGlow.style.transform = `translate(-50%,-50%) translate3d(${tx * -0.6}px, ${ty * -0.8}px, 0) scale(1)`;
  }

  rafId = requestAnimationFrame(parallaxLoop);
}

/* ================
   Button ripple effect
   ================ */
function createRipple(e){
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.2;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = size + 'px';
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.style.transition = 'transform 650ms cubic-bezier(.2,.9,.2,1), opacity 600ms ease';
  ripple.style.transform = 'scale(0)';
  ripple.style.opacity = '0.85';
  btn.appendChild(ripple);

  // Force reflow then animate
  requestAnimationFrame(()=> {
    ripple.style.transform = 'scale(1)';
    ripple.style.opacity = '0';
  });

  // cleanup
  setTimeout(()=> {
    if(ripple && ripple.parentNode) ripple.parentNode.removeChild(ripple);
  }, 800);
}

/* CTA hover subtle micro-interaction: add small shimmer on hover (pure CSS handles most) */

/* ================
   Init & Intro orchestration
   ================ */
function start(){
  // Prepare canvas and particles
  resizeCanvas();
  initParticles();
  lastFrame = performance.now();
  animFrame = requestAnimationFrame(drawFrame);

  // start parallax loop if not reduced motion
  if(!reduceMotion){
    window.addEventListener('mousemove', onPointerMove, {passive:true});
    window.addEventListener('touchmove', onPointerMove, {passive:true});
    parallaxLoop();
  }

  // Cinematic intro sequence:
  // 1. Fade gradient bg and canvas (CSS handles gradient fade via body.loaded).
  // 2. Slowly spawn hearts.
  // 3. Scale-in & fade-in card (CSS triggers with body.loaded).
  // 4. Show soft glow behind card
  // Use staggered timings to feel cinematic.

  // Slight delay to allow assets/fonts to load visually
  setTimeout(()=> {
    // Mark page loaded - triggers CSS transitions across elements
    body.classList.add('loaded');
    document.documentElement.classList.remove('preload');

    // Make overlay fade away after short time
    setTimeout(()=> {
      introOverlay.style.pointerEvents = 'none';
      introOverlay.style.opacity = '0';
    }, 600);

    // Spawn hearts gradually
    startHeartIntro();

    // after initial hearts, keep a low-level heart spawn
    setTimeout(()=> {
      keepHeartsAlive();
    }, 2500);

  }, 380); // slight cinematic lead

  // CTA ripple handler
  cta.addEventListener('click', function(ev){
    createRipple(ev);
    // subtle feedback: tiny bounce
    cta.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(0.98)' },
      { transform: 'scale(1)' }
    ], {
      duration: 320,
      easing: 'cubic-bezier(.2,.9,.2,1)'
    });
    // Place for user action: open modal / navigate — currently just visual
  });

  // Accessibility: keyboard activation ripple (center)
  cta.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' || e.key === ' '){
      // synthetic ripple at center
      const rect = cta.getBoundingClientRect();
      const fake = { currentTarget: cta, clientX: rect.left + rect.width/2, clientY: rect.top + rect.height/2 };
      createRipple(fake);
    }
  });
}

/* Kick off after DOM ready and fonts likely loaded (optional font load fallback) */
document.addEventListener('DOMContentLoaded', () => {
  // wait for fonts to be ready for nicer intro timing (non-blocking)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start).catch(start);
  } else {
    setTimeout(start, 80);
  }
});

/* Clean up on unload */
window.addEventListener('beforeunload', () => {
  cancelAnimationFrame(animFrame);
  if(rafId) cancelAnimationFrame(rafId);
  if(keepHeartsInterval) clearInterval(keepHeartsInterval);
});

/* Optional: small performance tip, pause animations when page not visible */
document.addEventListener('visibilitychange', () => {
  if(document.hidden){
    cancelAnimationFrame(animFrame);
    if(rafId) cancelAnimationFrame(rafId);
  } else {
    lastFrame = performance.now();
    animFrame = requestAnimationFrame(drawFrame);
    if(!rafId) parallaxLoop();
  }
});
