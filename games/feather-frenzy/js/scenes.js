/* Feather Frenzy: the eight hunting grounds. Every level is a panorama of three parallax layers
   (far, middle, near) with props: hiding places, bonus objects, animals you must not shoot and movers. */
"use strict";

(function (FF) {
  const { U, D } = FF;
  const W = U.W, H = U.H;
  const OUT = D.OUT;
  const RANGE = 2560; // scroll range of the near layer (three screens wide)
  const PAR = [0.3, 0.6, 1];
  const SCALE = [0.34, 0.58, 0.92];
  FF.RANGE = RANGE; FF.PAR = PAR; FF.SCALE = SCALE;
  FF.layerWidth = (i) => Math.round(W + RANGE * PAR[i]);

  /* ---------- prop factories ---------- */
  const peek = (layer, x, y, cover, o = {}) => Object.assign({ kind: "peek", layer, x, y, cover, rise: 46, s: 1, w: 70 }, o);
  const bonus = (layer, x, y, type, points, hb, o = {}) => Object.assign({ kind: "bonus", layer, x, y, type, points, hb }, o);
  const flush = (layer, x, y, type, hb, o = {}) => Object.assign({ kind: "flush", layer, x, y, type, hb }, o);
  const critter = (layer, animal, x0, x1, y, o = {}) => Object.assign({ kind: "critter", layer, animal, x0, x1, x: (x0 + x1) / 2, y, speed: 22 }, o);

  /* ---------- sky ---------- */
  function sky(top, bottom, o = {}) {
    return (c, t, cam) => {
      D.vgrad(c, 0, 0, W, H, o.stops || [top, bottom]);
      if (o.sun) { const [sx, sy, r, col] = o.sun; const g = c.createRadialGradient(sx, sy, r * 0.3, sx, sy, r * 3); g.addColorStop(0, col); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H); D.circle(c, sx, sy, r, "#fff6d0", null, 0); }
      if (o.moon) { const [mx, my] = o.moon; const g = c.createRadialGradient(mx, my, 20, mx, my, 160); g.addColorStop(0, "rgba(255,250,220,0.35)"); g.addColorStop(1, "rgba(255,250,220,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H); D.circle(c, mx, my, 44, "#fffbe4", null, 0); D.circle(c, mx - 12, my - 8, 8, "rgba(200,200,180,0.5)", null, 0); D.circle(c, mx + 14, my + 10, 6, "rgba(200,200,180,0.5)", null, 0); }
      if (o.stars) { const r = U.rng(5); for (let i = 0; i < 120; i++) { const x = ((r() * (W + 600)) - cam * 0.05) % (W + 600); c.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(t * (0.5 + r()) + i))})`; c.fillRect(x < 0 ? x + W + 600 : x, r() * 360, 2, 2); } }
      if (o.clouds) {
        const r = U.rng(11);
        for (let i = 0; i < o.clouds; i++) {
          const span = W + 700, x = ((r() * span + t * (6 + r() * 8) - cam * 0.12) % span + span) % span - 350;
          D.cloud(c, x, 50 + r() * 180, 0.6 + r() * 0.7, o.cloudCol || "rgba(255,255,255,0.85)");
        }
      }
    };
  }

  /* ---------- prop drawing ---------- */
  const COVER = {
    bush: (c, p) => D.bush(c, p.x, p.y, 44 * p.s, p.col || "#4a7d34"),
    heather: (c, p) => { D.bush(c, p.x, p.y, 42 * p.s, "#6a7a3a"); D.dots(c, p.x - 40 * p.s, p.x + 40 * p.s, p.y - 60 * p.s, p.y - 10, ["#a05aa8", "#c07ac8"], p.x | 0, 26, 2, 4); },
    rock: (c, p) => D.rock(c, p.x, p.y, 110 * p.s, 64 * p.s, p.col || "#8a8a84"),
    wall: (c, p) => { const w = 150 * p.s, h = 48 * p.s; c.fillStyle = "#8a8378"; c.fillRect(p.x - w / 2, p.y - h, w, h); c.save(); c.beginPath(); c.rect(p.x - w / 2, p.y - h, w, h); c.clip(); c.strokeStyle = "rgba(0,0,0,0.25)"; c.lineWidth = 2; let k = 0; for (let y = p.y - h; y < p.y; y += 16 * p.s, k++) for (let x = p.x - w / 2 - (k % 2) * 13 * p.s; x < p.x + w / 2; x += 26 * p.s) c.strokeRect(x, y, 26 * p.s, 16 * p.s); c.restore(); },
    hay: (c, p) => { c.beginPath(); c.moveTo(p.x - 70 * p.s, p.y); c.quadraticCurveTo(p.x - 60 * p.s, p.y - 90 * p.s, p.x, p.y - 96 * p.s); c.quadraticCurveTo(p.x + 60 * p.s, p.y - 90 * p.s, p.x + 70 * p.s, p.y); c.closePath(); c.fillStyle = "#e0b94e"; c.fill(); c.strokeStyle = "rgba(140,100,20,0.6)"; c.lineWidth = 2; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(p.x + i * 16 * p.s, p.y); c.lineTo(p.x + i * 10 * p.s, p.y - 70 * p.s); c.stroke(); } },
    bale: (c, p) => { D.rr(c, p.x - 60 * p.s, p.y - 56 * p.s, 120 * p.s, 56 * p.s, 22 * p.s, "#d8b04a", "#8a6a1a", 2); for (let i = 0; i < 4; i++) D.line(c, p.x - 50 * p.s, p.y - 46 * p.s + i * 12 * p.s, p.x + 50 * p.s, p.y - 46 * p.s + i * 12 * p.s, "rgba(140,100,20,0.4)", 2); },
    stump: (c, p) => { D.rr(c, p.x - 36 * p.s, p.y - 50 * p.s, 72 * p.s, 50 * p.s, 6, "#7a5232", OUT, 2); D.ellipse(c, p.x, p.y - 50 * p.s, 36 * p.s, 10 * p.s, "#c89a62", OUT, 2); },
    reeds: (c, p) => { c.lineCap = "round"; for (let i = 0; i < 16; i++) { const x = p.x - 50 * p.s + i * 6.5 * p.s, h = (60 + ((i * 37) % 30)) * p.s; c.strokeStyle = i % 2 ? "#5a7a2a" : "#6e8e34"; c.lineWidth = 4 * p.s; c.beginPath(); c.moveTo(x, p.y); c.quadraticCurveTo(x + 4, p.y - h * 0.6, x + (i % 3 - 1) * 6, p.y - h); c.stroke(); if (i % 4 === 1) D.ellipse(c, x + (i % 3 - 1) * 6, p.y - h, 3.5 * p.s, 10 * p.s, "#6a4224", null, 0); } },
    crate: (c, p) => { D.rr(c, p.x - 44 * p.s, p.y - 70 * p.s, 88 * p.s, 70 * p.s, 3, "#a87a44", OUT, 2); D.line(c, p.x - 44 * p.s, p.y - 70 * p.s, p.x + 44 * p.s, p.y, "#7a5228", 4 * p.s); D.line(c, p.x + 44 * p.s, p.y - 70 * p.s, p.x - 44 * p.s, p.y, "#7a5228", 4 * p.s); },
    barrel: (c, p) => { D.rr(c, p.x - 32 * p.s, p.y - 72 * p.s, 64 * p.s, 72 * p.s, 14 * p.s, "#8a5a2c", OUT, 2); for (const y of [0.2, 0.8]) D.line(c, p.x - 32 * p.s, p.y - 72 * p.s * (1 - y), p.x + 32 * p.s, p.y - 72 * p.s * (1 - y), "#555", 4 * p.s); },
    igloo: (c, p) => { c.beginPath(); c.arc(p.x, p.y, 80 * p.s, Math.PI, 0); c.closePath(); c.fillStyle = "#f2f6fb"; c.fill(); c.strokeStyle = "#b8c6d8"; c.lineWidth = 2; c.stroke(); for (let i = 1; i < 4; i++) { c.beginPath(); c.arc(p.x, p.y, 80 * p.s, Math.PI, 0); c.stroke(); c.beginPath(); c.moveTo(p.x - 80 * p.s, p.y - i * 18 * p.s); c.lineTo(p.x + 80 * p.s, p.y - i * 18 * p.s); c.stroke(); } },
    drift: (c, p) => { c.beginPath(); c.moveTo(p.x - 90 * p.s, p.y); c.quadraticCurveTo(p.x - 40 * p.s, p.y - 70 * p.s, p.x + 10 * p.s, p.y - 56 * p.s); c.quadraticCurveTo(p.x + 70 * p.s, p.y - 50 * p.s, p.x + 90 * p.s, p.y); c.closePath(); c.fillStyle = "#f4f8fc"; c.fill(); c.strokeStyle = "#c4d2e2"; c.lineWidth = 2; c.stroke(); },
    chimney: (c, p) => { D.rr(c, p.x - 22 * p.s, p.y - 40 * p.s, 44 * p.s, 60 * p.s, 2, "#8a3e2a", OUT, 2); D.rr(c, p.x - 27 * p.s, p.y - 46 * p.s, 54 * p.s, 10 * p.s, 2, "#6a2e1e", OUT, 2); },
    window: (c, p) => { const [x, y, w, h] = p.clip; c.lineWidth = 6 * p.s; c.strokeStyle = p.frame || "#f2ead8"; c.strokeRect(p.x + x, p.y + y, w, h); c.lineWidth = 3 * p.s; c.beginPath(); c.moveTo(p.x + x + w / 2, p.y + y); c.lineTo(p.x + x + w / 2, p.y + y + h * 0.35); c.stroke(); },
    battlement: (c, p) => { c.fillStyle = "#8a7a6a"; c.fillRect(p.x - 60 * p.s, p.y - 20 * p.s, 120 * p.s, 20 * p.s); for (let i = 0; i < 3; i++) c.fillRect(p.x - 60 * p.s + i * 46 * p.s, p.y - 34 * p.s, 28 * p.s, 16 * p.s); c.fillStyle = "rgba(0,0,0,0.15)"; c.fillRect(p.x - 60 * p.s, p.y - 4 * p.s, 120 * p.s, 4 * p.s); },
    well: (c, p) => { D.rr(c, p.x - 46 * p.s, p.y - 56 * p.s, 92 * p.s, 56 * p.s, 4, "#9a948a", OUT, 2); for (let i = 0; i < 3; i++) D.line(c, p.x - 46 * p.s, p.y - 40 * p.s + i * 16 * p.s, p.x + 46 * p.s, p.y - 40 * p.s + i * 16 * p.s, "rgba(0,0,0,0.25)", 2); },
    pumpkins: (c, p) => { for (const [dx, r] of [[-30, 26], [24, 30], [0, 20]]) { D.ellipse(c, p.x + dx * p.s, p.y - r * p.s, r * 1.2 * p.s, r * p.s, "#e8832a", OUT, 2); D.line(c, p.x + dx * p.s, p.y - 2 * r * p.s, p.x + dx * p.s + 4, p.y - 2 * r * p.s - 10, "#4a6a2a", 4); } },
  };
  FF.COVER = COVER;

  const BONUS_DRAW = {
    windmill: (c, p, t) => {
      c.fillStyle = "#e8dfcc"; c.beginPath(); c.moveTo(p.x - 40, p.y); c.lineTo(p.x - 26, p.y - 190); c.lineTo(p.x + 26, p.y - 190); c.lineTo(p.x + 40, p.y); c.fill();
      c.fillStyle = "#7a3a24"; c.beginPath(); c.moveTo(p.x - 34, p.y - 186); c.lineTo(p.x, p.y - 226); c.lineTo(p.x + 34, p.y - 186); c.fill();
      c.fillStyle = "#4a3020"; c.fillRect(p.x - 10, p.y - 40, 20, 40); c.fillRect(p.x - 8, p.y - 130, 16, 20);
      c.save(); c.translate(p.x, p.y - 196); c.rotate(p.ang || 0);
      for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.fillStyle = "#6a4a2a"; c.fillRect(-3, 0, 6, 110); c.fillStyle = "rgba(240,232,214,0.95)"; c.fillRect(4, 22, 22, 86); c.strokeStyle = "#6a4a2a"; c.lineWidth = 1.5; for (let y = 30; y < 108; y += 14) { c.beginPath(); c.moveTo(4, y); c.lineTo(26, y); c.stroke(); } }
      c.restore(); D.circle(c, p.x, p.y - 196, 7, "#4a3020", null, 0);
    },
    signpost: (c, p, t) => {
      c.fillStyle = "#6a4a2a"; c.fillRect(p.x - 6, p.y - 150, 12, 150);
      const labels = ["FARM", "LAKE", "MOOR"];
      for (let i = 0; i < 3; i++) {
        c.save(); c.translate(p.x, p.y - 136 + i * 34); c.rotate(((p.rot || 0) + i * 0.6) * (i % 2 ? -1 : 1) * 0.2 + (p.spin || 0) * (i + 1));
        const d = i % 2 ? -1 : 1;
        D.poly(c, [0, -12, d * 90, -12, d * 104, 0, d * 90, 12, 0, 12], "#c89a5a", OUT, 2);
        D.text(c, labels[i], d * 48, 1, 15, "#4a2a10", "center", { outline: false });
        c.restore();
      }
    },
    scarecrow: (c, p, t) => {
      const sw = Math.sin(t * 1.3) * 0.04 + (p.wob || 0) * Math.sin(t * 20);
      c.save(); c.translate(p.x, p.y); c.rotate(sw);
      c.fillStyle = "#6a4a2a"; c.fillRect(-5, -170, 10, 170); c.fillRect(-60, -130, 120, 9);
      D.poly(c, [-50, -128, 50, -128, 30, -62, -30, -62], "#4a6a9a", OUT, 2);
      D.rr(c, -30, -70, 60, 12, 2, "#8a6a3a", null, 0);
      for (const s of [-1, 1]) D.poly(c, [s * 56, -130, s * 72, -112, s * 62, -110, s * 70, -100, s * 52, -118], "#e0c060", null, 0);
      D.circle(c, 0, -150, 24, "#e8d6a0", OUT, 2);
      D.line(c, -10, -154, -4, -148, "#222", 2.5); D.line(c, -4, -154, -10, -148, "#222", 2.5); D.line(c, 4, -154, 10, -148, "#222", 2.5); D.line(c, 10, -154, 4, -148, "#222", 2.5);
      c.beginPath(); c.arc(0, -144, 9, 0.2, Math.PI - 0.2); c.strokeStyle = "#222"; c.lineWidth = 2; c.stroke();
      if (!p.done) { D.ellipse(c, 0, -170, 40, 8, "#7a5a2a", OUT, 2); D.rr(c, -22, -196, 44, 28, 6, "#7a5a2a", OUT, 2); D.rr(c, -22, -178, 44, 6, 1, "#b03a2a", null, 0); }
      c.restore();
    },
    weathervane: (c, p, t) => {
      D.line(c, p.x, p.y, p.x, p.y - 70, "#333", 4);
      c.save(); c.translate(p.x, p.y - 70); c.scale(Math.cos(p.ang || t * 0.4), 1);
      D.poly(c, [-30, 0, -10, -10, 0, -30, 10, -26, 6, -14, 26, -10, 30, 0], "#2a2a2a", null, 0);
      c.restore();
      D.line(c, p.x - 24, p.y - 40, p.x + 24, p.y - 40, "#333", 2); D.line(c, p.x, p.y - 52, p.x, p.y - 28, "#333", 2);
    },
    tractor: (c, p, t) => {
      const j = p.hitT > 0 ? Math.sin(p.hitT * 40) * 4 : 0;
      c.save(); c.translate(p.x, p.y + j);
      D.rr(c, -90, -90, 120, 56, 8, "#3a8a3a", OUT, 2.5); D.rr(c, -40, -150, 76, 66, 8, "#3a8a3a", OUT, 2.5);
      D.rr(c, -30, -140, 56, 40, 4, "rgba(190,230,255,0.85)", OUT, 2);
      D.rr(c, 30, -76, 60, 40, 6, "#3a8a3a", OUT, 2.5); D.rr(c, 70, -110, 10, 40, 3, "#333", null, 0);
      D.circle(c, -30, -36, 40, "#2a2a2a", OUT, 3); D.circle(c, -30, -36, 18, "#e8c040", OUT, 2);
      D.circle(c, 64, -26, 26, "#2a2a2a", OUT, 3); D.circle(c, 64, -26, 11, "#e8c040", OUT, 2);
      c.restore();
    },
    mushroom: (c, p, t) => {
      const sq = p.done ? 0.35 : 1;
      c.save(); c.translate(p.x, p.y); c.scale(1 + (1 - sq) * 0.5, sq);
      D.rr(c, -10, -36, 20, 36, 8, "#f2ead8", OUT, 2);
      c.beginPath(); c.arc(0, -34, 34, Math.PI, 0); c.closePath(); c.fillStyle = "#d8322a"; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
      for (const [x, y, r] of [[-16, -50, 6], [6, -58, 5], [18, -44, 5], [-4, -42, 4]]) D.circle(c, x, y, r, "#fff", null, 0);
      c.restore();
    },
    beehive: (c, p, t) => {
      if (!p.done) { D.line(c, p.x, p.y - 80, p.x, p.y - 56, "#5a3a1a", 3); for (let i = 0; i < 4; i++) D.ellipse(c, p.x, p.y - 44 + i * 12, 26 - Math.abs(i - 1.5) * 5, 8, "#e8b030", OUT, 2); }
      else D.ellipse(c, p.x + 6, p.y + 210, 26, 14, "#e8b030", OUT, 2);
    },
    lighthouse: (c, p, t) => {
      c.fillStyle = "#f2f2ee"; c.beginPath(); c.moveTo(p.x - 34, p.y); c.lineTo(p.x - 22, p.y - 220); c.lineTo(p.x + 22, p.y - 220); c.lineTo(p.x + 34, p.y); c.fill();
      c.fillStyle = "#d83a2c"; for (const y of [40, 110, 180]) { c.beginPath(); c.moveTo(p.x - 34 + y * 0.055, p.y - y); c.lineTo(p.x - 34 + (y + 34) * 0.055, p.y - y - 34); c.lineTo(p.x + 34 - (y + 34) * 0.055, p.y - y - 34); c.lineTo(p.x + 34 - y * 0.055, p.y - y); c.fill(); }
      D.rr(c, p.x - 26, p.y - 236, 52, 16, 3, "#333", null, 0);
      const on = p.done;
      D.rr(c, p.x - 18, p.y - 266, 36, 30, 4, on ? "#fff6a0" : "#c8d8e0", OUT, 2);
      c.fillStyle = "#d83a2c"; c.beginPath(); c.moveTo(p.x - 24, p.y - 266); c.lineTo(p.x, p.y - 290); c.lineTo(p.x + 24, p.y - 266); c.fill();
      if (on) { c.save(); c.translate(p.x, p.y - 251); c.rotate(t * 1.5); const g = c.createLinearGradient(0, 0, 400, 0); g.addColorStop(0, "rgba(255,250,180,0.6)"); g.addColorStop(1, "rgba(255,250,180,0)"); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(400, -50); c.lineTo(400, 50); c.fill(); c.restore(); }
    },
    buoy: (c, p, t) => {
      const b = Math.sin(t * 2 + p.x) * 4;
      c.save(); c.translate(p.x, p.y + b); c.rotate(Math.sin(t * 1.7) * 0.1);
      D.poly(c, [-22, 0, 22, 0, 12, -40, -12, -40], "#e84a2a", OUT, 2); D.rr(c, -14, -26, 28, 8, 1, "#fff", null, 0);
      D.line(c, 0, -40, 0, -66, "#333", 3); D.circle(c, 0, -70, 6, p.hitT > 0 ? "#fff6a0" : "#d8c040", OUT, 1.5);
      c.restore();
    },
    flag: (c, p, t) => {
      D.line(c, p.x, p.y, p.x, p.y - 90, "#4a3a2a", 4);
      if (p.done) { const k = Math.min(1, p.doneT || 0); c.save(); c.translate(p.x, p.y - 80 + k * 70); c.rotate(k * 1.2); D.poly(c, [0, 0, 50, 6, 0, 26], p.col || "#2a5aa8", OUT, 2); c.restore(); return; }
      c.beginPath(); c.moveTo(p.x, p.y - 88);
      for (let x = 0; x <= 60; x += 6) c.lineTo(p.x + x, p.y - 88 + Math.sin(t * 5 + x * 0.12) * 4);
      for (let x = 60; x >= 0; x -= 6) c.lineTo(p.x + x, p.y - 58 + Math.sin(t * 5 + x * 0.12) * 4);
      c.closePath(); c.fillStyle = p.col || "#2a5aa8"; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
      D.circle(c, p.x + 26, p.y - 73 + Math.sin(t * 5 + 3) * 4, 7, "#ffd23a", null, 0);
    },
    armor: (c, p, t) => {
      c.save(); c.translate(p.x, p.y + (p.hitT > 0 ? Math.sin(p.hitT * 40) * 3 : 0));
      D.rr(c, -14, -60, 12, 60, 4, "#a8b0bc", OUT, 2); D.rr(c, 4, -60, 12, 60, 4, "#a8b0bc", OUT, 2);
      D.rr(c, -26, -130, 52, 74, 14, "#b8c0cc", OUT, 2.5); D.line(c, 0, -126, 0, -62, "rgba(0,0,0,0.25)", 2);
      D.rr(c, -38, -126, 14, 56, 6, "#a8b0bc", OUT, 2); D.rr(c, 24, -126, 14, 56, 6, "#a8b0bc", OUT, 2);
      D.line(c, 38, -76, 42, -170, "#888", 4); D.poly(c, [36, -170, 42, -196, 48, -170], "#ccc", OUT, 1.5);
      if (!p.done) { D.rr(c, -20, -170, 40, 42, 16, "#c8d0dc", OUT, 2.5); D.rr(c, -14, -154, 28, 5, 2, "#333", null, 0); D.poly(c, [-4, -170, 0, -196, 4, -170], "#d83a2c", null, 0); }
      c.restore();
    },
    snowman: (c, p, t) => {
      D.circle(c, p.x, p.y - 40, 44, "#f8fbff", "#b8c6d8", 2); D.circle(c, p.x, p.y - 108, 32, "#f8fbff", "#b8c6d8", 2);
      for (let i = 0; i < 3; i++) D.circle(c, p.x, p.y - 96 + i * 18 - 20, 3.5, "#333", null, 0);
      D.line(c, p.x - 30, p.y - 110, p.x - 66, p.y - 140, "#6a4a2a", 4); D.line(c, p.x + 30, p.y - 110, p.x + 66, p.y - 136, "#6a4a2a", 4);
      if (!p.done) {
        D.circle(c, p.x, p.y - 162, 24, "#f8fbff", "#b8c6d8", 2);
        D.circle(c, p.x - 8, p.y - 168, 3, "#222", null, 0); D.circle(c, p.x + 8, p.y - 168, 3, "#222", null, 0);
        D.poly(c, [p.x, p.y - 162, p.x + 26, p.y - 158, p.x, p.y - 154], "#f07a1a", null, 0);
        D.rr(c, p.x - 20, p.y - 202, 40, 26, 3, "#2a2a2a", null, 0); D.rr(c, p.x - 28, p.y - 182, 56, 6, 2, "#2a2a2a", null, 0);
      }
      D.rr(c, p.x - 32, p.y - 140, 64, 10, 4, "#c83030", null, 0);
    },
    clock: (c, p, t) => {
      D.circle(c, p.x, p.y, 34, "#f6efdc", OUT, 3);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * U.TAU; D.line(c, p.x + Math.cos(a) * 26, p.y + Math.sin(a) * 26, p.x + Math.cos(a) * 30, p.y + Math.sin(a) * 30, "#333", 2); }
      const sp = p.done ? t * 6 : t * 0.02;
      const a1 = -Math.PI / 2 + sp, a2 = -Math.PI / 2 + sp * 12 + 2;
      D.line(c, p.x, p.y, p.x + Math.cos(a1) * 16, p.y + Math.sin(a1) * 16, "#222", 4);
      D.line(c, p.x, p.y, p.x + Math.cos(a2) * 25, p.y + Math.sin(a2) * 25, "#222", 2.5);
    },
    laundry: (c, p, t) => {
      D.line(c, p.x - 120, p.y - 100, p.x + 120, p.y - 96, "#555", 2);
      const items = [["#e8e0d0", -80], ["#5a8ac8", -20], ["#d84a3a", 40], ["#f2d24a", 92]];
      items.forEach(([col, dx], i) => {
        if (p.done && i === 1) { const k = Math.min(1, p.doneT || 0); c.save(); c.translate(p.x + dx, p.y - 98 + k * 98); c.rotate(k * 0.8); D.rr(c, -18, 0, 36, 44, 4, col, OUT, 2); c.restore(); return; }
        c.save(); c.translate(p.x + dx, p.y - 98); c.rotate(Math.sin(t * 2 + i) * 0.08);
        D.rr(c, -18, 0, 36, i % 2 ? 44 : 34, 4, col, OUT, 2); D.circle(c, -10, 0, 3, "#999", null, 0); D.circle(c, 10, 0, 3, "#999", null, 0);
        c.restore();
      });
    },
    pumpkin: (c, p, t) => {
      if (p.done) { for (let i = 0; i < 5; i++) D.ellipse(c, p.x - 30 + i * 15, p.y - 6, 10, 6, "#e8832a", OUT, 1.5); return; }
      D.ellipse(c, p.x, p.y - 30, 38, 30, "#e8832a", OUT, 2.5);
      for (const dx of [-14, 14]) { c.beginPath(); c.ellipse(p.x + dx, p.y - 30, 12, 29, 0, 0, U.TAU); c.strokeStyle = "rgba(120,50,0,0.4)"; c.lineWidth = 2; c.stroke(); }
      D.poly(c, [p.x - 16, p.y - 38, p.x - 6, p.y - 38, p.x - 11, p.y - 46], "#3a1a00", null, 0); D.poly(c, [p.x + 6, p.y - 38, p.x + 16, p.y - 38, p.x + 11, p.y - 46], "#3a1a00", null, 0);
      c.beginPath(); c.moveTo(p.x - 18, p.y - 24); c.lineTo(p.x - 8, p.y - 18); c.lineTo(p.x, p.y - 24); c.lineTo(p.x + 8, p.y - 18); c.lineTo(p.x + 18, p.y - 24); c.lineTo(p.x, p.y - 14); c.closePath(); c.fillStyle = "#3a1a00"; c.fill();
      D.rr(c, p.x - 4, p.y - 66, 8, 10, 2, "#4a6a2a", null, 0);
    },
    bell: (c, p, t) => {
      const sw = p.hitT > 0 ? Math.sin(p.hitT * 12) * 0.5 * p.hitT : 0;
      c.save(); c.translate(p.x, p.y - 40); c.rotate(sw);
      c.beginPath(); c.moveTo(-26, 34); c.quadraticCurveTo(-24, 0, 0, -2); c.quadraticCurveTo(24, 0, 26, 34); c.closePath();
      c.fillStyle = "#c89a30"; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
      D.circle(c, 0, 36, 6, "#8a6a20", OUT, 1.5);
      c.restore();
    },
    lantern: (c, p, t) => {
      D.line(c, p.x, p.y, p.x, p.y - 140, "#2a2a2a", 6);
      D.line(c, p.x, p.y - 140, p.x + 34, p.y - 140, "#2a2a2a", 4);
      const on = p.lit > 0;
      D.rr(c, p.x + 20, p.y - 140, 28, 38, 6, on ? "#ffe680" : "#4a4a3a", OUT, 2);
      if (on) D.circle(c, p.x + 34, p.y - 120, 40, "rgba(255,230,120,0.25)", null, 0);
    },
    shrine: (c, p, t) => {},
  };
  FF.BONUS_DRAW = BONUS_DRAW;

  const FLUSH_DRAW = {
    oak: (c, p, t) => D.tree(c, p.x, p.y, 110 * (p.s || 1), p.col || "#4f8a3a", "#5b3b22", p.x | 0),
    apple: (c, p, t) => { D.tree(c, p.x, p.y, 100, "#4f8a3a", "#5b3b22", 7); D.dots(c, p.x - 90, p.x + 90, p.y - 230, p.y - 110, ["#d8322a"], 9, Math.max(0, 16 - (p.used || 0) * 4), 6, 8); },
    pine: (c, p, t) => D.pine(c, p.x, p.y, 300 * (p.s || 1), p.col || "#2f5a34", p.snow),
    willow: (c, p, t) => { D.tree(c, p.x, p.y, 90, "#6a8a3a", "#4a3020", 3); for (let i = 0; i < 18; i++) D.line(c, p.x - 90 + i * 10, p.y - 190, p.x - 92 + i * 10 + Math.sin(t + i) * 4, p.y - 70 - (i % 3) * 10, "#5a7a2a", 3); },
    spooky: (c, p, t) => {
      c.strokeStyle = "#1a1418"; c.lineCap = "round";
      c.lineWidth = 26; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + 10, p.y - 180); c.stroke();
      c.lineWidth = 10; for (const [a, l] of [[-2.4, 120], [-0.7, 130], [-1.9, 90], [-1.1, 100], [-2.8, 70]]) { c.beginPath(); c.moveTo(p.x + 8, p.y - 150); c.quadraticCurveTo(p.x + 8 + Math.cos(a) * l * 0.6, p.y - 150 + Math.sin(a) * l * 0.4, p.x + 8 + Math.cos(a) * l, p.y - 150 + Math.sin(a) * l); c.stroke(); }
      D.ellipse(c, p.x + 4, p.y - 110, 9, 14, "#0a0608", null, 0);
    },
  };
  FF.FLUSH_DRAW = FLUSH_DRAW;

  /* ================= the levels ================= */
  const LEVELS = (FF.LEVELS = []);

  // 1 – Highland Moor
  LEVELS.push({
    id: "moor", name: "Highland Moor", sub: "Heather, a windmill and a cheeky scarecrow", song: "moor", target: 400,
    skin: "brown", speed: 1, active: 7, mix: [0.3, 0.4, 0.3], golden: 0.02, walkers: 2, ground: [0, 500, 650],
    sky: sky("#5aa8e2", "#e0f2fb", { sun: [1040, 110, 46, "rgba(255,240,180,0.6)"], clouds: 7 }),
    paint: [
      (c, w) => {
        D.ridge(c, 0, w, 330, 90, 3, "#9aa8cc"); D.ridge(c, 0, w, 352, 50, 4, "#8a9cb6");
        D.ridge(c, 0, w, 410, 30, 5, "#7d9a6a");
      },
      (c, w) => {
        D.ridge(c, 0, w, 470, 36, 8, "#7f9c46");
        D.dots(c, 0, w, 470, 560, ["#8e5a96", "#a46aa8", "#6e7e3a"], 3, 900, 2, 5);
        D.house(c, 2240, 500, 150, 70, "#b8a88e", "#5a4a3a", { door: true });
        D.fence(c, 300, 1100, 520, 30, "#7a6a54");
        for (const x of [180, 900, 2600]) D.rock(c, x, 520, 70, 34, "#8c8c86");
      },
      (c, w) => {
        D.ridge(c, 0, w, 640, 22, 12, "#5f7d30");
        D.vgrad(c, 0, 660, w, 60, ["rgba(60,80,20,0)", "rgba(40,60,10,0.6)"]);
        D.dots(c, 0, w, 630, 720, ["#7a4a86", "#9a5aa0", "#4f6a26"], 13, 1400, 2, 6);
        D.tufts(c, 0, w, 630, 720, "#3f5a1a", 14, 260, 22);
      },
    ],
    props: [
      bonus(1, 1500, 485, "windmill", 25, [-110, -310, 110, 0], { spinny: true }),
      flush(1, 640, 500, "oak", [-120, -260, 120, -120]),
      critter(1, "sheep", 1750, 2150, 505),
      critter(1, "sheep", 400, 700, 512, { speed: 16 }),
      peek(1, 1050, 512, "rock", { s: 0.7, rise: 34 }),
      peek(1, 2600, 506, "heather", { s: 0.8, rise: 36 }),
      peek(0, 900, 402, "bush", { s: 0.5, col: "#6f8c56", rise: 22 }),
      bonus(2, 900, 652, "signpost", 15, [-110, -160, 110, 0]),
      bonus(2, 2300, 648, "scarecrow", 20, [-60, -200, 60, 0]),
      peek(2, 420, 660, "heather", { s: 1.2, rise: 60 }),
      peek(2, 1650, 655, "rock", { s: 1.1, rise: 60 }),
      peek(2, 3000, 660, "wall", { s: 1.2, rise: 58 }),
      peek(2, 3550, 662, "heather", { s: 1.1, rise: 58 }),
    ],
    movers: { plane: "FEATHER FRENZY", balloon: true },
  });

  // 2 – Farmyard
  LEVELS.push({
    id: "farm", name: "Sunny Farmyard", sub: "Barn windows, haystacks and a grumpy cow", song: "farm", target: 500,
    skin: "brown", speed: 1.08, active: 8, mix: [0.3, 0.42, 0.28], golden: 0.03, walkers: 3, ground: [0, 505, 655],
    sky: sky("#78b8ea", "#fdf1d2", { sun: [220, 120, 50, "rgba(255,230,160,0.55)"], clouds: 6 }),
    paint: [
      (c, w) => {
        D.ridge(c, 0, w, 360, 50, 21, "#9cbf6a");
        const yAt = D.ridge(c, 0, w, 400, 34, 22, "#8db35a");
        for (let x = 0; x < w; x += 140) { c.fillStyle = (x / 140) % 2 ? "rgba(230,200,90,0.45)" : "rgba(120,160,60,0.35)"; c.fillRect(x, yAt(x) + 6, 140, 26); }
        for (const x of [250, 900, 1600]) D.house(c, x, yAt(x) + 8, 50, 26, "#f2ead8", "#b04a32", { windows: false });
      },
      (c, w) => {
        const yAt = D.ridge(c, 0, w, 500, 14, 23, "#86ad4e");
        D.vgrad(c, 0, 505, w, 60, ["rgba(170,120,60,0)", "rgba(150,110,50,0.4)"]);
        // the big red barn
        c.fillStyle = "#b8362a"; c.fillRect(1100, 300, 360, 205);
        c.beginPath(); c.moveTo(1080, 300); c.lineTo(1150, 220); c.lineTo(1410, 220); c.lineTo(1480, 300); c.closePath(); c.fillStyle = "#5a2a22"; c.fill();
        c.strokeStyle = "#f2ead8"; c.lineWidth = 8; c.strokeRect(1210, 390, 140, 115); c.beginPath(); c.moveTo(1210, 390); c.lineTo(1350, 505); c.moveTo(1350, 390); c.lineTo(1210, 505); c.stroke();
        c.fillStyle = "#3a1a14"; c.fillRect(1250, 236, 60, 52); c.fillRect(1130, 330, 50, 44); c.fillRect(1380, 330, 50, 44);
        // silo
        c.fillStyle = "#c8c8cc"; c.fillRect(1500, 250, 80, 255); c.beginPath(); c.arc(1540, 250, 40, Math.PI, 0); c.fillStyle = "#9a9aa4"; c.fill();
        for (let y = 270; y < 500; y += 26) D.line(c, 1500, y, 1580, y, "rgba(0,0,0,0.12)", 2);
        D.fence(c, 100, 1000, 520, 34, "#f2ead8"); D.fence(c, 1700, 2700, 520, 34, "#f2ead8");
        D.house(c, 2300, 505, 200, 110, "#f2e2c0", "#8a3a2a", { door: true });
      },
      (c, w) => {
        D.ridge(c, 0, w, 648, 12, 31, "#6f9a3c");
        c.fillStyle = "#b8925a"; c.beginPath(); c.moveTo(0, 690); c.quadraticCurveTo(w / 2, 670, w, 700); c.lineTo(w, 720); c.lineTo(0, 720); c.fill();
        D.tufts(c, 0, w, 640, 690, "#4a7a24", 32, 200, 18);
        D.fence(c, 0, w, 690, 60, "#9a7044");
      },
    ],
    props: [
      peek(1, 1280, 288, "window", { clip: [-30, -52, 60, 52], s: 0.75, rise: 40, frame: "#f2ead8" }),
      peek(1, 1155, 374, "window", { clip: [-25, -44, 50, 44], s: 0.6, rise: 32, frame: "#f2ead8" }),
      peek(1, 1405, 374, "window", { clip: [-25, -44, 50, 44], s: 0.6, rise: 32, frame: "#f2ead8" }),
      peek(1, 800, 512, "hay", { s: 0.8, rise: 40 }),
      peek(1, 1900, 512, "hay", { s: 0.75, rise: 40 }),
      bonus(1, 1280, 220, "weathervane", 20, [-36, -110, 36, -20]),
      flush(1, 560, 505, "apple", [-110, -250, 110, -110]),
      critter(1, "cow", 1720, 2150, 512),
      critter(1, "horse", 2600, 2780, 512, { speed: 14 }),
      peek(0, 1300, 410, "hay", { s: 0.4, rise: 18 }),
      bonus(2, 2000, 662, "tractor", 15, [-130, -160, 100, 0]),
      peek(2, 500, 668, "bale", { s: 1.2, rise: 62 }),
      peek(2, 1300, 668, "hay", { s: 1.1, rise: 66 }),
      peek(2, 2900, 668, "bale", { s: 1.2, rise: 62 }),
      peek(2, 3500, 668, "crate", { s: 1.1, rise: 60 }),
    ],
    movers: { balloon: true, plane: "FRESH EGGS" },
  });

  // 3 – Pine Forest
  LEVELS.push({
    id: "forest", name: "Deep Pine Forest", sub: "Hunting stand, mushrooms and a shy deer", song: "forest", target: 550,
    skin: "brown", speed: 1.12, active: 8, mix: [0.28, 0.42, 0.3], golden: 0.03, walkers: 2, ground: [0, 510, 660],
    sky: sky("#8cc6dc", "#e8f4e4", { clouds: 4 }),
    paint: [
      (c, w) => {
        D.ridge(c, 0, w, 340, 60, 41, "#8aa8a0");
        const r = U.rng(42);
        for (let x = 0; x < w; x += 22) D.pine(c, x + r() * 12, 400 + r() * 20, 110 + r() * 50, "#5e8478");
        D.ridge(c, 0, w, 430, 10, 43, "#557868");
      },
      (c, w) => {
        D.ridge(c, 0, w, 510, 10, 44, "#4f7a3a");
        const r = U.rng(45);
        for (let x = 40; x < w; x += 170) D.pine(c, x + r() * 60, 510, 240 + r() * 80, "#2f5a3a");
        D.dots(c, 0, w, 500, 560, ["#3a6a2a", "#5a8a3a"], 46, 400, 3, 7);
        // the hunting stand
        c.strokeStyle = "#6a4a2a"; c.lineWidth = 8;
        c.beginPath(); c.moveTo(1500, 510); c.lineTo(1520, 330); c.moveTo(1640, 510); c.lineTo(1620, 330); c.moveTo(1505, 470); c.lineTo(1635, 400); c.moveTo(1635, 470); c.lineTo(1505, 400); c.stroke();
        c.fillStyle = "#8a5a32"; c.fillRect(1500, 250, 140, 90);
        c.fillStyle = "#5a3a1a"; c.beginPath(); c.moveTo(1490, 252); c.lineTo(1570, 210); c.lineTo(1650, 252); c.fill();
        c.fillStyle = "#2a1a10"; c.fillRect(1530, 270, 80, 34);
      },
      (c, w) => {
        D.ridge(c, 0, w, 660, 10, 51, "#3e6a2a");
        D.tufts(c, 0, w, 650, 720, "#2e5a1e", 52, 260, 26);
        D.dots(c, 0, w, 660, 720, ["#7a5a3a", "#5a7a2a"], 53, 500, 2, 5);
        for (const x of [60, 1250, 2500, 3780]) { c.fillStyle = "#4a3220"; c.fillRect(x - 40, 0, 80, 720); c.fillStyle = "rgba(0,0,0,0.2)"; c.fillRect(x + 10, 0, 30, 720); for (let y = 30; y < 700; y += 60) D.line(c, x - 30, y, x - 20, y + 30, "rgba(0,0,0,0.25)", 3); }
      },
    ],
    props: [
      peek(1, 1570, 304, "window", { clip: [-40, -34, 80, 34], s: 0.6, rise: 32, frame: "#6a4a2a" }),
      flush(1, 700, 512, "pine", [-80, -330, 80, -60], { s: 1.1 }),
      flush(1, 2300, 512, "pine", [-80, -330, 80, -60], { s: 1.15 }),
      critter(1, "deer", 1850, 2150, 515, { speed: 18 }),
      peek(1, 1100, 516, "stump", { s: 0.7, rise: 34 }),
      peek(1, 2650, 516, "bush", { s: 0.7, col: "#3a6a2a", rise: 34 }),
      peek(0, 700, 425, "bush", { s: 0.45, col: "#4e7464", rise: 20 }),
      bonus(2, 600, 668, "mushroom", 10, [-36, -70, 36, 0]),
      bonus(2, 1900, 668, "mushroom", 10, [-36, -70, 36, 0]),
      bonus(2, 3150, 668, "mushroom", 10, [-36, -70, 36, 0]),
      bonus(2, 1290, 360, "beehive", 25, [-30, -86, 30, -6]),
      peek(2, 300, 672, "stump", { s: 1.3, rise: 64 }),
      peek(2, 1600, 672, "bush", { s: 1.3, col: "#3e6a28", rise: 66 }),
      peek(2, 2900, 672, "bush", { s: 1.2, col: "#3e6a28", rise: 64 }),
      peek(2, 3500, 672, "stump", { s: 1.2, rise: 62 }),
    ],
    movers: { balloon: true },
  });

  // 4 – Lakeside
  LEVELS.push({
    id: "lake", name: "Silver Lake", sub: "A lighthouse, a rowing boat and a proud swan", song: "lake", target: 650,
    skin: "brown", speed: 1.16, active: 8, mix: [0.3, 0.4, 0.3], golden: 0.035, walkers: 2, ground: [0, 0, 660], water: 440,
    sky: sky("#5aa2d8", "#f2f6ee", { sun: [900, 90, 40, "rgba(255,250,220,0.5)"], clouds: 6 }),
    paint: [
      (c, w) => {
        D.ridge(c, 0, w, 330, 80, 61, "#7f8fb8");
        D.ridge(c, 0, w, 372, 40, 62, "#6a8a6a");
        D.vgrad(c, 0, 392, w, 328, ["#7ab2d6", "#3e7aa8"]);
        c.fillStyle = "rgba(255,255,255,0.25)"; for (let i = 0; i < 70; i++) c.fillRect((i * 173) % w, 400 + (i * 37) % 120, 40, 2);
      },
      (c, w) => {
        D.vgrad(c, 0, 440, w, 280, ["#5a9ac8", "#2e6a98"]);
        c.fillStyle = "rgba(255,255,255,0.3)"; for (let i = 0; i < 90; i++) c.fillRect((i * 211) % w, 450 + (i * 53) % 180, 50, 2);
        // headland with the lighthouse
        c.fillStyle = "#6a8a4a"; c.beginPath(); c.moveTo(1900, 445); c.quadraticCurveTo(2050, 380, 2250, 400); c.quadraticCurveTo(2400, 420, 2500, 445); c.fill();
        c.fillStyle = "#8a8478"; c.beginPath(); c.moveTo(1900, 445); c.lineTo(2500, 445); c.lineTo(2480, 455); c.lineTo(1920, 455); c.fill();
        // jetty
        c.fillStyle = "#8a5a32"; c.fillRect(500, 470, 420, 14);
        for (let x = 510; x < 920; x += 60) c.fillRect(x, 470, 10, 60);
      },
      (c, w) => {
        c.fillStyle = "#7a9a4a"; c.beginPath(); c.moveTo(0, 640);
        for (let x = 0; x <= w; x += 40) c.lineTo(x, 640 + Math.sin(x * 0.004) * 16);
        c.lineTo(w, 720); c.lineTo(0, 720); c.fill();
        c.fillStyle = "#c8b48a"; c.beginPath(); c.moveTo(0, 650); for (let x = 0; x <= w; x += 40) c.lineTo(x, 650 + Math.sin(x * 0.004) * 16); c.lineTo(w, 665); c.lineTo(0, 665); c.fill();
        D.dots(c, 0, w, 660, 720, ["#9a9a92", "#7a7a72", "#b8b0a0"], 63, 500, 3, 7);
        D.tufts(c, 0, w, 668, 720, "#4a6a2a", 64, 160, 20);
      },
    ],
    props: [
      bonus(1, 2200, 405, "lighthouse", 25, [-36, -300, 36, -200]),
      bonus(1, 1300, 505, "buoy", 10, [-26, -80, 26, 0], { repeat: 8 }),
      critter(1, "swan", 1500, 1850, 498, { speed: 12 }),
      peek(1, 300, 470, "reeds", { s: 0.7, rise: 34 }),
      peek(1, 2700, 470, "reeds", { s: 0.7, rise: 34 }),
      flush(1, 150, 448, "willow", [-100, -220, 100, -60]),
      peek(2, 400, 675, "reeds", { s: 1.3, rise: 64 }),
      peek(2, 1400, 680, "rock", { s: 1.1, rise: 60 }),
      peek(2, 2500, 675, "reeds", { s: 1.3, rise: 64 }),
      peek(2, 3400, 680, "barrel", { s: 1.1, rise: 62 }),
      bonus(2, 3000, 670, "signpost", 15, [-110, -160, 110, 0]),
    ],
    movers: { plane: "LAKE TOURS", boat: { layer: 1, y: 520, x0: 300, x1: 2600 } },
  });

  // 5 – Castle ruins at sunset
  LEVELS.push({
    id: "castle", name: "Castle Ruins", sub: "Towers, banners and an empty suit of armour", song: "castle", target: 700,
    skin: "dusk", speed: 1.2, active: 9, mix: [0.32, 0.4, 0.28], golden: 0.04, walkers: 2, ground: [0, 500, 655],
    sky: sky(null, null, { stops: ["#3a2a6a", "#c8546a", "#f6a24a", "#ffd890"], sun: [640, 400, 60, "rgba(255,180,90,0.7)"], clouds: 5, cloudCol: "rgba(255,190,170,0.6)" }),
    paint: [
      (c, w) => { D.ridge(c, 0, w, 360, 70, 71, "#6a4a7a"); D.ridge(c, 0, w, 410, 40, 72, "#5a3e60"); },
      (c, w) => {
        D.ridge(c, 0, w, 500, 18, 73, "#5e5a3a");
        const stone = "#8a7a6a";
        // curtain wall with towers
        c.fillStyle = stone; c.fillRect(700, 330, 1300, 175);
        for (let x = 700; x < 2000; x += 40) c.fillRect(x, 310, 24, 22);
        for (const [x, h] of [[640, 300], [1250, 340], [1960, 280]]) { c.fillStyle = "#7e6e60"; c.fillRect(x, 505 - h, 120, h); for (let k = 0; k < 4; k++) c.fillRect(x + k * 32, 505 - h - 20, 22, 22); c.fillStyle = "#2a1e1a"; c.fillRect(x + 42, 505 - h + 50, 36, 50); }
        c.fillStyle = "#2a1e1a"; c.beginPath(); c.moveTo(1050, 505); c.lineTo(1050, 420); c.arc(1110, 420, 60, Math.PI, 0); c.lineTo(1170, 505); c.fill();
        c.strokeStyle = "rgba(0,0,0,0.15)"; c.lineWidth = 2; for (let y = 340; y < 505; y += 22) { c.beginPath(); c.moveTo(700, y); c.lineTo(2000, y); c.stroke(); }
        // broken wall on the right
        c.fillStyle = stone; c.beginPath(); c.moveTo(2200, 505); c.lineTo(2200, 400); c.lineTo(2260, 380); c.lineTo(2300, 430); c.lineTo(2380, 410); c.lineTo(2420, 505); c.fill();
      },
      (c, w) => {
        D.ridge(c, 0, w, 650, 14, 81, "#4e5a2a");
        D.tufts(c, 0, w, 640, 720, "#3a4a1a", 82, 220, 22);
        D.dots(c, 0, w, 650, 720, ["#7a6a5a", "#9a8a7a"], 83, 300, 4, 9);
      },
    ],
    props: [
      bonus(1, 700, 205, "flag", 15, [-10, -96, 66, -50], { col: "#2a5aa8" }),
      bonus(1, 1310, 165, "flag", 15, [-10, -96, 66, -50], { col: "#c8302a" }),
      bonus(1, 2020, 225, "flag", 15, [-10, -96, 66, -50], { col: "#2a8a4a" }),
      peek(1, 700, 305, "window", { clip: [-18, -50, 36, 50], s: 0.6, rise: 36, frame: "#5a4a40" }),
      peek(1, 1310, 265, "window", { clip: [-18, -50, 36, 50], s: 0.6, rise: 36, frame: "#5a4a40" }),
      peek(1, 1500, 330, "battlement", { s: 0.7, rise: 34 }),
      peek(1, 900, 330, "battlement", { s: 0.7, rise: 34 }),
      critter(1, "horse", 2450, 2750, 508, { speed: 18 }),
      peek(0, 1000, 400, "rock", { s: 0.45, col: "#5a4a50", rise: 18 }),
      bonus(2, 1700, 662, "armor", 20, [-40, -200, 40, 0]),
      peek(2, 600, 668, "rock", { s: 1.2, col: "#8a7a6a", rise: 60 }),
      peek(2, 1200, 668, "well", { s: 1.2, rise: 62 }),
      peek(2, 2600, 668, "wall", { s: 1.2, rise: 58 }),
      peek(2, 3400, 668, "barrel", { s: 1.1, rise: 62 }),
    ],
    movers: { balloon: true, plane: "SUNSET RIDES" },
  });

  // 6 – Winter valley
  LEVELS.push({
    id: "winter", name: "Snowy Valley", sub: "White grouse on white snow, gondolas and snowmen", song: "winter", target: 750,
    skin: "white", speed: 1.2, active: 9, mix: [0.3, 0.42, 0.28], golden: 0.04, walkers: 2, ground: [0, 505, 660], weather: "snow",
    sky: sky("#8fb2d6", "#eef3f8", { clouds: 5, cloudCol: "rgba(250,252,255,0.85)" }),
    paint: [
      (c, w) => {
        D.ridge(c, 0, w, 310, 120, 91, "#9aaccc");
        c.save(); c.globalCompositeOperation = "source-atop"; D.vgrad(c, 0, 150, w, 160, ["rgba(255,255,255,0.95)", "rgba(255,255,255,0)"]); c.restore();
        D.ridge(c, 0, w, 400, 40, 92, "#c4d2e2");
      },
      (c, w) => {
        D.ridge(c, 0, w, 505, 20, 93, "#e6eef6");
        const r = U.rng(94);
        for (let x = 60; x < w; x += 210) D.pine(c, x + r() * 80, 505, 200 + r() * 60, "#2e5a4a", "#f4f8fc");
        // ski lift towers and cable
        for (const x of [300, 1200, 2100, 2800]) { c.fillStyle = "#5a5a64"; c.fillRect(x - 6, 220, 12, 285); c.fillRect(x - 30, 216, 60, 10); }
        c.strokeStyle = "#333"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 222); c.lineTo(w, 222); c.stroke();
      },
      (c, w) => {
        D.ridge(c, 0, w, 655, 14, 101, "#f4f8fc", { edge: "#c8d6e6" });
        D.dots(c, 0, w, 660, 720, ["#dbe6f2", "#ffffff"], 102, 500, 3, 9);
        D.fence(c, 0, w, 700, 50, "#7a5a3a");
      },
    ],
    props: [
      flush(1, 900, 505, "pine", [-70, -300, 70, -60], { s: 0.9, snow: "#f4f8fc", col: "#2e5a4a" }),
      flush(1, 2400, 505, "pine", [-70, -300, 70, -60], { s: 0.95, snow: "#f4f8fc", col: "#2e5a4a" }),
      bonus(1, 1600, 508, "snowman", 15, [-50, -210, 50, 0], { ps: 0.62 }),
      critter(1, "hare", 1900, 2250, 512, { speed: 30 }),
      peek(1, 600, 510, "igloo", { s: 0.7, rise: 40 }),
      peek(1, 2650, 512, "drift", { s: 0.8, rise: 34 }),
      bonus(2, 2300, 668, "snowman", 15, [-50, -210, 50, 0]),
      peek(2, 400, 672, "drift", { s: 1.3, rise: 60 }),
      peek(2, 1400, 672, "igloo", { s: 1.1, rise: 66 }),
      peek(2, 3000, 672, "drift", { s: 1.3, rise: 60 }),
      peek(2, 3600, 672, "crate", { s: 1.1, rise: 60 }),
    ],
    movers: { gondolas: { layer: 1, y: 222, n: 5 }, plane: "SKI SCHOOL" },
  });

  // 7 – Autumn village at dusk
  LEVELS.push({
    id: "village", name: "Autumn Village", sub: "Chimneys, a church bell and falling leaves", song: "village", target: 800,
    skin: "dusk", speed: 1.25, active: 10, mix: [0.32, 0.4, 0.28], golden: 0.045, walkers: 2, ground: [0, 500, 660], weather: "leaves",
    sky: sky(null, null, { stops: ["#5a6aa8", "#e8907a", "#f8c88a"], sun: [300, 330, 46, "rgba(255,200,120,0.6)"], clouds: 5, cloudCol: "rgba(255,210,190,0.7)" }),
    paint: [
      (c, w) => {
        D.ridge(c, 0, w, 370, 50, 111, "#8a6a7a");
        const yAt = D.ridge(c, 0, w, 410, 30, 112, "#a8744a");
        const r = U.rng(113);
        for (let x = 40; x < w; x += 70) { const h = 30 + r() * 40; D.house(c, x, yAt(x) + 14, 46, h, "#c4a88a", "#7a3a2a", { windows: false }); }
        c.fillStyle = "#6a4a5a"; c.fillRect(1300, 250, 30, 160); c.beginPath(); c.moveTo(1290, 252); c.lineTo(1315, 170); c.lineTo(1340, 252); c.fill();
      },
      (c, w) => {
        D.ridge(c, 0, w, 500, 8, 114, "#8a7a4a");
        const houses = [[150, 230, 160, "#e8d2b0", "#8a3a2a"], [420, 200, 190, "#d8c0a0", "#6a3a3a"], [1700, 220, 170, "#e8d8c0", "#7a4a2a"], [1960, 210, 200, "#d4b494", "#5a3a3a"], [2350, 240, 150, "#e0c8a8", "#8a3a2a"]];
        for (const [x, ww, h, wall, roof] of houses) D.house(c, x, 500, ww, h, wall, roof, { lit: true, door: true });
        // church
        c.fillStyle = "#c8bca8"; c.fillRect(900, 280, 300, 220); c.fillRect(1000, 120, 100, 170);
        c.fillStyle = "#5a4a5a"; c.beginPath(); c.moveTo(885, 282); c.lineTo(1050, 210); c.lineTo(1215, 282); c.fill();
        c.beginPath(); c.moveTo(990, 122); c.lineTo(1050, 10); c.lineTo(1110, 122); c.fill();
        c.fillStyle = "#2a2028"; c.fillRect(1020, 140, 60, 50);
        c.fillStyle = "#ffd970"; for (const x of [930, 1130]) { c.beginPath(); c.moveTo(x, 470); c.lineTo(x, 350); c.arc(x + 20, 350, 20, Math.PI, 0); c.lineTo(x + 40, 470); c.fill(); }
        c.fillStyle = "#4a2e1a"; c.fillRect(1025, 400, 50, 100);
        // garden wall
        c.fillStyle = "#9a8a7a"; c.fillRect(2500, 455, 300, 45);
      },
      (c, w) => {
        c.fillStyle = "#6a6058"; c.fillRect(0, 650, w, 70);
        c.strokeStyle = "rgba(0,0,0,0.25)"; c.lineWidth = 2;
        for (let y = 655; y < 720; y += 16) for (let x = (y / 16) % 2 * 20; x < w; x += 40) c.strokeRect(x, y, 40, 16);
        c.fillStyle = "#8a6a3a"; c.fillRect(0, 640, w, 12);
        D.dots(c, 0, w, 650, 720, ["#c8602a", "#e8a030", "#a8402a"], 115, 300, 3, 6);
      },
    ],
    props: [
      peek(1, 230, 340, "chimney", { s: 0.7, rise: 34 }),
      peek(1, 1790, 330, "chimney", { s: 0.7, rise: 34 }),
      peek(1, 2420, 355, "chimney", { s: 0.7, rise: 34 }),
      peek(1, 515, 460, "window", { clip: [-12, -32, 24, 30], s: 0.42, rise: 24, frame: "#f2ead8" }),
      peek(1, 2075, 470, "window", { clip: [-12, -32, 24, 30], s: 0.42, rise: 24, frame: "#f2ead8" }),
      bonus(1, 1050, 190, "bell", 10, [-30, -46, 30, 0], { repeat: 6 }),
      bonus(1, 1050, 250, "clock", 20, [-36, -36, 36, 36]),
      bonus(1, 1600, 500, "laundry", 10, [-130, -110, 130, -40]),
      critter(1, "cat", 2540, 2760, 455, { speed: 10 }),
      bonus(2, 700, 660, "pumpkin", 10, [-40, -70, 40, 0]),
      bonus(2, 1900, 660, "pumpkin", 10, [-40, -70, 40, 0]),
      bonus(2, 3300, 660, "pumpkin", 10, [-40, -70, 40, 0]),
      peek(2, 300, 664, "barrel", { s: 1.2, rise: 64 }),
      peek(2, 1300, 664, "crate", { s: 1.2, rise: 64 }),
      peek(2, 2600, 664, "pumpkins", { s: 1.2, rise: 66 }),
      peek(2, 3600, 664, "crate", { s: 1.1, rise: 60 }),
    ],
    movers: { balloon: true },
  });

  // 8 – Moonlit night
  LEVELS.push({
    id: "night", name: "Moonlit Moor", sub: "Only your lamp and glowing eyes in the dark", song: "night", target: 800,
    skin: "night", speed: 1.15, active: 9, mix: [0.3, 0.42, 0.28], golden: 0.05, walkers: 2, ground: [0, 505, 655], night: true,
    sky: sky("#070b22", "#24305a", { moon: [980, 120], stars: true }),
    paint: [
      (c, w) => { D.ridge(c, 0, w, 360, 70, 121, "#1a2240"); D.ridge(c, 0, w, 410, 40, 122, "#151c34"); },
      (c, w) => {
        D.ridge(c, 0, w, 505, 14, 123, "#1e2a24");
        c.fillStyle = "#121618"; c.fillRect(1500, 330, 300, 175); c.beginPath(); c.moveTo(1480, 332); c.lineTo(1650, 250); c.lineTo(1820, 332); c.fill();
        c.fillStyle = "#ffd970"; c.fillRect(1560, 380, 40, 40);
        D.fence(c, 200, 1300, 520, 34, "#2a2420");
      },
      (c, w) => { D.ridge(c, 0, w, 650, 14, 131, "#16201a"); D.tufts(c, 0, w, 640, 720, "#0e160e", 132, 220, 24); },
    ],
    props: [
      flush(1, 800, 508, "spooky", [-90, -300, 110, -100]),
      critter(1, "owl", 2300, 2300, 505, { speed: 0, perch: true }),
      peek(1, 1680, 380, "window", { clip: [-30, -40, 60, 40], s: 0.6, rise: 30, frame: "#3a3028" }),
      peek(1, 2600, 512, "hay", { s: 0.75, rise: 40 }),
      peek(1, 400, 512, "bush", { s: 0.7, col: "#1a2a1a", rise: 34 }),
      bonus(1, 1250, 505, "lantern", 0, [10, -150, 60, -96], { lamp: true }),
      bonus(2, 600, 660, "lantern", 0, [10, -150, 60, -96], { lamp: true }),
      bonus(2, 2400, 660, "lantern", 0, [10, -150, 60, -96], { lamp: true }),
      peek(2, 1200, 668, "bale", { s: 1.2, rise: 62 }),
      peek(2, 2900, 668, "hay", { s: 1.1, rise: 66 }),
      peek(2, 3500, 668, "bush", { s: 1.2, col: "#14201a", rise: 64 }),
    ],
    movers: { stars: true },
  });

  // points per target
  FF.POINTS = { far: 25, mid: 10, near: 5, peek: 25, walkMid: 10, walkNear: 5, golden: 75, flyby: 15, chute: 25, balloon: 10, plane: 50, boat: 25, gondola: 25, star: 50, critter: -25 };
})(window.FF);
