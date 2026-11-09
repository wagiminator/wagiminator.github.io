/* PRIMORDIA: game world – levels, player and weapon attachments, enemies, bosses */
"use strict";

(function (XA) {
  const { U, Gfx, Fx } = XA;
  const A = XA.Audio, I = XA.Input;
  const PW = 720, PH = 720, TAU = U.TAU;

  const G = (XA.G = {
    PW, PH, cheat: false, run: null, enemies: [], pb: [], eb: [], pickups: [], mines: [], bolts: [], drones: [], queue: [],
    dist: 0, speed: 70, t: 0, phase: "intro", phaseT: 0, mouseMode: false, boss: null, autopilot: null, over: 0, obstacles: [], warns: [],
  });

  /* ---------- Levels ---------- */
  G.LEVELS = [
    {
      name: "Primeval Ocean", theme: "ocean", song: "level1", speed: 70, seed: 11, boss: "ammonex",
      walls: { base: 40, amp: 110, scale: 520 },
      halves: [
        ["bugs", "bubbles", "ammos", "flies", "bugs", "eggs", "jellies", "darters", "flies", "ammos", "worm", "nautilus"],
        ["flies", "eyes", "bugs", "jellies", "bubbles", "worm", "darters", "eggs", "flies", "ammos", "beetle", "jellies", "flies"],
      ],
    },
    {
      name: "Fossil Depths", theme: "fossil", song: "level2", speed: 75, seed: 23, boss: "ossarius",
      walls: { base: 60, amp: 120, scale: 460 },
      halves: [
        ["darters", "bugs", "eyes", "flies", "eggs", "beetle", "ammos", "bubbles", "worm", "eyes", "flies", "nautilus"],
        ["bugs", "eyes", "darters", "worm", "jellies", "eggs", "beetle", "flies", "bubbles", "eyes", "ammos", "worm", "nautilus"],
      ],
    },
    {
      name: "Spore Jungle", theme: "spore", song: "level3", speed: 80, seed: 37, boss: "venombloom",
      walls: { base: 70, amp: 130, scale: 400 },
      halves: [
        ["spores", "flies", "eyes", "bugs", "spores", "bubbles", "beetle", "darters", "worm", "spores", "eggs", "nautilus"],
        ["flies", "spores", "eyes", "beetle", "jellies", "bubbles", "worm", "spores", "darters", "eyes", "flies", "beetle", "spores"],
      ],
    },
    {
      name: "Bio Core", theme: "core", song: "level4", speed: 85, seed: 53, boss: "overmind",
      walls: { base: 70, amp: 130, scale: 380 },
      halves: [
        ["darters", "flies", "eyes", "beetle", "spores", "worm", "bubbles", "nautilus", "flies", "eyes", "darters", "beetle"],
        ["worm", "eyes", "flies", "nautilus", "spores", "bubbles", "beetle", "darters", "eyes", "worm", "flies", "nautilus", "beetle"],
      ],
    },
  ];

  function makeWalls(L) {
    const nl = U.noise1(L.seed), nr = U.noise1(L.seed * 5 + 1), wd = L.walls;
    const raw = (n, w) => Math.max(0, wd.base + (U.fbm(n, w / wd.scale, 3) - 0.5) * 2.6 * wd.amp);
    const both = (w) => {
      let l = raw(nl, w), r = raw(nr, w + 777);
      const max = PW - 400;
      if (l + r > max) { const k = max / (l + r); l *= k; r *= k; }
      return [l, r];
    };
    return { L: (w) => both(w)[0], R: (w) => both(w)[1] };
  }
  G.makeWalls = makeWalls;
  // world coordinate of a screen y, and the free corridor at that height
  G.wAt = (y) => G.dist + PH - y;
  G.leftAt = (y) => G.walls.L(G.wAt(y));
  G.rightAt = (y) => PW - G.walls.R(G.wAt(y));

  G.hpMul = () => 1 + 0.25 * G.run.level;
  G.bmul = () => 1 + 0.1 * G.run.level;

  /* ---------- Weapons: names, maximum levels ---------- */
  G.WMAX = { main: 5, side: 2, rear: 2, cannon: 3, laser: 3, homing: 3, electro: 2, drone: 2, mines: 2, zapper: 2, rapid: 2, speed: 3, armor: 2 };
  G.WNAME = { main: "Blaster", side: "Side Shot", rear: "Rear Shot", cannon: "Cannon", laser: "Laser", homing: "Homing Missiles", electro: "Electro Balls", drone: "Drones", mines: "Mines", zapper: "Zapper", rapid: "Rapid Fire", speed: "Speed Up", armor: "Armour" };
  const lv = (k) => (G.over > 0 && k !== "speed" && k !== "armor" ? G.WMAX[k] : G.run.w[k]);
  G.lv = lv;
  G.maxEnergy = () => 100 + 30 * G.run.w.armor;

  G.newRun = function () {
    G.run = {
      score: 0, credits: 2000, lives: 2, level: 0, half: 0, cheated: G.cheat, energy: 100, bombs: 1, overPending: false, kills: 0,
      w: { main: 1, side: 0, rear: 0, cannon: 0, laser: 0, homing: 0, electro: 0, drone: 0, mines: 0, zapper: 0, rapid: 0, speed: 0, armor: 0 },
      paid: {},
    };
  };

  G.startSection = function (level, half) {
    const L = (G.L = G.LEVELS[level]);
    const r = G.run;
    r.level = level; r.half = half;
    G.theme = L.theme;
    G.walls = makeWalls(L);
    G.dist = half * 6000; G.speed = L.speed; G.t = 0;
    G.enemies = []; G.pb = []; G.eb = []; G.pickups = []; G.mines = []; G.bolts = []; G.drones = []; G.queue = []; G.groups = {}; G.obstacles = []; G.warns = [];
    G.boss = null; G.seq = L.halves[half]; G.seqIndex = 0; G.nextPattern = 2.5; G.gameOverT = 0;
    G.stats = { spawned: 0, killed: 0 };
    G.player = newPlayer();
    G.over = 0;
    if (r.overPending) { r.overPending = false; G.over = 20; }
    setPhase("intro");
    Fx.clear();
    A.playSong(L.song);
  };

  function setPhase(p) { G.phase = p; G.phaseT = 0; }

  G.addScore = function (n, x, y) {
    const r = G.run;
    if (G.cheat) { r.cheated = true; return; }
    const before = Math.floor(r.score / 60000);
    r.score += n;
    if (x !== undefined && n >= 300) Fx.text(x, y, "+" + U.fmt(n));
    if (Math.floor(r.score / 60000) > before && r.lives < 9) { r.lives++; A.sfx("extra"); Fx.text(G.player.x, G.player.y - 50, "EXTRA LIFE", "120,255,180", 20); }
  };

  /* ---------- Player ---------- */
  function newPlayer() {
    return { x: PW / 2, y: PH + 60, vx: 0, vy: 0, r: 8, inv: 3, dead: false, respawn: 0, hitFl: 0, bank: 0, entering: true, exiting: false, hist: [],
      t: { main: 0, side: 0, rear: 0, cannon: 0, laser: 0, homing: 0.5, mines: 0.5, zapper: 0.3 } };
  }

  function playerUpdate(dt) {
    const p = G.player, r = G.run;
    if (p.dead) {
      p.respawn -= dt;
      if (p.respawn <= 0 && G.gameOverT <= 0 && G.phase !== "clear" && G.phase !== "sectionclear") { Object.assign(p, newPlayer()); r.energy = G.maxEnergy(); }
      return;
    }
    p.inv = Math.max(0, p.inv - dt);
    p.hitFl = Math.max(0, p.hitFl - dt);
    const spd = 300 + 50 * r.w.speed;
    let tvx = 0, tvy = 0;
    if (p.entering) { tvy = -380; p.inv = Math.max(p.inv, 1.2); if (p.y < PH - 140) p.entering = false; }
    else if (p.exiting) tvy = p.vy - 900 * dt;
    else if (G.autopilot) {
      const a = G.autopilot(p), l = Math.max(1, Math.hypot(a.dx, a.dy));
      tvx = (a.dx / l) * spd; tvy = (a.dy / l) * spd;
    } else {
      let mx = 0, my = 0;
      if (I.held("left")) mx -= 1;
      if (I.held("right")) mx += 1;
      if (I.held("up")) my -= 1;
      if (I.held("down")) my += 1;
      const ax = I.pad.axes[0], ay = I.pad.axes[1];
      if (ax || ay) { mx += ax; my += ay; }
      if (mx || my) G.mouseMode = false;
      else if (I.mouse.moved && I.mouse.inside) G.mouseMode = true;
      if (G.mouseMode) {
        const dx = I.mouse.x - XA.PX - p.x, dy = I.mouse.y - p.y, d = Math.hypot(dx, dy), s = Math.min(spd, d * 9);
        if (d > 1) { tvx = (dx / d) * s; tvy = (dy / d) * s; }
      } else {
        const l = Math.hypot(mx, my);
        if (l > 1) { mx /= l; my /= l; }
        tvx = mx * spd; tvy = my * spd;
      }
    }
    const k = Math.min(1, dt * 16);
    p.vx += (tvx - p.vx) * k; p.vy += (tvy - p.vy) * k;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.bank = U.lerp(p.bank, U.clamp(p.vx / spd, -1, 1), Math.min(1, dt * 10));
    if (!p.entering && !p.exiting) p.y = U.clamp(p.y, 40, PH - 36);
    p.x = U.clamp(p.x, 26, PW - 26);
    const lx = G.leftAt(p.y), rx = G.rightAt(p.y);
    if (p.x < lx + 22) { p.x = lx + 22; p.vx = 150; wallHit(lx, p.y); }
    if (p.x > rx - 22) { p.x = rx - 22; p.vx = -150; wallHit(rx, p.y); }
    if (G.obstacles.length) obstaclePush(p);
    p.hist.unshift(p.x, p.y);
    if (p.hist.length > 100) p.hist.length = 100;
    if (!p.entering && !p.exiting && G.phase !== "clear" && G.phase !== "sectionclear") fire(dt);
  }
  /* ---------- Fixed obstacles (stages 5–8): indestructible, block the ship and all shots ---------- */
  // from "L"/"R": a spur growing out of a wall, len = how far it reaches into the corridor; "free": a floating block
  G.obstRect = (o) => { const yb = PH - (o.wb - G.dist); return { x: o.x, y: yb - o.h, w: o.w, h: o.h }; };
  G.addObstacle = function (o) {
    const h = o.h || 40, wb = G.dist + PH + 20 + (o.ahead || 0);
    let maxL = 0, minR = PW;
    for (let w = wb; w <= wb + h; w += 6) { maxL = Math.max(maxL, G.walls.L(w)); minR = Math.min(minR, PW - G.walls.R(w)); }
    const gap = o.gap ?? 170, ob = { kind: o.kind || "machine", from: o.from || "free", wb, h };
    if (ob.from === "L") { const x1 = Math.min(o.x1 !== undefined ? o.x1 : maxL + (o.len || 200), minR - gap); ob.x = -20; ob.w = Math.max(maxL + 30, x1) + 20; }
    else if (ob.from === "R") { const x0 = Math.max(o.x0 !== undefined ? o.x0 : minR - (o.len || 200), maxL + gap); ob.x = Math.min(minR - 30, x0); ob.w = PW + 20 - ob.x; }
    else { const w = Math.min(o.w || 160, minR - maxL - gap * 2); ob.w = Math.max(40, w); ob.x = U.clamp((o.cx !== undefined ? o.cx : PW / 2) - ob.w / 2, maxL + gap, minR - gap - ob.w); }
    G.obstacles.push(ob);
    return ob;
  };
  G.obstHit = function (x, y, r) {
    for (const o of G.obstacles) { const R = G.obstRect(o); if (x + r > R.x && x - r < R.x + R.w && y + r > R.y && y - r < R.y + R.h) return o; }
    return null;
  };
  function obstaclePush(p) {
    const RR = 16;
    for (const o of G.obstacles) {
      const R = G.obstRect(o);
      if (!(p.x + RR > R.x && p.x - RR < R.x + R.w && p.y + RR > R.y && p.y - RR < R.y + R.h)) continue;
      const opts = [[R.x - RR - p.x, 0], [R.x + R.w + RR - p.x, 0], [0, R.y - RR - p.y], [0, R.y + R.h + RR - p.y]]
        .filter(([dx, dy]) => p.x + dx >= Math.max(26, G.leftAt(p.y + dy) + 20) && p.x + dx <= Math.min(PW - 26, G.rightAt(p.y + dy) - 20) && p.y + dy >= 40 && p.y + dy <= PH - 36);
      if (!opts.length) continue;
      opts.sort((a, b) => Math.abs(a[0]) + Math.abs(a[1]) - Math.abs(b[0]) - Math.abs(b[1]));
      const [dx, dy] = opts[0];
      p.x += dx; p.y += dy;
      if (dx) p.vx = Math.sign(dx) * 140; else p.vy = Math.sign(dy) * 140;
      Fx.hitSpark(p.x - Math.sign(dx) * RR, p.y - Math.sign(dy) * RR, "255,220,160", 3);
      G.hurt(22);
    }
  }
  // red arrows at the playfield edge before an enemy arrives from there
  G.edgeWarn = function (x, y) {
    const cx = U.clamp(x, 26, PW - 26), cy = U.clamp(y, 26, PH - 26);
    G.warns.push({ x: cx, y: cy, a: Math.atan2(y - cy, x - cx) + Math.PI, t: 0, life: 0.9 });
  };

  function wallHit(x, y) { Fx.hitSpark(x, y, "255,220,160", 3); G.hurt(16); }

  G.hurt = function (dmg) {
    const p = G.player, r = G.run;
    if (!p || p.dead || p.inv > 0 || p.entering) return;
    if (G.cheat) { r.cheated = true; Fx.hitSpark(p.x, p.y, "150,220,255", 3); p.inv = 0.3; return; }
    r.energy -= dmg; p.hitFl = 0.18; p.inv = 0.5;
    A.sfx("playerHit");
    Fx.shake = Math.max(Fx.shake, 9);
    Fx.hitSpark(p.x, p.y, "255,120,80", 8);
    if (r.energy <= 0) killPlayer();
  };

  function killPlayer() {
    const p = G.player, r = G.run;
    r.energy = 0; p.dead = true; p.respawn = 2.4;
    Fx.explode(p.x, p.y, 70, { rgb: "120,220,255" });
    A.sfx("playerDie"); Fx.shake = 26;
    // like the original: losing a ship costs some of the add-ons
    if (r.w.main > 1) r.w.main--;
    const lost = Object.keys(r.w).filter((k) => k !== "main" && k !== "armor" && k !== "speed" && r.w[k] > 0);
    if (lost.length) { const k = U.pick(lost); r.w[k]--; }
    G.over = 0;
    if (r.lives > 0) r.lives--; else G.gameOverT = 3;
  }

  /* ---------- Weapons ---------- */
  function pshot(o) { G.pb.push(Object.assign({ vx: 0, vy: -1000, r: 6, dmg: 10, k: "shot", t: 0, life: 2.5, pierce: 0 }, o)); }
  const UP = -Math.PI / 2;
  function dirShot(x, y, a, sp, o) { pshot(Object.assign({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp }, o)); }

  function fire(dt) {
    const p = G.player, T = p.t, rate = 1 - 0.15 * lv("rapid");
    for (const k in T) T[k] -= dt;
    const firing = G.autopilot ? true : I.held("fire");
    if (!firing) return;
    const x = p.x, y = p.y - 34;
    if (T.main <= 0) {
      T.main = 0.11 * rate;
      const m = lv("main");
      const offs = [[0], [-7, 7], [-9, 0, 9], [-12, -4, 4, 12], [-14, -5, 5, 14]][m - 1];
      for (const o of offs) pshot({ x: x + o, y, dmg: 10 });
      if (m >= 3) { dirShot(x - 10, y + 6, UP - 0.16, 1000, { dmg: 9 }); dirShot(x + 10, y + 6, UP + 0.16, 1000, { dmg: 9 }); }
      if (m >= 5) { dirShot(x - 14, y + 10, UP - 0.32, 980, { dmg: 9 }); dirShot(x + 14, y + 10, UP + 0.32, 980, { dmg: 9 }); }
      A.sfx("shot");
    }
    if (lv("side") && T.side <= 0) {
      T.side = 0.26 * rate;
      for (const s of [-1, 1]) {
        dirShot(x + s * 30, p.y + 4, s > 0 ? 0 : Math.PI, 900, { k: "side", dmg: 8 });
        if (lv("side") >= 2) dirShot(x + s * 30, p.y, UP + s * 0.75, 900, { k: "side", dmg: 8 });
      }
      A.sfx("side");
    }
    if (lv("rear") && T.rear <= 0) {
      T.rear = 0.28 * rate;
      dirShot(x, p.y + 38, Math.PI / 2, 900, { k: "side", dmg: 8 });
      if (lv("rear") >= 2) { dirShot(x - 8, p.y + 36, Math.PI / 2 + 0.3, 900, { k: "side", dmg: 8 }); dirShot(x + 8, p.y + 36, Math.PI / 2 - 0.3, 900, { k: "side", dmg: 8 }); }
    }
    if (lv("cannon") && T.cannon <= 0) {
      const c = lv("cannon");
      T.cannon = [0, 0.55, 0.45, 0.38][c] * rate;
      const xs = c >= 3 ? [-16, 16] : [0];
      for (const o of xs) pshot({ x: x + o, y: y - 4, vy: -620, k: "cannon", r: 11, dmg: 30, pierce: 2 + c, hits: new Set() });
      A.sfx("cannon");
    }
    if (lv("laser") && T.laser <= 0) {
      const l = lv("laser");
      T.laser = 0.24 * rate;
      const xs = [[0], [-26, 26], [-26, 0, 26]][l - 1];
      for (const o of xs) pshot({ x: x + o, y: y + (o ? 18 : -6), vy: -1600, k: "laser", r: 6, dmg: 13 + l * 3, pierce: 3, len: 70 + l * 15, hits: new Set() });
      A.sfx("laser");
    }
    if (lv("homing") && T.homing <= 0) {
      const h = lv("homing");
      T.homing = 0.85 * rate;
      for (let i = 0; i < h * 2; i++) { const s = i % 2 ? 1 : -1; dirShot(x + s * 20, p.y + 6, UP + s * (0.9 + Math.floor(i / 2) * 0.35), 280, { k: "missile", r: 7, dmg: 22, life: 3, retarget: 0 }); }
      A.sfx("missile");
    }
    if (lv("mines") && T.mines <= 0) {
      T.mines = [0, 1.2, 0.8][lv("mines")];
      G.mines.push({ x: x + U.rand(-10, 10), y: p.y + 30, t: 0 });
      A.sfx("mine");
    }
    if (lv("zapper") && T.zapper <= 0) {
      const z = lv("zapper");
      T.zapper = [0, 0.55, 0.38][z];
      let from = { x: p.x, y: p.y - 20 };
      const hit = new Set();
      for (let n = 0; n < (z >= 2 ? 3 : 1); n++) {
        let best = null, bd = (n === 0 ? 300 : 180) ** 2;
        for (const e of G.enemies) { if (e.dead || e.hidden || hit.has(e)) continue; const d = U.dist2(e.x, e.y, from.x, from.y); if (d < bd) { bd = d; best = e; } }
        if (!best) {
          if (n === 0 && G.boss && G.boss.entered && !G.boss.dying) { const t = G.boss.target(); if (U.dist2(t.x, t.y, from.x, from.y) < 300 * 300) { G.bolts.push({ x0: from.x, y0: from.y, x1: t.x, y1: t.y, life: 0.14 }); bossDamage(18); A.sfx("zap"); } }
          break;
        }
        hit.add(best);
        G.bolts.push({ x0: from.x, y0: from.y, x1: best.x, y1: best.y, life: 0.14 });
        damageEnemy(best, 20, best.x, best.y);
        from = best;
        A.sfx("zap");
      }
    }
  }

  G.useBomb = function () {
    const r = G.run, p = G.player;
    if (r.bombs <= 0 || p.dead || G.phase === "clear") return;
    r.bombs--;
    A.sfx("bomb");
    Fx.flash = 0.9; Fx.flashRGB = "230,240,255"; Fx.shake = 22;
    Fx.add({ k: "ring", x: p.x, y: p.y, size: 20, size2: PW * 1.3, life: 1.0, rgb: "220,240,255", w: 40 });
    for (const b of G.eb) Fx.glow(b.x, b.y, 10, 26, "200,230,255", 0.4);
    G.eb.length = 0;
    for (const e of G.enemies.slice()) if (!e.hidden && e.y > -20) damageEnemy(e, 150, e.x, e.y);
    if (G.boss) bossDamage(160, true);
    p.inv = Math.max(p.inv, 0.6);
  };

  function dronesUpdate(dt) {
    const n = lv("drone"), p = G.player;
    while (G.drones.length < n) G.drones.push({ x: p.x, y: p.y + 40, t: Math.random() * 0.2 });
    while (G.drones.length > n) G.drones.pop();
    G.drones.forEach((d, i) => {
      const k = Math.min(p.hist.length - 2, (i + 1) * 22);
      const tx = (p.hist[k] !== undefined ? p.hist[k] : p.x) + (i ? 34 : -34), ty = (p.hist[k + 1] !== undefined ? p.hist[k + 1] : p.y) + 26;
      d.x += (tx - d.x) * Math.min(1, dt * 10); d.y += (ty - d.y) * Math.min(1, dt * 10);
      d.t -= dt;
      if (d.t <= 0 && !p.dead && (G.autopilot || I.held("fire")) && !p.entering && G.phase !== "clear") { d.t = 0.24; pshot({ x: d.x, y: d.y - 14, dmg: 7, k: "side", r: 5 }); }
    });
    // electro balls
    const eb = [0, 2, 4][lv("electro")];
    G.electro = [];
    if (!p.dead) for (let i = 0; i < eb; i++) { const a = G.t * 4.2 + (i * TAU) / eb; G.electro.push({ x: p.x + Math.cos(a) * 56, y: p.y + Math.sin(a) * 56 }); }
    for (const b of G.electro) {
      for (const e of G.enemies) if (!e.dead && !e.hidden && hitE(e, b.x, b.y, 10)) damageEnemy(e, 70 * dt, b.x, b.y, true);
      if (G.boss && G.boss.test(b.x, b.y, 10) === "weak") bossDamage(50 * dt);
      for (let j = G.eb.length - 1; j >= 0; j--) { const q = G.eb[j]; if (U.dist2(q.x, q.y, b.x, b.y) < (12 + q.r) ** 2) { Fx.hitSpark(q.x, q.y, "150,220,255", 3); G.eb.splice(j, 1); } }
    }
  }

  /* ---------- Enemies ---------- */
  function hitE(e, x, y, r) { const dx = (x - e.x) / (e.rx + r), dy = (y - e.y) / (e.ry + r); return dx * dx + dy * dy < 1; }
  function aim(e) { const p = G.player; return Math.atan2(p.y - e.y, p.x - e.x); }
  function canShoot(e) { return !G.player.dead && e.y > 10 && e.y < PH - 120 && G.phase !== "clear" && G.phase !== "sectionclear"; }
  function eshot(x, y, a, spd, o = {}) { G.eb.push(Object.assign({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: 6, k: "e_orb", dmg: 20, t: 0 }, o)); }
  function ring(x, y, n, spd, off = 0, o) { for (let i = 0; i < n; i++) eshot(x, y, off + (i * TAU) / n, spd, o); }
  function safeX(x, m, y = -40) { const l = G.leftAt(y) + m, r = G.rightAt(y) - m; return l > r ? (l + r) / 2 : U.clamp(x, l, r); }
  const S = () => G.speed;

  const ED = (G.ED = {
    tribug: {
      hp: 14, rx: 16, ry: 22, score: 100, spr: "tribug",
      init(e) { e.x0 = e.x; e.ph = e.ph || 0; e.vy = 130 + U.rand(0, 30); },
      update(e, dt) { e.y += e.vy * dt; e.x = e.x0 + Math.sin(e.t * 2 + e.ph) * 50; e.ang = -Math.cos(e.t * 2 + e.ph) * 0.35; },
    },
    ammo: {
      hp: 22, rx: 21, ry: 21, score: 200, spr: "ammo",
      init(e) { e.x0 = e.x; e.fireT = U.rand(1, 2.5); },
      update(e, dt) {
        e.y += 100 * dt; e.x = e.x0 + Math.cos(e.t * 1.8) * 70; e.ang += dt * 2.5;
        e.fireT -= dt; if (e.fireT <= 0) { e.fireT = 2.6; if (canShoot(e)) { eshot(e.x, e.y, aim(e), 230 * G.bmul()); A.sfx("eshot"); } }
      },
    },
    jelly: {
      hp: 30, rx: 23, ry: 20, score: 300, spr: "jelly",
      init(e) { e.x0 = e.x; e.fireT = U.rand(1, 2); },
      update(e, dt) {
        e.y += (55 + Math.max(0, Math.sin(e.t * 3)) * 60) * dt; e.x = e.x0 + Math.sin(e.t * 0.9) * 40;
        e.fireT -= dt; if (e.fireT <= 0) { e.fireT = 2.4; if (canShoot(e)) { ring(e.x, e.y, 8 + G.run.level * 2, 160 * G.bmul(), e.t, { k: "e_acid" }); A.sfx("eshot"); } }
      },
      draw(ctx, e, white) {
        ctx.strokeStyle = "rgba(160,255,240,0.5)"; ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) { const x0 = e.x - 16 + i * 8; ctx.beginPath(); ctx.moveTo(x0, e.y + 8); for (let k = 1; k <= 4; k++) ctx.lineTo(x0 + Math.sin(e.t * 4 + i + k) * 4, e.y + 8 + k * 8); ctx.stroke(); }
        const pul = 1 + Math.sin(e.t * 5) * 0.06;
        ctx.save(); ctx.translate(e.x, e.y); ctx.scale(pul, 1 / pul); Gfx.draw(ctx, "jelly", 0, 0, 0, 1, white); ctx.restore();
      },
    },
    fly: {
      hp: 8, rx: 16, ry: 16, score: 120, spr: "fly",
      init(e) { e.vx = e.dir * 330; e.vy = 30; },
      update(e, dt) {
        if (e.t < 0) { e.hidden = true; return; }
        if (e.hidden) { e.hidden = false; }
        e.vy += 300 * dt; e.vx *= 1 - 0.9 * dt;
        e.x += e.vx * dt; e.y += e.vy * dt;
        e.ang = Math.atan2(e.vy, e.vx) - Math.PI / 2;
      },
      draw(ctx, e, white) {
        Gfx.draw(ctx, "fly", e.x, e.y, e.ang, 1, white);
      },
    },
    spore: {
      hp: 26, rx: 18, ry: 18, score: 250, spr: "spore",
      init(e) { e.x0 = e.x; },
      update(e, dt) { e.y += 75 * dt; e.x = e.x0 + Math.sin(e.t * 1.4) * 30; e.ang += dt; },
      onDeath(e) { if (G.phase !== "bossdeath") for (let i = 0; i < 6; i++) spawn("sporelet", { x: e.x, y: e.y, a: (i * TAU) / 6, noStat: true }); },
    },
    sporelet: {
      hp: 3, rx: 7, ry: 7, score: 20, spr: "sporelet", noScale: true,
      init(e) { e.vx = Math.cos(e.a) * 160; e.vy = Math.sin(e.a) * 160; },
      update(e, dt) {
        if (e.t > 0.4 && e.t < 4 && !G.player.dead) { const a = aim(e); e.vx += Math.cos(a) * 220 * dt; e.vy += Math.sin(a) * 220 * dt; }
        const sp = Math.hypot(e.vx, e.vy); if (sp > 170) { e.vx *= 170 / sp; e.vy *= 170 / sp; }
        e.x += e.vx * dt; e.y += e.vy * dt;
      },
    },
    beetle: {
      hp: 110, rx: 30, ry: 26, score: 1200, spr: "beetle", drop: "item",
      init(e) { e.ty = U.rand(110, 210); e.fireT = 1.5; e.x0 = e.x; },
      update(e, dt) {
        if (e.t < 9) { e.y += (e.ty - e.y) * Math.min(1, dt * 1.3); e.x = safeX(e.x0 + Math.sin(e.t * 0.8) * 160, 40, e.y); }
        else e.y += 140 * dt;
        e.fireT -= dt;
        if (e.fireT <= 0) { e.fireT = 1.6 / G.bmul(); if (canShoot(e)) { const a = aim(e); for (let k = -1; k <= 1; k++) eshot(e.x, e.y + 26, a + k * 0.16, 250 * G.bmul()); A.sfx("eshot2"); } }
      },
    },
    worm: {
      hp: 12, rx: 13, ry: 13, score: 120, spr: "wormseg",
      init(e) { e.x0 = e.x; e.amp = Math.min(130, (G.rightAt(0) - G.leftAt(0)) / 2 - 50); e.fireT = 1.4; if (e.idx === 0) { e.spr = "wormhead"; e.rx = 18; e.ry = 18; } },
      update(e, dt) {
        if (e.t < 0) { e.hidden = true; return; }
        e.hidden = false;
        e.y = -40 + 150 * e.t; e.x = e.x0 + Math.sin(e.t * 2.6) * e.amp;
        if (e.idx === 0) { e.fireT -= dt; if (e.fireT <= 0) { e.fireT = 1.4; if (canShoot(e)) { eshot(e.x, e.y + 16, aim(e), 260 * G.bmul()); A.sfx("eshot"); } } }
      },
    },
    eye: {
      hp: 40, rx: 18, ry: 18, score: 400, spr: "eye", anchored: true,
      init(e) { e.w0 = G.dist + PH + 40; e.fireT = 1.2; place(e); },
      update(e, dt) {
        place(e);
        e.fireT -= dt;
        if (e.fireT <= 0) { e.fireT = 1.8 / G.bmul(); if (canShoot(e)) { eshot(e.x, e.y, aim(e), 270 * G.bmul()); A.sfx("eshot"); } }
      },
      draw(ctx, e, white) {
        Gfx.draw(ctx, "eye", e.x, e.y, 0, 1, white);
        const a = aim(e);
        ctx.fillStyle = "#3a0a0a"; ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * 6, e.y + Math.sin(a) * 6, 6, 0, TAU); ctx.fill();
        ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * 7, e.y + Math.sin(a) * 7, 3, 0, TAU); ctx.fill();
      },
    },
    egg: {
      hp: 60, rx: 32, ry: 26, score: 300, spr: "egg", anchored: true, coins: 4,
      init(e) { e.w0 = G.dist + PH + 40; },
      update(e) { e.y = PH - (e.w0 - G.dist); },
    },
    nautilus: {
      hp: 260, rx: 44, ry: 44, score: 2500, spr: "nautilus", drop: "power", coins: 8,
      init(e) { e.ty = U.rand(140, 200); e.fireT = 1.5; e.x0 = e.x; },
      update(e, dt) {
        if (e.t < 11) { e.y += (e.ty - e.y) * Math.min(1, dt); e.x = safeX(e.x0 + Math.sin(e.t * 0.6) * 120, 60, e.y); }
        else e.y += 110 * dt;
        e.fireT -= dt;
        if (e.fireT <= 0) { e.fireT = 2.2 / G.bmul(); if (canShoot(e)) { ring(e.x, e.y + 20, 14, 180 * G.bmul(), e.t, { k: "e_fire" }); A.sfx("eshot2"); } }
        if (Math.floor(e.t * 1.3) !== Math.floor((e.t - dt) * 1.3) && canShoot(e)) { const a = aim(e); for (let k = -2; k <= 2; k++) eshot(e.x, e.y + 40, a + k * 0.12, 260 * G.bmul()); }
      },
    },
    darter: {
      hp: 6, rx: 10, ry: 20, score: 150, spr: "darter",
      init(e) { const p = G.player; const a = Math.atan2(p.y - e.y, p.x - e.x); e.vx = Math.cos(a) * 140; e.vy = 520 * G.bmul(); e.ang = -e.vx / 1200; },
      update(e, dt) { e.x += e.vx * dt; e.y += e.vy * dt; if (Math.random() < 0.5) Fx.glow(e.x, e.y - 22, 4, 9, "255,140,60", 0.25); },
    },
    bubble: {
      hp: 12, rx: 18, ry: 18, score: 200, spr: "bubble", drop: "item",
      init(e) { e.x0 = e.x; },
      update(e, dt) { e.y += 60 * dt; e.x = e.x0 + Math.sin(e.t * 2) * 30; },
      draw(ctx, e, white) {
        const k = ["p_power", "p_weapon", "p_health", "p_speed"][e.id % 4];
        Gfx.draw(ctx, k, e.x, e.y, 0, 0.8);
        Gfx.draw(ctx, "bubble", e.x, e.y, 0, 1 + Math.sin(e.t * 4) * 0.04, white);
      },
    },
    guard: {
      hp: 80, rx: 20, ry: 20, score: 600, spr: "spore", noScale: true,
      init(e) { e.fireT = U.rand(1.5, 3.5); },
      update(e, dt) { e.ang += dt * 2; e.fireT -= dt; if (e.fireT <= 0) { e.fireT = U.rand(2.2, 3.6); if (canShoot(e)) { eshot(e.x, e.y, aim(e), 230, { k: "e_acid" }); A.sfx("eshot"); } } },
    },
    arm: {
      hp: 450, rx: 34, ry: 34, score: 3000, spr: null, noScale: true,
      init(e) { e.fireT = 1.5; },
      update(e, dt) {
        e.fireT -= dt;
        if (e.fireT <= 0) { e.fireT = 1.4; if (canShoot(e)) { const a = aim(e); for (let k = -1; k <= 1; k++) eshot(e.x, e.y + 30, a + k * 0.14, 280, { k: "e_violet" }); A.sfx("eshot2"); } }
      },
      draw(ctx, e, white) {
        const a = aim(e);
        ctx.save(); ctx.translate(e.x, e.y);
        const gr = ctx.createRadialGradient(-8, -8, 4, 0, 0, 36);
        gr.addColorStop(0, white ? "#fff" : "#c8c8e0"); gr.addColorStop(0.6, white ? "#fff" : "#5a5a78"); gr.addColorStop(1, "#1a1a2a");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.fill();
        ctx.rotate(a - Math.PI / 2);
        ctx.fillStyle = "#2a2a3a"; ctx.fillRect(-9, 10, 18, 40);
        ctx.fillStyle = "#8a8aa8"; ctx.fillRect(-11, 44, 22, 8);
        ctx.restore();
        ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,90,220", e.x, e.y, 22, 0.8, true); ctx.globalCompositeOperation = "source-over";
      },
    },
  });

  function place(e) {
    e.y = PH - (e.w0 - G.dist);
    if (e.side === "R") e.x = Math.min(PW - 22, G.rightAt(e.y) + 4);
    else e.x = Math.max(22, G.leftAt(e.y) - 4);
  }

  function spawn(type, o = {}) {
    const d = ED[type];
    const e = Object.assign({ type, x: PW / 2, y: -40, vx: 0, vy: 0, t: 0, ang: 0, flash: 0, dead: false, hidden: false, spr: d.spr }, o);
    e.rx = d.rx; e.ry = d.ry;
    e.hp = d.hp * (d.noScale ? 1 : G.hpMul());
    e.score = d.score;
    if (!d.anchored && !d.free && o.x !== undefined && type !== "sporelet" && type !== "fly" && type !== "guard" && type !== "arm") e.x = safeX(o.x, e.rx + 16, e.y);
    if (d.init) d.init(e);
    G.enemies.push(e);
    if (!o.noStat) G.stats.spawned++;
    return e;
  }
  G.spawn = spawn;

  function damageEnemy(e, dmg, x, y, quiet) {
    if (e.dead || e.hidden) return;
    e.hp -= dmg;
    e.flash = 0.07;
    if (e.hp <= 0) killEnemy(e, true);
    else if (!quiet) { Fx.hitSpark(x, y, "255,230,160", 2); A.sfx("hit"); }
  }

  function killEnemy(e, byPlayer) {
    if (e.dead) return;
    e.dead = true;
    const d = ED[e.type], size = Math.max(e.rx, e.ry);
    Fx.explode(e.x, e.y, size * 1.3);
    A.sfx(size > 30 ? "boomBig" : "boom");
    if (byPlayer) {
      G.addScore(e.score, e.x, e.y);
      G.stats.killed++; G.run.kills++;
      if (d.drop === "power") drop(e.x, e.y, "power");
      else if (d.drop === "item") drop(e.x, e.y, U.pick(["power", "weapon", "health", "speed", "weapon", "bomb", "power", "over"]));
      const coins = d.coins || (Math.random() < 0.45 ? 1 : 0);
      for (let i = 0; i < coins; i++) drop(e.x + U.rand(-16, 16), e.y + U.rand(-16, 16), "coin");
      if (e.group) {
        const g = G.groups[e.group];
        g.killed++;
        if (g.killed === g.n) {
          G.addScore(1000);
          Fx.text(e.x, e.y - 20, "WAVE BONUS", "120,255,200", 18);
          for (let i = 0; i < 3; i++) drop(e.x + U.rand(-20, 20), e.y, "coin");
          if (Math.random() < 0.4) drop(e.x, e.y, U.pick(["power", "weapon"]));
          A.sfx("pickup");
        }
      }
    }
    if (d.onDeath) d.onDeath(e);
  }

  /* ---------- Pickups ---------- */
  function drop(x, y, kind) { G.pickups.push({ kind, x, y, vx: U.rand(-50, 50), vy: U.rand(-90, -30), t: 0 }); }
  const PSPR = { coin: "coin", power: "p_power", weapon: "p_weapon", health: "p_health", speed: "p_speed", over: "p_over", bomb: "p_bomb", life: "p_life" };

  function giveRandomWeapon(x, y) {
    const r = G.run;
    const opts = ["side", "rear", "cannon", "laser", "homing", "electro", "drone", "mines", "zapper", "rapid"].filter((k) => r.w[k] < G.WMAX[k]);
    if (!opts.length) { G.addScore(3000, x, y); return "Bonus"; }
    const k = U.pick(opts);
    r.w[k]++;
    Fx.text(x, y - 24, G.WNAME[k].toUpperCase() + (r.w[k] > 1 ? " " + r.w[k] : ""), "255,150,240", 16);
    return G.WNAME[k] + (r.w[k] > 1 ? " level " + r.w[k] : "");
  }

  function pickupsUpdate(dt) {
    const p = G.player, r = G.run;
    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const k = G.pickups[i];
      k.t += dt;
      const d2 = p.dead ? 1e9 : U.dist2(k.x, k.y, p.x, p.y);
      if (d2 < (k.kind === "coin" ? 150 : 90) ** 2) { const a = Math.atan2(p.y - k.y, p.x - k.x); k.vx += Math.cos(a) * 1600 * dt; k.vy += Math.sin(a) * 1600 * dt; k.vx *= 0.92; k.vy *= 0.92; }
      else { k.vx *= 0.97; k.vy += (S() + 20 - k.vy) * dt * 2; }
      k.x += k.vx * dt; k.y += k.vy * dt;
      if (d2 < 32 * 32) {
        G.pickups.splice(i, 1);
        switch (k.kind) {
          case "coin": r.credits += 150; G.addScore(50); A.sfx("credit"); break;
          case "power": if (r.w.main < 5) { r.w.main++; Fx.text(k.x, k.y - 20, "POWER UP", "255,190,90", 16); A.say(r.w.main === 5 ? "Maximum power!" : "Power up!"); } else { G.addScore(2000, k.x, k.y); A.say("Bonus"); } A.sfx("power"); break;
          case "weapon": A.say(giveRandomWeapon(k.x, k.y)); A.sfx("power"); break;
          case "health": r.energy = Math.min(G.maxEnergy(), r.energy + 40); Fx.text(k.x, k.y - 20, "HEALTH", "120,255,160", 14); A.sfx("pickup"); A.say("Health"); break;
          case "speed": if (r.w.speed < 3) { r.w.speed++; Fx.text(k.x, k.y - 20, "SPEED UP", "120,220,255", 14); A.say("Speed up!"); } else { G.addScore(1000, k.x, k.y); A.say("Bonus"); } A.sfx("pickup"); break;
          case "over": G.over = Math.max(G.over, 15); Fx.text(k.x, k.y - 20, "OVERDRIVE!", "255,240,120", 20); A.sfx("overdrive"); A.say("Overdrive!", { pitch: 0.8 }); break;
          case "bomb": if (r.bombs < 5) r.bombs++; Fx.text(k.x, k.y - 20, "BOMB", "220,220,255", 14); A.sfx("pickup"); A.say("Smart bomb"); break;
          case "life": if (r.lives < 9) r.lives++; A.sfx("extra"); A.say("Extra life!"); break;
        }
        continue;
      }
      if (k.y > PH + 40 || k.t > 18) G.pickups.splice(i, 1);
    }
  }

  /* ---------- Attack patterns ---------- */
  function q(delay, fn) { G.queue.push({ at: G.t + delay, fn }); }
  let groupId = 0, bubbleId = 0;
  function group(n) { const id = ++groupId; G.groups[id] = { n, killed: 0 }; return id; }
  const rx = () => U.rand(G.leftAt(-40) + 60, G.rightAt(-40) - 60);
  const PAT = {
    bugs: { dur: 4.5, run() { const x = rx(); for (let i = 0; i < 6; i++) q(i * 0.32, () => spawn("tribug", { x, ph: i * 0.5 })); } },
    ammos: { dur: 4.5, run() { for (let i = 0; i < 4; i++) q(i * 0.7, () => spawn("ammo", { x: rx() })); } },
    jellies: { dur: 5, run() { for (let i = 0; i < 3; i++) q(i * 0.9, () => spawn("jelly", { x: rx() })); } },
    flies: {
      dur: 4.5, run() {
        const dir = Math.random() < 0.5 ? 1 : -1, id = group(7), y = U.rand(40, 140);
        for (let i = 0; i < 7; i++) spawn("fly", { x: dir > 0 ? -30 : PW + 30, y, dir, t: -i * 0.16, group: id });
      },
    },
    spores: { dur: 4.5, run() { for (let i = 0; i < 3; i++) q(i * 1.0, () => spawn("spore", { x: rx() })); } },
    beetle: { dur: 6, run() { spawn("beetle", { x: rx() }); if (G.run.level >= 2) q(2.5, () => spawn("beetle", { x: rx() })); } },
    worm: { dur: 5, run() { const id = group(9), x = PW / 2 + U.rand(-60, 60); for (let i = 0; i < 9; i++) spawn("worm", { x, t: -i * 0.11, group: id, idx: i }); } },
    eyes: { dur: 5, run() { for (let i = 0; i < 4; i++) q(i * 0.9, () => spawn("eye", { side: i % 2 ? "R" : "L" })); q(1, () => PAT.bugs.run()); } },
    eggs: { dur: 5, run() { for (let i = 0; i < 3; i++) q(i * 1.1, () => spawn("egg", { x: rx() })); q(1.5, () => { for (let i = 0; i < 3; i++) q(i * 0.5, () => spawn("darter", { x: rx() })); }); } },
    nautilus: { dur: 9, run() { spawn("nautilus", { x: PW / 2 }); q(3, () => PAT.flies.run()); } },
    darters: { dur: 4, run() { for (let i = 0; i < 5 + G.run.level; i++) q(i * 0.45, () => spawn("darter", { x: rx() })); } },
    bubbles: { dur: 4, run() { for (let i = 0; i < 2; i++) q(i * 1.2, () => spawn("bubble", { x: rx(), id: bubbleId++ })); q(0.5, () => PAT.bugs.run()); } },
  };

  /* ---------- Bosses ---------- */
  function bossBase(o) { return Object.assign({ x: PW / 2, y: -200, t: 0, flash: 0, atk: -1, atkT: 0, n: 0, nt: 0, cool: 2.5, step: 0, entered: false, dying: false, vulnMul: 1 }, o); }
  const circHit = (c, x, y, r) => U.dist2(c.x, c.y, x, y) < (c.r + r) ** 2;
  const ellHit = (c, x, y, r) => { const dx = (x - c.x) / (c.rx + r), dy = (y - c.y) / (c.ry + r); return dx * dx + dy * dy < 1; };
  function endAtk(b, cool) { b.atk = -1; b.cool = cool; }
  function startAtk(b, n) { b.atk = b.step++ % n; b.atkT = 0; b.n = 0; b.nt = 0; }
  function enter(b, dt, ty) { if (!b.entered) { b.y += (ty - b.y) * Math.min(1, dt * 1.1); if (b.y > ty - 6) { b.entered = true; A.sfx("roar"); } } }
  function beamHit(x, y, a) {
    const p = G.player, dx = p.x - x, dy = p.y - y;
    const along = dx * Math.cos(a) + dy * Math.sin(a), perp = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));
    if (along > 0 && perp < 20) G.hurt(30);
  }
  function drawBeam(ctx, x, y, a, on, t) {
    const ex = x + Math.cos(a) * 1200, ey = y + Math.sin(a) * 1200;
    ctx.globalCompositeOperation = "lighter";
    if (on) {
      for (const [w, col] of [[44, "rgba(255,60,120,0.25)"], [20, "rgba(255,160,180,0.6)"], [7, "rgba(255,255,255,0.95)"]]) {
        ctx.strokeStyle = col; ctx.lineWidth = w * (0.9 + Math.random() * 0.2);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
      }
      Gfx.glowAt(ctx, "255,180,200", x, y, 60, 0.9, true);
    } else {
      ctx.strokeStyle = `rgba(255,120,160,${0.3 + 0.3 * Math.sin(t * 30)})`; ctx.lineWidth = 2;
      ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  const BOSSES = {
    ammonex() {
      const b = bossBase({ name: "AMMONEX", hp: 2400, maxHp: 2400, bonus: 25000 });
      b.eye = () => ({ x: b.x, y: b.y + 92, r: 26 });
      b.target = b.eye;
      b.bounds = () => ({ x: b.x, y: b.y, rx: 110, ry: 100 });
      b.test = (x, y, r) => circHit(b.eye(), x, y, r) ? "weak" : circHit({ x: b.x, y: b.y, r: 110 }, x, y, r) ? "armor" : null;
      b.touch = (p) => circHit({ x: b.x, y: b.y, r: 105 }, p.x, p.y, 6);
      b.update = (dt) => {
        b.t += dt; enter(b, dt, 140);
        if (b.entered) b.x = PW / 2 + Math.sin(b.t * 0.5) * 150;
        if (b.dying || !b.entered) return;
        const P2 = b.hp < b.maxHp / 2, E = b.eye();
        if (b.atk < 0) { b.cool -= dt; if (b.cool <= 0) startAtk(b, P2 ? 4 : 3); return; }
        b.atkT += dt; b.nt -= dt;
        if (b.atk === 0) {
          if (b.nt <= 0) { b.nt = P2 ? 0.06 : 0.08; const a = b.atkT * 3; eshot(E.x, E.y, a, 200, { k: "e_acid" }); eshot(E.x, E.y, a + Math.PI, 200, { k: "e_acid" }); A.sfx("eshot"); }
          if (b.atkT > 3) endAtk(b, 1.2);
        } else if (b.atk === 1) {
          if (b.nt <= 0) { b.nt = 0.6; b.n++; const a = Math.atan2(G.player.y - E.y, G.player.x - E.x); for (let k = -4; k <= 4; k++) eshot(E.x, E.y, a + k * 0.14, 250); A.sfx("eshot2"); if (b.n >= 3) endAtk(b, 1.2); }
        } else if (b.atk === 2) {
          if (b.nt <= 0) { b.nt = 0.45; b.n++; spawn("ammo", { x: b.x + (b.n % 2 ? -90 : 90), y: b.y + 60, noStat: true }); if (b.n >= 4) endAtk(b, 1.0); }
        } else {
          if (b.nt <= 0) { b.nt = 0.5; b.n++; ring(E.x, E.y, 20, 190, b.n * 0.16, { k: "e_fire" }); A.sfx("eshot2"); if (b.n >= 3) endAtk(b, 1.0); }
        }
      };
      b.draw = (ctx) => {
        // tentacles
        ctx.lineCap = "round";
        for (let i = 0; i < 8; i++) {
          const x0 = b.x - 70 + i * 20;
          ctx.strokeStyle = i % 2 ? "#a03a50" : "#c04a5a"; ctx.lineWidth = 12 - Math.abs(i - 3.5) * 1.5;
          ctx.beginPath(); ctx.moveTo(x0, b.y + 70);
          for (let k = 1; k <= 6; k++) ctx.lineTo(x0 + Math.sin(b.t * 2.5 + i + k * 0.7) * k * 5, b.y + 70 + k * 26);
          ctx.stroke();
        }
        // shell
        let gr = ctx.createRadialGradient(b.x - 30, b.y - 40, 10, b.x, b.y, 120);
        gr.addColorStop(0, "#fff0d8"); gr.addColorStop(0.5, "#d08850"); gr.addColorStop(1, "#4a1c08");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(b.x, b.y, 110, 0, TAU); ctx.fill();
        ctx.strokeStyle = "rgba(70,25,5,0.85)"; ctx.lineWidth = 3;
        ctx.beginPath(); for (let a = 0; a < Math.PI * 6; a += 0.08) { const r = 4 + a * 5.6; const x = b.x + Math.cos(a + b.t * 0.3) * r, y = b.y + Math.sin(a + b.t * 0.3) * r; if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
        ctx.strokeStyle = "rgba(255,230,190,0.35)"; ctx.lineWidth = 2;
        for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU + b.t * 0.3; ctx.beginPath(); ctx.moveTo(b.x + Math.cos(a) * 60, b.y + Math.sin(a) * 60); ctx.lineTo(b.x + Math.cos(a) * 106, b.y + Math.sin(a) * 106); ctx.stroke(); }
        // eye
        const E = b.eye();
        ctx.fillStyle = "#2a0a08"; ctx.beginPath(); ctx.arc(E.x, E.y, E.r + 8, 0, TAU); ctx.fill();
        gr = ctx.createRadialGradient(E.x - 5, E.y - 5, 2, E.x, E.y, E.r);
        gr.addColorStop(0, b.flash > 0 ? "#fff" : "#f0fff0"); gr.addColorStop(0.5, b.flash > 0 ? "#fff" : "#40e0a0"); gr.addColorStop(1, "#063a2a");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(E.x, E.y, E.r, 0, TAU); ctx.fill();
        const pa = Math.atan2(G.player.y - E.y, G.player.x - E.x);
        ctx.fillStyle = "#020a06"; ctx.beginPath(); ctx.ellipse(E.x + Math.cos(pa) * 9, E.y + Math.sin(pa) * 9, 5, 11, pa, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "80,255,180", E.x, E.y, 70, 0.4); ctx.globalCompositeOperation = "source-over";
      };
      return b;
    },

    ossarius() {
      const b = bossBase({ name: "OSSARIUS", hp: 3000, maxHp: 3000, bonus: 35000, jaw: 0, beams: null });
      b.eyes = () => [{ x: b.x - 52, y: b.y - 4, r: 24 }, { x: b.x + 52, y: b.y - 4, r: 24 }];
      b.target = () => b.eyes()[G.t % 2 < 1 ? 0 : 1];
      b.bounds = () => ({ x: b.x, y: b.y, rx: 140, ry: 110 });
      b.test = (x, y, r) => {
        for (const e of b.eyes()) if (circHit(e, x, y, r)) return "weak";
        return ellHit({ x: b.x, y: b.y - 60, rx: 150, ry: 70 }, x, y, r) ? "armor" : null;
      };
      b.touch = (p) => ellHit({ x: b.x, y: b.y + 10, rx: 140, ry: 115 }, p.x, p.y, 6);
      b.update = (dt) => {
        b.t += dt; enter(b, dt, 150);
        if (b.entered) b.x = PW / 2 + Math.sin(b.t * 0.4) * 120;
        b.jaw = U.lerp(b.jaw, b.jawT || 0, Math.min(1, dt * 8));
        if (b.dying || !b.entered) return;
        const P2 = b.hp < b.maxHp / 2;
        if (b.atk < 0) { b.cool -= dt; b.jawT = 0; if (b.cool <= 0) startAtk(b, P2 ? 4 : 3); return; }
        b.atkT += dt; b.nt -= dt;
        if (b.atk === 0) {
          b.jawT = 1;
          if (b.atkT > 0.4 && b.nt <= 0) { b.nt = 0.5; b.n++; const mx = b.x, my = b.y + 110, a0 = Math.atan2(G.player.y - my, G.player.x - mx); for (let k = 0; k < 11; k++) eshot(mx, my, a0 - 0.8 + k * 0.16, 240, { k: "e_bone", r: 6, spin: 1 }); A.sfx("eshot2"); if (b.n >= 3) endAtk(b, 1.2); }
        } else if (b.atk === 1) {
          if (!b.beams) { b.beams = b.eyes().map((e) => ({ x: e.x, y: e.y, a: Math.atan2(G.player.y - e.y, G.player.x - e.x) + (e.x < b.x ? -0.12 : 0.12) })); A.sfx("charge"); }
          b.beams.forEach((bm, i) => { const e = b.eyes()[i]; bm.x = e.x; bm.y = e.y; });
          if (b.atkT > 1.0) {
            if (!b.beamOn) { b.beamOn = true; A.sfx("beam"); Fx.shake = 8; }
            for (const bm of b.beams) { bm.a += U.clamp(U.angDiff(Math.atan2(G.player.y - bm.y, G.player.x - bm.x), bm.a), -0.35 * dt, 0.35 * dt); beamHit(bm.x, bm.y, bm.a); }
          }
          if (b.atkT > 2.4) { b.beams = null; b.beamOn = false; endAtk(b, 1.2); }
        } else if (b.atk === 2) {
          if (b.n === 0) { b.n = 1; PAT.flies.run(); q(0.8, () => PAT.flies.run()); }
          if (b.atkT > 1.5) endAtk(b, 1.0);
        } else {
          b.jawT = 1;
          if (b.nt <= 0) { b.nt = 0.45; b.n++; ring(b.x, b.y + 100, 18, 200, b.n * 0.17, { k: "e_bone", r: 6, spin: 1 }); A.sfx("eshot2"); if (b.n >= 3) endAtk(b, 1.0); }
        }
      };
      b.draw = (ctx) => {
        const x = b.x, y = b.y;
        // jaw
        ctx.save(); ctx.translate(x, y + 60 + b.jaw * 34);
        ctx.fillStyle = "#d8c8a0"; ctx.beginPath(); ctx.moveTo(-90, 0); ctx.quadraticCurveTo(0, 90, 90, 0); ctx.lineTo(70, 10); ctx.quadraticCurveTo(0, 60, -70, 10); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#fff8e0"; for (let i = 0; i < 8; i++) { const tx = -60 + i * 17; ctx.beginPath(); ctx.moveTo(tx, 14 + Math.abs(i - 3.5) * -2); ctx.lineTo(tx + 6, -4); ctx.lineTo(tx + 12, 14 + Math.abs(i - 3.5) * -2); ctx.fill(); }
        ctx.restore();
        // cranium
        const gr = ctx.createRadialGradient(x - 40, y - 60, 10, x, y, 170);
        gr.addColorStop(0, "#fffaf0"); gr.addColorStop(0.5, "#d8c49a"); gr.addColorStop(1, "#5a4428");
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.ellipse(x, y - 10, 150, 115, 0, Math.PI * 0.95, Math.PI * 2.05); ctx.lineTo(x + 100, y + 70); ctx.quadraticCurveTo(x, y + 90, x - 100, y + 70); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(90,60,30,0.6)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 20, y - 120); ctx.lineTo(x - 10, y - 80); ctx.lineTo(x - 30, y - 50); ctx.moveTo(x + 60, y - 100); ctx.lineTo(x + 50, y - 70); ctx.stroke();
        // nose
        ctx.fillStyle = "#2a1a0c"; ctx.beginPath(); ctx.moveTo(x, y + 30); ctx.lineTo(x - 14, y + 58); ctx.lineTo(x + 14, y + 58); ctx.fill();
        // eyes
        for (const e of b.eyes()) {
          ctx.fillStyle = "#1a0e06"; ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r + 10, e.r + 6, 0, 0, TAU); ctx.fill();
          ctx.globalCompositeOperation = "lighter";
          Gfx.glowAt(ctx, b.flash > 0 ? "255,255,255" : "255,90,40", e.x, e.y, e.r * 1.6, 0.9, true);
          ctx.globalCompositeOperation = "source-over";
        }
        if (b.beams) for (const bm of b.beams) drawBeam(ctx, bm.x, bm.y, bm.a, b.beamOn, b.t);
      };
      return b;
    },

    venombloom() {
      const b = bossBase({ name: "VENOMBLOOM", hp: 3400, maxHp: 3400, bonus: 45000, guards: [], respawned: false, lane: null });
      b.core = () => ({ x: b.x, y: b.y, r: 44 });
      b.target = b.core;
      b.bounds = () => ({ x: b.x, y: b.y, rx: 130, ry: 120 });
      b.test = (x, y, r) => (circHit(b.core(), x, y, r) ? "weak" : null);
      b.touch = (p) => circHit({ x: b.x, y: b.y, r: 85 }, p.x, p.y, 6);
      function guards(n) { for (let i = 0; i < n; i++) b.guards.push(spawn("guard", { x: b.x, y: b.y, gi: i, gn: n, noStat: true })); }
      b.update = (dt) => {
        b.t += dt; enter(b, dt, 170);
        if (b.entered && !b.guards.length && !b.started) { b.started = true; guards(6); }
        if (b.entered) b.x = PW / 2 + Math.sin(b.t * 0.35) * 110;
        b.guards = b.guards.filter((e) => !e.dead);
        for (const e of b.guards) { const a = b.t * 0.6 + (e.gi * TAU) / e.gn; e.x = b.x + Math.cos(a) * 130; e.y = b.y + Math.sin(a) * 110; }
        b.vulnMul = b.guards.length >= 3 ? 0.2 : 1;
        if (b.dying || !b.entered) return;
        const P2 = b.hp < b.maxHp / 2;
        if (P2 && !b.respawned) { b.respawned = true; guards(4); A.sfx("roar"); }
        if (b.atk < 0) { b.cool -= dt; if (b.cool <= 0) startAtk(b, P2 ? 4 : 3); return; }
        b.atkT += dt; b.nt -= dt;
        if (b.atk === 0) {
          if (b.nt <= 0) { b.nt = 0.07; const a = b.atkT * 2.6; for (let k = 0; k < 3; k++) eshot(b.x, b.y, a + (k * TAU) / 3, 190, { k: "e_acid" }); A.sfx("eshot"); }
          if (b.atkT > 2.8) endAtk(b, 1.2);
        } else if (b.atk === 1) {
          if (!b.lane) { b.lane = { x: G.player.x, on: false }; A.sfx("charge"); }
          if (b.atkT > 0.9 && !b.lane.on) { b.lane.on = true; A.sfx("roar"); Fx.shake = 14; }
          if (b.lane.on && !G.player.dead && Math.abs(G.player.x - b.lane.x) < 34) G.hurt(35);
          if (b.atkT > 1.5) { b.lane = null; b.n++; if (b.n >= (P2 ? 3 : 2)) endAtk(b, 1.0); else { b.atkT = 0; } }
        } else if (b.atk === 2) {
          if (b.nt <= 0) { b.nt = 0.6; b.n++; spawn("spore", { x: b.x + U.rand(-120, 120), y: b.y + 60, noStat: true }); if (b.n >= 3) endAtk(b, 1.2); }
        } else {
          if (b.nt <= 0) { b.nt = 0.4; b.n++; const a = Math.atan2(G.player.y - b.y, G.player.x - b.x); for (let k = -3; k <= 3; k++) eshot(b.x, b.y + 40, a + k * 0.12, 260, { k: "e_acid" }); A.sfx("eshot2"); if (b.n >= 4) endAtk(b, 1.0); }
        }
      };
      b.draw = (ctx) => {
        const x = b.x, y = b.y;
        if (b.lane) {
          if (b.lane.on) {
            ctx.fillStyle = "#2a5a12"; ctx.fillRect(b.lane.x - 30, 0, 60, PH);
            ctx.strokeStyle = "#7ac83a"; ctx.lineWidth = 6;
            for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(b.lane.x + k * 16, 0); for (let yy = 0; yy < PH; yy += 40) ctx.lineTo(b.lane.x + k * 16 + Math.sin(yy * 0.05 + b.t * 20) * 8, yy); ctx.stroke(); }
          } else {
            ctx.fillStyle = `rgba(160,255,80,${0.12 + 0.1 * Math.sin(b.t * 30)})`; ctx.fillRect(b.lane.x - 30, 0, 60, PH);
          }
        }
        // stem and leaves
        ctx.strokeStyle = "#2a6a1a"; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 40, y - 120, x, y - 260); ctx.stroke();
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * TAU + Math.sin(b.t + i) * 0.05;
          ctx.save(); ctx.translate(x, y); ctx.rotate(a);
          const gr = ctx.createLinearGradient(0, 0, 0, 120);
          gr.addColorStop(0, "#ffe060"); gr.addColorStop(0.4, "#e04080"); gr.addColorStop(1, "#5a0a3a");
          ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, 30); ctx.quadraticCurveTo(46, 80, 0, 125 + Math.sin(b.t * 2 + i) * 6); ctx.quadraticCurveTo(-46, 80, 0, 30); ctx.fill();
          ctx.restore();
        }
        const gr = ctx.createRadialGradient(x - 10, y - 10, 4, x, y, 60);
        gr.addColorStop(0, b.flash > 0 ? "#fff" : "#fff8c0"); gr.addColorStop(0.4, b.flash > 0 ? "#fff" : "#a0e020"); gr.addColorStop(1, "#1a3a04");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 50, 0, TAU); ctx.fill();
        ctx.fillStyle = "#0a1404"; ctx.beginPath(); ctx.ellipse(x, y + 6, 22, 10 + Math.abs(Math.sin(b.t * 3)) * 10, 0, 0, TAU); ctx.fill();
        if (b.vulnMul < 1) { ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = `rgba(200,255,150,${0.45 + 0.2 * Math.sin(b.t * 8)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 62, 0, TAU); ctx.stroke(); ctx.globalCompositeOperation = "source-over"; }
      };
      return b;
    },

    overmind() {
      const b = bossBase({ name: "OVERMIND", hp: 4400, maxHp: 4400, bonus: 70000, arms: [], beam: null });
      b.brain = () => ({ x: b.x, y: b.y + 20, r: 50 });
      b.target = b.brain;
      b.bounds = () => ({ x: b.x, y: b.y, rx: 150, ry: 100 });
      b.test = (x, y, r) => circHit(b.brain(), x, y, r) ? "weak" : ellHit({ x: b.x, y: b.y - 30, rx: 140, ry: 68 }, x, y, r) ? "armor" : null;
      b.touch = (p) => ellHit({ x: b.x, y: b.y, rx: 135, ry: 90 }, p.x, p.y, 6);
      b.update = (dt) => {
        b.t += dt; enter(b, dt, 150);
        if (b.entered && !b.armsMade) { b.armsMade = true; b.arms = [spawn("arm", { x: b.x - 180, y: b.y + 40, noStat: true, side: -1 }), spawn("arm", { x: b.x + 180, y: b.y + 40, noStat: true, side: 1 })]; }
        if (b.entered) b.x = PW / 2 + Math.sin(b.t * 0.45) * 70;
        b.arms = b.arms.filter((e) => !e.dead);
        for (const e of b.arms) { e.x = b.x + e.side * (180 + Math.sin(b.t * 1.3) * 20); e.y = b.y + 40 + Math.cos(b.t * 1.1 + e.side) * 30; }
        b.vulnMul = b.arms.length ? 0.3 : 1;
        if (b.dying || !b.entered) return;
        const P2 = b.hp < b.maxHp / 2, B = b.brain();
        if (b.atk < 0) { b.cool -= dt; if (b.cool <= 0) startAtk(b, 4); return; }
        b.atkT += dt; b.nt -= dt;
        if (b.atk === 0) {
          if (b.nt <= 0) { b.nt = P2 ? 0.06 : 0.08; const a = b.atkT * 3.3; for (let k = 0; k < 3; k++) eshot(B.x, B.y, a + (k * TAU) / 3, 210, { k: "e_violet" }); A.sfx("eshot"); }
          if (b.atkT > 3) endAtk(b, 1.2);
        } else if (b.atk === 1) {
          if (!b.beam) { b.beam = { a: Math.atan2(G.player.y - B.y, G.player.x - B.x), on: false }; A.sfx("charge"); }
          if (b.atkT > 1 && !b.beam.on) { b.beam.on = true; A.sfx("beam"); Fx.shake = 10; }
          if (b.beam.on) { b.beam.a += U.clamp(U.angDiff(Math.atan2(G.player.y - B.y, G.player.x - B.x), b.beam.a), -0.5 * dt, 0.5 * dt); beamHit(B.x, B.y, b.beam.a); }
          if (b.atkT > (P2 ? 3 : 2.4)) { b.beam = null; endAtk(b, 1.2); }
        } else if (b.atk === 2) {
          if (b.nt <= 0) { b.nt = 0.35; b.n++; spawn("darter", { x: U.rand(80, PW - 80), y: -30, noStat: true }); if (b.n >= 6) endAtk(b, 1.0); }
        } else {
          if (b.nt <= 0) { b.nt = 0.45; b.n++; ring(B.x, B.y, 22, 200, b.n * 0.14, { k: "e_violet" }); A.sfx("eshot2"); if (b.n >= 3) endAtk(b, 1.0); }
        }
      };
      b.draw = (ctx) => {
        const x = b.x, y = b.y, B = b.brain();
        // arm cables
        ctx.strokeStyle = "#2a2a3e"; ctx.lineWidth = 14;
        for (const e of b.arms) { ctx.beginPath(); ctx.moveTo(x + e.side * 100, y + 10); ctx.quadraticCurveTo(x + e.side * 150, y - 40, e.x, e.y); ctx.stroke(); }
        // shell
        let gr = ctx.createLinearGradient(x - 150, 0, x + 150, 0);
        gr.addColorStop(0, "#1a1a2a"); gr.addColorStop(0.3, "#7a7a98"); gr.addColorStop(0.5, "#c8c8e0"); gr.addColorStop(0.7, "#6a6a88"); gr.addColorStop(1, "#14141e");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y, 145, 95, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = "rgba(255,110,230,0.5)"; ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) { const a = Math.PI + (i + 0.5) * Math.PI / 6; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 70, y + Math.sin(a) * 50); ctx.lineTo(x + Math.cos(a) * 140, y + Math.sin(a) * 92); ctx.stroke(); }
        for (let i = 0; i < 8; i++) Gfx.lamp(ctx, x - 112 + i * 32, y + 60 + Math.abs(i - 3.5) * -4, 3, i % 2 ? "255,90,220" : "120,220,255");
        // brain dome
        ctx.fillStyle = "rgba(160,220,255,0.25)"; ctx.beginPath(); ctx.arc(B.x, B.y, B.r + 14, 0, TAU); ctx.fill();
        gr = ctx.createRadialGradient(B.x - 14, B.y - 16, 4, B.x, B.y, B.r);
        gr.addColorStop(0, b.flash > 0 ? "#fff" : "#ffd0f0"); gr.addColorStop(0.5, b.flash > 0 ? "#fff" : "#e070c0"); gr.addColorStop(1, "#5a1048");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(B.x, B.y, B.r, 0, TAU); ctx.fill();
        ctx.strokeStyle = "rgba(90,10,60,0.7)"; ctx.lineWidth = 2.5;
        for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(B.x - 40 + i * 16, B.y - 30); ctx.bezierCurveTo(B.x - 50 + i * 16, B.y - 8, B.x - 30 + i * 16, B.y + 8, B.x - 40 + i * 16, B.y + 34); ctx.stroke(); }
        ctx.globalCompositeOperation = "lighter";
        Gfx.glowAt(ctx, "255,110,230", B.x, B.y, 100, 0.3 + 0.1 * Math.sin(b.t * 4));
        if (b.vulnMul < 1) { ctx.strokeStyle = `rgba(150,220,255,${0.45 + 0.2 * Math.sin(b.t * 8)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(B.x, B.y, B.r + 16, 0, TAU); ctx.stroke(); }
        ctx.globalCompositeOperation = "source-over";
        if (b.beam) drawBeam(ctx, B.x, B.y, b.beam.a, b.beam.on, b.t);
      };
      return b;
    },
  };

  function bossDamage(dmg, bomb) {
    const b = G.boss;
    if (!b || b.dying || !b.entered) return;
    b.hp -= dmg * (bomb ? 1 : b.vulnMul);
    b.flash = 0.06;
    if (b.hp <= 0) {
      b.hp = 0; b.dying = true; b.dieT = 0;
      setPhase("bossdeath");
      A.stopMusic(); A.sfx("roar");
      for (const e of G.enemies) killEnemy(e, false);
      for (const e of G.eb) Fx.glow(e.x, e.y, 8, 20, "255,220,180", 0.3);
      G.eb.length = 0;
    }
  }

  /* ---------- Update ---------- */
  function blast(x, y, rad, dmg) {
    Fx.explode(x, y, rad * 0.5, { rgb: "255,200,120" });
    A.sfx("boom");
    for (const e of G.enemies.slice()) if (!e.hidden && U.dist2(e.x, e.y, x, y) < (rad + e.rx) ** 2) damageEnemy(e, dmg, e.x, e.y);
    if (G.boss) { const r = G.boss.test(x, y, rad); if (r === "weak") bossDamage(dmg); else if (r) bossDamage(dmg * 0.25); }
  }

  function nearest(x, y) {
    let best = null, bd = 1e12;
    for (const e of G.enemies) { if (e.dead || e.hidden || e.y < -10) continue; const d = U.dist2(e.x, e.y, x, y); if (d < bd) { bd = d; best = e; } }
    if (!best && G.boss && G.boss.entered && !G.boss.dying) best = G.boss.target();
    return best;
  }

  function pbUpdate(dt) {
    for (let i = G.pb.length - 1; i >= 0; i--) {
      const b = G.pb[i];
      b.t += dt; b.life -= dt;
      if (b.k === "missile") {
        b.retarget -= dt;
        if (b.retarget <= 0) { b.target = nearest(b.x, b.y); b.retarget = 0.2; }
        let cur = Math.atan2(b.vy, b.vx);
        if (b.target && b.t > 0.12) cur += U.clamp(U.angDiff(Math.atan2(b.target.y - b.y, b.target.x - b.x), cur), -7 * dt, 7 * dt);
        else cur += U.clamp(U.angDiff(UP, cur), -3 * dt, 3 * dt);
        const sp = Math.min(760, Math.hypot(b.vx, b.vy) + 900 * dt);
        b.vx = Math.cos(cur) * sp; b.vy = Math.sin(cur) * sp;
        if (Math.random() < 0.6) Fx.add({ k: "smoke", x: b.x, y: b.y, vx: 0, vy: 20, size: 3, size2: 9, life: 0.45 });
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      let gone = b.life <= 0 || b.y < -60 || b.y > PH + 60 || b.x < -40 || b.x > PW + 40;
      if (!gone && (b.x < G.leftAt(b.y) || b.x > G.rightAt(b.y) || (G.obstacles.length && G.obstHit(b.x, b.y, 2)))) { gone = true; if (b.k === "missile") blast(b.x, b.y, 40, b.dmg); else Fx.hitSpark(b.x, b.y, "220,230,255", 2); }
      if (!gone) {
        for (const e of G.enemies) {
          if (e.dead || e.hidden) continue;
          const hit = hitE(e, b.x, b.y, b.r) || (b.len && hitE(e, b.x, b.y + b.len * 0.6, b.r));
          if (!hit) continue;
          if (b.pierce) {
            if (b.hits.has(e)) continue;
            b.hits.add(e); damageEnemy(e, b.dmg, b.x, b.y);
            if (--b.pierce <= 0) { gone = true; break; }
          } else {
            if (b.k === "missile") blast(b.x, b.y, 40, b.dmg); else damageEnemy(e, b.dmg, b.x, b.y);
            gone = true; break;
          }
        }
      }
      if (!gone && G.boss && !G.boss.dying) {
        const res = G.boss.test(b.x, b.y, b.r);
        if (res) {
          if (b.k === "missile") blast(b.x, b.y, 40, b.dmg);
          else if (res === "weak") { bossDamage(b.dmg); Fx.hitSpark(b.x, b.y, "255,240,200", 3); A.sfx("hit"); }
          else { Fx.hitSpark(b.x, b.y, "190,200,220", 2); A.sfx("ping"); }
          gone = true;
        }
      }
      if (gone) G.pb.splice(i, 1);
    }
    // mines
    for (let i = G.mines.length - 1; i >= 0; i--) {
      const m = G.mines[i];
      m.t += dt; m.y += S() * dt;
      let boom = m.t > 6 || m.y > PH + 20;
      if (!boom && m.t > 0.3) for (const e of G.enemies) if (!e.dead && !e.hidden && U.dist2(e.x, e.y, m.x, m.y) < (50 + e.rx) ** 2) { boom = true; break; }
      if (!boom && m.t > 0.3 && G.boss && G.boss.test(m.x, m.y, 40)) boom = true;
      if (boom) { if (m.y < PH) blast(m.x, m.y, 64, 45); G.mines.splice(i, 1); }
    }
    for (let i = G.bolts.length - 1; i >= 0; i--) { G.bolts[i].life -= dt; if (G.bolts[i].life <= 0) G.bolts.splice(i, 1); }
  }

  function ebUpdate(dt) {
    const p = G.player;
    for (let i = G.eb.length - 1; i >= 0; i--) {
      const b = G.eb[i];
      b.t += dt;
      if (b.home > 0 && !p.dead) {
        b.home -= dt;
        const sp = Math.hypot(b.vx, b.vy);
        let cur = Math.atan2(b.vy, b.vx);
        cur += U.clamp(U.angDiff(Math.atan2(p.y - b.y, p.x - b.x), cur), -2.2 * dt, 2.2 * dt);
        b.vx = Math.cos(cur) * sp; b.vy = Math.sin(cur) * sp;
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      let gone = b.x < -30 || b.x > PW + 30 || b.y < -40 || b.y > PH + 30 || b.t > 9;
      if (!gone && (b.x < G.leftAt(b.y) - 6 || b.x > G.rightAt(b.y) + 6 || (G.obstacles.length && G.obstHit(b.x, b.y, 0)))) { gone = true; Fx.glow(b.x, b.y, 6, 16, "255,160,120", 0.2); }
      if (!gone && !p.dead && U.dist2(b.x, b.y, p.x, p.y) < (b.r + p.r) ** 2) { G.hurt(b.dmg); gone = true; Fx.hitSpark(b.x, b.y, "255,120,120", 4); }
      if (gone) G.eb.splice(i, 1);
    }
  }

  function enemiesUpdate(dt) {
    const p = G.player;
    for (const e of G.enemies) {
      e.t += dt;
      if (e.flash > 0) e.flash -= dt;
      ED[e.type].update(e, dt);
      if (!e.dead && !e.hidden && !p.dead && hitE(e, p.x, p.y, p.r + 4)) { const d = ED[e.type]; G.hurt(d.touch || 30); damageEnemy(e, d.fragile ? 999 : 50, p.x, p.y); }
      if (e.y > PH + 120 || e.y < -400 || e.x < -200 || e.x > PW + 200) e.dead = true;
    }
    G.enemies = G.enemies.filter((e) => !e.dead);
  }

  G.update = function (dt) {
    G.t += dt; G.phaseT += dt;
    if (G.cheat) G.run.cheated = true;
    G.dist += G.speed * dt;
    if (G.over > 0) G.over -= dt;
    const L = G.L;
    switch (G.phase) {
      case "intro": if (G.phaseT > 3) setPhase("fight"); break;
      case "fight":
        if (G.seqIndex < G.seq.length) {
          if (G.t >= G.nextPattern) { const pat = PAT[G.seq[G.seqIndex++]]; pat.run(); G.nextPattern = G.t + pat.dur; }
        } else if (!G.queue.length && (G.enemies.length === 0 || G.t > G.nextPattern + 6) &&
          (G.obstacles.every((o) => G.obstRect(o).y > PH) || G.t > G.nextPattern + 16)) {
          if (G.run.half === 0) { setPhase("sectionclear"); A.jingle("clear"); A.say("Section clear. Trading post ahead."); }
          else { setPhase("warning"); A.stopMusic(); A.sfx("alarm"); }
        }
        break;
      case "warning":
        if (G.phaseT > 3) {
          G.boss = BOSSES[L.boss](); setPhase("boss"); A.playSong(L.bossSong || "boss");
          A.say(G.boss.call || "Warning! " + G.boss.name.toLowerCase() + " approaching!", { rate: 0.95, pitch: 0.75 });
        }
        break;
      case "boss":
        G.speed = U.lerp(G.speed, 30, Math.min(1, dt));
        if (G.boss && !G.player.dead && G.boss.touch(G.player)) G.hurt(35);
        break;
      case "bossdeath": {
        const b = G.boss;
        b.dieT += dt;
        if (Math.floor(b.dieT * 10) !== Math.floor((b.dieT - dt) * 10)) {
          const B = b.bounds();
          Fx.explode(B.x + U.rand(-B.rx, B.rx) * 0.8, B.y + U.rand(-B.ry, B.ry) * 0.8, U.rand(24, 54));
          A.sfx(Math.random() < 0.5 ? "boomBig" : "boom");
        }
        Fx.shake = Math.max(Fx.shake, 10);
        if (G.phaseT > 3.2) {
          Fx.explode(b.x, b.y, 230, { rgb: "255,220,180" });
          Fx.flash = 1; Fx.flashRGB = "255,250,240";
          A.sfx("boomHuge");
          G.addScore(b.bonus, b.x, b.y);
          G.run.credits += 5000;
          G.clearBonus = { boss: G.run.cheated ? 0 : b.bonus };
          for (let i = 0; i < 24; i++) drop(b.x + U.rand(-120, 120), b.y + U.rand(-80, 80), "coin");
          G.boss = null;
          setPhase("clear");
        }
        break;
      }
      case "clear":
        if (G.phaseT > 1.2 && !G.jingled) {
          G.jingled = true; A.jingle("clear");
          A.say(G.run.level >= G.LEVELS.length - 1 ? "Mission accomplished! Evolution is safe." : U.pick(["Stage clear. Well done, pilot!", "Stage clear! Excellent work.", "Stage clear. Next age ahead."]), { rate: 0.95 });
        }
        if (G.phaseT > 3 && !G.player.dead) G.player.exiting = true;
        break;
      case "sectionclear":
        if (G.phaseT > 2.2 && !G.player.dead) G.player.exiting = true;
        break;
    }
    if (G.phase !== "clear") G.jingled = false;
    for (let i = G.queue.length - 1; i >= 0; i--) if (G.t >= G.queue[i].at) { const f = G.queue[i].fn; G.queue.splice(i, 1); f(); }
    if (G.obstacles.length) G.obstacles = G.obstacles.filter((o) => G.obstRect(o).y < PH + 40);
    for (const w of G.warns) w.t += dt;
    if (G.warns.length) G.warns = G.warns.filter((w) => w.t < w.life);
    playerUpdate(dt);
    dronesUpdate(dt);
    pbUpdate(dt);
    enemiesUpdate(dt);
    if (G.boss) { G.boss.update(dt); if (G.boss.flash > 0) G.boss.flash -= dt; }
    ebUpdate(dt);
    pickupsUpdate(dt);
    Fx.update(dt);
    if (G.gameOverT > 0) { G.gameOverT -= dt; if (G.gameOverT <= 0 && G.onGameOver) G.onGameOver(); }
  };

  // building blocks for stages 5–8 (deep.js)
  G.lib = { spawn, eshot, ring, aim, canShoot, safeX, q, group, killEnemy, damageEnemy, drop, endAtk, startAtk, enter, circHit, ellHit, bossBase, hitE, PAT, BOSSES, ED, bossDamage, setPhase };

  G.progress = () => {
    const base = G.run.half * 0.5;
    if (G.phase === "fight" || G.phase === "intro") return base + 0.5 * Math.min(1, G.seqIndex / G.seq.length);
    return base + 0.5;
  };

  /* ---------- Drawing ---------- */
  // ship with all attached weapons
  G.drawShip = function (ctx, x, y, w, bank, alpha = 1, white = false, t = 0) {
    const sx = 1 - Math.abs(bank) * 0.18;
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, 1);
    if (alpha !== 1) ctx.globalAlpha = alpha;
    // engine flames
    ctx.globalCompositeOperation = "lighter";
    for (const ex of [-10, 10]) { const l = 18 + Math.random() * 10; ctx.drawImage(Gfx.glow("120,200,255", true), ex - 7, 34, 14, l); }
    ctx.globalCompositeOperation = "source-over";
    const metal = (x0, y0, ww, hh) => { const g = ctx.createLinearGradient(x0, 0, x0 + ww, 0); g.addColorStop(0, "#2a3240"); g.addColorStop(0.5, "#c8d2de"); g.addColorStop(1, "#2a3240"); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x0, y0, ww, hh, 3); ctx.fill(); };
    if (w.cannon) metal(-5, -50, 10, 20);
    if (w.homing) for (const s of [-1, 1]) { for (let i = 0; i < w.homing; i++) { ctx.fillStyle = "#d8e0e8"; ctx.fillRect(s * (14 + i * 5) - 1.5, 4, 3, 14); ctx.fillStyle = "#ff4a3a"; ctx.fillRect(s * (14 + i * 5) - 1.5, 2, 3, 3); } }
    Gfx.draw(ctx, "ship", 0, 0, 0, 1, white);
    if (w.side) for (const s of [-1, 1]) { metal(s * 34 - 5, 14, 10, 18); ctx.fillStyle = "#80e8ff"; ctx.fillRect(s * 34 - 2, 12, 4, 3); }
    if (w.laser) for (const s of [-1, 1]) { metal(s * 27 - 3, -2, 6, 22); Gfx.lamp(ctx, s * 27, -4, 2.6, "120,255,180"); }
    if (w.rear) metal(-4, 36, 8, 12);
    if (w.mines) { ctx.fillStyle = "#4a5260"; ctx.fillRect(-14, 30, 6, 8); ctx.fillRect(8, 30, 6, 8); }
    if (w.zapper) { Gfx.lamp(ctx, 0, -8, 3.5, "160,200,255"); }
    if (w.rapid) { ctx.fillStyle = "#ffb34a"; ctx.fillRect(-12, -10, 4, 4); ctx.fillRect(8, -10, 4, 4); }
    ctx.restore();
    if (t) { /* time used for subtle animations in the shop */ }
  };

  function drawPB(ctx) {
    ctx.globalCompositeOperation = "lighter";
    for (const b of G.pb) {
      switch (b.k) {
        case "shot": Gfx.draw(ctx, "b_shot", b.x, b.y, Math.atan2(b.vy, b.vx) + Math.PI / 2); break;
        case "side": Gfx.draw(ctx, "b_side", b.x, b.y); break;
        case "cannon": Gfx.draw(ctx, "b_cannon", b.x, b.y, 0, 1 + Math.sin(b.t * 30) * 0.1); break;
        case "laser":
          ctx.strokeStyle = "rgba(90,255,170,0.35)"; ctx.lineWidth = 9;
          ctx.beginPath(); ctx.moveTo(b.x, b.y + b.len); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.strokeStyle = "rgba(230,255,240,0.95)"; ctx.lineWidth = 2.5; ctx.stroke();
          Gfx.glowAt(ctx, "120,255,190", b.x, b.y, 12, 0.8, true);
          break;
        case "missile": {
          const a = Math.atan2(b.vy, b.vx);
          ctx.globalCompositeOperation = "source-over";
          Gfx.draw(ctx, "b_missile", b.x, b.y, a + Math.PI / 2);
          ctx.globalCompositeOperation = "lighter";
          Gfx.glowAt(ctx, "255,180,80", b.x - Math.cos(a) * 12, b.y - Math.sin(a) * 12, 10, 0.9, true);
          break;
        }
      }
    }
    for (const z of G.bolts) {
      ctx.strokeStyle = `rgba(180,220,255,${z.life / 0.14})`; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(z.x0, z.y0);
      for (let k = 1; k < 8; k++) ctx.lineTo(U.lerp(z.x0, z.x1, k / 8) + U.rand(-10, 10), U.lerp(z.y0, z.y1, k / 8) + U.rand(-10, 10));
      ctx.lineTo(z.x1, z.y1); ctx.stroke();
      Gfx.glowAt(ctx, "150,200,255", z.x1, z.y1, 24, 0.8, true);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  G.draw = function (ctx) {
    Gfx.drawBackground(ctx, G.theme, G.dist, G.t);
    // ground objects below the walls
    for (const e of G.enemies) if (e.type === "egg") Gfx.draw(ctx, "egg", e.x, e.y, 0, 1, e.flash > 0);
    Gfx.drawWalls(ctx, G.theme, G.dist, G.walls, G.t);
    for (const o of G.obstacles) { const R = G.obstRect(o); if (R.y < PH + 10 && R.y + R.h > -10) Gfx.drawObstacle(ctx, o, R.x, R.y, R.w, R.h, G.t); }
    for (const m of G.mines) { Gfx.draw(ctx, "mine", m.x, m.y, m.t * 2); if (Math.floor(m.t * 6) % 2) { ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,200,60", m.x, m.y, 12, 0.7); ctx.globalCompositeOperation = "source-over"; } }
    for (const k of G.pickups) {
      if (k.t > 15 && Math.floor(k.t * 10) % 2) continue;
      Gfx.draw(ctx, PSPR[k.kind], k.x, k.y, 0, k.kind === "coin" ? 0.8 + Math.abs(Math.sin(k.t * 5)) * 0.2 : 1 + Math.sin(k.t * 6) * 0.08);
    }
    for (const e of G.enemies) {
      if (e.hidden || e.type === "egg") continue;
      const d = ED[e.type], white = e.flash > 0;
      if (d.draw) d.draw(ctx, e, white);
      else Gfx.draw(ctx, e.spr, e.x, e.y, e.ang, 1, white);
    }
    if (G.boss) G.boss.draw(ctx);
    drawPB(ctx);
    const p = G.player;
    for (const d of G.drones) if (!p.dead) Gfx.draw(ctx, "drone", d.x, d.y, Math.sin(G.t * 3) * 0.2);
    if (!p.dead) {
      const blink = p.inv > 0 && Math.floor(G.t * 20) % 2 === 0;
      const w = {}; for (const k in G.run.w) w[k] = lv(k);
      if (G.over > 0) { ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,230,90", p.x, p.y, 70 + Math.sin(G.t * 12) * 8, 0.35); ctx.globalCompositeOperation = "source-over"; }
      G.drawShip(ctx, p.x, p.y, w, p.bank, blink ? 0.4 : 1, p.hitFl > 0);
      ctx.globalCompositeOperation = "lighter";
      for (const b of G.electro || []) { Gfx.glowAt(ctx, "120,200,255", b.x, b.y, 18, 0.9, true); Gfx.glowAt(ctx, "200,230,255", b.x, b.y, 7, 1, true); }
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.globalCompositeOperation = "lighter";
    for (const b of G.eb) Gfx.draw(ctx, b.k, b.x, b.y, b.spin ? b.t * 10 : b.rot ? Math.atan2(b.vy, b.vx) : 0, b.k === "e_bone" ? 1 : b.r / 6.5);
    ctx.globalCompositeOperation = "source-over";
    Fx.draw(ctx);
    for (const w of G.warns) Gfx.drawWarn(ctx, w);
    Gfx.drawForeground(ctx, G.theme, G.dist, G.t);
  };
})(window.XA);
