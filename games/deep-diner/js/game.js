/* DEEP DINER: eat smaller fish, avoid bigger ones, grow and survive five underwater worlds.
   Everything – fish, scenery, effects – is drawn with code in a comic style. */
"use strict";

(function (XA) {
  const { U, Store, UI } = XA;
  const A = XA.Audio, I = XA.Input, States = XA.States, G = XA.G;
  const W = U.W, H = U.H, TAU = U.TAU;
  const { txt, bodyText, panel, wrap, makeMenu, menuInput, menuDraw } = UI;
  const OUT = "#1a1030";
  const SURFACE = 70, FLOOR = 650;

  /* ---------- worlds and levels ---------- */
  const WORLDS = [
    { name: "Coral Reef", sub: "Sunny shallows full of snacks", top: "#3fd0ff", mid: "#1590d8", bot: "#0b4f9a", sand: "#f2d38a", sandS: "#d0a860", ray: "rgba(255,255,220,0.13)", fog: "rgba(120,230,255,0.10)", song: "reef" },
    { name: "Kelp Forest", sub: "Tall swaying jungles of green", top: "#4ad8b0", mid: "#14806a", bot: "#0a3f3a", sand: "#c8b880", sandS: "#9a8a58", ray: "rgba(230,255,200,0.11)", fog: "rgba(120,255,200,0.08)", song: "kelp" },
    { name: "Sunken Ship", sub: "Pirate wrecks, mines and treasure", top: "#3a8ab0", mid: "#1a4a70", bot: "#0a1a34", sand: "#a89870", sandS: "#7a6a48", ray: "rgba(220,240,255,0.08)", fog: "rgba(80,150,200,0.10)", song: "wreck" },
    { name: "Frozen Sea", sub: "Icebergs, orcas and chilly bites", top: "#b8f0ff", mid: "#4ab0e0", bot: "#1a4a8a", sand: "#e8f4ff", sandS: "#b0c8e0", ray: "rgba(255,255,255,0.14)", fog: "rgba(220,250,255,0.10)", song: "arctic" },
    { name: "The Abyss", sub: "Dark, deep and full of teeth", top: "#1a2a6a", mid: "#0a0c30", bot: "#020210", sand: "#2a2440", sandS: "#1a1430", ray: "rgba(150,120,255,0.04)", fog: "rgba(80,60,200,0.06)", song: "abyss" },
  ];
  // species: c = size class (1..5), r = radius, sp = speed
  const SPECIES = {
    guppy: { c: 1, r: 13, sp: 110, col: "#ffd23a", col2: "#ff9a2a", belly: "#fff2a0", pat: "plain", fin: "#ff7a2a", pts: 10, grow: 2 },
    tetra: { c: 1, r: 12, sp: 140, col: "#3a8aff", col2: "#ff3a6a", belly: "#d8ecff", pat: "neon", fin: "#8ad0ff", pts: 10, grow: 2 },
    shrimp: { c: 1, r: 11, sp: 90, col: "#ff8a7a", col2: "#ff5a4a", belly: "#ffd0c8", pat: "shrimp", fin: "#ff6a5a", pts: 15, grow: 2 },
    clown: { c: 2, r: 21, sp: 115, col: "#ff7a1a", col2: "#ffffff", belly: "#ffb070", pat: "clown", fin: "#ff5a0a", pts: 25, grow: 5 },
    angel: { c: 2, r: 22, sp: 100, col: "#f0e05a", col2: "#2a2a3a", belly: "#fff8c0", pat: "angel", fin: "#e0c030", tall: 1.5, pts: 25, grow: 5 },
    puffer: { c: 2, r: 20, sp: 70, col: "#d8c070", col2: "#8a6a30", belly: "#fff0c0", pat: "spots", fin: "#c0a050", pts: 40, grow: 6, puffer: true },
    grouper: { c: 3, r: 34, sp: 95, col: "#7a8a4a", col2: "#4a5a2a", belly: "#d0d8a0", pat: "spots", fin: "#5a6a3a", lips: true, pts: 50, grow: 9 },
    tuna: { c: 3, r: 33, sp: 160, col: "#5a7aa8", col2: "#2a3a5a", belly: "#e8f0ff", pat: "silver", fin: "#ffd040", long: 1.3, pts: 50, grow: 9 },
    barracuda: { c: 4, r: 42, sp: 170, col: "#9aa8b8", col2: "#3a4a5a", belly: "#f0f4f8", pat: "bars", fin: "#6a7a8a", long: 2.0, teeth: true, pts: 100, grow: 14 },
    lion: { c: 4, r: 40, sp: 90, col: "#e04a3a", col2: "#ffffff", belly: "#ffd0c0", pat: "bars", fin: "#e06a5a", spiky: true, pts: 100, grow: 14 },
    angler: { c: 4, r: 40, sp: 80, col: "#3a2a4a", col2: "#1a102a", belly: "#5a4a6a", pat: "plain", fin: "#2a1a3a", teeth: true, lure: true, pts: 120, grow: 14 },
    shark: { c: 5, r: 72, sp: 150, col: "#7a8aa0", col2: "#4a5a70", belly: "#f0f4f8", pat: "shark", fin: "#6a7a90", long: 2.2, teeth: true, pts: 0, grow: 0 },
    orca: { c: 5, r: 74, sp: 140, col: "#1a1a24", col2: "#ffffff", belly: "#ffffff", pat: "orca", fin: "#1a1a24", long: 2.0, teeth: true, pts: 0, grow: 0 },
    seahorse: { c: 1, r: 14, sp: 50, col: "#ffa0e0", col2: "#c050a0", belly: "#ffe0f4", pat: "seahorse", fin: "#ff80d0", pts: 300, grow: 3, bonus: true },
  };
  // per world: which species appear by class
  const POOL = [
    { 1: ["guppy", "tetra"], 2: ["clown", "angel"], 3: ["grouper"], 4: ["barracuda"], 5: ["shark"], haz: { jelly: 1 } },
    { 1: ["guppy", "shrimp"], 2: ["angel", "puffer"], 3: ["grouper", "tuna"], 4: ["lion"], 5: ["shark"], haz: { jelly: 2 } },
    { 1: ["tetra", "shrimp"], 2: ["puffer", "clown"], 3: ["tuna", "grouper"], 4: ["barracuda", "lion"], 5: ["shark"], haz: { mine: 3, jelly: 1 } },
    { 1: ["shrimp", "guppy"], 2: ["angel", "puffer"], 3: ["tuna"], 4: ["barracuda"], 5: ["orca"], haz: { jelly: 2, ice: 2 } },
    { 1: ["tetra", "shrimp"], 2: ["puffer", "clown"], 3: ["grouper", "tuna"], 4: ["angler", "lion"], 5: ["shark"], haz: { jelly: 3 } },
  ];
  const LEVELS = [];
  for (let w = 0; w < 5; w++) for (let l = 0; l < 2; l++) {
    const n = w * 2 + l;
    LEVELS.push({ world: w, num: n + 1, goal: [22, 54, 96].map((g) => Math.round(g * (1 + n * 0.06))), spawn: 0.8 - n * 0.03, maxFish: 11 + Math.floor(n / 2), shark: n >= 1 ? 0.2 + n * 0.05 : 0, haz: POOL[w].haz });
  }
  const STAGE_R = [0, 22, 33, 47];

  /* ---------- theme for the shared screens ---------- */
  const COMIC = "'Luckiest Guy', 'Comic Sans MS', 'Arial Black', sans-serif";
  XA.Theme = {
    font: COMIC, body: "Nunito, 'Segoe UI', Arial, sans-serif", outline: OUT, round: 18,
    fonts: ["30px 'Luckiest Guy'", "700 20px Nunito"],
    accent: "#ffe040", soft: "#d8f4ff", menuText: "#e8f8ff", menuSel: "#ffffff", menuSize: 30, keyCol: "#ffe070",
    panel: "rgba(10,40,90,0.78)", panelStroke: "rgba(160,230,255,0.8)",
    sel: (t) => `rgba(255,120,60,${0.75 + 0.1 * Math.sin(t * 6)})`,
    songs: { title: "title" }, stageWord: "LEVEL", hsTitle: "TOP FEEDERS",
    voiceTest: "Feeding frenzy!", sayHighscore: "New high score! Tasty!",
    hsDefault: [["CHOMPY", 60000, "10"], ["FINLEY", 48000, "9"], ["BUBBLES", 38000, "8"], ["NEMMO", 30000, "7"], ["SNAPPER", 23000, "6"], ["GULPER", 17000, "5"], ["SQUID", 12000, "4"], ["PLANKY", 8000, "3"], ["GUPPY", 4500, "2"], ["MINNOW", 1500, "1"]],
    stageLabel: () => (G.run.won ? "ALL" : `${G.run.level + 1}`),
    controls: [
      ["MOUSE", [["move the mouse", "swim"], ["left button", "dash"], ["right button", "dash"], ["", ""], ["Esc / P", "pause"]]],
      ["KEYBOARD", [["arrows / W A S D", "swim"], ["Space / Shift", "dash"], ["Esc / P", "pause"], ["F", "fullscreen"], ["M", "mute"]]],
      ["GAMEPAD", [["left stick / D-pad", "swim"], ["A / B / X", "dash"], ["Start", "pause"]]],
    ],
    howto: "Eat fish that are smaller than you (their outline glows green) and stay away from bigger ones (red outline). Every snack fills the growth bar – grow twice, then fill it up to finish the level. Eat quickly in a row for a FEEDING FRENZY and a DOUBLE FRENZY. Jellyfish sting, puffers puff, mines go boom, pearls are shiny.",
    start() { newGame(); },
    back(ctx, t, kind) { drawScene(ctx, kind === "title" || kind === "boot" ? 0 : 1, t, true); ctx.fillStyle = kind === "menu" ? "rgba(5,20,50,0.45)" : "rgba(5,20,50,0.15)"; ctx.fillRect(0, 0, W, H); if (kind !== "menu") attract(ctx, t); },
    logo(ctx, t, y) { logo(ctx, t, y); },
    init() { buildScenes(); },
  };
  XA.SECRET = [67, 72, 79, 87, 84, 73, 77, 69];
  I.KEYS.fire = ["Space", "ShiftLeft", "ShiftRight", "KeyX", "KeyK"];

  /* ---------- scenery: static layers rendered once per world, animated details every frame ---------- */
  const scenes = [];
  function mk() { const c = document.createElement("canvas"); c.width = W; c.height = H; return c; }
  function buildScenes() { for (let w = 0; w < WORLDS.length; w++) scenes[w] = buildScene(w); }
  function buildScene(wi) {
    const c = mk(), g = c.getContext("2d"), Wd = WORLDS[wi], r = U.rng(wi * 977 + 5);
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, Wd.top); gr.addColorStop(0.45, Wd.mid); gr.addColorStop(1, Wd.bot);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // far silhouettes
    const far = (y0, amp, col, seed) => { const n = U.rng(seed); g.fillStyle = col; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 20) g.lineTo(x, y0 - (Math.sin(x * 0.006 + seed) * 0.5 + 0.5) * amp - n() * amp * 0.25); g.lineTo(W, H); g.fill(); };
    far(560, 120, shade(Wd.bot, 0.85, 0.5), wi * 3 + 1);
    far(600, 80, shade(Wd.bot, 0.7, 0.75), wi * 3 + 2);
    if (wi === 0) { // coral heads in the distance
      for (let i = 0; i < 9; i++) { const x = r() * W, s = 30 + r() * 60; g.fillStyle = `rgba(${200 + r() * 55},${80 + r() * 80},${120 + r() * 60},0.35)`; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(x + (r() - 0.5) * s, 600 - r() * s, s * 0.4, s * 0.6, 0, 0, TAU); g.fill(); } }
    }
    if (wi === 2) { // the wreck
      g.save(); g.translate(820, 560); g.rotate(-0.12);
      g.fillStyle = "#3a2a20"; g.strokeStyle = OUT; g.lineWidth = 5;
      g.beginPath(); g.moveTo(-260, -40); g.lineTo(260, -60); g.lineTo(220, 60); g.lineTo(-200, 70); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = "#2a1c14"; for (let i = -6; i < 7; i++) g.fillRect(i * 36, -50, 4, 110);
      g.fillStyle = "#4a3a2a"; g.fillRect(-60, -230, 14, 180); g.fillRect(90, -200, 12, 150);
      g.fillStyle = "rgba(220,220,200,0.35)"; g.beginPath(); g.moveTo(-46, -220); g.quadraticCurveTo(40, -170, -46, -110); g.fill();
      g.fillStyle = "#1a1410"; for (const x of [-150, -60, 30, 120]) { g.beginPath(); g.arc(x, 0, 12, 0, TAU); g.fill(); }
      g.restore();
    }
    if (wi === 3) { // icebergs hanging from the surface
      for (let i = 0; i < 5; i++) { const x = 100 + i * 270 + r() * 60, w = 120 + r() * 120, h = 90 + r() * 140; g.fillStyle = "rgba(230,250,255,0.75)"; g.strokeStyle = "rgba(120,180,220,0.9)"; g.lineWidth = 3; g.beginPath(); g.moveTo(x - w / 2, 40); g.lineTo(x + w / 2, 40); g.lineTo(x + w * 0.3, 40 + h * 0.6); g.lineTo(x, 40 + h); g.lineTo(x - w * 0.35, 40 + h * 0.5); g.closePath(); g.fill(); g.stroke(); }
    }
    if (wi === 4) { // glowing vents and a few distant lights
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${100 + r() * 155},${150 + r() * 100},255,${0.2 + r() * 0.4})`; g.beginPath(); g.arc(r() * W, 150 + r() * 400, 1 + r() * 2, 0, TAU); g.fill(); }
    }
    // sand floor
    g.fillStyle = Wd.sand; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) g.lineTo(x, FLOOR + Math.sin(x * 0.012 + wi) * 10 + Math.sin(x * 0.041) * 4);
    g.lineTo(W, H); g.closePath(); g.fill();
    g.strokeStyle = OUT; g.lineWidth = 4; g.beginPath(); for (let x = 0; x <= W; x += 16) { const y = FLOOR + Math.sin(x * 0.012 + wi) * 10 + Math.sin(x * 0.041) * 4; if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
    g.fillStyle = Wd.sandS; for (let i = 0; i < 160; i++) { g.beginPath(); g.ellipse(r() * W, FLOOR + 20 + r() * 50, 2 + r() * 4, 1 + r() * 2, 0, 0, TAU); g.fill(); }
    // rocks and shells
    for (let i = 0; i < 10; i++) {
      const x = r() * W, s = 18 + r() * 40, y = FLOOR + 14;
      g.fillStyle = wi === 3 ? "#c8dcf0" : wi === 4 ? "#3a2a50" : "#8a8a9a"; g.strokeStyle = OUT; g.lineWidth = 3;
      g.beginPath(); g.ellipse(x, y, s, s * 0.6, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = "rgba(255,255,255,0.25)"; g.beginPath(); g.ellipse(x - s * 0.3, y - s * 0.35, s * 0.3, s * 0.12, -0.3, 0, TAU); g.fill();
    }
    if (wi === 0 || wi === 1) for (let i = 0; i < 6; i++) { const x = r() * W; starfish(g, x, FLOOR + 30 + r() * 20, 10 + r() * 6, ["#ff7a5a", "#ffb03a", "#ff5aa0"][i % 3], r() * 6); }
    if (wi === 0) for (let i = 0; i < 7; i++) coral(g, 60 + i * 190 + r() * 60, FLOOR + 6, 50 + r() * 50, ["#ff6a9a", "#ffa040", "#c060ff", "#ff5050"][i % 4], r);
    return c;
  }
  function shade(hex, k, mixDark) { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.round(v * k * (1 - mixDark * 0.3)); return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`; }
  function starfish(g, x, y, r, col, rot) {
    g.save(); g.translate(x, y); g.rotate(rot); g.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = "rgba(255,255,255,0.6)"; for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU - Math.PI / 2; g.beginPath(); g.arc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, 1.5, 0, TAU); g.fill(); }
    g.restore();
  }
  function coral(g, x, y, h, col, r) {
    g.strokeStyle = OUT; g.lineWidth = 3; g.fillStyle = col;
    const branch = (bx, by, len, ang, depth) => {
      const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len;
      g.lineWidth = 3 + depth * 3; g.strokeStyle = OUT; g.beginPath(); g.moveTo(bx, by); g.lineTo(ex, ey); g.stroke();
      g.lineWidth = depth * 3 + 0.5; g.strokeStyle = col; g.beginPath(); g.moveTo(bx, by); g.lineTo(ex, ey); g.stroke();
      if (depth > 0) { branch(ex, ey, len * 0.7, ang - 0.5 - r() * 0.3, depth - 1); branch(ex, ey, len * 0.7, ang + 0.5 + r() * 0.3, depth - 1); }
      else { g.fillStyle = col; g.beginPath(); g.arc(ex, ey, 4, 0, TAU); g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke(); }
    };
    branch(x, y, h * 0.4, -Math.PI / 2, 3);
  }
  // animated parts: light rays, kelp, bubbles, plankton, background schools
  const bgFish = Array.from({ length: 22 }, (_, i) => ({ x: Math.random() * W, y: 120 + Math.random() * 380, s: 0.4 + Math.random() * 0.4, sp: 20 + Math.random() * 40, d: Math.random() < 0.5 ? 1 : -1, ph: Math.random() * 6 }));
  const ambBubbles = Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 2 + Math.random() * 5, sp: 30 + Math.random() * 60, ph: Math.random() * 6 }));
  function drawScene(ctx, wi, t, menu) {
    const Wd = WORLDS[wi];
    if (!scenes[wi]) scenes[wi] = buildScene(wi);
    ctx.drawImage(scenes[wi], 0, 0);
    // background schools of tiny fish
    ctx.save(); ctx.globalAlpha = wi === 4 ? 0.25 : 0.35;
    for (const f of bgFish) {
      const x = ((f.x + t * f.sp * f.d) % (W + 100) + W + 100) % (W + 100) - 50, y = f.y + Math.sin(t + f.ph) * 10;
      ctx.fillStyle = wi === 4 ? "#80a0ff" : "#0a3060"; ctx.beginPath(); ctx.ellipse(x, y, 10 * f.s, 4 * f.s, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - f.d * 9 * f.s, y); ctx.lineTo(x - f.d * 16 * f.s, y - 5 * f.s); ctx.lineTo(x - f.d * 16 * f.s, y + 5 * f.s); ctx.fill();
    }
    ctx.restore();
    // kelp (kelp forest and wreck) or sea grass
    const kelpN = wi === 1 ? 16 : wi === 2 ? 6 : wi === 3 ? 0 : 9;
    for (let i = 0; i < kelpN; i++) {
      const x = (i + 0.5) * (W / kelpN) + Math.sin(i * 7.3) * 30, h = wi === 1 ? 380 + (i % 4) * 70 : 90 + (i % 3) * 40;
      kelp(ctx, x, FLOOR + 10, h, t, i, wi === 4 ? "#4a3a8a" : wi === 1 ? "#3aa040" : "#4a9a3a");
    }
    // light rays from the surface
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 7; i++) {
      const x = ((i * 230 + t * 12) % (W + 400)) - 200, w = 50 + (i % 3) * 30, a = 0.5 + 0.5 * Math.sin(t * 0.7 + i);
      const gr = ctx.createLinearGradient(0, 0, 0, H * 0.9); gr.addColorStop(0, Wd.ray); gr.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalAlpha = a; ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w * 2.6 + 120, H * 0.9); ctx.lineTo(x + 120, H * 0.9); ctx.fill();
    }
    ctx.restore();
    // caustics on the sand
    ctx.save(); ctx.globalAlpha = wi === 4 ? 0.05 : 0.18; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
    for (let k = 0; k < 14; k++) { ctx.beginPath(); for (let x = 0; x <= W; x += 24) { const y = FLOOR + 18 + k * 4 + Math.sin(x * 0.05 + t * 1.6 + k * 2) * 4 + Math.sin(x * 0.013 - t + k) * 3; if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); }
    ctx.restore();
    // surface waves
    ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.beginPath(); ctx.moveTo(0, 0);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, 30 + Math.sin(x * 0.02 + t * 2) * 6 + Math.sin(x * 0.05 - t * 3) * 3);
    ctx.lineTo(W, 0); ctx.fill();
    // ambient bubbles and plankton
    ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1.5;
    for (const b of ambBubbles) { const y = ((b.y - t * b.sp) % H + H) % H, x = b.x + Math.sin(t * 2 + b.ph) * 6; ctx.beginPath(); ctx.arc(x, y, b.r, 0, TAU); ctx.stroke(); ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.arc(x - b.r * 0.35, y - b.r * 0.35, b.r * 0.3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = wi === 4 ? "rgba(140,200,255,0.6)" : "rgba(255,255,255,0.35)";
    for (let i = 0; i < 70; i++) { const x = (U.hash(i, 3) * W + Math.sin(t * 0.3 + i) * 20 + t * 4) % W, y = (U.hash(i, 9) * H + Math.cos(t * 0.4 + i) * 15) % H; ctx.fillRect(x, y, 2, 2); }
  }
  function kelp(ctx, x, y, h, t, i, col) {
    const seg = 10, sl = h / seg;
    let px = x, py = y;
    ctx.lineCap = "round";
    const pts = [[px, py]];
    for (let k = 1; k <= seg; k++) { px = x + Math.sin(t * 1.1 + i + k * 0.5) * k * 2.4; py = y - k * sl; pts.push([px, py]); }
    for (const [lw, c] of [[13, OUT], [8, col]]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach(([a, b], k) => (k ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.stroke(); }
    ctx.fillStyle = col; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    for (let k = 2; k < pts.length; k += 2) { const [a, b] = pts[k], s = k % 4 ? 1 : -1; ctx.beginPath(); ctx.ellipse(a + s * 12, b, 14, 5, s * 0.5 + Math.sin(t + k) * 0.2, 0, TAU); ctx.fill(); ctx.stroke(); }
  }

  /* ---------- the comic fish ---------- */
  function drawFish(ctx, f, t, opts = {}) {
    const sp = f.sp, r = f.r, L = r * (sp.long || 1), Hh = r * 0.62 * (sp.tall || 1);
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.face, 1);
    ctx.rotate(f.tilt || 0);
    if (f.puffed) { const k = 1 + f.puffed * 0.6; ctx.scale(k, k * 1.25); }
    const wag = Math.sin(t * (f.wagSpeed || 8) + (f.ph || 0)) * 0.35;
    const lineW = Math.max(2.5, r * 0.09);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (sp.pat === "shrimp") return drawShrimp(ctx, f, r, t, lineW, opts);
    if (sp.pat === "seahorse") return drawSeahorse(ctx, f, r, t, lineW, opts);
    // tail
    ctx.save(); ctx.translate(-L * 0.92, 0); ctx.rotate(wag);
    ctx.fillStyle = sp.fin; ctx.strokeStyle = OUT; ctx.lineWidth = lineW;
    ctx.beginPath(); ctx.moveTo(L * 0.1, 0);
    if (sp.pat === "shark" || sp.pat === "orca" || sp.long >= 2) { ctx.lineTo(-r * 0.55, -Hh * 1.1); ctx.quadraticCurveTo(-r * 0.3, 0, -r * 0.5, Hh * 0.8); }
    else { ctx.quadraticCurveTo(-r * 0.3, -Hh * 1.2, -r * 0.65, -Hh * 0.95); ctx.quadraticCurveTo(-r * 0.4, 0, -r * 0.65, Hh * 0.95); ctx.quadraticCurveTo(-r * 0.3, Hh * 1.2, L * 0.1, 0); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // dorsal and bottom fins
    ctx.fillStyle = sp.fin; ctx.strokeStyle = OUT; ctx.lineWidth = lineW;
    if (sp.spiky) { for (let i = 0; i < 6; i++) { const x = -L * 0.5 + i * L * 0.18, wv = Math.sin(t * 4 + i) * 3; ctx.beginPath(); ctx.moveTo(x - 4, -Hh * 0.8); ctx.lineTo(x + wv, -Hh * 2.0); ctx.lineTo(x + 6, -Hh * 0.8); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 4, Hh * 0.8); ctx.lineTo(x + wv - 6, Hh * 1.8); ctx.lineTo(x + 6, Hh * 0.8); ctx.fill(); ctx.stroke(); } }
    else if (sp.pat === "shark" || sp.pat === "orca") { ctx.beginPath(); ctx.moveTo(-L * 0.25, -Hh * 0.85); ctx.lineTo(-L * 0.05, -Hh * (sp.pat === "orca" ? 2.1 : 1.8)); ctx.lineTo(L * 0.18, -Hh * 0.85); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (sp.pat === "angel") { ctx.beginPath(); ctx.moveTo(-L * 0.5, -Hh * 0.6); ctx.quadraticCurveTo(-L * 0.4, -Hh * 2.0, L * 0.2, -Hh * 0.85); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-L * 0.5, Hh * 0.6); ctx.quadraticCurveTo(-L * 0.4, Hh * 2.0, L * 0.2, Hh * 0.85); ctx.fill(); ctx.stroke(); }
    else if (sp.pat !== "shrimp" && sp.pat !== "seahorse") { ctx.beginPath(); ctx.moveTo(-L * 0.45, -Hh * 0.8); ctx.quadraticCurveTo(-L * 0.1, -Hh * 1.55 - Math.sin(t * 5) * 2, L * 0.25, -Hh * 0.88); ctx.fill(); ctx.stroke(); }
    // body
    const body = () => { ctx.beginPath(); ctx.ellipse(0, 0, L, Hh, 0, 0, TAU); };
    if (opts.glow) { ctx.save(); ctx.shadowColor = opts.glow; ctx.shadowBlur = 0; ctx.strokeStyle = opts.glow; ctx.lineWidth = lineW + 6; ctx.globalAlpha = 0.55; body(); ctx.stroke(); ctx.restore(); }
    body(); ctx.fillStyle = sp.col; ctx.fill();
    ctx.save(); body(); ctx.clip();
    // belly
    ctx.fillStyle = sp.belly; ctx.beginPath(); ctx.ellipse(L * 0.05, Hh * 0.75, L * 0.95, Hh * 0.7, 0, 0, TAU); ctx.fill();
    // patterns
    if (sp.pat === "clown") { ctx.fillStyle = "#ffffff"; for (const x of [-0.45, 0.05, 0.55]) { ctx.fillRect(x * L - r * 0.12, -Hh, r * 0.24, Hh * 2); } ctx.strokeStyle = OUT; ctx.lineWidth = 2; for (const x of [-0.45, 0.05, 0.55]) { ctx.strokeRect(x * L - r * 0.12, -Hh, r * 0.24, Hh * 2); } }
    else if (sp.pat === "neon") { ctx.fillStyle = sp.col2; ctx.fillRect(-L, Hh * 0.05, L * 2, Hh * 0.35); ctx.fillStyle = "#80ffff"; ctx.fillRect(-L, -Hh * 0.2, L * 2, Hh * 0.22); }
    else if (sp.pat === "angel") { ctx.fillStyle = sp.col2; for (const x of [-0.45, 0.1]) ctx.fillRect(x * L, -Hh, r * 0.18, Hh * 2); }
    else if (sp.pat === "bars") { ctx.fillStyle = sp.col2; ctx.globalAlpha = 0.55; for (let i = -4; i < 5; i++) ctx.fillRect(i * L * 0.2, -Hh, L * 0.07, Hh * 1.1); ctx.globalAlpha = 1; }
    else if (sp.pat === "spots") { ctx.fillStyle = sp.col2; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc((U.hash(i, 7) - 0.5) * L * 1.8, (U.hash(i, 9) - 0.6) * Hh * 1.6, r * (0.05 + U.hash(i, 3) * 0.06), 0, TAU); ctx.fill(); } }
    else if (sp.pat === "silver") { ctx.fillStyle = sp.col2; ctx.fillRect(-L, -Hh, L * 2, Hh * 0.55); ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(-L, -Hh * 0.1, L * 2, Hh * 0.12); }
    else if (sp.pat === "shark") { ctx.fillStyle = sp.col2; ctx.fillRect(-L, -Hh, L * 2, Hh * 0.6); ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(L * 0.35 - i * r * 0.12, -Hh * 0.3); ctx.lineTo(L * 0.3 - i * r * 0.12, Hh * 0.25); ctx.stroke(); } }
    else if (sp.pat === "player") { ctx.fillStyle = "#ffcc20"; ctx.fillRect(-L * 0.2, -Hh, r * 0.22, Hh * 2); ctx.fillStyle = "#ffffff"; ctx.fillRect(-L * 0.2 + r * 0.22, -Hh, r * 0.08, Hh * 2); }
    else if (sp.pat === "orca") { ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(L * 0.55, -Hh * 0.3, r * 0.3, r * 0.14, 0, 0, TAU); ctx.fill(); }
    // shine
    ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.beginPath(); ctx.ellipse(L * 0.15, -Hh * 0.55, L * 0.45, Hh * 0.18, 0, 0, TAU); ctx.fill();
    ctx.restore();
    body(); ctx.strokeStyle = opts.outline || OUT; ctx.lineWidth = lineW; ctx.stroke();
    // side fin
    ctx.fillStyle = sp.fin; ctx.beginPath(); ctx.moveTo(-L * 0.05, Hh * 0.15); ctx.quadraticCurveTo(-L * 0.35, Hh * 0.6 + Math.sin(t * 9 + 1) * 4, -L * 0.25, Hh * 0.1); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = lineW * 0.7; ctx.stroke();
    // mouth
    const mo = f.mouth || 0, mx = L * 0.92, my = Hh * 0.18;
    if (mo > 0.05) {
      ctx.fillStyle = "#5a0a1a"; ctx.beginPath(); ctx.moveTo(mx - r * 0.35, my); ctx.lineTo(mx + 2, my - r * 0.4 * mo); ctx.lineTo(mx + 2, my + r * 0.4 * mo); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = lineW * 0.8; ctx.stroke();
      if (sp.teeth) { ctx.fillStyle = "#ffffff"; for (let i = 0; i < 4; i++) { const x = mx - r * 0.3 + i * r * 0.08; ctx.beginPath(); ctx.moveTo(x, my - r * 0.3 * mo + i); ctx.lineTo(x + 3, my - r * 0.18 * mo); ctx.lineTo(x + 6, my - r * 0.3 * mo + i); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, my + r * 0.3 * mo - i); ctx.lineTo(x + 3, my + r * 0.18 * mo); ctx.lineTo(x + 6, my + r * 0.3 * mo - i); ctx.fill(); } }
    } else {
      ctx.strokeStyle = OUT; ctx.lineWidth = lineW * 0.8; ctx.beginPath(); ctx.moveTo(mx - r * 0.3, my + (f.smile ? -2 : 3)); ctx.quadraticCurveTo(mx - r * 0.12, my + (f.smile ? 6 : 0), mx, my - 1); ctx.stroke();
      if (sp.teeth) { ctx.fillStyle = "#fff"; for (let i = 0; i < 3; i++) { const x = mx - r * 0.25 + i * r * 0.08; ctx.beginPath(); ctx.moveTo(x, my); ctx.lineTo(x + 3, my + 5); ctx.lineTo(x + 6, my); ctx.fill(); } }
    }
    if (sp.lips) { ctx.fillStyle = "#c06a5a"; ctx.beginPath(); ctx.ellipse(mx - 2, my - r * 0.1 - mo * r * 0.2, r * 0.14, r * 0.07, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(mx - 2, my + r * 0.12 + mo * r * 0.2, r * 0.14, r * 0.07, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
    // eye with a pupil looking at the target
    const ex = L * 0.55, ey = -Hh * 0.25, er = Math.max(4.5, r * (f.player ? 0.3 : 0.24));
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(ex, ey, er, er * (f.blink ? 0.12 : 1), 0, 0, TAU); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = lineW * 0.8; ctx.stroke();
    if (!f.blink) {
      const lx = U.clamp(f.lookX || 0, -1, 1) * er * 0.4, ly = U.clamp(f.lookY || 0, -1, 1) * er * 0.4;
      ctx.fillStyle = f.dizzy ? "#ff4aa0" : OUT; ctx.beginPath(); ctx.arc(ex + lx * f.face, ey + ly, er * 0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(ex + lx * f.face - er * 0.15, ey + ly - er * 0.18, er * 0.17, 0, TAU); ctx.fill();
      if (f.angry || sp.c >= 4) { ctx.strokeStyle = OUT; ctx.lineWidth = lineW; ctx.beginPath(); ctx.moveTo(ex - er * 1.1, ey - er * 1.25); ctx.lineTo(ex + er * 0.9, ey - er * 0.7); ctx.stroke(); }
    }
    if (sp.lure) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(L * 0.4, -Hh * 0.9); ctx.quadraticCurveTo(L * 1.1, -Hh * 2.4, L * 1.3, -Hh * 1.2 + Math.sin(t * 3) * 6); ctx.stroke();
      const lg = ctx.createRadialGradient(L * 1.3, -Hh * 1.2, 0, L * 1.3, -Hh * 1.2, r * 0.9); lg.addColorStop(0, "rgba(255,255,180,1)"); lg.addColorStop(1, "rgba(255,255,120,0)");
      ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(L * 1.3, -Hh * 1.2 + Math.sin(t * 3) * 6, r * 0.9, 0, TAU); ctx.fill();
    }
    if (f.puffed > 0.3) { ctx.fillStyle = "#fff8d0"; ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * L * 0.95, Math.sin(a) * Hh * 0.95); ctx.lineTo(Math.cos(a) * L * 1.25, Math.sin(a) * Hh * 1.25); ctx.stroke(); } }
    if (f.player && f.crown) { ctx.fillStyle = "#ffd030"; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ex - er, -Hh * 0.95); ctx.lineTo(ex - er, -Hh * 1.45); ctx.lineTo(ex - er * 0.4, -Hh * 1.15); ctx.lineTo(ex, -Hh * 1.55); ctx.lineTo(ex + er * 0.4, -Hh * 1.15); ctx.lineTo(ex + er, -Hh * 1.45); ctx.lineTo(ex + er, -Hh * 0.95); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  function drawShrimp(ctx, f, r, t, lw) {
    ctx.fillStyle = f.sp.col; ctx.strokeStyle = OUT; ctx.lineWidth = lw;
    for (let i = 0; i < 5; i++) { const x = -i * r * 0.42, y = Math.sin(i * 0.6) * r * 0.3 + Math.sin(t * 8 + i) * 1.5, s = r * (0.55 - i * 0.07); ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.8, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-i * r * 0.3, r * 0.3); ctx.lineTo(-i * r * 0.3 + Math.sin(t * 12 + i) * 3, r * 0.75); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(r * 0.4, -r * 0.2); ctx.quadraticCurveTo(r * 1.4, -r * 1.2, r * 1.8, -r * 0.3 + Math.sin(t * 4) * 3); ctx.stroke();
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.15, r * 0.12, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawSeahorse(ctx, f, r, t, lw) {
    ctx.fillStyle = f.sp.col; ctx.strokeStyle = OUT; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(0, -r * 1.2); ctx.quadraticCurveTo(r * 0.9, -r * 0.6, r * 0.2, r * 0.2); ctx.quadraticCurveTo(-r * 0.6, r * 0.9, 0, r * 1.4); ctx.quadraticCurveTo(r * 0.5, r * 1.6, r * 0.2, r * 1.1); ctx.quadraticCurveTo(-r * 0.4, r * 0.6, -r * 0.3, -r * 0.2); ctx.quadraticCurveTo(-r * 0.4, -r * 0.9, 0, -r * 1.2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * 0.15, -r * 1.1); ctx.lineTo(r * 1.0, -r * 0.9); ctx.lineTo(r * 0.95, -r * 0.65); ctx.lineTo(r * 0.3, -r * 0.7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = f.sp.fin; ctx.beginPath(); ctx.ellipse(-r * 0.45, -r * 0.1, r * 0.3, r * 0.15 + Math.sin(t * 14) * 2, 0.4, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.85, r * 0.2, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.85, r * 0.1, 0, TAU); ctx.fill();
    ctx.fillStyle = "#ffe0f8"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-r * 0.05, -r * 0.5 + i * r * 0.35, 2, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function drawJelly(ctx, j, t) {
    const pulse = 1 + Math.sin(t * 3 + j.ph) * 0.12, r = j.r;
    ctx.save(); ctx.translate(j.x, j.y);
    ctx.strokeStyle = "rgba(255,170,230,0.8)"; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const x = -r * 0.7 + i * r * 0.28; ctx.beginPath(); ctx.moveTo(x, 0); for (let k = 1; k < 7; k++) ctx.lineTo(x + Math.sin(t * 3 + i + k * 0.8) * 5, k * r * 0.25); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, 0, r * pulse, r * 0.75 / pulse, 0, Math.PI, 0); ctx.closePath();
    const gr = ctx.createRadialGradient(-r * 0.3, -r * 0.4, 2, 0, 0, r * 1.2); gr.addColorStop(0, "rgba(255,230,250,0.95)"); gr.addColorStop(1, "rgba(230,90,200,0.75)");
    ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, 3.5, 0, TAU); ctx.arc(r * 0.3, -r * 0.3, 3.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -r * 0.15, 6, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
  }
  function drawMine(ctx, m, t) {
    ctx.save(); ctx.translate(m.x, m.y + Math.sin(t * 1.5 + m.ph) * 6);
    ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, m.r); ctx.lineTo(0, FLOOR - m.y + 20); ctx.stroke();
    ctx.fillStyle = "#3a3a44"; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.save(); ctx.rotate(a); ctx.fillRect(-3, -m.r - 9, 6, 12); ctx.strokeRect(-3, -m.r - 9, 6, 12); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0, 0, m.r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = Math.sin(t * 6) > 0 ? "#ff3030" : "#601010"; ctx.beginPath(); ctx.arc(0, -m.r * 0.3, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.beginPath(); ctx.arc(-m.r * 0.35, -m.r * 0.35, m.r * 0.3, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawOyster(ctx, o, t) {
    ctx.save(); ctx.translate(o.x, o.y);
    const open = o.open;
    ctx.fillStyle = "#b8a0c0"; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 0, 32, 12, 0, 0, Math.PI); ctx.fill(); ctx.stroke();
    if (o.pearl && open > 0.3) { const gr = ctx.createRadialGradient(-3, -6, 1, 0, -4, 10); gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, "#e0d0ff"); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, -4, 9, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "rgba(255,255,255,0.8)"; const s = Math.sin(t * 5) * 3 + 4; ctx.fillRect(10, -20, 2, s); }
    ctx.save(); ctx.rotate(-open * 0.9); ctx.fillStyle = "#d0b8d8"; ctx.beginPath(); ctx.ellipse(28, 0, 32, 14, 0, Math.PI, TAU); ctx.translate(0, 0); ctx.restore();
    ctx.save(); ctx.translate(-30, 0); ctx.rotate(-open * 0.9); ctx.fillStyle = "#d0b8d8"; ctx.beginPath(); ctx.ellipse(30, 0, 32, 14, 0, Math.PI, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 2; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(8 + i * 11, -12); ctx.stroke(); } ctx.restore();
    ctx.restore();
  }

  /* ---------- logo and attract fish ---------- */
  const titleFish = [];
  function attract(ctx, t) {
    if (!titleFish.length) for (let i = 0; i < 7; i++) { const k = U.pick(["guppy", "clown", "angel", "tetra", "grouper", "tuna", "puffer"]); titleFish.push(mkFish(k, Math.random() * W, 380 + Math.random() * 240, Math.random() < 0.5 ? 1 : -1)); }
    for (const f of titleFish) {
      f.x += f.face * f.speed * (1 / 60); f.y += Math.sin(t + f.ph) * 0.3;
      if (f.x < -100) f.x = W + 90; if (f.x > W + 100) f.x = -90;
      f.mouth = Math.max(0, Math.sin(t * 2 + f.ph)) * 0.3;
      drawFish(ctx, f, t);
    }
  }
  function logo(ctx, t, y) {
    ctx.save();
    const s = "DEEP DINER";
    ctx.font = `110px ${COMIC}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    let x = W / 2 - ctx.measureText(s).width / 2;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i], w = ctx.measureText(ch).width, yy = y + Math.sin(t * 2.5 + i * 0.5) * 8, rot = Math.sin(t * 2 + i) * 0.05;
      ctx.save(); ctx.translate(x + w / 2, yy); ctx.rotate(rot);
      ctx.lineJoin = "round"; ctx.lineWidth = 16; ctx.strokeStyle = OUT; ctx.strokeText(ch, 0, 0);
      const gr = ctx.createLinearGradient(0, -50, 0, 50); gr.addColorStop(0, "#fff36a"); gr.addColorStop(0.5, "#ffb020"); gr.addColorStop(1, "#ff5a20");
      ctx.fillStyle = gr; ctx.fillText(ch, 0, 0);
      ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillText(ch, -2, -3); ctx.fillStyle = gr; ctx.fillText(ch, 0, 0);
      ctx.restore();
      x += w;
    }
    ctx.restore();
    txt(ctx, "EAT  ·  GROW  ·  DON'T GET EATEN!", W / 2, y + 86, 30, "#ffffff");
  }

  /* ---------- game state ---------- */
  function mkFish(kind, x, y, face) {
    const sp = SPECIES[kind];
    return { kind, sp, x, y, r: sp.r, face, speed: sp.sp * U.rand(0.8, 1.2), vx: 0, vy: 0, ph: Math.random() * 10, mouth: 0, tilt: 0, blink: false, blinkT: U.rand(1, 4), state: "swim", t: 0, puffed: 0, wagSpeed: 7 + Math.random() * 3, lookX: 0, lookY: 0 };
  }
  let P = null, L = null, fish = [], hazards = [], parts = [], pops = [], oysters = [];
  function newGame() {
    G.run = { score: 0, lives: 3, level: 0, cheated: G.cheat, eaten: 0, frenzies: 0, won: false, nextLife: 25000 };
    startLevel(0);
  }
  function startLevel(n) {
    const run = G.run;
    run.level = n; L = LEVELS[n];
    fish = []; hazards = []; parts = []; pops = []; oysters = [];
    P = { x: W / 2, y: 200, vx: 0, vy: 0, face: 1, r: STAGE_R[1], stage: 1, growth: 0, mouth: 0, chomp: 0, inv: 2.5, dash: 0, dashCool: 0, stun: 0, dead: 0, sp: PLAYER_SP, player: true, ph: 0, blink: false, blinkT: 3, chain: 0, chainT: 0, lookX: 0, lookY: 0, smile: true, wagSpeed: 9 };
    run.levelEaten = 0; run.levelFrenzy = 0; run.levelPearls = 0; run.time = 0;
    for (let i = 0; i < 5; i++) spawnFish(true);
    const hz = L.haz;
    for (let i = 0; i < (hz.jelly || 0); i++) hazards.push({ kind: "jelly", x: U.rand(150, W - 150), y: U.rand(200, 560), r: 26, ph: Math.random() * 6, vy: 0, dir: 1 });
    for (let i = 0; i < (hz.mine || 0); i++) hazards.push({ kind: "mine", x: 200 + i * 380 + U.rand(-60, 60), y: U.rand(300, 520), r: 22, ph: Math.random() * 6 });
    for (let i = 0; i < 2; i++) oysters.push({ x: 300 + i * 680 + U.rand(-80, 80), y: FLOOR + 22, open: 0, t: Math.random() * 5, pearl: true });
    States.intro.show();
  }
  const PLAYER_SP = { c: 0, r: 22, col: "#36c8ff", col2: "#ffffff", belly: "#e8fbff", pat: "player", fin: "#ffcc20" };

  function spawnFish(initial) {
    if (fish.length >= L.maxFish + 4) return;
    const pool = POOL[L.world], st = P.stage;
    // mostly edible fish, sometimes bigger ones
    let cls;
    const r = Math.random();
    if (r < 0.65) cls = U.randi(1, st);
    else if (r < 0.88) cls = Math.min(4, st + 1);
    else cls = Math.min(4, st + U.randi(1, 2));
    if (!initial && Math.random() < L.shark * 0.15 && !fish.some((f) => f.sp.c === 5)) { cls = 5; A.sfx("warn"); A.say(U.pick(["Shark! Swim for your life!", "Uh oh. Big teeth incoming!", "Something big is coming!"]), { pitch: 0.8 }); pops.push({ x: W / 2, y: 140, text: "WATCH OUT!", col: "#ff4040", t: 0, size: 54 }); }
    let kind = U.pick(pool[cls]);
    if (cls === 1 && Math.random() < 0.06) kind = "seahorse";
    const face = Math.random() < 0.5 ? 1 : -1;
    const f = mkFish(kind, initial ? U.rand(100, W - 100) : face > 0 ? -90 : W + 90, U.rand(SURFACE + 60, FLOOR - 50), face);
    if (initial && f.sp.c > 1 && Math.abs(f.x - P.x) < 300) f.x = P.x > W / 2 ? 150 : W - 150;
    fish.push(f);
    // small fish often come in schools – perfect for a frenzy
    if (cls === 1 && kind !== "seahorse" && !initial && Math.random() < 0.45) for (let i = 0; i < U.randi(3, 5); i++) { const o = mkFish(kind, f.x - face * (30 + i * 28), f.y + U.rand(-40, 40), face); o.speed = f.speed; fish.push(o); }
  }
  function addScore(n) { if (G.cheat) { G.run.cheated = true; return 0; } G.run.score += n; if (G.run.score >= G.run.nextLife) { G.run.nextLife += 40000; G.run.lives++; A.sfx("extra"); A.say("Extra life!", { force: true }); pops.push({ x: P.x, y: P.y - 60, text: "1UP!", col: "#60ff90", t: 0, size: 44 }); } return n; }
  function bubbles(x, y, n, spread = 20) { for (let i = 0; i < n; i++) parts.push({ k: "bub", x: x + U.rand(-spread, spread), y: y + U.rand(-spread, spread), vx: U.rand(-30, 30), vy: U.rand(-140, -40), r: U.rand(2, 7), t: 0, life: U.rand(0.8, 1.6) }); }

  function eat(f) {
    const run = G.run, sp = f.sp;
    f.dead = true;
    P.chomp = 0.25; P.mouth = 1;
    // frenzy chain
    P.chain = P.chainT > 0 ? P.chain + 1 : 1; P.chainT = 2.2;
    let mult = 1;
    if (P.chain >= 10) mult = 3; else if (P.chain >= 5) mult = 2;
    if (P.chain === 5) { run.frenzies++; run.levelFrenzy++; A.sfx("frenzy"); A.say("Feeding frenzy!", { pitch: 0.55, rate: 0.95, force: true }); pops.push({ x: W / 2, y: 200, text: "FEEDING FRENZY!", col: "#ffe040", t: 0, size: 70, big: true }); }
    if (P.chain === 10) { run.frenzies++; A.sfx("double"); A.say("Double frenzy!", { pitch: 0.5, rate: 0.9, force: true }); pops.push({ x: W / 2, y: 200, text: "DOUBLE FRENZY!", col: "#ff60c0", t: 0, size: 80, big: true }); }
    const pts = addScore(sp.pts * mult);
    run.eaten++; run.levelEaten++;
    A.sfx(sp.c >= 3 ? "bigChomp" : "chomp");
    pops.push({ x: f.x, y: f.y - 20, text: sp.bonus ? `+${pts} WHEEE!` : pts ? `+${pts}` : "CHOMP!", col: mult > 1 ? "#ffe040" : "#ffffff", t: 0, size: 22 + sp.c * 4 });
    if (Math.random() < 0.18) pops.push({ x: f.x + 20, y: f.y - 50, text: U.pick(["CHOMP!", "GULP!", "YUM!", "NOM!", "MUNCH!"]), col: "#ff9a40", t: 0, size: 30, rot: U.rand(-0.3, 0.3) });
    bubbles(f.x, f.y, 6 + sp.c * 2);
    parts.push({ k: "bones", x: f.x, y: f.y, vx: U.rand(-20, 20), vy: 40, rot: 0, vr: U.rand(-3, 3), r: f.r, t: 0, life: 1.6, face: f.face });
    if (sp.bonus) A.say(U.pick(["Giddy up!", "Yee-haw!", "Bonus snack!"]), { pitch: 1.3 });
    else if (sp.c >= 3 && Math.random() < 0.25) A.say(U.pick(["Delicious!", "Burp!", "Tasty!", "Now that's a meal!", "Om nom nom!", "Excuse me."]), { pitch: 1.1, gap: 3000 });
    // growth
    P.growth += sp.grow;
    const goal = L.goal;
    if (P.stage < 3 && P.growth >= goal[P.stage - 1]) {
      P.stage++; A.sfx("grow"); bubbles(P.x, P.y, 30, 40);
      pops.push({ x: P.x, y: P.y - 80, text: "GROWTH!", col: "#60ff90", t: 0, size: 56, big: true });
      A.say(U.pick(["Growth spurt!", "Bigger is better!", "Look at you, all grown up!", "Size upgrade!"]), { force: true, pitch: 1.1 });
    } else if (P.growth >= goal[2]) levelDone();
  }
  function playerDies(by) {
    if (P.dead || P.inv > 0) return;
    if (G.cheat) { P.inv = 0.6; A.sfx("boing"); return; }
    const run = G.run;
    P.dead = 2.2; P.chain = 0;
    run.lives--;
    A.sfx(by === "mine" ? "boom" : "eaten");
    bubbles(P.x, P.y, 40, 40);
    parts.push({ k: "bones", x: P.x, y: P.y, vx: 0, vy: 30, rot: 0, vr: 2, r: P.r, t: 0, life: 2, face: P.face });
    pops.push({ x: P.x, y: P.y - 60, text: by === "mine" ? "KA-BOOM!" : "CHOMPED!", col: "#ff5050", t: 0, size: 54, big: true });
    if (run.lives > 0) A.say(by === "mine" ? U.pick(["Kaboom! That was a mine.", "Oops. Explosive snack."]) : U.pick(["You got eaten. Rude!", "Ouch! That's gotta hurt.", "Hey! I was swimming here!", "Somebody had you for lunch."]), { force: true });
  }
  function levelDone() {
    if (States.play.done) return;
    States.play.done = true;
    A.jingle("clear");
    A.say(U.pick(["Delicious! Level complete.", "Burp! Level complete.", "All you can eat! Level complete."]), { force: true });
    States.play.doneT = 1.6;
  }

  /* ---------- update ---------- */
  function update(dt) {
    const run = G.run;
    run.time += dt;
    // player control
    let ax = 0, ay = 0;
    const m = I.mouse;
    if (I.held("left")) ax -= 1; if (I.held("right")) ax += 1; if (I.held("up")) ay -= 1; if (I.held("down")) ay += 1;
    if (I.pad.connected) { ax += I.pad.axes[0]; ay += I.pad.axes[1]; }
    const maxV = (300 - P.stage * 15) * (P.dash > 0 ? 2.1 : 1);
    if (P.dead > 0) {
      P.dead -= dt;
      if (P.dead <= 0) { if (run.lives <= 0) { gameOver(); return; } P.x = W / 2; P.y = SURFACE + 40; P.vx = P.vy = 0; P.inv = 2.5; }
    } else {
      if (P.stun > 0) { P.stun -= dt; ax = ay = 0; }
      if (I.lastDevice === "mouse" && m.inside && P.stun <= 0) {
        const dx = m.x - P.x, dy = m.y - P.y, d = Math.hypot(dx, dy);
        const want = Math.min(maxV, d * 4);
        const tx = d > 4 ? (dx / d) * want : 0, ty = d > 4 ? (dy / d) * want : 0;
        P.vx += (tx - P.vx) * Math.min(1, dt * 6); P.vy += (ty - P.vy) * Math.min(1, dt * 6);
      } else {
        const l = Math.hypot(ax, ay); if (l > 1) { ax /= l; ay /= l; }
        P.vx += (ax * maxV - P.vx) * Math.min(1, dt * 5); P.vy += (ay * maxV - P.vy) * Math.min(1, dt * 5);
      }
      if ((I.hit("fire") || m.clicked || m.rclicked) && P.dashCool <= 0 && P.stun <= 0) { P.dash = 0.3; P.dashCool = 1.2; A.sfx("dash"); bubbles(P.x - P.face * P.r, P.y, 10); const l = Math.hypot(P.vx, P.vy) || 1; P.vx += (P.vx / l) * 300; P.vy += (P.vy / l) * 300; }
      P.dash = Math.max(0, P.dash - dt); P.dashCool = Math.max(0, P.dashCool - dt);
      P.x = U.clamp(P.x + P.vx * dt, P.r, W - P.r); P.y = U.clamp(P.y + P.vy * dt, SURFACE + P.r * 0.5, FLOOR - P.r * 0.4);
      if (Math.abs(P.vx) > 20) P.face = P.vx > 0 ? 1 : -1;
      P.tilt = U.clamp(P.vy / 900, -0.35, 0.35) * P.face;
      P.inv = Math.max(0, P.inv - dt);
    }
    P.r += (STAGE_R[P.stage] - P.r) * Math.min(1, dt * 4);
    P.chainT -= dt; if (P.chainT <= 0) P.chain = 0;
    P.chomp = Math.max(0, P.chomp - dt);
    P.blinkT -= dt; if (P.blinkT < 0) { P.blink = !P.blink; P.blinkT = P.blink ? 0.12 : U.rand(2, 4); }
    P.crown = P.stage === 3;
    P.wagSpeed = 8 + Math.hypot(P.vx, P.vy) / 30;
    // mouth opens near something edible
    let nearFood = false;
    // fish
    if (Math.random() < dt / L.spawn) spawnFish(false);
    const mouthX = P.x + P.face * P.r * 0.85, mouthY = P.y + P.r * 0.1;
    for (const f of fish) {
      if (f.dead) continue;
      f.t += dt;
      const sp = f.sp, dx = P.x - f.x, dy = P.y - f.y, d = Math.hypot(dx, dy);
      const bigger = sp.c > P.stage, alive = P.dead <= 0;
      let tvx = f.face * f.speed, tvy = Math.sin(f.t * 1.3 + f.ph) * 20;
      f.angry = false;
      if (alive && bigger && d < 300 + sp.c * 30 && Math.sign(dx) === f.face && P.inv <= 0) {
        // predator: chase
        const k = f.speed * 1.25; tvx = (dx / d) * k; tvy = (dy / d) * k; f.angry = true; f.mouth = Math.min(1, f.mouth + dt * 3);
      } else if (alive && !bigger && d < 170 + P.r && sp.c < 5) {
        // prey: flee
        const k = f.speed * 1.35; tvx = -(dx / d) * k; tvy = -(dy / d) * k * 0.8; nearFood = nearFood || d < P.r * 2.5;
        if (sp.puffer && d < 140 + P.r && f.puffed < 1) { if (f.puffed < 0.05) A.sfx("puff"); f.puffed = Math.min(1, f.puffed + dt * 4); }
      } else f.mouth = Math.max(0, f.mouth - dt * 2);
      if (sp.puffer && f.puffed > 0 && d > 220 + P.r) f.puffed = Math.max(0, f.puffed - dt * 0.6);
      if (f.puffed > 0.5) { tvx *= 0.2; tvy *= 0.2; }
      f.vx += (tvx - f.vx) * Math.min(1, dt * 2.5); f.vy += (tvy - f.vy) * Math.min(1, dt * 2.5);
      f.x += f.vx * dt; f.y = U.clamp(f.y + f.vy * dt, SURFACE + f.r * 0.6, FLOOR - f.r * 0.5);
      if (Math.abs(f.vx) > 15) f.face = f.vx > 0 ? 1 : -1;
      f.tilt = U.clamp(f.vy / 600, -0.3, 0.3) * f.face;
      f.lookX = dx / (d + 1) * f.face; f.lookY = dy / (d + 1);
      f.blinkT -= dt; if (f.blinkT < 0) { f.blink = !f.blink; f.blinkT = f.blink ? 0.12 : U.rand(2, 5); }
      if (f.x < -200 || f.x > W + 200) f.dead = true;
      // collisions with the player
      if (!alive) continue;
      const ew = sp.c === 5 || sp.long ? f.r * (sp.long || 1) : f.r;
      if (!bigger && sp.c < 5) {
        const md = Math.hypot(mouthX - f.x, mouthY - f.y);
        if (f.puffed > 0.5 && d < P.r + f.r * 1.4) { A.sfx("boing"); P.vx = -Math.sign(dx || 1) * -300; P.vx = Math.sign(dx) * 320; P.vy = Math.sign(dy) * 200; P.stun = 0.4; pops.push({ x: f.x, y: f.y - 30, text: "BOING!", col: "#ffd040", t: 0, size: 34 }); if (Math.random() < 0.4) A.say(U.pick(["Too spiky!", "Ouch, prickly!"]), { pitch: 1.2 }); }
        else if (md < f.r * 0.9 + P.r * 0.45) eat(f);
      } else if (bigger && P.inv <= 0) {
        const fmx = f.x + f.face * ew * 0.85, fmy = f.y + f.r * 0.1;
        if (Math.hypot(fmx - P.x, fmy - P.y) < P.r * 0.8 + f.r * 0.35) { f.mouth = 1; f.chomp = 0.3; playerDies("fish"); f.smile = true; }
      }
    }
    fish = fish.filter((f) => !f.dead);
    P.mouth += ((P.chomp > 0 ? (Math.sin(P.chomp * 40) > 0 ? 1 : 0.2) : nearFood ? 0.7 : 0.1) - P.mouth) * Math.min(1, dt * 14);
    // hazards
    for (const h of hazards) {
      if (h.kind === "jelly") {
        h.y += Math.sin(G.run.time * 0.8 + h.ph) * 30 * dt - (Math.sin(G.run.time * 3 + h.ph) > 0.6 ? 40 * dt : -12 * dt);
        h.x += Math.sin(G.run.time * 0.3 + h.ph) * 20 * dt;
        h.y = U.clamp(h.y, SURFACE + 40, FLOOR - 80);
        if (P.dead <= 0 && P.inv <= 0 && P.stun <= 0 && Math.hypot(P.x - h.x, P.y - h.y - 10) < P.r * 0.8 + h.r) {
          if (!G.cheat) { P.stun = 1.4; P.chain = 0; }
          A.sfx("stun"); P.vx = Math.sign(P.x - h.x) * 260; P.vy = 160; P.inv = 1.6;
          pops.push({ x: P.x, y: P.y - 50, text: "ZAP!", col: "#ff80e0", t: 0, size: 40 });
          A.say(U.pick(["Ouch, jelly!", "Zzzap! Shocking!", "That stings!"]), { pitch: 1.2 });
        }
      } else if (h.kind === "mine") {
        if (!h.boom && P.dead <= 0 && Math.hypot(P.x - h.x, P.y - h.y) < P.r * 0.8 + h.r) { h.boom = true; for (let i = 0; i < 30; i++) parts.push({ k: "fire", x: h.x, y: h.y, vx: U.rand(-300, 300), vy: U.rand(-300, 300), r: U.rand(6, 16), t: 0, life: U.rand(0.4, 0.9) }); bubbles(h.x, h.y, 30, 30); if (G.cheat) A.sfx("boom"); playerDies("mine"); XA.Main.shake = 20; h.respawn = 6; }
        // mines also blow up fish swimming into them
        if (!h.boom) for (const f of fish) if (!f.dead && Math.hypot(f.x - h.x, f.y - h.y) < f.r * 0.7 + h.r) { f.dead = true; h.boom = true; h.respawn = 5; A.sfx("boom"); bubbles(h.x, h.y, 25, 30); for (let i = 0; i < 20; i++) parts.push({ k: "fire", x: h.x, y: h.y, vx: U.rand(-250, 250), vy: U.rand(-250, 250), r: U.rand(6, 14), t: 0, life: U.rand(0.4, 0.8) }); break; }
        if (h.boom) { h.respawn -= dt; if (h.respawn <= 0) h.boom = false; }
      }
    }
    // oysters
    for (const o of oysters) {
      o.t += dt;
      const target = Math.sin(o.t * 0.9) > 0.2 ? 1 : 0;
      o.open += (target - o.open) * Math.min(1, dt * 3);
      if (!o.pearl && Math.random() < dt * 0.05) o.pearl = true;
      if (o.pearl && o.open > 0.5 && P.dead <= 0 && Math.hypot(mouthX - o.x, mouthY - (o.y - 6)) < P.r * 0.6 + 12) {
        o.pearl = false; G.run.levelPearls++; const pts = addScore(500); A.sfx("pearl"); pops.push({ x: o.x, y: o.y - 50, text: `PEARL +${pts}`, col: "#e8e0ff", t: 0, size: 32 }); A.say(U.pick(["Shiny!", "Ooh, a pearl!", "Treasure!"]), { pitch: 1.3 }); for (let i = 0; i < 12; i++) parts.push({ k: "star", x: o.x, y: o.y - 10, vx: U.rand(-120, 120), vy: U.rand(-200, -40), r: U.rand(4, 8), t: 0, life: 0.8 });
      }
    }
    // particles and popups
    for (const p of parts) { p.t += dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; if (p.k === "bub") p.vy -= 40 * dt; if (p.k === "bones") p.rot += p.vr * dt; if (p.k === "fire" || p.k === "star") { p.vx *= 0.95; p.vy *= 0.95; } }
    parts = parts.filter((p) => p.t < p.life);
    for (const p of pops) p.t += dt;
    pops = pops.filter((p) => p.t < (p.big ? 1.6 : 1));
    // player bubbles trail
    if (Math.random() < dt * (2 + Math.hypot(P.vx, P.vy) / 60) && P.dead <= 0) parts.push({ k: "bub", x: P.x - P.face * P.r, y: P.y, vx: 0, vy: -60, r: U.rand(2, 4), t: 0, life: 1.2 });
  }
  function gameOver() {
    States.play.over = true;
    A.jingle("gameover");
    A.say(U.pick(["Game over. You're fish food.", "Game over. Sleep with the fishes."]), { force: true });
    UI.go("gameover");
  }

  /* ---------- drawing ---------- */
  function drawGame(ctx, t) {
    const run = G.run;
    ctx.save();
    if (XA.Main.shake > 0) ctx.translate((Math.random() - 0.5) * XA.Main.shake, (Math.random() - 0.5) * XA.Main.shake);
    drawScene(ctx, L.world, t, false);
    for (const o of oysters) drawOyster(ctx, o, t);
    for (const h of hazards) { if (h.kind === "jelly") drawJelly(ctx, h, t); else if (!h.boom) drawMine(ctx, h, t); }
    const sorted = fish.slice().sort((a, b) => a.r - b.r);
    for (const f of sorted) {
      const big = f.sp.c > P.stage;
      drawFish(ctx, f, t, { glow: f.sp.c >= 5 ? null : big ? "rgba(255,60,60,0.9)" : "rgba(90,255,120,0.9)" });
    }
    // player
    if (P.dead <= 0) {
      if (!(P.inv > 0 && Math.floor(t * 12) % 2 === 0)) drawFish(ctx, Object.assign(P, { r: P.r }), t, { glow: G.cheat ? "rgba(255,220,80,0.9)" : null });
      if (P.inv > 1.5 || States.play.t < 3) { const a = 0.5 + 0.5 * Math.sin(t * 8); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.moveTo(P.x, P.y - P.r - 14); ctx.lineTo(P.x - 12, P.y - P.r - 34); ctx.lineTo(P.x + 12, P.y - P.r - 34); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.stroke(); }
      if (P.stun > 0) { ctx.fillStyle = "#ffe040"; for (let i = 0; i < 3; i++) { const a = t * 6 + (i * TAU) / 3; starShape(ctx, P.x + Math.cos(a) * P.r, P.y - P.r - 10 + Math.sin(a) * 8, 7); } }
    }
    // particles
    for (const p of parts) {
      const k = p.t / p.life;
      if (p.k === "bub") { ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x + Math.sin(p.t * 8) * 3, p.y, p.r, 0, TAU); ctx.stroke(); }
      else if (p.k === "bones") drawBones(ctx, p, k);
      else if (p.k === "fire") { ctx.fillStyle = `rgba(255,${150 + Math.random() * 100},40,${1 - k})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + k), 0, TAU); ctx.fill(); }
      else if (p.k === "star") { ctx.fillStyle = `rgba(255,255,220,${1 - k})`; starShape(ctx, p.x, p.y, p.r); }
    }
    // abyss darkness around the player
    if (L.world === 4) {
      const gr = ctx.createRadialGradient(P.x, P.y, P.r * 2, P.x, P.y, 330 + P.stage * 30);
      gr.addColorStop(0, "rgba(0,0,10,0)"); gr.addColorStop(1, "rgba(0,0,10,0.8)");
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      for (const f of fish) if (f.sp.lure) { const lg = ctx.createRadialGradient(f.x + f.face * f.r * 1.3, f.y - f.r * 0.75, 0, f.x + f.face * f.r * 1.3, f.y - f.r * 0.75, 90); lg.addColorStop(0, "rgba(255,255,160,0.35)"); lg.addColorStop(1, "rgba(255,255,160,0)"); ctx.fillStyle = lg; ctx.fillRect(f.x - 150, f.y - 150, 300, 300); }
    }
    // popups
    for (const p of pops) {
      const k = p.t / (p.big ? 1.6 : 1), sc = k < 0.15 ? 0.5 + k * 3.3 : 1;
      ctx.save(); ctx.translate(p.x, p.y - k * 40); ctx.rotate(p.rot || 0); ctx.scale(sc, sc); ctx.globalAlpha = k > 0.75 ? (1 - k) * 4 : 1;
      txt(ctx, p.text, 0, 0, p.size, p.col);
      ctx.restore();
    }
    ctx.restore();
    drawHUD(ctx, t);
  }
  function starShape(ctx, x, y, r) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
  function drawBones(ctx, p, k) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(p.face, 1); ctx.globalAlpha = 1 - k;
    const r = p.r; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = Math.max(2, r * 0.1); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r * 0.5, 0); ctx.stroke();
    for (let i = 0; i < 4; i++) { const x = -r * 0.7 + i * r * 0.35; ctx.beginPath(); ctx.moveTo(x, -r * 0.4); ctx.lineTo(x, r * 0.4); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(r * 0.75, 0, r * 0.3, 0, TAU); ctx.stroke(); ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(r * 0.8, -r * 0.05, r * 0.08, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(-r * 1.3, -r * 0.35); ctx.moveTo(-r, 0); ctx.lineTo(-r * 1.3, r * 0.35); ctx.stroke();
    ctx.restore();
  }
  function drawHUD(ctx, t) {
    const run = G.run;
    ctx.fillStyle = "rgba(5,25,60,0.55)"; ctx.fillRect(0, 0, W, 54);
    txt(ctx, `SCORE ${U.fmt(run.score)}`, 20, 28, 30, "#ffffff", "left");
    // growth meter with the stage icons
    const gx = 420, gw = 440, gy = 16, gh = 22, goal = L.goal;
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.beginPath(); ctx.roundRect(gx, gy, gw, gh, 11); ctx.fill();
    const frac = U.clamp(P.growth / goal[2], 0, 1);
    const gr = ctx.createLinearGradient(gx, 0, gx + gw, 0); gr.addColorStop(0, "#60ff90"); gr.addColorStop(0.5, "#ffe040"); gr.addColorStop(1, "#ff7a30");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(gx, gy, Math.max(gh, gw * frac), gh, 11); ctx.fill();
    ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(gx, gy, gw, gh, 11); ctx.stroke();
    for (let s = 0; s < 3; s++) {
      const x = gx + (gw * goal[s]) / goal[2];
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy + gh); ctx.stroke();
      const mini = { sp: PLAYER_SP, player: true, x: x - 10, y: gy + gh + 2, r: 7 + s * 3, face: 1, mouth: 0, tilt: 0, lookX: 1, lookY: 0, smile: true, ph: s };
      ctx.save(); ctx.globalAlpha = P.stage > s || P.growth >= goal[s] ? 1 : 0.45; drawFish(ctx, mini, t); ctx.restore();
    }
    bodyText(ctx, "GROWTH", gx - 14, 28, 18, "#d8f4ff", "right");
    // frenzy meter
    const fx = 880, fw = 150;
    bodyText(ctx, "FRENZY", fx, 28, 18, "#d8f4ff", "left");
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(fx + 70, 18, fw, 18);
    ctx.fillStyle = P.chain >= 10 ? "#ff60c0" : P.chain >= 5 ? "#ffe040" : "#60c0ff"; ctx.fillRect(fx + 70, 18, fw * Math.min(1, P.chain / 10) * Math.max(0, P.chainT / 2.2) * 1 + 0.0001, 18);
    ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.strokeRect(fx + 70, 18, fw, 18);
    // lives
    for (let i = 0; i < Math.min(6, run.lives); i++) { const mini = { sp: PLAYER_SP, player: true, x: W - 30 - i * 34, y: 28, r: 11, face: -1, mouth: 0, tilt: 0, lookX: 0, lookY: 0, smile: true, ph: i }; drawFish(ctx, mini, t); }
    bodyText(ctx, `LEVEL ${run.level + 1} · ${WORLDS[L.world].name}`, W / 2, H - 18, 18, "rgba(255,255,255,0.85)");
    if (G.cheat) { ctx.fillStyle = "#ffd040"; ctx.beginPath(); ctx.arc(W - 12, H - 12, 4, 0, TAU); ctx.fill(); }
  }

  /* ---------- states ---------- */
  States.intro = {
    t: 0,
    show() { UI.go("intro"); },
    enter() { this.t = 0; const w = WORLDS[L.world]; A.playSong(w.song); XA.Main.setCursor(false); setTimeout(() => A.say(G.run.level === 0 ? "Eat, or be eaten!" : U.pick([`Level ${G.run.level + 1}. Dinner time!`, `Level ${G.run.level + 1}. All you can eat!`, `Level ${G.run.level + 1}. Bon appetit!`, `Welcome to the ${w.name}!`]), { force: true, pitch: 0.9 }), 300); },
    input() { if (this.t > 0.6 && (I.hit("confirm") || I.hit("fire") || I.mouse.clicked)) this.t = 99; },
    update(dt) { this.t += dt; if (this.t > 2.8) UI.go("play"); },
    draw(ctx) {
      drawScene(ctx, L.world, this.t, false);
      const k = Math.min(1, this.t * 3);
      ctx.save(); ctx.translate(W / 2, H / 2 - 40); ctx.scale(k, k);
      panel(ctx, -360, -130, 720, 260);
      txt(ctx, `LEVEL ${G.run.level + 1}`, 0, -70, 70, "#ffe040");
      txt(ctx, WORLDS[L.world].name.toUpperCase(), 0, 10, 46, "#ffffff");
      bodyText(ctx, WORLDS[L.world].sub, 0, 70, 24, "#d8f4ff");
      ctx.restore();
    },
  };
  States.play = {
    t: 0, paused: false, done: false, over: false,
    pauseMenu: makeMenu([
      { label: "RESUME", action: () => { States.play.paused = false; XA.Main.setCursor(false); } },
      { label: "HOW TO PLAY", action: () => UI.go("controls", { back: "play" }) },
      { label: "OPTIONS", action: () => UI.go("options", { back: "play" }) },
      { label: "QUIT TO TITLE", action: () => { States.play.paused = false; UI.go("title"); } },
    ], 300),
    enter(arg) { if (arg && arg.resume) { this.paused = true; return; } this.paused = false; this.done = false; this.over = false; XA.Main.setCursor(false); },
    pause() { if (!this.paused && !this.done) { this.paused = true; this.pauseMenu.sel = 0; A.sfx("menuBack"); XA.Main.setCursor(true); } },
    input() {
      if (this.paused) { if (I.hit("pause") && this.t > 0) { this.paused = false; XA.Main.setCursor(false); return; } menuInput(this.pauseMenu); return; }
      if (I.hit("pause")) this.pause();
    },
    update(dt) {
      if (this.paused) return;
      this.t += dt; XA.Main.shake = Math.max(0, (XA.Main.shake || 0) - dt * 40);
      if (!this.over) update(dt);
      if (this.done && (this.doneT -= dt) <= 0 && XA.Main.state === "play") UI.go("levelclear");
    },
    draw(ctx) {
      drawGame(ctx, this.t);
      if (this.paused) { ctx.fillStyle = "rgba(5,20,50,0.65)"; ctx.fillRect(0, 0, W, H); txt(ctx, "PAUSED", W / 2, 210, 80, "#ffe040"); menuDraw(ctx, this.pauseMenu, performance.now() / 1000); }
    },
  };
  States.levelclear = {
    t: 0, bonus: 0,
    enter() {
      this.t = 0; const run = G.run;
      this.timeBonus = Math.max(0, Math.round((150 - run.time) * 50 / 10) * 10);
      this.bonus = this.timeBonus + run.levelFrenzy * 1000 + run.levelPearls * 0;
      addScore(this.bonus);
      A.playSong("clear"); XA.Main.setCursor(true);
    },
    input() { if (this.t > 1 && (I.hit("confirm") || I.hit("fire") || I.mouse.clicked)) this.next(); },
    next() {
      const run = G.run;
      if (run.level + 1 >= LEVELS.length) { run.won = true; UI.go("ending"); return; }
      startLevel(run.level + 1);
    },
    update(dt) { this.t += dt; if (this.t > 7) this.next(); },
    draw(ctx) {
      const run = G.run;
      drawScene(ctx, L.world, this.t + 10, false);
      ctx.fillStyle = "rgba(5,20,50,0.4)"; ctx.fillRect(0, 0, W, H);
      txt(ctx, "LEVEL COMPLETE!", W / 2, 120, 76, "#ffe040");
      panel(ctx, W / 2 - 330, 190, 660, 330);
      const rows = [["Fish eaten", run.levelEaten], ["Frenzies", `${run.levelFrenzy} × 1,000`], ["Pearls", run.levelPearls], ["Speed bonus", U.fmt(this.timeBonus)], ["Total bonus", G.run.cheated ? "no points" : U.fmt(this.bonus)]];
      rows.forEach(([a, b], i) => { if (this.t > 0.3 + i * 0.3) { bodyText(ctx, a, W / 2 - 280, 240 + i * 56, 30, "#d8f4ff", "left"); txt(ctx, String(b), W / 2 + 280, 240 + i * 56, 34, i === 4 ? "#ffe040" : "#ffffff", "right"); } });
      const mini = { sp: PLAYER_SP, player: true, x: W / 2, y: 600, r: 40, face: 1, mouth: Math.max(0, Math.sin(this.t * 6)), tilt: Math.sin(this.t * 3) * 0.2, lookX: 1, lookY: 0, smile: true, ph: 0, crown: true, wagSpeed: 12 };
      drawFish(ctx, mini, this.t);
      if (this.t > 1) bodyText(ctx, "Click or press a button", W / 2, 680, 22, "#d8f4ff");
    },
  };
  States.gameover = {
    t: 0,
    enter() { this.t = 0; XA.Main.setCursor(true); },
    input() { if (this.t > 1.5 && (I.hit("confirm") || I.hit("fire") || I.mouse.clicked)) UI.finishRun(); },
    update(dt) { this.t += dt; if (this.t > 8) UI.finishRun(); },
    draw(ctx) {
      drawScene(ctx, L.world, this.t, false);
      ctx.fillStyle = "rgba(5,10,30,0.55)"; ctx.fillRect(0, 0, W, H);
      txt(ctx, "GAME OVER", W / 2, 230, 100, "#ff6a5a");
      txt(ctx, `SCORE ${U.fmt(G.run.score)}`, W / 2, 340, 48, "#ffffff");
      bodyText(ctx, `${G.run.eaten} fish eaten · ${G.run.frenzies} frenzies · reached level ${G.run.level + 1}`, W / 2, 400, 26, "#d8f4ff");
      const p = { k: "bones", x: W / 2, y: 520 + Math.sin(this.t * 2) * 10, rot: Math.sin(this.t) * 0.2, r: 50, face: 1 };
      drawBones(ctx, p, 0);
    },
  };
  States.ending = {
    t: 0,
    enter() { this.t = 0; A.playSong("title"); A.say("Congratulations! You are the king of the deep. Burp!", { force: true, pitch: 0.9 }); addScore(25000); XA.Main.setCursor(true); },
    input() { if (this.t > 2 && (I.hit("confirm") || I.hit("fire") || I.mouse.clicked)) UI.finishRun(); },
    update(dt) { this.t += dt; if (this.t > 25) UI.finishRun(); },
    draw(ctx) {
      drawScene(ctx, 0, this.t, true);
      attract(ctx, this.t);
      txt(ctx, "KING OF THE DEEP!", W / 2, 140, 84, "#ffe040");
      const mini = { sp: PLAYER_SP, player: true, x: W / 2, y: 360, r: 90, face: Math.sin(this.t * 0.5) > 0 ? 1 : -1, mouth: Math.max(0, Math.sin(this.t * 4)) * 0.6, tilt: Math.sin(this.t * 2) * 0.15, lookX: 0, lookY: -0.5, smile: true, ph: 0, crown: true, wagSpeed: 10 };
      drawFish(ctx, mini, this.t);
      txt(ctx, `FINAL SCORE ${U.fmt(G.run.score)}`, W / 2, 540, 48, "#ffffff");
      bodyText(ctx, "You ate your way through all five worlds. +25,000 bonus", W / 2, 596, 26, "#d8f4ff");
      if (this.t > 2) bodyText(ctx, "Click or press a button", W / 2, 670, 22, "#d8f4ff");
    },
  };
  XA.Game = { startLevel, LEVELS, get P() { return P; }, get fish() { return fish; }, eat, levelDone };
})(window.XA);
