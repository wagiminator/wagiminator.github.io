/* X-Abyss: graphics of the deep zone (stages 5–8) – themes with multi-layer parallax, new enemy sprites, obstacles */
"use strict";

(function (XA) {
  const U = XA.U, Gfx = XA.Gfx, W = U.W, H = U.H, TAU = U.TAU;
  const { mk, lin, rad, ell, circ, poly, lamp } = Gfx.tools;
  const DEF = Gfx.DEF, DECO = Gfx.DECO;

  /* ---------- Enemy sprites (all facing left) ---------- */
  DEF.raptor = () => mk(64, 30, (g) => {
    g.fillStyle = lin(g, 0, 0, 0, 12, [[0, "#a03030"], [1, "#3a0c0c"]]);
    poly(g, [30, 10, 50, 0, 58, 1, 48, 12]); g.fill();
    poly(g, [30, 20, 50, 30, 58, 29, 48, 18]); g.fill();
    g.beginPath(); g.moveTo(2, 15); g.lineTo(24, 8); g.lineTo(54, 9); g.lineTo(62, 12); g.lineTo(62, 18); g.lineTo(54, 21); g.lineTo(24, 22); g.closePath();
    g.fillStyle = lin(g, 0, 8, 0, 22, [[0, "#e6ecf2"], [0.3, "#8a96a4"], [0.7, "#353c46"], [1, "#12161c"]]); g.fill();
    g.strokeStyle = "rgba(10,12,16,0.8)"; g.lineWidth = 1; g.stroke();
    g.fillStyle = "#e02a2a"; poly(g, [14, 15, 44, 13, 50, 15, 44, 17]); g.fill();
    ell(g, 26, 12.5, 7, 2.6); g.fillStyle = lin(g, 0, 10, 0, 15, [[0, "#ffe0d0"], [1, "#a01010"]]); g.fill();
    lamp(g, 60, 15, 2.6, "255,80,40");
  });
  DEF.diver = () => mk(50, 40, (g) => {
    g.fillStyle = lin(g, 0, 0, 0, 40, [[0, "#3a4a6a"], [1, "#0c1220"]]);
    g.beginPath(); g.moveTo(4, 20); g.quadraticCurveTo(20, 2, 46, 4); g.lineTo(36, 20); g.lineTo(46, 36); g.quadraticCurveTo(20, 38, 4, 20); g.fill();
    g.strokeStyle = "rgba(140,170,220,0.6)"; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = lin(g, 0, 12, 0, 28, [[0, "#c8d4e8"], [0.5, "#6a7a98"], [1, "#1c2436"]]);
    ell(g, 22, 20, 15, 7); g.fill();
    g.strokeStyle = "rgba(255,200,60,0.85)"; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(14, 13); g.lineTo(38, 7); g.moveTo(14, 27); g.lineTo(38, 33); g.stroke();
    lamp(g, 12, 20, 3.2, "255,200,40");
  });
  DEF.lancer = () => mk(58, 18, (g) => {
    g.beginPath(); g.moveTo(1, 9); g.lineTo(30, 4); g.lineTo(56, 5); g.lineTo(56, 13); g.lineTo(30, 14); g.closePath();
    g.fillStyle = lin(g, 0, 4, 0, 14, [[0, "#fff2a0"], [0.4, "#e0a020"], [1, "#4a2a04"]]); g.fill();
    g.strokeStyle = "rgba(30,16,0,0.8)"; g.lineWidth = 1; g.stroke();
    g.fillStyle = "#1a1206";
    for (let i = 0; i < 3; i++) poly(g, [32 + i * 7, 4.5, 36 + i * 7, 4.5, 33 + i * 7, 13.5, 29 + i * 7, 13.5]), g.fill();
    g.fillStyle = "#3a2a10"; poly(g, [40, 5, 50, 0, 54, 0, 50, 6]); g.fill(); poly(g, [40, 13, 50, 18, 54, 18, 50, 12]); g.fill();
    lamp(g, 56, 9, 2.4, "255,170,40");
  });
  DEF.warden = () => mk(140, 70, (g) => {
    g.fillStyle = "#1c2026"; g.fillRect(96, 4, 18, 14); g.fillRect(96, 52, 18, 14);
    g.beginPath(); g.moveTo(4, 36); g.lineTo(22, 20); g.lineTo(60, 12); g.lineTo(124, 12); g.lineTo(138, 26); g.lineTo(138, 46); g.lineTo(124, 58); g.lineTo(60, 58); g.lineTo(22, 52); g.closePath();
    g.fillStyle = lin(g, 0, 12, 0, 58, [[0, "#b8c0c8"], [0.25, "#6e7884"], [0.65, "#2e343c"], [1, "#0e1014"]]); g.fill();
    g.strokeStyle = "rgba(0,0,0,0.75)"; g.lineWidth = 1.5; g.stroke();
    g.strokeStyle = "rgba(0,0,0,0.45)"; g.lineWidth = 1;
    for (const x of [40, 70, 100]) { g.beginPath(); g.moveTo(x, 13); g.lineTo(x, 57); g.stroke(); }
    // hazard band
    g.save(); g.beginPath(); g.rect(52, 30, 60, 8); g.clip();
    g.fillStyle = "#f0b020"; g.fillRect(52, 30, 60, 8); g.fillStyle = "#1a1a1a";
    for (let x = 44; x < 116; x += 8) poly(g, [x, 38, x + 4, 30, x + 8, 30, x + 4, 38]), g.fill();
    g.restore();
    // guns
    g.fillStyle = "#3a4048"; g.fillRect(0, 22, 26, 6); g.fillRect(0, 42, 26, 6);
    g.fillStyle = "#9aa4ae"; g.fillRect(0, 23, 6, 4); g.fillRect(0, 43, 6, 4);
    ell(g, 46, 24, 12, 6); g.fillStyle = lin(g, 0, 18, 0, 30, [[0, "#ffe8c8"], [0.4, "#ff7a20"], [1, "#4a1000"]]); g.fill();
    for (const y of [16, 54]) lamp(g, 120, y, 2.4, "255,90,30");
    lamp(g, 136, 36, 3.5, "255,140,60");
  });
  DEF.seeker = () => mk(34, 34, (g) => {
    g.strokeStyle = "#5a606a"; g.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6;
      g.beginPath(); g.moveTo(17 + Math.cos(a) * 9, 17 + Math.sin(a) * 9); g.lineTo(17 + Math.cos(a) * 15, 17 + Math.sin(a) * 15); g.lineTo(17 + Math.cos(a + 0.5) * 15.5, 17 + Math.sin(a + 0.5) * 15.5); g.stroke();
    }
    g.fillStyle = rad(g, 13, 13, 1, 12, [[0, "#d8dee6"], [0.5, "#5a6270"], [1, "#16181c"]]); circ(g, 17, 17, 10.5); g.fill();
    g.fillStyle = "#0a0a0e"; circ(g, 17, 17, 5.5); g.fill();
    lamp(g, 17, 17, 3.4, "255,50,60");
  });
  DEF.blade = () => mk(46, 46, (g) => {
    g.fillStyle = "#3a3e46";
    g.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = (i * TAU) / 24, r = i % 2 ? 17 : 22.5;
      const x = 23 + Math.cos(a) * r, y = 23 + Math.sin(a) * r;
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.closePath(); g.fill();
    g.fillStyle = rad(g, 19, 19, 2, 18, [[0, "#f0f4f8"], [0.6, "#8a94a0"], [1, "#2a2e36"]]); circ(g, 23, 23, 16); g.fill();
    g.strokeStyle = "rgba(20,24,30,0.7)"; g.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) { const a = (i * TAU) / 4; g.beginPath(); g.moveTo(23 + Math.cos(a) * 6, 23 + Math.sin(a) * 6); g.lineTo(23 + Math.cos(a + 0.6) * 15, 23 + Math.sin(a + 0.6) * 15); g.stroke(); }
    g.fillStyle = "#1a1c20"; circ(g, 23, 23, 6); g.fill();
    lamp(g, 23, 23, 2.6, "255,180,40");
  });
  DEF.swarm = () => mk(28, 18, (g) => {
    g.fillStyle = "rgba(160,255,200,0.35)"; ell(g, 18, 4, 8, 3, -0.3); g.fill(); ell(g, 18, 14, 8, 3, 0.3); g.fill();
    g.fillStyle = lin(g, 0, 3, 0, 15, [[0, "#6a7a5a"], [1, "#141a10"]]); ell(g, 15, 9, 12, 6); g.fill();
    g.strokeStyle = "rgba(0,0,0,0.6)"; g.lineWidth = 1; g.stroke();
    lamp(g, 5, 9, 2.6, "120,255,120");
  });
  DEF.freighter = () => mk(96, 48, (g) => {
    g.beginPath(); g.moveTo(6, 24); g.lineTo(18, 8); g.lineTo(84, 8); g.lineTo(94, 18); g.lineTo(94, 32); g.lineTo(84, 42); g.lineTo(18, 42); g.closePath();
    g.fillStyle = lin(g, 0, 8, 0, 42, [[0, "#d8c890"], [0.3, "#8a7a40"], [1, "#2a240c"]]); g.fill();
    g.strokeStyle = "rgba(20,16,0,0.8)"; g.lineWidth = 1.2; g.stroke();
    g.save(); g.beginPath(); g.rect(22, 30, 58, 7); g.clip();
    g.fillStyle = "#f0c020"; g.fillRect(22, 30, 58, 7); g.fillStyle = "#141414";
    for (let x = 16; x < 84; x += 8) poly(g, [x, 37, x + 4, 30, x + 8, 30, x + 4, 37]), g.fill();
    g.restore();
    g.fillStyle = "#14161a"; g.fillRect(40, 12, 26, 16);
    g.fillStyle = rad(g, 53, 20, 1, 12, [[0, "#ffffff"], [0.4, "#80ffb0"], [1, "rgba(0,160,80,0.3)"]]); g.fillRect(42, 14, 22, 12);
    lamp(g, 10, 24, 3, "255,220,80");
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

  /* ---------- Decorations of the new themes (anchored at the bottom centre) ---------- */
  DECO.foundry = [
    () => mk(60, 110, (g) => {
      g.fillStyle = lin(g, 0, 0, 60, 0, [[0, "#2a2e34"], [0.5, "#5a6068"], [1, "#1a1c20"]]);
      g.fillRect(18, 10, 24, 100);
      g.fillStyle = "#3a3e44"; for (let y = 20; y < 106; y += 22) g.fillRect(14, y, 32, 5);
      g.fillStyle = rad(g, 30, 8, 0, 14, [[0, "rgba(255,160,60,0.9)"], [1, "rgba(255,90,20,0)"]]); circ(g, 30, 8, 14); g.fill();
    }),
    () => mk(100, 60, (g) => {
      g.strokeStyle = "#3e434a"; g.lineWidth = 9;
      g.beginPath(); g.moveTo(10, 60); g.lineTo(10, 24); g.quadraticCurveTo(10, 10, 26, 10); g.lineTo(74, 10); g.quadraticCurveTo(90, 10, 90, 26); g.lineTo(90, 60); g.stroke();
      g.strokeStyle = "rgba(255,255,255,0.12)"; g.lineWidth = 2; g.stroke();
      g.fillStyle = "#24282e"; for (const x of [30, 50, 70]) g.fillRect(x - 4, 4, 8, 12);
    }),
    () => mk(70, 70, (g) => {
      g.fillStyle = lin(g, 0, 0, 70, 0, [[0, "#22262c"], [0.4, "#6a7078"], [1, "#16181c"]]);
      g.beginPath(); g.roundRect(8, 14, 54, 56, 8); g.fill();
      g.fillStyle = "#1a1c20"; g.fillRect(8, 30, 54, 4); g.fillRect(8, 50, 54, 4);
      g.fillStyle = "#f0b020"; g.fillRect(28, 6, 14, 8);
      lamp(g, 50, 22, 2.5, "255,80,40");
    }),
    () => mk(40, 120, (g) => {
      g.strokeStyle = "#353a40"; g.lineWidth = 3;
      g.beginPath(); g.moveTo(20, 120); g.lineTo(20, 14); g.moveTo(8, 120); g.lineTo(20, 40); g.lineTo(32, 120); g.moveTo(10, 30); g.lineTo(30, 30); g.stroke();
      lamp(g, 20, 10, 3.2, "255,50,40");
    }),
  ];
  function crystal(g, x, y, w, h, a, c1, c2) {
    g.save(); g.translate(x, y); g.rotate(a);
    poly(g, [-w / 2, 0, -w / 2, -h * 0.8, 0, -h, w / 2, -h * 0.8, w / 2, 0]);
    g.fillStyle = lin(g, -w / 2, 0, w / 2, 0, [[0, c1], [0.5, "#e8ffff"], [0.55, c2], [1, c1]]); g.fill();
    g.strokeStyle = "rgba(220,255,255,0.7)"; g.lineWidth = 1; g.stroke();
    g.restore();
  }
  DECO.crystal = [
    () => mk(80, 100, (g) => { crystal(g, 40, 100, 18, 90, 0, "#1a6a80", "#40c0d8"); crystal(g, 28, 100, 14, 60, -0.35, "#1a5a70", "#30a8c8"); crystal(g, 54, 100, 12, 50, 0.4, "#1a5a70", "#30a8c8"); }),
    () => mk(60, 60, (g) => { crystal(g, 30, 60, 16, 52, 0.1, "#4a2a80", "#a070f0"); crystal(g, 18, 60, 10, 34, -0.5, "#4a2a80", "#a070f0"); }),
    () => mk(70, 50, (g) => { for (let i = 0; i < 5; i++) crystal(g, 10 + i * 12, 50, 9, 18 + ((i * 17) % 26), (i - 2) * 0.22, "#1a6a60", "#50e0c0"); }),
    () => mk(50, 120, (g) => { crystal(g, 25, 120, 20, 116, 0.05, "#1a5a80", "#60d0ff"); }),
  ];
  DECO.ice = [
    () => mk(60, 110, (g) => {
      g.fillStyle = lin(g, 0, 0, 60, 0, [[0, "#9ab8d0"], [0.45, "#f0f8ff"], [1, "#6a88a8"]]);
      poly(g, [8, 110, 22, 30, 30, 0, 38, 36, 52, 110]); g.fill();
      g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 1; g.stroke();
    }),
    () => mk(90, 50, (g) => {
      g.fillStyle = lin(g, 0, 0, 0, 50, [[0, "#ffffff"], [1, "#7a9ab8"]]);
      g.beginPath(); g.moveTo(0, 50); g.lineTo(14, 18); g.lineTo(34, 10); g.lineTo(52, 22); g.lineTo(70, 6); g.lineTo(90, 50); g.closePath(); g.fill();
      g.strokeStyle = "rgba(120,170,210,0.6)"; g.lineWidth = 1; g.beginPath(); g.moveTo(30, 14); g.lineTo(38, 40); g.moveTo(66, 12); g.lineTo(60, 44); g.stroke();
    }),
    () => mk(70, 80, (g) => {
      for (let i = 0; i < 4; i++) {
        const x = 12 + i * 15, h = 40 + ((i * 23) % 40);
        g.fillStyle = lin(g, 0, 80 - h, 0, 80, [[0, "#ffffff"], [1, "#88aacc"]]);
        poly(g, [x - 6, 80, x, 80 - h, x + 6, 80]); g.fill();
      }
    }),
    () => mk(60, 40, (g) => {
      g.fillStyle = rad(g, 30, 30, 2, 32, [[0, "#ffffff"], [0.6, "#b8d8f0"], [1, "#5a7a9a"]]);
      g.beginPath(); g.ellipse(30, 40, 28, 30, 0, Math.PI, TAU); g.fill();
    }),
  ];
  DECO.core = [
    () => mk(50, 120, (g) => {
      g.fillStyle = lin(g, 0, 0, 50, 0, [[0, "#140608"], [0.5, "#3a1a20"], [1, "#0a0204"]]);
      poly(g, [10, 120, 18, 10, 32, 10, 40, 120]); g.fill();
      g.fillStyle = "#ff2a50"; for (let y = 24; y < 112; y += 18) g.fillRect(22, y, 6, 8);
      lamp(g, 25, 8, 3.5, "255,40,80");
    }),
    () => mk(100, 70, (g) => {
      g.strokeStyle = "#2a1016"; g.lineWidth = 6;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(8 + i * 26, 70); g.bezierCurveTo(10 + i * 26, 20, 60 + i * 8, 40, 90 - i * 4, 4 + i * 6); g.stroke(); }
      g.strokeStyle = "rgba(255,40,80,0.5)"; g.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(8 + i * 26, 70); g.bezierCurveTo(10 + i * 26, 20, 60 + i * 8, 40, 90 - i * 4, 4 + i * 6); g.stroke(); }
    }),
    () => mk(80, 60, (g) => {
      g.fillStyle = lin(g, 0, 0, 0, 60, [[0, "#4a2028"], [1, "#0c0406"]]);
      g.beginPath(); g.moveTo(0, 60); g.lineTo(10, 20); g.lineTo(70, 20); g.lineTo(80, 60); g.closePath(); g.fill();
      for (let i = 0; i < 4; i++) lamp(g, 16 + i * 16, 34, 2.4, i % 2 ? "255,40,80" : "255,160,60");
    }),
    () => mk(60, 90, (g) => {
      g.strokeStyle = "#301218"; g.lineWidth = 8;
      g.beginPath(); g.arc(30, 90, 26, Math.PI, TAU); g.stroke();
      g.beginPath(); g.moveTo(30, 64); g.lineTo(30, 10); g.stroke();
      lamp(g, 30, 10, 4, "255,40,80");
    }),
  ];

  /* ---------- Parallax layers ---------- */
  // Repeating procedural tiles at a parallax factor: fn(x, h, i) with x on screen, h = hash of the tile
  function tiles(camX, par, sp, seed, fn) {
    const off = camX * par;
    for (let i = Math.floor(off / sp) - 1; i < (off + W) / sp + 1; i++) fn(i * sp - off, U.hash(i, seed), i);
  }
  function haze(ctx, rgb, a) { ctx.fillStyle = `rgba(${rgb},${a})`; ctx.fillRect(0, 0, W, H); }

  function foundryLayers(ctx, camX, t) {
    // far: a city of towers with lit windows
    tiles(camX, 0.06, 90, 31, (x, h, i) => {
      const w = 40 + h * 40, top = H * 0.25 + U.hash(i, 32) * H * 0.3;
      ctx.fillStyle = "#151b23"; ctx.fillRect(x, top, w, H - top);
      if (h > 0.4) { ctx.fillRect(x + w / 2 - 2, top - 40, 4, 40); ctx.fillStyle = Math.sin(t * 3 + i) > 0 ? "#ff4a30" : "#5a1a10"; ctx.fillRect(x + w / 2 - 3, top - 44, 6, 6); }
      ctx.fillStyle = "rgba(255,170,80,0.28)";
      for (let wy = top + 12; wy < H; wy += 18) for (let wx = x + 6; wx < x + w - 6; wx += 12) if (U.hash(wx * 7 + wy, i) < 0.3) ctx.fillRect(wx, wy, 5, 7);
    });
    haze(ctx, "40,60,80", 0.18);
    // middle: chimneys and lattice towers with smoke glow
    tiles(camX, 0.18, 160, 33, (x, h, i) => {
      if (h < 0.25) return;
      const top = H * 0.4 + U.hash(i, 34) * H * 0.25;
      ctx.fillStyle = "#1c232c";
      if (h < 0.6) {
        ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + 10, top); ctx.lineTo(x + 34, top); ctx.lineTo(x + 44, H); ctx.fill();
        ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,120,40", x + 22, top, 40 + 8 * Math.sin(t * 2 + i), 0.35); ctx.globalCompositeOperation = "source-over";
      } else {
        ctx.strokeStyle = "#1c232c"; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, H); ctx.lineTo(x + 20, top); ctx.lineTo(x + 40, H);
        for (let y = top + 30; y < H; y += 40) { ctx.moveTo(x + 20 - (y - top) / (H - top) * 20, y); ctx.lineTo(x + 20 + (y - top) / (H - top) * 20, y + 20); }
        ctx.stroke();
      }
    });
    haze(ctx, "40,60,80", 0.1);
    // near: horizontal pipe runs with moving lights
    tiles(camX, 0.38, 420, 35, (x, h, i) => {
      const y = H * 0.55 + h * H * 0.3;
      ctx.fillStyle = "#222a33"; ctx.fillRect(x - 10, y, 440, 16);
      ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(x - 10, y + 2, 440, 3);
      ctx.fillStyle = "#151a20"; for (let k = 0; k < 4; k++) ctx.fillRect(x + k * 110, y - 3, 10, 22);
      const lx = x + ((t * 160 + i * 70) % 430);
      ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,150,60", lx, y + 8, 14, 0.7, true); ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#1a2028"; ctx.fillRect(x + 200, y + 16, 12, H);
    });
  }
  function crystalLayers(ctx, camX, t) {
    tiles(camX, 0.07, 70, 41, (x, h, i) => {
      const hh = 120 + h * 260, w = 24 + U.hash(i, 42) * 30;
      ctx.fillStyle = "#0a2a38";
      ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + 2, H - hh * 0.85); ctx.lineTo(x + w / 2, H - hh); ctx.lineTo(x + w - 2, H - hh * 0.85); ctx.lineTo(x + w, H); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 10, 0); ctx.lineTo(x + 12 + w / 3, hh * 0.45); ctx.lineTo(x + 14 + w * 0.6, 0); ctx.fill();
    });
    haze(ctx, "20,90,120", 0.14);
    ctx.globalCompositeOperation = "lighter";
    tiles(camX, 0.2, 130, 43, (x, h, i) => {
      if (h < 0.3) return;
      const y = H - 40 - U.hash(i, 44) * 160, s = 30 + h * 50, a = 0.18 + 0.1 * Math.sin(t * 1.5 + i);
      ctx.fillStyle = `rgba(80,220,255,${a})`;
      for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x + k * s * 0.4 - 8, y + s); ctx.lineTo(x + k * s * 0.5, y - s * (1 - Math.abs(k) * 0.4)); ctx.lineTo(x + k * s * 0.4 + 8, y + s); ctx.fill(); }
      Gfx.glowAt(ctx, "80,220,255", x, y, s * 1.6, 0.18);
    });
    ctx.globalCompositeOperation = "source-over";
    tiles(camX, 0.42, 300, 45, (x, h, i) => {
      const up = i % 2 === 0, len = 140 + h * 200, w = 40 + U.hash(i, 46) * 30;
      ctx.fillStyle = "rgba(10,50,70,0.85)";
      ctx.beginPath();
      if (up) { ctx.moveTo(x, H); ctx.lineTo(x + w * 0.2, H - len * 0.8); ctx.lineTo(x + w / 2, H - len); ctx.lineTo(x + w * 0.8, H - len * 0.8); ctx.lineTo(x + w, H); }
      else { ctx.moveTo(x, 0); ctx.lineTo(x + w * 0.2, len * 0.6); ctx.lineTo(x + w / 2, len * 0.75); ctx.lineTo(x + w * 0.8, len * 0.6); ctx.lineTo(x + w, 0); }
      ctx.fill();
      ctx.strokeStyle = `rgba(120,240,255,${0.25 + 0.15 * Math.sin(t * 2 + i)})`; ctx.lineWidth = 1.5; ctx.stroke();
    });
  }
  function iceLayers(ctx, camX, t) {
    Gfx.silhouette(ctx, "#4a6684", camX, 0.06, H * 0.9, H * 0.5, 300, 61, t);
    tiles(camX, 0.1, 110, 62, (x, h) => {
      const hh = 80 + h * 140;
      ctx.fillStyle = "#3e5a78";
      ctx.beginPath(); ctx.moveTo(x - 10, 0); ctx.lineTo(x + 20, hh * 0.5); ctx.lineTo(x + 34, hh); ctx.lineTo(x + 50, hh * 0.4); ctx.lineTo(x + 80, 0); ctx.fill();
    });
    haze(ctx, "120,160,200", 0.12);
    // icebergs in the middle distance
    tiles(camX, 0.22, 340, 63, (x, h, i) => {
      if (h < 0.3) return;
      const y = H * 0.5 + U.hash(i, 64) * H * 0.2, w = 140 + h * 120, hh = 60 + h * 60;
      ctx.fillStyle = "#6a8aaa";
      ctx.beginPath(); ctx.moveTo(x, y + hh * 2); ctx.lineTo(x + w * 0.1, y); ctx.lineTo(x + w * 0.35, y - hh * 0.4); ctx.lineTo(x + w * 0.6, y + 10); ctx.lineTo(x + w * 0.8, y - hh * 0.2); ctx.lineTo(x + w, y + hh * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath(); ctx.moveTo(x + w * 0.1, y); ctx.lineTo(x + w * 0.35, y - hh * 0.4); ctx.lineTo(x + w * 0.3, y + 20); ctx.fill();
    });
    haze(ctx, "120,160,200", 0.08);
    // hanging icicles close by
    tiles(camX, 0.45, 60, 65, (x, h) => {
      if (h < 0.35) return;
      const len = 40 + h * 140;
      ctx.fillStyle = "rgba(170,205,235,0.75)";
      ctx.beginPath(); ctx.moveTo(x - 9, 0); ctx.lineTo(x, len); ctx.lineTo(x + 9, 0); ctx.fill();
    });
  }
  function coreLayers(ctx, camX, t) {
    // far: giant turning gears
    tiles(camX, 0.05, 380, 71, (x, h, i) => {
      const cx = x + 150, cy = H * 0.3 + h * H * 0.45, r = 90 + h * 90, a = t * (i % 2 ? 0.15 : -0.15);
      ctx.fillStyle = "#1e0a10";
      ctx.beginPath();
      for (let k = 0; k < 32; k++) { const ang = a + (k * TAU) / 32, rr = k % 2 ? r : r + 14; ctx.lineTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#12050a"; ctx.beginPath(); ctx.arc(cx, cy, r * 0.45, 0, TAU); ctx.fill();
    });
    haze(ctx, "60,0,20", 0.15);
    // middle: rib arches with pulsing lights
    tiles(camX, 0.18, 240, 73, (x, h, i) => {
      ctx.strokeStyle = "#250b12"; ctx.lineWidth = 22;
      ctx.beginPath(); ctx.ellipse(x + 120, H * 0.55, 110, H * 0.6, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      const pul = 0.4 + 0.4 * Math.sin(t * 3 - i * 0.8);
      ctx.globalCompositeOperation = "lighter";
      for (let k = 0; k < 5; k++) { const a = Math.PI * 1.1 + k * 0.2 * Math.PI; Gfx.glowAt(ctx, "255,30,70", x + 120 + Math.cos(a) * 110, H * 0.55 + Math.sin(a) * H * 0.6, 12, pul); }
      ctx.globalCompositeOperation = "source-over";
    });
    haze(ctx, "60,0,20", 0.08);
    // near: cables with energy pulses
    tiles(camX, 0.4, 260, 75, (x, h, i) => {
      const y0 = H * 0.15 + h * H * 0.2, sag = 120 + h * 120;
      ctx.strokeStyle = "#2a0e16"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x - 20, y0); ctx.quadraticCurveTo(x + 130, y0 + sag, x + 280, y0 + U.hash(i + 1, 75) * 40); ctx.stroke();
      const k = ((t * 0.6 + h) % 1), px = (1 - k) * (1 - k) * (x - 20) + 2 * k * (1 - k) * (x + 130) + k * k * (x + 280), py = (1 - k) * (1 - k) * y0 + 2 * k * (1 - k) * (y0 + sag) + k * k * (y0 + U.hash(i + 1, 75) * 40);
      ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,60,100", px, py, 16, 0.8, true); ctx.globalCompositeOperation = "source-over";
    });
  }

  /* ---------- Foreground particles (fastest layer, in front of everything) ---------- */
  const foreP = [];
  for (let i = 0; i < 46; i++) foreP.push({ x: Math.random() * W, y: Math.random() * H, z: 1.3 + Math.random() * 0.8, s: 1 + Math.random() * 2.2, p: Math.random() * TAU });
  function foreParticles(ctx, camX, t, rgb, kind) {
    ctx.globalCompositeOperation = kind === "snow" ? "source-over" : "lighter";
    for (const p of foreP) {
      let x = (((p.x - camX * p.z * 0.7) % W) + W) % W, y;
      if (kind === "snow") y = (p.y + t * 40 * p.z) % H, x = (x + Math.sin(t + p.p) * 20 + W) % W;
      else if (kind === "ember") y = (((p.y - t * 50 * p.z) % H) + H) % H;
      else y = (p.y + Math.sin(t * 0.7 + p.p) * 16 + H) % H;
      const a = kind === "glint" ? 0.3 + 0.5 * Math.max(0, Math.sin(t * 3 + p.p * 5)) : 0.55;
      ctx.fillStyle = `rgba(${rgb},${a})`;
      ctx.fillRect(x, y, p.s * p.z, p.s * p.z);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  Object.assign(Gfx.THEMES, {
    foundry: { water: ["#2c3946", "#141c26", "#05080c"], rays: 0.025, far: "#151b23", far2: "#1c232c", kelp: null, rock: ["#5c636c", "#262a30", "#0b0c0e"], edge: "255,150,60", plank: "255,190,120", deco: "foundry", seed: 13,
      layers: foundryLayers, fore: (ctx, c, t) => foreParticles(ctx, c, t, "255,150,60", "ember") },
    crystal: { water: ["#0f4256", "#08202e", "#020a10"], rays: 0.04, far: "#0a2a38", far2: "#0c3040", kelp: null, rock: ["#2c6878", "#123444", "#04121a"], edge: "120,255,240", plank: "160,255,240", deco: "crystal", seed: 15, veins: true,
      layers: crystalLayers, fore: (ctx, c, t) => foreParticles(ctx, c, t, "160,255,250", "glint") },
    ice: { water: ["#6a8cae", "#2e4868", "#0c1628"], rays: 0.07, far: "#4a6684", far2: "#3e5a78", kelp: null, rock: ["#d4e4f2", "#7090b0", "#1c2c44"], edge: "230,248,255", plank: "235,245,255", deco: "ice", seed: 17,
      layers: iceLayers, fore: (ctx, c, t) => foreParticles(ctx, c, t, "240,248,255", "snow") },
    core: { water: ["#22070f", "#100409", "#030103"], rays: 0, far: "#1e0a10", far2: "#250b12", kelp: null, rock: ["#4a2430", "#1c0a10", "#060203"], edge: "255,40,80", plank: "255,120,140", deco: "core", seed: 19, veins: true, lava: false,
      layers: coreLayers, fore: (ctx, c, t) => foreParticles(ctx, c, t, "255,70,100", "ember") },
  });

  /* ---------- Fixed obstacles ---------- */
  // o = { kind, from: "floor" | "ceil" | "free", w, y0, y1 }, x = left edge on screen
  Gfx.drawObstacle = function (ctx, o, x, t) {
    const w = o.w, y0 = o.y0, y1 = o.y1, h = y1 - y0;
    ctx.save();
    switch (o.kind) {
      case "girder": {
        const vertical = h > w;
        let gr = vertical ? ctx.createLinearGradient(x, 0, x + w, 0) : ctx.createLinearGradient(0, y0, 0, y1);
        gr.addColorStop(0, "#2a2e34"); gr.addColorStop(0.35, "#8a929c"); gr.addColorStop(0.6, "#4a5058"); gr.addColorStop(1, "#16181c");
        ctx.fillStyle = gr; ctx.fillRect(x, y0, w, h);
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        if (vertical) { ctx.fillRect(x + w * 0.3, y0, w * 0.4, h); ctx.fillStyle = "#3a3f46"; for (let y = y0 + 24; y < y1; y += 48) ctx.fillRect(x + w * 0.3, y, w * 0.4, 6); }
        else { ctx.fillRect(x, y0 + h * 0.3, w, h * 0.4); ctx.fillStyle = "#3a3f46"; for (let xx = x + 24; xx < x + w; xx += 48) ctx.fillRect(xx, y0 + h * 0.3, 6, h * 0.4); }
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        for (let k = 0; k < (vertical ? h : w) / 22; k++) { const p = 10 + k * 22; if (vertical) { ctx.fillRect(x + 3, y0 + p, 3, 3); ctx.fillRect(x + w - 6, y0 + p, 3, 3); } else { ctx.fillRect(x + p, y0 + 3, 3, 3); ctx.fillRect(x + p, y1 - 6, 3, 3); } }
        // hazard caps at the free ends
        const cap = (cx, cy, cw, ch) => {
          ctx.save(); ctx.beginPath(); ctx.rect(cx, cy, cw, ch); ctx.clip();
          ctx.fillStyle = "#f0b020"; ctx.fillRect(cx, cy, cw, ch); ctx.fillStyle = "#141414";
          for (let s = -ch; s < cw + ch; s += 12) { ctx.beginPath(); ctx.moveTo(cx + s, cy + ch); ctx.lineTo(cx + s + ch, cy); ctx.lineTo(cx + s + ch + 6, cy); ctx.lineTo(cx + s + 6, cy + ch); ctx.fill(); }
          ctx.restore();
        };
        if (vertical) { if (o.from !== "floor") cap(x, y1 - 12, w, 12); if (o.from !== "ceil") cap(x, y0, w, 12); }
        else { cap(x, y0, 12, h); cap(x + w - 12, y0, 12, h); }
        const lx = vertical ? x + w / 2 : x + w / 2, ly = vertical ? (o.from === "ceil" ? y1 - 20 : y0 + 20) : y0 + h / 2;
        ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,90,40", lx, ly, 10 + 4 * Math.sin(t * 6), 0.9, true);
        break;
      }
      case "crystal": {
        ctx.beginPath();
        const tip = Math.min(w * 0.9, 40);
        if (o.from === "floor") { ctx.moveTo(x, y1); ctx.lineTo(x, y0 + tip); ctx.lineTo(x + w / 2, y0); ctx.lineTo(x + w, y0 + tip); ctx.lineTo(x + w, y1); }
        else if (o.from === "ceil") { ctx.moveTo(x, y0); ctx.lineTo(x, y1 - tip); ctx.lineTo(x + w / 2, y1); ctx.lineTo(x + w, y1 - tip); ctx.lineTo(x + w, y0); }
        else { ctx.moveTo(x, y0 + h / 2); ctx.lineTo(x + tip, y0); ctx.lineTo(x + w - tip, y0); ctx.lineTo(x + w, y0 + h / 2); ctx.lineTo(x + w - tip, y1); ctx.lineTo(x + tip, y1); }
        ctx.closePath();
        const gr = ctx.createLinearGradient(x, 0, x + w, 0);
        gr.addColorStop(0, "rgba(20,90,120,0.95)"); gr.addColorStop(0.45, "rgba(150,250,255,0.95)"); gr.addColorStop(0.5, "rgba(40,160,200,0.95)"); gr.addColorStop(1, "rgba(10,60,90,0.95)");
        ctx.fillStyle = gr; ctx.fill();
        ctx.strokeStyle = "rgba(200,255,255,0.8)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.clip();
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = `rgba(160,255,255,${0.25 + 0.2 * Math.sin(t * 2 + x * 0.01)})`; ctx.lineWidth = 2;
        ctx.beginPath(); for (let y = y0 + 20; y < y1; y += 46) { ctx.moveTo(x, y); ctx.lineTo(x + w, y + 24); } ctx.stroke();
        Gfx.glowAt(ctx, "80,240,255", x + w / 2, o.from === "ceil" ? y1 - 20 : o.from === "floor" ? y0 + 20 : y0 + h / 2, 40, 0.4);
        break;
      }
      case "ice": {
        ctx.beginPath();
        if (o.from === "floor") { ctx.moveTo(x, y1); ctx.lineTo(x + 2, y0 + 16); ctx.lineTo(x + w * 0.3, y0); ctx.lineTo(x + w * 0.7, y0 + 8); ctx.lineTo(x + w - 2, y0 + 20); ctx.lineTo(x + w, y1); }
        else if (o.from === "ceil") { ctx.moveTo(x, y0); ctx.lineTo(x, y1 - 30); ctx.lineTo(x + w * 0.2, y1 - 12); ctx.lineTo(x + w * 0.4, y1); ctx.lineTo(x + w * 0.6, y1 - 18); ctx.lineTo(x + w * 0.8, y1 - 6); ctx.lineTo(x + w, y1 - 28); ctx.lineTo(x + w, y0); }
        else { ctx.moveTo(x + 6, y0 + 4); ctx.lineTo(x + w * 0.4, y0); ctx.lineTo(x + w - 4, y0 + 6); ctx.lineTo(x + w, y1 - 8); ctx.lineTo(x + w * 0.6, y1); ctx.lineTo(x, y1 - 4); }
        ctx.closePath();
        const gr = ctx.createLinearGradient(x, 0, x + w, 0);
        gr.addColorStop(0, "#7a9cc0"); gr.addColorStop(0.35, "#f4faff"); gr.addColorStop(0.7, "#b0cce6"); gr.addColorStop(1, "#5a7ca0");
        ctx.fillStyle = gr; ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.clip();
        ctx.strokeStyle = "rgba(90,130,180,0.55)"; ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let k = 0; k < h / 40; k++) { const yy = y0 + 18 + k * 40 + U.hash(k, w | 0) * 10; ctx.moveTo(x + w * 0.2, yy); ctx.lineTo(x + w * 0.5, yy + 14); ctx.lineTo(x + w * 0.45, yy + 30); }
        ctx.stroke();
        break;
      }
      case "pylon": {
        const vertical = h > w;
        let gr = vertical ? ctx.createLinearGradient(x, 0, x + w, 0) : ctx.createLinearGradient(0, y0, 0, y1);
        gr.addColorStop(0, "#14060a"); gr.addColorStop(0.4, "#4a2430"); gr.addColorStop(1, "#0a0204");
        ctx.fillStyle = gr; ctx.fillRect(x, y0, w, h);
        ctx.strokeStyle = "rgba(255,90,120,0.45)"; ctx.lineWidth = 1.5; ctx.strokeRect(x + 1, y0 + 1, w - 2, h - 2);
        const pul = 0.5 + 0.5 * Math.sin(t * 5 + x * 0.02);
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(255,40,80,${0.35 + 0.45 * pul})`;
        if (vertical) { ctx.fillRect(x + w / 2 - 3, y0 + 6, 6, h - 12); for (let y = y0 + 30; y < y1 - 20; y += 60) Gfx.glowAt(ctx, "255,40,80", x + w / 2, y, 18, 0.4 + 0.4 * pul, true); }
        else { ctx.fillRect(x + 6, y0 + h / 2 - 3, w - 12, 6); for (let xx = x + 30; xx < x + w - 20; xx += 60) Gfx.glowAt(ctx, "255,40,80", xx, y0 + h / 2, 18, 0.4 + 0.4 * pul, true); }
        break;
      }
    }
    ctx.restore();
  };

  /* ---------- Edge warnings for enemies coming from the side, top or bottom ---------- */
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
