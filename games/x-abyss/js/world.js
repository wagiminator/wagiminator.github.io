/* X-Abyss: game world – levels, player, weapons, enemies, bosses */
"use strict";

(function (XA) {
  const { U, Gfx, Fx } = XA;
  const A = XA.Audio, I = XA.Input;
  const W = U.W, H = U.H, TAU = U.TAU;

  const G = (XA.G = {
    cheat: false, run: null, enemies: [], pb: [], eb: [], pickups: [], pods: [], queue: [],
    camX: 0, scroll: 0, t: 0, phase: "intro", phaseT: 0, mouseMode: false, boss: null, autopilot: null,
  });

  /* ---------- Levels ---------- */
  G.LEVELS = [
    {
      name: "Coral Shelf", song: "level1", theme: "coral", scroll: 70, seed: 11, boss: "crab",
      floor: { base: 640, amp: 90, scale: 420 }, ceil: null,
      seq: ["fishA", "fishB", "darts", "snake", "jellies", "fishAB", "turrets", "carrier", "mines", "snake", "crabs", "sub", "squids",
        "fishA", "darts", "urchins", "snake", "jellies", "turrets", "carrier", "mines", "fishAB", "sub", "crabs", "darts", "snake"],
    },
    {
      name: "Wreck Graveyard", song: "level2", theme: "wreck", scroll: 75, seed: 23, boss: "angler",
      floor: { base: 625, amp: 110, scale: 380 }, ceil: { base: 75, amp: 90, scale: 300 },
      seq: ["fishAB", "eels", "darts", "mines", "turrets", "jellies", "sub", "squids", "carrier", "urchins", "eels", "crabs", "mines",
        "fishAB", "turrets", "sub", "darts", "snake", "jellies", "carrier", "squids", "eels", "sub", "mines", "urchins", "fishAB"],
    },
    {
      name: "Magma Vents", song: "level3", theme: "lava", scroll: 80, seed: 37, boss: "serpent",
      floor: { base: 615, amp: 120, scale: 300 }, ceil: { base: 105, amp: 110, scale: 260 },
      seq: ["darts", "geysers", "fishAB", "eels", "turrets", "urchins", "geysers", "sub", "squids", "carrier", "mines", "geysers", "eels",
        "crabs", "turrets", "sub", "darts", "geysers", "urchins", "snake", "carrier", "sub", "squids", "geysers", "eels", "fishAB"],
    },
    {
      name: "The Hive", song: "level4", theme: "hive", scroll: 85, seed: 53, boss: "hive",
      floor: { base: 615, amp: 110, scale: 280 }, ceil: { base: 100, amp: 110, scale: 280 },
      seq: ["drones", "hivepods", "fishAB", "eels", "darts", "jellies", "hivepods", "sub", "drones", "carrier", "urchins", "squids", "hivepods",
        "eels", "mines", "sub", "drones", "turrets", "snake", "carrier", "hivepods", "squids", "sub", "eels", "drones", "urchins"],
    },
  ];

  function makeTerrain(L) {
    const nf = U.noise1(L.seed), nc = U.noise1(L.seed * 7 + 3), f = L.floor, c = L.ceil;
    const ceil = c ? (x) => c.base + (U.fbm(nc, x / c.scale, 3) - 0.5) * 2 * c.amp : null;
    const floor = (x) => {
      let y = f.base + (U.fbm(nf, x / f.scale, 3) - 0.5) * 2 * f.amp;
      if (ceil) { const cy = ceil(x); if (y - cy < 310) y = cy + 310; }
      return Math.min(H - 16, y);
    };
    return { floor, ceil };
  }
  G.makeTerrain = makeTerrain;
  G.floorAt = (x) => G.terr.floor(G.camX + x);
  G.ceilAt = (x) => (G.terr.ceil ? G.terr.ceil(G.camX + x) : -10000);
  function safeY(y, m, x = W + 40) {
    const top = Math.max(30, G.ceilAt(x)) + m, bot = Math.min(H - 30, G.floorAt(x)) - m;
    return top > bot ? (top + bot) / 2 : U.clamp(y, top, bot);
  }
  G.hpMul = () => 1 + 0.22 * G.run.level;
  G.bmul = () => 1 + 0.1 * G.run.level;
  G.maxEnergy = () => 100 + 25 * G.run.armor;

  /* ---------- Run and level setup ---------- */
  G.newRun = function () {
    G.run = {
      score: 0, credits: 10000, lives: 2, level: 0, cheated: G.cheat,
      weapon: "pulse", owned: { pulse: true }, power: 1, pods: 0,
      homing: false, torpedo: false, rear: false, side: false, shield: false,
      armor: 0, engine: 0, novas: 1, energy: 100, formation: 0, kills: 0,
    };
  };

  G.startLevel = function (i) {
    const L = (G.L = G.LEVELS[i]);
    G.run.level = i;
    G.theme = Gfx.THEMES[L.theme];
    G.terr = makeTerrain(L);
    G.camX = 0; G.scroll = L.scroll; G.t = 0;
    G.enemies = []; G.pb = []; G.eb = []; G.pickups = []; G.queue = []; G.groups = {}; G.pods = [];
    G.boss = null; G.seqIndex = 0; G.nextPattern = 2.5; G.gameOverT = 0;
    G.stats = { spawned: 0, killed: 0 };
    G.player = newPlayer();
    G.run.energy = Math.max(G.run.energy, 1);
    setPhase("intro");
    Fx.clear();
    A.playSong(L.song);
  };

  function setPhase(p) { G.phase = p; G.phaseT = 0; }
  G.setPhase = setPhase;

  // Score and credits: enemies pay half their score as credits, crystals pay in full
  G.addScore = function (n, x, y, creditShare = 0.5) {
    const r = G.run;
    r.credits += Math.round(n * creditShare);
    if (G.cheat) { r.cheated = true; return; }
    const before = Math.floor(r.score / 50000);
    r.score += n;
    if (x !== undefined && n >= 300) Fx.text(x, y, "+" + U.fmt(n));
    if (Math.floor(r.score / 50000) > before && r.lives < 9) { r.lives++; A.sfx("extra"); Fx.text(G.player.x, G.player.y - 40, "EXTRA SHIP", "120,255,180", 20); }
  };

  /* ---------- Player ---------- */
  function newPlayer() {
    return { x: -70, y: H / 2, vx: 0, vy: 0, r: 9, inv: 3, dead: false, respawn: 0, fireT: 0, homT: 0.5, torT: 0.8, rearT: 0, sideT: 0,
      hist: [], hitFl: 0, shield: 60, shieldT: 0, shieldFl: 0, tilt: 0, entering: true, exiting: false, thrust: 0 };
  }

  function playerUpdate(dt) {
    const p = G.player, r = G.run;
    if (p.dead) {
      p.respawn -= dt;
      if (p.respawn <= 0 && r.lives >= 0 && G.gameOverT <= 0 && G.phase !== "clear") {
        Object.assign(p, newPlayer());
        p.y = safeY(H / 2, 60, 180);
        r.energy = G.maxEnergy();
      }
      return;
    }
    p.inv = Math.max(0, p.inv - dt);
    p.hitFl = Math.max(0, p.hitFl - dt);
    p.shieldFl = Math.max(0, p.shieldFl - dt);
    if (r.shield) {
      p.shieldT -= dt;
      if (p.shieldT <= 0) p.shield = Math.min(60, p.shield + 12 * dt);
    }
    const spd = 330 + 55 * r.engine;
    let tvx = 0, tvy = 0;
    if (p.entering) {
      tvx = 420; p.inv = Math.max(p.inv, 1.5);
      if (p.x > 170) { p.entering = false; tvx = 0; }
    } else if (p.exiting) {
      tvx = p.vx + 900 * dt;
    } else if (G.autopilot) {
      const a = G.autopilot(p);
      const l = Math.hypot(a.dx, a.dy) || 1;
      tvx = (a.dx / Math.max(1, l)) * spd; tvy = (a.dy / Math.max(1, l)) * spd;
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
        const dx = I.mouse.x - p.x, dy = I.mouse.y - p.y, d = Math.hypot(dx, dy);
        const s = Math.min(spd, d * 9);
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
    p.tilt = U.lerp(p.tilt, U.clamp(p.vy / spd, -1, 1) * 0.22, Math.min(1, dt * 10));
    p.thrust = U.lerp(p.thrust, U.clamp(p.vx / spd, -1, 1), Math.min(1, dt * 8));
    if (!p.entering && !p.exiting) { p.x = U.clamp(p.x, 40, W - 50); }
    p.y = U.clamp(p.y, 22, H - 22);
    // terrain contact
    const fy = G.floorAt(p.x), cy = G.ceilAt(p.x);
    if (p.y > fy - 16) { p.y = fy - 16; p.vy = -120; terrainHit(p.x, fy); }
    if (p.y < cy + 16) { p.y = cy + 16; p.vy = 120; terrainHit(p.x, cy); }
    p.hist.unshift(p.x, p.y);
    if (p.hist.length > 120) p.hist.length = 120;
    if (!p.entering && !p.exiting && G.phase !== "clear") firePlayer(dt);
  }
  function terrainHit(x, y) {
    Fx.hitSpark(x, y, "255,220,160", 3);
    G.hurt(18);
  }

  G.hurt = function (dmg) {
    const p = G.player, r = G.run;
    if (!p || p.dead || p.inv > 0 || p.entering) return;
    if (G.cheat) { r.cheated = true; Fx.hitSpark(p.x, p.y, "150,220,255", 3); p.inv = 0.3; return; }
    if (r.shield && p.shield > 0) {
      const a = Math.min(p.shield, dmg);
      p.shield -= a; dmg -= a; p.shieldFl = 0.35;
      A.sfx("shield");
    }
    if (r.shield) p.shieldT = 3;
    if (dmg > 0) {
      r.energy -= dmg; p.hitFl = 0.18;
      A.sfx("playerHit");
      Fx.shake = Math.max(Fx.shake, 9);
      Fx.hitSpark(p.x, p.y, "255,120,80", 8);
    }
    p.inv = 0.55;
    if (r.energy <= 0) killPlayer();
  };

  function killPlayer() {
    const p = G.player, r = G.run;
    r.energy = 0;
    p.dead = true; p.respawn = 2.4;
    Fx.explode(p.x, p.y, 70, { rgb: "120,220,255" });
    A.sfx("playerDie");
    Fx.shake = 26;
    r.power = Math.max(1, r.power - 1);
    if (r.pods > 0) r.pods--;
    for (const pd of G.pods) Fx.explode(pd.x, pd.y, 18);
    if (r.lives > 0) r.lives--;
    else G.gameOverT = 3;
  }

  /* ---------- Weapons ---------- */
  function pshot(o) { G.pb.push(Object.assign({ vx: 1000, vy: 0, r: 6, dmg: 10, k: "pulse", t: 0, life: 2.5, pierce: 0 }, o)); }
  G.WEAPONS = { pulse: "Pulse Cannon", spread: "Spread Cannon", laser: "Pulse Laser", wave: "Wave Gun" };
  G.FORMATIONS = ["Escort", "Front", "Orbit", "Trail", "Rear guard"];

  function firePlayer(dt) {
    const p = G.player, r = G.run, pw = r.power;
    p.fireT -= dt; p.homT -= dt; p.torT -= dt; p.rearT -= dt; p.sideT -= dt;
    const firing = G.autopilot ? true : I.held("fire");
    if (!firing) return;
    const x = p.x + 40, y = p.y + 4;
    if (p.fireT <= 0) {
      switch (r.weapon) {
        case "pulse": {
          p.fireT = 0.1;
          const offs = [[0], [-6, 6], [-10, 0, 10], [-12, 0, 12]][pw - 1];
          for (const o of offs) pshot({ x, y: y + o, vx: 1100, dmg: pw === 4 ? 12 : 10 });
          if (pw === 4) { pshot({ x, y, vx: 1080, vy: -110 }); pshot({ x, y, vx: 1080, vy: 110 }); }
          A.sfx("pulse");
          break;
        }
        case "spread": {
          p.fireT = 0.15;
          const n = [3, 5, 5, 7][pw - 1], sp = [0.32, 0.55, 0.7, 0.9][pw - 1];
          for (let i = 0; i < n; i++) {
            const a = -sp / 2 + (sp * i) / (n - 1);
            pshot({ x, y, vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, k: "spread", r: 7, dmg: pw >= 3 ? 9 : 8 });
          }
          A.sfx("spread");
          break;
        }
        case "laser": {
          p.fireT = 0.19;
          const ys = pw >= 3 ? [-7, 7] : [0];
          for (const o of ys) pshot({ x: x + 30, y: y + o, vx: 1600, k: "laser", r: 7, dmg: 15 + pw * 2, pierce: 2 + pw, len: 70 + pw * 20, hits: new Set() });
          A.sfx("laser");
          break;
        }
        case "wave": {
          p.fireT = 0.12;
          const amp = [20, 28, 34, 42][pw - 1];
          pshot({ x, y, vx: 820, k: "wave", r: 11 + pw, dmg: 11, y0: y, amp, ph: 0 });
          if (pw >= 2) pshot({ x, y, vx: 820, k: "wave", r: 11 + pw, dmg: 11, y0: y, amp, ph: Math.PI });
          if (pw >= 4) pshot({ x, y, vx: 860, k: "wave", r: 14, dmg: 12, y0: y, amp: 0, ph: 0 });
          A.sfx("wave");
          break;
        }
      }
    }
    if (r.homing && p.homT <= 0) {
      p.homT = 0.8;
      for (const s of [-1, 1]) pshot({ x: p.x, y: p.y + s * 14, vx: 150, vy: s * 260, k: "missile", r: 7, dmg: 24, life: 3, retarget: 0 });
      A.sfx("missile");
    }
    if (r.torpedo && p.torT <= 0) {
      p.torT = 1.1;
      pshot({ x: p.x + 10, y: p.y + 18, vx: 240, vy: 40, k: "depth", r: 7, dmg: 0, life: 4, g: 520 });
      A.sfx("torpedo");
    }
    if (r.rear && p.rearT <= 0) {
      p.rearT = 0.2;
      pshot({ x: p.x - 44, y: p.y, vx: -950, dmg: 9 });
    }
    if (r.side && p.sideT <= 0) {
      p.sideT = 0.3;
      pshot({ x: p.x, y: p.y - 14, vx: 0, vy: -800, dmg: 8, k: "spread", r: 7 });
      pshot({ x: p.x, y: p.y + 14, vx: 0, vy: 800, dmg: 8, k: "spread", r: 7 });
    }
  }

  G.cycleFormation = function () {
    if (!G.run.pods) return;
    G.run.formation = (G.run.formation + 1) % G.FORMATIONS.length;
    A.sfx("formation");
    Fx.text(G.player.x, G.player.y - 44, G.FORMATIONS[G.run.formation].toUpperCase(), "150,230,255", 14);
  };

  G.useNova = function () {
    const r = G.run, p = G.player;
    if (r.novas <= 0 || p.dead || G.phase === "clear") return;
    r.novas--;
    A.sfx("nova");
    Fx.flash = 0.9; Fx.flashRGB = "220,240,255"; Fx.shake = 22;
    Fx.add({ k: "ring", x: p.x, y: p.y, size: 20, size2: W * 1.3, life: 1.0, rgb: "200,240,255", w: 40 });
    Fx.add({ k: "ring", x: p.x, y: p.y, size: 10, size2: W, life: 1.3, rgb: "120,200,255", w: 20 });
    for (const b of G.eb) Fx.glow(b.x, b.y, 10, 26, "180,230,255", 0.4);
    G.eb.length = 0;
    for (const e of G.enemies.slice()) if (!e.hidden && e.x < W + 20) damageEnemy(e, 140, e.x, e.y);
    if (G.boss && !G.boss.dying) bossDamage(150, true);
    p.inv = Math.max(p.inv, 0.6);
  };

  /* ---------- Pods (satellites) ---------- */
  function podsUpdate(dt) {
    const r = G.run, p = G.player;
    while (G.pods.length < r.pods) G.pods.push({ x: p.x, y: p.y, fireT: Math.random() * 0.2 });
    while (G.pods.length > r.pods) G.pods.pop();
    G.pods.forEach((pd, i) => {
      let tx, ty, dir = 0;
      const s = i === 0 ? -1 : 1;
      switch (r.formation) {
        case 0: tx = p.x - 4; ty = p.y + s * 50; break;
        case 1: tx = p.x + 62; ty = p.y + s * 28; break;
        case 2: { const a = G.t * 3.4 + i * Math.PI; tx = p.x + Math.cos(a) * 60; ty = p.y + Math.sin(a) * 60; dir = a; break; }
        case 3: { const k = Math.min(p.hist.length - 2, (i + 1) * 28); tx = p.hist[k] !== undefined ? p.hist[k] : p.x; ty = p.hist[k + 1] !== undefined ? p.hist[k + 1] : p.y; break; }
        default: tx = p.x - 60; ty = p.y + s * 32; dir = Math.PI; break;
      }
      const k = r.formation === 2 ? 1 : Math.min(1, dt * 14);
      pd.x += (tx - pd.x) * k; pd.y += (ty - pd.y) * k;
      pd.dir = dir;
      if (p.dead) return;
      pd.fireT -= dt;
      if (pd.fireT <= 0 && (G.autopilot || I.held("fire")) && !p.entering && !p.exiting) {
        pd.fireT = 0.22;
        const a = r.formation === 2 ? dir : r.formation === 4 ? Math.PI : 0;
        pshot({ x: pd.x + Math.cos(a) * 14, y: pd.y + Math.sin(a) * 14, vx: Math.cos(a) * 950, vy: Math.sin(a) * 950, dmg: 7, k: "podshot", r: 5 });
        A.sfx("pod");
      }
      // pods block enemy bullets
      for (let j = G.eb.length - 1; j >= 0; j--) {
        const b = G.eb[j];
        if (U.dist2(b.x, b.y, pd.x, pd.y) < (14 + b.r) * (14 + b.r)) { Fx.hitSpark(b.x, b.y, "160,220,255", 3); G.eb.splice(j, 1); A.sfx("ping"); }
      }
    });
  }

  /* ---------- Enemies ---------- */
  function hitE(e, x, y, r) { const dx = (x - e.x) / (e.rx + r), dy = (y - e.y) / (e.ry + r); return dx * dx + dy * dy < 1; }
  function aim(e) { const p = G.player; return Math.atan2(p.y - e.y, p.x - e.x); }
  function canShoot(e) { return !G.player.dead && e.x < W - 10 && e.x > 30 && G.phase !== "clear"; }
  function eshot(x, y, a, spd, o = {}) { G.eb.push(Object.assign({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: 6, k: "e_orb", dmg: 20, t: 0 }, o)); }
  function ring(x, y, n, spd, off = 0, o) { for (let i = 0; i < n; i++) eshot(x, y, off + (i * TAU) / n, spd, o); }
  function place(e, off) {
    if (e.side === "ceil" && G.terr.ceil) { e.y = G.ceilAt(e.x) + off; e.flip = true; }
    else { e.side = "floor"; e.y = G.floorAt(e.x) - off; e.flip = false; }
  }

  const ED = (G.ED = {
    fish: {
      hp: 12, rx: 22, ry: 13, score: 100, spr: "fish",
      init(e) { e.baseY = e.y; e.amp = e.amp || U.rand(30, 60); e.freq = U.rand(2.2, 3.2); e.vx = -U.rand(170, 220); e.ph = e.ph || 0; e.shootT = U.rand(1, 3); },
      update(e, dt) {
        e.x += e.vx * dt;
        const ph = e.t * e.freq + e.ph;
        e.y = e.baseY + Math.sin(ph) * e.amp;
        e.ang = -Math.atan2(Math.cos(ph) * e.amp * e.freq, -e.vx) * 0.6;
        if (G.run.level >= 1) { e.shootT -= dt; if (e.shootT <= 0) { e.shootT = U.rand(2.5, 4); if (canShoot(e)) eshot(e.x, e.y, aim(e), 220 * G.bmul()); } }
      },
    },
    dart: {
      hp: 8, rx: 24, ry: 8, score: 150, spr: "dart",
      init(e) { e.vx = -140; e.phase = 0; },
      update(e, dt) {
        if (e.phase === 0) {
          e.x += e.vx * dt;
          if (!G.player.dead) e.y += (G.player.y - e.y) * Math.min(1, dt * 2.5);
          if (e.t > 0.8) { e.phase = 1; e.vx = -760 * G.bmul(); A.sfx("dart"); }
        } else { e.x += e.vx * dt; if (Math.random() < 0.6) Fx.bubbles(e.x + 26, e.y, 1, 2); }
      },
    },
    jelly: {
      hp: 30, rx: 24, ry: 20, score: 300, spr: "jelly",
      init(e) { e.vx = -G.scroll * 0.9 - 30; e.vy = U.pick([-1, 1]) * U.rand(30, 60); e.shootT = U.rand(1, 2); },
      update(e, dt) {
        e.x += e.vx * dt; e.y += e.vy * dt + Math.sin(e.t * 3) * 30 * dt;
        const top = Math.max(60, G.ceilAt(e.x) + 40), bot = Math.min(H - 60, G.floorAt(e.x) - 50);
        if (e.y < top) { e.y = top; e.vy = Math.abs(e.vy); }
        if (e.y > bot) { e.y = bot; e.vy = -Math.abs(e.vy); }
        e.shootT -= dt;
        if (e.shootT <= 0) { e.shootT = 2.4; if (canShoot(e)) { ring(e.x, e.y, 6 + G.run.level * 2, 165 * G.bmul(), e.t, { k: "e_violet" }); A.sfx("eshot"); } }
      },
      draw(ctx, e, white) {
        const pul = 1 + Math.sin(e.t * 5) * 0.06;
        ctx.strokeStyle = "rgba(230,150,255,0.55)"; ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const x0 = e.x - 16 + i * 8;
          ctx.beginPath(); ctx.moveTo(x0, e.y + 10);
          for (let k = 1; k <= 4; k++) ctx.lineTo(x0 + Math.sin(e.t * 4 + i + k) * 4 + k * 3, e.y + 10 + k * 9);
          ctx.stroke();
        }
        ctx.save(); ctx.translate(e.x, e.y); ctx.scale(1 / pul, pul);
        Gfx.draw(ctx, "jelly", 0, 0, 0, 1, white);
        ctx.restore();
      },
    },
    mine: {
      hp: 20, rx: 17, ry: 17, score: 200, spr: "mine",
      init(e) { e.vx = -G.scroll - 25; e.baseY = e.y; e.arm = -1; },
      update(e, dt) {
        e.x += e.vx * dt;
        e.y = e.baseY + Math.sin(e.t * 1.6 + e.x * 0.01) * 10;
        e.ang += dt * 0.8;
        const p = G.player;
        if (e.arm < 0 && !p.dead && U.dist2(e.x, e.y, p.x, p.y) < 115 * 115) e.arm = 0.55;
        if (e.arm >= 0) { e.arm -= dt; if (e.arm <= 0) killEnemy(e, false); }
      },
      onDeath(e) { if (G.phase !== "bossdeath") ring(e.x, e.y, 8, 185 * G.bmul(), e.ang); },
      draw(ctx, e, white) {
        Gfx.draw(ctx, "mine", e.x, e.y, e.ang, 1, white);
        const on = e.arm >= 0 ? Math.floor(e.t * 16) % 2 : Math.floor(e.t * 2) % 2;
        if (on) { ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,40,40", e.x, e.y, e.arm >= 0 ? 26 : 14, 0.9, true); ctx.globalCompositeOperation = "source-over"; }
      },
    },
    turret: {
      hp: 35, rx: 22, ry: 15, score: 400, anchored: true,
      init(e) { e.x = W + 40; place(e, 12); e.fireT = 1.2; e.ang = e.flip ? Math.PI / 2 : -Math.PI / 2; },
      update(e, dt) {
        e.x -= G.scroll * dt; place(e, 12);
        let a = aim(e);
        if (!e.flip && a > 0) a = a < Math.PI / 2 ? -0.05 : -Math.PI + 0.05;
        if (e.flip && a < 0) a = a > -Math.PI / 2 ? 0.05 : Math.PI - 0.05;
        e.ang += U.angDiff(a, e.ang) * Math.min(1, dt * 4);
        e.fireT -= dt;
        if (e.fireT <= 0) { e.fireT = 1.7 / G.bmul(); if (canShoot(e)) { eshot(e.x + Math.cos(e.ang) * 24, e.y + Math.sin(e.ang) * 24, e.ang, 270 * G.bmul()); A.sfx("eshot"); } }
      },
      draw(ctx, e, white) {
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.ang);
        ctx.fillStyle = white ? "#fff" : "#3c4654"; ctx.fillRect(0, -4, 28, 8);
        ctx.fillStyle = white ? "#fff" : "#9aa6b4"; ctx.fillRect(22, -5, 6, 10);
        ctx.restore();
        ctx.save(); ctx.translate(e.x, e.y); if (e.flip) ctx.scale(1, -1);
        Gfx.draw(ctx, "turret", 0, -2, 0, 1, white);
        ctx.restore();
      },
    },
    crab: {
      hp: 30, rx: 26, ry: 15, score: 350, spr: "crab", anchored: true,
      init(e) { e.x = W + 50; e.y = G.floorAt(e.x) - 16; e.vy = 0; e.air = false; e.fireT = U.rand(1, 2); e.hopT = U.rand(1, 2.5); },
      update(e, dt) {
        e.x -= (G.scroll + 45) * dt;
        const fy = G.floorAt(e.x) - 16;
        if (e.air) { e.vy += 900 * dt; e.y += e.vy * dt; if (e.y >= fy) { e.y = fy; e.air = false; Fx.bubbles(e.x, fy + 10, 4, 14); } }
        else { e.y = fy + Math.abs(Math.sin(e.t * 12)) * -2; e.hopT -= dt; if (e.hopT <= 0) { e.hopT = U.rand(1.5, 3); e.air = true; e.vy = -U.rand(250, 380); } }
        e.fireT -= dt;
        if (e.fireT <= 0) {
          e.fireT = 2.6 / G.bmul();
          if (canShoot(e)) { const bias = G.player.x < e.x ? -0.35 : 0.35; for (let k = -1; k <= 1; k++) eshot(e.x, e.y - 12, -Math.PI / 2 + k * 0.3 + bias, 330, { g: 300 }); A.sfx("eshot"); }
        }
      },
    },
    sub: {
      hp: 150, rx: 62, ry: 22, score: 1500, spr: "sub", drop: "power",
      init(e) { e.tx = U.rand(W * 0.68, W * 0.8); e.baseY = e.y; e.fireT = 1.6; e.torpT = 2.6; e.leaveT = 10; },
      update(e, dt) {
        if (e.t < e.leaveT) e.x += (e.tx - e.x) * Math.min(1, dt * 1.2); else e.x -= 100 * dt;
        e.y = safeY(e.baseY + Math.sin(e.t * 0.9) * 40, 40, e.x);
        e.fireT -= dt;
        if (e.fireT <= 0) { e.fireT = 1.8 / G.bmul(); if (canShoot(e)) { const a = aim(e); for (let k = -2; k <= 2; k++) eshot(e.x - 56, e.y + 4, a + k * 0.13, 240 * G.bmul()); A.sfx("eshot2"); } }
        e.torpT -= dt;
        if (e.torpT <= 0) { e.torpT = 3; if (canShoot(e)) spawn("torp", { x: e.x - 40, y: e.y + 16 }); }
        if (Math.random() < 0.3) Fx.bubbles(e.x + 70, e.y, 1, 6);
      },
    },
    torp: {
      hp: 3, rx: 15, ry: 6, score: 50, spr: "torp", noScale: true,
      init(e) { e.vx = -120; e.vy = 0; e.home = 1.6; },
      update(e, dt) {
        let cur = Math.atan2(e.vy, e.vx);
        if (e.home > 0 && !G.player.dead) { e.home -= dt; cur += U.clamp(U.angDiff(aim(e), cur), -2.5 * dt, 2.5 * dt); }
        const ns = Math.min(380, Math.hypot(e.vx, e.vy) + 260 * dt);
        e.vx = Math.cos(cur) * ns; e.vy = Math.sin(cur) * ns;
        e.x += e.vx * dt; e.y += e.vy * dt;
        e.ang = cur - Math.PI;
        if (Math.random() < 0.7) Fx.bubbles(e.x - Math.cos(cur) * 16, e.y - Math.sin(cur) * 16, 1, 2);
        if (e.y > G.floorAt(e.x) || e.y < G.ceilAt(e.x)) killEnemy(e, false);
      },
    },
    squid: {
      hp: 16, rx: 18, ry: 15, score: 250, spr: "squid",
      init(e) { e.x = -40; e.vx = 380; e.vy = 0; e.turn = false; },
      update(e, dt) {
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (!e.turn && e.x > W * 0.45) {
          e.turn = true; e.vy = (e.y < H / 2 ? 1 : -1) * 260; e.vx = 120;
          if (canShoot(e)) { eshot(e.x, e.y, aim(e), 280 * G.bmul()); A.sfx("eshot"); }
        }
        e.ang = Math.atan2(e.vy, e.vx);
      },
    },
    orb: {
      hp: 10, rx: 14, ry: 14, score: 120, spr: "orb",
      init(e) { e.x0 = W + 40; e.vx = -210; e.baseY = e.y; e.amp = Math.min(130, (G.floorAt(W) - Math.max(0, G.ceilAt(W))) / 2 - 60); },
      update(e, dt) {
        if (e.t < 0) { e.hidden = true; return; }
        e.hidden = false;
        e.x = e.x0 + e.vx * e.t; e.y = e.baseY + Math.sin(e.t * 2.4) * e.amp;
      },
    },
    eel: {
      hp: 18, rx: 16, ry: 12, score: 150, spr: "eel",
      init(e) { e.x0 = W + 40; e.vx = -260; e.baseY = e.y; e.amp = Math.min(100, (G.floorAt(W) - Math.max(0, G.ceilAt(W))) / 2 - 60); e.fireT = 1.2; if (e.idx === 0) { e.spr = "eelhead"; e.rx = 22; e.ry = 14; } },
      update(e, dt) {
        if (e.t < 0) { e.hidden = true; return; }
        e.hidden = false;
        const ph = e.t * 3.1;
        e.x = e.x0 + e.vx * e.t; e.y = e.baseY + Math.sin(ph) * e.amp;
        e.ang = -Math.atan2(Math.cos(ph) * e.amp * 3.1, -e.vx);
        if (e.idx === 0) { e.fireT -= dt; if (e.fireT <= 0) { e.fireT = 1.5; if (canShoot(e)) { eshot(e.x - 20, e.y, aim(e), 260 * G.bmul()); A.sfx("eshot"); } } }
      },
    },
    carrier: {
      hp: 45, rx: 32, ry: 17, score: 500, spr: "carrier", drop: "item",
      init(e) { e.vx = -95; e.baseY = e.y; },
      update(e, dt) { e.x += e.vx * dt; e.y = e.baseY + Math.sin(e.t * 1.5) * 25; e.ang = Math.sin(e.t * 1.5) * 0.08; },
    },
    urchin: {
      hp: 45, rx: 20, ry: 20, score: 450, spr: "urchin",
      init(e) { e.vx = -150; e.vy = U.pick([-1, 1]) * 230; },
      update(e, dt) {
        e.x += e.vx * dt; e.y += e.vy * dt; e.ang += dt * 3;
        const top = Math.max(26, G.ceilAt(e.x)) + 22, bot = Math.min(H - 26, G.floorAt(e.x)) - 22;
        if (e.y < top) { e.y = top; e.vy = Math.abs(e.vy); A.sfx("bounce"); }
        if (e.y > bot) { e.y = bot; e.vy = -Math.abs(e.vy); A.sfx("bounce"); }
      },
      onDeath(e) { if (G.phase !== "bossdeath") ring(e.x, e.y, 8, 200 * G.bmul(), 0.2); },
    },
    geyser: {
      hp: 1, rx: 20, ry: 20, score: 0, hazard: true, anchored: true,
      init(e) { e.x = W + 40; e.y = G.floorAt(e.x); e.cycle = U.rand(0, 1.5); e.state = "idle"; },
      update(e, dt) {
        e.x -= G.scroll * dt; e.y = G.floorAt(e.x);
        const c = (e.t + e.cycle) % 3.4, prev = e.state;
        e.state = c < 1.2 ? "idle" : c < 2.1 ? "warn" : "erupt";
        if (e.state === "warn" && Math.random() < 0.5) Fx.glow(e.x + U.rand(-10, 10), e.y - 4, 6, 12, "255,120,40", 0.4, { vy: -60 });
        if (e.state === "erupt") {
          if (prev !== "erupt" && e.x < W) A.sfx("erupt");
          for (let i = 0; i < 3; i++) Fx.glow(e.x + U.rand(-12, 12), e.y - 10, U.rand(10, 22), U.rand(26, 40), U.pick(["255,200,90", "255,130,40", "255,80,20"]), U.rand(0.4, 0.7), { vy: -U.rand(450, 650), vx: U.rand(-40, 40), drag: 1.2, hot: Math.random() < 0.3 });
          const p = G.player;
          if (!p.dead && Math.abs(p.x - e.x) < 30 && p.y > e.y - 300 && p.y < e.y) G.hurt(30);
        }
      },
      draw(ctx, e) {
        ctx.fillStyle = "#1a0a08";
        ctx.beginPath(); ctx.moveTo(e.x - 30, e.y + 6); ctx.lineTo(e.x - 12, e.y - 18); ctx.lineTo(e.x + 12, e.y - 18); ctx.lineTo(e.x + 30, e.y + 6); ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = "lighter";
        Gfx.glowAt(ctx, "255,110,30", e.x, e.y - 18, e.state === "warn" ? 30 + Math.random() * 10 : 18, 0.8);
        ctx.globalCompositeOperation = "source-over";
      },
    },
    hivepod: {
      hp: 80, rx: 26, ry: 22, score: 800, spr: "hivepod", anchored: true,
      init(e) { e.x = W + 50; place(e, 20); e.spawnT = 1; },
      update(e, dt) {
        e.x -= G.scroll * dt; place(e, 20);
        e.spawnT -= dt;
        if (e.spawnT <= 0 && e.x < W - 40 && G.phase === "fight") { e.spawnT = 2.2; spawn("drone", { x: e.x, y: e.y + (e.flip ? 30 : -30) }); }
      },
      draw(ctx, e, white) {
        ctx.save(); ctx.translate(e.x, e.y); if (e.flip) ctx.scale(1, -1);
        const s = 1 + Math.sin(e.t * 4) * 0.05;
        ctx.scale(s, 1 / s);
        Gfx.draw(ctx, "hivepod", 0, 0, 0, 1, white);
        ctx.restore();
      },
    },
    drone: {
      hp: 6, rx: 12, ry: 8, score: 60, spr: "drone",
      init(e) { e.vx = -200; e.vy = 0; },
      update(e, dt) {
        if (e.t < 6 && !G.player.dead) { const a = aim(e); e.vx += Math.cos(a) * 280 * dt; e.vy += Math.sin(a) * 280 * dt; }
        else e.vx -= 300 * dt;
        const sp = Math.hypot(e.vx, e.vy), max = 240;
        if (sp > max) { e.vx *= max / sp; e.vy *= max / sp; }
        e.x += e.vx * dt; e.y += e.vy * dt;
        e.ang = Math.atan2(e.vy, e.vx) - Math.PI;
      },
    },
    guard: {
      hp: 70, rx: 17, ry: 17, score: 600, spr: "guard", noScale: true,
      init(e) { e.fireT = U.rand(1.5, 4); },
      update(e, dt) {
        e.ang += dt * 2;
        e.fireT -= dt;
        if (e.fireT <= 0) { e.fireT = U.rand(2.5, 4); if (canShoot(e)) { eshot(e.x, e.y, aim(e), 230, { k: "e_violet" }); A.sfx("eshot"); } }
      },
    },
  });

  function spawn(type, o = {}) {
    const d = ED[type];
    const e = Object.assign({ type, x: W + 60, y: H / 2, vx: 0, vy: 0, t: 0, ang: 0, flash: 0, dead: false, hidden: false, spr: d.spr }, o);
    e.rx = d.rx; e.ry = d.ry;
    e.hp = d.hp * (d.noScale ? 1 : G.hpMul());
    e.score = d.score;
    if (o.y !== undefined && !d.anchored && type !== "torp" && type !== "drone" && type !== "guard") e.y = safeY(o.y, e.ry + 20, e.x);
    if (d.init) d.init(e);
    G.enemies.push(e);
    if (!d.hazard && !o.noStat) G.stats.spawned++;
    return e;
  }
  G.spawn = spawn;

  function damageEnemy(e, dmg, x, y) {
    if (e.dead || ED[e.type].hazard || e.hidden) return;
    e.hp -= dmg;
    e.flash = 0.07;
    if (e.hp <= 0) killEnemy(e, true);
    else { Fx.hitSpark(x, y, "255,230,160", 2); A.sfx("hit"); }
  }

  function killEnemy(e, byPlayer) {
    if (e.dead) return;
    e.dead = true;
    const d = ED[e.type], size = Math.max(e.rx, e.ry);
    Fx.explode(e.x, e.y, size * 1.25);
    A.sfx(size > 35 ? "boomBig" : "boom");
    if (byPlayer) {
      G.addScore(e.score, e.x, e.y);
      G.stats.killed++; G.run.kills++;
      if (d.drop === "power") drop(e.x, e.y, Math.random() < 0.6 ? "power" : "energy");
      else if (d.drop === "item") drop(e.x, e.y, U.pick(["power", "energy", "nova", "pod", "power", "energy"]));
      else if (Math.random() < 0.1) drop(e.x, e.y, "gem");
      if (size > 40) for (let i = 0; i < 3; i++) drop(e.x + U.rand(-20, 20), e.y + U.rand(-20, 20), "gem");
      if (e.group) {
        const g = G.groups[e.group];
        g.killed++;
        if (g.killed === g.n) {
          G.addScore(1000);
          Fx.text(e.x, e.y - 20, "CHAIN BONUS", "120,255,200", 18);
          drop(e.x, e.y, "gem"); drop(e.x + 10, e.y - 10, "gem");
          A.sfx("pickup");
        }
      }
    }
    if (d.onDeath) d.onDeath(e);
  }

  /* ---------- Pickups ---------- */
  function drop(x, y, kind) {
    G.pickups.push({ kind, x, y, vx: U.rand(-40, 40), vy: U.rand(-80, -20), t: 0, magnet: false });
  }
  const PICK_SPR = { gem: "p_gem", energy: "p_energy", power: "p_power", nova: "p_nova", pod: "p_pod" };

  function pickupsUpdate(dt) {
    const p = G.player, r = G.run;
    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const k = G.pickups[i];
      k.t += dt;
      const d2 = p.dead ? 1e9 : U.dist2(k.x, k.y, p.x, p.y);
      if (k.magnet || d2 < 160 * 160) {
        k.magnet = !p.dead;
        const a = Math.atan2(p.y - k.y, p.x - k.x);
        k.vx += Math.cos(a) * 1600 * dt; k.vy += Math.sin(a) * 1600 * dt;
        k.vx *= 0.92; k.vy *= 0.92;
      } else { k.vx += (-60 - k.vx) * dt; k.vy *= 0.98; k.vy += Math.sin(k.t * 3) * 10 * dt; }
      k.x += k.vx * dt; k.y += k.vy * dt;
      if (d2 < 30 * 30) {
        G.pickups.splice(i, 1);
        switch (k.kind) {
          case "gem": G.addScore(250, undefined, undefined, 1); A.sfx("gem"); break;
          case "energy": r.energy = Math.min(G.maxEnergy(), r.energy + 35); A.sfx("pickup"); Fx.text(k.x, k.y - 20, "ENERGY", "120,255,160", 14); break;
          case "power":
            if (r.power < 4) { r.power++; A.sfx("power"); Fx.text(k.x, k.y - 20, "POWER UP", "255,190,90", 16); }
            else { G.addScore(2000, k.x, k.y); A.sfx("pickup"); }
            break;
          case "nova":
            if (r.novas < 5) { r.novas++; Fx.text(k.x, k.y - 20, "NOVA BOMB", "220,220,255", 14); } else G.addScore(1000, k.x, k.y);
            A.sfx("pickup"); break;
          case "pod":
            if (r.pods < 2) { r.pods++; A.sfx("power"); Fx.text(k.x, k.y - 20, "SATELLITE", "120,220,255", 14); }
            else { G.addScore(2000, k.x, k.y); A.sfx("pickup"); }
            break;
        }
        continue;
      }
      if (k.x < -40 || k.t > 16) G.pickups.splice(i, 1);
    }
  }

  /* ---------- Attack patterns ---------- */
  function q(delay, fn) { G.queue.push({ at: G.t + delay, fn }); }
  let groupId = 0;
  function chain(type, n, y) {
    const id = ++groupId;
    G.groups[id] = { n, killed: 0 };
    y = safeY(y, 60);
    for (let i = 0; i < n; i++) spawn(type, { y, t: -i * (type === "eel" ? 0.1 : 0.14), group: id, idx: i });
  }
  const lvl = () => G.run.level;
  const PAT = {
    fishA: { dur: 4, run() { const y = U.rand(110, 300); for (let i = 0; i < 6; i++) q(i * 0.28, () => spawn("fish", { y, amp: 45 })); } },
    fishB: { dur: 4, run() { const y = U.rand(380, 540); for (let i = 0; i < 6; i++) q(i * 0.28, () => spawn("fish", { y, amp: 45, ph: Math.PI })); } },
    fishAB: { dur: 4.5, run() { PAT.fishA.run(); PAT.fishB.run(); } },
    darts: { dur: 4, run() { for (let i = 0; i < 4 + lvl(); i++) q(i * 0.5, () => spawn("dart", { y: U.rand(100, H - 140) })); } },
    snake: { dur: 4.5, run() { chain("orb", 9, U.rand(240, 460)); } },
    eels: { dur: 4.5, run() { chain("eel", 8, U.rand(240, 460)); } },
    jellies: { dur: 4.5, run() { for (let i = 0; i < 2 + (lvl() > 0 ? 1 : 0); i++) q(i * 0.9, () => spawn("jelly", { y: U.rand(150, H - 200) })); } },
    turrets: { dur: 5, run() { for (let i = 0; i < 3; i++) q(i * 1.3, () => spawn("turret", { side: i % 2 && G.terr.ceil ? "ceil" : "floor" })); } },
    mines: { dur: 4, run() { for (let i = 0; i < 7; i++) q(i * 0.38, () => spawn("mine", { y: U.rand(110, H - 170) })); } },
    carrier: { dur: 4, run() { const y = U.rand(200, 450); spawn("carrier", { y }); for (let i = 0; i < 3; i++) q(0.4 + i * 0.3, () => spawn("fish", { y: y + (i - 1) * 70, amp: 25 })); } },
    crabs: { dur: 4.5, run() { for (let i = 0; i < 3; i++) q(i * 1.0, () => spawn("crab")); } },
    sub: { dur: 7, run() { spawn("sub", { y: U.rand(220, 440) }); q(2, () => { for (let i = 0; i < 3; i++) q(i * 0.5, () => spawn("dart", { y: U.rand(100, H - 140) })); }); } },
    squids: { dur: 4, run() { for (let i = 0; i < 4; i++) q(i * 0.6, () => spawn("squid", { y: i % 2 ? safeY(170, 30, 0) : safeY(H - 220, 30, 0) })); } },
    urchins: { dur: 4.5, run() { for (let i = 0; i < 3; i++) q(i * 1.0, () => spawn("urchin", { y: U.rand(200, 450) })); } },
    geysers: { dur: 5, run() { for (let i = 0; i < 3; i++) q(i * 1.4, () => spawn("geyser")); q(1, () => PAT.fishA.run()); } },
    hivepods: { dur: 6, run() { q(0, () => spawn("hivepod", { side: "floor" })); q(1.6, () => spawn("hivepod", { side: "ceil" })); } },
    drones: { dur: 4, run() { for (let i = 0; i < 8; i++) q(i * 0.25, () => spawn("drone", { x: W + 30, y: U.rand(150, H - 150) })); } },
  };

  /* ---------- Bosses ---------- */
  function bossBase(o) {
    return Object.assign({ x: W + 300, y: H / 2, t: 0, flash: 0, atk: -1, atkT: 0, n: 0, cool: 2.5, step: 0, entered: false, dying: false, vulnMul: 1, bonus: 20000 }, o);
  }
  const circHit = (c, x, y, r) => U.dist2(c.x, c.y, x, y) < (c.r + r) * (c.r + r);
  const ellHit = (c, x, y, r) => { const dx = (x - c.x) / (c.rx + r), dy = (y - c.y) / (c.ry + r); return dx * dx + dy * dy < 1; };
  function endAtk(b, cool) { b.atk = -1; b.cool = cool; }

  const BOSSES = {
    crab() {
      const b = bossBase({ name: "CARCINUS", hp: 2200, maxHp: 2200, x: W + 280, cx: W - 270, claw: { ext: 0, ty: H / 2, glow: 0 }, bonus: 20000 });
      b.parts = () => ({
        eye: { x: b.x - 34, y: b.y - 60, r: 25 },
        body: { x: b.x + 10, y: b.y, rx: 150, ry: 62 },
        clawA: { x: b.x - 185 - b.claw.ext * 520, y: U.lerp(b.y - 20, b.claw.ty, b.claw.ext), r: 38 },
        clawB: { x: b.x - 160, y: b.y + 50, r: 30 },
      });
      b.bounds = () => ({ x: b.x, y: b.y, rx: 160, ry: 80 });
      b.test = (x, y, r) => {
        const P = b.parts();
        if (circHit(P.eye, x, y, r)) return "weak";
        if (ellHit(P.body, x, y, r) || circHit(P.clawA, x, y, r) || circHit(P.clawB, x, y, r)) return "armor";
        return null;
      };
      b.update = (dt) => {
        b.t += dt;
        if (!b.entered) { b.x += (b.cx - b.x) * Math.min(1, dt * 1.1); if (b.x < b.cx + 8) b.entered = true; }
        else b.x = b.cx + Math.sin(b.t * 0.45) * 70;
        b.y = Math.max(250, G.floorAt(b.x) - 128 - Math.abs(Math.sin(b.t * 3)) * 6);
        if (b.dying || !b.entered) return;
        const P2 = b.hp < b.maxHp * 0.5;
        if (b.atk < 0) { b.cool -= dt; if (b.cool <= 0) { b.atk = b.step++ % (P2 ? 4 : 3); b.atkT = 0; b.n = 0; b.nt = 0; } return; }
        b.atkT += dt; b.nt -= dt;
        const parts = b.parts();
        if (b.atk === 0) {
          if (b.nt <= 0) {
            b.nt = P2 ? 0.32 : 0.45; b.n++;
            for (const c of [parts.clawA, parts.clawB]) { const a = Math.atan2(G.player.y - c.y, G.player.x - c.x); for (let k = -1; k <= 1; k++) eshot(c.x - 20, c.y, a + k * 0.17, 290); }
            A.sfx("eshot2");
            if (b.n >= 5) endAtk(b, 1.2);
          }
        } else if (b.atk === 1) {
          if (b.nt <= 0 && b.atkT > 0.3) {
            b.nt = 0.35; b.n++;
            spawn("mine", { x: b.x - 60, y: U.rand(110, H - 230), noStat: true });
            Fx.bubbles(b.x - 40, b.y - 40, 10, 30); A.sfx("torpedo");
            if (b.n >= 4) endAtk(b, 1.4);
          }
        } else if (b.atk === 2) {
          const c = b.claw;
          if (b.atkT < 0.8) { if (b.n === 0) { b.n = 1; A.sfx("charge"); } c.ty += (G.player.y - c.ty) * Math.min(1, dt * 5); c.glow = b.atkT / 0.8; }
          else if (b.atkT < 1.1) { c.ext = 1 - Math.pow(1 - (b.atkT - 0.8) / 0.3, 2); c.glow = 1; if (b.n === 1) { b.n = 2; A.sfx("dart"); } }
          else if (b.atkT < 1.45) c.ext = 1;
          else if (b.atkT < 2.15) { c.ext = 1 - (b.atkT - 1.45) / 0.7; c.glow = c.ext; }
          else { c.ext = 0; c.glow = 0; endAtk(b, 1.1); }
        } else if (b.atk === 3) {
          if (b.nt <= 0) {
            b.nt = 0.5; b.n++;
            ring(parts.eye.x, parts.eye.y, 16, 200, b.n * 0.2, { k: "e_fire" });
            A.sfx("eshot2");
            if (b.n >= 3) endAtk(b, 1.2);
          }
        }
      };
      b.touch = (p) => { const P = b.parts(); return ellHit(P.body, p.x, p.y, 8) || circHit(P.clawA, p.x, p.y, 8) || circHit(P.clawB, p.x, p.y, 8); };
      b.draw = (ctx) => drawCrab(ctx, b);
      return b;
    },

    angler() {
      const b = bossBase({ name: "ABYSSAL ANGLER", hp: 2700, maxHp: 2700, x: W + 340, cx: W - 250, mouth: 0, mode: "idle", bonus: 30000 });
      b.lure = () => ({ x: b.x - 175 + Math.sin(b.t * 1.7) * 20, y: b.y - 150 + Math.cos(b.t * 1.3) * 14, r: 24 });
      b.bounds = () => ({ x: b.x, y: b.y, rx: 160, ry: 90 });
      b.test = (x, y, r) => {
        if (circHit(b.lure(), x, y, r)) return "weak";
        if (ellHit({ x: b.x, y: b.y, rx: 165, ry: 92 }, x, y, r)) return "armor";
        return null;
      };
      b.touch = (p) => ellHit({ x: b.x, y: b.y, rx: 160, ry: 85 }, p.x, p.y, 8);
      b.update = (dt) => {
        b.t += dt;
        const top = Math.max(60, G.ceilAt(b.x - 150)) + 200, bot = Math.min(H, G.floorAt(b.x)) - 110;
        const ty = U.clamp(G.player.y + 40, top, Math.max(top, bot));
        if (b.mode !== "dash") b.y += (ty - b.y) * Math.min(1, dt * 0.8);
        b.mouth = U.lerp(b.mouth, b.mouthT || 0, Math.min(1, dt * 8));
        if (!b.entered) { b.x += (b.cx - b.x) * Math.min(1, dt * 1.0); if (b.x < b.cx + 8) { b.entered = true; A.sfx("roar"); } return; }
        if (b.dying) return;
        if (b.mode === "dash") { b.x -= 950 * dt; if (b.x < 330) b.mode = "back"; return; }
        if (b.mode === "back") { b.x += 330 * dt; b.mouthT = 0; if (b.x >= b.cx) { b.x = b.cx; b.mode = "idle"; endAtk(b, 1.0); } return; }
        const P2 = b.hp < b.maxHp * 0.5;
        if (b.atk < 0) { b.cool -= dt; if (b.cool <= 0) { b.atk = b.step++ % (P2 ? 4 : 3); b.atkT = 0; b.n = 0; b.nt = 0; } return; }
        b.atkT += dt; b.nt -= dt;
        if (b.atk === 0) {
          if (b.nt <= 0) {
            b.nt = 0.4; b.n++;
            const L = b.lure();
            eshot(L.x, L.y, Math.atan2(G.player.y - L.y, G.player.x - L.x) + U.rand(-0.5, 0.5), 170, { k: "e_green", r: 8, home: 1.8 });
            A.sfx("eshot");
            if (b.n >= 5 + (P2 ? 2 : 0)) endAtk(b, 1.3);
          }
        } else if (b.atk === 1) {
          b.mouthT = 1;
          if (b.atkT > 0.5 && b.nt <= 0) {
            b.nt = 0.55; b.n++;
            const mx = b.x - 150, my = b.y + 18, a0 = Math.atan2(G.player.y - my, G.player.x - mx);
            for (let k = 0; k < 13; k++) eshot(mx, my, a0 - 0.75 + (k * 1.5) / 12, 230);
            A.sfx("eshot2");
            if (b.n >= 2) { b.mouthT = 0; endAtk(b, 1.2); }
          }
        } else if (b.atk === 2) {
          b.mouthT = 1;
          if (b.n === 0) { b.n = 1; A.sfx("roar"); }
          Fx.shake = Math.max(Fx.shake, 4);
          if (b.atkT > 0.9) b.mode = "dash";
        } else if (b.atk === 3) {
          if (b.nt <= 0) { b.nt = 0.3; b.n++; spawn("dart", { x: W + 40, y: U.rand(120, H - 160), noStat: true }); if (b.n >= 4) endAtk(b, 1.0); }
        }
      };
      b.draw = (ctx) => drawAngler(ctx, b);
      return b;
    },

    serpent() {
      const b = bossBase({ name: "MAGMA SERPENT", hp: 3000, maxHp: 3000, x: W + 120, y: H / 2, hx: W + 120, hy: H / 2, head: Math.PI, hist: [], segN: 14, sp: 6, bonus: 40000 });
      b.segs = () => { const out = []; for (let i = 0; i < b.segN; i++) { const k = Math.min(b.hist.length - 1, (i + 1) * b.sp); out.push(k >= 0 ? b.hist[k] : { x: b.x, y: b.y }); } return out; };
      b.bounds = () => { const s = U.pick(b.segs()); return { x: s.x, y: s.y, rx: 30, ry: 30 }; };
      b.test = (x, y, r) => {
        if (circHit({ x: b.x, y: b.y, r: 34 }, x, y, r)) return "weak";
        const segs = b.segs();
        for (let i = 0; i < segs.length; i++) if (circHit({ x: segs[i].x, y: segs[i].y, r: 26 - i * 0.6 }, x, y, r)) return "armor";
        return null;
      };
      b.touch = (p) => b.test(p.x, p.y, 6) !== null;
      b.update = (dt) => {
        b.t += dt;
        const P2 = b.hp < b.maxHp * 0.5;
        let tx = W * 0.6 + Math.cos(b.t * 0.55) * W * 0.3, ty = H * 0.5 + Math.sin(b.t * 1.1) * H * 0.27;
        if (b.t < 3) { tx = W * 0.72; ty = H / 2; }
        const want = Math.atan2(ty - b.y, tx - b.x);
        b.head += U.clamp(U.angDiff(want, b.head), -2.4 * dt, 2.4 * dt);
        const spd = b.dying ? 60 : P2 ? 330 : 270;
        b.x += Math.cos(b.head) * spd * dt; b.y += Math.sin(b.head) * spd * dt;
        b.hist.unshift({ x: b.x, y: b.y });
        if (b.hist.length > b.segN * b.sp + 4) b.hist.length = b.segN * b.sp + 4;
        if (Math.random() < 0.5) { const s = U.pick(b.segs()); Fx.glow(s.x + U.rand(-10, 10), s.y + U.rand(-10, 10), 4, 10, "255,140,40", 0.6, { vy: -40 }); }
        if (b.t > 3) b.entered = true;
        if (b.dying || !b.entered) return;
        if (b.atk < 0) { b.cool -= dt; if (b.cool <= 0) { b.atk = b.step++ % (P2 ? 3 : 2); b.atkT = 0; b.n = 0; b.nt = 0; } return; }
        b.atkT += dt; b.nt -= dt;
        if (b.atk === 0) {
          if (b.nt <= 0) {
            b.nt = 0.5; b.n++;
            const a = Math.atan2(G.player.y - b.y, G.player.x - b.x);
            for (let k = -1; k <= 1; k++) eshot(b.x, b.y, a + k * 0.2, 300, { k: "e_fire", r: 8 });
            A.sfx("eshot2");
            if (b.n >= 3) endAtk(b, 1.0);
          }
        } else if (b.atk === 1) {
          if (b.nt <= 0) {
            b.nt = 0.08;
            const s = b.segs()[b.n % b.segN];
            eshot(s.x, s.y, Math.atan2(G.player.y - s.y, G.player.x - s.x), 210, { k: "e_fire" });
            A.sfx("eshot");
            if (++b.n >= b.segN) endAtk(b, 1.2);
          }
        } else if (b.atk === 2) {
          if (b.nt <= 0) {
            b.nt = 0.45; b.n++;
            ring(b.x, b.y, 18, 190, b.n * 0.17, { k: "e_fire" });
            A.sfx("eshot2");
            if (b.n >= 3) endAtk(b, 1.0);
          }
        }
      };
      b.draw = (ctx) => drawSerpent(ctx, b);
      return b;
    },

    hive() {
      const b = bossBase({ name: "HIVE MOTHER", hp: 4400, maxHp: 4400, x: W + 280, cx: W - 230, guards: [], respawned: false, beam: null, bonus: 60000 });
      b.core = () => ({ x: b.x - 46, y: b.y, r: 44 });
      b.bounds = () => ({ x: b.x, y: b.y, rx: 110, ry: 140 });
      b.test = (x, y, r) => {
        if (circHit(b.core(), x, y, r)) return "weak";
        if (ellHit({ x: b.x + 30, y: b.y, rx: 100, ry: 150 }, x, y, r)) return "armor";
        return null;
      };
      b.touch = (p) => ellHit({ x: b.x, y: b.y, rx: 120, ry: 145 }, p.x, p.y, 8);
      function guards(n) { for (let i = 0; i < n; i++) b.guards.push(spawn("guard", { x: b.x, y: b.y, gi: i, gn: n, noStat: true })); }
      b.update = (dt) => {
        b.t += dt;
        b.y = H / 2 + Math.sin(b.t * 0.7) * 70;
        if (!b.entered) { b.x += (b.cx - b.x) * Math.min(1, dt * 1.0); if (b.x < b.cx + 8) { b.entered = true; guards(8); A.sfx("roar"); } }
        b.guards = b.guards.filter((e) => !e.dead);
        b.guards.forEach((e, i) => {
          const a = b.t * 0.7 + (e.gi * TAU) / e.gn;
          e.x = b.x - 30 + Math.cos(a) * 185; e.y = b.y + Math.sin(a) * 160;
        });
        b.vulnMul = b.guards.length >= 4 ? 0.2 : 1;
        if (b.dying || !b.entered) return;
        const P2 = b.hp < b.maxHp * 0.5;
        if (P2 && !b.respawned) { b.respawned = true; guards(5); A.sfx("roar"); }
        if (b.atk < 0) { b.cool -= dt; if (b.cool <= 0) { b.atk = b.step++ % 4; b.atkT = 0; b.n = 0; b.nt = 0; } return; }
        b.atkT += dt; b.nt -= dt;
        const c = b.core();
        if (b.atk === 0) {
          if (b.nt <= 0) { b.nt = P2 ? 0.06 : 0.08; const a = b.atkT * 3.2; eshot(c.x, c.y, a, 210, { k: "e_violet" }); eshot(c.x, c.y, a + Math.PI, 210, { k: "e_violet" }); if (P2) eshot(c.x, c.y, a + Math.PI / 2, 210, { k: "e_violet" }); A.sfx("eshot"); }
          if (b.atkT > 3) endAtk(b, 1.2);
        } else if (b.atk === 1) {
          if (b.nt <= 0) { b.nt = 0.3; b.n++; spawn("drone", { x: c.x - 30, y: c.y + U.rand(-30, 30), noStat: true }); if (b.n >= 5) endAtk(b, 1.0); }
        } else if (b.atk === 2) {
          if (!b.beam) { b.beam = { a: Math.atan2(G.player.y - c.y, G.player.x - c.x), on: false }; A.sfx("charge"); }
          const bm = b.beam;
          if (b.atkT > 1.0 && !bm.on) { bm.on = true; A.sfx("beam"); Fx.shake = 10; }
          if (bm.on) {
            bm.a += U.clamp(U.angDiff(Math.atan2(G.player.y - c.y, G.player.x - c.x), bm.a), -0.5 * dt, 0.5 * dt);
            const p = G.player, dx = p.x - c.x, dy = p.y - c.y, along = dx * Math.cos(bm.a) + dy * Math.sin(bm.a), perp = Math.abs(-dx * Math.sin(bm.a) + dy * Math.cos(bm.a));
            if (along > 0 && perp < 20) G.hurt(30);
            if (Math.random() < 0.6) { const d = U.rand(60, 1200); Fx.glow(c.x + Math.cos(bm.a) * d, c.y + Math.sin(bm.a) * d, 8, 20, "255,120,255", 0.3); }
          }
          if (b.atkT > (P2 ? 3.0 : 2.4)) { b.beam = null; endAtk(b, 1.2); }
        } else if (b.atk === 3) {
          if (b.nt <= 0) { b.nt = 0.45; b.n++; ring(c.x, c.y, 18, 200, b.n * 0.17, { k: "e_violet" }); A.sfx("eshot2"); if (b.n >= 3) endAtk(b, 1.0); }
        }
      };
      b.draw = (ctx) => drawHive(ctx, b);
      return b;
    },
  };

  function bossDamage(dmg, nova) {
    const b = G.boss;
    if (!b || b.dying || !b.entered) return;
    b.hp -= dmg * (nova ? 1 : b.vulnMul);
    b.flash = 0.06;
    if (b.hp <= 0) {
      b.hp = 0; b.dying = true; b.dieT = 0;
      setPhase("bossdeath");
      A.stopMusic();
      A.sfx("roar");
      for (const e of G.enemies) if (!ED[e.type].hazard) killEnemy(e, false);
      for (const e of G.eb) Fx.glow(e.x, e.y, 8, 20, "255,220,180", 0.3);
      G.eb.length = 0;
    }
  }

  /* ---------- Boss drawing ---------- */
  function drawCrab(ctx, b) {
    const P = b.parts();
    // legs
    ctx.lineCap = "round";
    for (let i = 0; i < 4; i++) {
      for (const side of [0, 1]) {
        const ax = b.x - 80 + i * 60 + side * 20, ay = b.y + 34;
        const ph = b.t * 3 + i * 1.3 + side * Math.PI;
        const fx = ax + 40 + Math.sin(ph) * 24, fly = Math.min(H, G.floorAt(fx)) - Math.max(0, Math.cos(ph)) * 10;
        const kx = (ax + fx) / 2 + 26, ky = Math.min(ay, fly) - 30;
        ctx.strokeStyle = side ? "#5a1608" : "#8a2810"; ctx.lineWidth = side ? 12 : 14;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(kx, ky); ctx.lineTo(fx, fly); ctx.stroke();
        ctx.strokeStyle = "rgba(255,170,110,0.35)"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(ax, ay - 3); ctx.lineTo(kx, ky - 3); ctx.stroke();
      }
    }
    // arms
    ctx.strokeStyle = "#7a2410"; ctx.lineWidth = 22;
    ctx.beginPath(); ctx.moveTo(b.x - 90, b.y - 10); ctx.lineTo(P.clawA.x + 30, P.clawA.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(b.x - 90, b.y + 30); ctx.lineTo(P.clawB.x + 20, P.clawB.y); ctx.stroke();
    // body shell
    const bx = b.x + 10, by = b.y;
    let gr = ctx.createLinearGradient(0, by - 80, 0, by + 50);
    gr.addColorStop(0, "#ffb07a"); gr.addColorStop(0.3, "#d8501f"); gr.addColorStop(0.75, "#6a1806"); gr.addColorStop(1, "#2a0802");
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.ellipse(bx, by, 150, 82, 0, Math.PI, TAU); ctx.ellipse(bx, by, 150, 44, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = "rgba(40,6,0,0.7)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = "rgba(60,10,0,0.55)"; ctx.lineWidth = 3;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.ellipse(bx + 20, by + 10, 150 - i * 30, 80 - i * 15, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
    ctx.fillStyle = "#4a0e02";
    for (let i = 0; i < 6; i++) { const x = bx - 70 + i * 32; ctx.beginPath(); ctx.moveTo(x - 9, by - 70 + Math.abs(i - 2.5) * 6); ctx.lineTo(x, by - 100 + Math.abs(i - 2.5) * 7); ctx.lineTo(x + 9, by - 70 + Math.abs(i - 2.5) * 6); ctx.fill(); }
    ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.beginPath(); ctx.ellipse(bx - 10, by - 55, 70, 12, -0.08, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 3; i++) Gfx.glowAt(ctx, "120,255,200", bx + 30 + i * 30, by + 18, 14, 0.5 + 0.3 * Math.sin(b.t * 4 + i));
    ctx.globalCompositeOperation = "source-over";
    // claws
    drawPincer(ctx, P.clawA.x, P.clawA.y, 1.25, 0.25 + 0.35 * Math.abs(Math.sin(b.t * 3)), b.claw.glow);
    drawPincer(ctx, P.clawB.x, P.clawB.y, 1.0, 0.2 + 0.25 * Math.abs(Math.sin(b.t * 2.4)), 0);
    // eye
    const E = P.eye;
    ctx.fillStyle = "#1a0400"; ctx.beginPath(); ctx.arc(E.x, E.y, E.r + 8, 0, TAU); ctx.fill();
    gr = ctx.createRadialGradient(E.x - 6, E.y - 6, 2, E.x, E.y, E.r);
    gr.addColorStop(0, b.flash > 0 ? "#fff" : "#fff6b0"); gr.addColorStop(0.4, b.flash > 0 ? "#fff" : "#ff5a20"); gr.addColorStop(1, "#5a0800");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(E.x, E.y, E.r, 0, TAU); ctx.fill();
    const pa = Math.atan2(G.player.y - E.y, G.player.x - E.x);
    ctx.fillStyle = "#120000"; ctx.beginPath(); ctx.ellipse(E.x + Math.cos(pa) * 10, E.y + Math.sin(pa) * 10, 6, 11, 0, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,120,40", E.x, E.y, 60, 0.4 + (b.flash > 0 ? 0.5 : 0)); ctx.globalCompositeOperation = "source-over";
  }
  function drawPincer(ctx, x, y, s, open, glow) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const gr = ctx.createLinearGradient(0, -40, 0, 40);
    gr.addColorStop(0, "#ffb07a"); gr.addColorStop(0.5, "#c8401a"); gr.addColorStop(1, "#4a0e02");
    ctx.fillStyle = gr; ctx.strokeStyle = "rgba(40,6,0,0.8)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(18, 0, 30, 24, 0, 0, TAU); ctx.fill(); ctx.stroke();
    for (const sgn of [-1, 1]) {
      ctx.save(); ctx.rotate(sgn * open);
      ctx.beginPath(); ctx.moveTo(4, sgn * 4); ctx.quadraticCurveTo(-30, sgn * 30, -52, sgn * 6); ctx.quadraticCurveTo(-30, sgn * 10, 4, sgn * 16); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    if (glow > 0) { ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,90,40", -10, 0, 50, glow * 0.8, true); ctx.globalCompositeOperation = "source-over"; }
    ctx.restore();
  }

  function drawAngler(ctx, b) {
    const x = b.x, y = b.y, L = b.lure();
    // tail
    ctx.fillStyle = "#0c1a20";
    ctx.beginPath(); ctx.moveTo(x + 130, y); ctx.lineTo(x + 230, y - 70 + Math.sin(b.t * 3) * 10); ctx.lineTo(x + 205, y); ctx.lineTo(x + 230, y + 70 + Math.sin(b.t * 3) * 10); ctx.closePath(); ctx.fill();
    // body
    let gr = ctx.createRadialGradient(x - 20, y - 50, 10, x, y, 190);
    gr.addColorStop(0, "#3a5a66"); gr.addColorStop(0.5, "#16262e"); gr.addColorStop(1, "#04080a");
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.ellipse(x, y, 170, 100, 0, 0, TAU); ctx.fill();
    // fins
    ctx.fillStyle = "#0f2229";
    ctx.beginPath(); ctx.moveTo(x - 20, y - 95); ctx.lineTo(x + 40, y - 150); ctx.lineTo(x + 80, y - 85); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 10, y + 70); ctx.quadraticCurveTo(x + 40, y + 140 + Math.sin(b.t * 2) * 10, x + 90, y + 80); ctx.fill();
    // mouth
    const m = b.mouth;
    ctx.fillStyle = "#020304";
    ctx.beginPath(); ctx.moveTo(x - 175, y - 10); ctx.quadraticCurveTo(x - 90, y + 6 - m * 20, x - 40, y + 4); ctx.quadraticCurveTo(x - 90, y + 40 + m * 70, x - 165, y + 30 + m * 60); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#e8f0f0";
    for (let i = 0; i < 7; i++) {
      const tx = x - 165 + i * 18;
      ctx.beginPath(); ctx.moveTo(tx, y - 8 + i * 1.5); ctx.lineTo(tx + 5, y + 18 + i); ctx.lineTo(tx + 10, y - 6 + i * 1.5); ctx.fill();
      const by = y + 30 + m * 60 - i * (4 + m * 6);
      ctx.beginPath(); ctx.moveTo(tx + 2, by); ctx.lineTo(tx + 7, by - 22); ctx.lineTo(tx + 12, by - 2); ctx.fill();
    }
    // spots
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 9; i++) Gfx.glowAt(ctx, "80,220,255", x - 40 + (i % 5) * 40, y - 40 + Math.floor(i / 5) * 60 + (i % 2) * 10, 10, 0.45 + 0.3 * Math.sin(b.t * 3 + i));
    // eye
    Gfx.glowAt(ctx, "255,240,140", x - 95, y - 40, 34, b.mode === "idle" ? 0.6 : 1, true);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(x - 95, y - 40, 5, 0, TAU); ctx.fill();
    // stalk and lure
    ctx.strokeStyle = "#1e3440"; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(x - 60, y - 88); ctx.quadraticCurveTo(x - 110, y - 210, L.x, L.y); ctx.stroke();
    ctx.globalCompositeOperation = "lighter";
    Gfx.glowAt(ctx, "120,255,200", L.x, L.y, 130, 0.35);
    Gfx.glowAt(ctx, b.flash > 0 ? "255,255,255" : "150,255,210", L.x, L.y, 34, 1, true);
    ctx.globalCompositeOperation = "source-over";
  }

  function drawSerpent(ctx, b) {
    const segs = b.segs();
    for (let i = segs.length - 1; i >= 0; i--) {
      const s = segs[i], r = 28 - i * 0.7;
      const gr = ctx.createRadialGradient(s.x - r * 0.3, s.y - r * 0.3, 2, s.x, s.y, r);
      gr.addColorStop(0, "#6a3a2a"); gr.addColorStop(0.7, "#2a120c"); gr.addColorStop(1, "#0c0402");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(255,${110 + 40 * Math.sin(b.t * 4 + i) | 0},30,0.9)`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(s.x - r * 0.6, s.y - r * 0.2); ctx.lineTo(s.x - r * 0.1, s.y + r * 0.1); ctx.lineTo(s.x + r * 0.5, s.y - r * 0.3); ctx.stroke();
      ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "255,100,20", s.x, s.y, r * 1.3, 0.25); ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#1a0806";
      ctx.beginPath(); ctx.moveTo(s.x - 8, s.y - r + 2); ctx.lineTo(s.x, s.y - r - 12); ctx.lineTo(s.x + 8, s.y - r + 2); ctx.fill();
    }
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.head);
    const gr = ctx.createLinearGradient(0, -36, 0, 36);
    gr.addColorStop(0, "#7a4a36"); gr.addColorStop(0.5, "#3a1a10"); gr.addColorStop(1, "#120604");
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(-30, -30); ctx.quadraticCurveTo(30, -38, 56, -10); ctx.lineTo(58, 8); ctx.quadraticCurveTo(30, 36, -30, 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#1a0806";
    ctx.beginPath(); ctx.moveTo(-10, -28); ctx.lineTo(-44, -58); ctx.lineTo(-24, -24); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10, 28); ctx.lineTo(-44, 58); ctx.lineTo(-24, 24); ctx.fill();
    ctx.fillStyle = "#ff7a20"; ctx.fillRect(30, -2, 28, 4);
    ctx.globalCompositeOperation = "lighter";
    Gfx.glowAt(ctx, b.flash > 0 ? "255,255,255" : "255,200,60", 26, -16, 16, 1, true);
    Gfx.glowAt(ctx, b.flash > 0 ? "255,255,255" : "255,200,60", 26, 16, 16, 1, true);
    Gfx.glowAt(ctx, "255,120,30", 40, 0, 50, 0.4);
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

  function drawHive(ctx, b) {
    const x = b.x, y = b.y, c = b.core();
    // tentacles
    ctx.lineCap = "round";
    for (let i = 0; i < 5; i++) {
      const a0 = -0.9 + i * 0.45;
      ctx.strokeStyle = "#3a1046"; ctx.lineWidth = 16 - i;
      ctx.beginPath(); ctx.moveTo(x + 60, y + Math.sin(a0) * 100);
      for (let k = 1; k <= 6; k++) ctx.lineTo(x + 60 + k * 30, y + Math.sin(a0) * (100 + k * 30) + Math.sin(b.t * 2 + i + k * 0.8) * k * 7);
      ctx.stroke();
    }
    // shell
    let gr = ctx.createRadialGradient(x - 20, y - 40, 20, x + 30, y, 170);
    gr.addColorStop(0, "#c050c0"); gr.addColorStop(0.5, "#5a1a66"); gr.addColorStop(1, "#14041c");
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.ellipse(x + 30, y, 110, 155, 0, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255,110,230,${0.35 + 0.2 * Math.sin(b.t * 3)})`; ctx.lineWidth = 2.5;
    for (let i = 0; i < 7; i++) {
      const a = -1.3 + i * 0.43;
      ctx.beginPath(); ctx.moveTo(c.x + Math.cos(a) * 55, c.y + Math.sin(a) * 55);
      ctx.quadraticCurveTo(x + 40 + Math.cos(a) * 60, y + Math.sin(a) * 120, x + 30 + Math.cos(a) * 100, y + Math.sin(a) * 145);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    // core opening
    ctx.fillStyle = "#12000e"; ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 14, 0, TAU); ctx.fill();
    gr = ctx.createRadialGradient(c.x - 10, c.y - 10, 4, c.x, c.y, c.r);
    gr.addColorStop(0, b.flash > 0 ? "#fff" : "#fff0c0"); gr.addColorStop(0.35, b.flash > 0 ? "#fff" : "#ff60c0"); gr.addColorStop(1, "#40002a");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.fill();
    const pa = Math.atan2(G.player.y - c.y, G.player.x - c.x);
    ctx.fillStyle = "#14000a"; ctx.beginPath(); ctx.ellipse(c.x + Math.cos(pa) * 16, c.y + Math.sin(pa) * 16, 8, 20, 0, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    Gfx.glowAt(ctx, "255,90,220", c.x, c.y, 110, 0.35);
    if (b.vulnMul < 1) {
      ctx.strokeStyle = `rgba(150,220,255,${0.45 + 0.2 * Math.sin(b.t * 8)})`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 22, 0, TAU); ctx.stroke();
      Gfx.glowAt(ctx, "120,200,255", c.x, c.y, c.r + 40, 0.25);
    }
    if (b.beam) {
      const bm = b.beam, ex = c.x + Math.cos(bm.a) * 1600, ey = c.y + Math.sin(bm.a) * 1600;
      if (bm.on) {
        for (const [w, col] of [[44, "rgba(255,60,200,0.25)"], [20, "rgba(255,150,240,0.6)"], [7, "rgba(255,255,255,0.95)"]]) {
          ctx.strokeStyle = col; ctx.lineWidth = w * (0.9 + Math.random() * 0.2);
          ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(ex, ey); ctx.stroke();
        }
        Gfx.glowAt(ctx, "255,180,255", c.x, c.y, 80, 0.9, true);
      } else {
        ctx.strokeStyle = `rgba(255,120,220,${0.3 + 0.3 * Math.sin(b.t * 30)})`; ctx.lineWidth = 2;
        ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
        Gfx.glowAt(ctx, "255,120,220", c.x, c.y, 30 + b.atkT * 50, 0.7, true);
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }

  /* ---------- Main update ---------- */
  function blast(x, y, rad, dmg) {
    Fx.explode(x, y, rad * 0.5, { rgb: "255,200,120" });
    A.sfx("boom");
    for (const e of G.enemies.slice()) if (!e.hidden && U.dist2(e.x, e.y, x, y) < (rad + e.rx) * (rad + e.rx)) damageEnemy(e, dmg, e.x, e.y);
    if (G.boss && G.boss.test(x, y, rad) === "weak") bossDamage(dmg);
    else if (G.boss && G.boss.test(x, y, rad)) bossDamage(dmg * 0.25);
  }

  function nearestEnemy(x, y) {
    let best = null, bd = 1e12;
    for (const e of G.enemies) {
      if (e.dead || e.hidden || ED[e.type].hazard || e.x > W + 10 || e.x < 0) continue;
      const d = U.dist2(e.x, e.y, x, y);
      if (d < bd) { bd = d; best = e; }
    }
    if (!best && G.boss && G.boss.entered && !G.boss.dying) {
      const B = G.boss;
      const t = B.lure ? B.lure() : B.core ? B.core() : B.parts ? B.parts().eye : { x: B.x, y: B.y };
      best = { x: t.x, y: t.y };
    }
    return best;
  }

  function pbUpdate(dt) {
    for (let i = G.pb.length - 1; i >= 0; i--) {
      const b = G.pb[i];
      b.t += dt; b.life -= dt;
      if (b.k === "wave") { b.x += b.vx * dt; b.y = b.y0 + Math.sin(b.t * 14 + b.ph) * b.amp; }
      else if (b.k === "missile") {
        b.retarget -= dt;
        if (b.retarget <= 0) { b.target = nearestEnemy(b.x, b.y); b.retarget = 0.2; }
        let cur = Math.atan2(b.vy, b.vx);
        if (b.target && b.t > 0.15) cur += U.clamp(U.angDiff(Math.atan2(b.target.y - b.y, b.target.x - b.x), cur), -7 * dt, 7 * dt);
        const sp = Math.min(760, Math.hypot(b.vx, b.vy) + 900 * dt);
        b.vx = Math.cos(cur) * sp; b.vy = Math.sin(cur) * sp;
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (Math.random() < 0.7) Fx.add({ k: "smoke", x: b.x - b.vx * 0.02, y: b.y - b.vy * 0.02, vx: 0, vy: -10, size: 3, size2: 9, life: 0.5 });
      } else {
        if (b.g) b.vy += b.g * dt;
        b.x += b.vx * dt; b.y += b.vy * dt;
      }
      let gone = b.life <= 0 || b.x > W + 100 || b.x < -100 || b.y < -60 || b.y > H + 60;
      if (!gone && (b.y > G.floorAt(b.x) || b.y < G.ceilAt(b.x))) {
        gone = true;
        if (b.k === "depth" || b.k === "missile") blast(b.x, b.y, b.k === "depth" ? 70 : 40, b.k === "depth" ? 40 : b.dmg);
        else Fx.hitSpark(b.x, b.y, "200,230,255", 2);
      }
      if (!gone) {
        for (const e of G.enemies) {
          if (e.dead || e.hidden || ED[e.type].hazard) continue;
          const hit = hitE(e, b.x, b.y, b.r) || (b.len && hitE(e, b.x - b.len * 0.6, b.y, b.r));
          if (!hit) continue;
          if (b.pierce) {
            if (b.hits.has(e)) continue;
            b.hits.add(e);
            damageEnemy(e, b.dmg, b.x, b.y);
            if (--b.pierce <= 0) { gone = true; break; }
          } else {
            if (b.k === "depth" || b.k === "missile") blast(b.x, b.y, b.k === "depth" ? 70 : 40, b.k === "depth" ? 40 : b.dmg);
            else damageEnemy(e, b.dmg, b.x, b.y);
            gone = true; break;
          }
        }
      }
      if (!gone && G.boss && !G.boss.dying) {
        const res = G.boss.test(b.x, b.y, b.r);
        if (res) {
          if (b.k === "depth" || b.k === "missile") blast(b.x, b.y, b.k === "depth" ? 70 : 40, b.k === "depth" ? 40 : b.dmg);
          else if (res === "weak") { bossDamage(b.dmg); Fx.hitSpark(b.x, b.y, "255,240,200", 3); A.sfx("hit"); }
          else { Fx.hitSpark(b.x, b.y, "180,200,220", 2); A.sfx("ping"); }
          gone = true;
        }
      }
      if (gone) G.pb.splice(i, 1);
    }
  }

  function ebUpdate(dt) {
    const p = G.player;
    for (let i = G.eb.length - 1; i >= 0; i--) {
      const b = G.eb[i];
      b.t += dt;
      if (b.home > 0 && !p.dead) {
        b.home -= dt;
        let cur = Math.atan2(b.vy, b.vx);
        const sp = Math.hypot(b.vx, b.vy);
        cur += U.clamp(U.angDiff(Math.atan2(p.y - b.y, p.x - b.x), cur), -2.2 * dt, 2.2 * dt);
        b.vx = Math.cos(cur) * sp; b.vy = Math.sin(cur) * sp;
      }
      if (b.g) b.vy += b.g * dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      let gone = b.x < -40 || b.x > W + 40 || b.y < -40 || b.y > H + 40 || b.t > 9;
      if (!gone && (b.y > G.floorAt(b.x) + 4 || b.y < G.ceilAt(b.x) - 4)) { gone = true; Fx.glow(b.x, b.y, 6, 16, "255,140,100", 0.2); }
      if (!gone && !p.dead && U.dist2(b.x, b.y, p.x, p.y) < (b.r + p.r) * (b.r + p.r)) { G.hurt(b.dmg); gone = true; Fx.hitSpark(b.x, b.y, "255,120,120", 4); }
      if (gone) G.eb.splice(i, 1);
    }
  }

  function enemiesUpdate(dt) {
    const p = G.player;
    for (const e of G.enemies) {
      e.t += dt;
      if (e.flash > 0) e.flash -= dt;
      ED[e.type].update(e, dt);
      if (!e.dead && !e.hidden && !ED[e.type].hazard && !p.dead && hitE(e, p.x, p.y, p.r + 2)) {
        G.hurt(e.type === "torp" ? 25 : 30);
        damageEnemy(e, e.type === "mine" || e.type === "torp" ? 999 : 50, p.x, p.y);
      }
      if (e.x < -220 || e.x > W + 500 || e.y < -250 || e.y > H + 250) e.dead = true;
    }
    G.enemies = G.enemies.filter((e) => !e.dead);
  }

  G.update = function (dt) {
    G.t += dt; G.phaseT += dt;
    if (G.cheat) G.run.cheated = true;
    G.camX += G.scroll * dt;
    const L = G.L;
    switch (G.phase) {
      case "intro":
        if (G.phaseT > 3) setPhase("fight");
        break;
      case "fight":
        if (G.seqIndex < L.seq.length) {
          if (G.t >= G.nextPattern) { const pat = PAT[L.seq[G.seqIndex++]]; pat.run(); G.nextPattern = G.t + pat.dur; }
        } else if (!G.queue.length && (G.enemies.filter((e) => !ED[e.type].hazard).length === 0 || G.t > G.nextPattern + 6)) {
          setPhase("warning"); A.stopMusic(); A.sfx("alarm");
        }
        break;
      case "warning":
        if (G.phaseT > 3) { G.boss = BOSSES[L.boss](); setPhase("boss"); A.playSong("boss"); }
        break;
      case "boss":
        G.scroll = U.lerp(G.scroll, 24, Math.min(1, dt));
        if (G.boss && !G.player.dead && G.boss.touch(G.player)) G.hurt(35);
        break;
      case "bossdeath": {
        const b = G.boss;
        b.dieT += dt;
        if (Math.floor(b.dieT * 10) !== Math.floor((b.dieT - dt) * 10)) {
          const B = b.bounds();
          Fx.explode(B.x + U.rand(-B.rx, B.rx) * 0.8, B.y + U.rand(-B.ry, B.ry) * 0.8, U.rand(22, 50));
          A.sfx(Math.random() < 0.5 ? "boomBig" : "boom");
        }
        Fx.shake = Math.max(Fx.shake, 10);
        if (G.phaseT > 3.2) {
          Fx.explode(b.x, b.y, 220, { rgb: "255,220,180" });
          Fx.flash = 1; Fx.flashRGB = "255,250,240";
          A.sfx("boomHuge");
          G.addScore(b.bonus, b.x, b.y);
          G.clearBonus = { boss: G.run.cheated ? 0 : b.bonus };
          for (let i = 0; i < 12; i++) drop(b.x + U.rand(-80, 80), b.y + U.rand(-80, 80), "gem");
          G.boss = null;
          setPhase("clear");
        }
        break;
      }
      case "clear":
        if (G.phaseT > 1.2 && !G.clearJingle) { G.clearJingle = true; A.jingle("clear"); }
        if (G.phaseT > 2.4 && !G.player.dead) G.player.exiting = true;
        break;
    }
    if (G.phase !== "clear") G.clearJingle = false;
    for (let i = G.queue.length - 1; i >= 0; i--) if (G.t >= G.queue[i].at) { const f = G.queue[i].fn; G.queue.splice(i, 1); f(); }
    playerUpdate(dt);
    podsUpdate(dt);
    pbUpdate(dt);
    enemiesUpdate(dt);
    if (G.boss) { G.boss.update(dt); if (G.boss.flash > 0) G.boss.flash -= dt; }
    ebUpdate(dt);
    pickupsUpdate(dt);
    Fx.update(dt);
    if (G.gameOverT > 0) { G.gameOverT -= dt; if (G.gameOverT <= 0 && G.onGameOver) G.onGameOver(); }
  };

  G.progress = () => (G.phase === "fight" || G.phase === "intro" ? Math.min(1, G.seqIndex / G.L.seq.length) : 1);

  /* ---------- Drawing ---------- */
  function drawPlayer(ctx) {
    const p = G.player, r = G.run;
    if (p.dead) return;
    const blink = p.inv > 0 && Math.floor(G.t * 20) % 2 === 0;
    const alpha = blink ? 0.4 : 1;
    // engine flame
    const len = 16 + Math.max(0, p.thrust) * 30 + Math.random() * 8;
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;
    ctx.drawImage(Gfx.glow("90,200,255", true), p.x - 46 - len, p.y - 8, len + 10, 16);
    Gfx.glowAt(ctx, "80,190,255", p.x - 46, p.y, 22, 0.6 * alpha);
    Gfx.glowAt(ctx, "160,220,255", p.x + 30, p.y, 70, 0.08);
    ctx.globalCompositeOperation = "source-over";
    Gfx.draw(ctx, "ship", p.x, p.y, p.tilt, 1, p.hitFl > 0, alpha);
    if (Math.random() < 0.4) Fx.bubbles(p.x - 50, p.y, 1, 3);
    if (r.shield && (p.shield > 0 || p.shieldFl > 0)) {
      const a = 0.12 + p.shieldFl * 1.6;
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(120,220,255,${a})`; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 56, 34, p.tilt, 0, TAU); ctx.stroke();
      Gfx.glowAt(ctx, "100,200,255", p.x, p.y, 62, a * 0.5);
      ctx.globalCompositeOperation = "source-over";
    }
  }

  function drawPB(ctx) {
    ctx.globalCompositeOperation = "lighter";
    for (const b of G.pb) {
      switch (b.k) {
        case "pulse": Gfx.draw(ctx, "b_pulse", b.x, b.y, Math.atan2(b.vy, b.vx)); break;
        case "podshot": Gfx.draw(ctx, "b_pulse", b.x, b.y, Math.atan2(b.vy, b.vx), 0.65); break;
        case "spread": Gfx.draw(ctx, "b_spread", b.x, b.y); break;
        case "wave": Gfx.draw(ctx, "b_wave", b.x, b.y, 0, b.r / 12); break;
        case "laser":
          ctx.strokeStyle = "rgba(90,255,190,0.35)"; ctx.lineWidth = 9;
          ctx.beginPath(); ctx.moveTo(b.x - b.len, b.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.strokeStyle = "rgba(220,255,240,0.95)"; ctx.lineWidth = 2.5; ctx.stroke();
          Gfx.glowAt(ctx, "120,255,200", b.x, b.y, 14, 0.8, true);
          break;
        case "missile":
          ctx.globalCompositeOperation = "source-over";
          Gfx.draw(ctx, "b_missile", b.x, b.y, Math.atan2(b.vy, b.vx));
          ctx.globalCompositeOperation = "lighter";
          Gfx.glowAt(ctx, "255,180,80", b.x - Math.cos(Math.atan2(b.vy, b.vx)) * 12, b.y - Math.sin(Math.atan2(b.vy, b.vx)) * 12, 10, 0.9, true);
          break;
        case "depth":
          ctx.globalCompositeOperation = "source-over";
          Gfx.draw(ctx, "b_depth", b.x, b.y, b.t * 4);
          ctx.globalCompositeOperation = "lighter";
          break;
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }

  G.draw = function (ctx) {
    const th = G.theme;
    Gfx.drawBackground(ctx, th, G.camX, G.t);
    Gfx.drawTerrain(ctx, th, G.camX, G.terr, G.t);
    for (const k of G.pickups) {
      const s = 1 + Math.sin(k.t * 6) * 0.08;
      if (k.t > 13 && Math.floor(k.t * 10) % 2) continue;
      Gfx.draw(ctx, PICK_SPR[k.kind], k.x, k.y, k.kind === "gem" ? Math.sin(k.t * 3) * 0.3 : 0, s);
    }
    for (const e of G.enemies) {
      if (e.hidden) continue;
      const d = ED[e.type], white = e.flash > 0;
      if (d.draw) d.draw(ctx, e, white);
      else Gfx.draw(ctx, e.spr, e.x, e.y, e.ang, 1, white);
    }
    if (G.boss) G.boss.draw(ctx);
    drawPB(ctx);
    for (const pd of G.pods) {
      if (G.player.dead) continue;
      ctx.globalCompositeOperation = "lighter"; Gfx.glowAt(ctx, "80,220,255", pd.x, pd.y, 22, 0.35); ctx.globalCompositeOperation = "source-over";
      Gfx.draw(ctx, "pod", pd.x, pd.y, pd.dir || 0);
    }
    drawPlayer(ctx);
    ctx.globalCompositeOperation = "lighter";
    for (const b of G.eb) Gfx.draw(ctx, b.k, b.x, b.y, 0, b.r / 6.5);
    ctx.globalCompositeOperation = "source-over";
    Fx.draw(ctx);
    Gfx.drawOverlay(ctx, th);
  };
})(window.XA);
