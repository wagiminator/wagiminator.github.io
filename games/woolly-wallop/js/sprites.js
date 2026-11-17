/* Woolly Wallop: everything that is drawn – the flock, the wolves, blocks of wood, ice and stone,
   the slingshot, plateaus and the four landscapes. Sprites are drawn in metres (y down). */
"use strict";

(function (WW) {
  const { U, D } = WW;
  const S = (WW.S = { px: 0.03 });
  const W = U.W, H = U.H, TAU = U.TAU;
  const INK = "#2a1a10";
  const lw = (k = 2.5) => k * S.px;

  /* ================= the flock ================= */
  const WOOL = {
    woolly: { wool: "#fbf8f0", shade: "#d8d2c4", face: "#3a2e2a", ear: "#4a3a34" },
    lambs: { wool: "#fff0ea", shade: "#f0c8c0", face: "#f2c6a8", ear: "#e8a890" },
    zoomer: { wool: "#ffe0a8", shade: "#f0b060", face: "#5a3a2a", ear: "#6a4632" },
    boomer: { wool: "#4a4652", shade: "#2e2a36", face: "#1a161e", ear: "#26222c" },
    bruiser: { wool: "#d4d0c8", shade: "#a8a296", face: "#4a3c36", ear: "#5a4a42" },
  };
  // a fluffy body: a ring of bumps
  function fluff(c, r, col, shade, seed) {
    const n = 11;
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU, a2 = ((i + 0.5) / n) * TAU;
      const rr = r * (0.92 + 0.08 * Math.sin(seed + i * 2.3));
      if (i === 0) c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      c.quadraticCurveTo(Math.cos(a2) * r * 1.2, Math.sin(a2) * r * 1.2, Math.cos(((i + 1) / n) * TAU) * rr, Math.sin(((i + 1) / n) * TAU) * rr);
    }
    c.closePath();
    const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.15);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.35, col); g.addColorStop(1, shade);
    c.fillStyle = g; c.fill();
    c.lineWidth = lw(2.5); c.strokeStyle = INK; c.lineJoin = "round"; c.stroke();
    // a few curls
    c.strokeStyle = shade; c.lineWidth = lw(1.6);
    for (let i = 0; i < 4; i++) {
      const a = seed + i * 1.7, d = r * 0.45;
      c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, r * 0.16, 0.3, 4.2); c.stroke();
    }
  }
  // dir: 1 faces right; o: { t, mood: 'calm'|'fly'|'dizzy', blink }
  S.sheep = function (c, type, x, y, r, a, o = {}) {
    const k = WOOL[type] || WOOL.woolly, t = o.t || 0;
    c.save(); c.translate(x, y); c.rotate(a || 0);
    // legs (tucked in flight)
    if (!o.fly) {
      c.fillStyle = k.face;
      for (const lx of [-0.45, -0.15, 0.2, 0.45]) { c.beginPath(); c.roundRect ? c.roundRect(lx * r - r * 0.07, r * 0.6, r * 0.14, r * 0.42, r * 0.06) : c.rect(lx * r - r * 0.07, r * 0.6, r * 0.14, r * 0.42); c.fill(); }
    }
    fluff(c, r, k.wool, k.shade, type.length);
    // the face sits in front
    const fx = r * 0.55, fy = r * 0.05;
    // ears
    for (const s of [-1, 1]) {
      c.save(); c.translate(fx - r * 0.12, fy - r * 0.32 * (s < 0 ? 1 : 0.6)); c.rotate(s < 0 ? -0.9 : 0.5);
      D.ellipse(c, 0, 0, r * 0.28, r * 0.12, k.ear, INK, lw(2));
      c.restore();
    }
    if (type === "bruiser") {
      // curled horns
      c.lineWidth = r * 0.16; c.strokeStyle = "#e8d4a0"; c.lineCap = "round";
      c.beginPath(); c.arc(fx - r * 0.25, fy - r * 0.2, r * 0.28, -2.6, 1.6); c.stroke();
      c.lineWidth = lw(2); c.strokeStyle = INK;
      c.beginPath(); c.arc(fx - r * 0.25, fy - r * 0.2, r * 0.36, -2.6, 1.6); c.stroke();
    }
    D.ellipse(c, fx, fy, r * 0.42, r * 0.5, k.face, INK, lw(2.5));
    // eyes
    const blink = o.blink;
    const ey = fy - r * 0.12;
    for (const ex of [fx - r * 0.12, fx + r * 0.18]) {
      if (blink) { D.line(c, ex - r * 0.08, ey, ex + r * 0.08, ey, "#fff", lw(2)); continue; }
      D.ellipse(c, ex, ey, r * 0.12, r * 0.15, "#fff", INK, lw(1.5));
      const look = o.mood === "dizzy" ? Math.sin(t * 9 + ex) * r * 0.04 : r * 0.04;
      D.circle(c, ex + look, ey + (o.mood === "dizzy" ? Math.cos(t * 9) * r * 0.04 : r * 0.01), r * 0.065, type === "boomer" ? "#ffd23a" : INK, null);
    }
    // determined brows in flight
    if (o.fly || type === "bruiser") {
      c.strokeStyle = type === "boomer" ? "#ffd23a" : "#fff"; c.lineWidth = lw(2.2); c.lineCap = "round";
      c.beginPath(); c.moveTo(fx - r * 0.24, ey - r * 0.24); c.lineTo(fx - r * 0.02, ey - r * 0.17); c.moveTo(fx + r * 0.32, ey - r * 0.26); c.lineTo(fx + r * 0.08, ey - r * 0.17); c.stroke();
    }
    // nose and mouth
    D.ellipse(c, fx + r * 0.05, fy + r * 0.24, r * 0.12, r * 0.07, type === "lambs" ? "#e88a8a" : "#1a1210", null);
    c.strokeStyle = type === "lambs" ? "#c86a6a" : "#8a7a70"; c.lineWidth = lw(1.5);
    c.beginPath();
    if (o.fly) c.arc(fx + r * 0.05, fy + r * 0.36, r * 0.07, 0, TAU);
    else c.arc(fx + r * 0.05, fy + r * 0.3, r * 0.09, 0.3, Math.PI - 0.3);
    c.stroke();
    if (type === "lambs") { D.circle(c, fx - r * 0.25, fy + r * 0.12, r * 0.07, "rgba(255,120,120,0.5)", null); }
    if (type === "zoomer") {
      // flying goggles
      c.strokeStyle = "#6a3a1a"; c.lineWidth = r * 0.08;
      c.beginPath(); c.moveTo(fx - r * 0.5, ey - r * 0.22); c.lineTo(-r * 0.5, ey - r * 0.4); c.stroke();
      for (const ex of [fx - r * 0.12, fx + r * 0.2]) D.circle(c, ex, ey - r * 0.28, r * 0.1, "rgba(160,220,255,0.85)", "#6a3a1a", r * 0.05);
    }
    if (type === "boomer") {
      // a crackling bolt on the wool
      c.fillStyle = "#ffd23a";
      c.beginPath(); c.moveTo(-r * 0.4, -r * 0.55); c.lineTo(-r * 0.1, -r * 0.55); c.lineTo(-r * 0.25, -r * 0.25); c.lineTo(-r * 0.02, -r * 0.25); c.lineTo(-r * 0.45, r * 0.25); c.lineTo(-r * 0.32, -r * 0.1); c.lineTo(-r * 0.52, -r * 0.1); c.closePath(); c.fill();
      c.strokeStyle = INK; c.lineWidth = lw(1.5); c.stroke();
      if (o.fuse) { const f = Math.sin(t * 40) > 0; if (f) D.circle(c, 0, 0, r * 1.25, null, "rgba(255,230,80,0.8)", lw(3)); }
    }
    c.restore();
  };

  /* ================= wolves ================= */
  const FUR = { pup: ["#b8b4c0", "#8a8494"], wolf: ["#8a8a98", "#5e5e6e"], alpha: ["#5a5262", "#3a3442"] };
  S.wolf = function (c, kind, x, y, r, a, o = {}) {
    const [fur, dark] = FUR[kind] || FUR.wolf, t = o.t || 0;
    const hurt = o.hp < 0.55, ouch = o.ouch > 0;
    c.save(); c.translate(x, y); c.rotate(a || 0);
    // ears
    for (const s of [-1, 1]) {
      c.beginPath(); c.moveTo(s * r * 0.25, -r * 0.7); c.lineTo(s * r * 0.72, -r * 1.12); c.lineTo(s * r * 0.82, -r * 0.42); c.closePath();
      c.fillStyle = dark; c.fill(); c.lineWidth = lw(2.2); c.strokeStyle = INK; c.lineJoin = "round"; c.stroke();
      c.beginPath(); c.moveTo(s * r * 0.4, -r * 0.68); c.lineTo(s * r * 0.68, -r * 0.95); c.lineTo(s * r * 0.72, -r * 0.55); c.closePath(); c.fillStyle = "#e8a8b0"; c.fill();
    }
    // head and cheek tufts
    const g = c.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r * 1.1);
    g.addColorStop(0, D.mix(fur, 0.3)); g.addColorStop(0.6, fur); g.addColorStop(1, dark);
    c.beginPath();
    c.moveTo(-r, 0);
    c.arc(0, 0, r, Math.PI, 0);
    c.lineTo(r * 1.02, r * 0.25); c.lineTo(r * 0.8, r * 0.38); c.lineTo(r * 0.85, r * 0.6); c.quadraticCurveTo(0, r * 1.2, -r * 0.85, r * 0.6); c.lineTo(-r * 0.8, r * 0.38); c.lineTo(-r * 1.02, r * 0.25);
    c.closePath(); c.fillStyle = g; c.fill(); c.lineWidth = lw(2.5); c.strokeStyle = INK; c.stroke();
    // light muzzle
    D.ellipse(c, 0, r * 0.38, r * 0.55, r * 0.38, "#e8e4ea", INK, lw(1.8));
    // eyes
    for (const s of [-1, 1]) {
      const ex = s * r * 0.36, ey = -r * 0.15;
      if (kind === "alpha" && s > 0) {
        // an eye patch
        D.ellipse(c, ex, ey, r * 0.2, r * 0.17, "#1a1416", null);
        D.line(c, ex - r * 0.2, ey - r * 0.1, -r * 0.2, -r * 0.75, "#1a1416", lw(2));
        continue;
      }
      if (ouch || (hurt && o.dizzy)) {
        D.line(c, ex - r * 0.1, ey - r * 0.1, ex + r * 0.1, ey + r * 0.1, INK, lw(2.2)); D.line(c, ex - r * 0.1, ey + r * 0.1, ex + r * 0.1, ey - r * 0.1, INK, lw(2.2));
      } else {
        D.ellipse(c, ex, ey, r * 0.17, r * 0.15, "#ffe35a", INK, lw(1.6));
        D.ellipse(c, ex + s * -r * 0.02, ey, r * 0.05, r * 0.11, INK, null);
      }
      // sly brows
      D.line(c, ex - s * r * 0.2, ey - r * 0.22, ex + s * r * 0.12, ey - r * 0.12, INK, lw(2.2));
    }
    // nose and grin
    D.ellipse(c, 0, r * 0.2, r * 0.15, r * 0.1, "#1a1416", null);
    c.beginPath(); c.moveTo(-r * 0.3, r * 0.45); c.quadraticCurveTo(0, r * 0.68, r * 0.3, r * 0.45);
    c.lineWidth = lw(2); c.strokeStyle = INK; c.stroke();
    c.fillStyle = "#fff";
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * r * 0.2, r * 0.5); c.lineTo(s * r * 0.14, r * 0.66); c.lineTo(s * r * 0.08, r * 0.53); c.closePath(); c.fill(); }
    if (kind === "alpha") { D.line(c, -r * 0.55, -r * 0.45, -r * 0.3, -r * 0.05, "#c86a6a", lw(1.6)); }
    if (hurt) {
      // a sticking plaster
      c.save(); c.translate(-r * 0.45, r * 0.05); c.rotate(-0.6);
      D.rr(c, -r * 0.22, -r * 0.08, r * 0.44, r * 0.16, r * 0.05, "#f4d4a8", INK, lw(1.2));
      c.restore();
    }
    c.restore();
  };

  /* ================= blocks ================= */
  const MATC = {
    wood: { fill: ["#e2a862", "#c8843e"], edge: "#8a5226", line: "rgba(120,66,26,0.5)" },
    ice: { fill: ["rgba(214,244,255,0.85)", "rgba(150,212,244,0.85)"], edge: "#5aa8d4", line: "rgba(255,255,255,0.8)" },
    stone: { fill: ["#b4b4bc", "#8a8a94"], edge: "#55555e", line: "rgba(60,60,70,0.4)" },
    boom: { fill: ["#e8503a", "#b8301e"], edge: "#6a1a10", line: "rgba(80,20,10,0.5)" },
  };
  function cracks(c, b, k, w, h) {
    // cracks grow with the damage
    const n = Math.ceil(k * 4), rng = U.rng(b.id * 31 + 5);
    c.strokeStyle = b.data.mat === "ice" ? "rgba(255,255,255,0.95)" : "rgba(30,20,10,0.75)"; c.lineWidth = lw(1.6);
    for (let i = 0; i < n; i++) {
      let x = (rng() - 0.5) * w * 0.8, y = (rng() - 0.5) * h * 0.8;
      c.beginPath(); c.moveTo(x, y);
      for (let j = 0; j < 3; j++) { x += (rng() - 0.5) * Math.min(w, 0.5); y += (rng() - 0.5) * Math.min(h, 0.5); x = U.clamp(x, -w / 2, w / 2); y = U.clamp(y, -h / 2, h / 2); c.lineTo(x, y); }
      c.stroke();
    }
  }
  S.block = function (c, b) {
    const d = b.data, m = MATC[d.mat] || MATC.wood, dmg = 1 - Math.max(0, d.hp) / d.max;
    c.save(); c.translate(b.x, b.y); c.rotate(b.a);
    if (b.shape === "circle") {
      const g = c.createRadialGradient(-b.r * 0.4, -b.r * 0.4, b.r * 0.1, 0, 0, b.r);
      g.addColorStop(0, m.fill[0]); g.addColorStop(1, m.fill[1]);
      D.circle(c, 0, 0, b.r, g, m.edge, lw(2.5));
      c.strokeStyle = m.line; c.lineWidth = lw(1.5);
      if (d.mat === "wood") for (let i = 1; i <= 2; i++) { c.beginPath(); c.arc(0, 0, b.r * i * 0.3, 0, TAU); c.stroke(); }
      else { c.beginPath(); c.arc(-b.r * 0.2, b.r * 0.1, b.r * 0.15, 0, TAU); c.arc(b.r * 0.35, -b.r * 0.2, b.r * 0.1, 0, TAU); c.stroke(); }
      if (dmg > 0.15) cracks(c, b, dmg, b.r * 1.6, b.r * 1.6);
      c.restore();
      return;
    }
    const w = b.hw * 2, h = b.hh * 2;
    const g = c.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, m.fill[0]); g.addColorStop(1, m.fill[1]);
    c.fillStyle = g; c.fillRect(-w / 2, -h / 2, w, h);
    c.strokeStyle = m.line; c.lineWidth = lw(1.3);
    if (d.mat === "wood") {
      // grain along the long side
      const along = w >= h, L = along ? w : h, T = along ? h : w;
      for (let i = 1; i < 3; i++) {
        const o = -T / 2 + (T * i) / 3;
        c.beginPath();
        if (along) { c.moveTo(-L / 2 + 0.05, o); c.bezierCurveTo(-L / 6, o + T * 0.08, L / 6, o - T * 0.08, L / 2 - 0.05, o); }
        else { c.moveTo(o, -L / 2 + 0.05); c.bezierCurveTo(o + T * 0.08, -L / 6, o - T * 0.08, L / 6, o, L / 2 - 0.05); }
        c.stroke();
      }
    } else if (d.mat === "ice") {
      c.beginPath(); c.moveTo(-w / 2 + 0.06, -h / 2 + 0.06); c.lineTo(-w / 2 + Math.min(w, h) * 0.45, -h / 2 + 0.06); c.stroke();
      c.beginPath(); c.moveTo(-w / 2 + 0.06, -h / 2 + 0.06); c.lineTo(-w / 2 + 0.06, -h / 2 + Math.min(w, h) * 0.45); c.stroke();
    } else if (d.mat === "stone") {
      const rng = U.rng(b.id * 7 + 1);
      c.fillStyle = "rgba(60,60,70,0.25)";
      for (let i = 0; i < Math.ceil(w * h * 18); i++) { c.beginPath(); c.arc((rng() - 0.5) * w * 0.9, (rng() - 0.5) * h * 0.9, 0.03 + rng() * 0.04, 0, TAU); c.fill(); }
    } else if (d.mat === "boom") {
      // a firework crate: a burst and a fuse
      c.fillStyle = "#ffd23a";
      c.beginPath();
      for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8, r = (i % 2 ? 0.12 : 0.26) * (w / 0.7); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      c.closePath(); c.fill();
      c.strokeStyle = "#ffd23a"; c.lineWidth = lw(2);
      c.beginPath(); c.moveTo(w * 0.2, -h / 2); c.quadraticCurveTo(w * 0.35, -h / 2 - 0.15, w * 0.25, -h / 2 - 0.25); c.stroke();
      D.circle(c, w * 0.25, -h / 2 - 0.27, 0.05 + Math.random() * 0.03, "#ffef8a", null);
      c.strokeStyle = m.edge; c.lineWidth = lw(1.5);
      c.strokeRect(-w / 2 + 0.06, -h / 2 + 0.06, w - 0.12, h - 0.12);
    }
    if (dmg > 0.12) cracks(c, b, dmg, w, h);
    c.lineWidth = lw(2.5); c.strokeStyle = m.edge; c.strokeRect(-w / 2, -h / 2, w, h);
    c.restore();
  };

  /* ================= plateaus ================= */
  S.hill = function (c, b, world) {
    const [grass, soil, deep] = world.ground;
    const x0 = b.x - b.hw, y0 = b.y - b.hh, w = b.hw * 2, h = b.hh * 2;
    const g = c.createLinearGradient(0, y0, 0, y0 + h);
    g.addColorStop(0, soil); g.addColorStop(1, deep);
    D.rr(c, x0, y0, w, h + 0.5, 0.18, g, INK, lw(2.5));
    c.fillStyle = "rgba(0,0,0,0.12)";
    const rng = U.rng(Math.round(b.x * 10));
    for (let i = 0; i < w * h * 1.5; i++) { c.beginPath(); c.arc(x0 + 0.2 + rng() * (w - 0.4), y0 + 0.4 + rng() * (h - 0.5), 0.06 + rng() * 0.1, 0, TAU); c.fill(); }
    // grass (or snow) on top
    c.fillStyle = grass; c.beginPath(); c.moveTo(x0 - 0.05, y0 + 0.28);
    for (let x = x0; x <= x0 + w + 0.01; x += 0.25) c.lineTo(x, y0 + 0.22 + ((x * 7) % 1 > 0.5 ? 0.08 : 0));
    c.lineTo(x0 + w + 0.05, y0 - 0.02); c.lineTo(x0 - 0.05, y0 - 0.02); c.closePath(); c.fill();
    c.lineWidth = lw(2.5); c.strokeStyle = INK; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + w, y0); c.stroke();
  };

  /* ================= the slingshot ================= */
  // part: 'back' (behind the sheep) or 'front'
  S.sling = function (c, x, y, part, pouch) {
    const wood = "#8a5226", woodL = "#b87a3e";
    const ground = 0;
    if (part === "back") {
      // the trunk and the far prong
      c.lineCap = "round"; c.lineJoin = "round";
      c.strokeStyle = INK; c.lineWidth = 0.42; c.beginPath(); c.moveTo(x, ground); c.lineTo(x, y + 0.9); c.lineTo(x + 0.28, y); c.stroke();
      c.strokeStyle = wood; c.lineWidth = 0.32; c.beginPath(); c.moveTo(x, ground); c.lineTo(x, y + 0.9); c.lineTo(x + 0.28, y); c.stroke();
      c.strokeStyle = woodL; c.lineWidth = 0.08; c.beginPath(); c.moveTo(x - 0.06, ground - 0.1); c.lineTo(x - 0.06, y + 0.95); c.stroke();
      if (pouch) band(c, x + 0.28, y + 0.08, pouch);
    } else {
      if (pouch) band(c, x - 0.24, y + 0.08, pouch);
      c.lineCap = "round";
      c.strokeStyle = INK; c.lineWidth = 0.42; c.beginPath(); c.moveTo(x, y + 0.9); c.lineTo(x - 0.24, y); c.stroke();
      c.strokeStyle = wood; c.lineWidth = 0.32; c.beginPath(); c.moveTo(x, y + 0.9); c.lineTo(x - 0.24, y); c.stroke();
    }
  };
  function band(c, ax, ay, p) {
    c.lineCap = "round";
    c.strokeStyle = INK; c.lineWidth = 0.17; c.beginPath(); c.moveTo(ax, ay); c.lineTo(p.x, p.y); c.stroke();
    c.strokeStyle = "#6a3a22"; c.lineWidth = 0.11; c.beginPath(); c.moveTo(ax, ay); c.lineTo(p.x, p.y); c.stroke();
  }
  S.pouch = function (c, p, r) {
    D.ellipse(c, p.x, p.y, 0.14, r * 0.85, "#5a3220", INK, lw(2));
  };

  /* ================= landscapes ================= */
  const bgCache = {};
  function cloud(g, x, y, s, col) {
    g.fillStyle = col;
    for (const [dx, dy, r] of [[0, 0, 30], [32, -12, 34], [66, 0, 28], [30, 10, 30]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, TAU); g.fill(); }
  }
  function tree(g, x, y, s, kind, rng) {
    if (kind === "pine" || kind === "snowpine") {
      g.fillStyle = "#5a3a22"; g.fillRect(x - 5 * s, y - 20 * s, 10 * s, 22 * s);
      for (let i = 0; i < 3; i++) {
        const w = (46 - i * 11) * s, yy = y - 18 * s - i * 26 * s;
        g.fillStyle = kind === "snowpine" ? "#3a6a5a" : "#2e6a3a";
        g.beginPath(); g.moveTo(x - w, yy); g.lineTo(x, yy - 40 * s); g.lineTo(x + w, yy); g.closePath(); g.fill();
        if (kind === "snowpine") { g.fillStyle = "#f4faff"; g.beginPath(); g.moveTo(x - w * 0.45, yy - 22 * s); g.lineTo(x, yy - 40 * s); g.lineTo(x + w * 0.45, yy - 22 * s); g.closePath(); g.fill(); }
      }
      return;
    }
    g.fillStyle = "#6a4226"; g.fillRect(x - 6 * s, y - 50 * s, 12 * s, 52 * s);
    const cols = kind === "autumn" ? ["#e8742a", "#f0a030", "#c8502a"] : ["#5aa83a", "#7ac84a", "#4a9030"];
    for (let i = 0; i < 5; i++) { g.fillStyle = cols[i % 3]; g.beginPath(); g.arc(x + (rng() - 0.5) * 50 * s, y - 70 * s - rng() * 40 * s, (26 + rng() * 14) * s, 0, TAU); g.fill(); }
  }
  S.GROUND_Y = H - 64;
  function bg(w) {
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const g = cv.getContext("2d"), rng = U.rng(w.id.length * 17 + 3), GY = S.GROUND_Y;
    const sk = g.createLinearGradient(0, 0, 0, GY);
    sk.addColorStop(0, w.sky[0]); sk.addColorStop(1, w.sky[1]);
    g.fillStyle = sk; g.fillRect(0, 0, W, H);
    if (w.deco === "dusk") {
      for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,230,${0.3 + rng() * 0.6})`; g.fillRect(rng() * W, rng() * GY * 0.5, 2, 2); }
      D.circle(g, 1040, 120, 50, "#fff4d0", null);
    } else {
      // the sun
      const sun = g.createRadialGradient(1060, 110, 10, 1060, 110, 120);
      sun.addColorStop(0, "rgba(255,250,210,1)"); sun.addColorStop(0.3, "rgba(255,240,160,0.8)"); sun.addColorStop(1, "rgba(255,240,160,0)");
      g.fillStyle = sun; g.fillRect(900, 0, 320, 260);
    }
    for (let i = 0; i < 5; i++) cloud(g, rng() * W, 50 + rng() * 170, 0.7 + rng() * 0.6, w.deco === "dusk" ? "rgba(120,90,140,0.55)" : "rgba(255,255,255,0.85)");
    if (w.deco === "snow") {
      // mountains with snowy tops
      for (const [x, h, cl] of [[150, 330, "#9ab0c8"], [480, 400, "#8aa2bc"], [860, 360, "#9ab0c8"], [1180, 300, "#8aa2bc"]]) {
        g.fillStyle = cl; g.beginPath(); g.moveTo(x - 300, GY); g.lineTo(x, GY - h); g.lineTo(x + 300, GY); g.closePath(); g.fill();
        g.fillStyle = "#f4faff"; g.beginPath(); g.moveTo(x - 90, GY - h + 90); g.lineTo(x, GY - h); g.lineTo(x + 90, GY - h + 90); g.lineTo(x + 40, GY - h + 70); g.lineTo(x, GY - h + 95); g.lineTo(x - 40, GY - h + 70); g.closePath(); g.fill();
      }
    }
    // rolling hills
    for (const [base, amp, col, f] of [[GY - 150, 50, w.hills[0], 0.004], [GY - 80, 40, w.hills[1], 0.007]]) {
      g.fillStyle = col; g.beginPath(); g.moveTo(0, GY);
      for (let x = 0; x <= W; x += 16) g.lineTo(x, base - Math.sin(x * f + base) * amp - Math.sin(x * f * 2.7) * amp * 0.3);
      g.lineTo(W, GY); g.closePath(); g.fill();
    }
    // trees and buildings in the distance
    const kind = { meadow: "round", autumn: "autumn", snow: "snowpine", dusk: "pine" }[w.deco];
    for (let i = 0; i < 9; i++) { const x = 420 + rng() * 860, y = GY - 60 - rng() * 30; tree(g, x, y, 0.7 + rng() * 0.4, kind, rng); }
    if (w.deco === "dusk") {
      // a barn and a windmill
      g.fillStyle = "#2a1e36";
      g.fillRect(760, GY - 170, 150, 110); g.beginPath(); g.moveTo(745, GY - 170); g.lineTo(835, GY - 230); g.lineTo(925, GY - 170); g.closePath(); g.fill();
      g.fillStyle = "#ffcf6a"; g.fillRect(820, GY - 150, 30, 26);
      g.fillStyle = "#2a1e36"; g.beginPath(); g.moveTo(1080, GY - 60); g.lineTo(1095, GY - 220); g.lineTo(1115, GY - 220); g.lineTo(1130, GY - 60); g.closePath(); g.fill();
    }
    if (w.deco === "meadow") { for (let i = 0; i < 40; i++) { g.fillStyle = U.pick(["#fff", "#ffd23a", "#ff8aa8"]); g.beginPath(); g.arc(rng() * W, GY - 6 - rng() * 30, 2.5, 0, TAU); g.fill(); } }
    // the ground
    const [grass, soil, deep] = w.ground;
    const gg = g.createLinearGradient(0, GY, 0, H);
    gg.addColorStop(0, soil); gg.addColorStop(1, deep);
    g.fillStyle = gg; g.fillRect(0, GY, W, H - GY);
    g.fillStyle = "rgba(0,0,0,0.12)";
    for (let i = 0; i < 90; i++) { g.beginPath(); g.arc(rng() * W, GY + 14 + rng() * 50, 2 + rng() * 4, 0, TAU); g.fill(); }
    g.fillStyle = grass; g.beginPath(); g.moveTo(0, GY + 12);
    for (let x = 0; x <= W; x += 12) g.lineTo(x, GY + 8 + (x % 24 ? 0 : 5));
    g.lineTo(W, GY - 2); g.lineTo(0, GY - 2); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(0, GY - 2, W, 3);
    return cv;
  }
  S.backdrop = function (c, w) {
    if (!bgCache[w.id]) bgCache[w.id] = bg(w);
    c.drawImage(bgCache[w.id], 0, 0);
  };
})(window.WW);
