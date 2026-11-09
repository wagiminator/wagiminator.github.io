/* DREAMHOP: platformer engine – Lulu, physics, blocks, items, enemies, bosses */
"use strict";

(function (XA) {
  const { U, Gfx } = XA;
  const A = XA.Audio, I = XA.Input;
  const TS = Gfx.TS, LW = Gfx.LW, LH = Gfx.LH, TAU = U.TAU;
  const G = (XA.G = { cheat: false, autopilot: null, mouseMode: false });

  const GRAV = 900, JUMP = -360, MAXV = 105, MAXFALL = 400;
  const SOLID = new Set(["#", "S", "B", "?", "P", "!", "U"]);

  G.newGame = function () {
    G.run = { score: 0, lives: 3, gems: 0, power: 0, world: 0, level: 0, cheated: G.cheat };
  };

  G.startLevel = function (wi, li, fromCheck) {
    const r = G.run;
    r.world = wi; r.level = li;
    const lvl = (G.lvl = XA.Levels.build(wi, li));
    G.items = []; G.enemies = []; G.shots = []; G.eshots = []; G.parts = []; G.plats = []; G.pops = []; G.bumps = [];
    G.boss = null; G.bossActive = false; G.camLock = null;
    G.t = 0; G.freeze = 0; G.shield = 0; G.flash = 0; G.time = lvl.time; G.hurry = false; G.phase = "play"; G.phaseT = 0;
    G.checkX = fromCheck !== undefined ? fromCheck : null;
    for (const o of lvl.objs) {
      const x = o.c * TS, y = o.r * TS;
      if (o.kind === "gem") G.items.push({ kind: "gem", x: x + 2, y: y + 2, w: 12, h: 12, t: Math.random() * 3 });
      else if (o.kind === "hplat") G.plats.push({ x, y, w: 48, h: 10, x0: x, y0: y, ax: 48, ay: 0, t: 0, dx: 0, dy: 0 });
      else if (o.kind === "vplat") G.plats.push({ x, y, w: 48, h: 10, x0: x, y0: y, ax: 0, ay: 40, t: 0, dx: 0, dy: 0 });
      else if (o.kind === "spring") G.items.push({ kind: "spring", x, y: y + 16, w: 16, h: 16, t: 0, fixed: true });
      else if (o.kind === "check") G.items.push({ kind: "check", x, y: y + 20, w: 16, h: 12, on: fromCheck !== undefined && fromCheck >= x, fixed: true });
      else if (o.kind === "door" || o.kind === "door_locked") G.door = { x: x - 4, y: y - 8 + 16, w: 24, h: 40, locked: o.kind === "door_locked" };
      else G.enemies.push(newEnemy(o.kind, x, y));
    }
    const sx = fromCheck !== undefined ? fromCheck : 2 * TS;
    G.p = { x: sx, y: 9 * TS - 2, w: 10, h: 18, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, jumpBuf: 0, inv: 2, dead: false, deadT: 0, idle: 0, anim: 0, shootT: 0, fireCd: 0, win: false, plat: null, chain: 0 };
    G.cam = { x: Math.max(0, sx - 120), y: TS * 0.75 };
    XA.Audio.tempo = 1;
    A.playSong(Gfx.WORLDS[wi].song);
  };

  /* ---------- Tiles ---------- */
  const tile = (c, r) => (r < 0 || c < 0 || c >= G.lvl.w ? (c < 0 || c >= G.lvl.w ? "S" : ".") : r >= G.lvl.h ? "." : G.lvl.tiles[r][c]);
  const setTile = (c, r, ch) => { G.lvl.tiles[r][c] = ch; };
  const solidAt = (px, py) => SOLID.has(tile(Math.floor(px / TS), Math.floor(py / TS)));
  G.tile = tile;
  G.bumpTile = (c, r) => bumpTile(c, r);

  function bumpTile(c, r, who) {
    const ch = tile(c, r), p = G.p, run = G.run;
    G.bumps.push({ c, r, t: 0 });
    // enemies standing on the block are knocked out
    for (const e of G.enemies) if (!e.dead && Math.abs(e.x + e.w / 2 - (c * TS + 8)) < 12 && Math.abs(e.y + e.h - r * TS) < 4) killEnemy(e, true, 200);
    if (ch === "?" || ch === "h") {
      setTile(c, r, "U");
      G.pops.push({ x: c * TS + 2, y: r * TS - 12, vy: -160, t: 0 });
      addGem(); A.sfx("gem");
    } else if (ch === "u") {
      setTile(c, r, "U"); spawnItem("lolly", c, r); A.sfx("sprout");
    } else if (ch === "P") {
      setTile(c, r, "U"); spawnItem(run.power === 0 ? "orb" : run.power === 1 ? "wand" : "gemsack", c, r); A.sfx("sprout");
    } else if (ch === "!") {
      setTile(c, r, "U"); spawnItem(U.pick(["clock", "bolt", "bubble", "clock", "bubble", "lolly"]), c, r); A.sfx("sprout");
    } else if (ch === "B") {
      if (run.power >= 1) {
        setTile(c, r, ".");
        for (let i = 0; i < 4; i++) G.parts.push({ k: "debris", x: c * TS + 4 + (i % 2) * 8, y: r * TS + 4 + (i > 1 ? 8 : 0), vx: (i % 2 ? 60 : -60) + U.rand(-20, 20), vy: -200 - (i > 1 ? 0 : 80), life: 1.2 });
        addScore(50); A.sfx("brick");
      } else { A.sfx("bump"); stars(c * TS + 8, r * TS + 16); }
    } else A.sfx("bump");
  }

  // power-ups rise out of the block, then wander towards Lulu and drop down from the platform so she can catch them
  function spawnItem(kind, c, r) {
    const p = G.p, dir = p && p.x + p.w / 2 < c * TS + 8 ? -1 : 1; // towards Lulu
    G.items.push({ kind, x: c * TS + 1, y: r * TS, w: 14, h: 14, rise: 16, t: 0, moving: true, vx: dir * 42, vy: 0 });
  }
  function moveItem(it, dt) {
    it.vy = Math.min(320, it.vy + 700 * dt);
    // horizontal: turn around at walls
    const nx = it.x + it.vx * dt, ax = it.vx > 0 ? nx + it.w : nx;
    // it happily drops down from a platform, but never walks into a bottomless pit
    let pit = false;
    if (it.vy === 0 && !solidAt(ax, it.y + it.h + 2)) { pit = true; for (let k = 1; k < G.lvl.h; k++) if (solidAt(ax, it.y + it.h + k * TS)) { pit = false; break; } }
    if (pit || solidAt(ax, it.y + 2) || solidAt(ax, it.y + it.h - 2)) it.vx = -it.vx; else it.x = nx;
    // vertical: land on solid ground, otherwise fall
    const ny = it.y + it.vy * dt;
    if (it.vy > 0 && (solidAt(it.x + 2, ny + it.h) || solidAt(it.x + it.w - 2, ny + it.h))) { it.y = Math.floor((ny + it.h) / TS) * TS - it.h; it.vy = 0; }
    else if (it.vy < 0 && (solidAt(it.x + 2, ny) || solidAt(it.x + it.w - 2, ny))) it.vy = 0;
    else it.y = ny;
    if (it.y > G.lvl.h * TS + 32 || it.t > 25) it.gone = true;
  }
  function addGem() {
    const r = G.run;
    r.gems++; addScore(100);
    if (r.gems >= 100) { r.gems -= 100; extraLife(); }
  }
  function extraLife() { G.run.lives++; A.sfx("life"); text(G.p.x, G.p.y - 10, "1UP!"); }
  function addScore(n, x, y) {
    if (G.cheat) { G.run.cheated = true; return; }
    G.run.score += n;
    if (x !== undefined) text(x, y, String(n));
  }
  G.addScore = addScore;
  function text(x, y, s) { G.parts.push({ k: "text", x, y, vx: 0, vy: -40, life: 0.9, s }); }
  function stars(x, y) { for (let i = 0; i < 5; i++) G.parts.push({ k: "star", x, y, vx: Math.cos(i * 1.26) * 60, vy: Math.sin(i * 1.26) * 60 - 30, life: 0.5 }); }
  function puff(x, y, n = 4) { for (let i = 0; i < n; i++) G.parts.push({ k: "puff", x: x + U.rand(-4, 4), y, vx: U.rand(-30, 30), vy: U.rand(-20, -5), life: 0.4 }); }

  /* ---------- Body movement with tile collision ---------- */
  function moveBody(b, dt, isPlayer) {
    // horizontal
    b.x += b.vx * dt;
    let hitWall = false;
    if (b.vx > 0) { const x = b.x + b.w; if (solidAt(x, b.y + 1) || solidAt(x, b.y + b.h - 1) || solidAt(x, b.y + b.h / 2)) { b.x = Math.floor(x / TS) * TS - b.w - 0.01; b.vx = 0; hitWall = true; } }
    else if (b.vx < 0) { const x = b.x; if (solidAt(x, b.y + 1) || solidAt(x, b.y + b.h - 1) || solidAt(x, b.y + b.h / 2)) { b.x = (Math.floor(x / TS) + 1) * TS + 0.01; b.vx = 0; hitWall = true; } }
    // vertical
    const prevBottom = b.y + b.h;
    b.y += b.vy * dt;
    b.onGround = false;
    if (b.vy >= 0) {
      const y = b.y + b.h;
      for (const px of [b.x + 1, b.x + b.w - 1]) {
        const c = Math.floor(px / TS), r = Math.floor(y / TS), ch = tile(c, r);
        if (SOLID.has(ch) || (ch === "-" && prevBottom <= r * TS + 0.5)) { b.y = r * TS - b.h; b.vy = 0; b.onGround = true; break; }
      }
      // moving platforms
      if (!b.onGround) for (const pl of G.plats) {
        if (b.x + b.w > pl.x && b.x < pl.x + pl.w && prevBottom <= pl.y + 1 + Math.max(0, pl.dy) && b.y + b.h >= pl.y) { b.y = pl.y - b.h; b.vy = 0; b.onGround = true; b.plat = pl; break; }
      }
    } else {
      const y = b.y;
      for (const px of [b.x + 2, b.x + b.w - 2]) {
        const c = Math.floor(px / TS), r = Math.floor(y / TS), ch = tile(c, r);
        if (SOLID.has(ch) || (isPlayer && (ch === "h" || ch === "u"))) {
          b.y = (r + 1) * TS; b.vy = 40;
          if (isPlayer) bumpTile(Math.floor((b.x + b.w / 2) / TS) === c || !SOLID.has(tile(Math.floor((b.x + b.w / 2) / TS), r)) ? c : Math.floor((b.x + b.w / 2) / TS), r);
          break;
        }
      }
    }
    return hitWall;
  }

  /* ---------- Player ---------- */
  function playerUpdate(dt) {
    const p = G.p, run = G.run;
    if (p.dead) {
      p.deadT += dt;
      if (p.deadT > 0.5) { p.vy += GRAV * dt; p.y += p.vy * dt; }
      if (p.deadT > 2.6) G.onDeath && G.onDeath();
      return;
    }
    p.inv = Math.max(0, p.inv - dt);
    if (G.phase === "clear") { p.vx = 0; p.vy += GRAV * dt; moveBody(p, dt, true); return; }
    let mx = 0, jump = false, jumpHeld = false, fire = false;
    if (G.autopilot) { const a = G.autopilot(p); mx = a.mx; jump = a.jump; jumpHeld = a.jumpHeld; fire = a.fire; }
    else {
      if (I.held("left")) mx -= 1;
      if (I.held("right")) mx += 1;
      if (Math.abs(I.pad.axes[0]) > 0.3) mx = Math.sign(I.pad.axes[0]);
      jump = I.hit("jump") || (I.pad.axes[1] < -0.6 && !p.stickUp);
      p.stickUp = I.pad.axes[1] < -0.6;
      jumpHeld = I.held("jump") || p.stickUp;
      fire = I.hit("fire");
      if (mx || jump) G.mouseMode = false;
      if (I.mouse.moved && I.mouse.inside) G.mouseMode = true;
      if (G.mouseMode) {
        const wx = I.mouse.x / (U.W / LW) + G.cam.x - (p.x + p.w / 2);
        mx = Math.abs(wx) > 10 ? Math.sign(wx) : 0;
        if (I.mouse.clicked) jump = true;
        if (I.mouse.buttons & 1) jumpHeld = true;
        if (I.mouse.rclicked) fire = true;
      }
    }
    const acc = p.onGround ? 700 : 500;
    if (mx) {
      if (Math.sign(p.vx) === -mx && p.onGround && Math.abs(p.vx) > 60) puff(p.x + p.w / 2, p.y + p.h, 1);
      p.vx += mx * acc * dt; p.face = mx;
    } else if (p.onGround) { const f = 900 * dt; p.vx = Math.abs(p.vx) <= f ? 0 : p.vx - Math.sign(p.vx) * f; }
    p.vx = U.clamp(p.vx, -MAXV, MAXV);
    // jumping with coyote time and a jump buffer
    p.coyote = p.onGround ? 0.09 : p.coyote - dt;
    p.jumpBuf = jump ? 0.12 : p.jumpBuf - dt;
    if (p.jumpBuf > 0 && p.coyote > 0) { p.vy = JUMP; p.jumpBuf = 0; p.coyote = 0; p.plat = null; A.sfx("jump"); puff(p.x + p.w / 2, p.y + p.h, 3); }
    const g = p.vy < 0 && !jumpHeld ? GRAV * 2.4 : GRAV;
    p.vy = Math.min(MAXFALL, p.vy + g * dt);
    // ride moving platforms
    if (p.plat && p.onGround) { p.x += p.plat.dx; p.y += p.plat.dy; }
    const wasGround = p.onGround;
    p.plat = null;
    moveBody(p, dt, true);
    if (p.onGround && !wasGround && p.vy === 0) puff(p.x + p.w / 2, p.y + p.h, 2);
    if (p.onGround) p.chain = 0;
    p.x = Math.max(G.camLock ? G.camLock.x0 + TS : 0, Math.min(p.x, (G.camLock ? G.camLock.x1 - TS : G.lvl.w * TS) - p.w));
    // shooting with the star wand
    p.fireCd -= dt; p.shootT -= dt;
    if (fire && run.power >= 2 && p.fireCd <= 0 && G.shots.length < 3) {
      G.shots.push({ x: p.x + (p.face > 0 ? p.w : -6), y: p.y + 6, vx: p.face * 230, vy: -60, t: 0 });
      p.fireCd = 0.25; p.shootT = 0.2; A.sfx("shoot");
    }
    // spikes and liquid
    const fc = Math.floor((p.x + p.w / 2) / TS), fr = Math.floor((p.y + p.h - 2) / TS);
    if (tile(fc, fr) === "^") hurt();
    if (tile(fc, Math.floor((p.y + p.h + 2) / TS)) === "~" && p.y + p.h > Math.floor((p.y + p.h + 2) / TS) * TS + 4) fall();
    if (p.y > G.lvl.h * TS + 10) fall();
    // idle animation timer
    if (mx || jump || !p.onGround || fire) p.idle = 0; else p.idle += dt;
    if (p.idle > 5 && p.idle - dt <= 5) A.sfx("yawn");
    p.anim += Math.abs(p.vx) * dt * 0.08;
  }

  function hurt() {
    const p = G.p, run = G.run;
    if (p.inv > 0 || p.dead || G.shield > 0) return;
    if (G.cheat) { run.cheated = true; p.inv = 0.4; stars(p.x + 5, p.y); return; }
    if (run.power > 0) { run.power = 0; p.inv = 2; A.sfx("hurt"); stars(p.x + 5, p.y); return; }
    die();
  }
  function fall() {
    const p = G.p;
    if (p.dead) return;
    if (G.cheat) { G.run.cheated = true; p.vy = -560; p.y = Math.min(p.y, G.lvl.h * TS - 4); A.sfx("bounce"); return; }
    die();
  }
  function die() {
    const p = G.p;
    p.dead = true; p.deadT = 0; p.vy = -300; p.vx = 0;
    A.stopMusic(); A.sfx("die");
  }
  G.hurt = hurt;

  /* ---------- Items ---------- */
  function itemsUpdate(dt) {
    const p = G.p, run = G.run;
    for (let i = G.items.length - 1; i >= 0; i--) {
      const it = G.items[i];
      it.t += dt;
      if (it.rise > 0) { const d = Math.min(it.rise, 40 * dt); it.y -= d; it.rise -= d; continue; }
      if (it.moving && !G.freeze) { moveItem(it, dt); if (it.gone) { G.items.splice(i, 1); continue; } }
      if (it.kind === "spring") {
        if (!p.dead && p.vy > 0 && p.x + p.w > it.x + 2 && p.x < it.x + 14 && p.y + p.h >= it.y - 8 && p.y + p.h <= it.y + 4) { p.vy = -560; it.t = 0; A.sfx("bounce"); }
        continue;
      }
      if (p.dead || !(p.x < it.x + it.w && p.x + p.w > it.x && p.y < it.y + it.h && p.y + p.h > it.y)) continue;
      if (it.kind === "check") { if (!it.on) { it.on = true; G.checkX = it.x; A.sfx("power"); text(it.x, it.y - 10, "CHECKPOINT"); } continue; }
      G.items.splice(i, 1);
      switch (it.kind) {
        case "gem": addGem(); A.sfx("gem"); sparkle(it.x + 6, it.y + 6); break;
        case "orb": run.power = Math.max(run.power, 1); addScore(1000, it.x, it.y); A.sfx("power"); sparkle(p.x + 5, p.y, 12); text(p.x, p.y - 12, "DREAM POWER!"); break;
        case "wand": run.power = 2; addScore(1000, it.x, it.y); A.sfx("power"); sparkle(p.x + 5, p.y, 12); text(p.x, p.y - 12, "STAR WAND!"); break;
        case "gemsack": for (let k = 0; k < 10; k++) addGem(); A.sfx("gem"); text(p.x, p.y - 12, "+10 GEMS"); break;
        case "lolly": extraLife(); break;
        case "clock": G.freeze = 7; A.sfx("clock"); text(p.x, p.y - 12, "FREEZE!"); break;
        case "bolt": A.sfx("thunder"); G.flash = 0.5; for (const e of G.enemies) if (onScreen(e)) killEnemy(e, true, 200); if (G.boss && G.bossActive) bossHit(1); break;
        case "bubble": G.shield = 10; A.sfx("shield"); text(p.x, p.y - 12, "BUBBLE!"); break;
      }
    }
    for (let i = G.pops.length - 1; i >= 0; i--) { const q = G.pops[i]; q.t += dt; q.y += q.vy * dt; q.vy += 500 * dt; if (q.t > 0.45) { sparkle(q.x + 6, q.y + 6, 4); G.pops.splice(i, 1); } }
  }
  function sparkle(x, y, n = 6) { for (let i = 0; i < n; i++) G.parts.push({ k: "spark", x, y, vx: U.rand(-60, 60), vy: U.rand(-80, 20), life: U.rand(0.3, 0.6) }); }
  const onScreen = (e) => e.x + e.w > G.cam.x - 8 && e.x < G.cam.x + LW + 8;

  /* ---------- Enemies ---------- */
  function newEnemy(kind, x, y) {
    const e = { kind, x: x + 2, y: y + 4, w: 12, h: 12, vx: kind === "flyer" ? -25 : kind === "spiky" ? -34 : -28, vy: 0, t: Math.random() * 3, active: false, dead: false, y0: y + 4, jt: 1 + Math.random(), st: 1.5 + Math.random() };
    return e;
  }
  function killEnemy(e, flip, pts) {
    if (e.dead) return;
    e.dead = true; e.flip = !!flip; e.deadT = 0; e.vy = flip ? -200 : 0; e.vx = flip ? (Math.random() < 0.5 ? -40 : 40) : 0;
    addScore(pts || 100, e.x, e.y - 6);
    stars(e.x + 6, e.y + 4);
    A.sfx(flip ? "pop" : "stomp");
  }
  G.killEnemy = killEnemy;
  function enemiesUpdate(dt) {
    const p = G.p;
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (e.dead) {
        e.deadT += dt;
        if (e.flip) { e.vy += GRAV * dt; e.y += e.vy * dt; e.x += e.vx * dt; }
        if (e.deadT > (e.flip ? 2 : 0.6)) G.enemies.splice(i, 1);
        continue;
      }
      if (!e.active) { if (e.x < G.cam.x + LW + 24) e.active = true; else continue; }
      if (e.x < G.cam.x - 200 && !G.bossActive) { G.enemies.splice(i, 1); continue; }
      e.t += dt;
      if (G.freeze > 0) continue;
      switch (e.kind) {
        case "walker": case "spiky":
          e.vy = Math.min(MAXFALL, e.vy + GRAV * dt);
          if (moveBody(e, dt)) e.vx = (e.vx < 0 ? 1 : -1) * Math.abs(e.kind === "spiky" ? 34 : 28);
          if (e.vx === 0) e.vx = e.kind === "spiky" ? 34 : 28;
          break;
        case "flyer":
          e.x += e.vx * dt; e.y = e.y0 + Math.sin(e.t * 3) * 14;
          if (e.x < G.cam.x - 40) e.vx = Math.abs(e.vx);
          break;
        case "jumper":
          e.vy = Math.min(MAXFALL, e.vy + GRAV * dt);
          if (e.onGround) { e.vx = 0; e.jt -= dt; if (e.jt <= 0) { e.jt = 1.3; e.vy = -280; e.vx = p.x < e.x ? -60 : 60; } }
          moveBody(e, dt);
          break;
        case "spitter":
          e.vy = Math.min(MAXFALL, e.vy + GRAV * dt); e.vx = 0; moveBody(e, dt);
          e.st -= dt;
          if (e.st <= 0 && onScreen(e)) { e.st = 2.4; const dir = p.x < e.x ? -1 : 1; G.eshots.push({ x: e.x + 4, y: e.y, vx: dir * U.rand(60, 110), vy: -220, t: 0, k: "seed" }); }
          break;
      }
      if (e.y > G.lvl.h * TS + 20) { G.enemies.splice(i, 1); continue; }
      // contact with Lulu
      if (!p.dead && p.x < e.x + e.w && p.x + p.w > e.x && p.y < e.y + e.h && p.y + p.h > e.y) {
        if (G.shield > 0) { killEnemy(e, true, 200); continue; }
        const stomp = p.vy > 40 && p.y + p.h - e.y < 9 && e.kind !== "spiky";
        if (stomp) {
          p.chain++;
          killEnemy(e, false, [100, 200, 400, 800, 1000][Math.min(4, p.chain - 1)]);
          p.vy = (G.autopilot || I.held("jump")) ? -330 : -200;
        } else hurt();
      }
    }
    // shots
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.t += dt; s.vy += 600 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (solidAt(s.x + 3, s.y + 6)) { if (s.vy > 0) { s.y = Math.floor((s.y + 6) / TS) * TS - 6; s.vy = -170; } else s.vy = 60; }
      let gone = solidAt(s.x + (s.vx > 0 ? 6 : 0), s.y + 2) || s.t > 1.6 || s.x < G.cam.x - 10 || s.x > G.cam.x + LW + 10;
      for (const e of G.enemies) if (!gone && !e.dead && s.x < e.x + e.w && s.x + 6 > e.x && s.y < e.y + e.h && s.y + 6 > e.y) { killEnemy(e, true, 200); gone = true; }
      if (!gone && G.boss && G.bossActive && G.boss.hitTest(s.x + 3, s.y + 3)) { bossHit(0.34); gone = true; }
      if (gone) { G.shots.splice(i, 1); sparkle(s.x, s.y, 3); }
    }
    for (let i = G.eshots.length - 1; i >= 0; i--) {
      const s = G.eshots[i];
      s.t += dt; s.vy += (s.g === undefined ? 500 : s.g) * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      let gone = s.t > 4 || s.y > G.lvl.h * TS + 10 || solidAt(s.x + 3, s.y + 3);
      if (!gone && !p.dead && Math.abs(s.x + 3 - (p.x + p.w / 2)) < 7 && Math.abs(s.y + 3 - (p.y + p.h / 2)) < 10) { hurt(); gone = true; }
      if (gone) G.eshots.splice(i, 1);
    }
  }

  /* ---------- Bosses (one per world) ---------- */
  const BOSSES = [
    { name: "GRUMPY TOADSTOOL", hp: 6 }, { name: "MOLE KING ROCKBERT", hp: 6 }, { name: "BUBBLEGUM BLOB", hp: 7 }, { name: "THE NIGHTMARE", hp: 8 },
  ];
  function makeBoss(wi, x0, x1) {
    const floor = 10 * TS;
    const b = { wi, name: BOSSES[wi].name, hp: BOSSES[wi].hp, maxHp: BOSSES[wi].hp, x: x1 - 80, y: floor - 40, w: 40, h: 40, vx: 0, vy: 0, t: 0, inv: 0, state: "idle", st: 1.5, x0, x1, floor, dead: false };
    if (wi === 1) { b.state = "under"; b.y = floor - 8; b.h = 32; }
    if (wi === 2) { b.vx = -70; b.vy = -200; b.w = 36; b.h = 36; }
    if (wi === 3) { b.y = 2 * TS; b.w = 56; b.h = 30; b.vx = 50; b.x = (x0 + x1) / 2 - 28; }
    b.hitTest = (x, y) => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h && b.state !== "under";
    return b;
  }
  function bossHit(dmg) {
    const b = G.boss;
    if (!b || b.inv > 0 || b.dead) return;
    b.hp -= dmg; b.inv = dmg >= 1 ? 1.0 : 0.2;
    A.sfx("bossHit"); stars(b.x + b.w / 2, b.y + 6);
    if (b.hp <= 0) {
      b.dead = true; b.deadT = 0;
      addScore(5000, b.x, b.y);
      A.stopMusic(); A.sfx("boom");
      G.eshots.length = 0;
      for (const e of G.enemies) killEnemy(e, true, 0);
    }
  }
  function bossUpdate(dt) {
    const b = G.boss, p = G.p;
    if (b.dead) {
      b.deadT += dt;
      if (Math.random() < dt * 12) { sparkle(b.x + Math.random() * b.w, b.y + Math.random() * b.h, 6); A.sfx("pop"); }
      if (b.deadT > 2.2 && !b.gone) {
        b.gone = true; G.bossActive = false; G.camLock = null;
        if (G.door) G.door.locked = false;
        const wc = Math.round(b.x1 / TS) - 1;
        for (let r = 0; r < 10; r++) if (tile(wc, r) === "S") { setTile(wc, r, "."); G.parts.push({ k: "debris", x: wc * TS + 6, y: r * TS + 6, vx: U.rand(-60, 60), vy: -150, life: 1 }); }
        for (let i = 0; i < 12; i++) G.pops.push({ x: b.x + b.w / 2 + U.rand(-20, 20), y: b.y, vy: U.rand(-260, -120), t: 0 });
        for (let i = 0; i < 12; i++) addGem();
        A.sfx("door"); A.playSong("clear");
      }
      return;
    }
    b.t += dt; b.inv = Math.max(0, b.inv - dt);
    if (G.freeze > 0) return;
    const aim = p.x < b.x + b.w / 2 ? -1 : 1;
    if (b.wi === 0) {
      // hops towards Lulu and puffs spores when it lands
      b.vy += GRAV * dt; b.y += b.vy * dt; b.x += b.vx * dt;
      if (b.y >= b.floor - b.h) {
        if (b.vy > 100) { G.shake = 0.3; A.sfx("bump"); for (const d of [-1, 1]) G.eshots.push({ x: b.x + b.w / 2, y: b.y + b.h - 10, vx: d * 90, vy: -120, t: 0, k: "seed" }); }
        b.y = b.floor - b.h; b.vy = 0; b.vx = 0;
        b.st -= dt;
        if (b.st <= 0) { b.st = b.hp < 3 ? 0.8 : 1.3; b.vy = -380; b.vx = aim * (60 + (6 - b.hp) * 12); }
      }
    } else if (b.wi === 1) {
      // digs underground, pops up and throws rocks
      if (b.state === "under") {
        b.x += aim * 70 * dt; b.st -= dt;
        if (Math.random() < dt * 10) puff(b.x + b.w / 2, b.floor, 1);
        if (b.st <= 0) { b.state = "up"; b.st = 1.6; b.y = b.floor - b.h; A.sfx("boss"); for (let k = -1; k <= 1; k++) G.eshots.push({ x: b.x + b.w / 2, y: b.y, vx: k * 70 + aim * 40, vy: -280, t: 0, k: "rock" }); }
      } else { b.st -= dt; if (b.st <= 0) { b.state = "under"; b.st = 2.2 - (6 - b.hp) * 0.15; b.y = b.floor - 8; } }
      b.x = U.clamp(b.x, b.x0 + TS, b.x1 - TS - b.w);
    } else if (b.wi === 2) {
      // bounces around the arena like a rubber ball and spits gumdrops
      const sp = 1 + (7 - b.hp) * 0.12;
      b.vy += 500 * dt; b.x += b.vx * sp * dt; b.y += b.vy * dt;
      if (b.x < b.x0 + TS) { b.x = b.x0 + TS; b.vx = Math.abs(b.vx); }
      if (b.x + b.w > b.x1 - TS) { b.x = b.x1 - TS - b.w; b.vx = -Math.abs(b.vx); }
      if (b.y + b.h > b.floor) { b.y = b.floor - b.h; b.vy = -360; A.sfx("bounce"); }
      b.st -= dt;
      if (b.st <= 0) { b.st = 1.8; G.eshots.push({ x: b.x + b.w / 2, y: b.y + 10, vx: aim * 100, vy: -150, t: 0, k: "gum" }); }
    } else {
      // floats above, drops rain, telegraphs lightning, sometimes sinks down to rest
      if (b.state === "idle") {
        b.x += b.vx * dt; if (b.x < b.x0 + TS * 2) b.vx = Math.abs(b.vx); if (b.x + b.w > b.x1 - TS * 2) b.vx = -Math.abs(b.vx);
        b.y = 2 * TS + Math.sin(b.t * 2) * 6;
        b.st -= dt;
        if (Math.random() < dt * 2.5) G.eshots.push({ x: b.x + Math.random() * b.w, y: b.y + b.h, vx: 0, vy: 40, t: 0, k: "rain", g: 300 });
        if (b.st <= 0) { b.n = (b.n || 0) + 1; if (b.n % 3 === 0) { b.state = "rest"; b.st = 3; } else { b.state = "warn"; b.st = 0.9; b.lx = p.x + p.w / 2; A.sfx("boss"); } }
      } else if (b.state === "warn") {
        b.st -= dt;
        if (b.st <= 0) { b.state = "zap"; b.st = 0.35; A.sfx("thunder"); G.flash = 0.2; }
      } else if (b.state === "zap") {
        b.st -= dt;
        if (!p.dead && Math.abs(p.x + p.w / 2 - b.lx) < 12) hurt();
        if (b.st <= 0) { b.state = "idle"; b.st = 1.4 - (8 - b.hp) * 0.08; if (b.hp < 5 && G.enemies.length < 3) G.enemies.push(Object.assign(newEnemy("flyer", b.x, b.y + 30), { active: true })); }
      } else if (b.state === "rest") {
        b.y += (b.floor - b.h - 4 - b.y) * Math.min(1, dt * 3);
        b.st -= dt;
        if (b.st <= 0) { b.state = "idle"; b.st = 1.5; }
      }
    }
    // contact: stomping on top hurts the boss, anything else hurts Lulu
    if (!p.dead && b.state !== "under" && p.x < b.x + b.w && p.x + p.w > b.x && p.y < b.y + b.h && p.y + p.h > b.y) {
      if (p.vy > 40 && p.y + p.h - b.y < 12) { bossHit(1); p.vy = -340; }
      else if (G.shield > 0) bossHit(0.34);
      else hurt();
    }
  }

  function drawBoss(g, b, cx, cy) {
    const x = Math.round(b.x - cx), y = Math.round(b.y - cy), t = b.t;
    const blink = b.inv > 0 && Math.floor(t * 20) % 2;
    g.save();
    if (b.dead) { g.globalAlpha = Math.max(0, 1 - b.deadT / 2.2); }
    if (b.wi === 0) {
      const sq = b.vy === 0 ? 1 + Math.sin(t * 8) * 0.04 : 0.92;
      g.translate(x + 20, y + 40); g.scale(1 / sq, sq);
      g.fillStyle = "#fff0d8"; g.fillRect(-10, -20, 20, 20);
      g.fillStyle = blink ? "#ffffff" : "#7a3ad0"; g.beginPath(); g.moveTo(-24, -14); g.quadraticCurveTo(-20, -40, 0, -40); g.quadraticCurveTo(20, -40, 24, -14); g.quadraticCurveTo(12, -20, 0, -18); g.quadraticCurveTo(-12, -20, -24, -14); g.fill();
      g.fillStyle = "#b8ff60"; for (const [px, py, r] of [[-12, -28, 3], [3, -33, 3.5], [13, -25, 2.5], [-3, -24, 2]]) { g.beginPath(); g.arc(px, py, r, 0, TAU); g.fill(); }
      g.strokeStyle = "#7a3ad0"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -40); g.quadraticCurveTo(14, -50, 24, -44); g.stroke(); g.fillStyle = "#ffe040"; g.beginPath(); g.arc(25, -44, 3, 0, TAU); g.fill();
      g.fillStyle = "#1a1020"; g.fillRect(-7, -15, 4, 4); g.fillRect(3, -15, 4, 4); g.fillRect(-8, -18, 6, 1); g.fillRect(2, -18, 6, 1); g.fillRect(-4, -8, 8, 2);
    } else if (b.wi === 1) {
      if (b.state === "under") { g.fillStyle = "#8a5a3a"; g.beginPath(); g.ellipse(x + 20, y + 8, 18, 7, 0, Math.PI, TAU); g.fill(); g.fillStyle = "#5a3a1a"; g.fillRect(x + 8, y + 3, 3, 3); g.fillRect(x + 26, y + 1, 4, 3); }
      else {
        g.fillStyle = blink ? "#ffffff" : "#6a4a3a"; g.beginPath(); g.ellipse(x + 20, y + 20, 19, 16, 0, 0, TAU); g.fill();
        g.fillStyle = "#e8b8a0"; g.beginPath(); g.ellipse(x + 20, y + 24, 9, 7, 0, 0, TAU); g.fill();
        g.fillStyle = "#ff8aa0"; g.beginPath(); g.arc(x + 20, y + 20, 3.5, 0, TAU); g.fill();
        g.fillStyle = "#1a1020"; g.fillRect(x + 11, y + 12, 5, 3); g.fillRect(x + 24, y + 12, 5, 3);
        g.fillStyle = "#ffe040"; g.beginPath(); g.moveTo(x + 6, y + 6); g.lineTo(x + 10, y - 4); g.lineTo(x + 15, y + 3); g.lineTo(x + 20, y - 6); g.lineTo(x + 25, y + 3); g.lineTo(x + 30, y - 4); g.lineTo(x + 34, y + 6); g.fill();
        g.fillStyle = "#e8b8a0"; g.fillRect(x + 2, y + 26, 7, 5); g.fillRect(x + 31, y + 26, 7, 5);
      }
    } else if (b.wi === 2) {
      const sq = 1 + Math.sin(t * 10) * 0.08;
      g.translate(x + 18, y + 36); g.scale(sq, 1 / sq);
      g.fillStyle = blink ? "#ffffff" : "#ff6ac8"; g.beginPath(); g.ellipse(0, -18, 18, 18, 0, 0, TAU); g.fill();
      g.fillStyle = "#ffd0f0"; g.beginPath(); g.ellipse(-7, -27, 5, 3, -0.5, 0, TAU); g.fill();
      g.fillStyle = "#1a1020"; g.fillRect(-8, -22, 4, 5); g.fillRect(4, -22, 4, 5);
      g.fillStyle = "#a01a60"; g.beginPath(); g.ellipse(0, -10, 6, 3 + Math.abs(Math.sin(t * 4)) * 2, 0, 0, TAU); g.fill();
      if (Math.sin(t * 2) > 0.6) { g.fillStyle = "rgba(255,180,230,0.9)"; g.beginPath(); g.arc(12, -8, 6 + Math.sin(t * 6) * 2, 0, TAU); g.fill(); }
    } else {
      if (b.state === "warn" || b.state === "zap") {
        const lx = Math.round(b.lx - cx);
        g.fillStyle = b.state === "zap" ? "rgba(255,255,160,0.95)" : `rgba(255,255,160,${0.2 + 0.2 * Math.sin(t * 40)})`;
        g.fillRect(lx - (b.state === "zap" ? 6 : 1), y + b.h, b.state === "zap" ? 12 : 2, LH);
      }
      g.fillStyle = blink ? "#ffffff" : b.state === "rest" ? "#9a8ad8" : "#6a5ab0";
      for (const [px, py, r] of [[10, 18, 12], [24, 12, 15], [40, 16, 13], [50, 20, 8]]) { g.beginPath(); g.arc(x + px, y + py, r, 0, TAU); g.fill(); }
      g.fillRect(x + 4, y + 18, 50, 12);
      g.fillStyle = "#ffe040"; g.fillRect(x + 16, y + 14, 6, 3); g.fillRect(x + 32, y + 14, 6, 3);
      g.fillStyle = "#1a1020"; g.fillRect(x + 22, y + 22, 12, 2);
      if (b.state === "rest") { g.fillStyle = "#ffffff"; g.font = "8px monospace"; g.fillText("z", x + 50, y - 4 + Math.sin(t * 3) * 3); }
    }
    g.restore();
  }

  /* ---------- Update ---------- */
  G.update = function (dt) {
    G.t += dt; G.phaseT += dt;
    if (G.cheat) G.run.cheated = true;
    G.freeze = Math.max(0, G.freeze - dt); G.shield = Math.max(0, G.shield - dt); G.flash = Math.max(0, G.flash - dt); G.shake = Math.max(0, (G.shake || 0) - dt);
    for (const pl of G.plats) { pl.t += dt; const nx = pl.x0 + Math.sin(pl.t * 1.2) * pl.ax, ny = pl.y0 + Math.sin(pl.t * 1.2) * pl.ay; pl.dx = nx - pl.x; pl.dy = ny - pl.y; pl.x = nx; pl.y = ny; }
    for (let i = G.bumps.length - 1; i >= 0; i--) { G.bumps[i].t += dt; if (G.bumps[i].t > 0.2) G.bumps.splice(i, 1); }
    playerUpdate(dt);
    itemsUpdate(dt);
    enemiesUpdate(dt);
    const p = G.p;
    // boss arena
    if (G.lvl.bossX >= 0 && !G.boss && p.x > (G.lvl.bossX + 3) * TS) {
      const x0 = G.lvl.bossX * TS, x1 = x0 + 28 * TS;
      G.boss = makeBoss(G.lvl.world, x0, x1); G.bossActive = true; G.camLock = { x0, x1 };
      A.playSong("boss"); A.sfx("boss");
    }
    if (G.boss && !G.boss.gone) bossUpdate(dt);
    // door
    const d = G.door;
    if (d && !d.locked && G.phase === "play" && !p.dead && p.x + p.w > d.x + 6 && p.x < d.x + d.w - 6 && p.y + p.h > d.y + 10) {
      G.phase = "clear"; G.phaseT = 0; p.win = true; A.stopMusic(); A.sfx("door"); A.jingle("clear") ;
    }
    // time
    if (G.phase === "play" && !p.dead) {
      G.time -= dt;
      if (G.time < 30 && !G.hurry) { G.hurry = true; XA.Audio.tempo = 1.25; text(p.x - 10, p.y - 20, "HURRY UP!"); }
      if (G.time <= 0) { G.time = 0; if (G.cheat) G.time = 30; else die(); }
    }
    // particles
    for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.k === "debris" || q.k === "star" || q.k === "spark") q.vy += 500 * dt; if (q.life <= 0) G.parts.splice(i, 1); }
    // sleepy "z"s
    if (p.idle > 8 && Math.random() < dt * 1.5) G.parts.push({ k: "z", x: p.x + 8, y: p.y - 2, vx: 12, vy: -16, life: 1.6 });
    // camera
    const lock = G.camLock;
    let tx = p.x + p.w / 2 - LW / 2 + p.face * 24;
    if (lock) tx = lock.x0 + (lock.x1 - lock.x0) / 2 - LW / 2;
    tx = U.clamp(tx, 0, G.lvl.w * TS - LW);
    G.cam.x += (tx - G.cam.x) * Math.min(1, dt * 6);
    const ty = U.clamp(p.y - LH * 0.55, 0, G.lvl.h * TS - LH);
    G.cam.y += (ty - G.cam.y) * Math.min(1, dt * 4);
  };

  /* ---------- Rendering ---------- */
  G.render = function (g) {
    const wi = G.lvl.world, T = Gfx.tiles[wi], p = G.p;
    let cx = Math.round(G.cam.x), cy = Math.round(G.cam.y);
    if (G.shake > 0) { cx += Math.round(U.rand(-2, 2)); cy += Math.round(U.rand(-2, 2)); }
    Gfx.drawBackground(g, wi, cx, cy, G.t);
    const c0 = Math.floor(cx / TS), c1 = Math.min(G.lvl.w - 1, c0 + Math.ceil(LW / TS) + 1);
    const qf = Math.floor(G.t * 6) % 4, lf = Math.floor(G.t * 5) % 4;
    for (let r = 0; r < G.lvl.h; r++) for (let c = c0; c <= c1; c++) {
      const ch = G.lvl.tiles[r][c];
      if (ch === ".") continue;
      let x = c * TS - cx, y = r * TS - cy;
      const bump = G.bumps.find((b) => b.c === c && b.r === r);
      if (bump) y -= Math.round(Math.sin((bump.t / 0.2) * Math.PI) * 4);
      let img = null;
      switch (ch) {
        case "#": img = r > 0 && G.lvl.tiles[r - 1][c] !== "#" ? T.top : T.ground; break;
        case "S": img = T.solid; break;
        case "B": img = T.brick; break;
        case "?": case "P": case "!": img = T.block[qf]; break;
        case "U": img = T.used; break;
        case "-": img = T.oneway; break;
        case "^": img = T.spikes; break;
        case "~": img = r > 0 && G.lvl.tiles[r - 1][c] === "~" ? T.liquidD : T.liquid[lf]; break;
      }
      if (img) g.drawImage(img, x, y);
    }
    for (const d of G.lvl.deco) {
      const x = d.c * TS - cx; if (x < -30 || x > LW + 10) continue;
      const img = T.deco[d.k]; g.drawImage(img, x + 8 - Math.floor(img.width / 2), d.r * TS + 16 - cy - img.height);
    }
    // door
    if (G.door) {
      const d = G.door, x = d.x - cx, y = d.y - cy;
      if (d.locked) { g.globalAlpha = 0.3; g.drawImage(T.door, x, y); g.globalAlpha = 1; }
      else { g.drawImage(T.door, x, y); if (Math.random() < 0.3) G.parts.push({ k: "spark", x: d.x + Math.random() * 24, y: d.y + Math.random() * 40, vx: 0, vy: -20, life: 0.4 }); }
    }
    for (const pl of G.plats) g.drawImage(T.moving, Math.round(pl.x - cx), Math.round(pl.y - cy));
    // items
    for (const it of G.items) {
      const x = Math.round(it.x - cx), y = Math.round(it.y - cy + (it.kind === "gem" || it.rise > 0 || it.fixed ? 0 : Math.sin(it.t * 4) * 1.5));
      if (x < -20 || x > LW + 20) continue;
      if (it.kind === "gem") g.drawImage(Gfx.spr.gem[Math.floor(it.t * 8) % 4], x, y);
      else if (it.kind === "spring") g.drawImage(T.spring[it.t < 0.2 ? 1 : 0], x, y - 16);
      else if (it.kind === "check") g.drawImage(it.on ? T.pillowOn : T.pillow, x, y);
      else if (it.kind === "gemsack") { g.drawImage(Gfx.spr.gem[0], x, y); g.drawImage(Gfx.spr.gem[0], x + 4, y - 3); }
      else g.drawImage(Gfx.spr[it.kind], x, y);
    }
    for (const q of G.pops) g.drawImage(Gfx.spr.gem[Math.floor(q.t * 12) % 4], Math.round(q.x - cx), Math.round(q.y - cy));
    // enemies
    const E = Gfx.enemies[wi];
    for (const e of G.enemies) {
      const x = Math.round(e.x - cx - 2), y = Math.round(e.y - cy - 4);
      if (x < -20 || x > LW + 20 || !e.active && !e.dead) continue;
      let img = E[e.kind][Math.floor(e.t * (e.kind === "flyer" ? 10 : 5)) % 2];
      if (e.dead && !e.flip) img = E.squashed;
      g.save();
      if (e.flip) { g.translate(x + 8, y + 8); g.scale(1, -1); g.translate(-x - 8, -y - 8); }
      if (e.vx > 0 && !e.flip) { g.translate(x + 16, 0); g.scale(-1, 1); g.translate(-x, 0); }
      if (G.freeze > 0 && !e.dead) g.filter = "hue-rotate(180deg) saturate(0.6)";
      g.drawImage(img, x, y);
      g.restore();
    }
    if (G.boss && !G.boss.gone) drawBoss(g, G.boss, cx, cy);
    // shots
    for (const s of G.shots) g.drawImage(Gfx.spr.shot[Math.floor(s.t * 12) % 2], Math.round(s.x - cx), Math.round(s.y - cy));
    for (const s of G.eshots) {
      const x = Math.round(s.x - cx), y = Math.round(s.y - cy);
      if (s.k === "seed") g.drawImage(Gfx.spr.seed, x, y);
      else if (s.k === "rock") { g.fillStyle = "#6a5a4a"; g.fillRect(x, y, 6, 6); g.fillStyle = "#9a8a7a"; g.fillRect(x, y, 4, 3); }
      else if (s.k === "gum") { g.fillStyle = "#40d060"; g.beginPath(); g.ellipse(x + 3, y + 3, 4, 3.5, 0, 0, TAU); g.fill(); }
      else { g.fillStyle = "#80c0ff"; g.fillRect(x + 2, y, 2, 5); }
    }
    // Lulu
    if (!(p.inv > 0 && !p.dead && Math.floor(G.t * 16) % 2 && !G.cheat)) {
      const H = Gfx.hero[G.run.power > 0 ? 1 : 0];
      let img = H.idle;
      if (p.dead) img = H.dead;
      else if (p.win) img = H.win[Math.floor(G.t * 4) % 2];
      else if (!p.onGround) img = p.vy < 0 ? H.jump : H.fall;
      else if (p.shootT > 0) img = H.shoot;
      else if (Math.abs(p.vx) > 5) img = H.walk[Math.floor(p.anim) % 4];
      else if (p.idle > 8) img = H.sleep[Math.floor(G.t * 1.5) % 2];
      else if (p.idle > 5) img = H.sleep[0];
      else if (Math.floor(G.t * 0.5) % 5 === 0 && G.t % 2 < 0.15) img = H.blink;
      const x = Math.round(p.x + p.w / 2 - cx), y = Math.round(p.y + p.h - cy);
      g.save();
      if (p.face < 0 && !p.dead) { g.translate(x, 0); g.scale(-1, 1); g.translate(-x, 0); }
      g.drawImage(img, x - 11, y - 26 + 1);
      g.restore();
      if (G.run.power > 0 && Math.random() < 0.2) G.parts.push({ k: "spark", x: p.x + Math.random() * p.w, y: p.y + Math.random() * 6, vx: 0, vy: -10, life: 0.3 });
      if (G.shield > 0) {
        g.strokeStyle = `hsl(${(G.t * 300) % 360},100%,75%)`; g.lineWidth = 1.5;
        g.beginPath(); g.arc(x, y - 11, 15, 0, TAU); g.stroke();
      }
    }
    // particles
    for (const q of G.parts) {
      const x = Math.round(q.x - cx), y = Math.round(q.y - cy);
      if (q.k === "debris") g.drawImage(Gfx.spr.debris, x, y);
      else if (q.k === "star") { g.fillStyle = "#ffe040"; g.fillRect(x, y, 2, 2); }
      else if (q.k === "spark") { g.fillStyle = Math.random() < 0.5 ? "#ffffff" : "#a0f0ff"; g.fillRect(x, y, 1, 1); }
      else if (q.k === "puff") { g.fillStyle = "rgba(255,255,255,0.8)"; g.fillRect(x - 1, y - 1, 3, 2); }
      else if (q.k === "text") { g.fillStyle = "#ffffff"; g.font = "8px 'Press Start 2P', monospace"; g.textAlign = "center"; g.fillText(q.s, x + 4, y); g.textAlign = "left"; }
      else if (q.k === "z") { g.fillStyle = "#ffffff"; g.font = "8px monospace"; g.fillText("z", x, y); }
    }
    if (Gfx.WORLDS[wi].dark) {
      // soft vignette for the night worlds
      const gr = g.createRadialGradient(p.x - cx, p.y - cy, 40, p.x - cx, p.y - cy, 260);
      gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,20,0.35)");
      g.fillStyle = gr; g.fillRect(0, 0, LW, LH);
    }
    if (G.flash > 0) { g.fillStyle = `rgba(255,255,220,${G.flash})`; g.fillRect(0, 0, LW, LH); }
  };
})(window.XA);
