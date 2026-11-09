/* ALIEN ARMADA: a retro alien-invasion shooter – five worlds with animated backdrops, three waves and a
   mothership each, pixel-art aliens generated from seeds, destructible bunkers, UFOs and power-ups. */
"use strict";

(function (XA) {
  const { U, Store, UI } = XA;
  const A = XA.Audio, I = XA.Input, States = XA.States, G = XA.G;
  const W = U.W, H = U.H, TAU = U.TAU;
  const { txt, bodyText, panel, makeMenu, menuInput, menuDraw } = UI;
  const PIX = 4, GROUND = 676, PY = 640;

  /* ---------- worlds ---------- */
  const WORLDS = [
    { name: "EARTH ORBIT", song: "orbit", seeds: [11, 27, 43], cols: ["#60ffd0", "#40c0ff", "#ff60c0"], shot: "zig", boss: 101, bossCol: "#40c0ff" },
    { name: "MOON BASE", song: "moon", seeds: [52, 66, 81], cols: ["#ffe060", "#ffa040", "#ff6040"], shot: "plunger", boss: 202, bossCol: "#ffb040" },
    { name: "NEON CITY", song: "neon", seeds: [93, 108, 124], cols: ["#ff40ff", "#40ffff", "#ffff40"], shot: "zig", boss: 303, bossCol: "#ff40c0" },
    { name: "ASTEROID BELT", song: "asteroids", seeds: [137, 151, 166], cols: ["#c0c0ff", "#80ff80", "#ff8080"], shot: "roll", boss: 404, bossCol: "#a0ff60" },
    { name: "ALIEN HIVE", song: "hive", seeds: [178, 193, 207], cols: ["#ff4060", "#c060ff", "#60ff60"], shot: "plunger", boss: 505, bossCol: "#ff4080" },
  ];
  const WAVES_PER_WORLD = 3;

  /* ---------- pixel sprites ---------- */
  const spriteCache = {};
  function bake(rows, pal, scale = PIX, outline = "#000000") {
    const h = rows.length, w = rows[0].length, c = document.createElement("canvas");
    c.width = (w + 2) * scale; c.height = (h + 2) * scale;
    const g = c.getContext("2d");
    const filled = (x, y) => y >= 0 && y < h && x >= 0 && x < w && rows[y][x] !== ".";
    // a 1-pixel dark outline
    if (outline) { g.fillStyle = outline; for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) if (!filled(x, y) && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) g.fillRect((x + 1) * scale, (y + 1) * scale, scale, scale); }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === ".") continue;
      let col = pal[ch] || pal.a;
      if (ch === "a") { if (!filled(x, y - 1)) col = pal.b || col; else if (!filled(x, y + 1)) col = pal.d || col; }
      g.fillStyle = col; g.fillRect((x + 1) * scale, (y + 1) * scale, scale, scale);
    }
    return c;
  }
  function shadeHex(hex, k) { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`; }
  // symmetric aliens grown from a seed; frame 2 moves the legs
  function genAlien(seed, w = 11, h = 8) {
    const r = U.rng(seed * 7919 + 13), half = Math.ceil(w / 2), grid = [];
    const prob = [0.3, 0.5, 0.75, 0.85, 0.8, 0.6, 0.45, 0.4];
    for (let y = 0; y < h; y++) { grid.push([]); for (let x = 0; x < half; x++) grid[y].push(r() < prob[y % prob.length] * (x === 0 ? 0.55 : 1)); }
    for (let y = 1; y < h - 2; y++) grid[y][half - 1] = true;
    for (let y = 2; y < 5; y++) grid[y][half - 2] = true;
    // remove lonely pixels
    for (let k = 0; k < 2; k++) for (let y = 0; y < h; y++) for (let x = 0; x < half; x++) { if (!grid[y][x]) continue; const n = [[0, 1], [0, -1], [1, 0], [-1, 0]].filter(([dx, dy]) => { const xx = x + dx, yy = y + dy; return yy >= 0 && yy < h && xx >= 0 && (xx < half ? grid[yy][xx] : grid[yy][2 * half - 2 - xx]); }).length; if (!n) grid[y][x] = false; }
    const eyeY = 2 + Math.floor(r() * 2), eyeX = half - 3;
    const toRows = (gr) => gr.map((row, y) => { const full = row.concat(row.slice(0, w % 2 ? half - 1 : half).reverse()); return full.map((v, x) => (y === eyeY && (x === eyeX || x === w - 1 - eyeX) ? "c" : v ? "a" : ".")).join(""); });
    const f1 = toRows(grid);
    const g2 = grid.map((row) => row.slice());
    for (let y = h - 2; y < h; y++) { const row = g2[y]; g2[y] = row.map((_, x) => row[(x + 1) % half] || (x === 0 && row[half - 1])); }
    g2[h - 1] = g2[h - 1].map((v, x) => !grid[h - 1][x] && (x === 1 || x === half - 3));
    const f2 = toRows(g2);
    return [f1, f2];
  }
  function alienSprites(seed, col) {
    const key = seed + col;
    if (spriteCache[key]) return spriteCache[key];
    const pal = { a: col, b: shadeHex(col, 1.35), d: shadeHex(col, 0.6), c: "#ffffff" };
    const [f1, f2] = genAlien(seed);
    return (spriteCache[key] = [bake(f1, pal), bake(f2, pal)]);
  }
  function genBoss(seed, col) {
    const key = "boss" + seed;
    if (spriteCache[key]) return spriteCache[key];
    const r = U.rng(seed), w = 33, h = 15, half = 17, grid = [];
    for (let y = 0; y < h; y++) { grid.push([]); for (let x = 0; x < half; x++) { const cy = Math.abs(y - 7) / 7, cx = (half - 1 - x) / half; const p = (1 - cy * cy) * 0.95 - cx * cx * 0.6 + (r() - 0.5) * 0.5; grid[y].push(p > 0.25); } }
    const rows = grid.map((row, y) => { const full = row.concat(row.slice(0, half - 1).reverse()); return full.map((v, x) => { if (!v) return "."; if (y === 6 && (x === 10 || x === 22)) return "c"; if (y >= 5 && y <= 8 && Math.abs(x - 16) <= 2) return "e"; if (y === 11 && x % 4 === 0) return "l"; return "a"; }).join(""); });
    const pal = { a: col, b: shadeHex(col, 1.4), d: shadeHex(col, 0.55), c: "#ffffff", e: "#ff3040", l: "#ffff80" };
    return (spriteCache[key] = bake(rows, pal, 6));
  }
  const PLAYER_ROWS = [
    "......c......",
    ".....aaa.....",
    ".....aaa.....",
    "..aaaaaaaaa..",
    ".aaaaaaaaaaa.",
    "aaaaaebeaaaaa",
    "aaaaaaaaaaaaa",
    "ddddddddddddd",
  ];
  const UFO_ROWS = [
    ".....bbbbbb.....",
    "...aaaaaaaaaa...",
    "..aaaaaaaaaaaa..",
    ".aacaacaacaacaa.",
    "aaaaaaaaaaaaaaaa",
    "..aaa..aa..aaa..",
    "...a........a...",
  ];
  let playerSpr, ufoSpr, splatSpr;
  function initSprites() {
    playerSpr = bake(PLAYER_ROWS, { a: "#40ff80", b: "#a0ffc0", d: "#20a050", c: "#ffffff", e: "#ffff60" });
    ufoSpr = bake(UFO_ROWS, { a: "#ff3060", b: "#ffd0e0", d: "#a01030", c: "#ffff80" });
    splatSpr = bake(["..a...a..a..", "a..a.a..a...", "...aaaaa..a.", ".aaaaaaaaa..", "a..aaaaa..a.", ".a.a.a.a.a..", "a...a...a..a"], { a: "#ffffff", b: "#ffffff", d: "#ffd060" }, PIX, null);
  }

  /* ---------- animated backgrounds ---------- */
  const stars = Array.from({ length: 220 }, (_, i) => ({ x: U.hash(i) * W, y: U.hash(i, 2) * H, z: 0.2 + U.hash(i, 3) * 0.8, c: U.hash(i, 4) }));
  function starfield(ctx, t, speed = 20, tint) {
    for (const s of stars) { const y = (s.y + t * speed * s.z) % H; ctx.fillStyle = tint && s.c < 0.3 ? tint : s.c < 0.15 ? "#ffd0a0" : s.c < 0.3 ? "#a0c0ff" : "#ffffff"; ctx.globalAlpha = 0.4 + s.z * 0.6 * (0.7 + 0.3 * Math.sin(t * 3 + s.x)); const sz = s.z > 0.8 ? 3 : 2; ctx.fillRect(Math.floor(s.x), Math.floor(y), sz, sz); }
    ctx.globalAlpha = 1;
  }
  function planet(ctx, x, y, r, t, colors) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    ctx.fillStyle = colors[0]; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = colors[1];
    for (let i = 0; i < 14; i++) { const bx = x - r + (((U.hash(i) * 3 * r + t * 14) % (3 * r)) - r * 0.5), by = y - r + U.hash(i, 2) * 2 * r, s = r * (0.15 + U.hash(i, 3) * 0.3); ctx.beginPath(); ctx.ellipse(bx, by, s * 1.6, s, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = "rgba(255,255,255,0.55)"; for (let i = 0; i < 10; i++) { const bx = x - r + (((U.hash(i, 7) * 3 * r + t * 22) % (3 * r)) - r * 0.5), by = y - r + U.hash(i, 8) * 2 * r; ctx.beginPath(); ctx.ellipse(bx, by, r * 0.3, r * 0.05, 0, 0, TAU); ctx.fill(); }
    const sh = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.2, x, y, r * 1.1); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,20,0.85)");
    ctx.fillStyle = sh; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
    const gl = ctx.createRadialGradient(x, y, r * 0.95, x, y, r * 1.15); gl.addColorStop(0, colors[2]); gl.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, r * 1.15, 0, TAU); ctx.fill();
  }
  function drawBackground(ctx, wi, t) {
    switch (wi) {
      case 0: {
        ctx.fillStyle = "#02040e"; ctx.fillRect(0, 0, W, H);
        starfield(ctx, t, 18);
        planet(ctx, W - 220, H + 160, 420, t, ["#1a4ac0", "#2a9a4a", "rgba(100,180,255,0.6)"]);
        // a satellite drifting past
        const sx = ((t * 30) % (W + 300)) - 150, sy = 140 + Math.sin(t * 0.3) * 30;
        ctx.fillStyle = "#a0a0b0"; ctx.fillRect(sx - 8, sy - 6, 16, 12); ctx.fillStyle = "#3060c0"; ctx.fillRect(sx - 40, sy - 4, 28, 8); ctx.fillRect(sx + 12, sy - 4, 28, 8);
        ctx.fillStyle = Math.sin(t * 6) > 0 ? "#ff3030" : "#400000"; ctx.fillRect(sx - 2, sy - 10, 4, 4);
        break;
      }
      case 1: {
        ctx.fillStyle = "#030308"; ctx.fillRect(0, 0, W, H);
        starfield(ctx, t, 6);
        planet(ctx, 220, 150, 70, t, ["#1a4ac0", "#2a9a4a", "rgba(100,180,255,0.6)"]);
        // lunar surface with craters scrolling
        ctx.fillStyle = "#5a5a64"; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 600 + Math.sin((x + t * 20) * 0.01) * 14 + Math.sin((x + t * 20) * 0.037) * 6); ctx.lineTo(W, H); ctx.fill();
        ctx.fillStyle = "#3a3a44"; for (let i = 0; i < 9; i++) { const x = ((i * 190 - t * 20) % (W + 200) + W + 200) % (W + 200) - 100; ctx.beginPath(); ctx.ellipse(x, 650 + (i % 3) * 18, 40 + (i % 4) * 14, 9 + (i % 3) * 3, 0, 0, TAU); ctx.fill(); }
        for (let i = 0; i < 3; i++) { const x = ((i * 460 + 200 - t * 20) % (W + 400) + W + 400) % (W + 400) - 200; ctx.fillStyle = "#c0c8d8"; ctx.beginPath(); ctx.arc(x, 605, 34, Math.PI, 0); ctx.fill(); ctx.fillStyle = "#808898"; ctx.fillRect(x - 50, 603, 100, 6); for (let k = 0; k < 4; k++) { ctx.fillStyle = Math.sin(t * 3 + k + i) > 0 ? "#ffe060" : "#605020"; ctx.fillRect(x - 24 + k * 14, 588, 6, 6); } }
        break;
      }
      case 2: {
        const sky = ctx.createLinearGradient(0, 0, 0, 430); sky.addColorStop(0, "#14002a"); sky.addColorStop(0.6, "#5a0a6a"); sky.addColorStop(1, "#ff3a8a");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 430);
        starfield(ctx, t, 4);
        // striped synth sun
        ctx.save(); ctx.beginPath(); ctx.arc(W / 2, 380, 170, 0, TAU); ctx.clip();
        const sg = ctx.createLinearGradient(0, 210, 0, 550); sg.addColorStop(0, "#ffe040"); sg.addColorStop(1, "#ff2a8a"); ctx.fillStyle = sg; ctx.fillRect(W / 2 - 170, 210, 340, 340);
        ctx.fillStyle = "#5a0a6a"; for (let i = 0; i < 8; i++) { const y = 300 + i * 18 + ((t * 20) % 18); ctx.fillRect(W / 2 - 170, y, 340, 3 + i * 1.2); }
        ctx.restore();
        // skyline
        ctx.fillStyle = "#1a0428"; for (let i = 0; i < 22; i++) { const bw = 40 + (i * 37) % 50, bh = 60 + (i * 53) % 140, x = i * 62 - 20; ctx.fillRect(x, 430 - bh, bw, bh); ctx.fillStyle = "rgba(255,80,220,0.8)"; for (let k = 0; k < 6; k++) if (U.hash(i * 7 + k, Math.floor(t * 0.5)) > 0.6) ctx.fillRect(x + 6 + (k % 3) * 12, 430 - bh + 10 + Math.floor(k / 3) * 16, 6, 6); ctx.fillStyle = "#1a0428"; }
        // perspective grid
        ctx.fillStyle = "#0a0016"; ctx.fillRect(0, 430, W, H - 430);
        ctx.strokeStyle = "#ff40c0"; ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
        for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 30, 430); ctx.lineTo(W / 2 + i * 260, H); ctx.stroke(); }
        for (let k = 0; k < 12; k++) { const z = ((k + (t * 1.5) % 1) / 12), y = 430 + (H - 430) * z * z; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        ctx.globalAlpha = 1;
        break;
      }
      case 3: {
        ctx.fillStyle = "#040208"; ctx.fillRect(0, 0, W, H);
        const neb = ctx.createRadialGradient(W * 0.3, H * 0.4, 20, W * 0.3, H * 0.4, 600); neb.addColorStop(0, "rgba(120,40,160,0.45)"); neb.addColorStop(0.5, "rgba(40,80,160,0.2)"); neb.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H);
        starfield(ctx, t, 30);
        for (let i = 0; i < 14; i++) {
          const z = 0.3 + U.hash(i, 5) * 0.7, x = ((U.hash(i) * (W + 300) - t * 25 * z) % (W + 300) + W + 300) % (W + 300) - 150, y = U.hash(i, 2) * H, r = 14 + z * 40;
          ctx.save(); ctx.translate(x, y); ctx.rotate(t * (U.hash(i, 3) - 0.5));
          ctx.fillStyle = `rgb(${Math.floor(70 + z * 60)},${Math.floor(60 + z * 50)},${Math.floor(55 + z * 40)})`;
          ctx.beginPath(); for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU, rr = r * (0.75 + U.hash(i * 9 + k, 6) * 0.35); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill();
          ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.arc(r * 0.2, r * 0.1, r * 0.25, 0, TAU); ctx.fill();
          ctx.restore();
        }
        break;
      }
      case 4: {
        const bg = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 800); bg.addColorStop(0, "#5a0a3a"); bg.addColorStop(1, "#0a0008"); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        // wormhole spiral
        ctx.save(); ctx.translate(W / 2, H / 2 - 40);
        for (let k = 0; k < 6; k++) { ctx.strokeStyle = `rgba(255,${60 + k * 20},${180 - k * 20},${0.25 - k * 0.03})`; ctx.lineWidth = 6; ctx.beginPath(); for (let a = 0; a < TAU * 3; a += 0.1) { const r = 10 + a * 22 + k * 8; ctx.lineTo(Math.cos(a + t * (0.6 + k * 0.1)) * r, Math.sin(a + t * (0.6 + k * 0.1)) * r * 0.6); } ctx.stroke(); }
        ctx.restore();
        // pulsing veins
        for (let k = 0; k < 7; k++) { ctx.strokeStyle = `rgba(255,40,120,${0.25 + 0.2 * Math.sin(t * 3 + k)})`; ctx.lineWidth = 4 + Math.sin(t * 2 + k) * 2; ctx.beginPath(); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, (k / 7) * H + Math.sin(x * 0.01 + t + k) * 40); ctx.stroke(); }
        // spores
        for (let i = 0; i < 40; i++) { const x = (U.hash(i) * W + Math.sin(t + i) * 30) % W, y = H - ((U.hash(i, 2) * H + t * (20 + U.hash(i, 3) * 30)) % H); ctx.fillStyle = `rgba(160,255,120,${0.4 + 0.4 * Math.sin(t * 4 + i)})`; ctx.fillRect(x, y, 4, 4); }
        break;
      }
    }
    // retro scanlines
    ctx.fillStyle = "rgba(0,0,0,0.18)"; for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
  }

  /* ---------- theme ---------- */
  const FONT = "'Press Start 2P', 'Courier New', monospace";
  XA.Theme = {
    font: FONT, body: "Rajdhani, 'Segoe UI', Arial, sans-serif", outline: "#000000", round: 4,
    fonts: ["20px 'Press Start 2P'", "700 20px Rajdhani"],
    accent: "#40ff80", soft: "#a0ffc0", menuText: "#c0ffd8", menuSel: "#ffffff", menuSize: 22, keyCol: "#ffe060",
    panel: "rgba(0,20,10,0.85)", panelStroke: "#40ff80",
    sel: (t) => `rgba(20,150,70,${0.8 + 0.15 * Math.sin(t * 8)})`,
    songs: { title: "title" }, stageWord: "STAGE", hsTitle: "TOP GUNNERS",
    voiceTest: "Warning. Alien armada detected.", sayHighscore: "New high score registered.",
    hsDefault: [["ACE", 120000, "5-B"], ["NOVA", 90000, "5-2"], ["ZAP", 70000, "4-B"], ["BLIP", 52000, "4-1"], ["ORBIT", 38000, "3-2"], ["PIXEL", 27000, "3-1"], ["LASER", 18000, "2-B"], ["COMET", 11000, "2-1"], ["ROOK", 6000, "1-B"], ["CADET", 2500, "1-2"]],
    stageLabel: () => (G.run.won ? "ALL" : `${G.run.world + 1}-${G.run.wave >= WAVES_PER_WORLD ? "B" : G.run.wave + 1}`),
    menuHint: "Arrows + Enter · mouse · gamepad",
    controls: [
      ["KEYBOARD", [["← → / A D", "move"], ["Space / X / K", "fire"], ["Esc / P", "pause"], ["F / M", "fullscreen / mute"]]],
      ["MOUSE", [["move the mouse", "steer the cannon"], ["left button", "fire (hold)"], ["right button", "fire"]]],
      ["GAMEPAD", [["stick / D-pad", "move"], ["A / B / X / RT", "fire"], ["Start", "pause"]]],
    ],
    howto: "Destroy the alien armada before it reaches the ground. Hide behind the bunkers, shoot the mystery UFO for bonus points and power-ups: D = double shot, R = rapid fire, S = shield, L = laser, B = bomb. Each world ends with a mothership. Extra life every 20,000 points.",
    start() { newGame(); },
    back(ctx, t, kind) { drawBackground(ctx, kind === "menu" ? 2 : Math.floor(t / 12) % 5, t); if (kind === "menu") { ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(0, 0, W, H); } else attract(ctx, t); },
    logo(ctx, t, y) { logo(ctx, t, y); },
    init() { initSprites(); },
  };
  XA.SECRET = [80, 73, 88, 69, 76, 87, 65, 82];
  I.KEYS.fire = ["Space", "KeyX", "KeyK", "KeyC", "ControlLeft"];
  I.PAD.fire = [0, 1, 2, 5, 7];

  function logo(ctx, t, y) {
    ctx.save(); ctx.font = `64px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const [dx, col] of [[6, "#ff00c0"], [-6, "#00e0ff"]]) { ctx.globalAlpha = 0.6; ctx.fillStyle = col; ctx.fillText("ALIEN ARMADA", W / 2 + dx * Math.sin(t * 3), y); }
    ctx.globalAlpha = 1; ctx.fillStyle = "#40ff80"; ctx.fillText("ALIEN ARMADA", W / 2, y);
    ctx.fillStyle = "rgba(0,0,0,0.35)"; for (let k = 0; k < 64; k += 4) ctx.fillRect(W / 2 - 440, y - 32 + k, 880, 2);
    ctx.restore();
    txt(ctx, "DEFEND THE GALAXY!", W / 2, y + 66, 20, "#ffffff");
  }
  function attract(ctx, t) {
    const wi = Math.floor(t / 12) % 5, wd = WORLDS[wi];
    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < 11; i++) { const type = i % 3, sp = alienSprites(wd.seeds[type], wd.cols[type])[Math.floor(t * 2) % 2]; ctx.drawImage(sp, Math.round(170 + i * 86 + Math.sin(t * 0.7) * 60 - sp.width / 2), 310); }
    ctx.drawImage(ufoSpr, Math.round(((t * 160) % (W + 300)) - 150), 90);
  }

  /* ---------- game state ---------- */
  let P, aliens, form, pShots, aShots, bunkers, parts, pops, ufo, boss, caps, waveT, stepT, stepN;
  function newGame() {
    G.run = { score: 0, lives: 3, world: 0, wave: 0, cheated: G.cheat, won: false, nextLife: 20000, kills: 0 };
    P = { x: W / 2, cool: 0, dead: 0, inv: 0, pow: {}, shield: 0 };
    startWave();
  }
  function startWave() {
    const run = G.run, wd = WORLDS[run.world];
    aliens = []; pShots = []; aShots = []; parts = []; pops = []; caps = []; ufo = null; boss = null;
    waveT = 0; stepT = 0; stepN = 0;
    if (run.wave >= WAVES_PER_WORLD) {
      const spr = genBoss(wd.boss, wd.bossCol);
      boss = { x: W / 2, y: 170, vx: 140, hp: 45 + run.world * 15, maxHp: 45 + run.world * 15, spr, t: 0, fireT: 1.5, hitT: 0, dead: 0, pattern: 0 };
    } else {
      const startY = 140 + Math.min(4, run.wave + run.world) * 18;
      form = { x: 0, y: startY, dir: 1, drop: 0 };
      for (let r = 0; r < 5; r++) for (let c = 0; c < 11; c++) {
        const type = r === 0 ? 0 : r < 3 ? 1 : 2;
        aliens.push({ r, c, type, alive: true, pts: [30, 20, 10][type] * (1 + run.world * 0.5) });
      }
    }
    buildBunkers();
    P.x = W / 2; P.dead = 0; P.inv = 1.5;
    UI.go("waveintro");
  }
  function buildBunkers() {
    bunkers = [];
    const shape = [
      "......aaaaaaaaaa......",
      "....aaaaaaaaaaaaaa....",
      "..aaaaaaaaaaaaaaaaaa..",
      ".aaaaaaaaaaaaaaaaaaaa.",
      "aaaaaaaaaaaaaaaaaaaaaa",
      "aaaaaaaaaaaaaaaaaaaaaa",
      "aaaaaaaaaaaaaaaaaaaaaa",
      "aaaaaaaaaaaaaaaaaaaaaa",
      "aaaaaaaaaaaaaaaaaaaaaa",
      "aaaaaaaaaaaaaaaaaaaaaa",
      "aaaaaa..........aaaaaa",
      "aaaaa............aaaaa",
      "aaaa..............aaaa",
      "aaaa..............aaaa",
    ];
    for (let i = 0; i < 4; i++) {
      const cells = shape.map((r) => [...r].map((ch) => (ch === "a" ? 1 : 0)));
      bunkers.push({ x: 190 + i * 260, y: 540, cells, cw: PIX, dirty: true, canvas: null });
    }
  }
  const alienPos = (a) => [form.x + 170 + a.c * 86, form.y + a.r * 62];
  function addScore(n, x, y) {
    if (G.cheat) { G.run.cheated = true; return; }
    G.run.score += Math.round(n);
    if (x !== undefined) pops.push({ x, y, text: `${Math.round(n)}`, t: 0, col: "#ffffff" });
    if (G.run.score >= G.run.nextLife) { G.run.nextLife += 20000; G.run.lives++; A.sfx("extra"); A.say("Extra life.", { pitch: 0.6 }); pops.push({ x: P.x, y: PY - 50, text: "1UP", t: 0, col: "#40ff80" }); }
  }
  function burst(x, y, col, n, sp = 260, size = 4) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = U.rand(40, sp); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: U.rand(0.4, 1.0), col, s: size }); } }

  /* ---------- update ---------- */
  function update(dt) {
    const run = G.run, wd = WORLDS[run.world];
    waveT += dt;
    // player
    let mx = 0;
    if (I.held("left")) mx -= 1; if (I.held("right")) mx += 1;
    if (I.pad.connected && Math.abs(I.pad.axes[0]) > 0.2) mx = I.pad.axes[0];
    const m = I.mouse;
    if (P.dead > 0) {
      P.dead -= dt;
      if (P.dead <= 0) { if (run.lives <= 0) { gameOver(); return; } P.inv = 2; P.x = W / 2; aShots = []; }
    } else {
      if (I.lastDevice === "mouse" && m.inside) P.x += U.clamp(m.x - P.x, -560 * dt, 560 * dt);
      else P.x += mx * 470 * dt;
      P.x = U.clamp(P.x, 40, W - 40);
      P.inv = Math.max(0, P.inv - dt);
      P.cool -= dt;
      for (const k in P.pow) { P.pow[k] -= dt; if (P.pow[k] <= 0) delete P.pow[k]; }
      const fire = I.held("fire") || (m.buttons & 1) || (m.buttons & 2) || (I.pad.connected && (I.pad.values[7] || 0) > 0.5);
      const maxShots = P.pow.rapid ? 5 : 2;
      if (P.pow.laser && fire) {
        // continuous laser: hits the lowest alien in a column
        P.laserOn = true; if (Math.random() < 0.5) A.sfx("laser");
        laserHit();
      } else P.laserOn = false;
      if (fire && !P.pow.laser && P.cool <= 0 && pShots.filter((s) => !s.side).length < maxShots) {
        P.cool = P.pow.rapid ? 0.11 : 0.28;
        if (P.pow.double) { pShots.push({ x: P.x - 14, y: PY - 26, vy: -900 }); pShots.push({ x: P.x + 14, y: PY - 26, vy: -900, side: true }); }
        else pShots.push({ x: P.x, y: PY - 26, vy: -900 });
        A.sfx("shot");
        burst(P.x, PY - 30, "#a0ffc0", 4, 80, 3);
      }
    }
    // formation
    if (form && aliens.length) {
      const alive = aliens.filter((a) => a.alive);
      if (alive.length) {
        const speed = 1 + run.world * 0.12 + run.wave * 0.08;
        const interval = Math.max(0.02, (0.06 + 0.7 * Math.pow(alive.length / 55, 1.3)) / speed);
        stepT -= dt;
        if (stepT <= 0) {
          stepT = interval; stepN++;
          A.sfx("step" + (stepN % 4));
          let minX = 1e9, maxX = -1e9;
          for (const a of alive) { const [x] = alienPos(a); minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
          const step = 14;
          if ((form.dir > 0 && maxX + step > W - 50) || (form.dir < 0 && minX - step < 50)) { form.dir = -form.dir; form.y += 24; }
          else form.x += form.dir * step;
          // aliens chew through bunkers
          for (const a of alive) { const [x, y] = alienPos(a); for (const b of bunkers) eraseBunker(b, x, y + 16, 26); }
        }
        // shooting from the bottom alien of a random column
        const shotRate = (0.6 + run.world * 0.25 + run.wave * 0.15) * (1 + (55 - alive.length) / 55);
        if (Math.random() < dt * shotRate && aShots.length < 3 + run.world + run.wave) {
          const cols = {}; for (const a of alive) if (!cols[a.c] || cols[a.c].r < a.r) cols[a.c] = a;
          const list = Object.values(cols);
          // prefer the column above the player
          let shooter = U.pick(list);
          if (Math.random() < 0.45) shooter = list.reduce((b, a) => (Math.abs(alienPos(a)[0] - P.x) < Math.abs(alienPos(b)[0] - P.x) ? a : b), list[0]);
          const [x, y] = alienPos(shooter);
          aShots.push({ x, y: y + 24, vy: 300 + run.world * 30, kind: wd.shot, t: 0 });
          A.sfx("alienShot");
        }
        // invasion
        const lowest = Math.max(...alive.map((a) => alienPos(a)[1]));
        if (lowest > PY - 50) invasion();
      } else if (!States.play.clearT) waveClear();
    }
    if (boss) updateBoss(dt);
    // UFO
    if (!ufo && !boss && Math.random() < dt / 22 && waveT > 6) { const d = Math.random() < 0.5 ? 1 : -1; ufo = { x: d > 0 ? -60 : W + 60, y: 96, vx: d * 170, snd: 0 }; }
    if (ufo) { ufo.x += ufo.vx * dt; ufo.snd -= dt; if (ufo.snd <= 0) { ufo.snd = 0.5; A.sfx("ufo"); } if (ufo.x < -100 || ufo.x > W + 100) ufo = null; }
    // player shots
    for (const s of pShots) {
      s.y += s.vy * dt;
      if (s.y < 40) { s.gone = true; burst(s.x, 44, "#ffffff", 4, 60, 2); continue; }
      if (hitBunkers(s.x, s.y, 10)) { s.gone = true; continue; }
      if (form) for (const a of aliens) {
        if (!a.alive) continue;
        const [x, y] = alienPos(a);
        if (Math.abs(s.x - x) < 26 && Math.abs(s.y - y) < 20) { killAlien(a, x, y); s.gone = true; break; }
      }
      if (!s.gone && ufo && Math.abs(s.x - ufo.x) < 36 && Math.abs(s.y - ufo.y) < 18) { s.gone = true; hitUfo(); }
      if (!s.gone && boss && !boss.dead && Math.abs(s.x - boss.x) < boss.spr.width / 2 - 10 && Math.abs(s.y - boss.y) < boss.spr.height / 2 - 6) { s.gone = true; damageBoss(1, s.x, s.y); }
      // shots can cancel alien shots
      if (!s.gone) for (const q of aShots) if (!q.gone && Math.abs(q.x - s.x) < 10 && Math.abs(q.y - s.y) < 16) { q.gone = true; s.gone = true; burst(s.x, s.y, "#ffffff", 8, 120, 3); }
    }
    pShots = pShots.filter((s) => !s.gone);
    // alien shots
    for (const q of aShots) {
      q.t += dt; q.y += q.vy * dt; if (q.vx) q.x += q.vx * dt;
      if (q.y > GROUND) { q.gone = true; burst(q.x, GROUND, "#ffd060", 6, 100, 3); continue; }
      if (hitBunkers(q.x, q.y + 8, 12)) { q.gone = true; continue; }
      if (P.dead <= 0 && Math.abs(q.x - P.x) < 26 && Math.abs(q.y - PY) < 18) { q.gone = true; hitPlayer(); }
    }
    aShots = aShots.filter((q) => !q.gone);
    // power-up capsules
    for (const c of caps) { c.y += 120 * dt; c.t += dt; if (c.y > GROUND) c.gone = true; if (P.dead <= 0 && Math.abs(c.x - P.x) < 34 && Math.abs(c.y - PY) < 24) { c.gone = true; power(c.kind); } }
    caps = caps.filter((c) => !c.gone);
    for (const p of parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt; }
    parts = parts.filter((p) => p.t < p.life);
    for (const p of pops) p.t += dt;
    pops = pops.filter((p) => p.t < (p.big ? 2 : 0.9));
    if (States.play.clearT) { States.play.clearT -= dt; if (States.play.clearT <= 0) nextWave(); }
    XA.Main.shake = Math.max(0, (XA.Main.shake || 0) - dt * 30);
  }
  function killAlien(a, x, y) {
    a.alive = false; G.run.kills++;
    A.sfx("hit");
    const col = WORLDS[G.run.world].cols[a.type];
    burst(x, y, col, 18, 280, 5); burst(x, y, "#ffffff", 6, 180, 3);
    parts.push({ x, y, vx: 0, vy: -200 * 0, t: 0, life: 0.25, splat: true });
    addScore(a.pts, x, y - 24);
    if (Math.random() < 0.03) caps.push({ x, y, kind: U.pick(["double", "rapid", "shield", "laser"]), t: 0 });
  }
  function laserHit() {
    // beam from the cannon straight up; damages the first thing it touches
    let top = 40;
    const x = P.x;
    for (const b of bunkers) { const cx = Math.floor((x - b.x) / b.cw); if (cx >= 0 && cx < b.cells[0].length) for (let r = b.cells.length - 1; r >= 0; r--) if (b.cells[r][cx]) { eraseBunker(b, x, b.y + r * b.cw, 6); } }
    let target = null, ty = 0;
    if (form) for (const a of aliens) { if (!a.alive) continue; const [ax, ay] = alienPos(a); if (Math.abs(ax - x) < 24 && ay > ty) { ty = ay; target = a; } }
    if (target) { const [ax, ay] = alienPos(target); killAlien(target, ax, ay); top = ay; }
    if (boss && !boss.dead && Math.abs(boss.x - x) < boss.spr.width / 2 - 10) { if (Math.random() < 0.3) damageBoss(1, x, boss.y + 30); top = boss.y + 30; }
    if (ufo && Math.abs(ufo.x - x) < 36) hitUfo();
    P.laserTop = top;
  }
  function hitUfo() {
    const pts = U.pick([50, 100, 150, 300]) * (1 + G.run.world * 0.5);
    A.sfx("ufoHit"); burst(ufo.x, ufo.y, "#ff3060", 30, 320, 5); burst(ufo.x, ufo.y, "#ffff80", 10, 200, 3);
    addScore(pts, ufo.x, ufo.y - 20);
    caps.push({ x: ufo.x, y: ufo.y + 20, kind: U.pick(["double", "rapid", "shield", "laser", "bomb", "double", "rapid"]), t: 0 });
    ufo = null;
  }
  function power(kind) {
    A.sfx("power");
    const names = { double: "DOUBLE SHOT", rapid: "RAPID FIRE", shield: "SHIELD", laser: "LASER", bomb: "BOMB" };
    pops.push({ x: P.x, y: PY - 60, text: names[kind], t: 0, col: "#ffe060" });
    A.say(names[kind].toLowerCase(), { pitch: 0.6, gap: 400 });
    if (kind === "shield") P.shield = 1;
    else if (kind === "bomb") {
      A.sfx("bomb"); XA.Main.shake = 18;
      if (form) { const alive = aliens.filter((a) => a.alive); const lowR = Math.max(...alive.map((a) => a.r)); for (const a of alive) if (a.r >= lowR - 1) { const [x, y] = alienPos(a); killAlien(a, x, y); } }
      if (boss && !boss.dead) damageBoss(12, boss.x, boss.y);
      aShots = [];
    } else P.pow[kind] = kind === "laser" ? 5 : 10;
  }
  function hitPlayer() {
    if (P.inv > 0) return;
    if (P.shield) { P.shield = 0; P.inv = 1; A.sfx("shield"); burst(P.x, PY, "#60c0ff", 24, 220, 4); return; }
    if (G.cheat) { burst(P.x, PY - 10, "#ffe060", 8, 120, 3); return; }
    const run = G.run;
    run.lives--; P.dead = 2.2; P.pow = {};
    A.sfx("die"); XA.Main.shake = 16;
    burst(P.x, PY, "#40ff80", 50, 360, 5); burst(P.x, PY, "#ffffff", 20, 260, 4); burst(P.x, PY, "#ffe060", 30, 300, 4);
    if (run.lives > 0) A.say(U.pick(["Ship destroyed.", "Cannon down. Deploying reserve."]), { pitch: 0.6 });
  }
  function invasion() {
    if (States.play.invaded) return;
    States.play.invaded = true;
    A.say("Invasion! The aliens have landed!", { pitch: 0.6, force: true });
    pops.push({ x: W / 2, y: H / 2, text: "INVASION!", t: 0, col: "#ff3060", big: true, size: 40 });
    if (!G.cheat) { G.run.lives--; burst(P.x, PY, "#40ff80", 40, 300, 5); A.sfx("die"); }
    XA.Main.shake = 20;
    // push the formation back up and continue
    form.y = 140; form.x = 0;
    setTimeout(() => { States.play.invaded = false; }, 500);
    if (G.run.lives <= 0) { P.dead = 2.2; }
  }
  function waveClear() {
    States.play.clearT = 2.6;
    A.sfx("wave");
    const bonus = Math.max(0, Math.round((60 - waveT) * 50));
    if (bonus > 0) addScore(bonus, W / 2, H / 2 + 50);
    pops.push({ x: W / 2, y: H / 2, text: "WAVE CLEARED", t: 0, col: "#40ff80", big: true, size: 36 });
  }
  function nextWave() {
    const run = G.run;
    run.wave++;
    if (run.wave > WAVES_PER_WORLD) { run.wave = 0; run.world++; if (run.world >= WORLDS.length) { run.won = true; UI.go("ending"); return; } }
    startWave();
  }
  function gameOver() { States.play.over = true; A.jingle("gameover"); A.say("Game over. The armada has won.", { pitch: 0.55, force: true }); UI.go("gameover"); }

  /* ---------- bunkers ---------- */
  function hitBunkers(x, y, rad) {
    for (const b of bunkers) {
      const cx = Math.floor((x - b.x) / b.cw), cy = Math.floor((y - b.y) / b.cw);
      if (cy < 0 || cy >= b.cells.length || cx < 0 || cx >= b.cells[0].length) continue;
      if (b.cells[cy][cx]) { eraseBunker(b, x, y, rad); A.sfx("bunker"); burst(x, y, "#40ff80", 5, 90, 3); return true; }
    }
    return false;
  }
  function eraseBunker(b, x, y, rad) {
    const rows = b.cells.length, cols = b.cells[0].length;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (!b.cells[r][c]) continue;
      const px = b.x + (c + 0.5) * b.cw, py = b.y + (r + 0.5) * b.cw, d = Math.hypot(px - x, py - y);
      if (d < rad * (0.6 + Math.random() * 0.6)) { b.cells[r][c] = 0; b.dirty = true; }
    }
  }
  function drawBunker(ctx, b) {
    if (b.dirty || !b.canvas) {
      b.canvas = bake(b.cells.map((r) => r.map((v) => (v ? "a" : ".")).join("")), { a: "#40e070", b: "#a0ffb0", d: "#208040" }, b.cw, "#003010");
      b.dirty = false;
    }
    ctx.drawImage(b.canvas, b.x - b.cw, b.y - b.cw);
  }

  /* ---------- boss ---------- */
  function updateBoss(dt) {
    const b = boss, run = G.run;
    if (b.dead) {
      b.dead += dt;
      if (Math.random() < dt * 14) burst(b.x + U.rand(-90, 90), b.y + U.rand(-40, 40), U.pick(["#ffffff", "#ffe060", "#ff6040", WORLDS[run.world].bossCol]), 20, 300, 6);
      if (b.dead > 2.5 && !States.play.clearT) { States.play.clearT = 2.5; pops.push({ x: W / 2, y: H / 2, text: "MOTHERSHIP DESTROYED", t: 0, col: "#ffe060", big: true, size: 30 }); }
      return;
    }
    b.t += dt; b.hitT = Math.max(0, b.hitT - dt);
    const rage = 1 + (1 - b.hp / b.maxHp) * 1.2;
    b.x += b.vx * rage * dt;
    if (b.x < 160 || b.x > W - 160) { b.vx = -b.vx; b.x = U.clamp(b.x, 160, W - 160); }
    b.y = 170 + Math.sin(b.t * 0.8) * 40 + (1 - b.hp / b.maxHp) * 80;
    b.fireT -= dt * rage;
    if (b.fireT <= 0) {
      b.pattern = (b.pattern + 1) % 3;
      b.fireT = 1.4;
      if (b.pattern === 0) for (let i = -3; i <= 3; i++) aShots.push({ x: b.x, y: b.y + 40, vy: 260, vx: i * 70, kind: "orb", t: 0 });
      else if (b.pattern === 1) for (let i = 0; i < 4; i++) setTimeout(() => { if (boss && !boss.dead && XA.Main.state === "play") aShots.push({ x: boss.x, y: boss.y + 40, vy: 420, vx: (P.x - boss.x) * 0.45, kind: "orb", t: 0 }); }, i * 140);
      else for (const dx of [-80, -40, 0, 40, 80]) aShots.push({ x: b.x + dx, y: b.y + 30, vy: 330 + Math.abs(dx), kind: WORLDS[run.world].shot, t: 0 });
      A.sfx("alienShot");
    }
  }
  function damageBoss(n, x, y) {
    const b = boss; b.hp -= n; b.hitT = 0.08; A.sfx("bossHit"); burst(x, y, "#ffffff", 6, 160, 3);
    addScore(10 * n);
    if (b.hp <= 0) { b.dead = 0.01; A.sfx("bossDie"); XA.Main.shake = 24; A.say("Mothership destroyed!", { pitch: 0.6, force: true }); addScore(5000 * (1 + G.run.world), b.x, b.y); aShots = []; }
  }

  /* ---------- drawing ---------- */
  function drawGame(ctx, t) {
    const run = G.run, wd = WORLDS[run.world];
    ctx.save();
    if (XA.Main.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * XA.Main.shake), Math.round((Math.random() - 0.5) * XA.Main.shake));
    drawBackground(ctx, run.world, t);
    ctx.imageSmoothingEnabled = false;
    // ground line
    ctx.fillStyle = "#40ff80"; ctx.fillRect(0, GROUND, W, 3);
    for (const b of bunkers) drawBunker(ctx, b);
    // aliens
    if (form) for (const a of aliens) {
      if (!a.alive) continue;
      const [x, y] = alienPos(a), spr = alienSprites(wd.seeds[a.type], wd.cols[a.type])[stepN % 2];
      ctx.drawImage(spr, Math.round(x - spr.width / 2), Math.round(y - spr.height / 2));
    }
    if (ufo) ctx.drawImage(ufoSpr, Math.round(ufo.x - ufoSpr.width / 2), Math.round(ufo.y - ufoSpr.height / 2));
    if (boss) {
      const b = boss, s = b.spr;
      if (!(b.dead && Math.floor(t * 20) % 2)) {
        ctx.save(); if (b.hitT > 0) ctx.filter = "brightness(3)";
        ctx.drawImage(s, Math.round(b.x - s.width / 2), Math.round(b.y - s.height / 2));
        ctx.restore();
        // engine flames
        for (const dx of [-60, 0, 60]) { ctx.fillStyle = Math.floor(t * 20) % 2 ? "#ffe060" : "#ff6030"; ctx.fillRect(b.x + dx - 6, b.y - s.height / 2 - 12 - Math.random() * 8, 12, 12); }
      }
      if (!b.dead) { const w = 500; ctx.fillStyle = "#000"; ctx.fillRect(W / 2 - w / 2 - 3, 58, w + 6, 16); ctx.fillStyle = wd.bossCol; ctx.fillRect(W / 2 - w / 2, 61, (w * b.hp) / b.maxHp, 10); }
    }
    // shots
    for (const s of pShots) { ctx.fillStyle = "#ffffff"; ctx.fillRect(s.x - 2, s.y - 12, 4, 16); ctx.fillStyle = "rgba(160,255,200,0.5)"; ctx.fillRect(s.x - 4, s.y - 6, 8, 12); }
    if (P.laserOn && P.dead <= 0) { const top = P.laserTop || 40; ctx.fillStyle = "rgba(120,255,255,0.35)"; ctx.fillRect(P.x - 10, top, 20, PY - 26 - top); ctx.fillStyle = "#e0ffff"; ctx.fillRect(P.x - 3, top, 6, PY - 26 - top); }
    for (const q of aShots) {
      ctx.fillStyle = q.kind === "orb" ? "#ff40a0" : "#ffe060";
      if (q.kind === "zig") { const ph = Math.floor(q.t * 12) % 2; for (let k = 0; k < 4; k++) ctx.fillRect(q.x - 2 + ((k + ph) % 2 ? 4 : -4), q.y - 12 + k * 6, 4, 6); }
      else if (q.kind === "plunger") { ctx.fillRect(q.x - 2, q.y - 12, 4, 20); ctx.fillRect(q.x - 6, q.y + (Math.floor(q.t * 10) % 2 ? -12 : 4), 12, 4); }
      else if (q.kind === "roll") { const ph = Math.floor(q.t * 10) % 3; ctx.fillRect(q.x - 2, q.y - 12, 4, 20); ctx.fillRect(q.x - 6, q.y - 10 + ph * 6, 12, 3); }
      else { ctx.beginPath(); ctx.arc(q.x, q.y, 7, 0, TAU); ctx.fill(); ctx.fillStyle = "#ffffff"; ctx.fillRect(q.x - 2, q.y - 2, 4, 4); }
    }
    for (const c of caps) {
      const cols = { double: "#40c0ff", rapid: "#ffe060", shield: "#60ff90", laser: "#ff60ff", bomb: "#ff6040" };
      ctx.fillStyle = "#000"; ctx.fillRect(c.x - 16, c.y - 12, 32, 24); ctx.fillStyle = cols[c.kind]; ctx.fillRect(c.x - 14, c.y - 10, 28, 20);
      ctx.fillStyle = "#000"; ctx.font = `14px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(c.kind[0].toUpperCase(), c.x + 1, c.y + 1);
      ctx.strokeStyle = Math.floor(c.t * 8) % 2 ? "#ffffff" : cols[c.kind]; ctx.lineWidth = 2; ctx.strokeRect(c.x - 18, c.y - 14, 36, 28);
    }
    // player
    if (P.dead <= 0 && !(P.inv > 0 && Math.floor(t * 14) % 2)) {
      ctx.drawImage(playerSpr, Math.round(P.x - playerSpr.width / 2), PY - playerSpr.height + 8);
      if (P.shield) { ctx.strokeStyle = `rgba(96,192,255,${0.6 + 0.3 * Math.sin(t * 8)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(P.x, PY - 10, 44, 30, 0, Math.PI, 0); ctx.stroke(); }
      if (G.cheat) { ctx.fillStyle = "#ffe060"; ctx.fillRect(P.x - 2, PY + 10, 4, 4); }
      ctx.fillStyle = Math.floor(t * 20) % 2 ? "#ffe060" : "#ff6030"; ctx.fillRect(P.x - 20, PY + 6, 6, 4); ctx.fillRect(P.x + 14, PY + 6, 6, 4);
    }
    // particles
    for (const p of parts) {
      const k = p.t / p.life;
      if (p.splat) { ctx.globalAlpha = 1 - k; ctx.drawImage(splatSpr, p.x - splatSpr.width / 2, p.y - splatSpr.height / 2); ctx.globalAlpha = 1; continue; }
      ctx.globalAlpha = 1 - k; ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
    }
    ctx.globalAlpha = 1;
    for (const p of pops) { const k = p.t / (p.big ? 2 : 0.9); ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; txt(ctx, p.text, p.x, p.y - k * 30, p.size || 14, p.col); ctx.globalAlpha = 1; }
    ctx.restore();
    drawHUD(ctx, t);
  }
  function drawHUD(ctx, t) {
    const run = G.run;
    txt(ctx, `SCORE ${String(run.score).padStart(6, "0")}`, 24, 26, 18, "#ffffff", "left");
    txt(ctx, `HI ${String(Math.max(run.score, XA.HS.list()[0].score)).padStart(6, "0")}`, W / 2, 26, 18, "#40ff80");
    txt(ctx, `${WORLDS[run.world].name} ${run.wave >= WAVES_PER_WORLD ? "BOSS" : `${run.wave + 1}/${WAVES_PER_WORLD}`}`, W - 24, 26, 14, "#a0ffc0", "right");
    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < Math.min(6, run.lives); i++) ctx.drawImage(playerSpr, 20 + i * 52, GROUND + 10, playerSpr.width * 0.75, playerSpr.height * 0.75);
    let x = W - 30;
    for (const [k, v] of Object.entries(P.pow)) { txt(ctx, `${k.toUpperCase()} ${Math.ceil(v)}`, x, GROUND + 26, 12, "#ffe060", "right"); x -= 200; }
    if (G.cheat) { ctx.fillStyle = "#ffd040"; ctx.fillRect(W / 2 - 2, GROUND + 30, 4, 4); }
  }

  /* ---------- states ---------- */
  States.waveintro = {
    t: 0,
    enter() {
      this.t = 0; XA.Main.setCursor(false);
      const run = G.run, wd = WORLDS[run.world];
      if (run.wave >= WAVES_PER_WORLD) { A.playSong("boss"); A.sfx("warning"); A.say("Warning! Mothership approaching!", { pitch: 0.55, force: true }); }
      else { A.playSong(wd.song); A.say(run.wave === 0 ? `Sector ${run.world + 1}. ${wd.name.toLowerCase()}.` : `Wave ${run.wave + 1}.`, { pitch: 0.6, force: true }); }
      States.play.clearT = 0; States.play.invaded = false;
    },
    input() { if (this.t > 0.5 && (I.hit("confirm") || I.hit("fire") || I.mouse.clicked)) this.t = 99; },
    update(dt) { this.t += dt; if (this.t > 2.4) UI.go("play"); },
    draw(ctx) {
      drawGame(ctx, this.t);
      const run = G.run, boss = run.wave >= WAVES_PER_WORLD;
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, H / 2 - 100, W, 200);
      txt(ctx, boss ? "WARNING" : `SECTOR ${run.world + 1} · WAVE ${run.wave + 1}`, W / 2, H / 2 - 40, boss ? 48 : 30, boss ? (Math.floor(this.t * 6) % 2 ? "#ff3060" : "#ffffff") : "#40ff80");
      txt(ctx, boss ? "MOTHERSHIP APPROACHING" : WORLDS[run.world].name, W / 2, H / 2 + 30, 24, "#ffffff");
    },
  };
  States.play = {
    t: 0, paused: false, over: false, clearT: 0, invaded: false,
    pauseMenu: makeMenu([
      { label: "RESUME", action: () => { States.play.paused = false; XA.Main.setCursor(false); } },
      { label: "HOW TO PLAY", action: () => UI.go("controls", { back: "play" }) },
      { label: "OPTIONS", action: () => UI.go("options", { back: "play" }) },
      { label: "QUIT TO TITLE", action: () => { States.play.paused = false; UI.go("title"); } },
    ], 300),
    enter(arg) { if (arg && arg.resume) { this.paused = true; return; } this.paused = false; this.over = false; XA.Main.setCursor(false); },
    pause() { if (!this.paused && !this.over) { this.paused = true; this.pauseMenu.sel = 0; A.sfx("menuBack"); XA.Main.setCursor(true); } },
    input() {
      if (this.paused) { if (I.hit("pause") && this.t > 0) { this.paused = false; XA.Main.setCursor(false); return; } menuInput(this.pauseMenu); return; }
      if (I.hit("pause")) this.pause();
    },
    update(dt) { if (this.paused) return; this.t += dt; if (!this.over) update(dt); },
    draw(ctx) {
      drawGame(ctx, this.t);
      if (this.paused) { ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, 0, W, H); txt(ctx, "PAUSED", W / 2, 200, 48, "#40ff80"); menuDraw(ctx, this.pauseMenu, performance.now() / 1000); }
    },
  };
  States.gameover = {
    t: 0,
    enter() { this.t = 0; XA.Main.setCursor(true); },
    input() { if (this.t > 1.5 && (I.hit("confirm") || I.hit("fire") || I.mouse.clicked)) UI.finishRun(); },
    update(dt) { this.t += dt; if (this.t > 8) UI.finishRun(); },
    draw(ctx) {
      drawBackground(ctx, G.run.world, this.t);
      ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(0, 0, W, H);
      txt(ctx, "GAME OVER", W / 2, 250, 64, Math.floor(this.t * 3) % 2 ? "#ff3060" : "#ffffff");
      txt(ctx, `SCORE ${U.fmt(G.run.score)}`, W / 2, 350, 28, "#ffffff");
      txt(ctx, `${G.run.kills} ALIENS DESTROYED`, W / 2, 400, 16, "#a0ffc0");
    },
  };
  States.ending = {
    t: 0,
    enter() { this.t = 0; A.playSong("ending"); A.say("Congratulations, commander. The galaxy is safe.", { pitch: 0.6, force: true }); XA.Main.setCursor(true); addScore(30000); },
    input() { if (this.t > 2 && (I.hit("confirm") || I.hit("fire") || I.mouse.clicked)) UI.finishRun(); },
    update(dt) { this.t += dt; if (this.t > 25) UI.finishRun(); },
    draw(ctx) {
      drawBackground(ctx, 2, this.t);
      ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(0, 0, W, H);
      txt(ctx, "THE GALAXY IS SAFE!", W / 2, 160, 40, "#40ff80");
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(playerSpr, W / 2 - playerSpr.width, 300 + Math.sin(this.t * 2) * 10, playerSpr.width * 2, playerSpr.height * 2);
      txt(ctx, `FINAL SCORE ${U.fmt(G.run.score)}`, W / 2, 470, 26, "#ffffff");
      txt(ctx, "ALL FIVE MOTHERSHIPS DESTROYED +30,000", W / 2, 520, 14, "#a0ffc0");
      if (this.t > 2) txt(ctx, "PRESS A BUTTON", W / 2, 640, 14, "#a0ffc0");
    },
  };
  XA.Game = { get P() { return P; }, get aliens() { return aliens; }, get boss() { return boss; }, alienPos, get aShots() { return aShots; }, get ufo() { return ufo; } };
})(window.XA);
