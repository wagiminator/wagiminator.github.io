/* X-Abyss: procedurally drawn sprites, underwater backgrounds, particles and explosions */
"use strict";

(function (XA) {
  const U = XA.U, W = U.W, H = U.H, TAU = U.TAU;
  const Gfx = (XA.Gfx = { spr: {}, white: {} });
  const S = 2; // sprite supersampling

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
  const ell = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); };
  const circ = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, TAU); };
  const poly = (g, pts) => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); };
  function lamp(g, x, y, r, rgb) {
    g.fillStyle = rad(g, x, y, 0, r * 2.4, [[0, `rgba(${rgb},0.9)`], [0.35, `rgba(${rgb},0.35)`], [1, `rgba(${rgb},0)`]]);
    circ(g, x, y, r * 2.4); g.fill();
    g.fillStyle = rad(g, x - r * 0.3, y - r * 0.3, 0, r, [[0, "#fff"], [0.5, `rgb(${rgb})`], [1, `rgba(${rgb},0.8)`]]);
    circ(g, x, y, r); g.fill();
  }
  Gfx.lamp = lamp;

  /* ---------- Glow sprites ---------- */
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
  Gfx.smoke = (function () {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d");
    g.fillStyle = rad(g, 32, 32, 0, 32, [[0, "rgba(50,60,72,0.4)"], [0.6, "rgba(40,48,58,0.18)"], [1, "rgba(20,24,30,0)"]]);
    g.fillRect(0, 0, 64, 64);
    return c;
  })();

  /* ---------- Sprites ---------- */
  const DEF = {};

  DEF.ship = () => mk(96, 48, (g) => {
    // fins
    g.fillStyle = lin(g, 0, 0, 0, 14, [[0, "#9fb3c7"], [1, "#2d3a4a"]]);
    poly(g, [34, 12, 50, 1, 60, 2, 56, 13]); g.fill();
    g.fillStyle = lin(g, 0, 34, 0, 47, [[0, "#3c4b5e"], [1, "#151c25"]]);
    poly(g, [32, 36, 44, 47, 56, 47, 52, 35]); g.fill();
    // hull
    g.beginPath();
    g.moveTo(95, 25); g.bezierCurveTo(82, 11, 52, 8, 26, 11); g.lineTo(8, 15); g.lineTo(6, 33); g.lineTo(26, 38);
    g.bezierCurveTo(52, 41, 82, 37, 95, 25); g.closePath();
    g.fillStyle = lin(g, 0, 9, 0, 40, [[0, "#f4f8fc"], [0.18, "#c9d6e3"], [0.5, "#7d90a6"], [0.8, "#36455a"], [1, "#19212c"]]);
    g.fill();
    g.strokeStyle = "rgba(10,16,24,0.7)"; g.lineWidth = 1; g.stroke();
    // stripe
    g.fillStyle = lin(g, 20, 0, 90, 0, [[0, "#ff6a1a"], [1, "#ffb347"]]);
    poly(g, [24, 27, 84, 27, 90, 25, 84, 30, 24, 31]); g.fill();
    // panel lines
    g.strokeStyle = "rgba(20,30,45,0.55)"; g.lineWidth = 0.8;
    for (const x of [30, 44, 74]) { g.beginPath(); g.moveTo(x, 12 + (x > 60 ? 3 : 0)); g.lineTo(x, 37); g.stroke(); }
    // cockpit
    ell(g, 64, 19, 14, 6.5);
    g.fillStyle = lin(g, 0, 13, 0, 26, [[0, "#d9fbff"], [0.35, "#45d4ff"], [1, "#06324f"]]); g.fill();
    g.strokeStyle = "rgba(0,20,40,0.8)"; g.stroke();
    g.fillStyle = "rgba(255,255,255,0.75)"; ell(g, 60, 16.5, 7, 2); g.fill();
    // cannon
    g.fillStyle = lin(g, 0, 31, 0, 36, [[0, "#cfd8e2"], [1, "#3b4655"]]);
    g.fillRect(70, 31, 20, 4);
    // engine
    g.fillStyle = "#1a2029"; g.fillRect(1, 17, 9, 14);
    g.fillStyle = rad(g, 4, 24, 0, 8, [[0, "#e6fdff"], [0.4, "#4fd8ff"], [1, "rgba(0,80,140,0)"]]); g.fillRect(0, 17, 8, 14);
  });

  DEF.pod = () => mk(30, 30, (g) => {
    g.fillStyle = lin(g, 0, 2, 0, 28, [[0, "#e8eef5"], [0.5, "#71849a"], [1, "#1e2733"]]);
    circ(g, 15, 15, 12); g.fill();
    g.fillStyle = "#0e1620"; circ(g, 15, 15, 7.5); g.fill();
    lamp(g, 15, 15, 4.5, "80,220,255");
    g.strokeStyle = "rgba(255,255,255,0.4)"; g.lineWidth = 1; g.beginPath(); g.arc(15, 15, 10.5, 3.6, 5.2); g.stroke();
    g.fillStyle = "#c8d3df"; g.fillRect(24, 13.5, 6, 3);
  });

  DEF.fish = () => mk(52, 34, (g) => {
    g.fillStyle = lin(g, 38, 0, 52, 0, [[0, "#ff8a2a"], [1, "#9e2c0e"]]);
    poly(g, [37, 17, 51, 4, 46, 17, 51, 30]); g.fill();
    g.fillStyle = "#b8401a"; poly(g, [16, 8, 25, 1, 31, 8]); g.fill();
    g.beginPath(); g.moveTo(3, 18); g.bezierCurveTo(8, 5, 29, 3, 40, 13); g.lineTo(40, 21); g.bezierCurveTo(29, 31, 8, 30, 3, 18); g.closePath();
    g.fillStyle = lin(g, 0, 4, 0, 30, [[0, "#ffe08a"], [0.35, "#ff9a35"], [0.75, "#c2441a"], [1, "#5c1606"]]); g.fill();
    g.strokeStyle = "rgba(60,10,0,0.6)"; g.lineWidth = 1; g.stroke();
    g.strokeStyle = "rgba(90,20,0,0.5)";
    for (const x of [20, 27, 33]) { g.beginPath(); g.arc(x - 6, 18, 11, -0.9, 0.9); g.stroke(); }
    g.fillStyle = "#3a0d03"; g.fillRect(4, 19, 7, 1.5);
    lamp(g, 11, 14, 3, "255,240,90");
  });

  DEF.dart = () => mk(60, 20, (g) => {
    g.fillStyle = "#5c0f17"; poly(g, [44, 10, 58, 1, 55, 10, 58, 19]); g.fill();
    g.beginPath(); g.moveTo(2, 10); g.quadraticCurveTo(10, 3, 26, 3.5); g.lineTo(50, 6); g.lineTo(50, 14); g.lineTo(26, 16.5); g.quadraticCurveTo(10, 17, 2, 10); g.closePath();
    g.fillStyle = lin(g, 0, 3, 0, 17, [[0, "#ffd1d1"], [0.3, "#e0303f"], [0.8, "#6a0d18"], [1, "#2a0408"]]); g.fill();
    g.fillStyle = "#f5f5f5"; g.fillRect(20, 4.5, 3, 11); g.fillRect(27, 4.6, 2, 10.8);
    lamp(g, 9, 9.5, 2.2, "255,255,160");
  });

  DEF.jelly = () => mk(54, 44, (g) => {
    g.beginPath(); g.moveTo(3, 34); g.bezierCurveTo(3, 4, 51, 4, 51, 34); g.quadraticCurveTo(45, 30, 40, 35); g.quadraticCurveTo(33, 30, 27, 35); g.quadraticCurveTo(21, 30, 14, 35); g.quadraticCurveTo(9, 30, 3, 34); g.closePath();
    g.fillStyle = rad(g, 27, 18, 2, 30, [[0, "rgba(255,200,255,0.95)"], [0.45, "rgba(200,90,255,0.75)"], [1, "rgba(90,20,160,0.6)"]]); g.fill();
    g.strokeStyle = "rgba(255,210,255,0.8)"; g.lineWidth = 1.2; g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 1;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(27, 10); g.quadraticCurveTo(10 + i * 8.5, 16, 8 + i * 9.5, 31); g.stroke(); }
    lamp(g, 27, 19, 4, "255,120,255");
  });

  DEF.mine = () => mk(46, 46, (g) => {
    g.strokeStyle = "#2a3038"; g.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      g.beginPath(); g.moveTo(23 + Math.cos(a) * 12, 23 + Math.sin(a) * 12); g.lineTo(23 + Math.cos(a) * 21, 23 + Math.sin(a) * 21); g.stroke();
      g.fillStyle = "#8b96a3"; circ(g, 23 + Math.cos(a) * 21, 23 + Math.sin(a) * 21, 2.6); g.fill();
    }
    g.fillStyle = rad(g, 18, 17, 1, 17, [[0, "#9aa6b4"], [0.5, "#465260"], [1, "#151a20"]]);
    circ(g, 23, 23, 15); g.fill();
    g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 1; g.beginPath(); g.arc(23, 23, 15, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(8, 23); g.lineTo(38, 23); g.stroke();
  });

  DEF.turret = () => mk(48, 28, (g) => {
    g.fillStyle = lin(g, 0, 4, 0, 28, [[0, "#c7d0db"], [0.4, "#6a7787"], [1, "#1c232c"]]);
    g.beginPath(); g.moveTo(2, 27); g.lineTo(6, 14); g.quadraticCurveTo(24, -2, 42, 14); g.lineTo(46, 27); g.closePath(); g.fill();
    g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 1; g.stroke();
    g.fillStyle = "#222b35"; g.fillRect(4, 21, 40, 6);
    for (let i = 0; i < 4; i++) lamp(g, 9 + i * 10, 24, 1.3, "255,80,60");
  });

  DEF.crab = () => mk(68, 44, (g) => {
    g.strokeStyle = "#7a2410"; g.lineWidth = 3.5;
    for (let i = 0; i < 3; i++) {
      g.beginPath(); g.moveTo(22 + i * 10, 28); g.lineTo(14 + i * 12, 36); g.lineTo(10 + i * 14, 44); g.stroke();
    }
    g.fillStyle = lin(g, 0, 0, 0, 20, [[0, "#ffb07a"], [1, "#9a2b10"]]);
    ell(g, 10, 14, 9, 6, -0.5); g.fill();
    g.fillStyle = "#4a1205"; poly(g, [2, 10, 9, 14, 2, 16]); g.fill();
    g.beginPath(); g.moveTo(10, 30); g.bezierCurveTo(10, 8, 60, 6, 62, 30); g.closePath();
    g.fillStyle = lin(g, 0, 8, 0, 31, [[0, "#ffc08a"], [0.35, "#e2582a"], [1, "#6a1a08"]]); g.fill();
    g.strokeStyle = "rgba(60,10,0,0.7)"; g.lineWidth = 1; g.stroke();
    g.fillStyle = "rgba(255,255,255,0.25)"; ell(g, 30, 15, 12, 3, -0.15); g.fill();
    lamp(g, 22, 16, 2.4, "120,255,200"); lamp(g, 31, 14, 2.4, "120,255,200");
  });

  DEF.sub = () => mk(150, 60, (g) => {
    g.fillStyle = lin(g, 0, 0, 0, 22, [[0, "#9aa4b0"], [1, "#2a323c"]]);
    g.beginPath(); g.moveTo(58, 22); g.lineTo(64, 4); g.lineTo(92, 4); g.lineTo(100, 22); g.closePath(); g.fill();
    g.fillStyle = "#1a2028"; g.fillRect(66, 9, 22, 3);
    g.fillStyle = "#2a323c"; poly(g, [126, 30, 146, 12, 148, 16, 136, 30, 148, 44, 146, 48]); g.fill();
    g.beginPath(); g.moveTo(4, 32); g.bezierCurveTo(8, 18, 30, 17, 60, 18); g.lineTo(122, 20); g.quadraticCurveTo(140, 30, 122, 42); g.lineTo(60, 44); g.bezierCurveTo(30, 45, 8, 44, 4, 32); g.closePath();
    g.fillStyle = lin(g, 0, 17, 0, 45, [[0, "#b8c2cc"], [0.25, "#6b7684"], [0.7, "#2b333d"], [1, "#11161c"]]); g.fill();
    g.strokeStyle = "rgba(0,0,0,0.6)"; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = "#8a1a14"; g.fillRect(20, 36, 100, 4);
    g.strokeStyle = "rgba(0,0,0,0.4)"; g.lineWidth = 0.8;
    for (let x = 30; x < 120; x += 16) { g.beginPath(); g.moveTo(x, 20); g.lineTo(x, 43); g.stroke(); }
    for (let i = 0; i < 4; i++) lamp(g, 36 + i * 18, 28, 2.4, "255,200,80");
    g.fillStyle = "#11161c"; circ(g, 10, 31, 4); g.fill(); lamp(g, 10, 31, 2, "255,60,40");
  });

  DEF.torp = () => mk(36, 14, (g) => {
    g.fillStyle = "#222"; poly(g, [28, 7, 35, 1, 35, 13]); g.fill();
    g.beginPath(); g.moveTo(2, 7); g.quadraticCurveTo(4, 2, 12, 2); g.lineTo(30, 3); g.lineTo(30, 11); g.lineTo(12, 12); g.quadraticCurveTo(4, 12, 2, 7); g.closePath();
    g.fillStyle = lin(g, 0, 2, 0, 12, [[0, "#9aa4b0"], [0.5, "#3b434d"], [1, "#11161c"]]); g.fill();
    lamp(g, 4, 7, 2, "255,50,40");
  });

  DEF.squid = () => mk(58, 44, (g) => {
    g.strokeStyle = "#c2407a"; g.lineWidth = 3;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(20, 16 + i * 3); g.bezierCurveTo(12, 10 + i * 6, 8, 18 + i * 5, 1, 8 + i * 7); g.stroke(); }
    g.beginPath(); g.moveTo(16, 22); g.bezierCurveTo(22, 4, 44, 6, 57, 22); g.bezierCurveTo(44, 38, 22, 40, 16, 22); g.closePath();
    g.fillStyle = lin(g, 0, 6, 0, 38, [[0, "#ffd0e6"], [0.4, "#ff5aa0"], [1, "#6a1038"]]); g.fill();
    g.strokeStyle = "rgba(80,0,40,0.6)"; g.lineWidth = 1; g.stroke();
    g.fillStyle = "#ff8fc0"; poly(g, [44, 14, 56, 6, 52, 18]); g.fill(); poly(g, [44, 30, 56, 38, 52, 26]); g.fill();
    lamp(g, 26, 18, 2.6, "255,255,180"); lamp(g, 26, 26, 2.6, "255,255,180");
  });

  DEF.orb = () => mk(32, 32, (g) => {
    g.fillStyle = lin(g, 0, 2, 0, 30, [[0, "#d8e2ea"], [0.5, "#4b5a68"], [1, "#141b22"]]);
    circ(g, 16, 16, 13); g.fill();
    g.fillStyle = "#081008"; circ(g, 16, 16, 8.5); g.fill();
    lamp(g, 16, 16, 6, "90,255,120");
    g.strokeStyle = "rgba(255,255,255,0.5)"; g.lineWidth = 1; g.beginPath(); g.arc(16, 16, 11.5, 3.7, 5.1); g.stroke();
  });

  DEF.eel = () => mk(36, 28, (g) => {
    ell(g, 18, 14, 16, 11);
    g.fillStyle = lin(g, 0, 3, 0, 25, [[0, "#9ff5e0"], [0.4, "#1c9c8a"], [1, "#062a2a"]]); g.fill();
    g.strokeStyle = "rgba(0,30,30,0.7)"; g.lineWidth = 1; g.stroke();
    g.fillStyle = "rgba(160,255,240,0.9)"; g.fillRect(9, 12.5, 18, 3);
    g.fillStyle = "#0b4a44"; poly(g, [12, 4, 18, -2, 24, 4]); g.fill();
  });
  DEF.eelhead = () => mk(50, 34, (g) => {
    g.beginPath(); g.moveTo(2, 17); g.bezierCurveTo(4, 4, 30, 2, 48, 10); g.lineTo(48, 24); g.bezierCurveTo(30, 32, 4, 30, 2, 17); g.closePath();
    g.fillStyle = lin(g, 0, 3, 0, 31, [[0, "#b5fff0"], [0.4, "#1fa894"], [1, "#05302c"]]); g.fill();
    g.strokeStyle = "rgba(0,30,30,0.7)"; g.lineWidth = 1; g.stroke();
    g.fillStyle = "#031a18"; poly(g, [2, 18, 16, 16, 16, 21]); g.fill();
    g.fillStyle = "#fff"; for (let i = 0; i < 4; i++) poly(g, [4 + i * 3, 17, 5.5 + i * 3, 19.5, 7 + i * 3, 17]); g.fill();
    lamp(g, 14, 11, 3, "255,60,60");
  });

  DEF.carrier = () => mk(72, 42, (g) => {
    g.beginPath(); g.moveTo(6, 21); g.bezierCurveTo(6, 4, 66, 4, 66, 21); g.bezierCurveTo(66, 38, 6, 38, 6, 21); g.closePath();
    g.fillStyle = lin(g, 0, 6, 0, 36, [[0, "#fff1a0"], [0.4, "#e8b81a"], [1, "#5a4204"]]); g.fill();
    g.save(); g.clip();
    g.fillStyle = "rgba(20,20,20,0.85)";
    for (let x = -10; x < 80; x += 14) poly(g, [x, 40, x + 7, 40, x + 19, 2, x + 12, 2]);
    g.fill(); g.restore();
    g.strokeStyle = "rgba(60,40,0,0.8)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(6, 21); g.bezierCurveTo(6, 4, 66, 4, 66, 21); g.bezierCurveTo(66, 38, 6, 38, 6, 21); g.stroke();
    g.fillStyle = "#0b1218"; ell(g, 36, 21, 13, 9); g.fill();
    lamp(g, 36, 21, 6, "120,255,255");
  });

  DEF.urchin = () => mk(52, 52, (g) => {
    g.strokeStyle = "#e6a8ff"; g.lineWidth = 2;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU, l = i % 2 ? 24 : 19;
      g.beginPath(); g.moveTo(26 + Math.cos(a) * 10, 26 + Math.sin(a) * 10); g.lineTo(26 + Math.cos(a) * l, 26 + Math.sin(a) * l); g.stroke();
    }
    g.fillStyle = rad(g, 22, 21, 1, 15, [[0, "#ffd0ff"], [0.5, "#9a3ad0"], [1, "#2c0846"]]);
    circ(g, 26, 26, 13); g.fill();
    lamp(g, 26, 26, 3.4, "255,240,120");
  });

  DEF.drone = () => mk(30, 20, (g) => {
    g.beginPath(); g.moveTo(2, 10); g.bezierCurveTo(6, 1, 22, 1, 28, 6); g.lineTo(24, 10); g.lineTo(28, 14); g.bezierCurveTo(22, 19, 6, 19, 2, 10); g.closePath();
    g.fillStyle = lin(g, 0, 1, 0, 19, [[0, "#ffc0f0"], [0.5, "#c02a9a"], [1, "#3a0430"]]); g.fill();
    lamp(g, 8, 10, 2.5, "255,255,140");
  });

  DEF.hivepod = () => mk(60, 52, (g) => {
    g.beginPath(); g.moveTo(4, 50); g.bezierCurveTo(-2, 10, 62, 10, 56, 50); g.closePath();
    g.fillStyle = rad(g, 30, 30, 2, 34, [[0, "#ff9ae8"], [0.5, "#8a1f7a"], [1, "#2a0628"]]); g.fill();
    g.strokeStyle = "rgba(255,150,240,0.5)"; g.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(10 + i * 12, 50); g.quadraticCurveTo(18 + i * 8, 26, 30, 16); g.stroke(); }
    g.fillStyle = "#14000f"; ell(g, 30, 20, 9, 6); g.fill();
    lamp(g, 30, 21, 4, "255,220,120");
  });

  DEF.guard = () => mk(40, 40, (g) => {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      g.fillStyle = "#5a1a6a"; poly(g, [20 + Math.cos(a - 0.3) * 13, 20 + Math.sin(a - 0.3) * 13, 20 + Math.cos(a) * 20, 20 + Math.sin(a) * 20, 20 + Math.cos(a + 0.3) * 13, 20 + Math.sin(a + 0.3) * 13]); g.fill();
    }
    g.fillStyle = rad(g, 16, 15, 1, 15, [[0, "#f0b0ff"], [0.5, "#8a2ab0"], [1, "#22062e"]]);
    circ(g, 20, 20, 14); g.fill();
    g.fillStyle = "#100010"; ell(g, 20, 20, 7, 9); g.fill();
    lamp(g, 20, 20, 4, "255,80,80");
  });

  // Bullets and pickups
  DEF.b_pulse = () => mk(34, 12, (g) => {
    g.fillStyle = rad(g, 22, 6, 0, 16, [[0, "rgba(120,240,255,0.9)"], [1, "rgba(0,140,255,0)"]]); g.fillRect(0, 0, 34, 12);
    g.fillStyle = lin(g, 0, 0, 34, 0, [[0, "rgba(80,220,255,0)"], [0.5, "#7ff0ff"], [1, "#ffffff"]]);
    ell(g, 21, 6, 12, 2.6); g.fill();
  });
  DEF.b_spread = () => mk(18, 18, (g) => {
    g.fillStyle = rad(g, 9, 9, 0, 9, [[0, "#fff"], [0.3, "#ffd060"], [0.6, "rgba(255,130,20,0.6)"], [1, "rgba(255,80,0,0)"]]); g.fillRect(0, 0, 18, 18);
  });
  DEF.b_wave = () => mk(26, 26, (g) => {
    g.fillStyle = rad(g, 13, 13, 0, 13, [[0, "#fff"], [0.25, "#ff9cf0"], [0.55, "rgba(230,60,255,0.6)"], [1, "rgba(160,0,255,0)"]]); g.fillRect(0, 0, 26, 26);
  });
  DEF.b_missile = () => mk(24, 10, (g) => {
    g.fillStyle = "#d8e0e8"; poly(g, [2, 3, 18, 3, 23, 5, 18, 7, 2, 7]); g.fill();
    g.fillStyle = "#ff4a3a"; g.fillRect(16, 3, 3, 4);
    g.fillStyle = "#6a7480"; poly(g, [2, 1, 7, 3, 2, 3]); g.fill(); poly(g, [2, 9, 7, 7, 2, 7]); g.fill();
  });
  DEF.b_depth = () => mk(16, 16, (g) => {
    g.fillStyle = lin(g, 0, 2, 0, 14, [[0, "#ffe08a"], [1, "#6a4a08"]]); circ(g, 8, 8, 6); g.fill();
    lamp(g, 8, 8, 2, "255,80,40");
  });
  DEF.e_orb = () => mk(20, 20, (g) => {
    g.fillStyle = rad(g, 10, 10, 0, 10, [[0, "#ffffff"], [0.28, "#ff7a9a"], [0.6, "rgba(255,30,80,0.55)"], [1, "rgba(255,0,60,0)"]]); g.fillRect(0, 0, 20, 20);
  });
  DEF.e_fire = () => mk(24, 24, (g) => {
    g.fillStyle = rad(g, 12, 12, 0, 12, [[0, "#fffbe0"], [0.3, "#ffb030"], [0.65, "rgba(255,70,0,0.55)"], [1, "rgba(255,40,0,0)"]]); g.fillRect(0, 0, 24, 24);
  });
  DEF.e_green = () => mk(24, 24, (g) => {
    g.fillStyle = rad(g, 12, 12, 0, 12, [[0, "#ffffff"], [0.3, "#a0ffb0"], [0.65, "rgba(40,255,140,0.5)"], [1, "rgba(0,255,120,0)"]]); g.fillRect(0, 0, 24, 24);
  });
  DEF.e_violet = () => mk(20, 20, (g) => {
    g.fillStyle = rad(g, 10, 10, 0, 10, [[0, "#ffffff"], [0.3, "#e0a0ff"], [0.65, "rgba(200,60,255,0.55)"], [1, "rgba(160,0,255,0)"]]); g.fillRect(0, 0, 20, 20);
  });
  function capsule(letter, c1, c2, glow) {
    return () => mk(30, 30, (g) => {
      g.fillStyle = rad(g, 15, 15, 0, 15, [[0, `rgba(${glow},0.6)`], [1, `rgba(${glow},0)`]]); g.fillRect(0, 0, 30, 30);
      g.fillStyle = lin(g, 0, 5, 0, 25, [[0, c1], [1, c2]]);
      g.beginPath(); g.roundRect(5, 7, 20, 16, 7); g.fill();
      g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 1.2; g.stroke();
      g.fillStyle = "#fff"; g.font = "bold 12px Orbitron, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(letter, 15, 15.5);
    });
  }
  DEF.p_energy = capsule("E", "#7dffa0", "#0e7a3a", "80,255,140");
  DEF.p_power = capsule("P", "#ffc070", "#b04a08", "255,160,60");
  DEF.p_nova = capsule("N", "#f0f0ff", "#5a5aa0", "200,200,255");
  DEF.p_pod = capsule("S", "#80e8ff", "#0a5a8a", "80,200,255");
  DEF.p_gem = () => mk(22, 22, (g) => {
    g.fillStyle = rad(g, 11, 11, 0, 11, [[0, "rgba(120,255,255,0.7)"], [1, "rgba(0,200,255,0)"]]); g.fillRect(0, 0, 22, 22);
    poly(g, [11, 2, 18, 9, 11, 20, 4, 9]);
    g.fillStyle = lin(g, 4, 2, 18, 20, [[0, "#e8ffff"], [0.5, "#30d8ff"], [1, "#0a5a9a"]]); g.fill();
    g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = 0.8; g.stroke();
    g.beginPath(); g.moveTo(4, 9); g.lineTo(18, 9); g.moveTo(11, 2); g.lineTo(8, 9); g.lineTo(11, 20); g.stroke();
  });

  /* ---------- Decorations (anchored at the bottom centre) ---------- */
  function coralBranch(g, x, y, a, len, w, depth, col) {
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    g.strokeStyle = col; g.lineWidth = w;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    if (depth > 0) {
      coralBranch(g, x2, y2, a - 0.45, len * 0.75, w * 0.72, depth - 1, col);
      coralBranch(g, x2, y2, a + 0.4, len * 0.7, w * 0.72, depth - 1, col);
    } else { g.fillStyle = "#ffd0e0"; circ(g, x2, y2, w * 0.8); g.fill(); }
  }
  const DECO = {
    coral: [
      () => mk(90, 100, (g) => { const col = lin(g, 0, 100, 0, 0, [[0, "#7a1d3a"], [1, "#ff7aa8"]]); coralBranch(g, 45, 100, -Math.PI / 2, 30, 9, 4, col); }),
      () => mk(90, 70, (g) => { const col = lin(g, 0, 70, 0, 0, [[0, "#8a3a08"], [1, "#ffb050"]]); coralBranch(g, 45, 70, -Math.PI / 2 - 0.2, 22, 7, 3, col); coralBranch(g, 45, 70, -Math.PI / 2 + 0.3, 20, 7, 3, col); }),
      () => mk(70, 40, (g) => {
        g.fillStyle = rad(g, 35, 30, 2, 36, [[0, "#ffb0c0"], [0.6, "#c04060"], [1, "#4a1020"]]);
        g.beginPath(); g.ellipse(35, 40, 32, 26, 0, Math.PI, TAU); g.fill();
        g.strokeStyle = "rgba(80,10,30,0.5)"; g.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(35, 40, 30 - i * 5, 24 - i * 4, 0, Math.PI, TAU); g.stroke(); }
      }),
      () => mk(60, 70, (g) => {
        for (let i = 0; i < 9; i++) {
          const a = -Math.PI / 2 + (i - 4) * 0.22;
          g.strokeStyle = lin(g, 0, 70, 0, 10, [[0, "#1a6a5a"], [1, "#9affd8"]]); g.lineWidth = 3.5;
          g.beginPath(); g.moveTo(30, 70); g.quadraticCurveTo(30 + Math.cos(a) * 25, 70 + Math.sin(a) * 30, 30 + Math.cos(a) * 32, 70 + Math.sin(a) * 58); g.stroke();
          g.fillStyle = "#d0fff0"; circ(g, 30 + Math.cos(a) * 32, 70 + Math.sin(a) * 58, 2.5); g.fill();
        }
      }),
    ],
    wreck: [
      () => mk(70, 120, (g) => {
        g.fillStyle = lin(g, 0, 0, 20, 0, [[0, "#3a2a1c"], [1, "#6a5034"]]);
        g.save(); g.translate(35, 120); g.rotate(0.25); g.fillRect(-5, -118, 10, 118); g.fillRect(-28, -95, 56, 6); g.restore();
        g.strokeStyle = "rgba(100,90,70,0.6)"; g.lineWidth = 1; g.beginPath(); g.moveTo(10, 40); g.quadraticCurveTo(30, 80, 60, 118); g.stroke();
      }),
      () => mk(120, 60, (g) => {
        g.strokeStyle = lin(g, 0, 0, 0, 60, [[0, "#5a5a50"], [1, "#22231f"]]); g.lineWidth = 7;
        for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(14 + i * 22, 60); g.quadraticCurveTo(4 + i * 22, 18, 30 + i * 18, 4 + i * 3); g.stroke(); }
      }),
      () => mk(50, 46, (g) => {
        g.fillStyle = lin(g, 0, 0, 50, 0, [[0, "#3a2416"], [0.5, "#7a5030"], [1, "#2a180c"]]);
        g.save(); g.translate(25, 46); g.rotate(-0.3); g.beginPath(); g.roundRect(-16, -40, 32, 40, 6); g.fill();
        g.fillStyle = "#2a2a28"; g.fillRect(-17, -32, 34, 4); g.fillRect(-17, -12, 34, 4); g.restore();
      }),
      () => mk(60, 70, (g) => {
        g.strokeStyle = "#3e4246"; g.lineWidth = 6;
        g.beginPath(); g.moveTo(30, 6); g.lineTo(30, 60); g.moveTo(14, 18); g.lineTo(46, 18); g.stroke();
        g.beginPath(); g.arc(30, 44, 22, 0.2, Math.PI - 0.2); g.stroke();
        g.fillStyle = "#3e4246"; circ(g, 30, 6, 6); g.fill();
      }),
    ],
    lava: [
      () => mk(70, 90, (g) => {
        for (let i = 0; i < 5; i++) {
          const x = 15 + i * 10, h = 30 + ((i * 37) % 50);
          g.fillStyle = lin(g, 0, 90 - h, 0, 90, [[0, "#ffe0a0"], [0.3, "#ff7a1a"], [1, "#5a1404"]]);
          poly(g, [x - 6, 90, x, 90 - h, x + 6, 90]); g.fill();
        }
      }),
      () => mk(60, 80, (g) => {
        g.fillStyle = lin(g, 0, 0, 0, 80, [[0, "#3a2420"], [1, "#120808"]]);
        poly(g, [10, 80, 20, 12, 40, 12, 50, 80]); g.fill();
        g.fillStyle = rad(g, 30, 14, 0, 14, [[0, "#fff0b0"], [0.4, "#ff6a10"], [1, "rgba(255,40,0,0)"]]); ell(g, 30, 14, 14, 8); g.fill();
        g.strokeStyle = "rgba(255,110,30,0.7)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(26, 22); g.lineTo(22, 50); g.lineTo(28, 78); g.stroke();
      }),
      () => mk(80, 50, (g) => {
        g.fillStyle = lin(g, 0, 0, 0, 50, [[0, "#4a2a22"], [1, "#140806"]]);
        g.beginPath(); g.moveTo(0, 50); g.quadraticCurveTo(20, 6, 40, 20); g.quadraticCurveTo(60, 0, 80, 50); g.closePath(); g.fill();
        g.strokeStyle = "rgba(255,120,30,0.8)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(16, 46); g.lineTo(30, 30); g.lineTo(44, 36); g.lineTo(58, 22); g.stroke();
      }),
      () => mk(40, 100, (g) => {
        g.fillStyle = lin(g, 0, 0, 40, 0, [[0, "#2a1410"], [0.5, "#5a2a1c"], [1, "#1a0a08"]]);
        poly(g, [6, 100, 18, 0, 34, 100]); g.fill();
        g.strokeStyle = "rgba(255,90,20,0.6)"; g.lineWidth = 1; g.beginPath(); g.moveTo(18, 10); g.lineTo(20, 60); g.lineTo(16, 98); g.stroke();
      }),
    ],
    hive: [
      () => mk(70, 90, (g) => {
        for (let i = 0; i < 4; i++) {
          const x = 14 + i * 14, h = 40 + ((i * 29) % 45);
          g.strokeStyle = lin(g, 0, 90, 0, 90 - h, [[0, "#2a0a30"], [1, "#d050c0"]]); g.lineWidth = 7;
          g.beginPath(); g.moveTo(x, 90); g.quadraticCurveTo(x + 8, 90 - h / 2, x, 90 - h); g.stroke();
          g.fillStyle = "#ffb0f0"; circ(g, x, 90 - h, 4.5); g.fill();
        }
      }),
      () => mk(70, 50, (g) => {
        for (let i = 0; i < 3; i++) {
          g.fillStyle = rad(g, 16 + i * 19, 32, 2, 16, [[0, "#ffa0e0"], [0.6, "#7a1a6a"], [1, "#24061e"]]);
          ell(g, 16 + i * 19, 36 - (i % 2) * 6, 13, 16); g.fill();
        }
      }),
      () => mk(50, 100, (g) => {
        g.strokeStyle = "#3a0e3a"; g.lineWidth = 5;
        g.beginPath(); g.moveTo(25, 100); g.bezierCurveTo(5, 70, 45, 40, 25, 4); g.stroke();
        g.strokeStyle = "rgba(255,90,220,0.7)"; g.lineWidth = 1.5; g.stroke();
      }),
      () => mk(80, 40, (g) => {
        g.fillStyle = lin(g, 0, 0, 0, 40, [[0, "#6a2a70"], [1, "#1a0620"]]);
        g.beginPath(); g.moveTo(0, 40); g.bezierCurveTo(10, 0, 70, 0, 80, 40); g.closePath(); g.fill();
        for (let i = 0; i < 5; i++) { g.fillStyle = "rgba(255,200,120,0.85)"; circ(g, 14 + i * 13, 24 - (i % 2) * 5, 3); g.fill(); }
      }),
    ],
  };

  // Shared with the deep-zone add-on (deepgfx.js), which adds its sprites before init()
  Gfx.DEF = DEF; Gfx.DECO = DECO;
  Gfx.tools = { mk, lin, rad, ell, circ, poly, lamp };

  Gfx.init = function () {
    for (const k in DEF) { Gfx.spr[k] = DEF[k](); Gfx.white[k] = whiteOf(Gfx.spr[k]); }
    Gfx.deco = {};
    for (const k in DECO) Gfx.deco[k] = DECO[k].map((f) => f());
    // light ray
    const r = document.createElement("canvas"); r.width = 120; r.height = 512;
    let g = r.getContext("2d");
    g.fillStyle = lin(g, 0, 0, 120, 0, [[0, "rgba(255,255,255,0)"], [0.5, "rgba(255,255,255,1)"], [1, "rgba(255,255,255,0)"]]);
    g.fillRect(0, 0, 120, 512);
    g.globalCompositeOperation = "destination-in";
    g.fillStyle = lin(g, 0, 0, 0, 512, [[0, "rgba(0,0,0,1)"], [1, "rgba(0,0,0,0)"]]);
    g.fillRect(0, 0, 120, 512);
    Gfx.ray = r;
    // vignette
    const v = document.createElement("canvas"); v.width = W / 2; v.height = H / 2;
    g = v.getContext("2d");
    g.fillStyle = rad(g, W / 4, H / 4, H * 0.18, W * 0.36, [[0, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,0.6)"]]);
    g.fillRect(0, 0, W / 2, H / 2);
    Gfx.vignette = v;
    // rock texture pattern
    const t = document.createElement("canvas"); t.width = t.height = 256;
    g = t.getContext("2d");
    const rr = U.rng(99);
    for (let i = 0; i < 260; i++) {
      const x = rr() * 256, y = rr() * 256, s = 3 + rr() * 16;
      g.fillStyle = rr() < 0.5 ? `rgba(0,0,0,${0.1 + rr() * 0.25})` : `rgba(255,255,255,${0.03 + rr() * 0.07})`;
      for (const dx of [-256, 0, 256]) for (const dy of [-256, 0, 256]) { g.beginPath(); g.ellipse(x + dx, y + dy, s, s * (0.5 + rr() * 0.4), rr() * 3, 0, TAU); g.fill(); }
    }
    Gfx.rockTex = t;
    // plankton
    Gfx.plankton = [];
    for (let i = 0; i < 150; i++) Gfx.plankton.push({ x: Math.random() * W, y: Math.random() * H, z: 0.15 + Math.random() * 0.9, s: 0.6 + Math.random() * 1.6, p: Math.random() * TAU });
  };

  Gfx.draw = function (ctx, key, x, y, rot = 0, scale = 1, white = false, alpha = 1) {
    const c = (white ? Gfx.white : Gfx.spr)[key];
    if (!c) return;
    const w = c.w * scale, h = c.h * scale;
    if (alpha !== 1) ctx.globalAlpha = alpha;
    if (rot) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.drawImage(c, -w / 2, -h / 2, w, h);
      ctx.restore();
    } else ctx.drawImage(c, x - w / 2, y - h / 2, w, h);
    if (alpha !== 1) ctx.globalAlpha = 1;
  };
  Gfx.glowAt = function (ctx, rgb, x, y, r, a = 1, hot = false) {
    ctx.globalAlpha = a;
    ctx.drawImage(Gfx.glow(rgb, hot), x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
  };

  /* ---------- Themes and backgrounds ---------- */
  Gfx.THEMES = {
    coral: { water: ["#1a83a8", "#0a4a70", "#04203d"], rays: 0.09, far: "#0c4566", far2: "#09385a", kelp: "#0b4f50", rock: ["#4a8478", "#1a4448", "#0a1d24"], edge: "130,240,215", plank: "200,245,255", deco: "coral", seed: 3 },
    wreck: { water: ["#174a5e", "#0b2a3a", "#030d16"], rays: 0.045, far: "#0d2c3b", far2: "#0a2230", kelp: "#0e3330", rock: ["#5a5a4e", "#262720", "#0c0d0b"], edge: "180,200,170", plank: "170,215,205", deco: "wreck", seed: 5, dark: 0.18 },
    lava: { water: ["#4a1a18", "#250c0e", "#0d0406"], rays: 0, far: "#300f10", far2: "#250a0b", kelp: null, rock: ["#5a3024", "#26120c", "#0c0404"], edge: "255,130,40", plank: "255,160,90", deco: "lava", seed: 7, lava: true },
    hive: { water: ["#331650", "#1b0b2e", "#08030f"], rays: 0.03, far: "#230e38", far2: "#1a0a2a", kelp: "#3a1450", rock: ["#6a3070", "#2e1036", "#100414"], edge: "255,100,225", plank: "235,160,255", deco: "hive", seed: 9, veins: true },
  };

  function silhouette(ctx, color, camX, par, base, amp, scale, seed, t) {
    const n = Gfx._n || (Gfx._n = U.noise1(4242));
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(-10, H + 10);
    for (let x = -10; x <= W + 30; x += 20) ctx.lineTo(x, base - U.fbm(n, (x + camX * par) / scale + seed, 3) * amp);
    ctx.lineTo(W + 30, H + 10); ctx.closePath(); ctx.fill();
  }

  Gfx.drawBackground = function (ctx, th, camX, t) {
    // water
    if (!th._grad) th._grad = (() => { const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, th.water[0]); gr.addColorStop(0.55, th.water[1]); gr.addColorStop(1, th.water[2]); return gr; })();
    ctx.fillStyle = th._grad; ctx.fillRect(0, 0, W, H);
    // light rays from the surface
    if (th.rays > 0) {
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 7; i++) {
        const x = ((i * 233 - camX * 0.06 + Math.sin(t * 0.3 + i) * 40) % (W + 300) + W + 300) % (W + 300) - 150;
        ctx.save(); ctx.translate(x, 0); ctx.transform(1, 0, 0.35 + Math.sin(i) * 0.1, 1, 0, 0);
        ctx.globalAlpha = th.rays * (0.6 + 0.4 * Math.sin(t * 0.7 + i * 1.7));
        ctx.drawImage(Gfx.ray, -40 - i * 6, 0, 80 + i * 12, H * 0.95);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
    if (th.lava) {
      // glow from below
      const gr = ctx.createLinearGradient(0, H * 0.45, 0, H);
      gr.addColorStop(0, "rgba(255,80,20,0)"); gr.addColorStop(1, `rgba(255,90,20,${0.22 + 0.06 * Math.sin(t * 2)})`);
      ctx.fillStyle = gr; ctx.fillRect(0, H * 0.45, W, H * 0.55);
    }
    if (th.layers) th.layers(ctx, camX, t); // multi-layer parallax of the deep zone
    else {
      silhouette(ctx, th.far, camX, 0.12, H * 0.92, H * 0.55, 380, th.seed, t);
      silhouette(ctx, th.far2, camX, 0.25, H * 1.02, H * 0.45, 260, th.seed + 50, t);
    }
    // kelp / tendrils in the middle layer
    if (th.kelp) {
      ctx.strokeStyle = th.kelp; ctx.lineWidth = 5;
      const par = 0.4, sp = 70, off = camX * par;
      for (let i = Math.floor(off / sp) - 1; i < (off + W) / sp + 1; i++) {
        const h = U.hash(i, th.seed);
        if (h < 0.45) continue;
        const x = i * sp - off + h * 40, len = 120 + h * 260;
        ctx.beginPath(); ctx.moveTo(x, H + 10);
        for (let k = 1; k <= 6; k++) {
          const yy = H + 10 - (len * k) / 6;
          ctx.lineTo(x + Math.sin(t * 1.2 + i + k * 0.7) * 6 * k, yy);
        }
        ctx.stroke();
      }
    }
    // plankton
    ctx.fillStyle = `rgba(${th.plank},0.55)`;
    for (const p of Gfx.plankton) {
      const x = (((p.x - camX * p.z * 0.6 - t * 8 * p.z) % W) + W) % W;
      const y = (p.y + Math.sin(t * 0.8 + p.p) * 8 - t * 6 * p.z + H * 10) % H;
      ctx.globalAlpha = 0.25 + p.z * 0.55;
      ctx.fillRect(x, y, p.s * p.z * 1.5, p.s * p.z * 1.5);
    }
    ctx.globalAlpha = 1;
  };

  Gfx.drawTerrain = function (ctx, th, camX, terr, t) {
    if (!Gfx._pat) Gfx._pat = ctx.createPattern(Gfx.rockTex, "repeat");
    const pat = Gfx._pat;
    const parts = [["floor", terr.floor], ["ceil", terr.ceil]];
    for (const [side, fn] of parts) {
      if (!fn) continue;
      const fl = side === "floor";
      const pts = [];
      let extreme = fl ? H : 0;
      for (let x = -12; x <= W + 12; x += 8) { const y = fn(camX + x); pts.push(x, y); extreme = fl ? Math.min(extreme, y) : Math.max(extreme, y); }
      ctx.beginPath(); ctx.moveTo(-12, fl ? H + 10 : -10);
      for (let i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
      ctx.lineTo(W + 12, fl ? H + 10 : -10); ctx.closePath();
      const gr = ctx.createLinearGradient(0, extreme, 0, fl ? H : 0);
      gr.addColorStop(0, th.rock[0]); gr.addColorStop(0.25, th.rock[1]); gr.addColorStop(1, th.rock[2]);
      ctx.fillStyle = gr; ctx.fill();
      if (pat.setTransform && window.DOMMatrix) {
        pat.setTransform(new DOMMatrix().translateSelf(-camX % 256, 0));
        ctx.fillStyle = pat; ctx.fill();
      }
      // glowing edge
      ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
      ctx.strokeStyle = `rgba(${th.edge},0.7)`; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(${th.edge},${th.lava ? 0.22 + 0.08 * Math.sin(t * 3) : 0.1})`; ctx.lineWidth = th.lava ? 16 : 9; ctx.stroke();
      if (th.veins) {
        ctx.strokeStyle = `rgba(${th.edge},${0.18 + 0.12 * Math.sin(t * 2.5)})`; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < pts.length; i += 12) {
          const x = pts[i], y = pts[i + 1], d = fl ? 1 : -1, h = U.hash(Math.floor((x + camX) / 48), 7);
          ctx.moveTo(x, y + d * 6); ctx.quadraticCurveTo(x + 16, y + d * (30 + h * 30), x + 4, y + d * (60 + h * 60));
        }
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      // decorations
      const decos = Gfx.deco[th.deco], sp = 120, seed = th.seed * 11 + (fl ? 0 : 5);
      for (let i = Math.floor((camX - 120) / sp); i <= (camX + W + 120) / sp; i++) {
        const h = U.hash(i, seed);
        if (h > (fl ? 0.6 : 0.35)) continue;
        const wx = i * sp + U.hash(i, seed + 1) * 60, x = wx - camX, y = fn(wx);
        const d = decos[Math.floor(U.hash(i, seed + 2) * decos.length)], sc = 0.6 + U.hash(i, seed + 3) * 0.45;
        const w = d.w * sc, hh = d.h * sc;
        if (fl) ctx.drawImage(d, x - w / 2, y - hh + 6, w, hh);
        else { ctx.save(); ctx.translate(x, y - 6); ctx.scale(1, -1); ctx.drawImage(d, -w / 2, -hh, w, hh); ctx.restore(); }
      }
    }
  };

  Gfx.silhouette = silhouette;
  Gfx.drawOverlay = function (ctx, th, camX = 0, t = 0) {
    if (th.fore) th.fore(ctx, camX, t);
    ctx.drawImage(Gfx.vignette, 0, 0, W, H);
    if (th.dark) { ctx.fillStyle = `rgba(0,0,0,${th.dark})`; ctx.fillRect(0, 0, W, H); }
  };

  /* ---------- Particles ---------- */
  const Fx = (XA.Fx = { list: [], shake: 0, flash: 0, flashRGB: "255,255,255", max: 2600 });
  const FIRE = ["255,250,215", "255,214,110", "255,150,50", "255,96,30", "220,50,20"];

  Fx.clear = function () { Fx.list.length = 0; Fx.shake = 0; Fx.flash = 0; };
  Fx.add = function (p) {
    if (Fx.list.length >= Fx.max) return;
    p.life = p.max = p.life || 0.5;
    if (p.drag === undefined) p.drag = 0;
    Fx.list.push(p);
  };
  Fx.glow = (x, y, size, size2, rgb, life, o = {}) => Fx.add(Object.assign({ k: "glow", x, y, vx: 0, vy: 0, size, size2, rgb, life }, o));

  Fx.explode = function (x, y, size, o = {}) {
    const n = Math.min(70, 6 + Math.floor(size * 0.7));
    const tint = o.rgb;
    Fx.glow(x, y, size * 2.2, size * 3.2, "255,255,240", 0.16, { hot: true });
    Fx.glow(x, y, size * 5, size * 6, tint || "255,170,90", 0.35, { a: 0.35 });
    for (let i = 0; i < n * 0.6; i++) {
      const a = U.rand(TAU), sp = U.rand(0.2, 1) * size * 3.2;
      Fx.glow(x + Math.cos(a) * size * 0.2, y + Math.sin(a) * size * 0.2, U.rand(0.35, 0.8) * size, U.rand(0.9, 1.6) * size,
        tint && Math.random() < 0.5 ? tint : U.pick(FIRE), U.rand(0.35, 0.9), { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 3.2, hot: Math.random() < 0.4 });
    }
    for (let i = 0; i < n; i++) {
      const a = U.rand(TAU), sp = U.rand(5, 15) * Math.min(size, 50);
      Fx.add({ k: "spark", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: U.rand(0.25, 0.6), drag: 4, rgb: U.pick(FIRE.slice(0, 3)), w: U.rand(1.2, 2.6) });
    }
    if (size > 14) {
      for (let i = 0; i < Math.min(16, size / 5); i++) {
        const a = U.rand(TAU), sp = U.rand(80, 260) * Math.min(2, size / 40 + 0.5);
        Fx.add({ k: "debris", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: U.rand(1, 2.2), drag: 1.2, g: 140, rot: U.rand(TAU), vr: U.rand(-9, 9), s: U.rand(2.5, 6) * Math.min(2, size / 30 + 0.6), st: 0 });
      }
    }
    for (let i = 0; i < n * 0.45; i++) {
      const a = U.rand(TAU), sp = U.rand(10, 60);
      Fx.add({ k: "smoke", x: x + U.rand(-size, size) * 0.4, y: y + U.rand(-size, size) * 0.4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 25, size: size * U.rand(0.5, 0.8), size2: size * U.rand(1.6, 2.6), life: U.rand(0.9, 1.8), drag: 1.5, delay: 0.08 });
    }
    for (let i = 0; i < n * 0.7; i++) {
      const a = U.rand(TAU), sp = U.rand(20, 160) * Math.min(2, size / 30 + 0.4);
      Fx.add({ k: "bubble", x: x + U.rand(-size, size) * 0.3, y: y + U.rand(-size, size) * 0.3, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: U.rand(1.5, 5) * (size > 50 ? 1.6 : 1), life: U.rand(1, 2.6), drag: 2.2, p: U.rand(TAU) });
    }
    Fx.add({ k: "ring", x, y, size: size * 0.3, size2: size * 3.6, life: 0.5, rgb: "200,240,255", w: Math.max(2, size * 0.12) });
    if (size > 40) Fx.add({ k: "ring", x, y, size: size * 0.2, size2: size * 6, life: 0.9, rgb: "255,200,140", w: size * 0.08 });
    Fx.shake = Math.max(Fx.shake, Math.min(28, size * 0.16));
    if (size > 45) { Fx.flash = Math.max(Fx.flash, Math.min(0.55, size / 320)); Fx.flashRGB = "255,240,220"; }
  };

  Fx.hitSpark = function (x, y, rgb = "255,230,150", n = 4) {
    for (let i = 0; i < n; i++) {
      const a = U.rand(TAU), sp = U.rand(150, 420);
      Fx.add({ k: "spark", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: U.rand(0.1, 0.25), drag: 6, rgb, w: 1.5 });
    }
    Fx.glow(x, y, 10, 18, rgb, 0.1, { hot: true });
  };
  Fx.bubbles = function (x, y, n = 1, spread = 4) {
    for (let i = 0; i < n; i++) Fx.add({ k: "bubble", x: x + U.rand(-spread, spread), y: y + U.rand(-spread, spread), vx: U.rand(-20, 20), vy: U.rand(-30, 10), r: U.rand(1, 3), life: U.rand(0.6, 1.4), drag: 2, p: U.rand(TAU) });
  };
  Fx.text = function (x, y, s, rgb = "255,240,160", size = 16) {
    Fx.add({ k: "text", x, y, vx: 0, vy: -50, life: 0.9, s, rgb, size, drag: 1.5 });
  };

  Fx.update = function (dt) {
    const L = Fx.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.life -= dt;
      if (p.life <= 0) { L[i] = L[L.length - 1]; L.pop(); continue; }
      if (p.drag) { const d = Math.max(0, 1 - p.drag * dt); p.vx *= d; p.vy *= d; }
      if (p.g) p.vy += p.g * dt;
      if (p.k === "bubble") { p.vy -= 90 * dt; p.x += Math.sin(p.life * 9 + p.p) * 20 * dt; }
      else if (p.k === "smoke") p.vy -= 15 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.k === "debris") {
        p.rot += p.vr * dt;
        p.st -= dt;
        if (p.st <= 0 && p.life > 0.3) { p.st = 0.045; Fx.add({ k: "smoke", x: p.x, y: p.y, vx: 0, vy: -10, size: p.s * 1.2, size2: p.s * 3.5, life: 0.6, drag: 1 }); Fx.glow(p.x, p.y, p.s * 1.6, p.s * 0.6, "255,140,50", 0.2); }
      }
    }
    Fx.shake = Math.max(0, Fx.shake - dt * 40);
    Fx.flash = Math.max(0, Fx.flash - dt * 1.6);
  };

  Fx.draw = function (ctx) {
    const L = Fx.list;
    // normal blended particles
    for (const p of L) {
      if (p.delay > 0) continue;
      const f = p.life / p.max;
      if (p.k === "smoke") {
        const s = U.lerp(p.size2, p.size, f);
        ctx.globalAlpha = Math.min(1, f * 1.4) * 0.8;
        ctx.drawImage(Gfx.smoke, p.x - s, p.y - s, s * 2, s * 2);
      } else if (p.k === "debris") {
        ctx.globalAlpha = Math.min(1, f * 3);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = "#2c3038"; ctx.fillRect(-p.s, -p.s * 0.6, p.s * 2, p.s * 1.2);
        ctx.fillStyle = `rgba(255,${120 + 100 * f | 0},40,${f})`; ctx.fillRect(-p.s * 0.6, -p.s * 0.3, p.s * 1.2, p.s * 0.6);
        ctx.restore();
      } else if (p.k === "bubble") {
        ctx.globalAlpha = Math.min(1, f * 2) * 0.7;
        ctx.strokeStyle = "rgba(220,250,255,0.9)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fillRect(p.x - p.r * 0.4, p.y - p.r * 0.5, 1.2, 1.2);
      } else if (p.k === "text") {
        ctx.globalAlpha = Math.min(1, f * 2);
        ctx.font = `700 ${p.size}px Orbitron, Arial, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = `rgb(${p.rgb})`; ctx.fillText(p.s, p.x, p.y);
      }
    }
    // additive particles
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
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035); ctx.stroke();
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
