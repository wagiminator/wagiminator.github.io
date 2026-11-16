/* Feather Frenzy: the grouse in all its poses, the animals you must not shoot and other moving sprites.
   All sprites are drawn around their centre and face right; the caller flips them. */
"use strict";

(function (FF) {
  const { U, D } = FF;
  const OUT = D.OUT;
  const B = (FF.Sprites = {});

  const SKINS = {
    brown: { body: "#8c4a26", dark: "#5e2e16", belly: "#d29a62", head: "#7a3e1e", comb: "#e2332a" },
    white: { body: "#f1f3f6", dark: "#c3cad4", belly: "#ffffff", head: "#e4e8ee", comb: "#e2332a" },
    gold: { body: "#f2b630", dark: "#b07a10", belly: "#ffe58a", head: "#e8a820", comb: "#ff5a2a" },
    night: { body: "#4a3a4e", dark: "#2a2030", belly: "#7a6a7e", head: "#3e3044", comb: "#b02a4a" },
    dusk: { body: "#7a3e2a", dark: "#4e2214", belly: "#c2865a", head: "#6a3420", comb: "#e2332a" },
  };
  B.SKINS = SKINS;

  // the grouse. o: { t, pose: "fly"|"glide"|"walk"|"peek"|"dead"|"sit"|"chute", skin, look }
  B.grouse = function (c, o) {
    const k = SKINS[o.skin] || SKINS.brown;
    const t = o.t || 0;
    const pose = o.pose || "fly";
    const flap = pose === "fly" ? Math.sin(t * 16) : pose === "glide" ? 0.3 : pose === "dead" ? 0.9 : -0.6;
    const dead = pose === "dead";
    c.save();
    if (pose === "walk" || pose === "sit") c.translate(0, Math.abs(Math.sin(t * 6)) * -3);
    // legs
    if (pose === "walk" || pose === "sit" || dead) {
      const sw = pose === "walk" ? Math.sin(t * 9) * 7 : 0;
      c.strokeStyle = "#e88a1a"; c.lineWidth = 4; c.lineCap = "round";
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 8, 20); c.lineTo(s * 8 + sw * s, 40); c.lineTo(s * 8 + sw * s + 8, 42); c.stroke(); }
    }
    // tail fan
    for (let i = 0; i < 4; i++) {
      c.save(); c.translate(-34, -4); c.rotate(-0.7 + i * 0.28 + (dead ? 0.6 : 0));
      D.ellipse(c, -16, 0, 18, 6, i % 2 ? k.dark : k.body, OUT, 2);
      c.restore();
    }
    // back wing
    wing(c, k, flap, -1);
    // body
    D.ellipse(c, 0, 0, 38, 28, k.body, OUT, 2.5);
    D.ellipse(c, 10, 10, 24, 15, k.belly, null, 0);
    c.strokeStyle = "rgba(0,0,0,0.18)"; c.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-20 + i * 8, -6 + (i % 2) * 6, 5, 0.3, Math.PI - 0.3); c.stroke(); }
    // head
    const hx = 28, hy = pose === "walk" && Math.sin(t * 3) > 0.7 ? 2 : -20;
    D.circle(c, hx, hy, 19, k.head, OUT, 2.5);
    D.dots(c, hx - 12, hx + 8, hy - 8, hy + 10, ["rgba(0,0,0,0.15)"], 7, 6, 1.5, 2.5);
    // beak
    D.poly(c, [hx + 15, hy - 2, hx + 31, hy + 4, hx + 15, hy + 9], "#f2a51e", OUT, 2);
    D.line(c, hx + 16, hy + 4, hx + 27, hy + 4, OUT, 1.2);
    // comb (red brow) and eyes
    D.ellipse(c, hx + 4, hy - 13, 10, 5, k.comb, OUT, 1.5, -0.2);
    if (dead) {
      for (const ex of [hx + 2, hx + 12]) { D.line(c, ex - 4, hy - 7, ex + 4, hy + 1, "#111", 2.5); D.line(c, ex + 4, hy - 7, ex - 4, hy + 1, "#111", 2.5); }
    } else {
      const big = o.look === "scared" ? 1.25 : 1;
      D.ellipse(c, hx + 1, hy - 3, 7 * big, 8 * big, "#fff", OUT, 1.8);
      D.ellipse(c, hx + 12, hy - 3, 6 * big, 7.5 * big, "#fff", OUT, 1.8);
      const glow = o.skin === "night" ? "#ffe24a" : "#111";
      D.circle(c, hx + 3, hy - 2, 3, glow, null, 0); D.circle(c, hx + 14, hy - 2, 2.7, glow, null, 0);
      if (o.skin === "night") { D.circle(c, hx + 3, hy - 2, 6, "rgba(255,230,80,0.25)", null, 0); D.circle(c, hx + 14, hy - 2, 6, "rgba(255,230,80,0.25)", null, 0); }
    }
    // front wing
    wing(c, k, flap, 1);
    if (o.skin === "gold") { c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 10); for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.1; D.circle(c, Math.cos(a) * 46, Math.sin(a) * 34, 3, "#fff8c0", null, 0); } c.globalAlpha = 1; }
    c.restore();
  };
  function wing(c, k, flap, side) {
    c.save();
    c.translate(-4, -8);
    const ang = side > 0 ? -0.2 - flap * 0.9 : -0.5 - flap * 0.7;
    c.rotate(ang);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-18, -34, -44, -30); c.quadraticCurveTo(-30, -12, -34, 0); c.quadraticCurveTo(-16, 8, 0, 0);
    c.fillStyle = side > 0 ? k.body : k.dark; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
    c.strokeStyle = "rgba(0,0,0,0.2)"; c.lineWidth = 1.5;
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-8 * i, -4); c.lineTo(-10 * i - 6, -16 - i * 3); c.stroke(); }
    c.restore();
  }
  // the grouse peeking out: only the upper half (the caller clips)
  B.parachute = function (c, t) {
    c.save(); c.translate(0, -90);
    c.rotate(Math.sin(t * 2) * 0.08);
    c.beginPath(); c.arc(0, 0, 60, Math.PI, 0); c.quadraticCurveTo(30, -6, 0, 4); c.quadraticCurveTo(-30, -6, -60, 0); c.closePath();
    c.fillStyle = "#e8e0d0"; c.fill(); c.lineWidth = 2.5; c.strokeStyle = OUT; c.stroke();
    for (const x of [-30, 0, 30]) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x * 0.8, -58 + Math.abs(x) * 0.3); c.strokeStyle = "rgba(200,40,40,0.6)"; c.lineWidth = 6; c.stroke(); }
    c.strokeStyle = "#555"; c.lineWidth = 1.2;
    for (const x of [-56, -20, 20, 56]) { c.beginPath(); c.moveTo(x, 2); c.lineTo(0, 70); c.stroke(); }
    c.restore();
  };

  /* ---------- animals you must not shoot ---------- */
  B.critter = function (c, kind, t, o = {}) {
    const hit = o.hit > 0;
    const bob = hit ? -Math.sin(Math.min(1, o.hit) * Math.PI) * 30 : 0;
    c.save(); c.translate(0, bob);
    if (kind === "sheep") {
      for (const x of [-22, -8, 14, 26]) D.rr(c, x - 3, -14, 7, 16, 3, "#2a2420", null, 0);
      for (const [x, y, r] of [[-26, -30, 16], [-8, -38, 18], [12, -36, 18], [26, -28, 15], [0, -24, 20], [-16, -22, 15]]) D.circle(c, x, y, r, "#f4f1ea", "#bdb6a8", 2);
      c.save(); c.translate(36, -34 + Math.sin(t * 2) * 2);
      D.ellipse(c, 0, 0, 12, 15, "#2a2420", OUT, 2); D.circle(c, 4, -4, 3, "#fff", null, 0); D.circle(c, 5, -4, 1.5, "#000", null, 0);
      D.ellipse(c, -8, -8, 7, 3, "#2a2420", null, 0, -0.5);
      c.restore();
    } else if (kind === "cow") {
      for (const x of [-34, -18, 20, 34]) D.rr(c, x - 4, -24, 9, 26, 3, "#efe9df", OUT, 1.5);
      D.rr(c, -48, -68, 96, 48, 20, "#f4efe6", OUT, 2.5);
      for (const [x, y, rx, ry] of [[-20, -54, 16, 11], [14, -40, 13, 9], [-36, -34, 9, 7]]) D.ellipse(c, x, y, rx, ry, "#2a2420", null, 0);
      c.save(); c.translate(56, -66 + Math.sin(t * 1.5) * 3);
      D.ellipse(c, 0, 0, 18, 15, "#f4efe6", OUT, 2.5); D.ellipse(c, 10, 8, 12, 8, "#f2b4b0", OUT, 2);
      D.circle(c, -2, -4, 3, "#111", null, 0);
      D.poly(c, [-8, -14, -14, -26, -2, -14], "#e8dcc0", OUT, 1.5); D.poly(c, [6, -14, 12, -26, 2, -14], "#e8dcc0", OUT, 1.5);
      c.restore();
      D.line(c, -48, -60, -58, -40 + Math.sin(t * 3) * 6, "#2a2420", 3);
    } else if (kind === "deer") {
      for (const x of [-22, -12, 16, 26]) D.rr(c, x - 3, -40, 6, 42, 3, "#9a6432", null, 0);
      D.ellipse(c, 0, -50, 36, 18, "#a86a36", OUT, 2);
      D.ellipse(c, 6, -44, 22, 9, "#e8c69a", null, 0);
      c.save(); c.translate(34, -70); c.rotate(Math.sin(t) * 0.1);
      D.rr(c, -5, -6, 12, 30, 5, "#a86a36", null, 0);
      D.ellipse(c, 8, -10, 14, 10, "#a86a36", OUT, 2); D.circle(c, 10, -12, 2.5, "#111", null, 0);
      for (const s of [-1, 1]) { c.strokeStyle = "#6a4422"; c.lineWidth = 3; c.beginPath(); c.moveTo(2, -18); c.lineTo(2 + s * 10, -38); c.lineTo(2 + s * 16, -42); c.moveTo(2 + s * 6, -30); c.lineTo(2 + s * 14, -30); c.stroke(); }
      c.restore();
    } else if (kind === "swan") {
      D.ellipse(c, 0, -14, 34, 16, "#fbfbf8", OUT, 2);
      c.beginPath(); c.moveTo(22, -20); c.quadraticCurveTo(44, -40, 30, -56); c.quadraticCurveTo(26, -64, 34, -66);
      c.lineWidth = 9; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 6; c.strokeStyle = "#fbfbf8"; c.stroke();
      D.poly(c, [34, -70, 46, -64, 34, -62], "#f07a1a", OUT, 1.5);
      D.circle(c, 33, -67, 1.8, "#111", null, 0);
    } else if (kind === "horse") {
      for (const x of [-30, -16, 22, 34]) D.rr(c, x - 4, -46, 8, 48, 3, "#6a4228", null, 0);
      D.ellipse(c, 0, -58, 44, 20, "#7a4a2a", OUT, 2.5);
      c.save(); c.translate(40, -78); c.rotate(-0.6 + Math.sin(t * 1.2) * 0.1);
      D.rr(c, -6, -10, 16, 40, 6, "#7a4a2a", OUT, 2); D.ellipse(c, 6, -14, 18, 10, "#7a4a2a", OUT, 2); D.circle(c, 8, -18, 2.5, "#111", null, 0);
      c.restore();
      D.line(c, -44, -60, -54, -30 + Math.sin(t * 2) * 5, "#3a2214", 6);
    } else if (kind === "hare") {
      D.ellipse(c, 0, -14, 20, 14, "#f6f6f2", OUT, 2);
      D.circle(c, 16, -26, 10, "#f6f6f2", OUT, 2);
      const ear = Math.sin(t * 3) * 0.2;
      for (const s of [0, 1]) { c.save(); c.translate(14 + s * 6, -34); c.rotate(-0.3 + s * 0.3 + ear); D.ellipse(c, 0, -14, 4, 14, "#f6f6f2", OUT, 1.5); c.restore(); }
      D.circle(c, 20, -28, 2, "#111", null, 0);
    } else if (kind === "cat") {
      D.ellipse(c, 0, -16, 22, 14, "#3a3434", OUT, 2);
      D.circle(c, 20, -30, 12, "#3a3434", OUT, 2);
      D.poly(c, [12, -38, 14, -50, 20, -40], "#3a3434", OUT, 1.5); D.poly(c, [22, -40, 28, -50, 30, -36], "#3a3434", OUT, 1.5);
      D.circle(c, 18, -31, 2.5, "#c8f04a", null, 0); D.circle(c, 26, -31, 2.5, "#c8f04a", null, 0);
      c.beginPath(); c.moveTo(-20, -16); c.quadraticCurveTo(-40, -30 + Math.sin(t * 2) * 8, -32, -50); c.lineWidth = 6; c.strokeStyle = "#3a3434"; c.stroke();
    } else if (kind === "owl") {
      D.ellipse(c, 0, -30, 22, 30, "#8a6a4a", OUT, 2);
      D.ellipse(c, 0, -22, 14, 18, "#c8a882", null, 0);
      const blink = Math.sin(t * 0.8) > 0.97;
      for (const s of [-1, 1]) { D.circle(c, s * 9, -42, 9, "#ffe070", OUT, 2); if (!blink) D.circle(c, s * 9, -42, 4, "#111", null, 0); else D.line(c, s * 9 - 7, -42, s * 9 + 7, -42, OUT, 2); }
      D.poly(c, [-3, -36, 3, -36, 0, -28], "#e8a020", OUT, 1);
      D.poly(c, [-18, -56, -12, -66, -8, -56], "#8a6a4a", OUT, 1.5); D.poly(c, [18, -56, 12, -66, 8, -56], "#8a6a4a", OUT, 1.5);
    }
    c.restore();
  };

  /* ---------- other moving things ---------- */
  B.plane = function (c, t, banner, o = {}) {
    c.save();
    if (o.smoke) c.rotate(0.12);
    // banner on a rope behind the plane
    if (banner) {
      const w = 260;
      D.line(c, -60, 0, -100, 0, "#444", 1.5);
      c.beginPath(); c.moveTo(-100, -18);
      for (let x = 0; x <= w; x += 20) c.lineTo(-100 - x, -18 + Math.sin(t * 8 + x * 0.05) * 4);
      for (let x = w; x >= 0; x -= 20) c.lineTo(-100 - x, 18 + Math.sin(t * 8 + x * 0.05) * 4);
      c.closePath(); c.fillStyle = "#fffbe8"; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
      D.text(c, banner, -100 - w / 2, 2, 22, "#b02a2a", "center", { outline: false });
    }
    D.ellipse(c, 0, 0, 62, 16, "#d8382c", OUT, 2.5);
    D.poly(c, [-56, -4, -78, -30, -66, -30, -40, -6], "#d8382c", OUT, 2);
    D.rr(c, -14, -6, 36, 8, 3, "#f2f2f2", OUT, 1.5);
    D.rr(c, -10, -34, 24, 70, 6, "#b82c22", OUT, 2);
    D.ellipse(c, 20, -10, 12, 8, "rgba(170,220,255,0.8)", OUT, 1.5);
    // pilot grouse
    c.save(); c.translate(20, -18); c.scale(0.3, 0.3); B.grouse(c, { t, pose: "sit" }); c.restore();
    D.ellipse(c, 64, 0, 4, 24 * Math.abs(Math.sin(t * 40)) + 4, "rgba(80,80,80,0.6)", null, 0);
    c.restore();
  };
  B.balloon = function (c, t, popped) {
    if (!popped) {
      D.ellipse(c, 0, -110, 62, 74, "#e84a3a", OUT, 2.5);
      c.save(); c.beginPath(); c.ellipse(0, -110, 62, 74, 0, 0, U.TAU); c.clip();
      for (let i = -2; i <= 2; i++) { c.fillStyle = i % 2 ? "#ffd23a" : "#e84a3a"; c.fillRect(i * 26 - 8, -190, 16, 160); }
      c.restore();
      D.ellipse(c, 0, -110, 62, 74, null, OUT, 2.5);
      for (const x of [-30, 30]) D.line(c, x, -52, x * 0.5, -12, "#5a3a1a", 1.5);
    }
    D.rr(c, -20, -14, 40, 28, 4, "#a8743a", OUT, 2);
    for (let i = 0; i < 4; i++) D.line(c, -18 + i * 12, -12, -18 + i * 12, 12, "rgba(0,0,0,0.25)", 1.5);
  };
  B.boat = function (c, t) {
    c.save(); c.rotate(Math.sin(t * 1.6) * 0.04);
    c.beginPath(); c.moveTo(-70, -20); c.lineTo(70, -20); c.quadraticCurveTo(60, 8, 40, 10); c.lineTo(-50, 10); c.quadraticCurveTo(-66, 0, -70, -20);
    c.fillStyle = "#9a5a2a"; c.fill(); c.lineWidth = 2.5; c.strokeStyle = OUT; c.stroke();
    D.line(c, -64, -14, 64, -14, "#c8884a", 3);
    const row = Math.sin(t * 3);
    D.line(c, -10, -30, -60 + row * 12, 14, "#6a4020", 4);
    c.restore();
  };
  B.gondola = function (c, t) {
    D.line(c, 0, -60, 0, -34, "#333", 3);
    D.rr(c, -30, -36, 60, 50, 10, "#d83a2c", OUT, 2.5);
    D.rr(c, -22, -28, 44, 20, 5, "rgba(190,230,255,0.9)", OUT, 1.5);
  };
  B.star = function (c, t) {
    c.save(); c.rotate(-0.4);
    const g = c.createLinearGradient(-160, 0, 0, 0); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(255,250,210,0.9)");
    c.fillStyle = g; c.beginPath(); c.moveTo(-160, -2); c.lineTo(0, -5); c.lineTo(0, 5); c.lineTo(-160, 2); c.fill();
    c.restore();
    const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 6 : 15; pts.push(Math.cos(a) * r, Math.sin(a) * r); }
    D.poly(c, pts, "#fff4b0", "#e8b020", 2);
  };
  B.feather = function (c, x, y, a, s, col) {
    c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
    c.beginPath(); c.moveTo(-10, 0); c.quadraticCurveTo(0, -6, 10, 0); c.quadraticCurveTo(0, 6, -10, 0);
    c.fillStyle = col; c.fill(); c.strokeStyle = "rgba(0,0,0,0.3)"; c.lineWidth = 1; c.beginPath(); c.moveTo(-10, 0); c.lineTo(10, 0); c.stroke();
    c.restore();
  };
})(window.FF);
