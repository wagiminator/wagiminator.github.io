/* PRIMORDIA: procedurally drawn sprites, parallax backgrounds, particles and explosions */
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

  /* ---------- Sprites (ship points up, enemies point down) ---------- */
  const DEF = {};

  DEF.ship = () => mk(68, 80, (g) => {
    // wings
    g.fillStyle = lin(g, 0, 30, 0, 70, [[0, "#d7dee8"], [0.5, "#7d8a9c"], [1, "#2a3240"]]);
    poly(g, [34, 22, 66, 58, 64, 66, 40, 62, 28, 62, 4, 66, 2, 58]); g.fill();
    g.strokeStyle = "rgba(10,16,24,0.7)"; g.lineWidth = 1; g.stroke();
    g.fillStyle = "#ff7a2a"; poly(g, [12, 58, 22, 50, 24, 55, 14, 61]); g.fill(); poly(g, [56, 58, 46, 50, 44, 55, 54, 61]); g.fill();
    // engines
    for (const x of [24, 44]) {
      g.fillStyle = lin(g, x - 6, 0, x + 6, 0, [[0, "#2a3240"], [0.5, "#9aa6b6"], [1, "#2a3240"]]);
      g.beginPath(); g.roundRect(x - 6, 52, 12, 22, 4); g.fill();
      g.fillStyle = "#11161e"; g.fillRect(x - 4, 72, 8, 5);
    }
    // fuselage
    g.beginPath(); g.moveTo(34, 1); g.bezierCurveTo(43, 14, 45, 40, 42, 70); g.lineTo(26, 70); g.bezierCurveTo(23, 40, 25, 14, 34, 1); g.closePath();
    g.fillStyle = lin(g, 24, 0, 44, 0, [[0, "#3a4556"], [0.35, "#e8eef6"], [0.6, "#a8b4c4"], [1, "#2a3240"]]); g.fill();
    g.strokeStyle = "rgba(10,16,24,0.7)"; g.stroke();
    // cockpit
    ell(g, 34, 26, 5.5, 11);
    g.fillStyle = lin(g, 0, 15, 0, 37, [[0, "#e0fbff"], [0.4, "#39c7ff"], [1, "#04304a"]]); g.fill();
    g.fillStyle = "rgba(255,255,255,0.7)"; ell(g, 32.5, 22, 1.6, 4); g.fill();
    g.strokeStyle = "rgba(20,30,45,0.6)"; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(28, 44); g.lineTo(40, 44); g.moveTo(27, 56); g.lineTo(41, 56); g.stroke();
  });

  DEF.drone = () => mk(28, 28, (g) => {
    g.fillStyle = lin(g, 0, 2, 0, 26, [[0, "#e8eef5"], [0.5, "#6f8298"], [1, "#1e2733"]]);
    poly(g, [14, 1, 26, 20, 14, 26, 2, 20]); g.fill();
    g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 1; g.stroke();
    lamp(g, 14, 15, 4, "120,255,160");
  });

  DEF.tribug = () => mk(46, 54, (g) => {
    g.strokeStyle = "#5a3a20"; g.lineWidth = 2;
    for (let i = 0; i < 6; i++) { const y = 14 + i * 6; g.beginPath(); g.moveTo(10, y); g.lineTo(2, y + 4); g.moveTo(36, y); g.lineTo(44, y + 4); g.stroke(); }
    ell(g, 23, 27, 17, 24);
    g.fillStyle = lin(g, 6, 0, 40, 0, [[0, "#5a3a1c"], [0.45, "#d9a066"], [0.6, "#b77a42"], [1, "#4a2e14"]]); g.fill();
    g.strokeStyle = "rgba(40,20,5,0.8)"; g.lineWidth = 1; g.stroke();
    g.strokeStyle = "rgba(60,30,10,0.6)";
    for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(23, 12 + i * 6.5, 15 - Math.abs(i - 2.5) * 1.5, 3, 0, 0, Math.PI); g.stroke(); }
    g.fillStyle = "#e8c08a"; g.fillRect(21, 8, 4, 40);
    lamp(g, 15, 46, 2.6, "255,90,60"); lamp(g, 31, 46, 2.6, "255,90,60");
  });

  DEF.ammo = () => mk(50, 50, (g) => {
    g.fillStyle = rad(g, 22, 20, 2, 26, [[0, "#ffe2b8"], [0.6, "#c47a3a"], [1, "#4a2408"]]);
    circ(g, 25, 25, 23); g.fill();
    g.strokeStyle = "rgba(60,25,5,0.85)"; g.lineWidth = 1.6;
    g.beginPath();
    for (let a = 0; a < Math.PI * 6; a += 0.1) { const r = 2 + a * 1.15; const x = 25 + Math.cos(a) * r, y = 25 + Math.sin(a) * r; if (a === 0) g.moveTo(x, y); else g.lineTo(x, y); }
    g.stroke();
    g.strokeStyle = "rgba(255,230,190,0.5)"; g.lineWidth = 1;
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; g.beginPath(); g.moveTo(25 + Math.cos(a) * 12, 25 + Math.sin(a) * 12); g.lineTo(25 + Math.cos(a) * 22, 25 + Math.sin(a) * 22); g.stroke(); }
    lamp(g, 25, 25, 3, "120,255,220");
  });

  DEF.jelly = () => mk(52, 46, (g) => {
    g.beginPath(); g.moveTo(3, 30); g.bezierCurveTo(3, 2, 49, 2, 49, 30); g.quadraticCurveTo(43, 26, 38, 31); g.quadraticCurveTo(32, 26, 26, 31); g.quadraticCurveTo(20, 26, 14, 31); g.quadraticCurveTo(9, 26, 3, 30); g.closePath();
    g.fillStyle = rad(g, 26, 16, 2, 28, [[0, "rgba(200,255,250,0.95)"], [0.45, "rgba(60,220,210,0.75)"], [1, "rgba(10,90,110,0.6)"]]); g.fill();
    g.strokeStyle = "rgba(200,255,250,0.8)"; g.lineWidth = 1.2; g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 1;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(26, 8); g.quadraticCurveTo(10 + i * 8, 14, 7 + i * 9.5, 28); g.stroke(); }
    lamp(g, 26, 17, 4, "120,255,240");
  });

  DEF.fly = () => mk(56, 44, (g) => {
    g.fillStyle = "rgba(180,240,255,0.35)"; g.strokeStyle = "rgba(220,250,255,0.7)"; g.lineWidth = 1;
    for (const s of [-1, 1]) for (const k of [0, 1]) {
      g.beginPath(); g.ellipse(28 + s * 15, 14 + k * 11, 14, 5, s * (0.25 - k * 0.45), 0, TAU); g.fill(); g.stroke();
    }
    g.fillStyle = lin(g, 22, 0, 34, 0, [[0, "#0a4a3a"], [0.5, "#30e0a0"], [1, "#0a4a3a"]]);
    g.beginPath(); g.roundRect(25, 6, 6, 34, 3); g.fill();
    ell(g, 28, 38, 6, 5); g.fill();
    lamp(g, 25.5, 39, 2.2, "255,80,80"); lamp(g, 30.5, 39, 2.2, "255,80,80");
  });

  DEF.spore = () => mk(44, 44, (g) => {
    g.strokeStyle = "#9ad04a"; g.lineWidth = 2.5;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; g.beginPath(); g.moveTo(22 + Math.cos(a) * 12, 22 + Math.sin(a) * 12); g.lineTo(22 + Math.cos(a) * 20, 22 + Math.sin(a) * 20); g.stroke(); g.fillStyle = "#eaff9a"; circ(g, 22 + Math.cos(a) * 20, 22 + Math.sin(a) * 20, 2); g.fill(); }
    g.fillStyle = rad(g, 18, 17, 1, 16, [[0, "#f2ffb0"], [0.5, "#7ab82a"], [1, "#24400a"]]);
    circ(g, 22, 22, 14); g.fill();
    for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(40,70,10,0.6)"; circ(g, 22 + Math.cos(i) * 7, 22 + Math.sin(i * 1.7) * 7, 2.4); g.fill(); }
  });
  DEF.sporelet = () => mk(18, 18, (g) => {
    g.fillStyle = rad(g, 7, 7, 0, 9, [[0, "#ffffc0"], [0.5, "#b8e040"], [1, "rgba(90,140,10,0.2)"]]);
    circ(g, 9, 9, 8); g.fill();
  });

  DEF.beetle = () => mk(68, 64, (g) => {
    g.strokeStyle = "#1a1030"; g.lineWidth = 3.5;
    for (let i = 0; i < 3; i++) { const y = 22 + i * 12; g.beginPath(); g.moveTo(16, y); g.lineTo(4, y - 6 + i * 6); g.lineTo(1, y + 4 + i * 4); g.moveTo(52, y); g.lineTo(64, y - 6 + i * 6); g.lineTo(67, y + 4 + i * 4); g.stroke(); }
    g.fillStyle = "#1a1030"; ell(g, 34, 54, 12, 9); g.fill();
    g.beginPath(); g.moveTo(34, 2); g.bezierCurveTo(62, 4, 62, 46, 34, 50); g.bezierCurveTo(6, 46, 6, 4, 34, 2); g.closePath();
    g.fillStyle = lin(g, 8, 0, 60, 0, [[0, "#1c0e3a"], [0.3, "#7a3cff"], [0.5, "#d0b0ff"], [0.7, "#5a20c0"], [1, "#140828"]]); g.fill();
    g.strokeStyle = "rgba(10,0,20,0.8)"; g.lineWidth = 1.2; g.stroke();
    g.beginPath(); g.moveTo(34, 3); g.lineTo(34, 49); g.stroke();
    g.fillStyle = "rgba(255,255,255,0.35)"; ell(g, 24, 16, 5, 10, 0.3); g.fill();
    g.fillStyle = "#e0c060"; poly(g, [28, 58, 30, 64, 32, 58]); g.fill(); poly(g, [36, 58, 38, 64, 40, 58]); g.fill();
    lamp(g, 28, 54, 2.4, "255,220,80"); lamp(g, 40, 54, 2.4, "255,220,80");
  });

  DEF.wormseg = () => mk(32, 32, (g) => {
    g.fillStyle = rad(g, 13, 12, 1, 16, [[0, "#ffc0a0"], [0.55, "#c0503a"], [1, "#401008"]]);
    circ(g, 16, 16, 14); g.fill();
    g.strokeStyle = "rgba(60,10,0,0.7)"; g.lineWidth = 1.2; g.beginPath(); g.arc(16, 16, 9, 0.3, Math.PI - 0.3); g.stroke();
    g.fillStyle = "#ffd8c0"; circ(g, 4, 16, 2); g.fill(); circ(g, 28, 16, 2); g.fill();
  });
  DEF.wormhead = () => mk(42, 42, (g) => {
    g.fillStyle = rad(g, 18, 16, 2, 22, [[0, "#ffd0b0"], [0.55, "#d0583e"], [1, "#401008"]]);
    circ(g, 21, 19, 18); g.fill();
    g.fillStyle = "#200404"; ell(g, 21, 30, 10, 7); g.fill();
    g.fillStyle = "#fff"; for (let i = 0; i < 5; i++) { poly(g, [13 + i * 4, 25, 15 + i * 4, 30, 17 + i * 4, 25]); g.fill(); }
    lamp(g, 14, 15, 3, "255,255,120"); lamp(g, 28, 15, 3, "255,255,120");
  });

  DEF.eye = () => mk(44, 44, (g) => {
    g.fillStyle = rad(g, 22, 22, 10, 22, [[0, "#3a1a10"], [1, "#120604"]]); circ(g, 22, 22, 21); g.fill();
    g.fillStyle = rad(g, 19, 18, 2, 16, [[0, "#ffffff"], [0.6, "#f0d8d0"], [1, "#a06050"]]); circ(g, 22, 22, 15); g.fill();
    g.strokeStyle = "rgba(200,40,40,0.6)"; g.lineWidth = 0.8;
    for (let i = 0; i < 7; i++) { const a = i; g.beginPath(); g.moveTo(22 + Math.cos(a) * 15, 22 + Math.sin(a) * 15); g.quadraticCurveTo(22 + Math.cos(a + 0.3) * 10, 22 + Math.sin(a + 0.3) * 10, 22 + Math.cos(a) * 8, 22 + Math.sin(a) * 8); g.stroke(); }
  });

  DEF.egg = () => mk(70, 60, (g) => {
    const eggs = [[18, 36, 15, 19], [36, 28, 16, 21], [54, 38, 14, 17], [30, 46, 12, 12], [46, 48, 11, 10]];
    for (const [x, y, rx, ry] of eggs) {
      g.fillStyle = rad(g, x - rx * 0.3, y - ry * 0.4, 1, rx * 1.4, [[0, "#fff6d0"], [0.5, "#c8b070"], [1, "#4a3a10"]]);
      ell(g, x, y, rx, ry); g.fill();
      g.strokeStyle = "rgba(60,40,0,0.5)"; g.lineWidth = 1; g.stroke();
      g.fillStyle = "rgba(255,120,60,0.55)"; ell(g, x, y + 2, rx * 0.35, ry * 0.3); g.fill();
    }
  });

  DEF.nautilus = () => mk(96, 100, (g) => {
    g.strokeStyle = "#8a2a4a"; g.lineWidth = 4;
    for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(32 + i * 5, 70); g.quadraticCurveTo(26 + i * 7, 86, 30 + i * 6, 98); g.stroke(); }
    g.fillStyle = rad(g, 44, 40, 4, 46, [[0, "#fff0e0"], [0.4, "#e0a080"], [0.8, "#8a3a2a"], [1, "#3a1008"]]);
    circ(g, 48, 44, 42); g.fill();
    g.fillStyle = "rgba(120,40,20,0.85)";
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + i * 0.5; g.beginPath(); g.moveTo(48, 44); g.arc(48, 44, 42, a, a + 0.18); g.closePath(); g.fill(); }
    g.strokeStyle = "rgba(60,15,5,0.8)"; g.lineWidth = 2;
    g.beginPath(); for (let a = 0; a < Math.PI * 5; a += 0.1) { const r = 3 + a * 2.4; const x = 48 + Math.cos(a) * r, y = 40 + Math.sin(a) * r; if (a === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke();
    g.fillStyle = "#2a0a10"; ell(g, 48, 72, 22, 10); g.fill();
    lamp(g, 36, 70, 4, "255,240,120"); lamp(g, 60, 70, 4, "255,240,120");
  });

  DEF.darter = () => mk(26, 50, (g) => {
    g.beginPath(); g.moveTo(13, 49); g.lineTo(23, 14); g.lineTo(13, 2); g.lineTo(3, 14); g.closePath();
    g.fillStyle = lin(g, 3, 0, 23, 0, [[0, "#3a0a0a"], [0.5, "#ff5a40"], [1, "#3a0a0a"]]); g.fill();
    g.strokeStyle = "rgba(255,220,200,0.6)"; g.lineWidth = 1; g.stroke();
    lamp(g, 13, 36, 3, "255,255,140");
  });

  DEF.bubble = () => mk(40, 40, (g) => {
    g.fillStyle = rad(g, 14, 13, 1, 22, [[0, "rgba(255,255,255,0.45)"], [0.6, "rgba(120,220,255,0.18)"], [1, "rgba(160,240,255,0.5)"]]);
    circ(g, 20, 20, 18); g.fill();
    g.strokeStyle = "rgba(220,250,255,0.85)"; g.lineWidth = 1.4; g.stroke();
    g.fillStyle = "rgba(255,255,255,0.85)"; ell(g, 13, 12, 5, 3, -0.6); g.fill();
  });

  DEF.mine = () => mk(22, 22, (g) => {
    g.fillStyle = lin(g, 0, 2, 0, 20, [[0, "#c8d0da"], [1, "#2a323c"]]); circ(g, 11, 11, 8); g.fill();
    g.strokeStyle = "#8a96a4"; g.lineWidth = 2;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; g.beginPath(); g.moveTo(11 + Math.cos(a) * 8, 11 + Math.sin(a) * 8); g.lineTo(11 + Math.cos(a) * 11, 11 + Math.sin(a) * 11); g.stroke(); }
    lamp(g, 11, 11, 2.5, "255,200,60");
  });

  // Bullets
  DEF.b_shot = () => mk(10, 30, (g) => {
    g.fillStyle = rad(g, 5, 12, 0, 14, [[0, "rgba(255,240,140,0.9)"], [1, "rgba(255,160,0,0)"]]); g.fillRect(0, 0, 10, 30);
    g.fillStyle = lin(g, 0, 0, 0, 30, [[0, "#ffffff"], [0.5, "#ffe070"], [1, "rgba(255,150,0,0)"]]);
    ell(g, 5, 12, 2.6, 11); g.fill();
  });
  DEF.b_side = () => mk(16, 16, (g) => {
    g.fillStyle = rad(g, 8, 8, 0, 8, [[0, "#fff"], [0.3, "#80e8ff"], [0.6, "rgba(40,160,255,0.5)"], [1, "rgba(0,120,255,0)"]]); g.fillRect(0, 0, 16, 16);
  });
  DEF.b_cannon = () => mk(24, 24, (g) => {
    g.fillStyle = rad(g, 12, 12, 0, 12, [[0, "#fff"], [0.25, "#ffb0ff"], [0.6, "rgba(255,60,220,0.55)"], [1, "rgba(200,0,200,0)"]]); g.fillRect(0, 0, 24, 24);
  });
  DEF.b_missile = () => mk(10, 24, (g) => {
    g.fillStyle = "#d8e0e8"; poly(g, [3, 22, 3, 6, 5, 1, 7, 6, 7, 22]); g.fill();
    g.fillStyle = "#ff4a3a"; g.fillRect(3, 5, 4, 3);
    g.fillStyle = "#6a7480"; poly(g, [1, 22, 3, 17, 3, 22]); g.fill(); poly(g, [9, 22, 7, 17, 7, 22]); g.fill();
  });
  DEF.e_orb = () => mk(20, 20, (g) => { g.fillStyle = rad(g, 10, 10, 0, 10, [[0, "#ffffff"], [0.28, "#ff7a9a"], [0.6, "rgba(255,30,80,0.55)"], [1, "rgba(255,0,60,0)"]]); g.fillRect(0, 0, 20, 20); });
  DEF.e_acid = () => mk(22, 22, (g) => { g.fillStyle = rad(g, 11, 11, 0, 11, [[0, "#ffffff"], [0.3, "#c0ff60"], [0.65, "rgba(120,255,40,0.5)"], [1, "rgba(80,200,0,0)"]]); g.fillRect(0, 0, 22, 22); });
  DEF.e_fire = () => mk(24, 24, (g) => { g.fillStyle = rad(g, 12, 12, 0, 12, [[0, "#fffbe0"], [0.3, "#ffb030"], [0.65, "rgba(255,70,0,0.55)"], [1, "rgba(255,40,0,0)"]]); g.fillRect(0, 0, 24, 24); });
  DEF.e_violet = () => mk(20, 20, (g) => { g.fillStyle = rad(g, 10, 10, 0, 10, [[0, "#ffffff"], [0.3, "#e0a0ff"], [0.65, "rgba(200,60,255,0.55)"], [1, "rgba(160,0,255,0)"]]); g.fillRect(0, 0, 20, 20); });
  DEF.e_bone = () => mk(12, 26, (g) => {
    g.fillStyle = "rgba(255,240,200,0.4)"; ell(g, 6, 13, 6, 13); g.fill();
    g.fillStyle = "#fff4dc"; g.fillRect(4, 5, 4, 16); circ(g, 4, 5, 2.6); g.fill(); circ(g, 8, 5, 2.6); g.fill(); circ(g, 4, 21, 2.6); g.fill(); circ(g, 8, 21, 2.6); g.fill();
  });

  // Pickup capsules
  function capsule(letter, c1, c2, glow) {
    return () => mk(32, 32, (g) => {
      g.fillStyle = rad(g, 16, 16, 0, 16, [[0, `rgba(${glow},0.6)`], [1, `rgba(${glow},0)`]]); g.fillRect(0, 0, 32, 32);
      g.fillStyle = lin(g, 0, 6, 0, 26, [[0, c1], [1, c2]]);
      circ(g, 16, 16, 11); g.fill();
      g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = 1.3; g.stroke();
      g.fillStyle = "#fff"; g.font = `bold ${letter.length > 1 ? 9 : 13}px Orbitron, Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(letter, 16, 16.5);
    });
  }
  DEF.p_power = capsule("P", "#ffc070", "#b04a08", "255,160,60");
  DEF.p_speed = capsule("S", "#9af0ff", "#0a6a9a", "80,200,255");
  DEF.p_health = capsule("H", "#7dffa0", "#0e7a3a", "80,255,140");
  DEF.p_weapon = capsule("W", "#ff9af0", "#8a1a7a", "255,100,230");
  DEF.p_over = capsule("O", "#fff6a0", "#a07a00", "255,230,80");
  DEF.p_bomb = capsule("B", "#f0f0ff", "#5a5aa0", "200,200,255");
  DEF.p_life = capsule("1UP", "#ffa0a0", "#8a1010", "255,90,90");
  DEF.coin = () => mk(26, 26, (g) => {
    g.fillStyle = rad(g, 13, 13, 0, 13, [[0, "rgba(255,240,140,0.6)"], [1, "rgba(255,200,0,0)"]]); g.fillRect(0, 0, 26, 26);
    g.fillStyle = rad(g, 10, 9, 1, 10, [[0, "#ffffff"], [0.3, "#fff0a0"], [0.8, "#e0a020"], [1, "#8a5a00"]]);
    circ(g, 13, 13, 8.5); g.fill();
    g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 1; g.stroke();
  });

  /* ---------- Merchant (original character for the shop) ---------- */
  Gfx.drawMerchant = function (g, x, y, t, talk) {
    const bob = Math.sin(t * 2) * 3;
    g.save(); g.translate(x, y + bob);
    // body
    g.fillStyle = rad(g, -10, -20, 6, 70, [[0, "#9af0c0"], [0.5, "#2a9a7a"], [1, "#0a3a34"]]);
    g.beginPath(); g.moveTo(-56, 60); g.bezierCurveTo(-64, -10, -40, -58, 0, -58); g.bezierCurveTo(40, -58, 64, -10, 56, 60); g.closePath(); g.fill();
    // antennae
    g.strokeStyle = "#2a9a7a"; g.lineWidth = 4;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 18, -54); g.quadraticCurveTo(s * 34, -86, s * 22 + Math.sin(t * 3 + s) * 6, -96); g.stroke(); lamp(g, s * 22 + Math.sin(t * 3 + s) * 6, -98, 5, "255,220,90"); }
    // three eyes
    const blink = Math.floor(t * 0.7) % 6 === 0 && (t * 0.7) % 1 < 0.15;
    for (const [ex, ey, r] of [[-24, -22, 11], [0, -32, 14], [24, -22, 11]]) {
      g.fillStyle = "#f8fff8"; circ(g, ex, ey, r); g.fill();
      if (blink) { g.fillStyle = "#2a9a7a"; g.fillRect(ex - r, ey - r, r * 2, r * 1.2); }
      else { g.fillStyle = "#14223a"; circ(g, ex + Math.sin(t) * 2, ey + 2, r * 0.45); g.fill(); g.fillStyle = "#fff"; circ(g, ex - 2, ey - 2, r * 0.15); g.fill(); }
    }
    // mouth
    const open = talk ? 4 + Math.abs(Math.sin(t * 14)) * 8 : 3;
    g.fillStyle = "#08201c"; g.beginPath(); g.ellipse(0, 10, 18, open, 0, 0, TAU); g.fill();
    // collar with gems
    g.fillStyle = "#e0b040"; g.fillRect(-46, 40, 92, 8);
    for (let i = 0; i < 5; i++) lamp(g, -36 + i * 18, 44, 3, i % 2 ? "255,90,200" : "90,220,255");
    g.restore();
  };

  /* ---------- Themes, tiles and parallax ---------- */
  Gfx.THEMES = {
    ocean: { bg: ["#0b4a5a", "#062a3a", "#021018"], deco: "ocean", wall: ["#2a6a64", "#123a3a", "#06181a"], edge: "120,240,210", seed: 3, spark: "160,255,230" },
    fossil: { bg: ["#4a3420", "#2a1c10", "#100a04"], deco: "fossil", wall: ["#a08458", "#5a4428", "#20160a"], edge: "255,220,160", seed: 5, spark: "255,220,170" },
    spore: { bg: ["#1c4a1a", "#0e2a0e", "#041004"], deco: "spore", wall: ["#4a7a2a", "#24401a", "#0a1806"], edge: "190,255,120", seed: 7, spark: "220,255,150" },
    core: { bg: ["#2a1446", "#160a2a", "#06030e"], deco: "core", wall: ["#5a5a78", "#2a2a40", "#0c0c16"], edge: "255,110,230", seed: 9, spark: "235,170,255" },
  };
  const TW = 720, TH = 1024;

  function tileCanvas() { const c = document.createElement("canvas"); c.width = TW; c.height = TH; return c; }
  function wrapDraw(g, y, h, fn) { fn(y); if (y - h < 0) fn(y + TH); if (y + h > TH) fn(y - TH); }

  const FAR = {
    ocean(g, r) {
      for (let i = 0; i < 70; i++) {
        const x = r() * TW, y = r() * TH, s = 4 + r() * 22;
        wrapDraw(g, y, s * 2, (yy) => { g.fillStyle = rad(g, x, yy, 0, s * 2, [[0, "rgba(120,255,230,0.18)"], [1, "rgba(80,200,200,0)"]]); circ(g, x, yy, s * 2); g.fill(); g.strokeStyle = "rgba(160,255,240,0.18)"; g.lineWidth = 1; circ(g, x, yy, s); g.stroke(); });
      }
      for (let i = 0; i < 26; i++) {
        const x = r() * TW, y = r() * TH, s = 30 + r() * 50;
        wrapDraw(g, y, s, (yy) => { g.fillStyle = "rgba(4,30,36,0.5)"; ell(g, x, yy, s, s * 0.6, r() * 3); g.fill(); });
      }
      for (let i = 0; i < 40; i++) {
        const x = r() * TW, y = r() * TH, a = r() * TAU, l = 20 + r() * 40;
        wrapDraw(g, y, l, (yy) => { g.strokeStyle = "rgba(90,200,190,0.18)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, yy); g.quadraticCurveTo(x + Math.cos(a) * l, yy + Math.sin(a) * l * 0.4, x + Math.cos(a + 1) * l, yy + Math.sin(a + 1) * l); g.stroke(); });
      }
    },
    fossil(g, r) {
      for (let i = 0; i < 18; i++) {
        const x = r() * TW, y = r() * TH, s = 20 + r() * 40;
        wrapDraw(g, y, s, (yy) => {
          g.strokeStyle = "rgba(255,220,160,0.14)"; g.lineWidth = 2; g.beginPath();
          for (let a = 0; a < Math.PI * 5; a += 0.15) { const rr = a * s / 16; const px = x + Math.cos(a) * rr, py = yy + Math.sin(a) * rr; if (a === 0) g.moveTo(px, py); else g.lineTo(px, py); }
          g.stroke();
        });
      }
      for (let i = 0; i < 16; i++) {
        const x = r() * TW, y = r() * TH, a = r() * TAU, l = 30 + r() * 50;
        wrapDraw(g, y, l, (yy) => { g.strokeStyle = "rgba(255,230,190,0.13)"; g.lineWidth = 5; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + Math.cos(a) * l, yy + Math.sin(a) * l); g.stroke(); g.fillStyle = "rgba(255,230,190,0.13)"; circ(g, x, yy, 6); g.fill(); circ(g, x + Math.cos(a) * l, yy + Math.sin(a) * l, 6); g.fill(); });
      }
      for (let i = 0; i < 120; i++) { const x = r() * TW, y = r() * TH, s = 2 + r() * 8; g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,220,170"},0.12)`; circ(g, x, y, s); g.fill(); }
    },
    spore(g, r) {
      for (let i = 0; i < 22; i++) {
        const x = r() * TW, y = r() * TH, s = 40 + r() * 70, a = r() * TAU;
        wrapDraw(g, y, s, (yy) => {
          g.save(); g.translate(x, yy); g.rotate(a);
          g.fillStyle = "rgba(40,120,30,0.22)"; g.beginPath(); g.moveTo(0, -s); g.quadraticCurveTo(s * 0.6, 0, 0, s); g.quadraticCurveTo(-s * 0.6, 0, 0, -s); g.fill();
          g.strokeStyle = "rgba(150,230,90,0.18)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -s); g.lineTo(0, s);
          for (let k = -3; k <= 3; k++) { g.moveTo(0, k * s / 4); g.lineTo(s * 0.3, k * s / 4 - s * 0.15); g.moveTo(0, k * s / 4); g.lineTo(-s * 0.3, k * s / 4 - s * 0.15); }
          g.stroke(); g.restore();
        });
      }
      for (let i = 0; i < 60; i++) { const x = r() * TW, y = r() * TH, s = 2 + r() * 5; g.fillStyle = "rgba(220,255,140,0.2)"; circ(g, x, y, s); g.fill(); }
    },
    core(g, r) {
      g.strokeStyle = "rgba(255,110,230,0.13)"; g.lineWidth = 2;
      for (let i = 0; i < 40; i++) {
        let x = Math.round(r() * TW / 24) * 24, y = r() * TH;
        g.beginPath(); g.moveTo(x, y);
        for (let k = 0; k < 6; k++) { if (r() < 0.5) x += (r() < 0.5 ? -1 : 1) * 48; else y += 48 + r() * 60; g.lineTo(x, y); }
        g.stroke();
        g.fillStyle = "rgba(255,150,240,0.25)"; circ(g, x, y, 4); g.fill();
      }
      for (let i = 0; i < 20; i++) {
        const x = r() * TW, y = r() * TH, w = 40 + r() * 90, h = 30 + r() * 60;
        wrapDraw(g, y, h, (yy) => { g.fillStyle = "rgba(20,10,40,0.45)"; g.fillRect(x, yy, w, h); g.strokeStyle = "rgba(160,140,220,0.15)"; g.lineWidth = 1; g.strokeRect(x, yy, w, h); });
      }
    },
  };
  const MID = {
    ocean(g, r) {
      for (let i = 0; i < 9; i++) {
        const x = r() * TW, y = r() * TH, s = 50 + r() * 70;
        wrapDraw(g, y, s, (yy) => {
          g.fillStyle = lin(g, 0, yy - s, 0, yy + s, [[0, "rgba(40,110,110,0.55)"], [1, "rgba(10,40,44,0.55)"]]);
          g.beginPath(); for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU, rr = s * (0.7 + 0.3 * Math.sin(k * 2.3 + i)); g.lineTo(x + Math.cos(a) * rr, yy + Math.sin(a) * rr * 0.7); } g.closePath(); g.fill();
          g.strokeStyle = "rgba(140,255,230,0.25)"; g.lineWidth = 1.5; g.stroke();
          for (let k = 0; k < 4; k++) { g.fillStyle = "rgba(255,140,190,0.45)"; circ(g, x + (r() - 0.5) * s, yy + (r() - 0.5) * s * 0.5, 4 + r() * 5); g.fill(); }
        });
      }
    },
    fossil(g, r) {
      for (let i = 0; i < 8; i++) {
        const x = r() * TW, y = r() * TH, s = 40 + r() * 50, a = r() * TAU;
        wrapDraw(g, y, s * 1.6, (yy) => {
          g.save(); g.translate(x, yy); g.rotate(a);
          g.strokeStyle = "rgba(230,205,160,0.5)"; g.lineWidth = 6; g.lineCap = "round";
          g.beginPath(); g.moveTo(0, -s * 1.4); g.lineTo(0, s * 1.4); g.stroke();
          g.lineWidth = 4;
          for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(0, k * s * 0.35); g.quadraticCurveTo(s * 0.9, k * s * 0.35 - 10, s * 0.8, k * s * 0.35 + 18); g.moveTo(0, k * s * 0.35); g.quadraticCurveTo(-s * 0.9, k * s * 0.35 - 10, -s * 0.8, k * s * 0.35 + 18); g.stroke(); }
          g.restore();
        });
      }
    },
    spore(g, r) {
      for (let i = 0; i < 12; i++) {
        const x = r() * TW, y = r() * TH, s = 24 + r() * 40;
        wrapDraw(g, y, s * 1.5, (yy) => {
          g.fillStyle = "rgba(60,30,20,0.6)"; g.fillRect(x - s * 0.12, yy, s * 0.24, s * 1.2);
          g.fillStyle = rad(g, x, yy, 2, s, [[0, "rgba(255,180,120,0.75)"], [0.6, "rgba(200,70,60,0.65)"], [1, "rgba(90,20,20,0.55)"]]);
          g.beginPath(); g.ellipse(x, yy, s, s * 0.55, 0, Math.PI, TAU); g.fill();
          for (let k = 0; k < 5; k++) { g.fillStyle = "rgba(255,240,200,0.7)"; circ(g, x + (r() - 0.5) * s * 1.4, yy - r() * s * 0.4, 2 + r() * 3); g.fill(); }
        });
      }
    },
    core(g, r) {
      for (let i = 0; i < 10; i++) {
        const x = r() * TW, y = r() * TH, w = 50 + r() * 80, h = 80 + r() * 140;
        wrapDraw(g, y, h, (yy) => {
          g.fillStyle = lin(g, x, 0, x + w, 0, [[0, "rgba(40,40,70,0.75)"], [0.5, "rgba(110,110,150,0.75)"], [1, "rgba(30,30,50,0.75)"]]);
          g.beginPath(); g.roundRect(x, yy, w, h, 8); g.fill();
          g.strokeStyle = "rgba(255,120,230,0.35)"; g.lineWidth = 1.5; g.stroke();
          for (let k = 0; k < 3; k++) { g.fillStyle = "rgba(255,120,230,0.7)"; g.fillRect(x + 8, yy + 14 + k * 18, w - 16, 3); }
        });
      }
    },
  };

  const DECO = {
    ocean: [
      () => mk(70, 60, (g) => { for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.25; g.strokeStyle = lin(g, 0, 60, 0, 0, [[0, "#1a6a5a"], [1, "#9affd8"]]); g.lineWidth = 3.5; g.beginPath(); g.moveTo(35, 60); g.quadraticCurveTo(35 + Math.cos(a) * 24, 60 + Math.sin(a) * 26, 35 + Math.cos(a) * 30, 60 + Math.sin(a) * 52); g.stroke(); g.fillStyle = "#ffb0d0"; circ(g, 35 + Math.cos(a) * 30, 60 + Math.sin(a) * 52, 2.5); g.fill(); } }),
      () => mk(60, 50, (g) => { g.fillStyle = rad(g, 30, 40, 2, 30, [[0, "#ffb0c0"], [0.6, "#c04060"], [1, "#4a1020"]]); g.beginPath(); g.ellipse(30, 50, 28, 24, 0, Math.PI, TAU); g.fill(); g.strokeStyle = "rgba(80,10,30,0.5)"; g.lineWidth = 1.5; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(30, 50, 26 - i * 5, 22 - i * 4, 0, Math.PI, TAU); g.stroke(); } }),
      () => mk(50, 50, (g) => { g.fillStyle = rad(g, 22, 20, 2, 24, [[0, "#ffe2b8"], [0.6, "#c47a3a"], [1, "#4a2408"]]); circ(g, 25, 25, 20); g.fill(); g.strokeStyle = "rgba(60,25,5,0.7)"; g.lineWidth = 1.5; g.beginPath(); for (let a = 0; a < Math.PI * 6; a += 0.1) { const rr = 2 + a; const x = 25 + Math.cos(a) * rr, y = 25 + Math.sin(a) * rr; if (a === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); }),
    ],
    fossil: [
      () => mk(70, 60, (g) => { g.strokeStyle = "#e8d8b0"; g.lineWidth = 5; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(10, 8 + i * 11); g.quadraticCurveTo(50, i * 11, 66, 14 + i * 11); g.stroke(); } g.lineWidth = 7; g.beginPath(); g.moveTo(8, 4); g.lineTo(8, 56); g.stroke(); }),
      () => mk(54, 50, (g) => {
        g.fillStyle = lin(g, 0, 0, 0, 50, [[0, "#fff4dc"], [1, "#a08a60"]]);
        g.beginPath(); g.ellipse(27, 22, 22, 19, 0, 0, TAU); g.fill(); g.fillRect(13, 30, 28, 16);
        g.fillStyle = "#2a1c10"; ell(g, 19, 22, 6, 7); g.fill(); ell(g, 35, 22, 6, 7); g.fill(); poly(g, [27, 30, 24, 36, 30, 36]); g.fill();
        g.fillStyle = "#2a1c10"; for (let i = 0; i < 5; i++) g.fillRect(16 + i * 5, 40, 2, 6);
      }),
      () => mk(40, 70, (g) => { g.fillStyle = lin(g, 0, 0, 40, 0, [[0, "#ffd070"], [0.5, "#ffa020"], [1, "#a05a00"]]); g.globalAlpha = 0.85; poly(g, [20, 2, 36, 24, 30, 66, 10, 66, 4, 24]); g.fill(); g.globalAlpha = 1; g.strokeStyle = "rgba(255,255,220,0.8)"; g.lineWidth = 1.2; g.stroke(); g.strokeStyle = "#3a2008"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(14, 30); g.lineTo(26, 40); g.moveTo(18, 44); g.lineTo(24, 30); g.stroke(); }),
    ],
    spore: [
      () => mk(60, 64, (g) => { g.fillStyle = "#e8dcc0"; g.fillRect(26, 30, 8, 34); g.fillStyle = rad(g, 30, 28, 2, 30, [[0, "#ff9a7a"], [0.6, "#c03a2a"], [1, "#4a0a08"]]); g.beginPath(); g.ellipse(30, 32, 28, 22, 0, Math.PI, TAU); g.fill(); for (let i = 0; i < 6; i++) { g.fillStyle = "#fff4e0"; circ(g, 12 + i * 7, 22 + (i % 2) * 5, 2.5); g.fill(); } }),
      () => mk(70, 50, (g) => { g.strokeStyle = "#3a7a1a"; g.lineWidth = 4; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(8 + i * 16, 50); g.bezierCurveTo(i * 16, 30, 20 + i * 16, 20, 10 + i * 16, 4); g.stroke(); } g.fillStyle = "#c8ff60"; for (let i = 0; i < 4; i++) { circ(g, 10 + i * 16, 4, 3); g.fill(); } }),
      () => mk(56, 56, (g) => { g.fillStyle = rad(g, 28, 28, 4, 28, [[0, "#ffe060"], [0.4, "#e04080"], [1, "#4a0a2a"]]); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ell(g, 28 + Math.cos(a) * 14, 28 + Math.sin(a) * 14, 13, 7, a); g.fill(); } g.fillStyle = "#ffe060"; circ(g, 28, 28, 7); g.fill(); }),
    ],
    core: [
      () => mk(60, 60, (g) => { g.fillStyle = lin(g, 0, 0, 60, 0, [[0, "#2a2a40"], [0.5, "#8a8aa8"], [1, "#2a2a40"]]); g.beginPath(); g.roundRect(6, 6, 48, 48, 8); g.fill(); lamp(g, 30, 30, 8, "255,90,220"); g.strokeStyle = "#14141e"; g.lineWidth = 2; g.strokeRect(10, 10, 40, 40); }),
      () => mk(40, 70, (g) => { g.fillStyle = lin(g, 0, 0, 40, 0, [[0, "#1a1a2a"], [0.5, "#6a6a88"], [1, "#1a1a2a"]]); g.fillRect(12, 0, 16, 70); for (let i = 0; i < 4; i++) { g.fillStyle = "#3a3a52"; g.fillRect(6, 6 + i * 17, 28, 6); } lamp(g, 20, 62, 3, "120,220,255"); }),
      () => mk(60, 50, (g) => { g.fillStyle = rad(g, 30, 25, 2, 28, [[0, "#ffa0e8"], [0.5, "#7a1a6a"], [1, "#1a0618"]]); ell(g, 30, 25, 26, 20); g.fill(); g.strokeStyle = "rgba(255,150,240,0.7)"; g.lineWidth = 1.5; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(8 + i * 14, 40); g.quadraticCurveTo(30, 25, 30, 8); g.stroke(); } }),
    ],
  };

  Gfx.init = function () {
    for (const k in DEF) { Gfx.spr[k] = DEF[k](); Gfx.white[k] = whiteOf(Gfx.spr[k]); }
    Gfx.deco = {};
    for (const k in DECO) Gfx.deco[k] = DECO[k].map((f) => f());
    Gfx.tiles = {};
    for (const k in Gfx.THEMES) {
      const th = Gfx.THEMES[k];
      const far = tileCanvas(); let g = far.getContext("2d");
      g.fillStyle = lin(g, 0, 0, 0, TH, [[0, th.bg[1]], [0.5, th.bg[0]], [1, th.bg[1]]]); g.fillRect(0, 0, TW, TH);
      FAR[k](g, U.rng(th.seed * 101));
      const mid = tileCanvas(); g = mid.getContext("2d");
      MID[k](g, U.rng(th.seed * 307));
      // rock texture tinted for the walls
      const tex = document.createElement("canvas"); tex.width = tex.height = 256;
      g = tex.getContext("2d");
      const rr = U.rng(th.seed * 17);
      for (let i = 0; i < 300; i++) {
        const x = rr() * 256, y = rr() * 256, s = 3 + rr() * 18;
        g.fillStyle = rr() < 0.55 ? `rgba(0,0,0,${0.1 + rr() * 0.25})` : `rgba(255,255,255,${0.04 + rr() * 0.08})`;
        for (const dx of [-256, 0, 256]) for (const dy of [-256, 0, 256]) { g.beginPath(); g.ellipse(x + dx, y + dy, s, s * (0.5 + rr() * 0.4), rr() * 3, 0, TAU); g.fill(); }
      }
      Gfx.tiles[k] = { far, mid, tex };
    }
    const v = document.createElement("canvas"); v.width = 360; v.height = 360;
    const g = v.getContext("2d");
    g.fillStyle = rad(g, 180, 180, 90, 260, [[0, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,0.6)"]]);
    g.fillRect(0, 0, 360, 360);
    Gfx.vignette = v;
    Gfx.dust = [];
    for (let i = 0; i < 90; i++) Gfx.dust.push({ x: Math.random() * TW, y: Math.random() * 720, z: 0.3 + Math.random() * 1.2, s: 0.6 + Math.random() * 1.8 });
  };

  Gfx.draw = function (ctx, key, x, y, rot = 0, scale = 1, white = false, alpha = 1) {
    const c = (white ? Gfx.white : Gfx.spr)[key];
    if (!c) return;
    const w = c.w * scale, h = c.h * scale;
    if (alpha !== 1) ctx.globalAlpha = alpha;
    if (rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.drawImage(c, -w / 2, -h / 2, w, h); ctx.restore(); }
    else ctx.drawImage(c, x - w / 2, y - h / 2, w, h);
    if (alpha !== 1) ctx.globalAlpha = 1;
  };
  Gfx.glowAt = function (ctx, rgb, x, y, r, a = 1, hot = false) {
    ctx.globalAlpha = a;
    ctx.drawImage(Gfx.glow(rgb, hot), x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
  };

  function tileLayer(ctx, img, off, alpha) {
    const o = ((off % TH) + TH) % TH;
    if (alpha !== 1) ctx.globalAlpha = alpha;
    ctx.drawImage(img, 0, o - TH, TW, TH);
    ctx.drawImage(img, 0, o, TW, TH);
    ctx.globalAlpha = 1;
  }

  // Background for the 720 px wide playfield; dist = distance flown in px
  Gfx.drawBackground = function (ctx, key, dist, t) {
    const T = Gfx.tiles[key];
    tileLayer(ctx, T.far, dist * 0.3, 1);
    tileLayer(ctx, T.mid, dist * 0.6, 1);
  };

  Gfx.drawWalls = function (ctx, key, dist, walls, t) {
    const th = Gfx.THEMES[key], T = Gfx.tiles[key];
    if (!T.pat) T.pat = ctx.createPattern(T.tex, "repeat");
    const H = 720;
    for (const side of ["L", "R"]) {
      const fn = walls[side];
      const pts = [];
      for (let y = -16; y <= H + 16; y += 12) pts.push(y, fn(dist + H - y));
      const edgeX = (i) => (side === "L" ? pts[i + 1] : TW - pts[i + 1]);
      const outer = side === "L" ? -10 : TW + 10;
      // drop shadow onto the background
      ctx.beginPath(); ctx.moveTo(outer, -16);
      for (let i = 0; i < pts.length; i += 2) ctx.lineTo(edgeX(i) + (side === "L" ? 18 : -6), pts[i] + 18);
      ctx.lineTo(outer, H + 30); ctx.closePath();
      ctx.fillStyle = "rgba(0,0,0,0.38)"; ctx.fill();
      // wall body
      ctx.beginPath(); ctx.moveTo(outer, -16);
      for (let i = 0; i < pts.length; i += 2) ctx.lineTo(edgeX(i), pts[i]);
      ctx.lineTo(outer, H + 16); ctx.closePath();
      const gr = ctx.createLinearGradient(side === "L" ? 0 : TW, 0, side === "L" ? 160 : TW - 160, 0);
      gr.addColorStop(0, th.wall[2]); gr.addColorStop(0.6, th.wall[1]); gr.addColorStop(1, th.wall[0]);
      ctx.fillStyle = gr; ctx.fill();
      if (T.pat.setTransform && window.DOMMatrix) { T.pat.setTransform(new DOMMatrix().translateSelf(0, dist % 256)); ctx.fillStyle = T.pat; ctx.fill(); }
      // bevel edge
      ctx.beginPath(); ctx.moveTo(edgeX(0), pts[0]);
      for (let i = 2; i < pts.length; i += 2) ctx.lineTo(edgeX(i), pts[i]);
      ctx.strokeStyle = `rgba(${th.edge},0.75)`; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(${th.edge},${0.1 + 0.05 * Math.sin(t * 2)})`; ctx.lineWidth = 10; ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
      // decorations along the edge
      const decos = Gfx.deco[th.deco], sp = 110, seed = th.seed * 13 + (side === "L" ? 0 : 7);
      for (let i = Math.floor((dist - 100) / sp); i <= (dist + H + 100) / sp; i++) {
        const h = U.hash(i, seed);
        if (h > 0.55) continue;
        const w = i * sp + U.hash(i, seed + 1) * 50, y = H - (w - dist), wx = fn(w);
        if (wx < 30) continue;
        const d = decos[Math.floor(U.hash(i, seed + 2) * decos.length)], sc = 0.6 + U.hash(i, seed + 3) * 0.4;
        const x = side === "L" ? wx - d.w * sc * 0.35 : TW - wx + d.w * sc * 0.35;
        ctx.save(); ctx.translate(x, y); ctx.rotate(side === "L" ? Math.PI / 2 : -Math.PI / 2);
        ctx.drawImage(d, -d.w * sc / 2, -d.h * sc, d.w * sc, d.h * sc);
        ctx.restore();
      }
    }
  };

  Gfx.drawForeground = function (ctx, key, dist, t) {
    const th = Gfx.THEMES[key];
    ctx.fillStyle = `rgba(${th.spark},0.5)`;
    for (const p of Gfx.dust) {
      const y = ((p.y + dist * p.z * 0.9 + t * 20 * p.z) % 720 + 720) % 720;
      ctx.globalAlpha = 0.2 + p.z * 0.35;
      ctx.fillRect(p.x, y, p.s * p.z, p.s * p.z * (1 + p.z));
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(Gfx.vignette, 0, 0, TW, 720);
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
