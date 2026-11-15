/* Ironfall: drawing helpers, sprite caches, particles and explosions */
"use strict";

(function (XA) {
  const U = XA.U, W = U.W, H = U.H, TAU = U.TAU;
  const Gfx = (XA.Gfx = { spr: {}, cache: {} });
  const S = 2; // sprite supersampling
  Gfx.S = S;

  /* ---------- Helpers ---------- */
  function mk(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = Math.ceil(w * S); c.height = Math.ceil(h * S);
    const g = c.getContext("2d");
    g.scale(S, S);
    g.lineJoin = "round"; g.lineCap = "round";
    draw(g, w, h);
    c.w = w; c.h = h;
    return c;
  }
  function whiteOf(c) {
    const w = document.createElement("canvas");
    w.width = c.width; w.height = c.height;
    const g = w.getContext("2d");
    g.drawImage(c, 0, 0);
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = "#fff";
    g.fillRect(0, 0, w.width, w.height);
    w.w = c.w; w.h = c.h;
    return w;
  }
  const lin = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); for (const [o, c] of stops) gr.addColorStop(o, c); return gr; };
  const rad = (g, x, y, r0, r1, stops, x1, y1) => { const gr = g.createRadialGradient(x, y, r0, x1 === undefined ? x : x1, y1 === undefined ? y : y1, r1); for (const [o, c] of stops) gr.addColorStop(o, c); return gr; };
  const ell = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); };
  const circ = (g, x, y, r) => { g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, TAU); };
  const poly = (g, pts) => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); };
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  function lamp(g, x, y, r, rgb) {
    g.fillStyle = rad(g, x, y, 0, r * 2.4, [[0, `rgba(${rgb},0.9)`], [0.35, `rgba(${rgb},0.35)`], [1, `rgba(${rgb},0)`]]);
    circ(g, x, y, r * 2.4); g.fill();
    g.fillStyle = rad(g, x - r * 0.3, y - r * 0.3, 0, r, [[0, "#fff"], [0.5, `rgb(${rgb})`], [1, `rgba(${rgb},0.8)`]]);
    circ(g, x, y, r); g.fill();
  }
  // metallic plate with bevel
  function plate(g, x, y, w, h, r, base, light, dark) {
    g.fillStyle = lin(g, x, y, x, y + h, [[0, light], [0.45, base], [1, dark]]);
    rr(g, x, y, w, h, r); g.fill();
    g.strokeStyle = "rgba(0,0,0,0.55)"; g.lineWidth = 1.2; g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.25)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x + r, y + 1); g.lineTo(x + w - r, y + 1); g.stroke();
  }
  Object.assign(Gfx, { mk, whiteOf, lin, rad, ell, circ, poly, rr, lamp, plate });

  /* ---------- Glow and smoke sprites ---------- */
  const glowCache = {};
  Gfx.glow = function (rgb, hot) {
    const key = rgb + (hot ? "h" : "");
    let c = glowCache[key];
    if (c) return c;
    c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const st = hot
      ? [[0, "rgba(255,255,255,1)"], [0.14, `rgba(${rgb},1)`], [0.42, `rgba(${rgb},0.35)`], [1, `rgba(${rgb},0)`]]
      : [[0, `rgba(${rgb},1)`], [0.22, `rgba(${rgb},0.7)`], [0.55, `rgba(${rgb},0.2)`], [1, `rgba(${rgb},0)`]];
    g.fillStyle = rad(g, 32, 32, 0, 32, st);
    g.fillRect(0, 0, 64, 64);
    glowCache[key] = c;
    return c;
  };
  Gfx.glowAt = function (ctx, rgb, x, y, r, a = 1, hot = false) {
    if (a <= 0.003) return;
    const op = ctx.globalCompositeOperation, al = ctx.globalAlpha;
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = al * Math.min(1, a);
    ctx.drawImage(Gfx.glow(rgb, hot), x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = al;
    ctx.globalCompositeOperation = op;
  };
  Gfx.smoke = (function () {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    for (let i = 0; i < 7; i++) {
      const x = 32 + U.rand(-9, 9), y = 32 + U.rand(-9, 9), r = U.rand(12, 22);
      g.fillStyle = rad(g, x, y, 0, r, [[0, "rgba(70,66,72,0.42)"], [0.6, "rgba(55,52,58,0.2)"], [1, "rgba(40,40,46,0)"]]);
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    return c;
  })();

  /* ---------- Sprite drawing ---------- */
  Gfx.put = function (ctx, c, x, y, rot = 0, scale = 1, flip = false, alpha = 1) {
    if (!c) return;
    const w = c.w * scale, h = c.h * scale;
    if (alpha !== 1) ctx.globalAlpha *= alpha;
    if (rot || flip) {
      ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); if (flip) ctx.scale(-1, 1);
      ctx.drawImage(c, -w / 2, -h / 2, w, h);
      ctx.restore();
    } else ctx.drawImage(c, x - w / 2, y - h / 2, w, h);
    if (alpha !== 1) ctx.globalAlpha /= alpha;
  };
  // Animated sprites: frames are rendered lazily and cached. fn(g, w, h, phase 0..1)
  const animCache = {};
  Gfx.anim = function (key, frames, w, h, fn, phase) {
    let a = animCache[key];
    if (!a) a = animCache[key] = { f: new Array(frames), wf: new Array(frames) };
    let i = Math.floor((((phase % 1) + 1) % 1) * frames) % frames;
    if (!a.f[i]) { const ph = i / frames; a.f[i] = mk(w, h, (g) => fn(g, w, h, ph)); }
    return a.f[i];
  };
  Gfx.animWhite = function (key, frames, w, h, fn, phase) {
    const c = Gfx.anim(key, frames, w, h, fn, phase);
    if (!c.white) c.white = whiteOf(c);
    return c.white;
  };
  // static sprite cache
  Gfx.sprite = function (key, w, h, fn) {
    let c = Gfx.cache[key];
    if (!c) c = Gfx.cache[key] = mk(w, h, fn);
    return c;
  };
  Gfx.spriteWhite = function (key, w, h, fn) {
    const c = Gfx.sprite(key, w, h, fn);
    if (!c.white) c.white = whiteOf(c);
    return c.white;
  };

  // Jagged lightning between two points (drawn on the fly)
  Gfx.bolt = function (ctx, x0, y0, x1, y1, rgb, width, jag = 14, seed = Math.random()) {
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(3, Math.floor(len / 22));
    const nx = -(y1 - y0) / (len || 1), ny = (x1 - x0) / (len || 1);
    const r = U.rng((seed * 1e9) | 0);
    const pts = [[x0, y0]];
    for (let i = 1; i < n; i++) {
      const f = i / n, o = (r() * 2 - 1) * jag * Math.sin(f * Math.PI);
      pts.push([x0 + (x1 - x0) * f + nx * o, y0 + (y1 - y0) * f + ny * o]);
    }
    pts.push([x1, y1]);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    for (const [lw, a, col] of [[width * 4, 0.18, `rgb(${rgb})`], [width * 1.8, 0.5, `rgb(${rgb})`], [width * 0.6, 1, "#ffffff"]]) {
      ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
    ctx.restore();
    return pts;
  };

  /* ---------- Particles ---------- */
  const Fx = (XA.Fx = { list: [], shake: 0, flash: 0, flashRGB: "255,255,255", max: 2200, q: 1, scorch: [] });
  const FIRE = ["255,250,215", "255,214,110", "255,150,50", "255,96,30", "220,50,20"];
  Fx.FIRE = FIRE;

  Fx.clear = function () { Fx.list.length = 0; Fx.shake = 0; Fx.flash = 0; Fx.scorch.length = 0; };
  Fx.add = function (p) {
    if (Fx.list.length >= Fx.max) return;
    p.life = p.max = p.life || 0.5;
    if (p.drag === undefined) p.drag = 0;
    Fx.list.push(p);
  };
  Fx.glow = (x, y, size, size2, rgb, life, o = {}) => Fx.add(Object.assign({ k: "glow", x, y, vx: 0, vy: 0, size, size2, rgb, life }, o));

  Fx.explode = function (x, y, size, o = {}) {
    const n = Math.min(70, 6 + Math.floor(size * 0.7)) * Fx.q;
    const tint = o.rgb, d0 = o.delay || 0;
    Fx.glow(x, y, size * 2.2, size * 3.4, "255,255,240", 0.16, { hot: true, delay: d0 });
    Fx.glow(x, y, size * 5, size * 6.5, tint || "255,170,90", 0.38, { a: 0.35, delay: d0 });
    for (let i = 0; i < n * 0.42; i++) {
      const a = U.rand(TAU), sp = U.rand(0.2, 1) * size * 3.2;
      Fx.glow(x + Math.cos(a) * size * 0.2, y + Math.sin(a) * size * 0.2, U.rand(0.35, 0.8) * size, U.rand(0.9, 1.7) * size,
        tint && Math.random() < 0.5 ? tint : U.pick(FIRE), U.rand(0.35, 0.95), { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - size * 0.6, drag: 3.2, hot: Math.random() < 0.4, delay: d0 });
    }
    for (let i = 0; i < n; i++) {
      const a = U.rand(TAU), sp = U.rand(5, 15) * Math.min(size, 50);
      Fx.add({ k: "spark", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: U.rand(0.25, 0.7), drag: 3.5, g: 500, rgb: U.pick(FIRE.slice(0, 3)), w: U.rand(1.2, 2.8), delay: d0 });
    }
    if (size > 14) {
      for (let i = 0; i < Math.min(18, size / 4.5) * Fx.q; i++) {
        const a = U.rand(Math.PI, TAU), sp = U.rand(120, 380) * Math.min(2, size / 40 + 0.5);
        Fx.add({ k: "debris", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, life: U.rand(1, 2.2), drag: 0.6, g: 900, rot: U.rand(TAU), vr: U.rand(-12, 12), s: U.rand(2.5, 6) * Math.min(2, size / 30 + 0.6), st: 0, col: o.debris || "#3a3a44", delay: d0 });
      }
    }
    for (let i = 0; i < n * 0.3; i++) {
      const a = U.rand(TAU), sp = U.rand(10, 70);
      Fx.add({ k: "smoke", x: x + U.rand(-size, size) * 0.4, y: y + U.rand(-size, size) * 0.4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, size: size * U.rand(0.5, 0.8), size2: size * U.rand(1.6, 2.8), life: U.rand(0.9, 1.9), drag: 1.5, delay: d0 + 0.08 });
    }
    Fx.add({ k: "ring", x, y, size: size * 0.3, size2: size * 3.6, life: 0.5, rgb: "255,230,190", w: Math.max(2, size * 0.12), delay: d0 });
    if (size > 40) Fx.add({ k: "ring", x, y, size: size * 0.2, size2: size * 6.5, life: 0.9, rgb: "255,190,120", w: size * 0.09, delay: d0 });
    if (!d0) {
      Fx.shake = Math.max(Fx.shake, Math.min(30, size * 0.17));
      if (size > 45) { Fx.flash = Math.max(Fx.flash, Math.min(0.55, size / 300)); Fx.flashRGB = "255,240,220"; }
    }
  };
  // chain of explosions over an area (big enemies and bosses)
  Fx.chain = function (x, y, w, h, count, dur, size = 36, o = {}) {
    for (let i = 0; i < count; i++) {
      const d = (i / count) * dur;
      Fx.explode(x + U.rand(-w / 2, w / 2), y + U.rand(-h / 2, h / 2), size * U.rand(0.6, 1.3), Object.assign({}, o, { delay: d }));
    }
    Fx.add({ k: "shaker", x, y, life: dur, amount: Math.min(18, size * 0.3) });
  };
  Fx.hitSpark = function (x, y, rgb = "255,230,150", n = 4) {
    for (let i = 0; i < n; i++) {
      const a = U.rand(TAU), sp = U.rand(150, 420);
      Fx.add({ k: "spark", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: U.rand(0.1, 0.25), drag: 6, rgb, w: 1.5 });
    }
    Fx.glow(x, y, 10, 20, rgb, 0.1, { hot: true });
  };
  Fx.dust = function (x, y, n = 6, rgb = "180,170,150") {
    for (let i = 0; i < n; i++) Fx.add({ k: "dust", x: x + U.rand(-10, 10), y, vx: U.rand(-90, 90), vy: U.rand(-60, -10), r: U.rand(3, 7), life: U.rand(0.3, 0.6), drag: 3, rgb });
  };
  Fx.splash = function (x, y, rgb, n = 14) {
    for (let i = 0; i < n; i++) Fx.add({ k: "drop", x: x + U.rand(-12, 12), y, vx: U.rand(-160, 160), vy: U.rand(-420, -120), r: U.rand(2, 4.5), life: U.rand(0.5, 0.9), g: 1100, rgb });
    Fx.glow(x, y, 20, 50, rgb, 0.35, { a: 0.6 });
  };
  Fx.text = function (x, y, s, rgb = "255,240,160", size = 16) {
    Fx.add({ k: "text", x, y, vx: 0, vy: -55, life: 0.9, s, rgb, size, drag: 1.5 });
  };
  Fx.shell = function (x, y, dir) {
    Fx.add({ k: "shell", x, y, vx: -dir * U.rand(60, 140), vy: U.rand(-260, -160), life: 0.6, g: 1200, rot: U.rand(TAU), vr: U.rand(-20, 20) });
  };

  Fx.update = function (dt) {
    const L = Fx.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      if (p.delay > 0) { p.delay -= dt; if (p.delay <= 0 && p.k === "glow" && p.hot && p.size > 60) Fx.shake = Math.max(Fx.shake, 6); continue; }
      p.life -= dt;
      if (p.life <= 0) { L[i] = L[L.length - 1]; L.pop(); continue; }
      if (p.k === "shaker") { Fx.shake = Math.max(Fx.shake, p.amount * (p.life / p.max)); continue; }
      if (p.drag) { const d = Math.max(0, 1 - p.drag * dt); p.vx *= d; p.vy *= d; }
      if (p.g) p.vy += p.g * dt;
      if (p.k === "smoke") p.vy -= 18 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.k === "debris" || p.k === "shell") {
        p.rot += p.vr * dt;
        if (p.k === "debris") {
          p.st -= dt;
          if (p.st <= 0 && p.life > 0.3) { p.st = 0.09 / Fx.q; Fx.add({ k: "smoke", x: p.x, y: p.y, vx: 0, vy: -10, size: p.s * 1.2, size2: p.s * 3.5, life: 0.6, drag: 1 }); Fx.glow(p.x, p.y, p.s * 1.6, p.s * 0.6, "255,140,50", 0.2); }
        }
      }
    }
    Fx.shake = Math.max(0, Fx.shake - dt * 40);
    Fx.flash = Math.max(0, Fx.flash - dt * 1.6);
  };

  Fx.draw = function (ctx, layer) {
    const L = Fx.list;
    for (const p of L) {
      if (p.delay > 0) continue;
      const f = p.life / p.max;
      if (p.k === "smoke") {
        const s = U.lerp(p.size2, p.size, f);
        ctx.globalAlpha = Math.min(1, f * 1.4) * 0.85;
        ctx.drawImage(Gfx.smoke, p.x - s, p.y - s, s * 2, s * 2);
      } else if (p.k === "debris") {
        ctx.globalAlpha = Math.min(1, f * 3);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.col; ctx.fillRect(-p.s, -p.s * 0.6, p.s * 2, p.s * 1.2);
        ctx.fillStyle = `rgba(255,${120 + 100 * f | 0},40,${f})`; ctx.fillRect(-p.s * 0.6, -p.s * 0.3, p.s * 1.2, p.s * 0.6);
        ctx.restore();
      } else if (p.k === "shell") {
        ctx.globalAlpha = Math.min(1, f * 3);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = "#e8c060"; ctx.fillRect(-3, -1.5, 6, 3);
        ctx.restore();
      } else if (p.k === "dust") {
        ctx.globalAlpha = f * 0.5;
        ctx.fillStyle = `rgb(${p.rgb})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (2 - f), 0, TAU); ctx.fill();
      } else if (p.k === "drop") {
        ctx.globalAlpha = Math.min(1, f * 2);
        ctx.fillStyle = `rgb(${p.rgb})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
      } else if (p.k === "text") {
        ctx.globalAlpha = Math.min(1, f * 2);
        ctx.font = `700 ${p.size}px Orbitron, Arial, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillText(p.s, p.x + 2, p.y + 2);
        ctx.fillStyle = `rgb(${p.rgb})`; ctx.fillText(p.s, p.x, p.y);
      }
    }
    ctx.globalCompositeOperation = "lighter";
    for (const p of L) {
      if (p.delay > 0) continue;
      const f = p.life / p.max;
      if (p.k === "glow") {
        const s = U.lerp(p.size2, p.size, f);
        ctx.globalAlpha = f * (p.a || 1);
        ctx.drawImage(Gfx.glow(p.rgb, p.hot), p.x - s, p.y - s, s * 2, s * 2);
      } else if (p.k === "spark") {
        ctx.globalAlpha = f;
        ctx.strokeStyle = `rgb(${p.rgb})`; ctx.lineWidth = p.w;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); ctx.stroke();
      } else if (p.k === "ring") {
        const s = U.lerp(p.size2, p.size, f * f);
        ctx.globalAlpha = f * 0.8;
        ctx.strokeStyle = `rgb(${p.rgb})`; ctx.lineWidth = p.w * f + 0.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, TAU); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };
})(window.XA);
