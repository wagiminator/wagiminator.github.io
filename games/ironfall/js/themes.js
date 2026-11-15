/* Ironfall: world themes – parallax backgrounds, tile graphics, liquids and ambient particles */
"use strict";

(function (XA) {
  const { U, Gfx } = XA;
  const W = U.W, H = U.H, TAU = U.TAU;
  const { lin, rad, circ, poly, rr } = Gfx;
  const T = 40; // tile size
  const Theme = (XA.Theme = { T });

  // tile ids
  const TL = (Theme.TL = { EMPTY: 0, ROCK: 1, METAL: 2, PLAT: 3, SPIKE: 4, LIQTOP: 5, LIQ: 6, CRACK: 7, PRIZE: 8, USED: 9 });
  Theme.solid = (t) => t === 1 || t === 2 || t === 7 || t === 8 || t === 9;

  const LW = 1600, LH = 900; // parallax layer canvas size (logical px)
  function layer(draw, seed) {
    const c = document.createElement("canvas");
    c.width = LW; c.height = LH;
    const g = c.getContext("2d");
    g.lineJoin = "round"; g.lineCap = "round";
    draw(g, U.rng(seed));
    return c;
  }
  // draws fn at x and wrapped copies so the layer tiles seamlessly
  const wrapX = (x, w, fn) => { fn(x); if (x - w < 0) fn(x + LW); if (x + w > LW) fn(x - LW); };
  function ridge(g, r, base, amp, step, col, rough = 0.5) {
    // closed periodic ridge line
    const n = Math.ceil(LW / step), pts = [];
    for (let i = 0; i < n; i++) pts.push(base - amp * (0.5 + 0.5 * Math.sin(i * 0.9 + r() * 2)) * (1 - rough + rough * r()));
    g.fillStyle = col;
    g.beginPath(); g.moveTo(0, LH);
    for (let i = 0; i <= n; i++) g.lineTo(i * step, pts[i % n]);
    g.lineTo(LW, LH); g.closePath(); g.fill();
    return pts;
  }

  /* ---------- Theme definitions ---------- */
  const THEMES = {};

  THEMES.frontier = {
    name: "Alien Frontier",
    sky: [[0, "#1a0f3a"], [0.45, "#5a2a6a"], [0.75, "#e0705a"], [1, "#ffc070"]],
    sky2: [[0, "#05061a"], [0.5, "#1a1a4a"], [0.8, "#4a2a5a"], [1, "#8a4a50"]],
    rock: { base: "#6a4a3a", light: "#9a7050", dark: "#2e1e18", line: "rgba(30,15,10,0.35)", spec: "rgba(255,220,170,0.12)" },
    top: { c1: "#4affc0", c2: "#108a6a", tuft: "#7affd8", kind: "grass" },
    metal: ["#8a8f98", "#3a3e46"],
    liquid: { rgb: "60,220,200", deep: "8,60,70", name: "toxic water" },
    ambient: "pollen", fog: "rgba(255,160,120,0.06)",
    layers: [
      { par: 0.06, yb: 0.0, draw(g, r) {
        // ringed planet and moons
        const px = 1100, py = 220;
        g.fillStyle = rad(g, px - 40, py - 40, 10, 150, [[0, "#ffd0a0"], [0.6, "#c06a6a"], [1, "#5a2a4a"]]);
        circ(g, px, py, 130); g.fill();
        g.strokeStyle = "rgba(255,220,190,0.55)"; g.lineWidth = 10;
        g.beginPath(); g.ellipse(px, py, 230, 46, -0.25, 0, TAU); g.stroke();
        g.strokeStyle = "rgba(255,200,160,0.25)"; g.lineWidth = 22;
        g.beginPath(); g.ellipse(px, py, 270, 56, -0.25, 0, TAU); g.stroke();
        g.fillStyle = "#e8e0ff"; circ(g, 360, 140, 26); g.fill();
        g.fillStyle = "rgba(90,60,140,0.6)"; circ(g, 370, 134, 22); g.fill();
        for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.7})`; g.fillRect(r() * LW, r() * 380, 1.5, 1.5); }
      } },
      { par: 0.15, yb: 0.35, draw(g, r) {
        ridge(g, r, 640, 260, 70, "#3a2a5a", 0.6);
        ridge(g, r, 700, 180, 50, "#4a3060", 0.5);
      } },
      { par: 0.32, yb: 0.55, draw(g, r) {
        // mesas with waterfalls
        g.fillStyle = "#2a1e3a";
        let x = 0;
        while (x < LW) {
          const w = 140 + r() * 220, h = 220 + r() * 220, xx = x;
          wrapX(xx, w, (X) => {
            poly(g, [X, LH, X + 20, LH - h, X + w - 20, LH - h - r() * 30, X + w, LH]); g.fill();
          });
          if (r() < 0.5) {
            const wx = xx + w * 0.4;
            g.fillStyle = lin(g, 0, LH - h, 0, LH, [[0, "rgba(120,230,255,0.55)"], [1, "rgba(120,230,255,0.1)"]]);
            g.fillRect(wx, LH - h + 6, 10, h);
            g.fillStyle = "#2a1e3a";
          }
          x += w + 60 + r() * 140;
        }
      } },
      { par: 0.55, yb: 0.75, draw(g, r) {
        // alien mushroom trees
        for (let i = 0; i < 18; i++) {
          const x = r() * LW, h = 140 + r() * 200, cw = 50 + r() * 70;
          wrapX(x, cw, (X) => {
            g.strokeStyle = "#1a1228"; g.lineWidth = 10 + r() * 6;
            g.beginPath(); g.moveTo(X, LH); g.quadraticCurveTo(X + 30, LH - h * 0.6, X + 10, LH - h); g.stroke();
            g.fillStyle = "#1e1430"; g.beginPath(); g.ellipse(X + 10, LH - h, cw, cw * 0.38, 0, Math.PI, TAU); g.fill();
            g.fillStyle = "rgba(120,255,210,0.5)";
            for (let k = 0; k < 5; k++) { circ(g, X + 10 - cw * 0.7 + k * cw * 0.35, LH - h - 2, 3); g.fill(); }
          });
        }
        g.fillStyle = "#160f22"; g.fillRect(0, LH - 40, LW, 40);
      } },
    ],
  };

  THEMES.crystal = {
    name: "Crystal Caverns", indoor: true,
    sky: [[0, "#05040f"], [0.5, "#120a2a"], [1, "#1c1040"]],
    sky2: [[0, "#02030a"], [0.5, "#0a0a24"], [1, "#10204a"]],
    rock: { base: "#3a3a5a", light: "#5e5a8a", dark: "#121226", line: "rgba(10,10,30,0.4)", spec: "rgba(200,220,255,0.1)" },
    top: { c1: "#c0a0ff", c2: "#5a3aa0", tuft: "#ffb0ff", kind: "crystal" },
    metal: ["#8a90b0", "#30344a"],
    liquid: { rgb: "140,120,255", deep: "20,14,60", name: "void water" },
    ambient: "sparkle", fog: "rgba(120,100,255,0.06)",
    layers: [
      { par: 0.1, yb: 0.2, draw(g, r) {
        for (let i = 0; i < 40; i++) {
          const x = r() * LW, y = r() * LH, s = 20 + r() * 60;
          wrapX(x, s, (X) => { g.fillStyle = `rgba(${r() < 0.5 ? "120,90,220" : "60,140,220"},${0.06 + r() * 0.1})`; circ(g, X, y, s * 3); g.fill(); });
        }
        ridge(g, r, 820, 300, 60, "#0e0c22", 0.7);
      } },
      { par: 0.25, yb: 0.4, draw(g, r) {
        // big background crystals
        for (let i = 0; i < 16; i++) {
          const x = r() * LW, h = 150 + r() * 300, w = 30 + r() * 50, tilt = (r() - 0.5) * 0.5, hue = r() < 0.5 ? ["90,60,180", "170,140,255"] : ["40,100,170", "120,220,255"];
          wrapX(x, w + 80, (X) => {
            g.save(); g.translate(X, LH); g.rotate(tilt);
            g.fillStyle = lin(g, -w, 0, w, 0, [[0, `rgba(${hue[0]},0.5)`], [0.5, `rgba(${hue[1]},0.55)`], [1, `rgba(${hue[0]},0.4)`]]);
            poly(g, [-w, 0, -w * 0.7, -h * 0.85, 0, -h, w * 0.7, -h * 0.85, w, 0]); g.fill();
            g.strokeStyle = `rgba(${hue[1]},0.5)`; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -h); g.lineTo(0, 0); g.stroke();
            g.restore();
          });
        }
        g.fillStyle = "#0c0a1e"; g.fillRect(0, LH - 60, LW, 60);
      } },
      { par: 0.5, yb: 0.6, draw(g, r) {
        // stalactites at the top, rocks at the bottom
        g.fillStyle = "#08081a";
        for (let x = 0; x < LW; x += 30 + r() * 50) {
          const h = 40 + r() * 180, w = 20 + r() * 30;
          wrapX(x, w, (X) => { poly(g, [X - w, 0, X, h, X + w, 0]); g.fill(); });
        }
        g.fillRect(0, 0, LW, 30);
        ridge(g, r, LH - 30, 90, 40, "#07071a", 0.8);
        for (let i = 0; i < 30; i++) { const x = r() * LW, y = LH - 40 - r() * 60; wrapX(x, 12, (X) => { g.fillStyle = "rgba(200,160,255,0.6)"; poly(g, [X - 5, y, X, y - 18 - r() * 20, X + 5, y]); g.fill(); }); }
      } },
    ],
  };

  THEMES.hive = {
    name: "Bio Hive", indoor: true,
    sky: [[0, "#1a0208"], [0.5, "#3a0a18"], [1, "#5a1424"]],
    sky2: [[0, "#100208"], [0.5, "#2a0820"], [1, "#401040"]],
    rock: { base: "#6a2230", light: "#a04050", dark: "#260810", line: "rgba(40,5,10,0.4)", spec: "rgba(255,180,190,0.12)" },
    top: { c1: "#ff7a9a", c2: "#8a1a3a", tuft: "#ffb0c0", kind: "flesh" },
    metal: ["#a08890", "#3a2a30"],
    liquid: { rgb: "150,255,60", deep: "30,70,10", name: "acid" },
    ambient: "spore", fog: "rgba(255,80,120,0.06)",
    layers: [
      { par: 0.08, yb: 0.2, draw(g, r) {
        for (let i = 0; i < 26; i++) {
          const x = r() * LW, y = r() * LH, s = 60 + r() * 140;
          wrapX(x, s, (X) => { g.fillStyle = `rgba(${r() < 0.5 ? "120,10,40" : "90,20,70"},0.25)`; circ(g, X, y, s); g.fill(); });
        }
        // veins
        g.strokeStyle = "rgba(255,60,90,0.18)";
        for (let i = 0; i < 26; i++) {
          let x = r() * LW, y = r() * LH; g.lineWidth = 2 + r() * 5;
          g.beginPath(); g.moveTo(x, y);
          for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 160; y += (r() - 0.3) * 120; g.lineTo(x, y); }
          g.stroke();
        }
      } },
      { par: 0.25, yb: 0.4, draw(g, r) {
        // ribbed columns and egg clusters
        for (let i = 0; i < 12; i++) {
          const x = r() * LW, w = 40 + r() * 60;
          wrapX(x, w, (X) => {
            g.fillStyle = lin(g, X - w, 0, X + w, 0, [[0, "#2a0610"], [0.5, "#4a1020"], [1, "#2a0610"]]);
            g.beginPath(); g.moveTo(X - w, 0); g.bezierCurveTo(X - w * 0.3, LH * 0.4, X - w * 0.3, LH * 0.6, X - w, LH); g.lineTo(X + w, LH); g.bezierCurveTo(X + w * 0.3, LH * 0.6, X + w * 0.3, LH * 0.4, X + w, 0); g.fill();
            g.strokeStyle = "rgba(255,90,120,0.18)"; g.lineWidth = 3;
            for (let y = 20; y < LH; y += 36) { g.beginPath(); g.moveTo(X - w * 0.5, y); g.quadraticCurveTo(X, y + 10, X + w * 0.5, y); g.stroke(); }
          });
        }
        for (let i = 0; i < 14; i++) {
          const x = r() * LW, y = LH - 30 - r() * 80;
          wrapX(x, 40, (X) => { for (let k = 0; k < 6; k++) { const ex = X + (r() - 0.5) * 60, ey = y + (r() - 0.5) * 30; g.fillStyle = rad(g, ex - 3, ey - 3, 1, 14, [[0, "rgba(255,230,160,0.7)"], [1, "rgba(160,60,40,0.5)"]]); g.beginPath(); g.ellipse(ex, ey, 10, 13, 0, 0, TAU); g.fill(); } });
        }
      } },
      { par: 0.5, yb: 0.6, draw(g, r) {
        g.fillStyle = "#1a0208";
        for (let x = 0; x < LW; x += 40 + r() * 70) {
          const h = 60 + r() * 160, w = 20 + r() * 30;
          wrapX(x, w, (X) => { g.beginPath(); g.moveTo(X - w, 0); g.quadraticCurveTo(X - 4, h * 0.7, X, h); g.quadraticCurveTo(X + 4, h * 0.7, X + w, 0); g.fill(); });
        }
        g.fillRect(0, 0, LW, 24);
        ridge(g, r, LH - 20, 110, 45, "#160106", 0.8);
      } },
    ],
  };

  THEMES.factory = {
    name: "Steel Foundry", indoor: true,
    sky: [[0, "#100a06"], [0.5, "#2a1408"], [1, "#5a2808"]],
    sky2: [[0, "#06080c"], [0.5, "#121a24"], [1, "#2a2a30"]],
    rock: { base: "#4a4e56", light: "#7a808c", dark: "#1a1c22", line: "rgba(0,0,0,0.35)", spec: "rgba(255,255,255,0.1)", metal: true },
    top: { c1: "#ffd040", c2: "#2a2a2a", tuft: "#ffd040", kind: "hazard" },
    metal: ["#9aa0aa", "#3a3e46"],
    liquid: { rgb: "255,140,30", deep: "120,30,0", name: "molten steel" },
    ambient: "ember", fog: "rgba(255,120,40,0.07)",
    layers: [
      { par: 0.08, yb: 0.2, draw(g, r) {
        // distant furnaces and smokestacks
        for (let i = 0; i < 10; i++) {
          const x = r() * LW, w = 40 + r() * 40, h = 300 + r() * 400;
          wrapX(x, w, (X) => {
            g.fillStyle = "#1c1410"; g.fillRect(X - w / 2, LH - h, w, h);
            g.fillStyle = "rgba(255,140,40,0.35)"; for (let y = LH - h + 30; y < LH; y += 60) g.fillRect(X - w / 2 + 6, y, w - 12, 6);
          });
        }
        g.fillStyle = rad(g, LW / 2, LH, 50, 600, [[0, "rgba(255,120,30,0.35)"], [1, "rgba(255,120,30,0)"]]); g.fillRect(0, 0, LW, LH);
      } },
      { par: 0.25, yb: 0.4, draw(g, r) {
        // girders and big pipes
        g.strokeStyle = "#2a2622"; g.lineWidth = 10;
        for (let x = 0; x < LW; x += 200) {
          g.strokeRect(x + 10, 60, 180, LH - 60);
          g.beginPath(); g.moveTo(x + 10, 60); g.lineTo(x + 190, LH); g.moveTo(x + 190, 60); g.lineTo(x + 10, LH); g.stroke();
        }
        for (let i = 0; i < 5; i++) {
          const y = 100 + r() * (LH - 220), d = 30 + r() * 30;
          g.fillStyle = lin(g, 0, y - d, 0, y + d, [[0, "#5a5650"], [0.4, "#3a3632"], [1, "#16140f"]]);
          g.fillRect(0, y - d, LW, d * 2);
          g.fillStyle = "#24211c"; for (let x = 0; x < LW; x += 160) g.fillRect(x, y - d - 4, 14, d * 2 + 8);
        }
      } },
      { par: 0.5, yb: 0.6, draw(g, r) {
        // machinery silhouettes with warning lights
        for (let x = 0; x < LW; x += 120 + r() * 160) {
          const w = 80 + r() * 120, h = 120 + r() * 220;
          wrapX(x, w, (X) => {
            g.fillStyle = "#0f0d0b"; g.fillRect(X, LH - h, w, h);
            g.fillStyle = "#1a1714"; g.fillRect(X + 8, LH - h + 8, w - 16, 18);
            g.fillStyle = "rgba(255,200,60,0.7)"; circ(g, X + w - 14, LH - h + 17, 4); g.fill();
          });
        }
        // chains from the ceiling
        g.strokeStyle = "#0c0a08"; g.lineWidth = 4;
        for (let i = 0; i < 12; i++) { const x = r() * LW, l = 80 + r() * 260; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, l); g.stroke(); g.fillStyle = "#0c0a08"; g.fillRect(x - 12, l, 24, 18); }
      } },
    ],
  };

  THEMES.core = {
    name: "Machine Core", indoor: true,
    sky: [[0, "#000006"], [0.5, "#020820"], [1, "#04163a"]],
    sky2: [[0, "#06000a"], [0.5, "#16021e"], [1, "#2a0a3a"]],
    rock: { base: "#1e2638", light: "#3a4a66", dark: "#080b14", line: "rgba(0,0,0,0.4)", spec: "rgba(140,220,255,0.12)", metal: true },
    top: { c1: "#40f0ff", c2: "#0a3a50", tuft: "#a0ffff", kind: "neon" },
    metal: ["#7a90b0", "#1a2234"],
    liquid: { rgb: "255,60,220", deep: "70,0,60", name: "plasma" },
    ambient: "data", fog: "rgba(60,160,255,0.06)",
    layers: [
      { par: 0.05, yb: 0.1, draw(g, r) {
        for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${r() < 0.2 ? "180,200,255" : "255,255,255"},${r() * 0.8})`; g.fillRect(r() * LW, r() * LH, 1.6, 1.6); }
        g.fillStyle = rad(g, 500, 300, 10, 380, [[0, "rgba(80,40,200,0.25)"], [1, "rgba(80,40,200,0)"]]); g.fillRect(0, 0, LW, LH);
        g.fillStyle = rad(g, 1300, 600, 10, 300, [[0, "rgba(0,160,255,0.2)"], [1, "rgba(0,160,255,0)"]]); g.fillRect(0, 0, LW, LH);
      } },
      { par: 0.22, yb: 0.35, draw(g, r) {
        // huge machine rings and towers
        for (let i = 0; i < 4; i++) {
          const x = r() * LW, y = 200 + r() * 400, R = 120 + r() * 160;
          wrapX(x, R + 30, (X) => {
            g.strokeStyle = "#0c1222"; g.lineWidth = 34; circ(g, X, y, R); g.stroke();
            g.strokeStyle = "rgba(60,220,255,0.35)"; g.lineWidth = 2; circ(g, X, y, R); g.stroke();
            for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; g.fillStyle = "rgba(80,240,255,0.5)"; circ(g, X + Math.cos(a) * R, y + Math.sin(a) * R, 3); g.fill(); }
          });
        }
        for (let x = 0; x < LW; x += 90 + r() * 120) {
          const w = 40 + r() * 50, h = 200 + r() * 400;
          wrapX(x, w, (X) => { g.fillStyle = "#070a14"; g.fillRect(X, LH - h, w, h); g.fillStyle = "rgba(60,200,255,0.3)"; for (let y = LH - h + 20; y < LH; y += 26) g.fillRect(X + 6, y, w - 12, 2); });
        }
      } },
      { par: 0.48, yb: 0.6, draw(g, r) {
        // circuitry lines and cables
        g.strokeStyle = "rgba(40,160,255,0.22)"; g.lineWidth = 3;
        for (let i = 0; i < 40; i++) {
          let x = r() * LW, y = r() * LH;
          g.beginPath(); g.moveTo(x, y);
          for (let k = 0; k < 5; k++) { if (r() < 0.5) x += (r() - 0.5) * 300; else y += (r() - 0.5) * 200; g.lineTo(x, y); }
          g.stroke();
          g.fillStyle = "rgba(120,240,255,0.5)"; circ(g, x, y, 4); g.fill();
        }
        g.strokeStyle = "#04060c"; g.lineWidth = 12;
        for (let i = 0; i < 8; i++) { const x = r() * LW; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 100, 200, x - 80, 300, x + 40, 420); g.stroke(); }
        ridge(g, r, LH - 10, 70, 80, "#03050a", 0.4);
      } },
    ],
  };
  Theme.THEMES = THEMES;

  /* ---------- Tile sprites ---------- */
  // mask bits: 1 = top open, 2 = right open, 4 = bottom open, 8 = left open
  function paintRock(g, th, mask, r) {
    const rk = th.rock, o = 4;
    g.fillStyle = lin(g, 0, o, 0, o + T, [[0, rk.base], [1, rk.base]]);
    g.fillRect(o, o, T, T);
    if (rk.metal) {
      // riveted plates
      g.fillStyle = lin(g, o, o, o + T, o + T, [[0, rk.light], [0.5, rk.base], [1, rk.dark]]);
      g.fillRect(o + 1, o + 1, T - 2, T - 2);
      g.strokeStyle = rk.line; g.lineWidth = 2; g.strokeRect(o + 1, o + 1, T - 2, T - 2);
      g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(o + 2, o + 2, T - 4, 2);
      g.fillStyle = "rgba(0,0,0,0.35)";
      for (const [x, y] of [[6, 6], [T - 6, 6], [6, T - 6], [T - 6, T - 6]]) { circ(g, o + x, o + y, 2); g.fill(); }
      if (r() < 0.35) { g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(o + 8, o + 16, T - 16, 8); g.fillStyle = th.top.c1 === "#40f0ff" ? "rgba(80,230,255,0.5)" : "rgba(255,180,60,0.35)"; g.fillRect(o + 10, o + 19, (T - 20) * r(), 2); }
    } else {
      // rock with strata, pebbles and speckles
      for (let i = 0; i < 3; i++) {
        g.strokeStyle = rk.line; g.lineWidth = 1 + r() * 1.5;
        const y = o + 6 + r() * (T - 10);
        g.beginPath(); g.moveTo(o, y); g.bezierCurveTo(o + 12, y + (r() - 0.5) * 8, o + 26, y + (r() - 0.5) * 8, o + T, y + (r() - 0.5) * 4); g.stroke();
      }
      for (let i = 0; i < 4; i++) {
        const x = o + 4 + r() * (T - 8), y = o + 4 + r() * (T - 8), s = 2 + r() * 5;
        g.fillStyle = r() < 0.5 ? rk.dark : rk.light; g.globalAlpha = 0.35;
        g.beginPath(); g.ellipse(x, y, s, s * 0.7, r() * 3, 0, TAU); g.fill();
        g.globalAlpha = 1;
      }
      for (let i = 0; i < 14; i++) { g.fillStyle = rk.spec; g.fillRect(o + r() * T, o + r() * T, 1.5, 1.5); }
    }
    // edges
    if (mask & 8) { g.fillStyle = lin(g, o, 0, o + 8, 0, [[0, rk.light], [1, "rgba(0,0,0,0)"]]); g.globalAlpha = 0.5; g.fillRect(o, o, 8, T); g.globalAlpha = 1; g.fillStyle = rk.dark; g.fillRect(o, o, 1.5, T); }
    if (mask & 2) { g.fillStyle = lin(g, o + T - 8, 0, o + T, 0, [[0, "rgba(0,0,0,0)"], [1, rk.dark]]); g.fillRect(o + T - 8, o, 8, T); }
    if (mask & 4) {
      g.fillStyle = lin(g, 0, o + T - 10, 0, o + T, [[0, "rgba(0,0,0,0)"], [1, rk.dark]]); g.fillRect(o, o + T - 10, T, 10);
      if (!rk.metal && th.indoor) { g.fillStyle = rk.dark; for (let i = 0; i < 2; i++) { const x = o + 6 + r() * (T - 12); poly(g, [x - 4, o + T, x, o + T + 4 + r() * 4, x + 4, o + T]); g.fill(); } }
    }
    if (mask & 1) {
      const tp = th.top;
      if (tp.kind === "grass" || tp.kind === "flesh") {
        g.fillStyle = lin(g, 0, o - 2, 0, o + 10, [[0, tp.c1], [1, tp.c2]]);
        g.beginPath(); g.moveTo(o, o + 9);
        for (let x = 0; x <= T; x += 4) g.lineTo(o + x, o + 7 + Math.sin(x * 0.7 + r() * 3) * 2 + r() * 2);
        g.lineTo(o + T, o - 1); g.lineTo(o, o - 1); g.closePath(); g.fill();
        g.strokeStyle = tp.tuft; g.lineWidth = 1.4;
        for (let i = 0; i < 5; i++) { const x = o + 2 + r() * (T - 4); g.beginPath(); g.moveTo(x, o + 1); g.lineTo(x + (r() - 0.5) * 4, o - 3 - r() * 3); g.stroke(); }
        if (tp.kind === "flesh") { g.fillStyle = "rgba(255,230,200,0.5)"; for (let i = 0; i < 2; i++) { circ(g, o + 4 + r() * (T - 8), o + 3, 1.6); g.fill(); } }
      } else if (tp.kind === "crystal") {
        g.fillStyle = lin(g, 0, o, 0, o + 8, [[0, "#6a5aa0"], [1, th.rock.base]]); g.fillRect(o, o, T, 8);
        for (let i = 0; i < 2; i++) {
          if (r() < 0.6) {
            const x = o + 6 + r() * (T - 12), h = 6 + r() * 10, w = 3 + r() * 3;
            g.fillStyle = lin(g, x - w, 0, x + w, 0, [[0, tp.c2], [0.5, tp.c1], [1, tp.tuft]]);
            poly(g, [x - w, o + 2, x - w * 0.5, o + 2 - h, x + w * 0.2, o - h - 2, x + w, o + 2]); g.fill();
          }
        }
        g.fillStyle = "rgba(255,220,255,0.6)"; g.fillRect(o, o, T, 1.5);
      } else if (tp.kind === "hazard") {
        g.fillStyle = "#222"; g.fillRect(o, o, T, 6);
        g.fillStyle = tp.c1;
        for (let x = -8; x < T; x += 10) { poly(g, [o + Math.max(0, x), o, o + Math.min(T, x + 5), o, o + Math.min(T, x + 1), o + 6, o + Math.max(0, x - 4), o + 6]); g.fill(); }
        g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(o, o, T, 1);
      } else if (tp.kind === "neon") {
        g.fillStyle = "#0a1220"; g.fillRect(o, o, T, 6);
        g.fillStyle = tp.c1; g.fillRect(o, o + 1, T, 2);
        g.fillStyle = "rgba(64,240,255,0.25)"; g.fillRect(o, o - 3, T, 3);
      }
    }
  }
  function paintMetal(g, th, r) {
    const o = 4, [c1, c2] = th.metal;
    g.fillStyle = lin(g, o, o, o + T, o + T, [[0, c1], [1, c2]]);
    g.fillRect(o, o, T, T);
    g.strokeStyle = "rgba(0,0,0,0.6)"; g.lineWidth = 2; g.strokeRect(o + 1, o + 1, T - 2, T - 2);
    g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(o + 2, o + T - 2); g.lineTo(o + 2, o + 2); g.lineTo(o + T - 2, o + 2); g.stroke();
    g.strokeStyle = "rgba(0,0,0,0.3)"; g.lineWidth = 3; g.beginPath(); g.moveTo(o + 6, o + 6); g.lineTo(o + T - 6, o + T - 6); g.moveTo(o + T - 6, o + 6); g.lineTo(o + 6, o + T - 6); g.stroke();
    g.fillStyle = "rgba(0,0,0,0.4)"; for (const [x, y] of [[5, 5], [T - 5, 5], [5, T - 5], [T - 5, T - 5]]) { circ(g, o + x, o + y, 1.8); g.fill(); }
  }
  function paintPlat(g, th) {
    const o = 4, [c1, c2] = th.metal;
    g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(o + 2, o + 14, T - 4, 4);
    g.fillStyle = lin(g, 0, o, 0, o + 14, [[0, c1], [1, c2]]);
    g.fillRect(o, o, T, 13);
    g.fillStyle = "rgba(255,255,255,0.4)"; g.fillRect(o, o, T, 2);
    g.fillStyle = "rgba(0,0,0,0.45)"; g.fillRect(o, o + 11, T, 2);
    g.fillStyle = th.top.c1; g.globalAlpha = 0.7; g.fillRect(o + 4, o + 5, T - 8, 2); g.globalAlpha = 1;
    g.strokeStyle = c2; g.lineWidth = 3; g.beginPath(); g.moveTo(o + 8, o + 13); g.lineTo(o + 14, o + 22); g.moveTo(o + T - 8, o + 13); g.lineTo(o + T - 14, o + 22); g.stroke();
  }
  function paintSpike(g, th, down) {
    const o = 4;
    g.save();
    if (down) { g.translate(0, T + 2 * o); g.scale(1, -1); }
    g.fillStyle = "#222";
    g.fillRect(o, o + T - 8, T, 8);
    for (let i = 0; i < 4; i++) {
      const x = o + 5 + i * 10;
      g.fillStyle = lin(g, x - 5, 0, x + 5, 0, [[0, "#606570"], [0.5, "#e8ecf4"], [1, "#50545c"]]);
      poly(g, [x - 5, o + T - 7, x, o + 8, x + 5, o + T - 7]); g.fill();
      g.fillStyle = "rgba(255,60,40,0.8)"; poly(g, [x - 1.2, o + 14, x, o + 8, x + 1.2, o + 14]); g.fill();
    }
    g.restore();
  }
  function paintCrack(g, th, r) {
    paintRock(g, th, 0, r);
    const o = 4;
    g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(o, o, T, T);
    g.strokeStyle = "rgba(0,0,0,0.75)"; g.lineWidth = 2;
    g.beginPath(); g.moveTo(o + 4, o + 6); g.lineTo(o + 16, o + 18); g.lineTo(o + 12, o + 30); g.lineTo(o + 22, o + 38);
    g.moveTo(o + 16, o + 18); g.lineTo(o + 30, o + 14); g.lineTo(o + 36, o + 4); g.moveTo(o + 30, o + 14); g.lineTo(o + 34, o + 30); g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.2)"; g.lineWidth = 1; g.strokeRect(o + 1, o + 1, T - 2, T - 2);
  }
  function paintPrize(g, th, used) {
    const o = 4;
    g.fillStyle = lin(g, o, o, o + T, o + T, used ? [[0, "#5a5e66"], [1, "#2a2c32"]] : [[0, "#e8eef8"], [0.4, "#8a94a8"], [1, "#3a4050"]]);
    rr(g, o + 1, o + 1, T - 2, T - 2, 5); g.fill();
    g.strokeStyle = "rgba(0,0,0,0.7)"; g.lineWidth = 2; g.stroke();
    g.fillStyle = used ? "#1a1c20" : "#14161c"; rr(g, o + 8, o + 8, T - 16, T - 16, 4); g.fill();
    if (!used) {
      g.fillStyle = rad(g, o + T / 2, o + T / 2, 1, 12, [[0, "#ffffff"], [0.3, "#ffe070"], [1, "rgba(255,140,40,0.4)"]]);
      poly(g, [o + T / 2, o + 11, o + T - 11, o + T / 2, o + T / 2, o + T - 11, o + 11, o + T / 2]); g.fill();
    }
    g.fillStyle = "rgba(0,0,0,0.5)"; for (const [x, y] of [[5, 5], [T - 5, 5], [5, T - 5], [T - 5, T - 5]]) { circ(g, o + x, o + y, 1.6); g.fill(); }
  }

  Theme.build = function (key) {
    const th = THEMES[key];
    if (th.tiles) return th;
    const S = 48;
    th.tiles = { rock: [], metal: [], crack: [] };
    for (let m = 0; m < 16; m++) {
      th.tiles.rock[m] = [];
      for (let v = 0; v < 3; v++) th.tiles.rock[m][v] = Gfx.mk(S, S, (g) => paintRock(g, th, m, U.rng(1000 + m * 7 + v * 131)));
    }
    th.tiles.metal = Gfx.mk(S, S, (g) => paintMetal(g, th, U.rng(5)));
    th.tiles.plat = Gfx.mk(S, S, (g) => paintPlat(g, th));
    th.tiles.spikeUp = Gfx.mk(S, S, (g) => paintSpike(g, th, false));
    th.tiles.spikeDown = Gfx.mk(S, S, (g) => paintSpike(g, th, true));
    th.tiles.crack = Gfx.mk(S, S, (g) => paintCrack(g, th, U.rng(77)));
    th.tiles.prize = Gfx.mk(S, S, (g) => paintPrize(g, th, false));
    th.tiles.used = Gfx.mk(S, S, (g) => paintPrize(g, th, true));
    th.layerC = th.layers.map((l, i) => layer(l.draw, 4242 + i * 999 + key.length * 17));
    th.skyGrad = null;
    return th;
  };

  /* ---------- Background drawing ---------- */
  Theme.drawBackground = function (ctx, th, camX, camY, t, variant, levelH) {
    const sky = variant ? th.sky2 : th.sky;
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    for (const [o, c] of sky) gr.addColorStop(o, c);
    ctx.fillStyle = gr; ctx.fillRect(-40, -40, W + 80, H + 80);
    // vertical parallax: 0 at the bottom of the level, negative going up
    const maxY = Math.max(1, levelH - H);
    const vy = U.clamp(camY / maxY, 0, 1); // 0 top .. 1 bottom
    th.layers.forEach((l, i) => {
      const c = th.layerC[i];
      const ox = -((camX * l.par) % LW);
      const oy = H - LH + (1 - vy) * (LH - H) * 0.9 * (0.4 + l.par) + (i === 0 ? 0 : 40);
      const yy = Math.round(oy);
      for (let x = ox - LW; x < W + 40; x += LW) if (x + LW > -40) ctx.drawImage(c, Math.round(x), yy);
    });
    if (variant) { ctx.fillStyle = th.indoor ? "rgba(40,80,160,0.12)" : "rgba(20,30,90,0.25)"; ctx.fillRect(-40, -40, W + 80, H + 80); }
    ctx.fillStyle = th.fog; ctx.fillRect(-40, -40, W + 80, H + 80);
  };

  /* ---------- Tiles ---------- */
  Theme.drawTiles = function (ctx, th, lv, camX, camY, t) {
    const x0 = Math.max(0, Math.floor(camX / T) - 1), x1 = Math.min(lv.w - 1, Math.floor((camX + W) / T) + 1);
    const y0 = Math.max(0, Math.floor(camY / T) - 1), y1 = Math.min(lv.h - 1, Math.floor((camY + H) / T) + 1);
    const tiles = lv.tiles, w = lv.w, tl = th.tiles;
    const liq = [];
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const id = tiles[y * w + x];
        if (!id) continue;
        const px = x * T - camX - 4, py = y * T - camY - 4;
        let c = null;
        switch (id) {
          case 1: c = tl.rock[lv.mask[y * w + x]][(x * 7 + y * 13) % 3]; break;
          case 2: c = tl.metal; break;
          case 3: c = tl.plat; break;
          case 4: c = y > 0 && Theme.solid(tiles[(y - 1) * w + x]) && !(y < lv.h - 1 && Theme.solid(tiles[(y + 1) * w + x])) ? tl.spikeDown : tl.spikeUp; break;
          case 5: case 6: liq.push(x, y, id); continue;
          case 7: c = tl.crack; break;
          case 8: c = tl.prize; break;
          case 9: c = tl.used; break;
        }
        if (c) ctx.drawImage(c, px, py, 48, 48);
        if (id === 1) {
          const d = lv.depth[y * w + x] / 10;
          if (d > 1.2) { ctx.fillStyle = `rgba(0,0,0,${Math.min(0.62, (d - 1.2) * 0.13)})`; ctx.fillRect(px + 4, py + 4, T, T); }
        } else if (id === 8) {
          Gfx.glowAt(ctx, "255,210,90", px + 24, py + 24, 26 + 4 * Math.sin(t * 5 + x), 0.35);
        }
      }
    }
    Theme._liq = liq;
  };
  // liquid is drawn after the entities (semi-transparent front)
  Theme.drawLiquid = function (ctx, th, lv, camX, camY, t) {
    const L = Theme._liq || [], rgb = th.liquid.rgb, deep = th.liquid.deep;
    for (let i = 0; i < L.length; i += 3) {
      const x = L[i], y = L[i + 1], id = L[i + 2];
      const px = x * T - camX, py = y * T - camY;
      if (id === 6) {
        ctx.fillStyle = `rgba(${deep},0.88)`; ctx.fillRect(px, py, T + 0.5, T + 0.5);
      } else {
        const gr = ctx.createLinearGradient(0, py, 0, py + T);
        gr.addColorStop(0, `rgba(${rgb},0.75)`); gr.addColorStop(0.3, `rgba(${rgb},0.55)`); gr.addColorStop(1, `rgba(${deep},0.88)`);
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.moveTo(px, py + T + 0.5);
        for (let k = 0; k <= 4; k++) { const xx = px + k * 10; ctx.lineTo(xx, py + 8 + Math.sin(t * 3 + (x * T + k * 10) * 0.05) * 3); }
        ctx.lineTo(px + T + 0.5, py + T + 0.5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,0.35)`;
        ctx.fillRect(px, py + 8 + Math.sin(t * 3 + x * 2) * 3, T, 1.5);
        if ((x + Math.floor(t * 2)) % 3 === 0) Gfx.glowAt(ctx, rgb, px + 20, py + 10, 34, 0.25);
      }
    }
  };

  /* ---------- Ambient particles ---------- */
  Theme.ambient = function (list, th, camX, camY, dt) {
    const rate = 14;
    if (Math.random() < dt * rate) {
      const p = { x: camX + U.rand(-50, W + 50), y: camY + U.rand(-50, H + 50), t: 0, life: U.rand(3, 7), s: U.rand(1, 3), vx: U.rand(-15, 15), vy: U.rand(-15, 15), ph: U.rand(TAU) };
      if (th.ambient === "ember") { p.y = camY + H + 20; p.vy = -U.rand(40, 110); p.vx = U.rand(-20, 30); }
      if (th.ambient === "data") { p.vx = U.pick([-1, 1]) * U.rand(40, 120); p.vy = 0; }
      if (th.ambient === "spore") { p.vy = U.rand(-25, -5); }
      list.push(p);
    }
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.t += dt; p.x += p.vx * dt + Math.sin(p.t * 2 + p.ph) * 8 * dt; p.y += p.vy * dt;
      if (p.t > p.life) list.splice(i, 1);
    }
  };
  Theme.drawAmbient = function (ctx, list, th, camX, camY) {
    const rgb = { pollen: "255,230,160", sparkle: "200,180,255", spore: "200,255,120", ember: "255,150,50", data: "100,230,255" }[th.ambient];
    for (const p of list) {
      const f = Math.sin(Math.min(1, p.t / p.life) * Math.PI);
      const x = p.x - camX, y = p.y - camY;
      if (th.ambient === "data") { ctx.fillStyle = `rgba(${rgb},${0.6 * f})`; ctx.fillRect(x, y, 10 * p.s, 1.5); continue; }
      Gfx.glowAt(ctx, rgb, x, y, p.s * 5, f * 0.7, th.ambient === "sparkle" && Math.sin(p.t * 9 + p.ph) > 0.7);
    }
  };
})(window.XA);
