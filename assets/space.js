/* ===================================================================
   SPACE.JS — Starfield, constellations, click-to-disperse, shooting stars
   =================================================================== */
(function () {
  'use strict';

  // ---------- Inject the layers ----------
  function init() {
    // Remove the legacy particle canvas if present
    const legacy = document.getElementById('particle-canvas');
    if (legacy) legacy.remove();

    // Nebula div
    if (!document.querySelector('.space-nebula')) {
      const neb = document.createElement('div');
      neb.className = 'space-nebula';
      document.body.prepend(neb);
    }

    // Main canvas
    let canvas = document.getElementById('space-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'space-canvas';
      document.body.prepend(canvas);
    }

    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // ---------- Stars (3 depth layers for parallax) ----------
    const STAR_DENSITY = Math.min(1, (W * H) / (1920 * 1080));
    const STAR_COUNT = Math.round(260 * STAR_DENSITY);
    const stars = [];

    const palette = [
      'rgba(255,255,255,', // white
      'rgba(180,220,255,', // pale blue
      'rgba(255,220,180,', // warm
      'rgba(180,200,255,', // ice blue
      'rgba(220,180,255,', // lavender
    ];

    class Star {
      constructor() { this.reset(true); }
      reset(initial = false) {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        // depth: 0 (far, slow, small) → 1 (close, fast, big)
        this.depth = Math.random();
        this.r = 0.4 + this.depth * 1.8;
        this.baseAlpha = 0.35 + this.depth * 0.6;
        this.alpha = this.baseAlpha;
        this.color = palette[(Math.random() * palette.length) | 0];
        // twinkle phase
        this.phase = Math.random() * Math.PI * 2;
        this.twinkleSpeed = 0.005 + Math.random() * 0.02;
        // slow drift
        this.vx = (Math.random() - 0.5) * 0.04 * (1 + this.depth);
        this.vy = (Math.random() - 0.5) * 0.04 * (1 + this.depth);
        // parallax offset target
        this.px = 0;
        this.py = 0;
      }
      update(mx, my) {
        this.phase += this.twinkleSpeed;
        this.alpha = this.baseAlpha * (0.65 + 0.35 * Math.sin(this.phase));
        this.x += this.vx;
        this.y += this.vy;
        // parallax — closer stars react more to mouse
        const cx = W / 2, cy = H / 2;
        this.px = ((mx - cx) / cx) * 18 * this.depth;
        this.py = ((my - cy) / cy) * 18 * this.depth;
        // wrap
        if (this.x < -10) this.x = W + 10;
        if (this.x > W + 10) this.x = -10;
        if (this.y < -10) this.y = H + 10;
        if (this.y > H + 10) this.y = -10;
      }
      draw() {
        const x = this.x + this.px;
        const y = this.y + this.py;
        // glow halo for bigger stars
        if (this.depth > 0.65) {
          const grad = ctx.createRadialGradient(x, y, 0, x, y, this.r * 6);
          grad.addColorStop(0, this.color + (this.alpha * 0.45) + ')');
          grad.addColorStop(1, this.color + '0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, this.r * 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = this.color + this.alpha + ')';
        ctx.beginPath();
        ctx.arc(x, y, this.r, 0, Math.PI * 2);
        ctx.fill();
      }
      hit(mx, my) {
        const x = this.x + this.px;
        const y = this.y + this.py;
        const dx = mx - x, dy = my - y;
        // generous hit radius (easier to click small stars)
        return dx * dx + dy * dy < Math.max(this.r * 4, 12) ** 2;
      }
    }

    for (let i = 0; i < STAR_COUNT; i++) stars.push(new Star());

    // ---------- Shooting stars ----------
    const shooters = [];
    class Shooter {
      constructor() {
        const fromLeft = Math.random() > 0.5;
        this.x = fromLeft ? -50 : W + 50;
        this.y = Math.random() * H * 0.6;
        const speed = 8 + Math.random() * 6;
        const angle = fromLeft ? (Math.PI * 0.18) : (Math.PI - Math.PI * 0.18);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1;
        this.trail = [];
      }
      update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 18) this.trail.shift();
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.008;
      }
      draw() {
        for (let i = 0; i < this.trail.length; i++) {
          const t = this.trail[i];
          const a = (i / this.trail.length) * this.life * 0.9;
          ctx.fillStyle = `rgba(255,255,255,${a})`;
          ctx.beginPath();
          ctx.arc(t.x, t.y, (i / this.trail.length) * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        // bright head
        ctx.fillStyle = `rgba(255,255,255,${this.life})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 14);
        grad.addColorStop(0, `rgba(180,220,255,${this.life * 0.6})`);
        grad.addColorStop(1, 'rgba(180,220,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 14, 0, Math.PI * 2);
        ctx.fill();
      }
      dead() {
        return this.life <= 0 || this.x < -100 || this.x > W + 100 || this.y > H + 100;
      }
    }

    function maybeSpawnShooter() {
      // spawn rate ~1 every 6–14s
      if (Math.random() < 0.0025 && shooters.length < 2) {
        shooters.push(new Shooter());
      }
    }

    // ---------- Disperse particles (click effect) ----------
    const sparks = [];
    class Spark {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        const a = Math.random() * Math.PI * 2;
        const s = 1 + Math.random() * 4;
        this.vx = Math.cos(a) * s;
        this.vy = Math.sin(a) * s;
        this.life = 1;
        this.color = color;
        this.r = 0.8 + Math.random() * 1.4;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.96;
        this.vy *= 0.96;
        this.life -= 0.022;
      }
      draw() {
        ctx.fillStyle = this.color + this.life + ')';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * this.life, 0, Math.PI * 2);
        ctx.fill();
      }
      dead() { return this.life <= 0; }
    }

    function disperseStar(star) {
      const x = star.x + star.px;
      const y = star.y + star.py;
      // shockwave ring
      shockwaves.push({ x, y, r: star.r * 2, a: 0.7 });
      // sparks
      const n = 18 + Math.floor(Math.random() * 10);
      for (let i = 0; i < n; i++) sparks.push(new Spark(x, y, star.color));
      // reset star to a new spot
      star.reset();
      star.x = Math.random() * W;
      star.y = Math.random() * H;
    }

    const shockwaves = [];

    // ---------- Mouse + click ----------
    let mouseX = W / 2, mouseY = H / 2;
    window.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    // Document-level click: always hit-test stars. Doesn't prevent default,
    // so links and buttons still work — disperse is a bonus visual effect.
    document.addEventListener('click', e => {
      const cx = e.clientX, cy = e.clientY;
      let best = -1, bestD = Infinity;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const x = s.x + s.px, y = s.y + s.py;
        const dx = cx - x, dy = cy - y;
        const d2 = dx * dx + dy * dy;
        // generous hit radius (40px)
        if (d2 < bestD && d2 < 40 * 40) { bestD = d2; best = i; }
      }
      if (best >= 0) disperseStar(stars[best]);
    }, true); // capture phase, runs before content handlers

    // ---------- Constellations ----------
    // Draw lines between nearby bright stars
    function drawConstellations() {
      const bright = stars.filter(s => s.depth > 0.55);
      const MAX_D = 130;
      for (let i = 0; i < bright.length; i++) {
        const a = bright[i];
        const ax = a.x + a.px, ay = a.y + a.py;
        for (let j = i + 1; j < bright.length; j++) {
          const b = bright[j];
          const bx = b.x + b.px, by = b.y + b.py;
          const dx = ax - bx, dy = ay - by;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_D) {
            const alpha = (1 - d / MAX_D) * 0.18 * Math.min(a.alpha, b.alpha);
            ctx.strokeStyle = `rgba(140,180,255,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }
      }
    }

    // ---------- Loop ----------
    function loop() {
      ctx.clearRect(0, 0, W, H);

      maybeSpawnShooter();

      drawConstellations();

      for (let i = 0; i < stars.length; i++) {
        stars[i].update(mouseX, mouseY);
        stars[i].draw();
      }

      for (let i = shooters.length - 1; i >= 0; i--) {
        shooters[i].update();
        shooters[i].draw();
        if (shooters[i].dead()) shooters.splice(i, 1);
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        sparks[i].update();
        sparks[i].draw();
        if (sparks[i].dead()) sparks.splice(i, 1);
      }

      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const w = shockwaves[i];
        w.r += 2.2;
        w.a -= 0.025;
        if (w.a <= 0) { shockwaves.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(180,220,255,${w.a})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      requestAnimationFrame(loop);
    }
    loop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
