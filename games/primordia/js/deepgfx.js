/* PRIMORDIA: graphics of the four later ages (stages 5–8) – themes with four parallax layers, new enemy sprites, obstacles */
"use strict";

(function (XA) {
  const U = XA.U, Gfx = XA.Gfx, TAU = U.TAU;
  const { mk, lin, rad, ell, circ, poly, lamp, wrapDraw, TW, TH } = Gfx.tools;
  const DEF = Gfx.DEF, DECO = Gfx.DECO;
  const PW = 720, PH = 720;

  /* ---------- Enemy sprites (all facing down) ---------- */
  DEF.skimmer = () => mk(36, 60, (g) => {
    g.fillStyle = lin(g, 0, 0, 36, 0, [[0, "#4a0a14"], [0.5, "#c02a3a"], [1, "#4a0a14"]]);
    poly(g, [2, 8, 14, 20, 14, 34, 2, 30]); g.fill(); poly(g, [34, 8, 22, 20, 22, 34, 34, 30]); g.fill();
    g.beginPath(); g.moveTo(18, 59); g.lineTo(25, 30); g.lineTo(23, 4); g.lineTo(13, 4); g.lineTo(11, 30); g.closePath();
    g.fillStyle = lin(g, 11, 0, 25, 0, [[0, "#2a3038"], [0.5, "#e0e8f0"], [1, "#2a3038"]]); g.fill();
    g.strokeStyle = "rgba(10,10,14,0.8)"; g.lineWidth = 1; g.stroke();
    ell(g, 18, 36, 3, 7); g.fillStyle = lin(g, 0, 30, 0, 44, [[0, "#ffe0d0"], [1, "#a01010"]]); g.fill();
    lamp(g, 18, 4, 2.6, "255,80,40");
  });
  DEF.stalker = () => mk(48, 56, (g) => {
    g.strokeStyle = "#1a1a24"; g.lineWidth = 3;
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(24 + s * 8, 18 + i * 9); g.lineTo(24 + s * 20, 12 + i * 12); g.lineTo(24 + s * 22, 22 + i * 12); g.stroke(); }
    g.beginPath(); g.moveTo(24, 54); g.bezierCurveTo(40, 44, 38, 8, 24, 2); g.bezierCurveTo(10, 8, 8, 44, 24, 54); g.closePath();
    g.fillStyle = lin(g, 8, 0, 40, 0, [[0, "#0e2a1a"], [0.4, "#3ac080"], [0.55, "#c8ffe0"], [0.7, "#2a9060"], [1, "#0a1a10"]]); g.fill();
    g.strokeStyle = "rgba(0,20,10,0.8)"; g.lineWidth = 1.2; g.stroke();
    g.strokeStyle = "rgba(0,30,10,0.5)"; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(14, 16 + i * 9); g.quadraticCurveTo(24, 20 + i * 9, 34, 16 + i * 9); g.stroke(); }
    lamp(g, 19, 46, 2.4, "255,240,80"); lamp(g, 29, 46, 2.4, "255,240,80");
  });
  DEF.needle = () => mk(22, 56, (g) => {
    g.beginPath(); g.moveTo(11, 55); g.lineTo(17, 26); g.lineTo(15, 3); g.lineTo(7, 3); g.lineTo(5, 26); g.closePath();
    g.fillStyle = lin(g, 5, 0, 17, 0, [[0, "#4a2a04"], [0.4, "#ffd040"], [0.6, "#fff4b0"], [1, "#4a2a04"]]); g.fill();
    g.strokeStyle = "rgba(30,16,0,0.8)"; g.lineWidth = 1; g.stroke();
    g.fillStyle = "#1a1206"; for (let i = 0; i < 3; i++) g.fillRect(6, 10 + i * 7, 10, 3);
    g.fillStyle = "#3a2a10"; poly(g, [5, 16, 0, 6, 0, 2, 7, 10]); g.fill(); poly(g, [17, 16, 22, 6, 22, 2, 15, 10]); g.fill();
    lamp(g, 11, 3, 2.4, "255,170,40");
  });
  DEF.hornet = () => mk(28, 28, (g) => {
    g.fillStyle = "rgba(200,255,220,0.35)"; ell(g, 6, 11, 6, 9, -0.4); g.fill(); ell(g, 22, 11, 6, 9, 0.4); g.fill();
    g.fillStyle = lin(g, 8, 0, 20, 0, [[0, "#2a1a04"], [0.5, "#e0b020"], [1, "#2a1a04"]]); ell(g, 14, 14, 6, 12); g.fill();
    g.fillStyle = "#14100a"; for (let i = 0; i < 3; i++) g.fillRect(8, 8 + i * 5, 12, 2);
    lamp(g, 14, 24, 2.4, "120,255,140");
  });
  DEF.seeker = () => mk(34, 34, (g) => {
    g.strokeStyle = "#5a606a"; g.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const a = (i * TAU) / 6; g.beginPath(); g.moveTo(17 + Math.cos(a) * 9, 17 + Math.sin(a) * 9); g.lineTo(17 + Math.cos(a) * 15, 17 + Math.sin(a) * 15); g.lineTo(17 + Math.cos(a + 0.5) * 15.5, 17 + Math.sin(a + 0.5) * 15.5); g.stroke(); }
    g.fillStyle = rad(g, 13, 13, 1, 12, [[0, "#d8dee6"], [0.5, "#5a6270"], [1, "#16181c"]]); circ(g, 17, 17, 10.5); g.fill();
    g.fillStyle = "#0a0a0e"; circ(g, 17, 17, 5.5); g.fill();
    lamp(g, 17, 17, 3.4, "255,50,60");
  });
  DEF.warden = () => mk(120, 100, (g) => {
    g.fillStyle = "#1c2026"; g.fillRect(4, 30, 16, 34); g.fillRect(100, 30, 16, 34);
    g.beginPath(); g.moveTo(60, 98); g.lineTo(84, 82); g.lineTo(104, 50); g.lineTo(100, 14); g.lineTo(80, 2); g.lineTo(40, 2); g.lineTo(20, 14); g.lineTo(16, 50); g.lineTo(36, 82); g.closePath();
    g.fillStyle = lin(g, 16, 0, 104, 0, [[0, "#0e1014"], [0.3, "#5a6470"], [0.5, "#b8c0c8"], [0.7, "#4a525c"], [1, "#0e1014"]]); g.fill();
    g.strokeStyle = "rgba(0,0,0,0.75)"; g.lineWidth = 1.5; g.stroke();
    g.strokeStyle = "rgba(0,0,0,0.45)"; g.lineWidth = 1;
    for (const y of [24, 44, 64]) { g.beginPath(); g.moveTo(20, y); g.lineTo(100, y); g.stroke(); }
    g.save(); g.beginPath(); g.rect(52, 14, 16, 56); g.clip();
    g.fillStyle = "#f0b020"; g.fillRect(52, 14, 16, 56); g.fillStyle = "#1a1a1a";
    for (let y = 6; y < 74; y += 8) poly(g, [52, y, 68, y + 8, 68, y + 12, 52, y + 4]), g.fill();
    g.restore();
    g.fillStyle = "#3a4048"; g.fillRect(28, 76, 8, 22); g.fillRect(84, 76, 8, 22);
    g.fillStyle = "#9aa4ae"; g.fillRect(28, 92, 8, 6); g.fillRect(84, 92, 8, 6);
    ell(g, 60, 78, 8, 10); g.fillStyle = lin(g, 0, 68, 0, 88, [[0, "#ffe8c8"], [0.4, "#ff7a20"], [1, "#4a1000"]]); g.fill();
    for (const x of [26, 94]) lamp(g, x, 10, 2.4, "255,90,30");
  });
  DEF.crawler = () => mk(46, 46, (g) => {
    g.fillStyle = "#3a3e46";
    g.beginPath();
    for (let i = 0; i < 24; i++) { const a = (i * TAU) / 24, r = i % 2 ? 17 : 22.5; const x = 23 + Math.cos(a) * r, y = 23 + Math.sin(a) * r; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.closePath(); g.fill();
    g.fillStyle = rad(g, 19, 19, 2, 18, [[0, "#f0f4f8"], [0.6, "#8a94a0"], [1, "#2a2e36"]]); circ(g, 23, 23, 16); g.fill();
    g.strokeStyle = "rgba(20,24,30,0.7)"; g.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) { const a = (i * TAU) / 4; g.beginPath(); g.moveTo(23 + Math.cos(a) * 6, 23 + Math.sin(a) * 6); g.lineTo(23 + Math.cos(a + 0.6) * 15, 23 + Math.sin(a + 0.6) * 15); g.stroke(); }
    g.fillStyle = "#1a1c20"; circ(g, 23, 23, 6); g.fill();
    lamp(g, 23, 23, 2.6, "255,180,40");
  });
  DEF.ark = () => mk(76, 84, (g) => {
    g.beginPath(); g.moveTo(38, 82); g.lineTo(66, 66); g.lineTo(72, 18); g.lineTo(58, 2); g.lineTo(18, 2); g.lineTo(4, 18); g.lineTo(10, 66); g.closePath();
    g.fillStyle = lin(g, 4, 0, 72, 0, [[0, "#2a240c"], [0.4, "#c8b880"], [0.6, "#8a7a40"], [1, "#2a240c"]]); g.fill();
    g.strokeStyle = "rgba(20,16,0,0.8)"; g.lineWidth = 1.2; g.stroke();
    g.save(); g.beginPath(); g.rect(8, 56, 60, 7); g.clip();
    g.fillStyle = "#f0c020"; g.fillRect(8, 56, 60, 7); g.fillStyle = "#141414";
    for (let x = 0; x < 76; x += 8) poly(g, [x, 63, x + 4, 56, x + 8, 56, x + 4, 63]), g.fill();
    g.restore();
    g.fillStyle = "#14161a"; g.fillRect(24, 16, 28, 30);
    g.fillStyle = rad(g, 38, 31, 1, 16, [[0, "#ffffff"], [0.4, "#80ffb0"], [1, "rgba(0,160,80,0.3)"]]); g.fillRect(26, 18, 24, 26);
    lamp(g, 38, 76, 3, "255,220,80");
  });
  DEF.e_bolt = () => mk(30, 12, (g) => {
    g.fillStyle = rad(g, 15, 6, 0, 15, [[0, "rgba(255,120,40,0.6)"], [1, "rgba(255,60,0,0)"]]); g.fillRect(0, 0, 30, 12);
    g.beginPath(); g.moveTo(28, 6); g.lineTo(14, 2.5); g.lineTo(2, 6); g.lineTo(14, 9.5); g.closePath();
    g.fillStyle = lin(g, 2, 0, 28, 0, [[0, "rgba(255,90,30,0.5)"], [0.6, "#ffb060"], [1, "#ffffff"]]); g.fill();
  });
  DEF.e_plasma = () => mk(28, 28, (g) => {
    g.fillStyle = rad(g, 14, 14, 0, 14, [[0, "#ffffff"], [0.25, "#9af0ff"], [0.55, "rgba(40,170,255,0.6)"], [1, "rgba(0,90,255,0)"]]); g.fillRect(0, 0, 28, 28);
  });
  DEF.e_shard = () => mk(26, 12, (g) => {
    g.fillStyle = rad(g, 13, 6, 0, 13, [[0, "rgba(160,240,255,0.55)"], [1, "rgba(80,200,255,0)"]]); g.fillRect(0, 0, 26, 12);
    poly(g, [25, 6, 15, 1.5, 3, 6, 15, 10.5]);
    g.fillStyle = lin(g, 0, 1, 0, 11, [[0, "#ffffff"], [0.5, "#a8f0ff"], [1, "#2a80c0"]]); g.fill();
  });
  DEF.e_ember = () => mk(24, 24, (g) => {
    g.fillStyle = rad(g, 12, 12, 0, 12, [[0, "#ffffff"], [0.25, "#ffd060"], [0.55, "rgba(255,90,20,0.65)"], [1, "rgba(255,40,0,0)"]]); g.fillRect(0, 0, 24, 24);
  });

  /* ---------- Wall decorations of the new ages ---------- */
  function crystal(g, x, y, w, h, a, c1, c2) {
    g.save(); g.translate(x, y); g.rotate(a);
    poly(g, [-w / 2, 0, -w / 2, -h * 0.8, 0, -h, w / 2, -h * 0.8, w / 2, 0]);
    g.fillStyle = lin(g, -w / 2, 0, w / 2, 0, [[0, c1], [0.5, "#f4ffff"], [0.55, c2], [1, c1]]); g.fill();
    g.strokeStyle = "rgba(230,250,255,0.7)"; g.lineWidth = 1; g.stroke();
    g.restore();
  }
  DECO.ice = [
    () => mk(60, 70, (g) => { crystal(g, 30, 70, 14, 64, 0, "#6a90b8", "#b8daf4"); crystal(g, 18, 70, 10, 40, -0.4, "#6a90b8", "#b8daf4"); crystal(g, 44, 70, 10, 34, 0.45, "#6a90b8", "#b8daf4"); }),
    () => mk(70, 40, (g) => { g.fillStyle = rad(g, 35, 30, 2, 34, [[0, "#ffffff"], [0.6, "#b8d8f0"], [1, "#5a7a9a"]]); g.beginPath(); g.ellipse(35, 40, 32, 30, 0, Math.PI, TAU); g.fill(); g.strokeStyle = "rgba(90,130,170,0.6)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(20, 30); g.lineTo(30, 38); g.moveTo(44, 20); g.lineTo(40, 36); g.stroke(); }),
    () => mk(56, 56, (g) => {
      g.fillStyle = rad(g, 28, 30, 4, 28, [[0, "rgba(220,240,255,0.95)"], [1, "rgba(120,170,210,0.9)"]]); g.beginPath(); g.roundRect(4, 8, 48, 48, 8); g.fill();
      g.strokeStyle = "rgba(90,60,30,0.75)"; g.lineWidth = 2; g.beginPath(); for (let a = 0; a < Math.PI * 5; a += 0.15) { const rr = a * 1.4; const x = 28 + Math.cos(a) * rr, y = 32 + Math.sin(a) * rr; if (a === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke();
    }),
  ];
  DECO.ember = [
    () => mk(60, 70, (g) => { for (let i = 0; i < 3; i++) { const x = 14 + i * 16, h = 40 + ((i * 23) % 30); g.fillStyle = lin(g, x, 0, x + 14, 0, [[0, "#1a0e0a"], [0.5, "#4a2a20"], [1, "#140806"]]); g.fillRect(x - 7, 70 - h, 14, h); g.fillStyle = "#ff7a20"; g.fillRect(x - 5, 70 - h, 10, 3); } }),
    () => mk(60, 50, (g) => { g.fillStyle = lin(g, 0, 0, 0, 50, [[0, "#3a2420"], [1, "#120808"]]); poly(g, [6, 50, 18, 10, 42, 10, 54, 50]); g.fill(); g.fillStyle = rad(g, 30, 12, 0, 14, [[0, "#fff0b0"], [0.4, "#ff6a10"], [1, "rgba(255,40,0,0)"]]); ell(g, 30, 12, 14, 8); g.fill(); }),
    () => mk(50, 60, (g) => { g.fillStyle = lin(g, 0, 0, 50, 0, [[0, "#2a1410"], [0.5, "#5a2a1c"], [1, "#1a0a08"]]); poly(g, [8, 60, 22, 0, 40, 60]); g.fill(); g.strokeStyle = "rgba(255,110,30,0.8)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(22, 8); g.lineTo(26, 30); g.lineTo(20, 58); g.stroke(); }),
  ];
  DECO.machine = [
    () => mk(50, 70, (g) => { g.fillStyle = lin(g, 0, 0, 50, 0, [[0, "#2a2e34"], [0.5, "#6a7078"], [1, "#1a1c20"]]); g.fillRect(17, 6, 16, 64); g.fillStyle = "#3a3e44"; for (let y = 14; y < 66; y += 16) g.fillRect(12, y, 26, 4); lamp(g, 25, 6, 3, "255,80,40"); }),
    () => mk(70, 50, (g) => { g.fillStyle = lin(g, 0, 0, 70, 0, [[0, "#22262c"], [0.4, "#6a7078"], [1, "#16181c"]]); g.beginPath(); g.roundRect(6, 10, 58, 40, 6); g.fill(); g.fillStyle = "#f0b020"; for (let i = 0; i < 4; i++) g.fillRect(12 + i * 13, 16, 8, 5); lamp(g, 35, 34, 4, "120,220,255"); }),
    () => mk(60, 60, (g) => { g.fillStyle = "#30353c"; g.beginPath(); for (let i = 0; i < 16; i++) { const a = (i * TAU) / 16, r = i % 2 ? 24 : 29; g.lineTo(30 + Math.cos(a) * r, 30 + Math.sin(a) * r); } g.closePath(); g.fill(); g.fillStyle = "#14161a"; circ(g, 30, 30, 10); g.fill(); }),
  ];
  DECO.star = [
    () => mk(60, 70, (g) => { crystal(g, 30, 70, 14, 64, 0, "#4a2a90", "#c0a0ff"); crystal(g, 18, 70, 10, 36, -0.4, "#2a4a90", "#90c0ff"); crystal(g, 44, 70, 10, 30, 0.45, "#6a2a90", "#e0a0ff"); }),
    () => mk(56, 56, (g) => { g.fillStyle = rad(g, 28, 28, 2, 26, [[0, "#ffffff"], [0.3, "#c8a0ff"], [1, "rgba(80,40,160,0)"]]); circ(g, 28, 28, 26); g.fill(); lamp(g, 28, 28, 6, "220,200,255"); }),
    () => mk(70, 40, (g) => { g.fillStyle = lin(g, 0, 0, 0, 40, [[0, "#3a2a6a"], [1, "#0a0618"]]); g.beginPath(); g.moveTo(0, 40); g.bezierCurveTo(10, 4, 60, 4, 70, 40); g.fill(); for (let i = 0; i < 5; i++) lamp(g, 12 + i * 11, 26 - (i % 2) * 6, 2, "200,180,255"); }),
  ];

  /* ---------- Parallax tiles (720 × 1024, repeated vertically) ---------- */
  const T4 = {
    ice: [
      (g, r) => { // aurora bands and far glaciers
        for (let i = 0; i < 5; i++) {
          const y = r() * TH;
          wrapDraw(g, y, 120, (yy) => {
            g.strokeStyle = `rgba(${r() < 0.5 ? "120,255,200" : "140,180,255"},0.12)`; g.lineWidth = 30 + r() * 30;
            g.beginPath(); g.moveTo(-20, yy); for (let x = 0; x <= TW + 40; x += 60) g.lineTo(x, yy + Math.sin(x * 0.01 + i) * 40); g.stroke();
          });
        }
        for (let i = 0; i < 30; i++) { const x = r() * TW, y = r() * TH, s = 20 + r() * 50; wrapDraw(g, y, s, (yy) => { g.fillStyle = "rgba(160,200,230,0.1)"; poly(g, [x - s, yy + s * 0.6, x, yy - s, x + s * 0.8, yy + s * 0.6]); g.fill(); }); }
      },
      (g, r) => { // drifting ice floes
        for (let i = 0; i < 12; i++) {
          const x = r() * TW, y = r() * TH, s = 40 + r() * 70;
          wrapDraw(g, y, s, (yy) => {
            g.fillStyle = "rgba(170,210,240,0.22)"; g.beginPath();
            for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU, rr = s * (0.6 + 0.4 * U.hash(k, i)); g.lineTo(x + Math.cos(a) * rr, yy + Math.sin(a) * rr * 0.7); }
            g.closePath(); g.fill(); g.strokeStyle = "rgba(230,245,255,0.3)"; g.lineWidth = 1.5; g.stroke();
          });
        }
      },
      (g, r) => { // ancient creatures frozen in ice blocks
        for (let i = 0; i < 6; i++) {
          const x = r() * TW, y = r() * TH, s = 34 + r() * 30;
          wrapDraw(g, y, s, (yy) => {
            g.fillStyle = "rgba(200,230,250,0.35)"; g.beginPath(); g.roundRect(x - s, yy - s * 0.7, s * 2, s * 1.4, 10); g.fill();
            g.strokeStyle = "rgba(90,50,30,0.5)"; g.lineWidth = 2; g.beginPath();
            for (let a = 0; a < Math.PI * 4; a += 0.2) { const rr = a * s / 16; const px = x + Math.cos(a) * rr, py = yy + Math.sin(a) * rr; if (a === 0) g.moveTo(px, py); else g.lineTo(px, py); }
            g.stroke(); g.strokeStyle = "rgba(255,255,255,0.5)"; g.lineWidth = 1; g.strokeRect(x - s + 4, yy - s * 0.7 + 4, s * 2 - 8, s * 1.4 - 8);
          });
        }
      },
      (g, r) => { // close ice shards
        for (let i = 0; i < 14; i++) {
          const x = r() * TW, y = r() * TH, s = 10 + r() * 22, a = r() * TAU;
          wrapDraw(g, y, s * 2, (yy) => { g.save(); g.translate(x, yy); g.rotate(a); g.fillStyle = "rgba(230,245,255,0.4)"; poly(g, [0, -s * 2, s * 0.5, 0, 0, s * 2, -s * 0.5, 0]); g.fill(); g.restore(); });
        }
      },
    ],
    ember: [
      (g, r) => { // glowing lava rivers far below
        for (let i = 0; i < 6; i++) {
          const pts = []; let x = r() * TW; const y0 = r() * TH;
          for (let k = 0; k < 14; k++) { pts.push([x, y0 + k * 80]); x += (r() - 0.5) * 80; }
          g.strokeStyle = "rgba(255,90,20,0.22)"; g.lineWidth = 8 + r() * 10;
          for (const off of [0, -TH]) { g.beginPath(); pts.forEach(([px, py], k) => (k ? g.lineTo(px, py + off) : g.moveTo(px, py + off))); g.stroke(); }
        }
        for (let i = 0; i < 90; i++) { const x = r() * TW, y = r() * TH; g.fillStyle = `rgba(255,${120 + r() * 100 | 0},40,${0.1 + r() * 0.2})`; circ(g, x, y, 1 + r() * 3); g.fill(); }
      },
      (g, r) => { // basalt column fields
        for (let i = 0; i < 16; i++) {
          const x = r() * TW, y = r() * TH, s = 14 + r() * 16;
          wrapDraw(g, y, s * 3, (yy) => {
            for (let k = 0; k < 4; k++) {
              const cx = x + (k % 2) * s * 1.6, cy = yy + k * s * 0.9;
              g.fillStyle = "rgba(30,16,12,0.6)"; g.beginPath(); for (let j = 0; j < 6; j++) { const a = (j * TAU) / 6; g.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s); } g.closePath(); g.fill();
              g.strokeStyle = "rgba(255,120,40,0.28)"; g.lineWidth = 1.2; g.stroke();
            }
          });
        }
      },
      (g, r) => { // smoke plumes
        for (let i = 0; i < 10; i++) {
          const x = r() * TW, y = r() * TH, s = 40 + r() * 60;
          wrapDraw(g, y, s, (yy) => { g.fillStyle = rad(g, x, yy, 4, s, [[0, "rgba(60,40,36,0.35)"], [1, "rgba(30,20,18,0)"]]); circ(g, x, yy, s); g.fill(); });
        }
      },
      (g, r) => { // floating embers and rocks close by
        for (let i = 0; i < 12; i++) {
          const x = r() * TW, y = r() * TH, s = 12 + r() * 18;
          wrapDraw(g, y, s, (yy) => {
            g.fillStyle = "rgba(40,20,14,0.85)"; g.beginPath(); for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; g.lineTo(x + Math.cos(a) * s * (0.7 + 0.3 * U.hash(k, i)), yy + Math.sin(a) * s); } g.closePath(); g.fill();
            g.strokeStyle = "rgba(255,120,30,0.6)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - s * 0.4, yy); g.lineTo(x + s * 0.3, yy + s * 0.3); g.stroke();
          });
        }
      },
    ],
    machine: [
      (g, r) => { // circuit grid and distant factory lights
        g.strokeStyle = "rgba(255,170,60,0.08)"; g.lineWidth = 1;
        for (let x = 0; x <= TW; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, TH); g.stroke(); }
        for (let y = 0; y < TH; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(TW, y); g.stroke(); }
        for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,${150 + r() * 80 | 0},60,${0.15 + r() * 0.25})`; g.fillRect(Math.round(r() * 15) * 48 - 2, Math.round(r() * 16) * 64 - 2, 4, 4); }
      },
      (g, r) => { // large gears
        for (let i = 0; i < 7; i++) {
          const x = r() * TW, y = r() * TH, s = 40 + r() * 60;
          wrapDraw(g, y, s + 12, (yy) => {
            g.fillStyle = "rgba(40,48,58,0.65)"; g.beginPath();
            for (let k = 0; k < 28; k++) { const a = (k * TAU) / 28, rr = k % 2 ? s : s + 10; g.lineTo(x + Math.cos(a) * rr, yy + Math.sin(a) * rr); }
            g.closePath(); g.fill(); g.fillStyle = "rgba(14,18,24,0.7)"; circ(g, x, yy, s * 0.4); g.fill();
          });
        }
      },
      (g, r) => { // girder lattice
        for (let i = 0; i < 5; i++) {
          const x = r() * (TW - 60), y = r() * TH, h = 200 + r() * 200;
          wrapDraw(g, y, h, (yy) => {
            g.strokeStyle = "rgba(70,80,92,0.6)"; g.lineWidth = 5;
            g.beginPath(); g.moveTo(x, yy); g.lineTo(x, yy + h); g.moveTo(x + 40, yy); g.lineTo(x + 40, yy + h);
            for (let k = 0; k < h; k += 40) { g.moveTo(x, yy + k); g.lineTo(x + 40, yy + k + 40); }
            g.stroke();
          });
        }
      },
      (g, r) => { // pipes with signal lights
        for (let i = 0; i < 6; i++) {
          const y = r() * TH, x = r() * TW, w = 140 + r() * 200;
          wrapDraw(g, y, 20, (yy) => {
            g.fillStyle = "rgba(34,40,48,0.9)"; g.fillRect(x, yy, w, 14);
            g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(x, yy + 2, w, 3);
            g.fillStyle = "rgba(255,150,60,0.8)"; for (let k = x + 20; k < x + w; k += 60) g.fillRect(k, yy + 4, 6, 6);
          });
        }
      },
    ],
    star: [
      (g, r) => { // stars and nebulae
        for (let i = 0; i < 9; i++) { const x = r() * TW, y = r() * TH, s = 100 + r() * 160; wrapDraw(g, y, s, (yy) => { g.fillStyle = rad(g, x, yy, 4, s, [[0, `rgba(${r() < 0.5 ? "160,90,255" : "80,160,255"},0.18)`], [1, "rgba(40,20,80,0)"]]); circ(g, x, yy, s); g.fill(); }); }
        for (let i = 0; i < 260; i++) { const s = r() * 1.6 + 0.4; g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.6})`; g.fillRect(r() * TW, r() * TH, s, s); }
      },
      (g, r) => { // distant planets
        for (let i = 0; i < 3; i++) {
          const x = r() * TW, y = r() * TH, s = 30 + r() * 50, hue = r();
          wrapDraw(g, y, s * 1.6, (yy) => {
            g.fillStyle = rad(g, x - s * 0.4, yy - s * 0.4, 2, s * 1.2, [[0, hue < 0.5 ? "rgba(255,200,160,0.8)" : "rgba(160,220,255,0.8)"], [0.7, hue < 0.5 ? "rgba(140,60,40,0.8)" : "rgba(40,80,140,0.8)"], [1, "rgba(10,6,20,0.8)"]]);
            circ(g, x, yy, s); g.fill();
            g.strokeStyle = "rgba(220,200,255,0.4)"; g.lineWidth = 3; g.beginPath(); g.ellipse(x, yy, s * 1.6, s * 0.35, -0.3, 0, TAU); g.stroke();
          });
        }
      },
      (g, r) => { // asteroid fragments
        for (let i = 0; i < 16; i++) {
          const x = r() * TW, y = r() * TH, s = 8 + r() * 22;
          wrapDraw(g, y, s, (yy) => { g.fillStyle = "rgba(60,50,90,0.75)"; g.beginPath(); for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU; g.lineTo(x + Math.cos(a) * s * (0.6 + 0.4 * U.hash(k, i + 3)), yy + Math.sin(a) * s * (0.6 + 0.4 * U.hash(k + 9, i))); } g.closePath(); g.fill(); g.strokeStyle = "rgba(200,180,255,0.3)"; g.lineWidth = 1; g.stroke(); });
        }
      },
      (g, r) => { // comet streaks
        for (let i = 0; i < 8; i++) {
          const x = r() * TW, y = r() * TH, l = 60 + r() * 100;
          wrapDraw(g, y, l, (yy) => {
            g.strokeStyle = lin(g, x, yy - l, x, yy, [[0, "rgba(180,200,255,0)"], [1, "rgba(220,230,255,0.5)"]]); g.lineWidth = 2;
            g.beginPath(); g.moveTo(x, yy - l); g.lineTo(x, yy); g.stroke(); g.fillStyle = "rgba(255,255,255,0.8)"; circ(g, x, yy, 2.2); g.fill();
          });
        }
      },
    ],
  };

  /* ---------- Foreground particles ---------- */
  const foreP = [];
  for (let i = 0; i < 40; i++) foreP.push({ x: Math.random() * PW, y: Math.random() * PH, z: 1.2 + Math.random() * 0.9, s: 1 + Math.random() * 2.2, p: Math.random() * TAU });
  function fore(ctx, dist, t, rgb, kind) {
    ctx.globalCompositeOperation = kind === "snow" ? "source-over" : "lighter";
    for (const p of foreP) {
      let x = p.x, y = (((p.y + dist * p.z) % PH) + PH) % PH;
      if (kind === "snow") { x = ((x + Math.sin(t + p.p) * 24 + t * 14 * p.z) % PW + PW) % PW; y = (y + t * 30 * p.z) % PH; }
      else if (kind === "ember") { x = (x + Math.sin(t * 2 + p.p) * 10 + PW) % PW; y = ((y - t * 90 * p.z) % PH + PH) % PH; }
      const a = kind === "twinkle" ? 0.3 + 0.6 * Math.max(0, Math.sin(t * 3 + p.p * 5)) : 0.6;
      ctx.fillStyle = `rgba(${rgb},${a})`;
      if (kind === "spark") ctx.fillRect(x, y, 1.5, p.s * p.z * 3);
      else ctx.fillRect(x, y, p.s * p.z, p.s * p.z);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  Object.assign(Gfx.THEMES, {
    ice: { bg: ["#2e6488", "#14344e", "#06121e"], deco: "ice", wall: ["#e4f0fa", "#7a9cba", "#1c2c44"], edge: "225,248,255", seed: 13, spark: "235,245,255",
      layers: T4.ice, par: [0.12, 0.3, 0.52, 0.76], fore: (c, d, t) => fore(c, d, t, "240,248,255", "snow") },
    ember: { bg: ["#4e180a", "#260a04", "#0a0302"], deco: "ember", wall: ["#4a3028", "#20120e", "#080404"], edge: "255,120,40", seed: 15, spark: "255,170,90",
      layers: T4.ember, par: [0.12, 0.3, 0.5, 0.78], fore: (c, d, t) => fore(c, d, t, "255,140,50", "ember"),
      under: (ctx, d, t) => { ctx.fillStyle = `rgba(255,70,10,${0.05 + 0.04 * Math.sin(t * 1.7)})`; ctx.fillRect(0, 0, PW, PH); } },
    machine: { bg: ["#1c2632", "#0c121a", "#04070a"], deco: "machine", wall: ["#7c8694", "#363c46", "#101318"], edge: "255,170,60", seed: 17, spark: "255,200,120",
      layers: T4.machine, par: [0.1, 0.28, 0.5, 0.8], fore: (c, d, t) => fore(c, d, t, "255,190,90", "spark") },
    star: { bg: ["#180c36", "#0a061c", "#020108"], deco: "star", wall: ["#40307a", "#1a1238", "#06040e"], edge: "190,150,255", seed: 19, spark: "220,200,255",
      layers: T4.star, par: [0.08, 0.22, 0.45, 0.85], fore: (c, d, t) => fore(c, d, t, "230,220,255", "twinkle") },
  });

  /* ---------- Fixed obstacles ---------- */
  // o = { kind, from: "L" | "R" | "free" }, screen rectangle x, y, w, h
  Gfx.drawObstacle = function (ctx, o, x, y, w, h, t) {
    ctx.save();
    const tipL = o.from === "R", tipR = o.from === "L";
    switch (o.kind) {
      case "ice": {
        ctx.beginPath();
        ctx.moveTo(x + (tipL ? 18 : 0), y); ctx.lineTo(x + w - (tipR ? 18 : 0), y);
        if (tipR) { ctx.lineTo(x + w, y + h * 0.4); ctx.lineTo(x + w - 10, y + h); } else ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + (tipL ? 10 : 0), y + h);
        if (tipL) ctx.lineTo(x, y + h * 0.5);
        ctx.closePath();
        const gr = ctx.createLinearGradient(0, y, 0, y + h);
        gr.addColorStop(0, "#f4faff"); gr.addColorStop(0.5, "#b0cce6"); gr.addColorStop(1, "#5a7ca0");
        ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.clip();
        ctx.strokeStyle = "rgba(90,130,180,0.55)"; ctx.lineWidth = 1.2; ctx.beginPath();
        for (let k = 0; k < w / 50; k++) { const xx = x + 20 + k * 50; ctx.moveTo(xx, y + 4); ctx.lineTo(xx + 12, y + h * 0.5); ctx.lineTo(xx + 4, y + h - 4); }
        ctx.stroke();
        break;
      }
      case "ember": {
        const gr = ctx.createLinearGradient(0, y, 0, y + h);
        gr.addColorStop(0, "#5a3a30"); gr.addColorStop(0.5, "#2a1610"); gr.addColorStop(1, "#0c0504");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill();
        ctx.clip();
        const pul = 0.5 + 0.5 * Math.sin(t * 3 + x * 0.02);
        ctx.strokeStyle = `rgba(255,${100 + 60 * pul | 0},30,${0.6 + 0.3 * pul})`; ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let k = 0; k < w / 40; k++) { const xx = x + 10 + k * 40; ctx.moveTo(xx, y); ctx.lineTo(xx + 14, y + h * 0.4); ctx.lineTo(xx + 6, y + h * 0.7); ctx.lineTo(xx + 20, y + h); }
        ctx.stroke();
        ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,90,20", x + w / 2, y + h, Math.min(80, w), 0.3 * pul);
        break;
      }
      case "machine": {
        const gr = ctx.createLinearGradient(0, y, 0, y + h);
        gr.addColorStop(0, "#9aa2ac"); gr.addColorStop(0.35, "#5a626c"); gr.addColorStop(1, "#16181c");
        ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(x, y + h * 0.3, w, h * 0.4);
        ctx.fillStyle = "#3a3f46"; for (let xx = x + 24; xx < x + w; xx += 48) ctx.fillRect(xx, y + h * 0.3, 6, h * 0.4);
        ctx.fillStyle = "rgba(255,255,255,0.35)"; for (let xx = x + 10; xx < x + w; xx += 22) { ctx.fillRect(xx, y + 3, 3, 3); ctx.fillRect(xx, y + h - 6, 3, 3); }
        const cap = (cx) => {
          ctx.save(); ctx.beginPath(); ctx.rect(cx, y, 14, h); ctx.clip();
          ctx.fillStyle = "#f0b020"; ctx.fillRect(cx, y, 14, h); ctx.fillStyle = "#141414";
          for (let s = -14; s < h + 14; s += 12) { ctx.beginPath(); ctx.moveTo(cx, y + s); ctx.lineTo(cx + 14, y + s - 14); ctx.lineTo(cx + 14, y + s - 8); ctx.lineTo(cx, y + s + 6); ctx.fill(); }
          ctx.restore();
        };
        if (o.from !== "L") cap(x); if (o.from !== "R") cap(x + w - 14);
        ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,90,40", o.from === "R" ? x + 22 : x + w - 22, y + h / 2, 10 + 4 * Math.sin(t * 6), 0.9, true);
        break;
      }
      case "star": {
        const gr = ctx.createLinearGradient(0, y, 0, y + h);
        gr.addColorStop(0, "rgba(200,170,255,0.95)"); gr.addColorStop(0.5, "rgba(90,50,180,0.95)"); gr.addColorStop(1, "rgba(30,14,70,0.95)");
        ctx.beginPath();
        const tip = Math.min(30, h * 0.8);
        ctx.moveTo(x + (tipL ? tip : 0), y); ctx.lineTo(x + w - (tipR ? tip : 0), y);
        if (tipR) ctx.lineTo(x + w, y + h / 2); else ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w - (tipR ? tip : 0), y + h); ctx.lineTo(x + (tipL ? tip : 0), y + h);
        if (tipL) ctx.lineTo(x, y + h / 2); else ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = "rgba(230,210,255,0.85)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.clip();
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = `rgba(220,190,255,${0.3 + 0.2 * Math.sin(t * 2 + x * 0.01)})`; ctx.lineWidth = 2;
        ctx.beginPath(); for (let xx = x + 16; xx < x + w; xx += 40) { ctx.moveTo(xx, y); ctx.lineTo(xx + 20, y + h); } ctx.stroke();
        Gfx.glowAt(ctx, "180,140,255", x + w / 2, y + h / 2, Math.min(70, w * 0.6), 0.35);
        break;
      }
    }
    ctx.restore();
  };

  /* ---------- Edge warnings ---------- */
  Gfx.drawWarn = function (ctx, w) {
    const a = 0.5 + 0.5 * Math.sin(w.t * 18);
    ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(w.a);
    ctx.globalCompositeOperation = "lighter";
    Gfx.glowAt(ctx, "255,60,40", 0, 0, 34, 0.35 * a);
    ctx.fillStyle = `rgba(255,${90 + 100 * a | 0},60,${0.6 + 0.4 * a})`;
    for (const o of [0, 14]) { ctx.beginPath(); ctx.moveTo(o + 12, 0); ctx.lineTo(o - 4, -12); ctx.lineTo(o - 4, -5); ctx.lineTo(o + 3, 0); ctx.lineTo(o - 4, 5); ctx.lineTo(o - 4, 12); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  };
})(window.XA);
