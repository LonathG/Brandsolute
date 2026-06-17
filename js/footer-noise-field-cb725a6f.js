/* ─────────────────────────────────────────────────────────────────
   Brandsolute — Footer "Noise to Clarity" field  (v2)
   The whole bottom half is a restless field of dots, flickering and
   drifting non-stop. Hover anywhere: the noise settles, the field
   goes quiet, and the Brandsolute wordmark surfaces and starts to
   move (a slow wave rolling through the letters). Leave: the noise
   creeps back in. Click: a ring bursts through the field.

   Story: roadblocks → results. Noise → clarity.

   The wordmark is faintly biased into the noise at all times
   (cfg.hint), so the logo is never fully gone.

   Usage:
     const field = BSNoiseField.mount(canvasEl, { logoMotion:'wave' });
     field.set({ noiseEnergy: 1.2 });

   Zero libraries. DPR aware. Sprite-blitted (handles ~10k dots).
   Pauses offscreen. Respects prefers-reduced-motion.
───────────────────────────────────────────────────────────────── */
window.BSNoiseField = (function () {
  'use strict';

  const DEFAULTS = {
    logoRows: 14,        // dot rows across the wordmark's height (sets grid pitch)
    dotScale: 0.30,      // dot radius as fraction of pitch
    baseColor: '#ECEBE3',
    hoverColor: '#E1F9A7',
    noiseEnergy: 1,      // flicker amplitude/speed multiplier
    jitter: 2.4,         // px of restless positional drift
    hint: 0.10,          // how much the logo biases the idle noise (0 = invisible)
    calmBg: 0.07,        // background dot alpha once calm
    logoMotion: 'wave',  // 'wave' | 'breathe' | 'still'
    attack: 0.055,       // calm ease-in per frame (hover)
    release: 0.022,      // noise ease-back per frame (leave)
    padX: 0.04,          // logo horizontal padding, fraction of width
    maxDots: 12000,
  };

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
  }

  function makeSprite(color) {
    const s = document.createElement('canvas');
    s.width = 32; s.height = 32;
    const c = s.getContext('2d');
    c.fillStyle = color;
    c.beginPath();
    c.arc(16, 16, 15, 0, Math.PI * 2);
    c.fill();
    return s;
  }

  function mount(target, opts) {
    const canvas = typeof target === 'string' ? document.querySelector(target) : target;
    if (!canvas || !window.BS_WORDMARK_GRID) return null;
    const cfg = Object.assign({}, DEFAULTS, opts || {});
    const src = window.BS_WORDMARK_GRID;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    let dots = [];           // {hx, hy, v, s1, s2, js1, js2, p1..p4, r2, col, row}
    let pitch = 10, dotR = 3;
    let mouse = { in: false };
    let g = 0;               // global calm factor 0(noise)..1(clarity)
    let rings = [];
    let running = false, rafId = 0, t0 = performance.now();
    let spriteBase = makeSprite(cfg.baseColor);
    let spriteHot = makeSprite(cfg.hoverColor);

    function build() {
      const rect = canvas.parentElement.getBoundingClientRect();
      W = Math.max(1, Math.round(rect.width));
      H = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Pitch: the wordmark must fit innerW at logoRows tall
      let logoRows = Math.max(8, Math.round(cfg.logoRows));
      let logoCols = Math.round(logoRows * src.cols / src.rows);
      const innerW = W * (1 - cfg.padX * 2);
      pitch = innerW / logoCols;
      // Cap total dots (small screens / huge fields)
      let cols = Math.floor(W / pitch), rows = Math.floor(H / pitch);
      while (cols * rows > cfg.maxDots && logoRows > 8) {
        logoRows -= 1;
        logoCols = Math.round(logoRows * src.cols / src.rows);
        pitch = innerW / logoCols;
        cols = Math.floor(W / pitch); rows = Math.floor(H / pitch);
      }
      dotR = pitch * cfg.dotScale;

      // Field grid, centered
      const ox = (W - cols * pitch) / 2, oy = (H - rows * pitch) / 2;
      // Logo rect in grid coords, centered horizontally, slightly below middle
      const lc0 = Math.round((cols - logoCols) / 2);
      const lr0 = Math.round((rows - logoRows) / 2);

      dots = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // logo value: resample source grid into [lc0..lc0+logoCols)x[lr0..lr0+logoRows)
          let v = 0;
          const lc = c - lc0, lr = r - lr0;
          if (lc >= 0 && lc < logoCols && lr >= 0 && lr < logoRows) {
            const sy0 = lr * src.rows / logoRows, sy1 = (lr + 1) * src.rows / logoRows;
            const sx0 = lc * src.cols / logoCols, sx1 = (lc + 1) * src.cols / logoCols;
            let sum = 0, n = 0;
            for (let sy = Math.floor(sy0); sy < Math.ceil(sy1); sy++) {
              const row = src.grid[Math.min(sy, src.rows - 1)];
              for (let sx = Math.floor(sx0); sx < Math.ceil(sx1); sx++) {
                sum += +row[Math.min(sx, src.cols - 1)]; n++;
              }
            }
            v = Math.min(1, (sum / n / 9) * 1.25);
            if (v < 0.16) v = 0;
          }
          const seed = Math.abs(Math.sin(c * 12.9898 + r * 78.233) * 43758.5453) % 1;
          const seed2 = Math.abs(Math.sin(c * 39.3468 + r * 11.135) * 24634.6345) % 1;
          dots.push({
            hx: ox + (c + 0.5) * pitch, hy: oy + (r + 0.5) * pitch,
            v,
            s1: 0.6 + seed * 2.2, s2: 0.9 + seed2 * 2.6,       // flicker speeds (rad/s)
            js1: 0.4 + seed2 * 1.1, js2: 0.4 + seed * 1.3,     // drift speeds
            p1: seed * 6.283, p2: seed2 * 6.283,
            p3: (seed + seed2) * 3.14, p4: (seed * seed2) * 6.283,
            r2: seed2,
            col: c, row: r,
          });
        }
      }
    }

    function render(now) {
      const ts = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);

      const gTarget = mouse.in ? 1 : 0;
      g += (gTarget - g) * (gTarget > g ? cfg.attack : cfg.release);
      if (g < 0.001) g = 0; if (g > 0.999) g = 1;

      rings = rings.filter(r => (now - r.born) / 1000 < 2.0);

      const energy = cfg.noiseEnergy;
      const noiseAmp = 0.40 * energy;
      const jit = cfg.jitter * (1 - g);
      const inv = 1 - g;
      const motion = cfg.logoMotion;
      const sBase = spriteBase, sHot = spriteHot;

      for (const d of dots) {
        const flick = 0.5 + 0.5 * Math.sin(ts * d.s1 * energy + d.p1) * Math.sin(ts * d.s2 * energy + d.p2);

        // ── alpha: noise state vs calm state, mixed by g ──
        const noiseA = 0.05 + noiseAmp * flick + cfg.hint * d.v;
        let calmA, isLogo = d.v > 0;
        if (isLogo) {
          let m;
          if (motion === 'wave')        m = 0.5 + 0.5 * Math.sin(d.hx * 0.02 - ts * 2.3 + d.row * 0.10);
          else if (motion === 'breathe') m = 0.5 + 0.5 * Math.sin(ts * 1.5 + (d.hx + d.hy) * 0.004);
          else                           m = 0.85;
          calmA = (0.40 + 0.55 * m) * Math.min(1, d.v * 1.35);
        } else {
          calmA = cfg.calmBg * (0.5 + 0.5 * d.r2);
        }
        let a = noiseA * inv + calmA * g;

        // ── ring burst boost ──
        let b = 0;
        for (const ring of rings) {
          const age = (now - ring.born) / 1000;
          const rr = age * 420;
          const dx = d.hx - ring.x, dy = d.hy - ring.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const prox = 1 - Math.abs(dist - rr) / 80;
          if (prox > 0) {
            const fade = Math.max(0, 1 - age / 1.8);
            const bb = prox * prox * fade;
            if (bb > b) b = bb;
          }
        }
        if (b > a) a = b;
        if (a <= 0.005) continue;
        if (a > 1) a = 1;

        // ── limeness: logo turns lime as it surfaces; rings flash lime ──
        let k = isLogo ? g : 0;
        if (b > k) k = b;

        // ── position: restless drift, stilled by calm; logo bobs on its wave ──
        let x = d.hx, y = d.hy;
        if (jit > 0.05) {
          x += Math.sin(ts * d.js1 + d.p3) * jit;
          y += Math.cos(ts * d.js2 + d.p4) * jit;
        }
        if (isLogo && g > 0.01 && motion === 'wave') {
          y += Math.sin(d.hx * 0.02 - ts * 2.3) * pitch * 0.16 * g;
        }

        const size = dotR * 2 * (0.8 + 0.25 * flick * inv + 0.30 * k * d.v);

        if (k < 0.02) {
          ctx.globalAlpha = a;
          ctx.drawImage(sBase, x - size / 2, y - size / 2, size, size);
        } else if (k > 0.98) {
          ctx.globalAlpha = a;
          ctx.drawImage(sHot, x - size / 2, y - size / 2, size, size);
        } else {
          ctx.globalAlpha = a * (1 - k);
          ctx.drawImage(sBase, x - size / 2, y - size / 2, size, size);
          ctx.globalAlpha = a * k;
          ctx.drawImage(sHot, x - size / 2, y - size / 2, size, size);
        }
      }
      ctx.globalAlpha = 1;
    }

    function frame(now) {
      render(now);
      rafId = requestAnimationFrame(frame);
    }

    // ── Reduced motion: static field; hover = logo shown plainly ──
    function staticRender(calm) {
      ctx.clearRect(0, 0, W, H);
      for (const d of dots) {
        const isLogo = d.v > 0;
        const a = calm
          ? (isLogo ? 0.9 * d.v : cfg.calmBg)
          : 0.05 + 0.20 * d.r2 + cfg.hint * d.v;
        if (a <= 0.005) continue;
        ctx.globalAlpha = Math.min(1, a);
        const size = dotR * 2 * 0.9;
        ctx.drawImage(calm && isLogo ? spriteHot : spriteBase, d.hx - size / 2, d.hy - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    }

    function start() {
      if (reduced) { staticRender(false); return; }
      if (!running) { running = true; rafId = requestAnimationFrame(frame); }
    }
    function stop() { running = false; cancelAnimationFrame(rafId); }

    // ── Events ──
    const host = canvas.parentElement;
    host.addEventListener('pointerenter', () => {
      mouse.in = true;
      if (reduced) staticRender(true);
    });
    host.addEventListener('pointerleave', () => {
      mouse.in = false;
      if (reduced) staticRender(false);
    });
    host.addEventListener('pointerdown', e => {
      if (reduced) return;
      const r = canvas.getBoundingClientRect();
      rings.push({ x: e.clientX - r.left, y: e.clientY - r.top, born: performance.now() });
    });

    if ('ResizeObserver' in window) {
      let pending = 0;
      new ResizeObserver(() => {
        clearTimeout(pending);
        pending = setTimeout(() => { build(); if (reduced) staticRender(mouse.in); else render(performance.now()); }, 80);
      }).observe(host);
    }
    if ('IntersectionObserver' in window && !reduced) {
      new IntersectionObserver(entries => {
        entries.forEach(en => en.isIntersecting ? start() : stop());
      }, { threshold: 0.02 }).observe(host);
    }

    build();
    if (!reduced) render(performance.now());
    start();

    return {
      set(next) {
        Object.assign(cfg, next);
        spriteBase = makeSprite(cfg.baseColor);
        spriteHot = makeSprite(cfg.hoverColor);
        if ('logoRows' in next || 'dotScale' in next || 'padX' in next) build();
        if (reduced) staticRender(mouse.in);
      },
      get cfg() { return cfg; },
      get debug() { return { dots: dots.length, running, reduced, W, H, pitch, dotR, g }; },
      tick(now) { render(now == null ? performance.now() : now); },
    };
  }

  return { mount };
})();
