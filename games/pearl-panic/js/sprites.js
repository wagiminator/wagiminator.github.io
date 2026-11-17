/* Pearl Panic: everything that is drawn – the underwater worlds, the grooves, the pearls,
   Puff the pufferfish, the giant clam, coins and power icons */
"use strict";

(function (PP) {
  const { U, D } = PP;
  const S = (PP.S = {});
  const W = U.W, H = U.H, TAU = U.TAU;
  const mix = D.mix;
  const col = (i) => PP.G.COLORS[i];

  const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };

  /* ================= pearls ================= */
  const baseCache = {}, PS = 2;
  function base(ci) {
    if (baseCache[ci]) return baseCache[ci];
    const cv = canvas(40 * PS, 40 * PS), g = cv.getContext("2d");
    g.scale(PS, PS);
    const c0 = col(ci);
    const gr = g.createRadialGradient(13, 12, 1, 20, 20, 19);
    gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.18, mix(c0, 0.45)); gr.addColorStop(0.6, c0); gr.addColorStop(1, mix(c0, -0.5));
    g.beginPath(); g.arc(20, 20, 17, 0, TAU); g.fillStyle = gr; g.fill();
    g.lineWidth = 1.6; g.strokeStyle = "rgba(4,24,40,0.55)"; g.stroke();
    // a soft rim light from below
    g.beginPath(); g.arc(20, 20, 14.5, 0.3, Math.PI - 0.3); g.lineWidth = 2; g.strokeStyle = "rgba(255,255,255,0.18)"; g.stroke();
    baseCache[ci] = cv;
    return cv;
  }
  const glossCv = (() => {
    const cv = canvas(40 * PS, 40 * PS), g = cv.getContext("2d");
    g.scale(PS, PS);
    g.beginPath(); g.ellipse(14, 12, 5.5, 3.2, -0.6, 0, TAU); g.fillStyle = "rgba(255,255,255,0.85)"; g.fill();
    g.beginPath(); g.arc(25, 27, 1.6, 0, TAU); g.fillStyle = "rgba(255,255,255,0.35)"; g.fill();
    return cv;
  })();
  // a different engraved symbol for every colour, so the colours can be told apart without colour
  function symbol(c, ci, s = 1) {
    c.beginPath();
    switch (ci) {
      case 0: // heart
        c.moveTo(0, 5 * s); c.bezierCurveTo(-8 * s, -1 * s, -4 * s, -7 * s, 0, -3 * s); c.bezierCurveTo(4 * s, -7 * s, 8 * s, -1 * s, 0, 5 * s); break;
      case 1: // triangle
        c.moveTo(0, -6 * s); c.lineTo(5.5 * s, 4 * s); c.lineTo(-5.5 * s, 4 * s); c.closePath(); break;
      case 2: // star
        for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = (i % 2 ? 2.6 : 6.4) * s; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        c.closePath(); break;
      case 3: // leaf
        c.moveTo(0, -6 * s); c.quadraticCurveTo(6 * s, 0, 0, 6 * s); c.quadraticCurveTo(-6 * s, 0, 0, -6 * s); break;
      case 4: // square
        c.rect(-4.5 * s, -4.5 * s, 9 * s, 9 * s); break;
      default: // ring
        c.arc(0, 0, 5 * s, 0, TAU); c.moveTo(2.5 * s, 0); c.arc(0, 0, 2.5 * s, 0, TAU, true);
    }
    c.fill("evenodd");
  }
  S.symbol = symbol;
  S.pearl = function (c, x, y, ci, roll = 0, opt = {}) {
    const sc = opt.scale || 1;
    if (opt.glow) {
      const a = 0.35 + 0.25 * Math.sin(opt.glow * 6);
      D.circle(c, x, y, 22 * sc, `rgba(255,255,220,${a})`, null);
    }
    c.drawImage(base(ci), x - 20 * sc, y - 20 * sc, 40 * sc, 40 * sc);
    c.save(); c.translate(x, y); c.rotate(roll); c.scale(sc, sc);
    if (opt.power) {
      c.rotate(-roll);
      S.powerIcon(c, opt.power, 0, 0, 0.85);
    } else {
      c.fillStyle = mix(col(ci), -0.55);
      c.globalAlpha = 0.75;
      symbol(c, ci);
      // two seam dots make the rolling visible
      c.globalAlpha = 0.4;
      c.beginPath(); c.arc(11, 0, 1.8, 0, TAU); c.arc(-11, 0, 1.8, 0, TAU); c.fill();
      c.globalAlpha = 1;
    }
    c.restore();
    c.drawImage(glossCv, x - 20 * sc, y - 20 * sc, 40 * sc, 40 * sc);
  };

  /* ================= power icons ================= */
  S.powerIcon = function (c, kind, x, y, s = 1) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.lineJoin = "round"; c.lineCap = "round";
    c.fillStyle = "#fff"; c.strokeStyle = "#0b2a3a"; c.lineWidth = 3;
    c.beginPath();
    if (kind === "slow") { // hourglass
      c.moveTo(-6, -8); c.lineTo(6, -8); c.lineTo(1, 0); c.lineTo(6, 8); c.lineTo(-6, 8); c.lineTo(-1, 0); c.closePath();
    } else if (kind === "back") { // two arrows pointing back
      c.moveTo(-1, -7); c.lineTo(-9, 0); c.lineTo(-1, 7); c.closePath();
      c.moveTo(8, -7); c.lineTo(0, 0); c.lineTo(8, 7); c.closePath();
    } else if (kind === "aim") { // cross-hair
      c.arc(0, 0, 6.5, 0, TAU); c.stroke(); c.lineWidth = 2; c.strokeStyle = "#fff"; c.stroke();
      c.beginPath(); for (const [a, b, e, f] of [[0, -10, 0, -3], [0, 3, 0, 10], [-10, 0, -3, 0], [3, 0, 10, 0]]) { c.moveTo(a, b); c.lineTo(e, f); }
      c.lineWidth = 4.5; c.strokeStyle = "#0b2a3a"; c.stroke(); c.lineWidth = 2; c.strokeStyle = "#fff"; c.stroke();
      c.restore(); return;
    } else { // burst
      for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8, r = i % 2 ? 4 : 9.5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      c.closePath();
    }
    c.stroke(); c.fill();
    c.restore();
  };
  S.POWER_NAME = { slow: "Slow down", back: "Reverse", aim: "Sharp eye", bomb: "Blast" };

  /* ================= Puff, the pufferfish ================= */
  S.puffer = function (c, x, y, ang, o = {}) {
    const t = o.t || 0, kick = o.kick || 0, swell = 1 + Math.sin(t * 2.2) * 0.025 + kick * 0.06;
    c.save(); c.translate(x, y); c.rotate(ang);
    if (Math.cos(ang) < 0) c.scale(1, -1); // stay upright
    c.translate(-kick * 8, 0);
    // shadow
    c.save(); c.globalAlpha = 0.25; D.ellipse(c, -4, 10, 54, 46, "#00121e", null); c.restore();
    // tail fin
    const tw = Math.sin(t * 7) * 0.25;
    c.save(); c.translate(-46, 0); c.rotate(tw);
    c.beginPath(); c.moveTo(4, 0); c.quadraticCurveTo(-18, -26, -30, -20); c.quadraticCurveTo(-20, 0, -30, 20); c.quadraticCurveTo(-18, 26, 4, 0);
    c.fillStyle = "#ff9a3a"; c.fill(); c.lineWidth = 3; c.strokeStyle = "#0b2a3a"; c.stroke();
    c.strokeStyle = "rgba(11,42,58,0.35)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-4, -2); c.lineTo(-22, -14); c.moveTo(-4, 2); c.lineTo(-22, 14); c.moveTo(-6, 0); c.lineTo(-24, 0); c.stroke();
    c.restore();
    c.save(); c.scale(swell, swell);
    // spines
    c.fillStyle = "#f4d9a0"; c.strokeStyle = "#0b2a3a"; c.lineWidth = 2;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU + 0.17;
      if (Math.cos(a) > 0.82) continue; // not around the mouth
      const ca = Math.cos(a), sa = Math.sin(a);
      c.beginPath(); c.moveTo(ca * 40 - sa * 6, sa * 40 + ca * 6); c.lineTo(ca * 54, sa * 54); c.lineTo(ca * 40 + sa * 6, sa * 40 - ca * 6); c.closePath(); c.fill(); c.stroke();
    }
    // body
    const gr = c.createRadialGradient(-12, -16, 6, 0, 0, 46);
    gr.addColorStop(0, "#fff2a8"); gr.addColorStop(0.55, "#ffd04a"); gr.addColorStop(1, "#e89a2a");
    D.circle(c, 0, 0, 44, gr, "#0b2a3a", 4);
    // pale belly
    c.save(); c.beginPath(); c.arc(0, 0, 42, 0, TAU); c.clip();
    D.ellipse(c, 2, 30, 40, 22, "#fff6d8", null);
    // spots
    c.fillStyle = "rgba(170,90,20,0.45)";
    for (const [sx, sy, r] of [[-24, -14, 5], [-10, -30, 4], [-30, 6, 4], [8, -36, 3], [-16, -2, 3]]) { c.beginPath(); c.arc(sx, sy, r, 0, TAU); c.fill(); }
    c.restore();
    // side fin
    const fw = Math.sin(t * 5) * 0.3;
    c.save(); c.translate(-8, 14); c.rotate(0.5 + fw);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-18, 6, -22, 18); c.quadraticCurveTo(-6, 16, 0, 0);
    c.fillStyle = "#ff9a3a"; c.fill(); c.lineWidth = 2.5; c.strokeStyle = "#0b2a3a"; c.stroke();
    c.restore();
    // mouth: the lips hold the current pearl
    D.ellipse(c, 38, 0, 15, 17, "#ff7a8a", "#0b2a3a", 3.5);
    D.ellipse(c, 40, 0, 10, 12, "#5a1a2a", null);
    // the eye looks along the aim
    const blink = o.blink ? 0.15 : 1;
    D.ellipse(c, 12, -18, 13, 14 * blink, "#fff", "#0b2a3a", 3);
    if (blink > 0.5) { D.circle(c, 16, -17, 7, "#0b2a3a", null); D.circle(c, 18, -20, 2.5, "#fff", null); }
    D.line(c, 0, -34, 20, -31, "#0b2a3a", 3); // brow
    // blush
    D.ellipse(c, 16, 4, 6, 3.5, "rgba(255,110,110,0.45)", null);
    c.restore();
    // the pearl in the mouth
    if (o.cur != null) S.pearl(c, 44 * swell + 4, 0, o.cur, 0, { scale: 0.9 });
    // the next pearl rides in a shell on the head
    if (o.next != null) {
      c.save(); c.translate(-14, -50);
      c.beginPath(); c.moveTo(-14, 2); c.quadraticCurveTo(0, 18, 14, 2); c.closePath(); c.fillStyle = "#ffd8e0"; c.fill(); c.lineWidth = 2.5; c.strokeStyle = "#0b2a3a"; c.stroke();
      S.pearl(c, 0, -2, o.next, 0, { scale: 0.55 });
      c.restore();
    }
    c.restore();
  };

  /* ================= the giant clam at the end of a track ================= */
  S.clam = function (c, x, y, ang, open, t) {
    c.save(); c.translate(x, y);
    const o = U.clamp(open, 0, 1);
    // bottom shell
    c.beginPath(); c.moveTo(-40, 0); c.quadraticCurveTo(-40, 40, 0, 42); c.quadraticCurveTo(40, 40, 40, 0); c.closePath();
    c.fillStyle = "#c88ad8"; c.fill(); c.lineWidth = 4; c.strokeStyle = "#0b2a3a"; c.stroke();
    c.strokeStyle = "rgba(11,42,58,0.3)"; c.lineWidth = 2;
    for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 4, 40); c.lineTo(i * 12, 4); c.stroke(); }
    // the inside
    D.ellipse(c, 0, 0, 36, 10 + o * 12, "#5a1a3a", "#0b2a3a", 3);
    D.ellipse(c, 0, 2, 26, 6 + o * 7, "#ff8aa8", null);
    // a big pearl inside, glowing more in danger
    D.circle(c, 0, 0, 8 + o * 2, `rgba(255,240,250,${0.6 + o * 0.4})`, "#0b2a3a", 2);
    // the lid opens
    c.save(); c.translate(0, -2); c.scale(1, -(0.55 + o * 0.45));
    c.beginPath(); c.moveTo(-40, 0); c.quadraticCurveTo(-40, 40, 0, 44); c.quadraticCurveTo(40, 40, 40, 0); c.closePath();
    c.fillStyle = "#d8a0e8"; c.fill(); c.lineWidth = 4; c.strokeStyle = "#0b2a3a"; c.stroke();
    c.strokeStyle = "rgba(11,42,58,0.3)"; c.lineWidth = 2;
    for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 4, 42); c.lineTo(i * 12, 4); c.stroke(); }
    c.restore();
    // eyes on the lid when it is hungry
    if (o > 0.5) {
      const e = -26 - o * 10;
      for (const ex of [-12, 12]) { D.circle(c, ex, e, 6, "#fff", "#0b2a3a", 2.5); D.circle(c, ex + Math.sin(t * 3) * 1.5, e + 1, 3, "#0b2a3a", null); }
    }
    c.restore();
  };
  // the hole the pearls come out of
  S.spout = function (c, x, y, ang) {
    c.save(); c.translate(x, y); c.rotate(ang);
    D.ellipse(c, -6, 0, 18, 30, "#5a4a3a", "#0b2a3a", 4);
    D.ellipse(c, -4, 0, 11, 22, "#1a120a", null);
    c.restore();
  };

  S.coin = function (c, x, y, t, fade) {
    c.save(); c.translate(x, y); c.globalAlpha = fade;
    D.circle(c, 0, 0, 30 + Math.sin(t * 6) * 3, "rgba(255,230,120,0.25)", null);
    c.scale(Math.max(0.15, Math.abs(Math.cos(t * 3))), 1);
    D.circle(c, 0, 0, 18, "#ffd65a", "#0b2a3a", 3);
    D.circle(c, 0, 0, 12, null, "#c8901a", 2);
    c.fillStyle = "#c8901a"; c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 3 : 7.5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    c.fill();
    c.restore();
  };

  /* ================= underwater worlds ================= */
  const bgCache = {};
  function hills(g, rng, y0, amp, colr, step = 40) {
    g.fillStyle = colr; g.beginPath(); g.moveTo(0, H);
    let y = y0;
    for (let x = 0; x <= W + step; x += step) { y = U.clamp(y + (rng() - 0.5) * amp, y0 - amp, y0 + amp); g.lineTo(x, y); }
    g.lineTo(W, H); g.closePath(); g.fill();
  }
  function coral(g, rng, x, y, len, ang, w, colr, depth) {
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    g.strokeStyle = colr; g.lineWidth = w; g.lineCap = "round";
    g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    if (depth <= 0) { g.fillStyle = mix(colr, 0.3); g.beginPath(); g.arc(x2, y2, w * 0.7, 0, TAU); g.fill(); return; }
    const n = 2;
    for (let i = 0; i < n; i++) coral(g, rng, x2, y2, len * (0.6 + rng() * 0.25), ang + (i ? 1 : -1) * (0.3 + rng() * 0.4), w * 0.75, colr, depth - 1);
  }
  function fan(g, x, y, r, colr) {
    g.save(); g.translate(x, y);
    g.fillStyle = colr; g.globalAlpha = 0.8;
    g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, Math.PI * 1.1, Math.PI * 1.9); g.closePath(); g.fill();
    g.globalAlpha = 1; g.strokeStyle = mix(colr, -0.3); g.lineWidth = 2;
    for (let i = 0; i <= 8; i++) { const a = Math.PI * 1.1 + (i / 8) * Math.PI * 0.8; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); g.stroke(); }
    for (let k = 1; k <= 3; k++) { g.beginPath(); g.arc(0, 0, (r * k) / 3.4, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    g.restore();
  }
  function starfish(g, x, y, r, a, colr) {
    g.save(); g.translate(x, y); g.rotate(a);
    g.beginPath();
    for (let i = 0; i < 10; i++) { const b = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r; g.lineTo(Math.cos(b) * rr, Math.sin(b) * rr); }
    g.closePath(); g.fillStyle = colr; g.fill(); g.lineWidth = 2; g.strokeStyle = mix(colr, -0.4); g.stroke();
    g.restore();
  }
  function column(g, x, y, w, h, colr, broken) {
    g.fillStyle = colr; g.strokeStyle = mix(colr, -0.35); g.lineWidth = 2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h);
    if (broken) { g.lineTo(x + w * 0.3, y - h - 14); g.lineTo(x + w * 0.55, y - h + 6); g.lineTo(x + w, y - h - 8); }
    else { g.lineTo(x + w, y - h); }
    g.lineTo(x + w, y); g.closePath(); g.fill(); g.stroke();
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x + (w * i) / 4, y - 4); g.lineTo(x + (w * i) / 4, y - h + 8); g.stroke(); }
    g.fillRect(x - 8, y - 12, w + 16, 12); g.strokeRect(x - 8, y - 12, w + 16, 12);
    if (!broken) { g.fillRect(x - 8, y - h - 12, w + 16, 12); g.strokeRect(x - 8, y - h - 12, w + 16, 12); }
  }
  function bgStatic(w) {
    const cv = canvas(W, H), g = cv.getContext("2d"), rng = U.rng(w.id.length * 99 + 3);
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, w.sky[0]); gr.addColorStop(1, w.sky[1]);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // the light falls in from above
    const lg = g.createRadialGradient(W / 2, -200, 50, W / 2, -200, 900);
    lg.addColorStop(0, "rgba(255,255,255,0.25)"); lg.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    hills(g, rng, 560, 30, mix(w.sky[1], -0.25), 60);
    if (w.deco === "ruins") {
      g.globalAlpha = 0.45;
      for (const [x, h, b] of [[90, 260, 0], [210, 180, 1], [1010, 300, 0], [1150, 210, 1], [640, 140, 1]]) column(g, x, 640, 48, h, "#8a9ab0", b);
      // an arch in the distance
      g.fillStyle = "#7a8aa0"; g.beginPath(); g.moveTo(420, 640); g.lineTo(420, 470); g.arc(560, 470, 140, Math.PI, 0); g.lineTo(700, 640); g.lineTo(650, 640); g.lineTo(650, 470); g.arc(560, 470, 90, 0, Math.PI, true); g.lineTo(470, 640); g.closePath(); g.fill();
      g.globalAlpha = 1;
    }
    hills(g, rng, 640, 18, mix(w.sand, -0.3), 50);
    // sand with ripples
    g.fillStyle = w.sand; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) g.lineTo(x, 672 + Math.sin(x * 0.01) * 10 + Math.sin(x * 0.037) * 5);
    g.lineTo(W, H); g.closePath(); g.fill();
    g.strokeStyle = mix(w.sand, -0.18); g.lineWidth = 2;
    for (let i = 0; i < 18; i++) { const x = rng() * W, y = 690 + rng() * 26; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 20, y - 5, x + 40, y); g.stroke(); }
    if (w.deco === "coral") {
      const cols = ["#ff7a8a", "#ff9a5a", "#c87ae8", "#ff5a9a"];
      for (const [x, s] of [[60, 1], [190, 0.7], [1120, 1.1], [1230, 0.8], [900, 0.6], [380, 0.6]]) coral(g, rng, x, 690, 60 * s, -Math.PI / 2 + (rng() - 0.5) * 0.4, 14 * s, U.pick(cols), 3);
      fan(g, 300, 700, 90, "#ff8a6a"); fan(g, 1000, 705, 110, "#c87ae8"); fan(g, 640, 712, 70, "#ffb05a");
      for (let i = 0; i < 6; i++) starfish(g, 80 + rng() * 1120, 690 + rng() * 20, 12 + rng() * 6, rng() * TAU, U.pick(["#ff7a4a", "#ffb03a", "#ff5a7a"]));
    } else if (w.deco === "kelp") {
      g.fillStyle = "#4a5a3a";
      for (const [x, r] of [[140, 70], [520, 45], [930, 60], [1210, 80]]) { g.beginPath(); g.ellipse(x, 700, r, r * 0.55, 0, Math.PI, 0); g.fill(); }
    } else if (w.deco === "ruins") {
      column(g, 30, 712, 56, 190, "#b8b0a0", 1); column(g, 1190, 712, 56, 250, "#b8b0a0", 0);
      // fallen blocks and a mosaic floor
      for (let i = 0; i < 12; i++) { const x = 160 + i * 84, y = 698 + (i % 2) * 6; g.fillStyle = i % 3 ? "#c8b898" : "#4a8ab0"; g.fillRect(x, y, 70, 12); g.strokeStyle = "#5e5246"; g.strokeRect(x, y, 70, 12); }
      g.fillStyle = "#a89a88"; g.save(); g.translate(260, 676); g.rotate(-0.25); g.fillRect(-40, -18, 80, 36); g.restore();
    } else if (w.deco === "abyss") {
      g.fillStyle = "#0a0e1a";
      for (const [x, r] of [[100, 120], [380, 70], [900, 90], [1200, 130]]) { g.beginPath(); g.ellipse(x, 720, r, r * 0.9, 0, Math.PI, 0); g.fill(); }
      // glowing crystals
      for (const [x, y, h] of [[90, 640, 40], [120, 650, 28], [1180, 630, 50], [1215, 645, 30], [900, 660, 26]]) {
        g.save(); g.shadowColor = "#6ad8ff"; g.shadowBlur = 18;
        g.fillStyle = "#7ae0ff"; g.beginPath(); g.moveTo(x, y + h * 0.4); g.lineTo(x + 7, y - h); g.lineTo(x + 14, y + h * 0.4); g.closePath(); g.fill(); g.restore();
      }
    }
    return cv;
  }
  // moving parts: light rays, swaying kelp, fish, jellyfish, bubbles
  const bubbles = [];
  for (let i = 0; i < 40; i++) bubbles.push({ x: Math.random() * W, y: Math.random() * H, r: U.rand(1.5, 5), v: U.rand(25, 60), p: Math.random() * TAU });
  const fish = [];
  for (let i = 0; i < 7; i++) fish.push({ y: U.rand(60, 560), v: U.rand(18, 45) * (i % 2 ? 1 : -1), x: Math.random() * W, s: U.rand(0.5, 1), c: U.pick(["#1a5a7a", "#2a6a8a", "#164a66"]) });
  S.world = function (c, w, t, opt = {}) {
    if (!bgCache[w.id]) bgCache[w.id] = bgStatic(w);
    c.drawImage(bgCache[w.id], 0, 0);
    const dark = w.deco === "abyss";
    // light rays
    c.save(); c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 6; i++) {
      const x = 120 + i * 220 + Math.sin(t * 0.3 + i * 1.7) * 50, a = (dark ? 0.02 : 0.06) + 0.03 * Math.sin(t * 0.7 + i);
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `rgba(255,255,240,${a})`); g.addColorStop(1, "rgba(255,255,240,0)");
      c.fillStyle = g; c.beginPath(); c.moveTo(x - 30, 0); c.lineTo(x + 40, 0); c.lineTo(x + 180, H); c.lineTo(x + 40, H); c.closePath(); c.fill();
    }
    c.restore();
    // fish far away
    if (!dark) {
      c.save(); c.globalAlpha = 0.35;
      for (const f of fish) {
        const x = ((f.x + t * f.v) % (W + 200) + W + 200) % (W + 200) - 100;
        c.save(); c.translate(x, f.y + Math.sin(t + f.y) * 8); c.scale(f.s * Math.sign(f.v), f.s);
        c.fillStyle = f.c; c.beginPath(); c.ellipse(0, 0, 22, 9, 0, 0, TAU); c.fill();
        c.beginPath(); c.moveTo(-18, 0); c.lineTo(-32, -9 + Math.sin(t * 8) * 2); c.lineTo(-32, 9 + Math.sin(t * 8) * 2); c.closePath(); c.fill();
        c.restore();
      }
      c.restore();
    }
    if (w.deco === "kelp") {
      for (let k = 0; k < 9; k++) {
        const x0 = [40, 110, 300, 470, 620, 800, 980, 1160, 1240][k], h = 360 + (k * 53) % 200;
        c.strokeStyle = k % 2 ? "#3e7a3a" : "#5a9a3a"; c.lineWidth = 9; c.lineCap = "round";
        c.beginPath(); c.moveTo(x0, 720);
        let px = x0, py = 720;
        for (let i = 1; i <= 8; i++) {
          const y = 720 - (h * i) / 8, x = x0 + Math.sin(t * 0.9 + k + i * 0.45) * i * 4;
          c.quadraticCurveTo(px, (py + y) / 2, x, y); px = x; py = y;
          if (i % 2 === 0) { c.save(); c.fillStyle = c.strokeStyle; c.beginPath(); c.ellipse(x + (i % 4 ? 12 : -12), y, 14, 5, (i % 4 ? 0.5 : -0.5), 0, TAU); c.fill(); c.restore(); }
        }
        c.stroke();
      }
    }
    if (dark) {
      for (let i = 0; i < 5; i++) {
        const x = (i * 290 + Math.sin(t * 0.2 + i) * 60 + 80) % W, y = 120 + ((i * 170 - t * 12) % 560 + 560) % 560;
        c.save(); c.translate(x, y); c.globalAlpha = 0.5;
        c.shadowColor = "#b080ff"; c.shadowBlur = 20;
        c.fillStyle = "rgba(190,140,255,0.7)"; c.beginPath(); c.arc(0, 0, 16, Math.PI, 0); c.closePath(); c.fill();
        c.shadowBlur = 0; c.strokeStyle = "rgba(190,140,255,0.6)"; c.lineWidth = 2;
        for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * 6, 0); c.quadraticCurveTo(k * 6 + Math.sin(t * 3 + k) * 6, 16, k * 6, 30); c.stroke(); }
        c.restore();
      }
      c.fillStyle = "rgba(140,220,255,0.7)";
      for (let i = 0; i < 30; i++) { const x = (i * 97 + Math.sin(t * 0.5 + i) * 20) % W, y = (i * 61 + t * 6) % H; c.globalAlpha = 0.3 + 0.3 * Math.sin(t * 2 + i); c.fillRect(x, y, 2, 2); }
      c.globalAlpha = 1;
    }
    if (!opt.noBubbles) {
      c.strokeStyle = "rgba(255,255,255,0.45)"; c.lineWidth = 1.5;
      for (const b of bubbles) {
        const y = ((b.y - t * b.v) % (H + 20) + H + 20) % (H + 20) - 10, x = b.x + Math.sin(t * 2 + b.p) * 6;
        c.beginPath(); c.arc(x, y, b.r, 0, TAU); c.stroke();
      }
    }
  };

  /* ================= the grooves of a level ================= */
  const trackCache = { idx: -1, cv: null };
  S.tracks = function (c, s) {
    if (trackCache.idx !== s.idx || trackCache.cv === null) {
      const cv = canvas(W, H), g = cv.getContext("2d"), w = s.world;
      g.lineJoin = "round"; g.lineCap = "round";
      const pass = (lw, st) => {
        for (const tr of s.tracks) {
          const p = tr.path;
          g.beginPath(); g.moveTo(p.xs[0], p.ys[0]);
          for (let i = 3; i < p.xs.length; i += 3) g.lineTo(p.xs[i], p.ys[i]);
          g.lineTo(p.xs[p.xs.length - 1], p.ys[p.ys.length - 1]);
          g.lineWidth = lw; g.strokeStyle = st; g.stroke();
        }
      };
      g.save(); g.translate(3, 6); pass(54, "rgba(0,20,40,0.35)"); g.restore();
      pass(54, "#0b2a3a");
      pass(48, w.groove[1]);
      pass(40, w.groove[0]);
      pass(32, mix(w.groove[1], -0.3));
      g.save(); g.translate(0, 2); pass(26, mix(w.groove[1], -0.15)); g.restore();
      // tiny dots along the groove as a trail
      g.fillStyle = "rgba(255,255,255,0.12)";
      for (const tr of s.tracks) { const p = tr.path; for (let i = 0; i < p.xs.length; i += 20) { g.beginPath(); g.arc(p.xs[i], p.ys[i], 2, 0, TAU); g.fill(); } }
      for (const tr of s.tracks) {
        const p = tr.path, x0 = p.xs[0], y0 = p.ys[0];
        if (x0 > 0 && x0 < W && y0 > 0 && y0 < H) S.spout(g, x0, y0, Math.atan2(p.ys[4] - y0, p.xs[4] - x0));
      }
      trackCache.idx = s.idx; trackCache.cv = cv;
    }
    c.drawImage(trackCache.cv, 0, 0);
  };
  S.resetTracks = () => { trackCache.idx = -1; trackCache.cv = null; };
})(window.PP);
