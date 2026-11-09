/* SUNSET HIGHWAY: retro sprites (drawn by code at low resolution), landscapes and sky */
"use strict";

(function (XA) {
  const U = XA.U, TAU = U.TAU;
  const Gfx = (XA.Gfx = { spr: {} });
  const LW = (Gfx.LW = 640), LH = (Gfx.LH = 360);

  function mk(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    draw(g, w, h);
    return c;
  }
  const lin = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); for (const [o, c] of stops) gr.addColorStop(o, c); return gr; };
  const circ = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, TAU); };
  const ell = (g, x, y, rx, ry) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); };
  const poly = (g, pts) => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); };
  const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  Gfx.lin = lin;

  /* ---------- Roadside sprites (anchored bottom centre) ---------- */
  // w = width in world units (the road is 4000 units wide)
  const SPR = {};
  function def(key, ww, w, h, draw, extra) { SPR[key] = Object.assign({ ww, make: () => mk(w, h, draw) }, extra || {}); }

  def("palm", 1400, 64, 110, (g) => {
    g.strokeStyle = "#8a5a2a"; g.lineWidth = 6; g.beginPath(); g.moveTo(30, 110); g.quadraticCurveTo(26, 60, 38, 22); g.stroke();
    g.strokeStyle = "#6a4018"; g.lineWidth = 1;
    for (let y = 30; y < 108; y += 7) { g.beginPath(); g.moveTo(26 + (110 - y) * 0.06, y); g.lineTo(34 + (110 - y) * 0.06, y + 2); g.stroke(); }
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI + (i / 6) * Math.PI;
      g.fillStyle = i % 2 ? "#2e8a2a" : "#3fae36";
      g.beginPath(); g.moveTo(38, 22); g.quadraticCurveTo(38 + Math.cos(a) * 24, 12 + Math.sin(a) * 20, 38 + Math.cos(a) * 30, 26 + Math.abs(Math.cos(a)) * 14); g.quadraticCurveTo(38 + Math.cos(a) * 16, 22, 38, 26); g.fill();
    }
    rect(g, "#6a3a10", 34, 22, 4, 4); rect(g, "#6a3a10", 40, 24, 4, 4);
  });
  def("palm2", 1200, 56, 90, (g) => {
    g.strokeStyle = "#7a4a1a"; g.lineWidth = 5; g.beginPath(); g.moveTo(22, 90); g.quadraticCurveTo(30, 50, 22, 20); g.stroke();
    for (let i = 0; i < 6; i++) { const a = -Math.PI + (i / 5) * Math.PI; g.fillStyle = i % 2 ? "#2a7a2a" : "#48b83c"; g.beginPath(); g.moveTo(22, 20); g.quadraticCurveTo(22 + Math.cos(a) * 20, 10 + Math.sin(a) * 16, 22 + Math.cos(a) * 26, 24 + Math.abs(Math.cos(a)) * 12); g.lineTo(22, 24); g.fill(); }
  });
  def("umbrella", 700, 40, 40, (g) => {
    rect(g, "#ddd", 19, 12, 2, 28);
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? "#ffffff" : "#ff3a5a"; g.beginPath(); g.moveTo(20, 4); g.lineTo(2 + i * 6, 16); g.lineTo(8 + i * 6, 16); g.fill(); }
    rect(g, "#f0d090", 4, 34, 14, 6); rect(g, "#4a8aff", 22, 32, 12, 8);
  });
  def("tower", 900, 40, 60, (g) => {
    g.strokeStyle = "#e8e8e8"; g.lineWidth = 3; g.beginPath(); g.moveTo(8, 60); g.lineTo(14, 26); g.moveTo(32, 60); g.lineTo(26, 26); g.moveTo(10, 46); g.lineTo(30, 46); g.stroke();
    rect(g, "#ff4a2a", 8, 16, 24, 12); rect(g, "#ffffff", 8, 20, 24, 3); poly(g, [4, 16, 20, 6, 36, 16]); g.fillStyle = "#ff4a2a"; g.fill();
    rect(g, "#ffd040", 30, 2, 2, 10); rect(g, "#ff2a2a", 32, 2, 6, 4);
  });
  def("cactus", 600, 30, 56, (g) => {
    g.fillStyle = "#3a8a3a"; g.beginPath(); g.roundRect(11, 4, 9, 52, 4); g.fill();
    g.beginPath(); g.roundRect(2, 18, 7, 18, 3); g.fill(); g.fillRect(4, 32, 9, 5);
    g.beginPath(); g.roundRect(22, 12, 7, 18, 3); g.fill(); g.fillRect(18, 26, 9, 5);
    g.fillStyle = "#5ab85a"; g.fillRect(13, 6, 2, 48); g.fillStyle = "#ff6a9a"; circ(g, 15, 4, 2.5); g.fill();
  });
  def("rock", 1100, 50, 30, (g) => {
    g.fillStyle = "#9a6a42"; poly(g, [0, 30, 6, 12, 18, 4, 34, 6, 46, 16, 50, 30]); g.fill();
    g.fillStyle = "#c08a5a"; poly(g, [8, 14, 18, 6, 30, 8, 24, 18]); g.fill();
    g.fillStyle = "#6a4426"; poly(g, [30, 30, 40, 18, 50, 30]); g.fill();
  });
  def("mesa", 2600, 90, 50, (g) => {
    g.fillStyle = "#b8643a"; poly(g, [0, 50, 10, 10, 80, 8, 90, 50]); g.fill();
    g.fillStyle = "#d88050"; g.fillRect(12, 8, 66, 6); g.fillStyle = "#8a4a2a"; for (let i = 0; i < 4; i++) g.fillRect(14, 20 + i * 8, 62, 2);
  });
  def("skull", 600, 32, 34, (g) => {
    rect(g, "#6a4a2a", 15, 14, 3, 20); rect(g, "#e8d8b0", 2, 2, 28, 14);
    g.fillStyle = "#3a2a1a"; g.font = "bold 7px monospace"; g.textAlign = "center"; g.fillText("NO GAS", 16, 11);
    g.fillText("200 MI", 16, 16.5);
  });
  def("pine", 1200, 44, 90, (g) => {
    rect(g, "#5a3a1a", 19, 72, 6, 18);
    for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? "#1e5a2e" : "#2a7a3a"; poly(g, [22, 4 + i * 16, 4 - i * 2 + 6, 36 + i * 13, 40 + i * 2 - 6, 36 + i * 13]); g.fill(); }
  });
  def("snowfir", 1200, 44, 90, (g) => {
    rect(g, "#5a3a1a", 19, 72, 6, 18);
    for (let i = 0; i < 4; i++) { g.fillStyle = "#1e4a3a"; poly(g, [22, 4 + i * 16, 4 - i * 2 + 6, 36 + i * 13, 40 + i * 2 - 6, 36 + i * 13]); g.fill(); g.fillStyle = "#ffffff"; poly(g, [22, 4 + i * 16, 14 - i, 18 + i * 15, 30 + i, 18 + i * 15]); g.fill(); }
  });
  def("snowman", 500, 26, 40, (g) => {
    g.fillStyle = "#fff"; circ(g, 13, 30, 9); g.fill(); circ(g, 13, 15, 6.5); g.fill();
    rect(g, "#222", 7, 4, 12, 3); rect(g, "#222", 9, 0, 8, 5); rect(g, "#ff7a1a", 13, 14, 6, 2); rect(g, "#222", 10, 12, 2, 2); rect(g, "#222", 15, 12, 2, 2);
    rect(g, "#d02a2a", 7, 19, 12, 3); g.strokeStyle = "#5a3a1a"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(5, 26); g.lineTo(-2, 20); g.moveTo(21, 26); g.lineTo(28, 18); g.stroke();
  });
  def("chalet", 1800, 70, 54, (g) => {
    rect(g, "#8a5a2a", 8, 22, 54, 32); g.fillStyle = "#5a3418"; for (let y = 24; y < 54; y += 5) g.fillRect(8, y, 54, 1);
    g.fillStyle = "#6a2a1a"; poly(g, [0, 26, 35, 2, 70, 26]); g.fill(); g.fillStyle = "#ffffff"; poly(g, [4, 22, 35, 2, 66, 22, 35, 8]); g.fill();
    rect(g, "#ffd870", 16, 30, 10, 8); rect(g, "#ffd870", 44, 30, 10, 8); rect(g, "#3a2010", 30, 36, 10, 18);
    rect(g, "#d02a2a", 15, 39, 12, 3); rect(g, "#d02a2a", 43, 39, 12, 3);
  });
  def("log", 900, 50, 20, (g) => { for (let i = 0; i < 3; i++) { g.fillStyle = "#7a4a22"; g.fillRect(4 + i * 4, 10 - i * 5, 42 - i * 8, 7); g.fillStyle = "#d8a870"; circ(g, 4 + i * 4, 13.5 - i * 5, 3.5); g.fill(); } });
  def("deer", 500, 30, 40, (g) => {
    rect(g, "#5a5a5a", 14, 20, 3, 20); g.fillStyle = "#ffd020"; poly(g, [15, 0, 30, 15, 15, 30, 0, 15]); g.fill(); g.strokeStyle = "#111"; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = "#111"; g.fillRect(9, 14, 10, 4); g.fillRect(10, 18, 2, 4); g.fillRect(16, 18, 2, 4); g.fillRect(18, 10, 3, 5); g.fillRect(19, 7, 1, 3); g.fillRect(21, 7, 1, 3);
  });
  def("building", 2600, 70, 120, (g) => {
    rect(g, "#4a5a7a", 0, 0, 70, 120); g.fillStyle = "#3a4862"; g.fillRect(0, 0, 8, 120);
    for (let y = 8; y < 112; y += 12) for (let x = 12; x < 66; x += 12) { g.fillStyle = (x * y) % 7 < 3 ? "#ffe08a" : "#2a3448"; g.fillRect(x, y, 7, 7); }
  }, { glow: [[0.5, 0.3, "255,220,140", 0.6]] });
  def("building2", 2400, 64, 90, (g) => {
    rect(g, "#7a4a5a", 0, 0, 64, 90);
    for (let y = 6; y < 84; y += 10) for (let x = 6; x < 60; x += 10) { g.fillStyle = (x + y * 3) % 5 < 2 ? "#ffd0a0" : "#3a2430"; g.fillRect(x, y, 6, 6); }
    rect(g, "#2a1420", 24, 70, 16, 20);
  });
  def("lamp", 400, 30, 90, (g) => {
    rect(g, "#5a6070", 4, 10, 3, 80); rect(g, "#5a6070", 4, 8, 22, 3); rect(g, "#ffe8a0", 18, 10, 10, 4);
  }, { glow: [[0.77, 0.12, "255,230,150", 1]] });
  def("neon", 1100, 60, 70, (g) => {
    rect(g, "#333", 28, 30, 4, 40); g.fillStyle = "#1a0a2a"; g.beginPath(); g.roundRect(2, 2, 56, 30, 4); g.fill();
    g.strokeStyle = "#ff4ad0"; g.lineWidth = 2; g.strokeRect(5, 5, 50, 24);
    g.fillStyle = "#40f0ff"; g.font = "bold 10px monospace"; g.textAlign = "center"; g.fillText("DINER", 30, 17); g.fillStyle = "#ffe040"; g.fillText("24H", 30, 27);
  }, { glow: [[0.5, 0.25, "255,90,220", 1]] });
  def("redpillar", 1300, 40, 100, (g) => {
    g.fillStyle = "#b84a2a"; poly(g, [6, 100, 10, 30, 4, 10, 20, 2, 34, 12, 30, 40, 36, 100]); g.fill();
    g.fillStyle = "#d86a3a"; poly(g, [10, 30, 4, 10, 20, 2, 18, 40]); g.fill();
    g.fillStyle = "#8a3418"; for (let i = 0; i < 6; i++) g.fillRect(8, 44 + i * 9, 26, 2);
  });
  def("arch", 3200, 120, 70, (g) => {
    g.fillStyle = "#b84a2a"; g.beginPath(); g.moveTo(0, 70); g.lineTo(6, 10); g.quadraticCurveTo(60, -8, 114, 10); g.lineTo(120, 70); g.lineTo(96, 70); g.lineTo(92, 30); g.quadraticCurveTo(60, 14, 28, 30); g.lineTo(24, 70); g.closePath(); g.fill();
    g.fillStyle = "#d8703a"; g.fillRect(8, 8, 104, 4);
  });
  def("windmill", 1600, 60, 100, (g) => {
    g.fillStyle = "#e8e0d0"; poly(g, [18, 100, 24, 30, 36, 30, 42, 100]); g.fill();
    g.fillStyle = "#8a3a2a"; poly(g, [20, 32, 30, 18, 40, 32]); g.fill(); rect(g, "#4a2a1a", 26, 80, 8, 20); rect(g, "#6ab0ff", 27, 50, 6, 8);
  }, { anim: "mill" });
  def("cow", 700, 40, 28, (g) => {
    rect(g, "#ffffff", 6, 6, 26, 14); g.fillStyle = "#222"; g.fillRect(10, 6, 8, 6); g.fillRect(22, 12, 6, 6);
    rect(g, "#ffffff", 0, 4, 9, 9); rect(g, "#ffb0b0", 0, 9, 6, 4); rect(g, "#222", 2, 6, 2, 2);
    for (const x of [8, 13, 24, 29]) rect(g, "#ddd", x, 20, 3, 8);
    rect(g, "#ffb0c0", 18, 18, 4, 3);
  }, { anim: "cow" });
  def("barn", 2000, 80, 60, (g) => {
    rect(g, "#b8322a", 6, 20, 68, 40); g.fillStyle = "#6a1a14"; poly(g, [0, 24, 20, 4, 60, 4, 80, 24]); g.fill();
    rect(g, "#ffffff", 28, 32, 24, 28); g.strokeStyle = "#b8322a"; g.lineWidth = 2; g.beginPath(); g.moveTo(28, 32); g.lineTo(52, 60); g.moveTo(52, 32); g.lineTo(28, 60); g.stroke();
    rect(g, "#ffffff", 34, 10, 12, 8);
  });
  def("hay", 700, 30, 20, (g) => { g.fillStyle = "#e8c050"; g.beginPath(); g.roundRect(0, 2, 30, 18, 6); g.fill(); g.strokeStyle = "#b88a20"; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(15, 11, 3 + i * 3, 0, TAU); g.stroke(); } });
  def("autumn", 1300, 56, 80, (g) => {
    rect(g, "#5a3a1a", 25, 46, 6, 34);
    const cols = ["#e86a1a", "#ffb030", "#c8401a", "#ffd050"];
    for (let i = 0; i < 9; i++) { g.fillStyle = cols[i % 4]; circ(g, 14 + (i % 3) * 14, 14 + Math.floor(i / 3) * 12, 12); g.fill(); }
  });
  def("birch", 900, 30, 90, (g) => {
    rect(g, "#f0f0e8", 13, 30, 5, 60); g.fillStyle = "#222"; for (let y = 34; y < 88; y += 9) g.fillRect(13, y, 3, 2);
    g.fillStyle = "#e8b030"; circ(g, 15, 20, 13); g.fill(); g.fillStyle = "#ffd050"; circ(g, 10, 16, 7); g.fill();
  });
  def("bench", 500, 36, 20, (g) => { rect(g, "#8a5a2a", 0, 6, 36, 4); rect(g, "#8a5a2a", 0, 12, 36, 3); rect(g, "#333", 3, 12, 3, 8); rect(g, "#333", 30, 12, 3, 8); });
  def("hut", 1500, 60, 44, (g) => {
    rect(g, "#c89a5a", 6, 18, 48, 26); g.fillStyle = "#e8c060"; poly(g, [0, 20, 30, 0, 60, 20]); g.fill();
    g.strokeStyle = "#a07a30"; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(30, 0); g.lineTo(i * 8, 20); g.stroke(); }
    rect(g, "#5a3a1a", 24, 28, 12, 16); rect(g, "#40c0ff", 10, 26, 8, 8);
    g.fillStyle = "#fff"; g.font = "bold 6px monospace"; g.fillText("TIKI", 40, 32);
  });
  def("cliff", 2600, 90, 70, (g) => {
    g.fillStyle = "#7a5a6a"; poly(g, [0, 70, 8, 30, 30, 8, 60, 4, 82, 24, 90, 70]); g.fill();
    g.fillStyle = "#9a7a8a"; poly(g, [8, 30, 30, 8, 44, 10, 30, 36]); g.fill();
  });
  def("deadtree", 1000, 40, 70, (g) => {
    g.strokeStyle = "#2a1a14"; g.lineWidth = 4; g.beginPath(); g.moveTo(20, 70); g.lineTo(20, 30); g.lineTo(8, 10); g.moveTo(20, 40); g.lineTo(34, 18); g.moveTo(14, 22); g.lineTo(4, 22); g.stroke();
  });
  def("lavarock", 1100, 50, 30, (g) => {
    g.fillStyle = "#2a1a1a"; poly(g, [0, 30, 8, 10, 22, 2, 40, 8, 50, 30]); g.fill();
    g.strokeStyle = "#ff6a1a"; g.lineWidth = 2; g.beginPath(); g.moveTo(10, 26); g.lineTo(20, 14); g.lineTo(30, 20); g.lineTo(38, 10); g.stroke();
  }, { glow: [[0.5, 0.5, "255,110,30", 0.6]] });
  def("warn", 500, 30, 40, (g) => {
    rect(g, "#5a5a5a", 14, 20, 3, 20); g.fillStyle = "#ffd020"; poly(g, [15, 0, 30, 26, 0, 26]); g.fill(); g.strokeStyle = "#111"; g.lineWidth = 1.5; g.stroke();
    rect(g, "#111", 14, 8, 3, 9); rect(g, "#111", 14, 19, 3, 3);
  });
  def("billboard", 2400, 90, 60, (g) => {
    rect(g, "#555", 20, 34, 4, 26); rect(g, "#555", 66, 34, 4, 26);
    g.fillStyle = lin(g, 0, 0, 90, 0, [[0, "#ff5a3a"], [1, "#ffb030"]]); g.fillRect(0, 0, 90, 36);
    g.fillStyle = "#fff"; g.font = "bold 12px monospace"; g.textAlign = "center"; g.fillText("SUNNY", 45, 15); g.fillText("COLA", 45, 29);
    g.fillStyle = "#ffe040"; circ(g, 12, 18, 8); g.fill();
  });
  def("billboard2", 2400, 90, 60, (g) => {
    rect(g, "#555", 20, 34, 4, 26); rect(g, "#555", 66, 34, 4, 26);
    g.fillStyle = lin(g, 0, 0, 0, 36, [[0, "#2a3aa0"], [1, "#40a0ff"]]); g.fillRect(0, 0, 90, 36);
    g.fillStyle = "#fff"; g.font = "bold 11px monospace"; g.textAlign = "center"; g.fillText("TURBO WAX", 45, 15);
    g.fillStyle = "#ffe040"; g.font = "bold 8px monospace"; g.fillText("SHINE LIKE NEW", 45, 28);
  });
  def("curveL", 600, 30, 40, (g) => { rect(g, "#5a5a5a", 14, 22, 3, 18); g.fillStyle = "#ffffff"; g.fillRect(0, 0, 30, 22); g.fillStyle = "#e02a2a"; poly(g, [4, 11, 14, 3, 14, 8, 26, 8, 26, 14, 14, 14, 14, 19]); g.fill(); });
  def("curveR", 600, 30, 40, (g) => { rect(g, "#5a5a5a", 14, 22, 3, 18); g.fillStyle = "#ffffff"; g.fillRect(0, 0, 30, 22); g.fillStyle = "#e02a2a"; poly(g, [26, 11, 16, 3, 16, 8, 4, 8, 4, 14, 16, 14, 16, 19]); g.fill(); });
  def("crowd", 1800, 80, 30, (g) => {
    const cols = ["#ff4a4a", "#4a8aff", "#ffd040", "#40d080", "#ff8ad0", "#ffffff"];
    for (let i = 0; i < 10; i++) { const x = 4 + i * 7.5; rect(g, cols[i % 6], x, 14, 6, 12); rect(g, "#f0c090", x + 1, 8, 4, 5); rect(g, "#3a2a1a", x, 26, 2, 4); rect(g, "#3a2a1a", x + 4, 26, 2, 4); }
  }, { anim: "crowd" });
  def("flagman", 600, 30, 40, (g) => {
    rect(g, "#ffffff", 10, 14, 8, 14); rect(g, "#f0c090", 11, 7, 6, 6); rect(g, "#222", 10, 5, 8, 3); rect(g, "#222", 10, 28, 3, 12); rect(g, "#222", 15, 28, 3, 12);
  }, { anim: "flag" });
  // invisible collision helper for archways (posts)
  def("post", 300, 10, 70, (g) => { rect(g, "#e8e8e8", 2, 0, 6, 70); rect(g, "#e02a2a", 2, 10, 6, 6); rect(g, "#e02a2a", 2, 40, 6, 6); });

  // traffic (seen from behind)
  function car(key, body, roof, ww, w, h, extra) {
    def(key, ww, w, h, (g) => {
      const W = w, H = h;
      g.fillStyle = "#151515"; g.fillRect(3, H - 7, 8, 7); g.fillRect(W - 11, H - 7, 8, 7);
      g.fillStyle = body; g.beginPath(); g.roundRect(1, H * 0.42, W - 2, H * 0.45, 4); g.fill();
      g.fillStyle = roof; g.beginPath(); g.moveTo(W * 0.2, H * 0.44); g.lineTo(W * 0.27, H * 0.08); g.lineTo(W * 0.73, H * 0.08); g.lineTo(W * 0.8, H * 0.44); g.fill();
      g.fillStyle = "#9ad0f0"; g.beginPath(); g.moveTo(W * 0.25, H * 0.42); g.lineTo(W * 0.3, H * 0.14); g.lineTo(W * 0.7, H * 0.14); g.lineTo(W * 0.75, H * 0.42); g.fill();
      rect(g, "#ff2a2a", 3, H * 0.52, W * 0.18, H * 0.1); rect(g, "#ff2a2a", W - 3 - W * 0.18, H * 0.52, W * 0.18, H * 0.1);
      rect(g, "#e8e8e8", W * 0.38, H * 0.7, W * 0.24, H * 0.08); rect(g, "#333", 1, H * 0.82, W - 2, 3);
      if (extra) extra(g, W, H);
    }, { car: true });
  }
  car("car_blue", "#2a5ad0", "#1a3a9a", 1150, 48, 34);
  car("car_yellow", "#f0c020", "#c09010", 1150, 48, 34, (g, W, H) => { rect(g, "#222", W * 0.42, H * 0.02, W * 0.16, 4); g.fillStyle = "#111"; g.font = "bold 5px monospace"; g.fillText("TAXI", W * 0.4, H * 0.12); });
  car("car_white", "#e8e8f0", "#b8b8c8", 1150, 48, 34);
  car("car_green", "#2a9a5a", "#1a6a3a", 1050, 44, 32, (g, W, H) => { g.fillStyle = "#2a9a5a"; g.beginPath(); g.ellipse(W / 2, H * 0.4, W * 0.42, H * 0.36, 0, Math.PI, TAU); g.fill(); g.fillStyle = "#9ad0f0"; g.beginPath(); g.ellipse(W / 2, H * 0.42, W * 0.3, H * 0.24, 0, Math.PI, TAU); g.fill(); });
  def("truck", 1500, 60, 64, (g) => {
    rect(g, "#151515", 4, 56, 10, 8); rect(g, "#151515", 46, 56, 10, 8);
    rect(g, "#e8e8e8", 0, 0, 60, 54); rect(g, "#c8c8c8", 0, 50, 60, 6);
    g.fillStyle = "#e0402a"; g.font = "bold 9px monospace"; g.textAlign = "center"; g.fillText("FRESH", 30, 22); g.fillText("FISH", 30, 33);
    rect(g, "#ff2a2a", 2, 44, 8, 5); rect(g, "#ff2a2a", 50, 44, 8, 5); rect(g, "#ffb020", 2, 2, 4, 3); rect(g, "#ffb020", 54, 2, 4, 3);
  }, { car: true });
  def("van", 1250, 50, 46, (g) => {
    rect(g, "#151515", 4, 40, 9, 6); rect(g, "#151515", 37, 40, 9, 6);
    g.fillStyle = "#ff8a3a"; g.beginPath(); g.roundRect(1, 4, 48, 26, 6); g.fill(); g.fillStyle = "#f0f0f0"; g.beginPath(); g.roundRect(1, 26, 48, 15, 4); g.fill();
    rect(g, "#9ad0f0", 6, 8, 38, 12); rect(g, "#ff2a2a", 3, 30, 6, 5); rect(g, "#ff2a2a", 41, 30, 6, 5);
    g.fillStyle = "#ff4ad0"; circ(g, 25, 34, 4); g.fill();
  }, { car: true });

  /* ---------- Themes ---------- */
  const T = (Gfx.THEMES = {
    beach: { sky: ["#2a8ae8", "#a8e0ff"], ground: ["#e8d090", "#dcc47e"], rumble: ["#ffffff", "#d82a3a"], road: ["#808088", "#78787f"], lane: "#ffffff", far: "sea", near: "dunes",
      sprites: [["palm", 5], ["palm2", 3], ["umbrella", 2], ["tower", 1], ["billboard", 1]], critter: "gull", clouds: 1 },
    desert: { sky: ["#3a9ae0", "#ffe0a0"], ground: ["#e8b060", "#dca052"], rumble: ["#ffffff", "#e0402a"], road: ["#8a7a70", "#827268"], lane: "#ffe040", far: "mesas", near: "sandhills",
      sprites: [["cactus", 5], ["rock", 3], ["mesa", 1], ["skull", 1], ["billboard2", 1]], critter: "tumble", clouds: 0.3 },
    forest: { sky: ["#4a9ae0", "#d8f0ff"], ground: ["#3a8a3a", "#348034"], rumble: ["#ffffff", "#2a2a2a"], road: ["#6a6a70", "#64646a"], lane: "#ffffff", far: "mountains", near: "treeline",
      sprites: [["pine", 8], ["log", 1], ["deer", 1], ["billboard", 0.5]], critter: null, clouds: 1 },
    alps: { sky: ["#3a7ad0", "#e8f4ff"], ground: ["#f4f8ff", "#e4ecf8"], rumble: ["#e02a2a", "#ffffff"], road: ["#6a6a74", "#62626c"], lane: "#ffe040", far: "peaks", near: "snowhills",
      sprites: [["snowfir", 7], ["snowman", 1], ["chalet", 1]], critter: null, clouds: 1 },
    city: { sky: ["#1a1a4a", "#6a3a7a"], ground: ["#3a3a44", "#34343e"], rumble: ["#ffffff", "#ffd020"], road: ["#55555e", "#505058"], lane: "#ffffff", far: "skyline", near: "citylow",
      sprites: [["lamp", 5], ["building", 3], ["building2", 3], ["neon", 2], ["billboard2", 1]], critter: null, clouds: 0, stars: true },
    canyon: { sky: ["#4aa0e8", "#ffd8b0"], ground: ["#c86a3a", "#be6034"], rumble: ["#ffffff", "#7a2a1a"], road: ["#7a6a64", "#72625c"], lane: "#ffffff", far: "redcliffs", near: "redhills",
      sprites: [["redpillar", 4], ["arch", 1], ["cactus", 2], ["rock", 3]], critter: "tumble", clouds: 0.5 },
    farm: { sky: ["#4ab0f0", "#e0f8ff"], ground: ["#7ac040", "#e0c050"], rumble: ["#ffffff", "#d82a2a"], road: ["#7a7a80", "#727278"], lane: "#ffffff", far: "farmhills", near: "fields",
      sprites: [["windmill", 2], ["cow", 3], ["barn", 1], ["hay", 3], ["billboard", 0.5]], critter: "cowmoo", clouds: 1 },
    autumn: { sky: ["#5a9ad8", "#f0e0c8"], ground: ["#a8902a", "#9c8426"], rumble: ["#ffffff", "#c84a1a"], road: ["#707078", "#68686f"], lane: "#ffffff", far: "lake", near: "autumnline",
      sprites: [["autumn", 6], ["birch", 3], ["bench", 1]], critter: null, clouds: 1 },
    coast: { sky: ["#3a2a7a", "#ff9a5a"], ground: ["#c89a6a", "#bc8e60"], rumble: ["#ffffff", "#8a2aa0"], road: ["#6a6070", "#625868"], lane: "#ffe0a0", far: "sunsetsea", near: "cliffs",
      sprites: [["palm", 4], ["hut", 1], ["cliff", 1], ["palm2", 2]], critter: "gull", clouds: 0.6 },
    volcano: { sky: ["#2a1a2a", "#a04a3a"], ground: ["#3a2a2a", "#342424"], rumble: ["#ff6a1a", "#2a1a1a"], road: ["#5a5058", "#544a52"], lane: "#ff9a40", far: "volcano", near: "ashhills",
      sprites: [["deadtree", 4], ["lavarock", 4], ["warn", 1]], critter: null, clouds: 0, ash: true },
  });

  /* ---------- Background panoramas (1280 x 140, tileable horizontally) ---------- */
  const BG = {
    sea(g, r) {
      g.fillStyle = "#2a6ac0"; g.fillRect(0, 100, 1280, 40);
      g.fillStyle = "#3a8ad8"; for (let i = 0; i < 60; i++) g.fillRect(r() * 1280, 102 + r() * 36, 10 + r() * 30, 1);
      for (let i = 0; i < 5; i++) { const x = r() * 1280, w = 60 + r() * 120; g.fillStyle = "#5a9a7a"; g.beginPath(); g.ellipse(x, 101, w, 12 + r() * 10, 0, Math.PI, TAU); g.fill(); }
    },
    sunsetsea(g, r) {
      g.fillStyle = "#4a2a6a"; g.fillRect(0, 100, 1280, 40);
      g.fillStyle = "#ffb070"; for (let i = 0; i < 80; i++) g.fillRect(560 + (r() - 0.5) * 300, 102 + r() * 36, 6 + r() * 20, 1);
      for (let i = 0; i < 4; i++) { const x = r() * 1280; g.fillStyle = "#3a1a4a"; g.beginPath(); g.ellipse(x, 101, 80 + r() * 80, 14, 0, Math.PI, TAU); g.fill(); }
    },
    mesas(g, r) {
      for (let i = 0; i < 9; i++) { const x = r() * 1280, w = 60 + r() * 140, h = 30 + r() * 50; g.fillStyle = i % 2 ? "#c87048" : "#b05a3a"; poly(g, [x - w / 2 - 10, 140, x - w / 2, 140 - h, x + w / 2, 140 - h - 4, x + w / 2 + 12, 140]); g.fill(); g.fillStyle = "rgba(255,200,150,0.3)"; g.fillRect(x - w / 2, 140 - h, w, 3); }
    },
    mountains(g, r) {
      for (let k = 0; k < 2; k++) { g.fillStyle = k ? "#4a7aa0" : "#6a9ac0"; g.beginPath(); g.moveTo(0, 140); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, 60 + k * 20 + Math.sin(x * 0.01 + k * 3) * 25 + Math.sin(x * 0.031 + k) * 15); g.lineTo(1280, 140); g.fill(); }
    },
    peaks(g, r) {
      g.beginPath(); g.moveTo(0, 140);
      const pts = []; for (let x = 0; x <= 1280; x += 80) { const y = 30 + r() * 60; pts.push([x, y]); }
      pts[pts.length - 1][1] = pts[0][1];
      for (const [x, y] of pts) g.lineTo(x, y);
      g.lineTo(1280, 140); g.closePath(); g.fillStyle = "#6a7a9a"; g.fill();
      g.fillStyle = "#ffffff";
      for (const [x, y] of pts) { g.beginPath(); g.moveTo(x, y); g.lineTo(x - 18, y + 22); g.lineTo(x + 18, y + 22); g.fill(); }
    },
    skyline(g, r) {
      let x = 0;
      while (x < 1280) { const w = 20 + r() * 40, h = 30 + r() * 90; g.fillStyle = r() < 0.5 ? "#1a1a34" : "#24243e"; g.fillRect(x, 140 - h, w, h); for (let y = 140 - h + 4; y < 136; y += 6) for (let xx = x + 3; xx < x + w - 3; xx += 6) if (r() < 0.35) { g.fillStyle = r() < 0.7 ? "#ffe08a" : "#8ad0ff"; g.fillRect(xx, y, 2, 3); } x += w + 2; }
    },
    redcliffs(g, r) { for (let i = 0; i < 12; i++) { const x = r() * 1280, w = 40 + r() * 80, h = 40 + r() * 70; g.fillStyle = i % 2 ? "#a04a2a" : "#c0603a"; g.fillRect(x - w / 2, 140 - h, w, h); g.fillStyle = "#e08050"; g.fillRect(x - w / 2, 140 - h, w, 4); } },
    farmhills(g, r) { for (let k = 0; k < 2; k++) { g.fillStyle = k ? "#5aa040" : "#8ac060"; g.beginPath(); g.moveTo(0, 140); for (let x = 0; x <= 1280; x += 20) g.lineTo(x, 90 + k * 14 + Math.sin(x * 0.012 + k * 2) * 14); g.lineTo(1280, 140); g.fill(); } },
    lake(g, r) {
      g.fillStyle = "#5a7ab0"; g.beginPath(); g.moveTo(0, 140); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, 70 + Math.sin(x * 0.009) * 20 + Math.sin(x * 0.03) * 8); g.lineTo(1280, 140); g.fill();
      g.fillStyle = "#4a8ac0"; g.fillRect(0, 112, 1280, 28); g.fillStyle = "#8ac0e8"; for (let i = 0; i < 40; i++) g.fillRect(r() * 1280, 114 + r() * 24, 14, 1);
    },
    volcano(g, r) {
      g.fillStyle = "#3a2228"; for (let i = 0; i < 2; i++) { const x = 300 + i * 640; poly(g, [x - 260, 140, x - 40, 30, x + 40, 30, x + 260, 140]); g.fill(); g.fillStyle = "#ff5a1a"; g.fillRect(x - 40, 28, 80, 4); g.fillStyle = "#3a2228"; }
      g.strokeStyle = "#ff6a1a"; g.lineWidth = 2; g.beginPath(); g.moveTo(300, 34); g.lineTo(280, 80); g.lineTo(290, 110); g.moveTo(940, 34); g.lineTo(960, 90); g.stroke();
    },
  };
  const NEAR = {
    dunes: (g, r) => hills(g, r, "#d8bc78", 18, 0.02),
    sandhills: (g, r) => hills(g, r, "#d09a50", 22, 0.015),
    treeline: (g, r) => { hills(g, r, "#2a6a3a", 14, 0.02); g.fillStyle = "#1e5a2e"; for (let i = 0; i < 120; i++) { const x = r() * 1280, h = 12 + r() * 18; poly(g, [x - 6, 140 - 10, x, 140 - 10 - h, x + 6, 140 - 10]); g.fill(); } },
    snowhills: (g, r) => { hills(g, r, "#e0e8f8", 16, 0.02); g.fillStyle = "#1e4a3a"; for (let i = 0; i < 60; i++) { const x = r() * 1280, h = 10 + r() * 12; poly(g, [x - 5, 132, x, 132 - h, x + 5, 132]); g.fill(); } },
    citylow: (g, r) => { let x = 0; while (x < 1280) { const w = 30 + r() * 50, h = 20 + r() * 40; g.fillStyle = "#14142a"; g.fillRect(x, 140 - h, w, h); for (let i = 0; i < 6; i++) if (r() < 0.6) { g.fillStyle = "#ffd070"; g.fillRect(x + 4 + r() * (w - 8), 140 - h + 4 + r() * (h - 8), 2, 2); } x += w; } },
    redhills: (g, r) => hills(g, r, "#a8502a", 20, 0.018),
    fields: (g, r) => { hills(g, r, "#9ad050", 12, 0.01); for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? "#e0c050" : "#6ab040"; g.fillRect(i * 92, 128, 92, 12); } },
    autumnline: (g, r) => { hills(g, r, "#8a7a2a", 12, 0.02); for (let i = 0; i < 90; i++) { g.fillStyle = U.pick(["#e86a1a", "#ffb030", "#c8401a"]); circ(g, r() * 1280, 124 + r() * 6, 5 + r() * 6); g.fill(); } },
    cliffs: (g, r) => hills(g, r, "#5a3a5a", 26, 0.03),
    ashhills: (g, r) => hills(g, r, "#2a1a1e", 22, 0.025),
  };
  function hills(g, r, col, amp, f) {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, 140);
    const ph = r() * 10;
    for (let x = 0; x <= 1280; x += 8) g.lineTo(x, 140 - amp - Math.sin(x * f * Math.PI * 2 / 25.6 + ph) * amp * 0.5 - Math.sin(x * f * 7 + ph) * amp * 0.25);
    g.lineTo(1280, 140); g.fill();
  }

  Gfx.init = function () {
    for (const k in SPR) { Gfx.spr[k] = SPR[k].make(); Gfx.spr[k].def = SPR[k]; }
    Gfx.SPR = SPR;
    Gfx.bg = {};
    for (const k in T) {
      const th = T[k], r = U.rng(k.length * 977 + 13);
      Gfx.bg[k] = { far: mk(1280, 140, (g) => BG[th.far](g, r)), near: mk(1280, 140, (g) => NEAR[th.near](g, r)) };
    }
    // glow sprite
    Gfx.glowSpr = mk(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
    Gfx.clouds = [];
    for (let i = 0; i < 9; i++) Gfx.clouds.push({ x: Math.random() * 1280, y: 20 + Math.random() * 70, w: 40 + Math.random() * 70 });
    Gfx.stars = [];
    for (let i = 0; i < 80; i++) Gfx.stars.push({ x: Math.random() * LW, y: Math.random() * LH * 0.5, s: Math.random() < 0.2 ? 2 : 1 });
  };

  // colour helpers for times of day
  function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  Gfx.mix = function (a, b, t) { const A = hex(a), B = hex(b); return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",") + ")"; };

  // sky + panoramas; tod: 0 day, 1 sunset, 2 night
  Gfx.drawSky = function (g, key, tod, horizon, skyX, t, alpha = 1) {
    const th = T[key];
    g.globalAlpha = alpha;
    let top = th.sky[0], bot = th.sky[1];
    if (tod === 1) { top = Gfx.mix(top, "#4a2a7a", 0.6); bot = Gfx.mix(bot, "#ff8a40", 0.7); }
    if (tod === 2) { top = "#05061a"; bot = Gfx.mix(bot, "#1a1440", 0.8); }
    const gr = g.createLinearGradient(0, 0, 0, horizon);
    gr.addColorStop(0, top); gr.addColorStop(1, bot);
    g.fillStyle = gr; g.fillRect(0, 0, LW, horizon + 2);
    if (th.stars || tod === 2) { g.fillStyle = "#ffffff"; for (const s of Gfx.stars) if (s.y < horizon - 10) { g.globalAlpha = alpha * (0.5 + 0.5 * Math.sin(t * 3 + s.x)); g.fillRect(s.x, s.y, s.s, s.s); } g.globalAlpha = alpha; }
    // sun / moon
    const sx = LW * 0.72 - (skyX * 0.05) % LW, sy = tod === 1 ? horizon - 34 : tod === 2 ? 50 : 46;
    if (tod === 2) { g.fillStyle = "#f0f0d0"; circ(g, sx, sy, 12); g.fill(); g.fillStyle = top; circ(g, sx + 5, sy - 3, 10); g.fill(); }
    else {
      g.fillStyle = tod === 1 ? "#ffd060" : "#fff8c0"; circ(g, sx, sy, tod === 1 ? 32 : 16); g.fill();
      if (tod === 1) { g.fillStyle = Gfx.mix(bot, "#ff6a2a", 0.5); for (let i = 0; i < 5; i++) g.fillRect(sx - 34, sy + 6 + i * 6, 68, 2 + i * 0.5); }
    }
    if (th.clouds && tod !== 2) {
      g.fillStyle = tod === 1 ? "rgba(255,190,170,0.85)" : "rgba(255,255,255,0.9)";
      Gfx.clouds.forEach((c, i) => {
        if (i / Gfx.clouds.length >= th.clouds) return;
        const x = ((c.x - skyX * 0.1 + t * 4) % 1280 + 1280) % 1280 - 100;
        if (x > LW + 60) return;
        g.beginPath(); g.ellipse(x, c.y, c.w * 0.5, 7, 0, 0, TAU); g.ellipse(x - c.w * 0.2, c.y - 5, c.w * 0.25, 7, 0, 0, TAU); g.ellipse(x + c.w * 0.15, c.y - 6, c.w * 0.22, 8, 0, 0, TAU); g.fill();
      });
    }
    const B = Gfx.bg[key];
    const fx = ((-skyX * 0.25) % 1280 + 1280) % 1280, nx = ((-skyX * 0.6) % 1280 + 1280) % 1280;
    if (tod) g.filter = tod === 2 ? "brightness(0.45) saturate(0.8)" : "brightness(0.8) sepia(0.25)";
    for (const [img, ox] of [[B.far, fx], [B.near, nx]]) {
      g.drawImage(img, ox - 1280, horizon - 140 + 2); g.drawImage(img, ox, horizon - 140 + 2);
    }
    g.filter = "none";
    g.globalAlpha = 1;
  };
})(window.XA);
