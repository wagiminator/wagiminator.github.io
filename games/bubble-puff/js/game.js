/* BUBBLE PUFF: a little dragon traps monsters in bubbles and pops them – 15 rounds in five worlds plus a boss.
   Characters, tiles and backgrounds are drawn with code in a cute comic style. */
"use strict";

(function (XA) {
  const { U, Store, UI } = XA;
  const A = XA.Audio, I = XA.Input, States = XA.States, G = XA.G;
  const W = U.W, H = U.H, TAU = U.TAU;
  const { txt, bodyText, panel, makeMenu, menuInput, menuDraw } = UI;
  const OUT = "#2a1440";
  const TS = 32, COLS = 32, ROWS = 21, FX = 128, FY = 24, FW = COLS * TS, FH = ROWS * TS;
  const GRAV = 1650, JUMP = 810, MAXFALL = 430;

  /* ---------- worlds ---------- */
  const WORLDS = [
    { name: "Candy Cave", e: "windup", f: "windup", song: "candy", bg1: "#3a1a5a", bg2: "#1a0a30", tile: ["#ff8ac8", "#ffffff", "#c04a90"], deco: "sprinkles" },
    { name: "Jungle Ruins", e: "frog", f: "bee", song: "jungle", bg1: "#1a5a3a", bg2: "#0a2a1a", tile: ["#8ac04a", "#5a8a2a", "#3a5a1a"], deco: "leaves" },
    { name: "Ice Palace", e: "penguin", f: "snowman", song: "ice", bg1: "#3a7ac8", bg2: "#1a3a7a", tile: ["#c8f0ff", "#ffffff", "#6ab0e0"], deco: "snow" },
    { name: "Volcano", e: "imp", f: "blob", song: "volcano", bg1: "#6a1a10", bg2: "#2a0a08", tile: ["#7a4a3a", "#ff8a2a", "#3a1a14"], deco: "embers" },
    { name: "Ghost Castle", e: "ghost", f: "bat", song: "castle", bg1: "#2a2a5a", bg2: "#0a0a20", tile: ["#8a8aa0", "#b0b0c8", "#4a4a60"], deco: "stars" },
    { name: "Grumble's Throne", e: "windup", f: "windup", song: "boss", bg1: "#4a0a3a", bg2: "#10020c", tile: ["#d0a030", "#ffe080", "#7a5010"], deco: "stars" },
  ];
  const ENEMY = {
    windup: { kind: "walker", speed: 85, col: "#8a6aff", col2: "#5a3ad0" },
    frog: { kind: "hopper", speed: 90, col: "#60d060", col2: "#2a8a2a" },
    bee: { kind: "flyer", speed: 95, col: "#ffd030", col2: "#2a2a2a" },
    penguin: { kind: "walker", speed: 140, col: "#2a2a3a", col2: "#ffffff" },
    snowman: { kind: "shooter", speed: 55, col: "#ffffff", col2: "#ff7a30", shot: "snow" },
    imp: { kind: "shooter", speed: 80, col: "#ff4a3a", col2: "#ffd040", shot: "fire" },
    blob: { kind: "hopper", speed: 80, col: "#ff9a30", col2: "#ffd060" },
    ghost: { kind: "chaser", speed: 55, col: "#e8e8ff", col2: "#a0a0ff" },
    bat: { kind: "flyer", speed: 120, col: "#6a3a8a", col2: "#ff60a0" },
  };
  const FRUITS = [["cherry", 100], ["banana", 200], ["melon", 400], ["donut", 600], ["icecream", 800], ["cake", 1200], ["diamond", 3000]];

  /* ---------- theme for the shared screens ---------- */
  const FONT = "Fredoka, 'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif";
  XA.Theme = {
    font: FONT, body: "Nunito, 'Segoe UI', Arial, sans-serif", outline: OUT, round: 22,
    fonts: ["700 30px Fredoka", "700 20px Nunito"],
    accent: "#ffe060", soft: "#ffe0f8", menuText: "#fff0fa", menuSel: "#ffffff", menuSize: 32, keyCol: "#ffe070",
    panel: "rgba(60,20,100,0.82)", panelStroke: "rgba(255,190,240,0.9)",
    sel: (t) => `rgba(255,110,190,${0.75 + 0.1 * Math.sin(t * 6)})`,
    songs: { title: "title" }, stageWord: "ROUND", hsTitle: "BUBBLE STARS",
    voiceTest: "Bubble time!", sayHighscore: "Wow! New high score!",
    hsDefault: [["POPPY", 300000, "ALL"], ["BLOOP", 220000, "15"], ["FIZZ", 160000, "13"], ["SUDS", 120000, "11"], ["BOBBY", 90000, "9"], ["FOAMY", 65000, "7"], ["DRIP", 42000, "5"], ["SPLASH", 25000, "4"], ["BUBBA", 12000, "3"], ["PUFFIN", 5000, "2"]],
    stageLabel: () => (G.run.won ? "ALL" : `${G.run.round + 1}`),
    controls: [
      ["KEYBOARD", [["← → / A D", "walk"], ["↑ / W / Space / Z", "jump"], ["X / K / C / Shift", "blow a bubble"], ["Esc / P", "pause"], ["F / M", "fullscreen / mute"]]],
      ["MOUSE", [["mouse left / right", "walk towards it"], ["left button", "blow a bubble"], ["right button", "jump"], ["Esc", "pause"]]],
      ["GAMEPAD", [["stick / D-pad", "walk"], ["A", "jump"], ["B / X", "blow a bubble"], ["Start", "pause"]]],
    ],
    howto: "Blow bubbles to trap the monsters, then pop the bubbles by touching them – popping many at once gives a big bonus. Hold jump while landing on a bubble to bounce on it. Collect the fruit, catch the E-X-T-E-N-D letters for an extra life and don't dawdle: the round gets angry if you take too long!",
    start() { newGame(); },
    back(ctx, t, kind) { drawBackground(ctx, kind === "menu" ? 4 : 0, t); if (kind !== "menu") attract(ctx, t); else { ctx.fillStyle = "rgba(20,0,40,0.35)"; ctx.fillRect(0, 0, W, H); } },
    logo(ctx, t, y) { logo(ctx, t, y); },
  };
  XA.SECRET = [66, 85, 66, 66, 76, 69, 71, 85, 77];

  /* ---------- map ---------- */
  let grid = null, mapCanvas = null, worldIdx = 0;
  function loadMap(n) {
    const half = XA.MAPS[n];
    grid = []; const spawns = [];
    for (let r = 0; r < ROWS; r++) {
      const row = half[r] + [...half[r]].reverse().join("");
      grid.push([...row].map((ch) => ch === "#"));
      [...row].forEach((ch, c) => { if (ch === "e" || ch === "f") spawns.push({ ch, c, r }); });
    }
    mapCanvas = renderMap(n);
    return spawns;
  }
  const solid = (c, r) => r >= 0 && r < ROWS && c >= 0 && c < COLS && grid[r][c];
  const isWall = (c) => c <= 1 || c >= COLS - 2;
  // can something stand on top of tile (c, r)?
  const standable = (c, r) => solid(c, r) && !solid(c, r - 1);
  const tileTop = (r) => FY + r * TS;
  function renderMap(n) {
    const c = document.createElement("canvas"); c.width = FW; c.height = FH;
    const g = c.getContext("2d"), wd = WORLDS[worldIdx], [c1, c2, c3] = wd.tile;
    for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
      if (!grid[r][col]) continue;
      const x = col * TS, y = r * TS;
      // shadow on the background below the block
      g.fillStyle = "rgba(0,0,0,0.25)"; if (!(grid[r + 1] && grid[r + 1][col])) g.fillRect(x + 6, y + TS, TS, 8);
      tile(g, x, y, wd, (col * 7 + r * 13) % 5, !solid(col, r - 1), col, r);
    }
    return c;
  }
  function tile(g, x, y, wd, v, top, col, r) {
    const [c1, c2, c3] = wd.tile, s = wd.deco;
    g.fillStyle = c1; g.fillRect(x, y, TS, TS);
    if (s === "sprinkles") { // candy: striped blocks with icing
      g.save(); g.beginPath(); g.rect(x, y, TS, TS); g.clip(); g.fillStyle = c2; for (let k = -2; k < 4; k++) { g.beginPath(); g.moveTo(x + k * 16, y + TS); g.lineTo(x + k * 16 + 8, y + TS); g.lineTo(x + k * 16 + 8 + TS, y); g.lineTo(x + k * 16 + TS, y); g.fill(); } g.restore();
      if (top) { g.fillStyle = "#fff4fa"; g.beginPath(); g.moveTo(x, y); g.lineTo(x + TS, y); g.lineTo(x + TS, y + 8); for (let k = 3; k >= 0; k--) g.quadraticCurveTo(x + k * 8 + 4, y + 14 + (k % 2) * 3, x + k * 8, y + 8); g.fill(); }
    } else if (s === "leaves") { // mossy stone
      g.fillStyle = c3; g.fillRect(x, y + TS - 6, TS, 6); g.fillRect(x + TS - 4, y, 4, TS);
      g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(x + 3, y + 3, 10, 5);
      if (top) { g.fillStyle = "#4ab030"; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + 4 + k * 8, y + 2, 6, 5, 0, 0, TAU); g.fill(); } g.fillStyle = "#ff6ab0"; if (v === 2) { g.beginPath(); g.arc(x + 20, y - 2, 3, 0, TAU); g.fill(); } }
    } else if (s === "snow") { // ice blocks
      const gr = g.createLinearGradient(x, y, x + TS, y + TS); gr.addColorStop(0, c2); gr.addColorStop(1, c3); g.fillStyle = gr; g.fillRect(x, y, TS, TS);
      g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 5, y + 8); g.lineTo(x + 14, y + 4); g.stroke();
      if (top) { g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(x, y + 6); for (let k = 0; k <= 4; k++) g.quadraticCurveTo(x + k * 8 - 4, y - 3, x + k * 8, y + 4); g.lineTo(x + TS, y); g.lineTo(x, y); g.fill(); if (v === 1) { g.beginPath(); g.moveTo(x + 10, y + 6); g.lineTo(x + 13, y + 16); g.lineTo(x + 16, y + 6); g.fill(); } }
    } else if (s === "embers") { // lava rock with glowing cracks
      g.fillStyle = c3; g.fillRect(x, y + TS - 5, TS, 5);
      g.strokeStyle = c2; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 4 + v * 3, y + 4); g.lineTo(x + 12, y + 14); g.lineTo(x + 8, y + 26); g.moveTo(x + 12, y + 14); g.lineTo(x + 24, y + 18); g.stroke();
      if (top) { g.fillStyle = "#ff6a1a"; g.fillRect(x, y, TS, 4); }
    } else { // castle bricks
      g.fillStyle = c3; g.fillRect(x, y + 15, TS, 2); g.fillRect(x + (r % 2 ? 16 : 0), y, 2, 15); g.fillRect(x + (r % 2 ? 0 : 16), y + 17, 2, 15);
      g.fillStyle = "rgba(255,255,255,0.2)"; g.fillRect(x + 3, y + 3, 10, 3);
      if (top && wd.name !== "Ghost Castle") { g.fillStyle = "#ffe080"; g.fillRect(x, y, TS, 4); }
    }
    g.strokeStyle = "rgba(20,0,30,0.55)"; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, TS - 2, TS - 2);
  }

  /* ---------- backgrounds ---------- */
  function drawBackground(ctx, wi, t) {
    const wd = WORLDS[wi];
    const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, wd.bg1); gr.addColorStop(1, wd.bg2);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    const d = wd.deco;
    if (d === "sprinkles") {
      // floating candy and big soft circles
      ctx.fillStyle = "rgba(255,120,200,0.08)"; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc((i * 211 + t * 8) % (W + 200) - 100, 100 + (i * 97) % 500, 60 + (i % 3) * 30, 0, TAU); ctx.fill(); }
      for (let i = 0; i < 60; i++) { const x = (U.hash(i) * W + t * (10 + U.hash(i, 2) * 20)) % W, y = (U.hash(i, 5) * H + t * 15) % H; ctx.save(); ctx.translate(x, y); ctx.rotate(t + i); ctx.fillStyle = ["#ff6ab0", "#6ad0ff", "#ffe060", "#80ff90", "#ffffff"][i % 5]; ctx.fillRect(-5, -1.5, 10, 3); ctx.restore(); }
    } else if (d === "leaves") {
      ctx.fillStyle = "rgba(0,40,10,0.35)"; for (let i = 0; i < 12; i++) { const x = i * 120 + 20; ctx.beginPath(); ctx.moveTo(x, H); ctx.quadraticCurveTo(x + 30, H - 300 - (i % 3) * 80, x + 60, H); ctx.fill(); }
      for (let i = 0; i < 30; i++) { const x = (U.hash(i) * W + Math.sin(t + i) * 40) % W, y = (U.hash(i, 3) * H + t * (25 + U.hash(i, 4) * 25)) % H; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2 + i)); ctx.fillStyle = i % 2 ? "#6ac040" : "#a0d050"; ctx.beginPath(); ctx.ellipse(0, 0, 7, 3.5, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    } else if (d === "snow") {
      ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 80) ctx.lineTo(x, H - 160 - Math.abs(Math.sin(x * 0.01)) * 160); ctx.lineTo(W, H); ctx.fill();
      ctx.fillStyle = "#ffffff"; for (let i = 0; i < 90; i++) { const x = (U.hash(i) * W + Math.sin(t + i) * 20) % W, y = (U.hash(i, 3) * H + t * (30 + U.hash(i, 4) * 40)) % H; ctx.globalAlpha = 0.4 + U.hash(i, 6) * 0.6; ctx.beginPath(); ctx.arc(x, y, 1 + U.hash(i, 7) * 2.5, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
    } else if (d === "embers") {
      ctx.fillStyle = "rgba(255,80,20,0.15)"; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, H - 90 - Math.sin(x * 0.02 + t) * 12); ctx.lineTo(W, H); ctx.fill();
      for (let i = 0; i < 50; i++) { const x = (U.hash(i) * W + Math.sin(t * 2 + i) * 15) % W, y = H - ((U.hash(i, 3) * H + t * (40 + U.hash(i, 4) * 50)) % H); ctx.fillStyle = `rgba(255,${120 + U.hash(i, 5) * 120},40,${0.5 + 0.5 * Math.sin(t * 5 + i)})`; ctx.fillRect(x, y, 3, 3); }
    } else {
      ctx.fillStyle = "#ffffff"; for (let i = 0; i < 80; i++) { ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 1.5 + i)); ctx.fillRect(U.hash(i) * W, U.hash(i, 2) * H * 0.8, 2, 2); } ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff8d0"; ctx.beginPath(); ctx.arc(W - 220, 130, 60, 0, TAU); ctx.fill(); ctx.fillStyle = wd.bg1; ctx.beginPath(); ctx.arc(W - 195, 115, 52, 0, TAU); ctx.fill();
      if (wi === 4) { ctx.fillStyle = "rgba(10,10,30,0.6)"; for (let i = 0; i < 6; i++) { const x = i * 230; ctx.fillRect(x, H - 260 - (i % 2) * 80, 90, 300); for (let k = 0; k < 4; k++) ctx.fillRect(x + k * 24, H - 280 - (i % 2) * 80, 14, 22); ctx.fillStyle = "rgba(255,220,120,0.5)"; ctx.fillRect(x + 36, H - 200 - (i % 2) * 80, 14, 20); ctx.fillStyle = "rgba(10,10,30,0.6)"; } }
    }
  }

  /* ---------- character drawing ---------- */
  function puff(ctx, x, y, face, o = {}) {
    // the hero: a chubby green bubble dragon
    const t = o.t || 0, s = o.s || 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(face * s, s);
    if (o.spin) ctx.rotate(o.spin);
    const walk = o.walk || 0, bob = Math.abs(Math.sin(walk * 10)) * 3 * (o.moving ? 1 : 0);
    const sq = o.jump ? 1.08 : 1;
    ctx.translate(0, -bob);
    ctx.lineJoin = "round"; ctx.lineWidth = 3; ctx.strokeStyle = OUT;
    // feet
    ctx.fillStyle = "#ff9a40";
    const f1 = o.moving ? Math.sin(walk * 10) * 5 : 0;
    for (const [fx, ff] of [[-7, f1], [7, -f1]]) { ctx.beginPath(); ctx.ellipse(fx + ff, -3, 7, 4.5, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
    // tail
    ctx.fillStyle = o.body || "#5ad05a"; ctx.beginPath(); ctx.moveTo(-10, -12); ctx.quadraticCurveTo(-24, -10 + Math.sin(t * 6) * 2, -22, -22); ctx.quadraticCurveTo(-16, -16, -8, -18); ctx.fill(); ctx.stroke();
    // back spikes
    ctx.fillStyle = "#ffb030"; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-12 + i * 2, -14 - i * 7); ctx.lineTo(-20 + i * 2, -18 - i * 7); ctx.lineTo(-10 + i * 2, -21 - i * 7); ctx.fill(); ctx.stroke(); }
    // body
    ctx.fillStyle = o.body || "#5ad05a"; ctx.beginPath(); ctx.ellipse(0, -16, 15, 15 * sq, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff4c0"; ctx.beginPath(); ctx.ellipse(4, -13, 9, 10, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "rgba(200,160,60,0.6)"; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-3, -18 + i * 5); ctx.lineTo(11, -18 + i * 5); ctx.stroke(); }
    ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    // wing
    ctx.fillStyle = "#a0f0a0"; ctx.beginPath(); ctx.moveTo(-6, -24); ctx.quadraticCurveTo(-16, -40 + Math.sin(t * 12) * (o.jump ? 4 : 1), -2, -34); ctx.quadraticCurveTo(-2, -28, -6, -24); ctx.fill(); ctx.stroke();
    // head
    ctx.fillStyle = o.body || "#5ad05a"; ctx.beginPath(); ctx.ellipse(6, -34, 14, 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
    // snout / mouth
    if (o.blow) { ctx.fillStyle = "#5ad05a"; ctx.beginPath(); ctx.ellipse(19, -30, 7, 7, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#6a1a2a"; ctx.beginPath(); ctx.arc(22, -30, 3.5, 0, TAU); ctx.fill(); ctx.fillStyle = "rgba(255,120,150,0.7)"; ctx.beginPath(); ctx.arc(9, -27, 4, 0, TAU); ctx.fill(); }
    else { ctx.fillStyle = "#7ae07a"; ctx.beginPath(); ctx.ellipse(17, -30, 7, 5.5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(20, -32, 1.3, 0, TAU); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(14, -28, 4, 0.2, 1.6); ctx.stroke(); }
    // horn
    ctx.fillStyle = "#fff4c0"; ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(-2, -52); ctx.lineTo(5, -45); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
    // eye
    if (o.dizzy) { ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(4, -40); ctx.lineTo(12, -32); ctx.moveTo(12, -40); ctx.lineTo(4, -32); ctx.stroke(); }
    else {
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(8, -37, 6, o.blink ? 1 : 7, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
      if (!o.blink) { ctx.fillStyle = OUT; ctx.beginPath(); ctx.ellipse(10, -36, 3.2, 4.2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(9, -38, 1.5, 0, TAU); ctx.fill(); }
    }
    ctx.fillStyle = "rgba(255,120,150,0.5)"; ctx.beginPath(); ctx.ellipse(3, -28, 3.5, 2, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function enemyDraw(ctx, e, t, o = {}) {
    const d = ENEMY[e.type] || { col: "#ffffff", col2: "#cccccc" }, x = e.x, y = e.y, f = e.face || 1, angry = e.angry;
    ctx.save(); ctx.translate(x, y); ctx.scale(f * (o.s || 1), o.s || 1);
    if (o.spin) ctx.rotate(o.spin);
    ctx.lineJoin = "round"; ctx.lineWidth = 3; ctx.strokeStyle = OUT;
    const body = angry ? "#ff4a5a" : d.col, body2 = angry ? "#a01020" : d.col2;
    const ph = t * 10 + (e.ph || 0), walk = Math.sin(ph) * 3;
    const eyes = (ex, ey, r = 5) => {
      for (const dx of [-r * 1.1, r * 1.1]) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(ex + dx, ey, r, r * 1.15, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = o.dead ? "#000" : angry ? "#c00010" : OUT; ctx.beginPath(); ctx.arc(ex + dx + 1.5, ey + 1, r * 0.5, 0, TAU); ctx.fill(); }
      if (angry) { ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ex - r * 2.2, ey - r * 1.6); ctx.lineTo(ex - r * 0.2, ey - r * 0.9); ctx.moveTo(ex + r * 2.2, ey - r * 1.6); ctx.lineTo(ex + r * 0.2, ey - r * 0.9); ctx.stroke(); }
    };
    switch (e.type) {
      case "windup": {
        ctx.fillStyle = body2; ctx.fillRect(-10 + walk, -6, 7, 6); ctx.strokeRect(-10 + walk, -6, 7, 6); ctx.fillRect(3 - walk, -6, 7, 6); ctx.strokeRect(3 - walk, -6, 7, 6);
        ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(-15, -34, 30, 29, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#ffd040"; ctx.save(); ctx.translate(-16, -20); ctx.rotate(ph * 0.5); ctx.fillRect(-2, -8, 4, 16); ctx.fillRect(-8, -2, 16, 4); ctx.strokeRect(-2, -8, 4, 16); ctx.restore();
        ctx.fillStyle = "#c0c0d0"; ctx.fillRect(-2, -42, 4, 8); ctx.beginPath(); ctx.arc(0, -43, 4, 0, TAU); ctx.fill(); ctx.stroke();
        eyes(3, -23, 5);
        ctx.fillStyle = OUT; ctx.fillRect(-2, -13, 12, 3);
        break;
      }
      case "frog": case "blob": {
        const sq = e.onGround ? 1 : 1.15;
        ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, -14 * sq, 17, 14 * sq, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = body2; if (e.type === "frog") { ctx.beginPath(); ctx.ellipse(-12, -3, 7, 4, 0, 0, TAU); ctx.ellipse(12, -3, 7, 4, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
        else { ctx.beginPath(); ctx.ellipse(-4, -22, 6, 4, 0, 0, TAU); ctx.fill(); }
        if (e.type === "frog") { ctx.fillStyle = body; ctx.beginPath(); ctx.arc(-6, -28, 7, 0, TAU); ctx.arc(8, -28, 7, 0, TAU); ctx.fill(); ctx.stroke(); eyes(1, -29, 4.5); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(2, -15, 7, 0.2, Math.PI - 0.2); ctx.stroke(); }
        else { eyes(3, -17, 4.5); ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.ellipse(-6, -22, 4, 2, -0.5, 0, TAU); ctx.fill(); }
        break;
      }
      case "bee": case "bat": {
        const flap = Math.sin(t * 30 + (e.ph || 0)) * 0.6;
        if (e.type === "bee") {
          ctx.fillStyle = "rgba(220,240,255,0.85)"; ctx.save(); ctx.translate(-2, -26); ctx.rotate(-0.4 + flap); ctx.beginPath(); ctx.ellipse(0, -8, 6, 11, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
          ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, -16, 15, 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.save(); ctx.beginPath(); ctx.ellipse(0, -16, 15, 12, 0, 0, TAU); ctx.clip(); ctx.fillStyle = body2; ctx.fillRect(-9, -30, 5, 30); ctx.fillRect(1, -30, 5, 30); ctx.restore();
          ctx.fillStyle = OUT; ctx.beginPath(); ctx.moveTo(-15, -16); ctx.lineTo(-22, -14); ctx.lineTo(-14, -12); ctx.fill();
          eyes(8, -19, 4);
        } else {
          ctx.fillStyle = body2; for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 8, -18); ctx.scale(s, 1); ctx.rotate(flap); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, -10); ctx.lineTo(14, 0); ctx.lineTo(22, 4); ctx.lineTo(10, 6); ctx.closePath(); ctx.fillStyle = body; ctx.fill(); ctx.stroke(); ctx.restore(); }
          ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, -18, 12, 11, 0, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-8, -26); ctx.lineTo(-6, -34); ctx.lineTo(-2, -28); ctx.moveTo(8, -26); ctx.lineTo(6, -34); ctx.lineTo(2, -28); ctx.fill(); ctx.stroke();
          eyes(1, -19, 4); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(-3, -11); ctx.lineTo(-1, -7); ctx.lineTo(1, -11); ctx.fill();
        }
        break;
      }
      case "penguin": {
        ctx.fillStyle = "#ffa020"; ctx.beginPath(); ctx.ellipse(-6 + walk, -2, 6, 3, 0, 0, TAU); ctx.ellipse(6 - walk, -2, 6, 3, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = angry ? "#802030" : body; ctx.beginPath(); ctx.ellipse(0, -18, 14, 18, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(3, -14, 9, 13, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = "#ffa020"; ctx.beginPath(); ctx.moveTo(10, -26); ctx.lineTo(19, -23); ctx.lineTo(10, -20); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#e04060"; ctx.fillRect(-12, -32, 24, 5);
        eyes(3, -28, 3.5);
        break;
      }
      case "snowman": {
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(0, -12, 13, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -32, 10, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = angry ? "#d02020" : "#3a3a4a"; ctx.fillRect(-9, -44, 18, 4); ctx.fillRect(-6, -54, 12, 10); ctx.strokeRect(-6, -54, 12, 10);
        ctx.fillStyle = "#ff7a20"; ctx.beginPath(); ctx.moveTo(5, -31); ctx.lineTo(15, -29); ctx.lineTo(5, -27); ctx.fill();
        ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(-1, -35, 2, 0, TAU); ctx.arc(5, -35, 2, 0, TAU); ctx.arc(0, -16, 2, 0, TAU); ctx.arc(0, -9, 2, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#7a4a2a"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(10, -16); ctx.lineTo(20, -24 + walk); ctx.stroke();
        break;
      }
      case "imp": {
        ctx.fillStyle = body2; ctx.beginPath(); ctx.moveTo(-10, -30); ctx.lineTo(-14, -42); ctx.lineTo(-4, -32); ctx.moveTo(10, -30); ctx.lineTo(14, -42); ctx.lineTo(4, -32); ctx.fill(); ctx.stroke();
        ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, -18, 14, 16, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = OUT; ctx.beginPath(); ctx.moveTo(-12, -8); ctx.quadraticCurveTo(-26, -6, -22, -18); ctx.stroke(); ctx.fillStyle = OUT; ctx.beginPath(); ctx.moveTo(-22, -18); ctx.lineTo(-26, -22); ctx.lineTo(-18, -21); ctx.fill();
        eyes(3, -22, 4); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(-2, -11); ctx.lineTo(10, -11); ctx.lineTo(4, -6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = OUT; ctx.fillRect(-8 + walk, -3, 5, 3); ctx.fillRect(3 - walk, -3, 5, 3);
        break;
      }
      case "ghost": {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = angry ? "#ffb0c0" : body; ctx.beginPath(); ctx.moveTo(-15, -4); ctx.lineTo(-15, -22); ctx.arc(0, -22, 15, Math.PI, 0); ctx.lineTo(15, -4);
        for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(11 - i * 7.5 - 3.75, -4 + (i % 2 ? -5 : 5) + Math.sin(t * 8 + i) * 2, 7.5 - i * 7.5, -4);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        eyes(3, -24, 4.5); ctx.fillStyle = OUT; ctx.beginPath(); ctx.ellipse(3, -13, 4, 3 + Math.sin(t * 4), 0, 0, TAU); ctx.fill();
        break;
      }
      case "skel": {
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(0, -22, 18, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillRect(-10, -8, 20, 9); ctx.strokeRect(-10, -8, 20, 9);
        ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(-6, -24, 5, 0, TAU); ctx.arc(7, -24, 5, 0, TAU); ctx.fill(); ctx.fillStyle = "#ff3040"; ctx.beginPath(); ctx.arc(-6, -24, 2, 0, TAU); ctx.arc(7, -24, 2, 0, TAU); ctx.fill();
        ctx.strokeStyle = OUT; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-7 + i * 5, -8); ctx.lineTo(-7 + i * 5, 0); ctx.stroke(); }
        break;
      }
    }
    ctx.restore();
  }
  function bubbleDraw(ctx, b, t) {
    const r = b.r * (b.popT ? 1 + b.popT * 3 : 1) * (1 + Math.sin(t * 6 + b.ph) * 0.04);
    const blink = b.life < 2 && Math.floor(t * 10) % 2;
    if (b.e) { enemyDraw(ctx, Object.assign({}, b.e, { x: b.x, y: b.y + 18, face: Math.sin(t * 8 + b.ph) > 0 ? 1 : -1 }), t, { s: 0.8 }); }
    if (b.letter) { txt(ctx, b.letter, b.x, b.y + 2, 26, ["#ff6ab0", "#ffe060", "#6ad0ff", "#80ff90", "#ff9a40", "#c080ff"]["EXTEND".indexOf(b.letter)]); }
    if (b.zap) { ctx.fillStyle = "#ffe040"; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x + 3, b.y - 12); ctx.lineTo(b.x - 6, b.y + 2); ctx.lineTo(b.x, b.y + 2); ctx.lineTo(b.x - 3, b.y + 12); ctx.lineTo(b.x + 7, b.y - 2); ctx.lineTo(b.x + 1, b.y - 2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.save();
    ctx.globalAlpha = b.popT ? 1 - b.popT * 5 : blink ? 0.4 : 0.85;
    const hue = (t * 60 + b.ph * 50) % 360;
    const gr = ctx.createRadialGradient(b.x - r * 0.3, b.y - r * 0.3, r * 0.1, b.x, b.y, r);
    gr.addColorStop(0, "rgba(255,255,255,0.15)"); gr.addColorStop(0.75, b.e ? (b.e.angry ? "rgba(255,80,120,0.35)" : "rgba(120,220,255,0.3)") : b.zap ? "rgba(255,230,80,0.35)" : "rgba(140,255,200,0.25)"); gr.addColorStop(1, `hsla(${hue},90%,70%,0.7)`);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = `hsla(${hue},90%,80%,0.9)`; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.beginPath(); ctx.ellipse(b.x - r * 0.4, b.y - r * 0.42, r * 0.28, r * 0.15, -0.7, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x + r * 0.45, b.y + r * 0.35, r * 0.08, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function fruitDraw(ctx, kind, x, y, t) {
    ctx.save(); ctx.translate(x, y); ctx.lineJoin = "round"; ctx.lineWidth = 2.5; ctx.strokeStyle = OUT;
    switch (kind) {
      case "cherry": ctx.strokeStyle = "#3a8a2a"; ctx.beginPath(); ctx.moveTo(-6, -10); ctx.quadraticCurveTo(0, -26, 6, -28); ctx.moveTo(7, -10); ctx.quadraticCurveTo(6, -20, 6, -28); ctx.stroke(); ctx.strokeStyle = OUT; ctx.fillStyle = "#e82040"; ctx.beginPath(); ctx.arc(-6, -8, 7, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(7, -8, 7, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-8, -11, 2, 0, TAU); ctx.arc(5, -11, 2, 0, TAU); ctx.fill(); break;
      case "banana": ctx.fillStyle = "#ffe040"; ctx.beginPath(); ctx.moveTo(-12, -20); ctx.quadraticCurveTo(-10, 2, 14, -4); ctx.quadraticCurveTo(-2, -6, -6, -22); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
      case "melon": ctx.fillStyle = "#40b040"; ctx.beginPath(); ctx.arc(0, -16, 14, 0, Math.PI); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#ff4a6a"; ctx.beginPath(); ctx.arc(0, -16, 10, 0, Math.PI); ctx.fill(); ctx.fillStyle = OUT; for (const dx of [-5, 0, 5]) { ctx.beginPath(); ctx.ellipse(dx, -11, 1.3, 2, 0, 0, TAU); ctx.fill(); } break;
      case "donut": ctx.fillStyle = "#d09050"; ctx.beginPath(); ctx.arc(0, -12, 12, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#ff8ac8"; ctx.beginPath(); ctx.arc(0, -13, 10, 0, TAU); ctx.fill(); ctx.fillStyle = "#3a1a40"; ctx.beginPath(); ctx.arc(0, -12, 4, 0, TAU); ctx.fill(); ctx.stroke(); for (let i = 0; i < 6; i++) { ctx.fillStyle = ["#fff", "#6ad0ff", "#ffe040"][i % 3]; ctx.fillRect(Math.cos(i) * 7 - 1, -13 + Math.sin(i) * 7, 3, 2); } break;
      case "icecream": ctx.fillStyle = "#e0a050"; ctx.beginPath(); ctx.moveTo(-8, -14); ctx.lineTo(0, 2); ctx.lineTo(8, -14); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#ffd0e8"; ctx.beginPath(); ctx.arc(0, -18, 9, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#e82040"; ctx.beginPath(); ctx.arc(2, -27, 3, 0, TAU); ctx.fill(); break;
      case "cake": ctx.fillStyle = "#fff4d0"; ctx.fillRect(-12, -16, 24, 14); ctx.strokeRect(-12, -16, 24, 14); ctx.fillStyle = "#ff8ac8"; ctx.fillRect(-12, -18, 24, 6); ctx.fillStyle = "#e82040"; ctx.beginPath(); ctx.arc(0, -22, 4, 0, TAU); ctx.fill(); ctx.stroke(); break;
      case "diamond": { const s = 1 + Math.sin(t * 6) * 0.08; ctx.scale(s, s); ctx.fillStyle = "#80e0ff"; ctx.beginPath(); ctx.moveTo(-12, -16); ctx.lineTo(-6, -22); ctx.lineTo(6, -22); ctx.lineTo(12, -16); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.beginPath(); ctx.moveTo(-6, -16); ctx.lineTo(-3, -21); ctx.lineTo(0, -16); ctx.fill(); break; }
      case "candy_pink": case "candy_blue": ctx.fillStyle = kind === "candy_pink" ? "#ff6ab0" : "#4ab0ff"; ctx.beginPath(); ctx.arc(0, -12, 8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(-16, -18); ctx.lineTo(-16, -6); ctx.closePath(); ctx.moveTo(8, -12); ctx.lineTo(16, -18); ctx.lineTo(16, -6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = "#fff"; ctx.beginPath(); ctx.arc(0, -12, 4, 0, 4); ctx.stroke(); break;
      case "shoe": ctx.fillStyle = "#ff4a3a"; ctx.beginPath(); ctx.moveTo(-10, -20); ctx.lineTo(-2, -20); ctx.lineTo(0, -10); ctx.lineTo(12, -6); ctx.lineTo(12, -1); ctx.lineTo(-10, -1); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.fillRect(-10, -4, 22, 3); ctx.fillStyle = "#ffe040"; ctx.beginPath(); ctx.moveTo(-14, -16); ctx.lineTo(-20, -18); ctx.lineTo(-14, -12); ctx.fill(); break;
    }
    ctx.restore();
  }

  /* ---------- logo and title animation ---------- */
  function logo(ctx, t, y) {
    const s = "BUBBLE PUFF", cols = ["#ff6ab0", "#ffb030", "#ffe040", "#60e080", "#40c8ff", "#a070ff", "#ff6ab0", "#ffffff", "#ffb030", "#60e080", "#40c8ff"];
    ctx.save(); ctx.font = `700 104px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    let x = W / 2 - ctx.measureText(s).width / 2;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i], w = ctx.measureText(ch).width;
      if (ch !== " ") {
        const yy = y + Math.sin(t * 3 + i * 0.7) * 10, sc = 1 + Math.sin(t * 3 + i * 0.7) * 0.05;
        ctx.save(); ctx.translate(x + w / 2, yy); ctx.scale(sc, sc);
        ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.beginPath(); ctx.arc(0, 0, 48, 0, TAU); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 3; ctx.stroke();
        ctx.lineJoin = "round"; ctx.lineWidth = 14; ctx.strokeStyle = OUT; ctx.strokeText(ch, 0, 4);
        ctx.fillStyle = cols[i]; ctx.fillText(ch, 0, 4);
        ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.beginPath(); ctx.ellipse(-24, -30, 12, 6, -0.6, 0, TAU); ctx.fill();
        ctx.restore();
      }
      x += w;
    }
    ctx.restore();
    txt(ctx, "TRAP · POP · COLLECT!", W / 2, y + 90, 32, "#ffffff");
  }
  const titleBubbles = Array.from({ length: 14 }, (_, i) => ({ x: Math.random() * W, y: H + Math.random() * H, r: 16 + Math.random() * 18, ph: Math.random() * 6, life: 9, e: i % 3 === 0 ? { type: ["windup", "frog", "bee", "penguin", "imp", "ghost"][i % 6], ph: i } : null }));
  function attract(ctx, t) {
    for (const b of titleBubbles) { b.y -= 0.8; b.x += Math.sin(t + b.ph) * 0.4; if (b.y < -40) { b.y = H + 40; b.x = Math.random() * W; } bubbleDraw(ctx, b, t); }
    const x = ((t * 120) % (W + 200)) - 100;
    puff(ctx, x, 690, 1, { t, walk: t, moving: true, blow: Math.sin(t * 3) > 0.7 });
  }

  /* ---------- game ---------- */
  let P, enemies, bubbles, items, shots, pops, parts, boss, round, roundT, hurry, skel, clearT, letterT, chainId = 0;
  function newGame() {
    G.run = { score: 0, lives: 3, round: 0, cheated: G.cheat, extend: [], won: false, nextLife: 50000 };
    startRound(0);
  }
  function startRound(n) {
    const run = G.run;
    run.round = n; round = n;
    worldIdx = n >= 15 ? 5 : Math.floor(n / 3);
    const spawns = loadMap(n);
    enemies = []; bubbles = []; items = []; shots = []; pops = []; parts = []; boss = null; skel = null;
    roundT = 0; hurry = false; clearT = -1; letterT = U.rand(10, 18);
    const wd = WORLDS[worldIdx];
    for (const s of spawns) {
      const type = s.ch === "e" ? wd.e : wd.f;
      enemies.push(mkEnemy(type, FX + (s.c + 0.5) * TS, FY + (s.r + 1) * TS, s.c < COLS / 2 ? 1 : -1));
    }
    if (n === 15) boss = { x: FX + FW * 0.7, y: FY + 200, vx: -140, vy: 90, r: 70, hp: 60, maxHp: 60, throwT: 2, hitT: 0, dead: 0, ph: 0 };
    const keep = P ? { pow: P.pow } : { pow: {} };
    P = { x: FX + 3.5 * TS, y: FY + 20 * TS, vx: 0, vy: 0, face: 1, onGround: true, w: 26, h: 40, blowT: 0, cool: 0, inv: 2, dead: 0, walk: 0, blink: false, blinkT: 3, pow: keep.pow };
    UI.go("roundintro");
  }
  function mkEnemy(type, x, y, face) { return { type, x, y, vx: 0, vy: 0, face, onGround: false, w: 28, h: 30, t: 0, ph: Math.random() * 6, jumpT: U.rand(1, 3), shotT: U.rand(2, 4), angry: false, think: 0 }; }
  function addScore(n, x, y, col) {
    if (G.cheat) { G.run.cheated = true; if (x !== undefined) pops.push({ x, y, text: "+0", col: "#aaa", t: 0 }); return; }
    G.run.score += n;
    if (x !== undefined) pops.push({ x, y, text: `${U.fmt(n)}`, col: col || "#ffffff", t: 0 });
    if (G.run.score >= G.run.nextLife) { G.run.nextLife += 80000; G.run.lives++; A.sfx("extend"); A.say("One up!", { pitch: 1.5 }); }
  }

  // shared platform physics for everything that walks
  function physics(o, dt, walls = true) {
    o.vy = Math.min(MAXFALL, o.vy + GRAV * dt);
    o.x += o.vx * dt;
    const minX = FX + 2 * TS + o.w / 2, maxX = FX + FW - 2 * TS - o.w / 2;
    o.hitWall = false;
    if (walls) { if (o.x < minX) { o.x = minX; o.hitWall = true; } if (o.x > maxX) { o.x = maxX; o.hitWall = true; } }
    const oldY = o.y;
    o.y += o.vy * dt;
    o.onGround = false;
    if (o.vy >= 0) {
      const r0 = Math.floor((oldY - FY) / TS), r1 = Math.floor((o.y - FY) / TS);
      for (let r = Math.max(0, r0); r <= r1; r++) {
        const top = tileTop(r);
        if (oldY <= top + 1 && o.y >= top) {
          const c0 = Math.floor((o.x - o.w * 0.35 - FX) / TS), c1 = Math.floor((o.x + o.w * 0.35 - FX) / TS);
          let hit = false;
          for (let c = c0; c <= c1; c++) if (standable(c, r)) hit = true;
          if (hit) { o.y = top; o.vy = 0; o.onGround = true; break; }
        }
      }
    }
    // falling out at the bottom wraps around to the top, jumping out at the top wraps to the bottom
    if (o.y > FY + FH + 40) o.y = FY - 10;
    if (o.y < FY - 50) o.y = FY + FH;
  }
  const groundAhead = (o, dir) => { const c = Math.floor((o.x + dir * (o.w * 0.6) - FX) / TS), r = Math.floor((o.y + 2 - FY) / TS); return standable(c, r); };
  const overlap = (a, b) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 * 0.8 && Math.abs((a.y - a.h / 2) - (b.y - b.h / 2)) < (a.h + b.h) / 2 * 0.8;

  function update(dt) {
    const run = G.run;
    roundT += dt;
    // hurry up and the ghost that cannot be trapped
    if (!hurry && roundT > 40 && !boss && clearT < 0) { hurry = true; A.sfx("hurry"); A.say("Hurry up!", { pitch: 1.4, force: true }); A.playSong("hurry"); pops.push({ x: FX + FW / 2, y: FY + FH / 2, text: "HURRY UP!", col: "#ff4a6a", t: 0, size: 64, big: true }); for (const e of enemies) e.angry = true; }
    if (hurry && !skel && roundT > 55 && clearT < 0) { skel = { x: FX + FW / 2, y: FY + 60, type: "skel", w: 30, h: 36, face: 1 }; A.say("Uh oh! Here comes Skully!", { pitch: 1.2 }); }
    // player
    let mx = 0;
    if (I.held("left")) mx -= 1; if (I.held("right")) mx += 1;
    if (I.pad.connected && Math.abs(I.pad.axes[0]) > 0.3) mx = Math.sign(I.pad.axes[0]);
    const m = I.mouse;
    if (I.lastDevice === "mouse" && m.inside) { const dx = m.x - P.x; if (Math.abs(dx) > 18) mx = Math.sign(dx); }
    const jumpHeld = I.held("jump") || (m.buttons & 4) !== 0 || (m.buttons & 2) !== 0;
    const jumpHit = I.hit("jump") || m.rclicked || m.mclicked;
    const blowHit = I.hit("fire") || m.clicked || (I.pad.connected && (I.pad.pressed.has(1) || I.pad.pressed.has(2)));
    if (P.dead > 0) {
      P.dead -= dt; P.spin = (P.spin || 0) + dt * 14; P.vy = Math.min(P.vy + GRAV * 0.5 * dt, 200); P.y += P.vy * dt * 0.3;
      if (P.dead <= 0) {
        if (run.lives <= 0) { gameOver(); return; }
        Object.assign(P, { x: FX + 3.5 * TS, y: FY + 20 * TS, vx: 0, vy: 0, inv: 2.5, spin: 0, face: 1 });
      }
    } else {
      const sp = 175 * (P.pow.shoe ? 1.35 : 1);
      P.vx = mx * sp;
      if (mx) P.face = mx;
      if (jumpHit && P.onGround) { P.vy = -JUMP; A.sfx("jump"); }
      physics(P, dt);
      P.walk += dt * (mx ? 1 : 0);
      P.inv = Math.max(0, P.inv - dt);
      P.cool -= dt; P.blowT = Math.max(0, P.blowT - dt);
      if (blowHit && P.cool <= 0) {
        P.cool = P.pow.pink ? 0.16 : 0.32; P.blowT = 0.18;
        bubbles.push({ x: P.x + P.face * 22, y: P.y - 26, vx: P.face * 640 * (P.pow.blue ? 1.45 : 1), vy: 0, r: 20, t: 0, life: 10, ph: Math.random() * 6, shoot: true, own: 0.25 });
        A.sfx("blow");
      }
    }
    P.blinkT -= dt; if (P.blinkT < 0) { P.blink = !P.blink; P.blinkT = P.blink ? 0.12 : U.rand(2, 4); }

    // bubbles
    const topY = FY + TS + 24, cx = FX + FW / 2;
    for (const b of bubbles) {
      if (b.popT) { b.popT += dt; continue; }
      b.t += dt; b.life -= dt; b.own -= dt;
      if (b.shoot) {
        b.x += b.vx * dt; b.vx *= Math.pow(0.0025, dt);
        if (b.x < FX + 2 * TS + b.r) { b.x = FX + 2 * TS + b.r; b.vx = 0; }
        if (b.x > FX + FW - 2 * TS - b.r) { b.x = FX + FW - 2 * TS - b.r; b.vx = 0; }
        // trap an enemy
        for (const e of enemies) if (!e.dead && !e.caught && Math.hypot(e.x - b.x, e.y - 15 - b.y) < b.r + 14) { e.caught = true; b.e = e; b.shoot = false; b.life = 8 + (e.angry ? -2 : 0); A.sfx("capture"); break; }
        if (boss && !boss.dead && Math.hypot(boss.x - b.x, boss.y - b.y) < boss.r + b.r) { b.popT = 0.01; hitBoss(1); continue; }
        if (Math.abs(b.vx) < 70) b.shoot = false;
      } else {
        b.vy += ((b.y > topY ? -70 : 0) - b.vy) * Math.min(1, dt * 3);
        b.y += b.vy * dt + Math.sin(b.t * 3 + b.ph) * 0.4;
        if (b.y <= topY + 30) b.x += Math.sign(cx + Math.sin(b.ph) * 120 - b.x) * Math.min(40 * dt, Math.abs(cx + Math.sin(b.ph) * 120 - b.x));
        if (b.y < topY) b.y = topY;
      }
      // keep bubbles apart
      for (const o of bubbles) if (o !== b && !o.popT) { const dx = b.x - o.x, dy = b.y - o.y, d = Math.hypot(dx, dy) || 1, min = b.r + o.r - 4; if (d < min) { b.x += (dx / d) * (min - d) * 0.25; b.y += (dy / d) * (min - d) * 0.25; } }
      if (b.life <= 0) {
        if (b.e) { const e = b.e; e.caught = false; e.angry = true; e.x = b.x; e.y = b.y + 18; e.vy = -200; A.say(U.pick(["It escaped!", "Grr!"]), { pitch: 1.4, gap: 4000 }); b.e = null; }
        b.popT = 0.01; A.sfx("pop");
      }
      // the player pops bubbles – or bounces on them
      if (P.dead <= 0 && b.own <= 0 && !b.popT) {
        const dx = P.x - b.x, dy = (P.y - 20) - b.y;
        if (Math.hypot(dx, dy) < b.r + 18) {
          if (jumpHeld && P.vy > 0 && P.y - 10 < b.y && !b.e) { P.vy = -JUMP * 0.8; A.sfx("bounce"); b.y += 6; }
          else popBubble(b, ++chainId);
        }
      }
    }
    bubbles = bubbles.filter((b) => !b.popT || b.popT < 0.2);
    // chain reaction
    for (const b of bubbles) if (b.chainAt !== undefined && !b.popT) { b.chainAt -= dt; if (b.chainAt <= 0) popBubble(b, b.chain); }

    // enemies
    for (const e of enemies) {
      if (e.caught) continue;
      e.t += dt;
      if (e.dead) {
        // flying corpse: lands and turns into fruit
        e.spin += dt * 12; e.vy = Math.min(MAXFALL, e.vy + GRAV * dt); e.x += e.vx * dt; e.y += e.vy * dt;
        const minX = FX + 2 * TS + 14, maxX = FX + FW - 2 * TS - 14;
        if (e.x < minX || e.x > maxX) { e.vx = -e.vx; e.x = U.clamp(e.x, minX, maxX); }
        if (e.y > FY + FH + 30) e.y = FY;
        if (e.t > 0.6 && e.vy > 0) { const r = Math.floor((e.y - FY) / TS), c = Math.floor((e.x - FX) / TS); if (standable(c, r) && e.y - tileTop(r) < 14) { e.gone = true; dropItem(e.x, tileTop(r), e.fruitIdx); } }
        if (e.t > 5) { e.gone = true; dropItem(U.clamp(e.x, FX + 80, FX + FW - 80), FY + 20 * TS, e.fruitIdx); }
        continue;
      }
      const d = ENEMY[e.type], spd = d.speed * (e.angry ? 1.6 : 1) * (1 + round * 0.02);
      if (d.kind === "flyer") {
        if (!e.vx) { e.vx = spd * (Math.random() < 0.5 ? 1 : -1); e.vy = spd * 0.7 * (Math.random() < 0.5 ? 1 : -1); }
        e.vx = Math.sign(e.vx) * spd; e.vy = Math.sign(e.vy) * spd * 0.7;
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (e.x < FX + 2 * TS + 16 || e.x > FX + FW - 2 * TS - 16) { e.vx = -e.vx; e.x = U.clamp(e.x, FX + 2 * TS + 16, FX + FW - 2 * TS - 16); }
        if (e.y < FY + TS + 34 || e.y > FY + FH - TS) { e.vy = -e.vy; e.y = U.clamp(e.y, FY + TS + 34, FY + FH - TS); }
        e.face = Math.sign(e.vx);
      } else if (d.kind === "chaser") {
        const tx = P.x - e.x, ty = P.y - 20 - e.y, l = Math.hypot(tx, ty) || 1;
        e.x += (tx / l) * spd * dt + Math.sin(e.t * 2) * 0.5; e.y += (ty / l) * spd * dt * 0.8 + Math.cos(e.t * 3) * 0.6;
        e.face = Math.sign(tx) || 1;
      } else {
        // walkers, hoppers, shooters
        if (e.onGround) {
          if (d.kind === "hopper") {
            e.vx = 0; e.jumpT -= dt;
            if (e.jumpT <= 0) { e.jumpT = U.rand(0.4, 1.0) / (e.angry ? 1.6 : 1); e.face = P.x > e.x ? 1 : -1; if (Math.random() < 0.3) e.face = -e.face; e.vx = e.face * spd * 1.6; e.vy = -JUMP * U.rand(0.7, 1.0); }
          } else {
            e.think -= dt;
            if (e.think <= 0) { e.think = U.rand(0.5, 1.5); if (Math.random() < 0.35) e.face = P.x > e.x ? 1 : -1; }
            if (!groundAhead(e, e.face) && Math.random() < 0.6) e.face = -e.face;
            e.vx = e.face * spd;
            e.jumpT -= dt;
            if (e.jumpT <= 0) { e.jumpT = U.rand(1, 3); if ((P.y < e.y - 50 && Math.abs(P.x - e.x) < 240) || Math.random() < 0.15) e.vy = -JUMP; }
            if (d.kind === "shooter") { e.shotT -= dt; if (e.shotT <= 0 && Math.abs(P.y - e.y) < 30 && Math.sign(P.x - e.x) === e.face && P.dead <= 0) { e.shotT = U.rand(2, 3.5) / (e.angry ? 1.5 : 1); shots.push({ x: e.x + e.face * 18, y: e.y - 18, vx: e.face * 260, vy: 0, kind: d.shot, t: 0, w: 16, h: 16 }); A.sfx("shoot"); } }
          }
        }
        physics(e, dt);
        if (e.hitWall) e.face = -e.face;
      }
      // touching the player hurts
      if (P.dead <= 0 && P.inv <= 0 && overlap(P, e)) hurtPlayer();
    }
    enemies = enemies.filter((e) => !e.gone);
    if (skel) { const tx = P.x - skel.x, ty = P.y - 20 - skel.y, l = Math.hypot(tx, ty) || 1; skel.x += (tx / l) * 95 * dt; skel.y += (ty / l) * 95 * dt; skel.face = Math.sign(tx) || 1; if (P.dead <= 0 && P.inv <= 0 && Math.hypot(tx, ty) < 32) hurtPlayer(); }
    // enemy shots
    for (const s of shots) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.kind === "bottle") s.vy += 600 * dt; if (P.dead <= 0 && P.inv <= 0 && Math.hypot(P.x - s.x, P.y - 20 - s.y) < 22) { hurtPlayer(); s.gone = true; } if (s.x < FX || s.x > FX + FW || s.y > FY + FH + 20) s.gone = true; }
    shots = shots.filter((s) => !s.gone);
    // boss
    if (boss) updateBoss(dt);
    // items
    for (const it of items) {
      it.t += dt;
      if (!it.landed) { it.vy = Math.min(MAXFALL, it.vy + GRAV * dt); const oldY = it.y; it.y += it.vy * dt; const r = Math.floor((it.y - FY) / TS); for (let rr = Math.floor((oldY - FY) / TS); rr <= r; rr++) { const c = Math.floor((it.x - FX) / TS); if (standable(c, rr) && oldY <= tileTop(rr) + 1 && it.y >= tileTop(rr)) { it.y = tileTop(rr); it.landed = true; break; } } if (it.y > FY + FH) it.y = FY + 40; }
      if (P.dead <= 0 && Math.abs(P.x - it.x) < 28 && Math.abs(P.y - it.y) < 34) collect(it);
      if (it.t > 12) it.gone = true;
    }
    items = items.filter((it) => !it.gone);
    // EXTEND letters float up from the bottom now and then
    letterT -= dt;
    if (letterT <= 0 && clearT < 0) {
      letterT = U.rand(14, 22);
      const need = [..."EXTEND"].filter((ch, i) => !G.run.extend.includes(i));
      const letterIdx = need.length && Math.random() < 0.65 ? "EXTEND".indexOf(need[0]) : U.randi(0, 5);
      bubbles.push({ x: FX + U.rand(200, FW - 200), y: FY + FH - 30, vx: 0, vy: -70, r: 22, t: 0, life: 12, ph: Math.random() * 6, shoot: false, own: 0, letter: "EXTEND"[letterIdx], li: letterIdx });
    }
    // particles and popups
    for (const p of parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; }
    parts = parts.filter((p) => p.t < p.life);
    for (const p of pops) p.t += dt;
    pops = pops.filter((p) => p.t < (p.big ? 2 : 1));
    // round cleared?
    if (clearT < 0 && !enemies.length && (!boss || boss.gone)) { clearT = 3.5; skel = null; if (!boss) { A.say(U.pick(["Round clear!", "Yay! All popped!", "Great job!", "Super!"]), { pitch: 1.5, force: true }); A.playSong(WORLDS[worldIdx].song); } }
    if (clearT >= 0) { clearT -= dt; if (clearT <= 0) nextRound(); }
  }
  function popBubble(b, chain) {
    if (b.popT) return;
    b.popT = 0.01;
    A.sfx("pop");
    for (let i = 0; i < 6; i++) parts.push({ k: "drop", x: b.x, y: b.y, vx: U.rand(-150, 150), vy: U.rand(-150, 100), g: 400, t: 0, life: 0.5, r: 3 });
    const st = States.play;
    st.chains = st.chains || {};
    if (b.e) {
      const e = b.e; b.e = null;
      const k = (st.chains[chain] = (st.chains[chain] || 0) + 1);
      e.caught = false; e.dead = true; e.t = 0; e.spin = 0; e.vx = U.rand(-260, 260); e.vy = -U.rand(450, 650); e.x = b.x; e.y = b.y + 18;
      e.fruitIdx = Math.min(FRUITS.length - 1, k - 1 + Math.floor(round / 5));
      const pts = Math.min(64000, 1000 * Math.pow(2, k - 1));
      addScore(pts, b.x, b.y - 30, k > 1 ? "#ffe040" : "#ffffff");
      A.sfx("kill");
      if (k === 2) A.say(U.pick(["Double pop!", "Combo!"]), { pitch: 1.5 });
      else if (k === 3) A.say("Triple pop!", { pitch: 1.6, force: true });
      else if (k >= 4) A.say(U.pick(["Amazing!", "Bubble master!", "Wow wow wow!"]), { pitch: 1.6, force: true });
      else if (Math.random() < 0.15) A.say(U.pick(["Pop!", "Bye bye!", "Gotcha!", "Hee hee!"]), { pitch: 1.6, gap: 2500 });
      for (let i = 0; i < 6; i++) parts.push({ k: "star", x: b.x, y: b.y, vx: U.rand(-200, 200), vy: U.rand(-250, 50), g: 300, t: 0, life: 0.8, r: 6 });
    }
    if (b.letter) {
      if (!G.run.extend.includes(b.li)) G.run.extend.push(b.li);
      A.sfx("letter"); pops.push({ x: b.x, y: b.y - 30, text: b.letter, col: "#ffe040", t: 0, size: 40 });
      if (G.run.extend.length >= 6) { G.run.extend = []; G.run.lives++; A.sfx("extend"); A.say("Extend! Extra life!", { pitch: 1.4, force: true }); pops.push({ x: FX + FW / 2, y: FY + FH / 2, text: "EXTEND!", col: "#ff6ab0", t: 0, size: 80, big: true }); }
    }
    if (b.zap) { shots.push({ x: b.x, y: b.y, vx: P.face * 760, vy: 0, kind: "zap", t: 0, friendly: true, w: 40, h: 20 }); A.sfx("zap"); }
    // neighbours pop too, one after another
    for (const o of bubbles) if (o !== b && !o.popT && o.chainAt === undefined && Math.hypot(o.x - b.x, o.y - b.y) < b.r + o.r + 10) { o.chainAt = 0.07; o.chain = chain; }
  }
  function dropItem(x, y, fi = 0) {
    if (Math.random() < 0.09) { items.push({ x, y: y - 10, vy: -200, kind: U.pick(["candy_pink", "candy_blue", "shoe"]), pts: 100, t: 0 }); return; }
    const [kind, pts] = FRUITS[U.clamp(fi, 0, FRUITS.length - 1)];
    items.push({ x, y: y - 10, vy: -200, kind, pts, t: 0 });
  }
  function collect(it) {
    it.gone = true;
    if (it.kind.startsWith("candy") || it.kind === "shoe") {
      P.pow[it.kind === "candy_pink" ? "pink" : it.kind === "candy_blue" ? "blue" : "shoe"] = true;
      A.sfx("power"); A.say(it.kind === "shoe" ? "Speedy shoes!" : it.kind === "candy_pink" ? "Rapid bubbles!" : "Long range bubbles!", { pitch: 1.5 });
      pops.push({ x: it.x, y: it.y - 40, text: "POWER UP!", col: "#80ff90", t: 0 });
      return;
    }
    A.sfx("fruit");
    addScore(it.pts, it.x, it.y - 30, "#80ff90");
    if (Math.random() < 0.12) A.say(U.pick(["Yummy!", "Nom nom!", "Delicious!", "Sweet!"]), { pitch: 1.6, gap: 3000 });
  }
  function hurtPlayer() {
    if (G.cheat) { P.inv = 0.5; return; }
    const run = G.run;
    P.dead = 1.8; P.vy = -300; P.spin = 0; run.lives--;
    P.pow = {};
    A.sfx("hurt");
    A.say(run.lives > 0 ? U.pick(["Ouch!", "Oopsie!", "Owie!", "That hurt!"]) : "Oh no!", { pitch: 1.5, force: true });
    for (let i = 0; i < 10; i++) parts.push({ k: "star", x: P.x, y: P.y - 20, vx: U.rand(-200, 200), vy: U.rand(-300, 0), g: 400, t: 0, life: 0.9, r: 6 });
    // enemies near the start are pushed away so a respawn is fair
    for (const e of enemies) if (!e.caught && !e.dead && Math.abs(e.x - (FX + 3.5 * TS)) < 140 && Math.abs(e.y - (FY + 20 * TS)) < 80) { e.x += 200; }
  }
  function nextRound() {
    const run = G.run;
    if (round + 1 >= XA.MAPS.length) { run.won = true; UI.go("ending"); return; }
    startRound(round + 1);
  }
  function gameOver() { States.play.over = true; A.jingle("gameover"); A.say("Game over. Bubble trouble!", { pitch: 1.3, force: true }); UI.go("gameover"); }

  /* ---------- the boss ---------- */
  function hitBoss(n) {
    if (!boss || boss.dead) return;
    boss.hp -= n; boss.hitT = 0.15; A.sfx("bossHit");
    addScore(100 * n);
    if (boss.hp <= 0) {
      boss.dead = 0.01; A.sfx("boom"); A.say("You did it! The boss is bubbled!", { pitch: 1.4, force: true });
      for (let i = 0; i < 40; i++) parts.push({ k: "star", x: boss.x, y: boss.y, vx: U.rand(-400, 400), vy: U.rand(-400, 200), g: 300, t: 0, life: 1.5, r: 8 });
      addScore(100000, boss.x, boss.y - 90, "#ffe040");
    }
  }
  function updateBoss(dt) {
    const b = boss;
    if (b.dead) { b.dead += dt; b.y -= 40 * dt; if (b.dead > 3) { b.gone = true; } return; }
    b.ph += dt; b.hitT = Math.max(0, b.hitT - dt);
    const speedUp = 1 + (1 - b.hp / b.maxHp) * 0.8;
    b.x += b.vx * dt * speedUp; b.y += b.vy * dt * speedUp;
    if (b.x < FX + 2 * TS + b.r || b.x > FX + FW - 2 * TS - b.r) { b.vx = -b.vx; b.x = U.clamp(b.x, FX + 2 * TS + b.r, FX + FW - 2 * TS - b.r); }
    if (b.y < FY + TS + b.r || b.y > FY + FH - TS - b.r) { b.vy = -b.vy; b.y = U.clamp(b.y, FY + TS + b.r, FY + FH - TS - b.r); }
    b.throwT -= dt;
    if (b.throwT <= 0) { b.throwT = U.rand(1.6, 2.6) / speedUp; for (let i = -1; i <= 1; i++) { const dx = P.x - b.x, sp = U.rand(200, 300); shots.push({ x: b.x, y: b.y, vx: Math.sign(dx) * sp + i * 90, vy: -320 + i * 40, kind: "bottle", t: 0, w: 18, h: 18 }); } A.sfx("shoot"); }
    // lightning bubbles rise from the floor
    if (Math.random() < dt * 0.6) bubbles.push({ x: FX + U.rand(120, FW - 120), y: FY + FH - 30, vx: 0, vy: -70, r: 22, t: 0, life: 10, ph: Math.random() * 6, shoot: false, own: 0, zap: true });
    if (P.dead <= 0 && P.inv <= 0 && Math.hypot(P.x - b.x, P.y - 20 - b.y) < b.r + 14) hurtPlayer();
    for (const s of shots) if (s.friendly && Math.hypot(s.x - b.x, s.y - b.y) < b.r + 20 && !s.gone) { s.gone = true; hitBoss(6); }
  }
  function drawBoss(ctx, t) {
    const b = boss;
    ctx.save(); ctx.translate(b.x, b.y);
    if (b.dead) { ctx.globalAlpha = Math.max(0, 1 - b.dead / 3); }
    if (b.hitT > 0) ctx.filter = "brightness(2.5)";
    ctx.lineJoin = "round"; ctx.lineWidth = 5; ctx.strokeStyle = OUT;
    const sq = 1 + Math.sin(t * 5) * 0.04;
    ctx.scale(Math.sign(P.x - b.x) || 1, 1);
    ctx.fillStyle = "#8a4ad0"; ctx.beginPath(); ctx.ellipse(0, 0, b.r * sq, b.r / sq, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#c8a0ff"; ctx.beginPath(); ctx.ellipse(10, 18, b.r * 0.6, b.r * 0.5, 0, 0, TAU); ctx.fill();
    // crown
    ctx.fillStyle = "#ffd030"; ctx.beginPath(); ctx.moveTo(-40, -50); ctx.lineTo(-40, -90); ctx.lineTo(-20, -68); ctx.lineTo(0, -98); ctx.lineTo(20, -68); ctx.lineTo(40, -90); ctx.lineTo(40, -50); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ff3a6a"; ctx.beginPath(); ctx.arc(0, -64, 6, 0, TAU); ctx.fill();
    // face
    for (const dx of [-8, 30]) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(dx, -14, 14, 16, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = "#c00020"; ctx.beginPath(); ctx.arc(dx + 4, -10, 6, 0, TAU); ctx.fill(); }
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-26, -40); ctx.lineTo(4, -28); ctx.moveTo(48, -40); ctx.lineTo(18, -28); ctx.stroke();
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.ellipse(12, 30, 26, 10 + Math.sin(t * 6) * 4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#fff"; for (let i = 0; i < 5; i++) ctx.fillRect(-8 + i * 9, 22, 6, 7);
    ctx.restore();
    if (b.dead) { ctx.save(); ctx.globalAlpha = 0.6; bubbleDraw(ctx, { x: b.x, y: b.y, r: b.r * 1.3, ph: 0, life: 9 }, t); ctx.restore(); }
    // health bar
    if (!b.dead) { const w = 400; ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(W / 2 - w / 2, FY + 6, w, 14); ctx.fillStyle = "#ff4a6a"; ctx.fillRect(W / 2 - w / 2, FY + 6, (w * b.hp) / b.maxHp, 14); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeRect(W / 2 - w / 2, FY + 6, w, 14); }
  }

  /* ---------- drawing ---------- */
  function drawGame(ctx, t) {
    drawBackground(ctx, worldIdx, t);
    ctx.save(); ctx.beginPath(); ctx.rect(FX, FY, FW, FH); ctx.clip();
    ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(FX, FY, FW, FH);
    ctx.drawImage(mapCanvas, FX, FY);
    for (const it of items) { if (it.t > 9 && Math.floor(t * 8) % 2) continue; fruitDraw(ctx, it.kind, it.x, it.y, t); }
    for (const e of enemies) if (!e.caught) enemyDraw(ctx, e, t, e.dead ? { spin: e.spin, dead: true } : {});
    if (skel) enemyDraw(ctx, skel, t);
    if (boss) drawBoss(ctx, t);
    if (P.dead > 0 || !(P.inv > 0 && Math.floor(t * 12) % 2)) puff(ctx, P.x, P.y, P.face, { t, walk: P.walk, moving: P.vx !== 0 && P.onGround, jump: !P.onGround, blow: P.blowT > 0, blink: P.blink, spin: P.dead > 0 ? P.spin : 0, dizzy: P.dead > 0, body: G.cheat ? "#e0c040" : undefined });
    for (const b of bubbles) bubbleDraw(ctx, b, t);
    for (const s of shots) {
      if (s.kind === "snow") { ctx.fillStyle = "#fff"; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x, s.y, 8, 0, TAU); ctx.fill(); ctx.stroke(); }
      else if (s.kind === "fire") { ctx.fillStyle = "#ffb020"; ctx.beginPath(); ctx.arc(s.x, s.y, 9, 0, TAU); ctx.fill(); ctx.fillStyle = "#ff4a1a"; ctx.beginPath(); ctx.moveTo(s.x - Math.sign(s.vx) * 4, s.y - 8); ctx.lineTo(s.x - Math.sign(s.vx) * 22, s.y + Math.sin(t * 30) * 4); ctx.lineTo(s.x - Math.sign(s.vx) * 4, s.y + 8); ctx.fill(); }
      else if (s.kind === "bottle") { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.t * 10); ctx.fillStyle = "#60c0a0"; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(-6, -10, 12, 18, 4); ctx.fill(); ctx.stroke(); ctx.fillRect(-3, -15, 6, 6); ctx.restore(); }
      else if (s.kind === "zap") { ctx.strokeStyle = "#fff8a0"; ctx.lineWidth = 6; ctx.beginPath(); let x = s.x - Math.sign(s.vx) * 60; ctx.moveTo(x, s.y); for (let i = 0; i < 6; i++) { x += Math.sign(s.vx) * 12; ctx.lineTo(x, s.y + (Math.random() - 0.5) * 24); } ctx.stroke(); ctx.strokeStyle = "#ffe040"; ctx.lineWidth = 2; ctx.stroke(); }
    }
    for (const p of parts) {
      const k = p.t / p.life;
      if (p.k === "drop") { ctx.fillStyle = `rgba(200,255,255,${1 - k})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); }
      else { ctx.fillStyle = `rgba(255,240,120,${1 - k})`; star(ctx, p.x, p.y, p.r); }
    }
    ctx.restore();
    // frame around the playfield
    ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.strokeRect(FX - 3, FY - 3, FW + 6, FH + 6);
    for (const p of pops) {
      const k = p.t / (p.big ? 2 : 1);
      ctx.save(); ctx.translate(p.x, p.y - k * 40); const s = k < 0.1 ? 0.5 + k * 5 : 1; ctx.scale(s, s); ctx.globalAlpha = k > 0.75 ? (1 - k) * 4 : 1;
      txt(ctx, p.text, 0, 0, p.size || 24, p.col);
      ctx.restore();
    }
    drawSidebars(ctx, t);
  }
  function star(ctx, x, y, r) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
  function drawSidebars(ctx, t) {
    const run = G.run;
    txt(ctx, "SCORE", 64, 60, 24, "#ff8ac8");
    txt(ctx, U.fmt(run.score), 64, 92, 22, "#ffffff");
    txt(ctx, "HI", 64, 140, 22, "#ffe060");
    txt(ctx, U.fmt(Math.max(run.score, XA.HS.list()[0].score)), 64, 168, 18, "#ffffff");
    txt(ctx, "LIVES", 64, 230, 22, "#80ff90");
    for (let i = 0; i < Math.min(5, run.lives); i++) puff(ctx, 40 + (i % 2) * 48, 290 + Math.floor(i / 2) * 60, 1, { t, s: 0.75 });
    if (P.pow.pink) fruitDraw(ctx, "candy_pink", 40, 520, t);
    if (P.pow.blue) fruitDraw(ctx, "candy_blue", 88, 520, t);
    if (P.pow.shoe) fruitDraw(ctx, "shoe", 64, 570, t);
    const rx = W - 64;
    txt(ctx, "ROUND", rx, 60, 24, "#6ad0ff");
    txt(ctx, `${round + 1}`, rx, 96, 40, "#ffffff");
    bodyText(ctx, WORLDS[worldIdx].name, rx, 132, 15, "#ffe0f8");
    "EXTEND".split("").forEach((ch, i) => {
      const got = run.extend.includes(i), y = 200 + i * 60;
      bubbleDraw(ctx, { x: rx, y, r: 24, ph: i, life: 9, popT: 0 }, t);
      txt(ctx, ch, rx, y + 2, 26, got ? ["#ff6ab0", "#ffe060", "#6ad0ff", "#80ff90", "#ff9a40", "#c080ff"][i] : "rgba(255,255,255,0.25)", "center", undefined, got);
    });
    if (hurry && Math.floor(t * 3) % 2) txt(ctx, "HURRY!", rx, 600, 24, "#ff4a6a");
    if (G.cheat) { ctx.fillStyle = "#ffd040"; ctx.beginPath(); ctx.arc(W - 12, H - 12, 4, 0, TAU); ctx.fill(); }
  }

  /* ---------- states ---------- */
  States.roundintro = {
    t: 0,
    enter() {
      this.t = 0; XA.Main.setCursor(false);
      const wd = WORLDS[worldIdx];
      A.playSong(wd.song);
      setTimeout(() => A.say(round === 15 ? "Final round! Here comes the boss!" : round % 3 === 0 ? `Round ${round + 1}. Welcome to the ${wd.name}!` : U.pick([`Round ${round + 1}. Ready? Go!`, `Round ${round + 1}. Bubble time!`, `Round ${round + 1}. Let's pop!`]), { pitch: 1.4, force: true }), 250);
    },
    input() { if (this.t > 0.6 && (I.hit("confirm") || I.hit("fire") || I.mouse.clicked)) this.t = 99; },
    update(dt) { this.t += dt; if (this.t > 2.4) UI.go("play"); },
    draw(ctx) {
      drawGame(ctx, this.t);
      const k = Math.min(1, this.t * 3);
      ctx.fillStyle = `rgba(20,0,40,${0.45 * k})`; ctx.fillRect(FX, FY, FW, FH);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(k, k);
      txt(ctx, round === 15 ? "FINAL ROUND" : `ROUND ${round + 1}`, 0, -40, 84, "#ffe060");
      txt(ctx, WORLDS[worldIdx].name.toUpperCase(), 0, 30, 40, "#ffffff");
      if (this.t > 1.2) txt(ctx, "READY?", 0, 100, 44, "#ff8ac8");
      ctx.restore();
    },
  };
  States.play = {
    t: 0, paused: false, over: false, chains: {},
    pauseMenu: makeMenu([
      { label: "RESUME", action: () => { States.play.paused = false; XA.Main.setCursor(false); } },
      { label: "HOW TO PLAY", action: () => UI.go("controls", { back: "play" }) },
      { label: "OPTIONS", action: () => UI.go("options", { back: "play" }) },
      { label: "QUIT TO TITLE", action: () => { States.play.paused = false; UI.go("title"); } },
    ], 300),
    enter(arg) { if (arg && arg.resume) { this.paused = true; return; } this.paused = false; this.over = false; this.chains = {}; XA.Main.setCursor(false); },
    pause() { if (!this.paused && !this.over) { this.paused = true; this.pauseMenu.sel = 0; A.sfx("menuBack"); XA.Main.setCursor(true); } },
    input() {
      if (this.paused) { if (I.hit("pause") && this.t > 0) { this.paused = false; XA.Main.setCursor(false); return; } menuInput(this.pauseMenu); return; }
      if (I.hit("pause")) this.pause();
    },
    update(dt) { if (this.paused) return; this.t += dt; if (!this.over) update(dt); },
    draw(ctx) {
      drawGame(ctx, this.t);
      if (clearT >= 0 && clearT < 3.3) txt(ctx, boss ? "THE BOSS IS POPPED!" : "ROUND CLEAR!", W / 2, H / 2, 64, "#80ff90");
      if (this.paused) { ctx.fillStyle = "rgba(20,0,40,0.65)"; ctx.fillRect(0, 0, W, H); txt(ctx, "PAUSED", W / 2, 210, 84, "#ffe060"); menuDraw(ctx, this.pauseMenu, performance.now() / 1000); }
    },
  };
  States.gameover = {
    t: 0,
    enter() { this.t = 0; XA.Main.setCursor(true); },
    input() { if (this.t > 1.5 && (I.hit("confirm") || I.hit("fire") || I.mouse.clicked)) UI.finishRun(); },
    update(dt) { this.t += dt; if (this.t > 8) UI.finishRun(); },
    draw(ctx) {
      drawBackground(ctx, worldIdx, this.t);
      ctx.fillStyle = "rgba(20,0,40,0.5)"; ctx.fillRect(0, 0, W, H);
      txt(ctx, "GAME OVER", W / 2, 220, 100, "#ff6ab0");
      txt(ctx, `SCORE ${U.fmt(G.run.score)}`, W / 2, 330, 48, "#ffffff");
      bodyText(ctx, `You reached round ${round + 1} – ${WORLDS[worldIdx].name}`, W / 2, 390, 26, "#ffe0f8");
      puff(ctx, W / 2, 560, 1, { t: this.t, dizzy: true, spin: Math.sin(this.t * 2) * 0.3, s: 2 });
    },
  };
  States.ending = {
    t: 0,
    enter() { this.t = 0; A.playSong("ending"); A.say("Hooray! You popped them all. Thank you for playing!", { pitch: 1.4, force: true }); XA.Main.setCursor(true); addScore(50000); },
    input() { if (this.t > 2 && (I.hit("confirm") || I.hit("fire") || I.mouse.clicked)) UI.finishRun(); },
    update(dt) { this.t += dt; if (this.t > 25) UI.finishRun(); },
    draw(ctx) {
      drawBackground(ctx, 0, this.t);
      attract(ctx, this.t);
      txt(ctx, "HOORAY!", W / 2, 130, 110, "#ffe060");
      for (let i = 0; i < 5; i++) puff(ctx, W / 2 - 240 + i * 120, 380 - Math.abs(Math.sin(this.t * 4 + i)) * 60, i % 2 ? -1 : 1, { t: this.t, s: 1.6, jump: true, blink: false });
      txt(ctx, `FINAL SCORE ${U.fmt(G.run.score)}`, W / 2, 500, 48, "#ffffff");
      bodyText(ctx, "King Grumble is bubbled and peace returns to the bubble lands. +50,000 bonus", W / 2, 556, 24, "#ffe0f8");
      if (this.t > 2) bodyText(ctx, "Click or press a button", W / 2, 650, 22, "#ffe0f8");
    },
  };
  XA.Game = { startRound, hitBoss, get P() { return P; }, get enemies() { return enemies; }, get bubbles() { return bubbles; }, get items() { return items; }, get boss() { return boss; }, popBubble, FX, FY, TS };
})(window.XA);
