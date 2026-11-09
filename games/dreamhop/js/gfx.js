/* DREAMHOP: cute pixel graphics drawn by code (crisp, alpha-thresholded), tiles, backgrounds */
"use strict";

(function (XA) {
  const U = XA.U, TAU = U.TAU;
  const Gfx = (XA.Gfx = { spr: {} });
  const LW = (Gfx.LW = 320), LH = (Gfx.LH = 180), TS = (Gfx.TS = 16);

  // draw with canvas primitives, then snap every pixel to fully opaque or transparent
  function pix(w, h, draw) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d");
    draw(g, w, h);
    const d = g.getImageData(0, 0, w, h), a = d.data;
    for (let i = 3; i < a.length; i += 4) a[i] = a[i] > 110 ? 255 : 0;
    g.putImageData(d, 0, 0);
    return c;
  }
  Gfx.pix = pix;
  const R = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const C = (g, c, x, y, r) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  const E = (g, c, x, y, rx, ry, rot = 0) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); };
  const P = (g, c, pts) => { g.fillStyle = c; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); };
  function star(g, c, x, y, r) { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } P(g, c, pts); }
  Gfx.star = star;

  /* ---------- Lulu, the dreaming heroine (20 x 24, feet at the bottom centre) ---------- */
  function hero(o) {
    return pix(22, 26, (g) => {
      const ox = 11, by = 25; // bottom centre
      const pw = o.power;
      const hair = pw ? "#ff4ac8" : "#1ec8b8", hairD = pw ? "#c0208a" : "#128a80", outline = "#2a1838";
      const bob = o.bob || 0;
      const hy = by - 16 + bob; // head centre y
      // legs and slippers
      const lp = o.legs || [0, 0];
      for (let i = 0; i < 2; i++) {
        const lx = ox - 3 + i * 5 + lp[i], ly = by - 5 + (o.legY ? o.legY[i] : 0);
        R(g, "#ffd2b0", lx, ly, 2, 3);
        E(g, "#8a5aff", lx + 1 + (o.face || 1) * 0.5, by - 1.5 + (o.legY ? o.legY[i] : 0), 2.4, 1.6);
      }
      // pyjama body
      g.fillStyle = outline; g.beginPath(); g.roundRect(ox - 6, hy + 5, 12, 10, 3); g.fill();
      g.fillStyle = "#ff8ac0"; g.beginPath(); g.roundRect(ox - 5, hy + 6, 10, 8, 2.5); g.fill();
      R(g, "#ffffff", ox - 3, hy + 8, 1, 1); R(g, "#ffffff", ox + 2, hy + 10, 1, 1); R(g, "#ffffff", ox - 1, hy + 12, 1, 1);
      R(g, "#ffe040", ox - 1, hy + 6, 2, 1);
      // arms
      const arm = o.arms || "down";
      g.fillStyle = "#ffd2b0";
      if (arm === "down") { R(g, "#ff8ac0", ox - 7, hy + 7, 2, 4); R(g, "#ff8ac0", ox + 5, hy + 7, 2, 4); R(g, "#ffd2b0", ox - 7, hy + 11, 2, 1); R(g, "#ffd2b0", ox + 5, hy + 11, 2, 1); }
      else if (arm === "up") { R(g, "#ff8ac0", ox - 8, hy + 1, 2, 6); R(g, "#ff8ac0", ox + 6, hy + 1, 2, 6); R(g, "#ffd2b0", ox - 8, hy, 2, 2); R(g, "#ffd2b0", ox + 6, hy, 2, 2); }
      else if (arm === "swing") { const s = o.swing || 0; R(g, "#ff8ac0", ox - 7 - s, hy + 7, 2, 4); R(g, "#ff8ac0", ox + 5 + s, hy + 7, 2, 4); }
      else if (arm === "shoot") { R(g, "#ff8ac0", ox + 4, hy + 7, 5, 2); R(g, "#ffd2b0", ox + 9, hy + 7, 2, 2); R(g, "#ff8ac0", ox - 7, hy + 7, 2, 4); }
      // head
      C(g, outline, ox, hy, 7.2);
      C(g, "#ffd2b0", ox, hy + 0.5, 6.2);
      // hair (bob with fringe, or wild spiky power hair)
      if (pw) {
        const pts = [];
        for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI, r = i % 2 ? 7.5 : 10.5; pts.push(ox + Math.cos(a) * r, hy - 1 + Math.sin(a) * r); }
        pts.push(ox + 7, hy + 3, ox - 7, hy + 3);
        P(g, hair, pts);
        R(g, hairD, ox - 7, hy - 1, 2, 5); R(g, hairD, ox + 5, hy - 1, 2, 5);
      } else {
        g.fillStyle = hair; g.beginPath(); g.ellipse(ox, hy - 2, 7.5, 6.5, 0, Math.PI, TAU); g.fill();
        R(g, hair, ox - 7.5, hy - 2, 3, 7); R(g, hair, ox + 4.5, hy - 2, 3, 7);
        R(g, hairD, ox - 7.5, hy + 3, 3, 2); R(g, hairD, ox + 4.5, hy + 3, 3, 2);
        P(g, hair, [ox - 5, hy - 3, ox + 5, hy - 3, ox + 4, hy, ox + 1, hy - 1.5, ox - 2, hy, ox - 5, hy - 1]);
      }
      star(g, pw ? "#fff6a0" : "#ffe040", ox + 4.5, hy - 5, 2.6);
      // face
      const f = o.face || 1, ex = ox + f * 1;
      if (o.eyes === "closed" || o.blink) { R(g, outline, ex - 3, hy + 1, 2, 1); R(g, outline, ex + 1, hy + 1, 2, 1); }
      else if (o.eyes === "x") { R(g, outline, ex - 3, hy, 1, 1); R(g, outline, ex - 2, hy + 1, 1, 1); R(g, outline, ex - 3, hy + 2, 1, 1); R(g, outline, ex - 1, hy, 1, 1); R(g, outline, ex - 1, hy + 2, 1, 1); R(g, outline, ex + 1, hy, 1, 1); R(g, outline, ex + 2, hy + 1, 1, 1); R(g, outline, ex + 3, hy, 1, 1); R(g, outline, ex + 1, hy + 2, 1, 1); R(g, outline, ex + 3, hy + 2, 1, 1); }
      else { R(g, outline, ex - 3, hy, 2, 3); R(g, outline, ex + 1, hy, 2, 3); R(g, "#ffffff", ex - 3, hy, 1, 1); R(g, "#ffffff", ex + 1, hy, 1, 1); }
      R(g, "#ff9a9a", ex - 5, hy + 3, 2, 1); R(g, "#ff9a9a", ex + 3, hy + 3, 2, 1);
      if (o.mouth === "o") R(g, "#a02040", ex - 0.5, hy + 4, 2, 2);
      else if (o.mouth === "smile") { R(g, "#a02040", ex - 1.5, hy + 4, 4, 1); R(g, "#a02040", ex - 0.5, hy + 5, 2, 1); }
      else if (o.mouth === "yawn") E(g, "#a02040", ex, hy + 4.5, 1.6, 2);
      else R(g, "#a02040", ex - 0.5, hy + 4, 2, 1);
    });
  }

  /* ---------- Enemies (16 x 16); colours depend on the world ---------- */
  const EN = {
    walker(g, f, p) {
      // a grumpy little beetle: round shell with dots, small head with antennae
      const step = f ? 1 : -1;
      for (let i = 0; i < 3; i++) { R(g, "#1a1020", 4 + i * 3 + (i % 2 ? step : -step), 13, 2, 3); }
      E(g, "#1a1020", 9, 9, 6.5, 5.6); E(g, p.a, 9, 8.6, 5.6, 4.7);
      R(g, "#1a1020", 9, 4, 1, 9);
      C(g, p.b, 6.5, 7, 1.2); C(g, p.b, 11.5, 7, 1.2); C(g, p.b, 7, 10.5, 1); C(g, p.b, 11, 10.5, 1);
      C(g, p.d, 3.5, 10, 3.2);
      R(g, "#ffffff", 1, 8, 2, 2); R(g, "#1a1020", 1, 9, 1, 1); R(g, "#ffffff", 4, 8, 2, 2); R(g, "#1a1020", 4, 9, 1, 1);
      R(g, "#1a1020", 1, 7, 2, 1); R(g, "#1a1020", 4, 7, 2, 1);
      g.strokeStyle = "#1a1020"; g.lineWidth = 1; g.beginPath(); g.moveTo(2, 7); g.lineTo(0, 3); g.moveTo(5, 7); g.lineTo(6, 3); g.stroke();
    },
    squashed(g, f, p) { E(g, p.d, 8, 13.5, 8, 2.5); E(g, p.a, 8, 13, 7, 2); R(g, "#1a1020", 4, 12, 3, 1); R(g, "#1a1020", 9, 12, 3, 1); },
    flyer(g, f, p) {
      E(g, "rgba(230,250,255,1)", 5, f ? 3 : 6, 4, f ? 3 : 2); E(g, "rgba(230,250,255,1)", 11, f ? 3 : 6, 4, f ? 3 : 2);
      E(g, p.d, 8, 10, 6.5, 5.5); E(g, p.a, 8, 10, 5.5, 4.6);
      R(g, p.b, 3, 9, 10, 2); R(g, p.b, 4, 12, 8, 1.5);
      R(g, "#ffffff", 4, 7, 3, 3); R(g, "#1a1020", 5, 8, 2, 2); R(g, "#ffffff", 9, 7, 3, 3); R(g, "#1a1020", 10, 8, 2, 2);
      P(g, "#1a1020", [7, 15, 9, 15, 8, 16]);
    },
    jumper(g, f, p) {
      const sq = f ? 1 : 0;
      E(g, p.d, 8, 11 + sq, 7.5, 5 - sq); E(g, p.a, 8, 10.6 + sq, 6.6, 4.2 - sq);
      C(g, p.d, 4.5, 6 + sq * 2, 3); C(g, p.d, 11.5, 6 + sq * 2, 3); C(g, "#ffffff", 4.5, 6 + sq * 2, 2.2); C(g, "#ffffff", 11.5, 6 + sq * 2, 2.2);
      R(g, "#1a1020", 4, 6 + sq * 2, 2, 2); R(g, "#1a1020", 11, 6 + sq * 2, 2, 2);
      R(g, p.b, 5, 12 + sq, 6, 1); R(g, p.d, 1, 14, 4, 2); R(g, p.d, 11, 14, 4, 2);
    },
    spiky(g, f, p) {
      for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; P(g, p.b, [8 + Math.cos(a - 0.2) * 5, 10 + Math.sin(a - 0.2) * 5, 8 + Math.cos(a) * 8.5, 10 + Math.sin(a) * 8.5, 8 + Math.cos(a + 0.2) * 5, 10 + Math.sin(a + 0.2) * 5]); }
      E(g, p.d, 8, 11, 6.5, 5); E(g, p.a, 9, 11.5, 5, 3.6);
      R(g, "#1a1020", 10 + (f ? 1 : 0), 10, 2, 2); R(g, "#1a1020", 13, 12, 2, 1);
      R(g, p.d, 4 + (f ? 1 : 0), 14, 3, 2); R(g, p.d, 10 - (f ? 1 : 0), 14, 3, 2);
    },
    spitter(g, f, p) {
      R(g, "#a0602a", 4, 12, 8, 4); R(g, "#7a4018", 4, 12, 8, 1);
      R(g, "#3a9a3a", 7, 7, 2, 5);
      E(g, p.a, 8, 5, 6, f ? 4.5 : 3.5); E(g, p.d, 8, 5.5, 3.5, f ? 2.5 : 1);
      R(g, "#ffffff", 4, 2, 2, 2); R(g, "#ffffff", 10, 2, 2, 2);
    },
  };
  Gfx.WORLD_PAL = [
    { walker: { a: "#e8283a", b: "#1a1020", d: "#3a2a2a" }, flyer: { a: "#ffd030", b: "#2a1a10", d: "#8a5a00" }, jumper: { a: "#5ad04a", b: "#ffe0a0", d: "#1a6a1a" }, spiky: { a: "#e0b080", b: "#6a4020", d: "#3a2010" }, spitter: { a: "#ff4a6a", d: "#7a0a2a" } },
    { walker: { a: "#40c0a0", b: "#d0fff0", d: "#2a2048" }, flyer: { a: "#5a4a7a", b: "#ffcc40", d: "#1a1030" }, jumper: { a: "#40c0e0", b: "#c0f0ff", d: "#105a7a" }, spiky: { a: "#80e0ff", b: "#ffffff", d: "#2a6a8a" }, spitter: { a: "#c060ff", d: "#4a1060" } },
    { walker: { a: "#ff6ab0", b: "#ffffff", d: "#8a1a50" }, flyer: { a: "#ffe060", b: "#ff4a8a", d: "#a06000" }, jumper: { a: "#60e0a0", b: "#e0fff0", d: "#1a7a4a" }, spiky: { a: "#ffa040", b: "#ffffff", d: "#a04a00" }, spitter: { a: "#ff8a30", d: "#8a3000" } },
    { walker: { a: "#ffd040", b: "#6a4aff", d: "#4a3a8a" }, flyer: { a: "#5a5aff", b: "#ffe040", d: "#1a1a6a" }, jumper: { a: "#ff7ad0", b: "#ffd8f0", d: "#7a1a5a" }, spiky: { a: "#ffe040", b: "#fff8c0", d: "#8a6a00" }, spitter: { a: "#40e0ff", d: "#0a4a6a" } },
  ];

  /* ---------- Items ---------- */
  const ITEMS = {
    gem: (f) => pix(12, 12, (g) => { const w = [5, 3.5, 1, 3.5][f]; P(g, "#1a6aa0", [6 - w - 1, 4, 6, 0, 6 + w + 1, 4, 6, 11]); P(g, f === 2 ? "#a0e8ff" : "#40c8ff", [6 - w, 4, 6, 1, 6 + w, 4, 6, 10]); if (w > 2) { R(g, "#e8ffff", 6 - w + 1, 3, 2, 2); } }),
    orb: () => pix(14, 14, (g) => { C(g, "#8a2a8a", 7, 7, 6.5); C(g, "#ff6ad8", 7, 7, 5.5); C(g, "#ffd8f8", 5, 5, 2); star(g, "#fff6a0", 7, 7.5, 3); }),
    wand: () => pix(14, 14, (g) => { R(g, "#8a5a2a", 3, 7, 2, 7); R(g, "#c08a4a", 4, 7, 1, 7); star(g, "#ffe040", 6, 5, 5.5); star(g, "#fff8c0", 6, 5, 2.5); }),
    lolly: () => pix(14, 16, (g) => { R(g, "#ffffff", 6, 8, 2, 8); C(g, "#ff3a6a", 7, 6, 6); g.strokeStyle = "#ffffff"; g.lineWidth = 1.5; g.beginPath(); for (let a = 0; a < 12; a += 0.3) { const r = a * 0.45; g.lineTo(7 + Math.cos(a) * r, 6 + Math.sin(a) * r); } g.stroke(); }),
    clock: () => pix(14, 14, (g) => { C(g, "#8a5a00", 7, 7.5, 6.5); C(g, "#ffffff", 7, 7.5, 5); R(g, "#2a1838", 6.5, 3.5, 1, 4.5); R(g, "#2a1838", 7, 7, 3, 1); R(g, "#ffd040", 2, 0, 3, 3); R(g, "#ffd040", 9, 0, 3, 3); }),
    bolt: () => pix(14, 14, (g) => { P(g, "#8a6a00", [8, 0, 1, 8, 6, 8, 4, 14, 13, 5, 8, 5, 10, 0]); P(g, "#ffe040", [8, 1, 2.5, 7.5, 7, 7.5, 5.5, 12, 11.5, 5.5, 7, 5.5, 9, 1]); }),
    bubble: () => pix(14, 14, (g) => { C(g, "#40a0ff", 7, 7, 6.5); C(g, "#a8e0ff", 7, 7, 5.3); C(g, "#ffffff", 5, 5, 1.8); }),
    shot: (f) => pix(8, 8, (g) => star(g, f ? "#fff6a0" : "#ffe040", 4, 4.3, 4)),
    seed: () => pix(6, 6, (g) => { C(g, "#3a1a0a", 3, 3, 2.8); C(g, "#ff8a3a", 3, 3, 2); }),
    debris: () => pix(5, 5, (g) => { R(g, "#5a2a10", 0, 0, 5, 5); R(g, "#c86a3a", 0, 0, 4, 4); }),
  };

  /* ---------- Worlds: palettes, tiles, decorations, backgrounds ---------- */
  Gfx.WORLDS = [
    { name: "Meadow of Naps", sky: ["#6ac8ff", "#d8f4ff"], grass: "#5ad04a", grassD: "#2a8a2a", dirt: "#c08050", dirtD: "#8a5030", dirtL: "#e0a070", brick: "#e0703a", brickD: "#8a3a1a", block: "#ffc030", liquid: ["#3a8aff", "#a0d8ff"], deco: ["flower", "flower2", "bush", "mushroom"], bg: "hills", song: "w1" },
    { name: "Crystal Caverns", sky: ["#1a1438", "#3a2a5a"], grass: "#6ae0c0", grassD: "#2a8a7a", dirt: "#5a5a8a", dirtD: "#34345a", dirtL: "#8a8ab8", brick: "#4a6ad0", brickD: "#1a2a6a", block: "#b080ff", liquid: ["#ff5a1a", "#ffd040"], deco: ["crystal", "glowshroom", "crystal2", "rocks"], bg: "cave", song: "w2", dark: true },
    { name: "Sugar Hills", sky: ["#ffb0d8", "#fff0f8"], grass: "#ff8ac8", grassD: "#d04a90", dirt: "#c88a5a", dirtD: "#8a5a3a", dirtL: "#f0c090", brick: "#7a3a1a", brickD: "#3a1a08", block: "#60d8ff", liquid: ["#6a3a1a", "#a0603a"], deco: ["cane", "gumdrop", "lollydeco", "cupcake"], bg: "candy", song: "w3" },
    { name: "Starlight Clouds", sky: ["#14103a", "#4a2a7a"], grass: "#ffffff", grassD: "#c8c8f0", dirt: "#8a7ad0", dirtD: "#5a4aa0", dirtL: "#b8a8f0", brick: "#ffd040", brickD: "#a07a00", block: "#ff7ad0", liquid: ["#2a1a5a", "#4a3a8a"], deco: ["stardeco", "moondeco", "cloudlet", "stardeco"], bg: "stars", song: "w4", dark: true },
  ];

  function tiles(w) {
    const T = {};
    T.ground = pix(16, 16, (g) => {
      R(g, w.dirt, 0, 0, 16, 16);
      for (let i = 0; i < 6; i++) { R(g, w.dirtD, (i * 7) % 14, (i * 5) % 13 + 2, 3, 2); R(g, w.dirtL, (i * 11 + 3) % 14, (i * 3 + 7) % 13, 2, 1); }
    });
    T.top = pix(16, 16, (g) => {
      g.drawImage(T.ground, 0, 0);
      R(g, w.grassD, 0, 0, 16, 6); R(g, w.grass, 0, 0, 16, 4);
      for (let x = 0; x < 16; x += 4) R(g, w.grass, x + 1, 4, 2, 2 + (x % 8 ? 1 : 0));
      R(g, "rgba(255,255,255,0.7)", 2, 1, 3, 1); R(g, "rgba(255,255,255,0.7)", 10, 1, 2, 1);
    });
    T.brick = pix(16, 16, (g) => {
      R(g, w.brickD, 0, 0, 16, 16);
      for (let y = 0; y < 4; y++) for (let x = -1; x < 3; x++) { const ox = y % 2 ? 4 : 0; R(g, w.brick, x * 8 + ox + 1, y * 4 + 1, 6, 2); R(g, "rgba(255,255,255,0.35)", x * 8 + ox + 1, y * 4 + 1, 6, 1); }
    });
    T.block = [0, 1, 2, 3].map((f) => pix(16, 16, (g) => {
      R(g, "#5a3a10", 0, 0, 16, 16); R(g, w.block, 1, 1, 14, 14);
      R(g, "rgba(255,255,255,0.6)", 1, 1, 14, 1); R(g, "rgba(0,0,0,0.25)", 1, 14, 14, 1);
      for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) R(g, "#5a3a10", x, y, 1, 1);
      star(g, "#ffffff", 8, 8.5, 4.6 + (f === 1 ? 0.6 : f === 3 ? -0.4 : 0));
      if (f === 2) R(g, "#ffffff", 11, 4, 1, 1);
    }));
    T.used = pix(16, 16, (g) => { R(g, "#5a3a10", 0, 0, 16, 16); R(g, "#a08060", 1, 1, 14, 14); R(g, "#7a5a40", 3, 3, 10, 10); R(g, "#a08060", 4, 4, 8, 8); });
    T.solid = pix(16, 16, (g) => { R(g, w.dirtD, 0, 0, 16, 16); R(g, w.dirtL, 1, 1, 14, 3); R(g, w.dirt, 1, 4, 14, 11); R(g, w.dirtD, 4, 7, 3, 2); R(g, w.dirtD, 10, 10, 3, 2); });
    T.oneway = pix(16, 16, (g) => { R(g, w.grassD, 0, 0, 16, 5); R(g, w.grass, 0, 0, 16, 3); R(g, w.dirtD, 2, 5, 2, 3); R(g, w.dirtD, 12, 5, 2, 3); });
    T.spikes = pix(16, 16, (g) => { for (let i = 0; i < 4; i++) { P(g, "#5a5a6a", [i * 4, 16, i * 4 + 2, 6, i * 4 + 4, 16]); P(g, "#e0e0f0", [i * 4 + 1, 16, i * 4 + 2, 8, i * 4 + 2.5, 16]); } });
    T.liquid = [0, 1, 2, 3].map((f) => pix(16, 16, (g) => {
      R(g, w.liquid[0], 0, 3, 16, 13);
      for (let x = 0; x < 16; x++) R(g, w.liquid[1], x, 2 + Math.round(Math.sin((x + f * 4) * Math.PI / 8) * 1.5), 1, 2);
    }));
    T.liquidD = pix(16, 16, (g) => R(g, w.liquid[0], 0, 0, 16, 16));
    T.door = pix(24, 40, (g) => {
      E(g, "#2a1838", 12, 20, 12, 20); E(g, "#8a5aff", 12, 20, 11, 19); E(g, "#c8a0ff", 12, 20, 8, 16); E(g, "#ffffff", 12, 21, 5, 12);
      for (let i = 0; i < 5; i++) star(g, "#ffe040", 4 + i * 4, 3 + Math.abs(2 - i) * 2, 2.2);
    });
    T.pillow = pix(16, 12, (g) => { g.fillStyle = "#2a1838"; g.beginPath(); g.roundRect(0, 2, 16, 10, 4); g.fill(); g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(1, 3, 14, 8, 3); g.fill(); R(g, "#b0d0ff", 3, 6, 10, 1); });
    T.pillowOn = pix(16, 12, (g) => { g.fillStyle = "#2a1838"; g.beginPath(); g.roundRect(0, 2, 16, 10, 4); g.fill(); g.fillStyle = "#fff6a0"; g.beginPath(); g.roundRect(1, 3, 14, 8, 3); g.fill(); star(g, "#ffb000", 8, 7, 3); });
    T.spring = [0, 1].map((f) => pix(16, 16, (g) => { R(g, "#5a5a6a", 2, 14, 12, 2); for (let i = 0; i < 3; i++) R(g, "#c0c0d0", 4, 13 - i * (f ? 2 : 3) - 2, 8, 1); R(g, "#ff3a5a", 1, f ? 6 : 3, 14, 3); }));
    T.moving = pix(48, 10, (g) => { g.fillStyle = "#2a1838"; g.beginPath(); g.roundRect(0, 0, 48, 10, 4); g.fill(); g.fillStyle = w.block; g.beginPath(); g.roundRect(1, 1, 46, 7, 3); g.fill(); for (let i = 0; i < 4; i++) star(g, "#ffffff", 8 + i * 11, 4.5, 2.4); });
    // decorations (drawn on top of ground tiles)
    const D = {
      flower: () => pix(10, 14, (g) => { R(g, "#2a8a2a", 4, 6, 2, 8); E(g, "#3aaa3a", 7, 10, 3, 1.5); for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; C(g, "#ff6aa0", 5 + Math.cos(a) * 2.5, 4 + Math.sin(a) * 2.5, 1.8); } C(g, "#ffe040", 5, 4, 1.5); }),
      flower2: () => pix(10, 14, (g) => { R(g, "#2a8a2a", 4, 6, 2, 8); for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; C(g, "#ffffff", 5 + Math.cos(a) * 2.5, 4 + Math.sin(a) * 2.5, 1.8); } C(g, "#ffb000", 5, 4, 1.5); }),
      bush: () => pix(28, 14, (g) => { for (const [x, r] of [[6, 6], [14, 8], [22, 6]]) C(g, "#2a8a2a", x, 14 - r * 0.7, r); for (const [x, r] of [[6, 5], [14, 7], [22, 5]]) C(g, "#4ac04a", x, 13 - r * 0.7, r); R(g, "#ff4a6a", 10, 6, 2, 2); R(g, "#ff4a6a", 19, 8, 2, 2); }),
      mushroom: () => pix(14, 14, (g) => { R(g, "#fff0d8", 5, 7, 4, 7); E(g, "#e8902a", 7, 6, 7, 5); g.fillRect(0, 6, 14, 1); C(g, "#ffe8a0", 4, 4, 1.5); C(g, "#ffe8a0", 9, 3, 1.3); C(g, "#ffe8a0", 11, 6, 1); }),
      crystal: () => pix(14, 18, (g) => { P(g, "#2a6a8a", [2, 18, 4, 6, 7, 2, 10, 6, 12, 18]); P(g, "#80e0ff", [4, 18, 5, 7, 7, 3, 8, 7, 10, 18]); R(g, "#ffffff", 6, 6, 1, 6); }),
      crystal2: () => pix(16, 14, (g) => { P(g, "#6a2a8a", [0, 14, 3, 4, 6, 14]); P(g, "#d080ff", [1, 14, 3, 6, 5, 14]); P(g, "#6a2a8a", [5, 14, 9, 0, 13, 14]); P(g, "#d080ff", [6, 14, 9, 2, 12, 14]); }),
      glowshroom: () => pix(12, 14, (g) => { R(g, "#c0f0ff", 5, 6, 2, 8); E(g, "#40ffd0", 6, 6, 6, 4); g.fillRect(0, 6, 12, 1); C(g, "#ffffff", 4, 4, 1); }),
      rocks: () => pix(18, 8, (g) => { E(g, "#34345a", 5, 6, 5, 3); E(g, "#5a5a8a", 5, 5, 4, 2.5); E(g, "#34345a", 13, 6, 5, 3.5); E(g, "#5a5a8a", 13, 5, 4, 3); }),
      cane: () => pix(12, 24, (g) => { g.lineCap = "round"; g.strokeStyle = "#ffffff"; g.lineWidth = 3; g.beginPath(); g.moveTo(4, 24); g.lineTo(4, 8); g.arc(7, 8, 3, Math.PI, 0); g.stroke(); g.strokeStyle = "#ff3a5a"; g.setLineDash([2, 2]); g.stroke(); }),
      gumdrop: () => pix(12, 10, (g) => { E(g, "#40c060", 6, 9, 6, 8); g.fillStyle = "#80ff9a"; g.fillRect(2, 3, 2, 2); }),
      lollydeco: () => pix(12, 24, (g) => { R(g, "#ffffff", 5, 10, 2, 14); C(g, "#ffb000", 6, 6, 5.5); C(g, "#ff6a00", 6, 6, 3); C(g, "#fff0a0", 6, 6, 1.2); }),
      cupcake: () => pix(14, 14, (g) => { P(g, "#c06a2a", [2, 7, 12, 7, 11, 14, 3, 14]); E(g, "#ffd0e8", 7, 6, 6, 4); C(g, "#ff3a5a", 7, 2, 2); }),
      stardeco: () => pix(12, 12, (g) => { star(g, "#ffe040", 6, 6.5, 6); star(g, "#fff8c0", 6, 6.5, 2.5); }),
      moondeco: () => pix(12, 12, (g) => { C(g, "#fff6c0", 6, 6, 5.5); C(g, "rgba(0,0,0,1)", 8.5, 4.5, 4.5); }),
      cloudlet: () => pix(20, 10, (g) => { C(g, "#d8d8ff", 6, 6, 4); C(g, "#d8d8ff", 12, 5, 5); C(g, "#d8d8ff", 16, 7, 3); C(g, "#ffffff", 7, 5, 3.4); C(g, "#ffffff", 12, 4, 4.2); }),
    };
    T.deco = w.deco.map((k) => {
      const c = D[k]();
      if (k === "moondeco") { const g = c.getContext("2d"); g.globalCompositeOperation = "destination-out"; C(g, "#000", 8.5, 4.5, 4.5); }
      return c;
    });
    return T;
  }

  function background(w, k) {
    const far = document.createElement("canvas"); far.width = 640; far.height = 180;
    const near = document.createElement("canvas"); near.width = 640; near.height = 180;
    const g1 = far.getContext("2d"), g2 = near.getContext("2d"), r = U.rng(k * 31 + 7);
    const hills = (g, col, base, amp, f, ph) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, 180); for (let x = 0; x <= 640; x += 4) g.lineTo(x, base - Math.abs(Math.sin((x / 640) * Math.PI * f + ph)) * amp); g.lineTo(640, 180); g.fill(); };
    if (w.bg === "hills") {
      for (let i = 0; i < 7; i++) { const x = r() * 640, y = 20 + r() * 50, s = 10 + r() * 14; g1.fillStyle = "#ffffff"; for (let j = 0; j < 4; j++) { g1.beginPath(); g1.arc(x + j * s * 0.7, y - (j % 2) * s * 0.3, s * 0.6, 0, TAU); g1.fill(); } }
      hills(g1, "#a8e0a0", 130, 50, 3, 0.4);
      hills(g2, "#7ac870", 160, 40, 5, 1.1);
      for (let i = 0; i < 18; i++) { const x = r() * 640; g2.fillStyle = "#4aa040"; g2.beginPath(); g2.arc(x, 150, 6 + r() * 6, 0, TAU); g2.fill(); }
    } else if (w.bg === "cave") {
      for (let i = 0; i < 40; i++) { g1.fillStyle = r() < 0.5 ? "#2a2050" : "#3a3070"; const x = r() * 640, h = 20 + r() * 60; g1.beginPath(); g1.moveTo(x - 8, 0); g1.lineTo(x, h); g1.lineTo(x + 8, 0); g1.fill(); }
      for (let i = 0; i < 30; i++) { const x = r() * 640, y = 40 + r() * 120; g1.fillStyle = `rgba(120,220,255,${0.2 + r() * 0.3})`; g1.fillRect(x, y, 2, 2); }
      hills(g2, "#2a2450", 170, 60, 6, 0.3);
      for (let i = 0; i < 14; i++) { const x = r() * 640; g2.fillStyle = "#5a3a8a"; g2.beginPath(); g2.moveTo(x - 6, 180); g2.lineTo(x, 120 + r() * 30); g2.lineTo(x + 6, 180); g2.fill(); }
    } else if (w.bg === "candy") {
      hills(g1, "#ffd0e8", 120, 40, 4, 0);
      for (let i = 0; i < 9; i++) { const x = r() * 640, y = 60 + r() * 50; g1.fillStyle = U.pick(["#ffa0d0", "#a0e0ff", "#fff0a0"]); g1.beginPath(); g1.arc(x, y, 12, 0, TAU); g1.fill(); g1.fillStyle = "#ffffff"; g1.fillRect(x - 1, y + 12, 2, 70); }
      hills(g2, "#ffb0d8", 160, 30, 6, 0.8);
      for (let i = 0; i < 10; i++) { const x = r() * 640; g2.fillStyle = "#8a4a2a"; g2.fillRect(x, 120, 14, 60); g2.fillStyle = "#ffffff"; for (let y = 124; y < 180; y += 10) g2.fillRect(x, y, 14, 3); }
    } else {
      for (let i = 0; i < 90; i++) { g1.fillStyle = r() < 0.2 ? "#ffe8a0" : "#ffffff"; g1.fillRect(r() * 640, r() * 140, r() < 0.15 ? 2 : 1, r() < 0.15 ? 2 : 1); }
      g1.fillStyle = "#fff6c0"; g1.beginPath(); g1.arc(480, 40, 18, 0, TAU); g1.fill(); g1.fillStyle = "#14103a"; g1.beginPath(); g1.arc(490, 34, 16, 0, TAU); g1.fill();
      for (let i = 0; i < 8; i++) { const x = r() * 640, y = 130 + r() * 30; g2.fillStyle = "#5a4a9a"; for (let j = 0; j < 5; j++) { g2.beginPath(); g2.arc(x + j * 12, y - (j % 2) * 5, 10, 0, TAU); g2.fill(); } }
    }
    return { far, near };
  }

  Gfx.init = function () {
    // heroine frames for both forms
    Gfx.hero = [false, true].map((pw) => ({
      idle: hero({ power: pw, mouth: "smile" }),
      blink: hero({ power: pw, blink: true, mouth: "smile" }),
      walk: [0, 1, 2, 3].map((i) => { const a = [[-1, 1], [0, 0], [1, -1], [0, 0]][i]; return hero({ power: pw, legs: a, legY: [i === 1 ? -1 : 0, i === 3 ? -1 : 0], arms: "swing", swing: a[0], bob: i % 2 ? -1 : 0 }); }),
      jump: hero({ power: pw, arms: "up", mouth: "o", legs: [-1, 1], legY: [-2, 0] }),
      fall: hero({ power: pw, arms: "up", mouth: "o", legs: [1, -1] }),
      shoot: hero({ power: pw, arms: "shoot", mouth: "smile" }),
      win: [hero({ power: pw, arms: "up", mouth: "smile", eyes: "closed" }), hero({ power: pw, arms: "up", mouth: "smile", bob: -2 })],
      sleep: [hero({ power: pw, eyes: "closed", mouth: "yawn" }), hero({ power: pw, eyes: "closed", bob: 1 })],
      dead: hero({ power: pw, arms: "up", eyes: "x", mouth: "o" }),
    }));
    Gfx.enemies = Gfx.WORLD_PAL.map((pal) => {
      const out = {};
      for (const k of ["walker", "flyer", "jumper", "spiky", "spitter"]) out[k] = [0, 1].map((f) => pix(16, 16, (g) => EN[k](g, f, pal[k])));
      out.squashed = pix(16, 16, (g) => EN.squashed(g, 0, pal.walker));
      return out;
    });
    for (const k in ITEMS) Gfx.spr[k] = k === "gem" ? [0, 1, 2, 3].map((f) => ITEMS[k](f)) : k === "shot" ? [0, 1].map((f) => ITEMS[k](f)) : ITEMS[k]();
    Gfx.tiles = Gfx.WORLDS.map((w) => tiles(w));
    Gfx.bgs = Gfx.WORLDS.map((w, i) => background(w, i));
  };

  Gfx.drawBackground = function (g, wi, camX, camY, t) {
    const w = Gfx.WORLDS[wi], B = Gfx.bgs[wi];
    const gr = g.createLinearGradient(0, 0, 0, LH);
    gr.addColorStop(0, w.sky[0]); gr.addColorStop(1, w.sky[1]);
    g.fillStyle = gr; g.fillRect(0, 0, LW, LH);
    const fx = Math.floor(((-camX * 0.2) % 640 + 640) % 640), nx = Math.floor(((-camX * 0.5) % 640 + 640) % 640);
    const fy = Math.floor(-camY * 0.1), ny = Math.floor(-camY * 0.25);
    g.drawImage(B.far, fx - 640, fy); g.drawImage(B.far, fx, fy);
    g.drawImage(B.near, nx - 640, ny + 10); g.drawImage(B.near, nx, ny + 10);
  };
})(window.XA);
