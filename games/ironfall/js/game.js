/* Ironfall: game core – player, weapons, physics, items, camera and stage flow */
"use strict";

(function (XA) {
  const { U, Gfx, Fx, Spr, Theme, Levels, Store } = XA;
  const A = XA.Audio, I = XA.Input;
  const W = U.W, H = U.H, TAU = U.TAU, T = Theme.T, TL = Theme.TL;

  const G = (XA.G = XA.G || {});
  Object.assign(G, { cheat: false, run: null, lv: null, t: 0, phase: "play", phaseT: 0 });
  G.STAGES = Levels.STAGES;
  G.WEAPONS = { spread: "Spread Shot", laser: "Laser", bounce: "Rebound", flame: "Flamer", homing: "Homing" };

  /* ---------- Constants ---------- */
  const RUN = 300, ACC = 2600, AIR_ACC = 1900, GRAV = 2300, JUMP_V = 920, MAX_FALL = 1150;
  const PW = 26, PH = 58, PH_CROUCH = 38, GYRO_W = 26, GYRO_H = 34;
  const MAX_E = 100;
  G.MAX_E = MAX_E;

  /* ---------- Run (one game) ---------- */
  G.newRun = function () {
    G.run = {
      score: 0, lives: 3, stage: 0, cheated: G.cheat, diamonds: 0, nextLife: 100000,
      weapon: "spread", power: 1, lines: 3, gyros: 3, energy: MAX_E, kills: 0,
    };
  };
  G.addScore = function (n, x, y) {
    const run = G.run;
    if (!run) return;
    if (G.cheat) run.cheated = true;
    if (run.cheated) { if (x !== undefined) Fx.text(x, y, "0", "170,170,170", 13); return; }
    run.score += n;
    if (x !== undefined) Fx.text(x, y, String(n), "255,240,160", 14);
    while (run.score >= run.nextLife) { run.nextLife += 100000; G.extraLife(); }
  };
  G.extraLife = function () { G.run.lives++; A.sfx("extra"); A.say("Extra life!"); };

  /* ---------- Stage ---------- */
  G.startStage = function (index) {
    const run = G.run;
    run.stage = index;
    const lv = (G.lv = Levels.build(index));
    G.th = Theme.build(lv.theme);
    G.t = 0; G.phase = "intro"; G.phaseT = 0;
    G.time = lv.time;
    G.enemies = []; G.pb = []; G.eb = []; G.items = []; G.lines = []; G.mines = [];
    G.ambient = [];
    G.boss = null; G.arena = null; G.bossDone = false;
    G.spawns = lv.spawns.map((s) => Object.assign({ state: "idle" }, s));
    G.items = lv.items.map((it) => Object.assign({ p: U.rand(TAU), vy: 0, fixed: true }, it));
    G.movers = lv.movers.map((m) => Object.assign({ t: U.rand(TAU), x: m.x0, dx: 0, dy: 0, yy: m.y }, m));
    G.crushers = lv.crushers.map((c) => Object.assign({ y: c.top, state: "up", st: c.phase, h: 0 }, c));
    G.checkpoints = lv.checkpoints.map((c) => Object.assign({ on: false, t: 0 }, c));
    G.cp = { x: lv.start.x, y: lv.start.y };
    G.waveT = U.rand(8, 12);
    G.stats = { spawned: 0, killed: 0 };
    G.exitT = 0;
    Fx.clear();
    spawnPlayer(G.cp.x, G.cp.y);
    G.cam = { x: 0, y: 0, lx: 0 };
    snapCamera();
    A.playSong(lv.world.music);
    A.say(`Stage ${index + 1}. ${lv.stage.name}.`, { force: true });
  };

  function spawnPlayer(x, y) {
    const run = G.run;
    G.player = {
      x, y, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, jumpBuf: 0, crouch: false,
      aim: 0, fireCd: 0, muzzle: 0, runPh: 0, inv: 2.2, dead: 0, beam: null, beamA: 0,
      gyro: 0, roll: 0, mineCd: 0, shield: 0, hurtT: 0, landT: 0, dropT: 0, mover: null, liquidT: 0,
    };
    run.energy = MAX_E;
  }

  /* ---------- Tile queries ---------- */
  const tile = (tx, ty) => {
    const lv = G.lv;
    if (tx < 0 || tx >= lv.w) return TL.METAL;
    if (ty < 0) return lv.world.indoor ? TL.ROCK : 0;
    if (ty >= lv.h) return 0;
    return lv.tiles[ty * lv.w + tx];
  };
  G.tile = tile;
  G.solidAt = (px, py) => Theme.solid(tile(Math.floor(px / T), Math.floor(py / T)));
  G.tileAtPx = (px, py) => tile(Math.floor(px / T), Math.floor(py / T));
  function boxSolid(x0, y0, x1, y1) {
    const tx0 = Math.floor(x0 / T), tx1 = Math.floor((x1 - 0.01) / T), ty0 = Math.floor(y0 / T), ty1 = Math.floor((y1 - 0.01) / T);
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (Theme.solid(tile(tx, ty))) return { tx, ty };
    return null;
  }
  G.boxSolid = boxSolid;
  function arenaWall(x0, x1) {
    const a = G.arena;
    if (!a || !a.locked) return null;
    if (x0 < a.x0) return a.x0;
    if (x1 > a.x1) return a.x1;
    return null;
  }

  // generic body physics: b has x (center), y (bottom), w, h, vx, vy. Returns flags.
  G.moveBody = function (b, dt, o = {}) {
    const res = { wall: 0, ground: false, ceil: false };
    const hw = b.w / 2;
    // horizontal
    let nx = b.x + b.vx * dt;
    let hit = boxSolid(nx - hw, b.y - b.h, nx + hw, b.y);
    if (hit) {
      if (b.vx > 0) nx = hit.tx * T - hw - 0.01; else if (b.vx < 0) nx = (hit.tx + 1) * T + hw + 0.01;
      res.wall = Math.sign(b.vx) || 1; b.vx = 0;
      if (boxSolid(nx - hw, b.y - b.h, nx + hw, b.y)) nx = b.x; // safety
    }
    if (o.arena) {
      const aw = arenaWall(nx - hw, nx + hw);
      if (aw !== null) { nx = aw === G.arena.x0 ? aw + hw : aw - hw; res.wall = aw === G.arena.x0 ? -1 : 1; b.vx = 0; }
    }
    b.x = nx;
    // vertical
    const oldBottom = b.y;
    let ny = b.y + b.vy * dt;
    if (b.vy >= 0) {
      // only the area from the feet downwards counts as floor (a wall beside the body is no floor)
      hit = boxSolid(b.x - hw, oldBottom, b.x + hw, Math.max(ny, oldBottom + 0.02));
      let floor = hit ? Math.max(hit.ty * T, oldBottom) : Infinity;
      if (o.oneway !== false && !(b.dropT > 0)) {
        // one-way platforms
        const ty0 = Math.floor(oldBottom / T), ty1 = Math.floor((ny - 0.01) / T);
        for (let ty = Math.max(ty0, 0); ty <= ty1; ty++) {
          if (ty * T < oldBottom - 0.5) continue;
          for (let tx = Math.floor((b.x - hw) / T); tx <= Math.floor((b.x + hw - 0.01) / T); tx++) if (tile(tx, ty) === TL.PLAT) floor = Math.min(floor, ty * T);
        }
        // moving platforms
        b.mover = null;
        for (const m of G.movers) {
          if (b.x + hw > m.x && b.x - hw < m.x + m.w && oldBottom <= m.yy + 6 && ny >= m.yy) { if (m.yy < floor) { floor = m.yy; b.mover = m; } }
        }
      }
      if (ny >= floor) { ny = floor; b.vy = 0; res.ground = true; }
    } else {
      // only the area from the head upwards counts as ceiling
      hit = boxSolid(b.x - hw, ny - b.h, b.x + hw, Math.max(ny - b.h + 0.02, b.y - b.h));
      if (hit) { ny = Math.min(b.y, (hit.ty + 1) * T + b.h + 0.01); b.vy = 0; res.ceil = true; }
    }
    b.y = ny;
    return res;
  };
  G.onSolidGround = (x, y, hw = 4) => G.solidAt(x - hw, y + 2) || G.solidAt(x + hw, y + 2) || tile(Math.floor(x / T), Math.floor((y + 2) / T)) === TL.PLAT;

  /* ---------- Camera ---------- */
  function camTarget() {
    const p = G.player, lv = G.lv;
    let tx = p.x - W / 2 + p.face * 110, ty = p.y - H * 0.6;
    if (G.arena && G.arena.locked) { tx = G.arena.x0; ty = G.arena.floor - H * 0.86; }
    tx = U.clamp(tx, 0, lv.w * T - W);
    ty = U.clamp(ty, 0, lv.h * T - H);
    return [tx, ty];
  }
  function snapCamera() { const [x, y] = camTarget(); G.cam.x = x; G.cam.y = y; }
  function updateCamera(dt) {
    const [tx, ty] = camTarget();
    const k = G.arena && G.arena.locked ? 3 : 6;
    G.cam.x += (tx - G.cam.x) * Math.min(1, dt * k);
    const dy = ty - G.cam.y;
    G.cam.y += dy * Math.min(1, dt * (Math.abs(dy) > 160 ? 7 : 4));
  }

  /* ---------- Input to player intent ---------- */
  G.mouseMode = false;
  function readIntent() {
    const pad = I.pad, m = I.mouse;
    const ax = pad.axes[0], ay = pad.axes[1];
    const it = {
      left: I.held("left") || ax < -0.4, right: I.held("right") || ax > 0.4,
      up: I.held("up") || ay < -0.5, down: I.held("down") || ay > 0.5,
      jump: I.held("jump"), jumpHit: I.hit("jump"),
      fire: I.held("fire"), beam: I.held("beam"),
      line: I.hit("line") || m.mclicked, gyro: I.hit("gyro") || m.wheel !== 0,
      aimAngle: null,
    };
    if (I.lastDevice === "mouse" && m.inside) G.mouseMode = true;
    else if (I.lastDevice !== "mouse") G.mouseMode = false;
    if (pad.raxes[0] || pad.raxes[1]) it.aimAngle = Math.atan2(pad.raxes[1], pad.raxes[0]);
    else if (G.mouseMode) {
      const p = G.player, sy = p.y - (p.crouch ? 26 : 44);
      it.aimAngle = Math.atan2(m.y + G.cam.y - sy, m.x + G.cam.x - p.x);
    }
    return it;
  }

  /* ---------- Player update ---------- */
  function updatePlayer(dt) {
    const p = G.player, run = G.run;
    if (p.dead > 0) {
      p.dead -= dt;
      if (p.dead <= 0) respawn();
      return;
    }
    const it = G.phase === "play" || G.phase === "warning" || G.phase === "boss" ? readIntent() : { };
    if (G.phase === "clear") { p.vx *= 0.9; }
    p.inv = Math.max(0, p.inv - dt);
    p.shield = Math.max(0, p.shield - dt);
    p.fireCd -= dt; p.muzzle = Math.max(0, p.muzzle - dt * 8);
    p.mineCd -= dt; p.hurtT = Math.max(0, p.hurtT - dt); p.dropT -= dt; p.landT -= dt;

    // gyroscope
    if (p.gyro > 0) {
      p.gyro -= dt;
      const headroom = !boxSolid(p.x - PW / 2, p.y - PH, p.x + PW / 2, p.y - 1);
      if ((p.gyro <= 0 || (it.gyro && p.gyro < 7.6)) && headroom) { p.gyro = 0; A.sfx("gyroOff"); }
      else if (p.gyro <= 0) p.gyro = 0.05; // stay a ball until there is room to stand up
    } else if (it.gyro && run.gyros > 0 && G.phase !== "clear") {
      run.gyros--; p.gyro = 8; A.sfx("gyro"); A.say("Gyroscope!", { gap: 300 });
    }
    const ball = p.gyro > 0;

    // horizontal movement
    const beaming = !ball && it.beam;
    let dir = (it.right ? 1 : 0) - (it.left ? 1 : 0);
    const wantCrouch = !ball && it.down && p.onGround && !beaming;
    p.crouch = wantCrouch || (p.crouch && p.onGround && !!boxSolid(p.x - PW / 2, p.y - PH, p.x + PW / 2, p.y - PH_CROUCH));
    if (beaming || p.crouch) dir = 0;
    if (G.phase === "clear" || G.phase === "intro") dir = 0;
    const speed = ball ? 430 : RUN;
    const acc = p.onGround ? ACC : AIR_ACC;
    if (dir) {
      p.vx += dir * acc * dt;
      if (Math.abs(p.vx) > speed) p.vx = Math.sign(p.vx) * Math.max(speed, Math.abs(p.vx) - acc * dt);
      if (!beaming && it.aimAngle === null) p.face = dir;
    } else {
      const f = (p.onGround ? ACC * 1.2 : AIR_ACC * 0.35) * dt;
      p.vx = Math.abs(p.vx) <= f ? 0 : p.vx - Math.sign(p.vx) * f;
    }
    if (it.aimAngle !== null && it.aimAngle !== undefined && !ball) p.face = Math.cos(it.aimAngle) >= 0 ? 1 : -1;

    // jumping (with coyote time and jump buffer)
    p.coyote = p.onGround ? 0.1 : p.coyote - dt;
    p.jumpBuf = it.jumpHit ? 0.13 : p.jumpBuf - dt;
    if (p.jumpBuf > 0 && p.coyote > 0 && G.phase !== "clear" && G.phase !== "intro") {
      if (it.down && p.onGround && standsOnPlatform(p)) { p.dropT = 0.22; p.y += 2; }
      else {
        p.vy = ball ? -770 : -JUMP_V; p.onGround = false; p.coyote = 0; A.sfx("jump");
        Fx.dust(p.x, p.y, 4);
      }
      p.jumpBuf = 0;
    }
    if (!it.jump && p.vy < -300 && !ball) p.vy += GRAV * 1.6 * dt; // short hop
    p.vy = Math.min(MAX_FALL, p.vy + GRAV * dt);

    // moving platform carry
    if (p.mover && p.onGround) { p.x += p.mover.dx; p.y += p.mover.dy; }

    const body = { x: p.x, y: p.y, w: ball ? GYRO_W : PW, h: ball ? GYRO_H : p.crouch ? PH_CROUCH : PH, vx: p.vx, vy: p.vy, dropT: p.dropT };
    const wasGround = p.onGround, fallV = p.vy;
    const r = G.moveBody(body, dt, { arena: true });
    p.x = body.x; p.y = body.y; p.vx = body.vx; p.vy = body.vy; p.mover = body.mover;
    p.onGround = r.ground;
    if (r.ground && !wasGround && fallV > 500) { A.sfx("land"); Fx.dust(p.x, p.y, 7); }
    if (ball) { p.roll += (p.vx / 17) * dt; if (Math.abs(p.vx) > 50 && p.onGround && Math.random() < dt * 20) Fx.add({ k: "spark", x: p.x, y: p.y - 2, vx: -p.vx * 0.3 + U.rand(-40, 40), vy: U.rand(-140, -40), life: 0.2, drag: 3, g: 600, rgb: "200,230,255", w: 1.5 }); }

    // animation
    if (p.onGround && Math.abs(p.vx) > 20) p.runPh = (p.runPh + Math.abs(p.vx) * dt / 95) % 1; else if (p.onGround) p.runPh = 0;

    // aim
    if (it.aimAngle !== null && it.aimAngle !== undefined) p.aim = it.aimAngle;
    else {
      let ax = it.left ? -1 : it.right ? 1 : 0, ay = 0;
      if (it.up) ay = -1;
      if (it.down && !p.onGround) ay = 1;
      if (beaming) ax = 0;
      if (ay !== 0 && ax === 0 && !beaming) p.aim = ay < 0 ? -Math.PI / 2 : Math.PI / 2;
      else if (ay !== 0) p.aim = Math.atan2(ay, p.face);
      else if (!beaming) p.aim = p.face > 0 ? 0 : Math.PI;
    }

    // weapons
    if (ball) {
      p.beam = null;
      if (it.fire && p.mineCd <= 0 && G.mines.length < 4) { p.mineCd = 0.45; G.mines.push({ x: p.x, y: p.y - 8, vx: 0, vy: 0, t: 0 }); A.sfx("mine"); }
    } else if (beaming) {
      updateBeam(p, it, dt);
    } else {
      p.beam = null;
      if (it.fire && p.fireCd <= 0 && G.phase !== "clear" && G.phase !== "intro") fireWeapon(p);
    }
    if (it.line && run.lines > 0 && G.phase !== "clear") powerLine(p);
    if (G.cheat && I.hit("cycle")) {
      const order = Object.keys(G.WEAPONS);
      run.weapon = order[(order.indexOf(run.weapon) + 1) % order.length];
      A.sfx("pickup");
      Fx.text(p.x, p.y - 80, G.WEAPONS[run.weapon].toUpperCase(), "255,220,120", 15);
    }

    // hazards: spikes, liquid, pits
    const hb = playerBox();
    if (!(p.inv > 0) && !ball) {
      if (touchTile(hb, TL.SPIKE)) hurtPlayer(20, 0, true);
    }
    if (touchTile(hb, TL.LIQTOP) || touchTile(hb, TL.LIQ)) {
      if (p.liquidT <= 0) {
        A.sfx("splash"); A.sfx("sizzle");
        Fx.splash(p.x, p.y - 10, G.th.liquid.rgb);
        p.liquidT = 0.4;
        if (!ball && !(p.shield > 0)) hurtPlayer(30, 0, true, true);
        if (G.player.dead <= 0) p.vy = -1050;
      }
    }
    p.liquidT -= dt;
    if (p.y > G.lv.h * T + 60) {
      if (G.cheat) { p.x = G.cp.x; p.y = G.cp.y; p.vx = p.vy = 0; p.inv = 1.5; snapCamera(); }
      else killPlayer(true);
    }
  }
  function standsOnPlatform(p) {
    const ty = Math.floor((p.y + 2) / T);
    for (let tx = Math.floor((p.x - PW / 2) / T); tx <= Math.floor((p.x + PW / 2 - 0.01) / T); tx++) {
      const id = tile(tx, ty);
      if (Theme.solid(id)) return false;
      if (id === TL.PLAT) return true;
    }
    return !!p.mover;
  }
  function playerBox() {
    const p = G.player, ball = p.gyro > 0;
    const w = ball ? GYRO_W : PW, h = ball ? GYRO_H : p.crouch ? PH_CROUCH : PH;
    return { x0: p.x - w / 2, y0: p.y - h, x1: p.x + w / 2, y1: p.y };
  }
  G.playerBox = playerBox;
  function touchTile(b, id) {
    for (let ty = Math.floor((b.y0 + 4) / T); ty <= Math.floor((b.y1 - 2) / T); ty++)
      for (let tx = Math.floor((b.x0 + 3) / T); tx <= Math.floor((b.x1 - 3) / T); tx++)
        if (tile(tx, ty) === id) return true;
    return false;
  }

  /* ---------- Damage ---------- */
  function hurtPlayer(dmg, fromX, hazard, liquid) {
    const p = G.player, run = G.run;
    if (p.dead > 0 || G.phase === "clear") return;
    if (!liquid && (p.inv > 0 || p.shield > 0 || p.gyro > 0)) return;
    if (G.cheat) { if (!liquid) { p.inv = 0.6; Fx.hitSpark(p.x, p.y - 30, "255,220,120", 6); } return; }
    run.energy -= dmg;
    p.inv = 1.1; p.hurtT = 0.3;
    A.sfx("playerHit");
    Fx.hitSpark(p.x, p.y - 30, "255,120,80", 10);
    Fx.shake = Math.max(Fx.shake, 6);
    if (fromX !== undefined && fromX !== 0) { p.vx = Math.sign(p.x - fromX) * 260; p.vy = Math.min(p.vy, -380); }
    else if (hazard && !liquid) p.vy = -560;
    if (run.energy <= 0) killPlayer(false);
  }
  G.hurtPlayer = (dmg, fromX) => hurtPlayer(dmg, fromX);
  function killPlayer(pit) {
    const p = G.player, run = G.run;
    if (p.dead > 0) return;
    run.energy = 0;
    p.dead = 2.4; p.beam = null; p.gyro = 0;
    A.sfx("playerDie");
    if (!pit) { Fx.explode(p.x, p.y - 30, 50, { rgb: "120,220,255" }); Fx.chain(p.x, p.y - 30, 60, 60, 5, 0.6, 26); }
    run.lives--;
    run.power = Math.max(1, run.power - 1);
    if (run.lives < 0) { run.lives = 0; G.gameOverT = 3; p.dead = 99; A.say("Game over", { force: true }); }
  }
  function respawn() {
    const p = G.player;
    if (G.arena && G.arena.locked) spawnPlayer(G.arena.x0 + 2 * T, G.arena.floor);
    else spawnPlayer(G.cp.x, G.cp.y);
    G.player.face = p.face;
    G.run.lines = Math.max(G.run.lines, 2);
    G.run.gyros = Math.max(G.run.gyros, 2);
    if (G.time < 120) G.time = 120;
    G.eb.length = 0;
    snapCamera();
  }

  /* ---------- Weapons ---------- */
  const muzzlePos = (p) => {
    const sy = p.y - (p.crouch ? 26 : 44);
    return [p.x + Math.cos(p.aim) * 30, sy + Math.sin(p.aim) * 30];
  };
  function pbullet(o) { const b = Object.assign({ t: 0, life: 1, hits: null, pierce: 0, dmg: 1, r: 6 }, o); b.max = b.life; G.pb.push(b); }
  function fireWeapon(p) {
    const run = G.run, lvl = run.power, a = p.aim;
    const [mx, my] = muzzlePos(p);
    let cd = 0.15, rgb = "255,220,140";
    switch (run.weapon) {
      case "spread": {
        const n = 1 + 2 * lvl, step = 0.11 - lvl * 0.008;
        for (let i = 0; i < n; i++) { const aa = a + (i - (n - 1) / 2) * step; pbullet({ kind: "spread", x: mx, y: my, vx: Math.cos(aa) * 950, vy: Math.sin(aa) * 950, life: 0.85, dmg: 1, lvl, r: 6 }); }
        cd = 0.14; rgb = "255,140,90"; A.sfx("spread");
        break;
      }
      case "laser": {
        pbullet({ kind: "laser", x: mx, y: my, vx: Math.cos(a) * 1500, vy: Math.sin(a) * 1500, life: 0.6, dmg: 2.5 + lvl, lvl, r: 7 + lvl * 2, pierce: lvl, hits: new Set() });
        if (lvl >= 4) for (const s of [-1, 1]) pbullet({ kind: "laser", x: mx, y: my, vx: Math.cos(a + s * 0.07) * 1500, vy: Math.sin(a + s * 0.07) * 1500, life: 0.5, dmg: 2.5, lvl: 2, r: 8, pierce: 1, hits: new Set() });
        cd = 0.16; rgb = "120,200,255"; A.sfx("laser");
        break;
      }
      case "bounce": {
        const n = lvl + 1;
        for (let i = 0; i < n; i++) { const aa = a + (i - (n - 1) / 2) * 0.16; pbullet({ kind: "bounce", x: mx, y: my, vx: Math.cos(aa) * 820, vy: Math.sin(aa) * 820, life: 1.3, dmg: 2, lvl, r: 7, bounces: 4 }); }
        cd = 0.19; rgb = "120,255,140"; A.sfx("bounce");
        break;
      }
      case "flame": {
        for (let i = 0; i < 2; i++) { const aa = a + U.rand(-0.13, 0.13); const sp = U.rand(480, 600) + lvl * 30; pbullet({ kind: "flame", x: mx, y: my, vx: Math.cos(aa) * sp + p.vx * 0.5, vy: Math.sin(aa) * sp, life: 0.3 + lvl * 0.06, dmg: 0.55 + lvl * 0.12, lvl, r: 12 + lvl * 2, pierce: 99, hits: new Set() }); }
        cd = 0.045; rgb = "255,170,60"; A.sfx("flame");
        break;
      }
      case "homing": {
        const n = [1, 2, 2, 3][lvl - 1];
        for (let i = 0; i < n; i++) { const aa = a + (i - (n - 1) / 2) * 0.5; pbullet({ kind: "homing", x: mx, y: my, vx: Math.cos(aa) * 420, vy: Math.sin(aa) * 420, life: 2.2, dmg: 3 + lvl * 0.4, lvl, r: 8 }); }
        cd = 0.36 - lvl * 0.03; rgb = "220,160,255"; A.sfx("homing");
        break;
      }
    }
    p.fireCd = cd; p.muzzle = 1; p.muzzleRGB = rgb;
    if (run.weapon === "spread" || run.weapon === "bounce") if (Math.random() < 0.5) Fx.shell(p.x, p.y - 40, p.face);
  }

  function updateBeam(p, it, dt) {
    if (!p.beam) { p.beam = { a: p.face > 0 ? 0 : Math.PI, t: 0, pts: null, tick: 0 }; }
    const bm = p.beam;
    bm.t += dt;
    if (it.aimAngle !== null && it.aimAngle !== undefined) {
      const d = U.angDiff(it.aimAngle, bm.a);
      bm.a += U.clamp(d, -8 * dt, 8 * dt);
      p.face = Math.cos(bm.a) >= 0 ? 1 : -1;
    } else {
      // Rotate the beam with up/down; left/right turns around
      if (it.left && p.face > 0) { p.face = -1; bm.a = Math.PI - bm.a; }
      if (it.right && p.face < 0) { p.face = 1; bm.a = Math.PI - bm.a; }
      const rot = 3.2 * dt * (it.up ? -1 : it.down ? 1 : 0) * p.face;
      bm.a += rot;
      // keep the beam in the front half
      let local = p.face > 0 ? bm.a : Math.PI - bm.a;
      local = U.clamp(Math.atan2(Math.sin(local), Math.cos(local)), -Math.PI / 2, Math.PI / 2);
      bm.a = p.face > 0 ? local : Math.PI - local;
    }
    p.aim = bm.a;
    const [mx, my] = muzzlePos(p);
    // ray cast to the first wall
    const len = 560, dx = Math.cos(bm.a), dy = Math.sin(bm.a);
    let L = len;
    for (let d = 0; d < len; d += 8) { const x = mx + dx * d, y = my + dy * d; if (G.solidAt(x, y)) { L = d; hitTileAt(x, y, 0.5 * dt * 60 * 0.08); break; } }
    bm.x0 = mx; bm.y0 = my; bm.x1 = mx + dx * L; bm.y1 = my + dy * L; bm.L = L;
    bm.tick -= dt;
    const dps = 50;
    if (bm.tick <= 0) {
      bm.tick = 0.07;
      A.sfx("beam");
      bm.seed = Math.random();
      for (const e of G.enemies) {
        if (e.dead) continue;
        if (segCircle(bm.x0, bm.y0, bm.x1, bm.y1, e.x, e.y - e.h / 2, e.r + 10)) damageEnemy(e, dps * 0.07, bm.x1, bm.y1, "beam");
      }
      if (G.boss && G.boss.damageSeg) G.boss.damageSeg(bm.x0, bm.y0, bm.x1, bm.y1, dps * 0.07 * 0.8);
      if (L < len) Fx.hitSpark(bm.x1, bm.y1, "160,220,255", 3);
    }
    p.muzzle = 0.6; p.muzzleRGB = "160,220,255";
  }
  function segCircle(x0, y0, x1, y1, cx, cy, r) {
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1;
    const t = U.clamp(((cx - x0) * dx + (cy - y0) * dy) / l2, 0, 1);
    return U.dist2(x0 + dx * t, y0 + dy * t, cx, cy) < r * r;
  }
  G.segCircle = segCircle;

  function powerLine(p) {
    G.run.lines--;
    A.sfx("line"); A.say("Power line!", { gap: 300 });
    for (const d of [-1, 1]) G.lines.push({ x: p.x, d, t: 0, hit: new Set(), bossHit: false });
    Fx.flash = Math.max(Fx.flash, 0.35); Fx.flashRGB = "160,255,255";
    Fx.shake = Math.max(Fx.shake, 10);
  }
  function updateLines(dt) {
    for (let i = G.lines.length - 1; i >= 0; i--) {
      const l = G.lines[i];
      l.t += dt; l.x += l.d * 1100 * dt;
      if (l.t > 1.4) { G.lines.splice(i, 1); continue; }
      for (const e of G.enemies) if (!e.dead && !l.hit.has(e) && Math.abs(e.x - l.x) < 40 && e.y > G.cam.y - 100 && e.y - e.h < G.cam.y + H + 100) { l.hit.add(e); damageEnemy(e, 45, l.x, e.y - e.h / 2, "line"); }
      for (let k = G.eb.length - 1; k >= 0; k--) { const b = G.eb[k]; if (Math.abs(b.x - l.x) < 40 && !b.solid) { Fx.hitSpark(b.x, b.y, "160,255,255", 3); G.eb.splice(k, 1); } }
      if (G.boss && !l.bossHit && G.boss.lineHit && Math.abs(G.boss.x - l.x) < 120) { l.bossHit = true; G.boss.lineHit(30); }
    }
  }

  // damage tiles (cracked rock, prize blocks)
  function hitTileAt(x, y, dmg = 1) {
    const tx = Math.floor(x / T), ty = Math.floor(y / T), id = tile(tx, ty), lv = G.lv, key = ty * lv.w + tx;
    if (id === TL.PRIZE) {
      const pr = lv.prizes.get(key) || { item: "diamonds", hp: 3 };
      pr.hp -= dmg;
      lv.prizes.set(key, pr);
      A.sfx("block");
      Fx.hitSpark(x, y, "255,220,120", 3);
      if (pr.hp <= 0) {
        Levels.setTile(lv, tx, ty, TL.USED);
        A.sfx("blockOpen");
        Fx.explode(tx * T + T / 2, ty * T + T / 2, 16, { rgb: "255,220,120" });
        const cx = tx * T + T / 2, cy = ty * T - 4;
        if (pr.item === "diamonds") for (let i = 0; i < 5; i++) dropItem("diamond", cx, cy, U.rand(-160, 160), U.rand(-520, -300));
        else dropItem(pr.item, cx, cy, U.rand(-40, 40), -420);
        G.addScore(100, cx, cy - 20);
      }
      return true;
    }
    if (id === TL.CRACK) {
      const hp = (lv.blockHp.get(key) ?? 4) - dmg;
      lv.blockHp.set(key, hp);
      Fx.hitSpark(x, y, "200,180,150", 2);
      if (hp <= 0) {
        Levels.setTile(lv, tx, ty, TL.EMPTY);
        A.sfx("crumble");
        Fx.explode(tx * T + T / 2, ty * T + T / 2, 14, { rgb: "200,170,130", debris: "#6a5040" });
        G.addScore(20);
      }
      return true;
    }
    if (Theme.solid(id)) { if (Math.random() < 0.3) A.sfx("clang"); }
    return false;
  }
  G.hitTileAt = hitTileAt;

  function updatePBullets(dt) {
    const L = G.pb;
    for (let i = L.length - 1; i >= 0; i--) {
      const b = L[i];
      b.t += dt; b.life -= dt;
      if (b.kind === "homing") {
        let best = null, bd = 700 * 700;
        for (const e of G.enemies) { if (e.dead || e.noHome) continue; const d = U.dist2(b.x, b.y, e.x, e.y - e.h / 2); if (d < bd) { bd = d; best = e; } }
        let tx = null, ty = null;
        if (best) { tx = best.x; ty = best.y - best.h / 2; }
        else if (G.boss && G.boss.target) { const tg = G.boss.target(); if (tg) { tx = tg.x; ty = tg.y; } }
        const sp = Math.min(760, Math.hypot(b.vx, b.vy) + 900 * dt);
        let a = Math.atan2(b.vy, b.vx);
        if (tx !== null && b.t > 0.08) a += U.clamp(U.angDiff(Math.atan2(ty - b.y, tx - b.x), a), -6.5 * dt, 6.5 * dt);
        b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp;
        if (Math.random() < dt * 40) Fx.add({ k: "smoke", x: b.x, y: b.y, vx: 0, vy: 0, size: 3, size2: 9, life: 0.4, drag: 1 });
      }
      if (b.kind === "bounce") b.vy += 300 * dt;
      if (b.kind === "flame") { b.vy -= 200 * dt; const d = Math.max(0, 1 - 2.5 * dt); b.vx *= d; b.vy *= d; }
      const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
      if (G.solidAt(nx, ny)) {
        if (b.kind === "bounce" && b.bounces > 0) {
          b.bounces--;
          if (G.solidAt(nx, b.y)) b.vx = -b.vx; else b.vy = -b.vy * 0.95;
          if (G.solidAt(b.x + b.vx * dt, b.y + b.vy * dt)) { b.vx = -b.vx; b.vy = -b.vy; }
          hitTileAt(nx, ny, 1);
          A.sfx("hit");
        } else {
          hitTileAt(nx, ny, b.kind === "flame" ? 0.15 : b.kind === "laser" ? 2 : b.kind === "homing" ? 3 : 1);
          if (b.kind === "homing") { Fx.explode(b.x, b.y, 12, { rgb: "220,160,255" }); A.sfx("boom"); }
          else Fx.hitSpark(b.x, b.y, b.kind === "laser" ? "140,210,255" : "255,220,150", 3);
          L.splice(i, 1); continue;
        }
      } else { b.x = nx; b.y = ny; }
      if (b.life <= 0 || b.x < G.cam.x - 200 || b.x > G.cam.x + W + 200 || b.y < G.cam.y - 300 || b.y > G.cam.y + H + 200) { L.splice(i, 1); continue; }
      // vs enemies
      let gone = false;
      for (const e of G.enemies) {
        if (e.dead || (b.hits && b.hits.has(e))) continue;
        const ey = e.y - e.h / 2, rr = e.r + b.r;
        if (U.dist2(b.x, b.y, e.x, ey) < rr * rr) {
          damageEnemy(e, b.dmg, b.x, b.y, b.kind);
          if (b.hits) b.hits.add(e);
          if (b.pierce > 0) { b.pierce--; continue; }
          if (b.kind === "homing") { Fx.explode(b.x, b.y, 14, { rgb: "220,160,255" }); A.sfx("boom"); }
          gone = true; break;
        }
      }
      if (!gone && G.boss && G.boss.hitTest) {
        const hr = G.boss.hitTest(b.x, b.y, b.r);
        if (hr) {
          if (hr === "weak") G.boss.damage(b.dmg * (b.kind === "flame" ? 0.8 : 1), b.x, b.y);
          else { Fx.hitSpark(b.x, b.y, "200,200,220", 2); A.sfx("clang"); }
          if (b.kind === "homing") { Fx.explode(b.x, b.y, 14, { rgb: "220,160,255" }); A.sfx("boom"); }
          if (!(b.kind === "laser" && hr === "weak" && b.pierce > 0) && b.kind !== "flame") gone = true;
          if (b.kind === "flame") b.life = Math.min(b.life, 0.05);
        }
      }
      if (gone) L.splice(i, 1);
    }
    // mines
    for (let i = G.mines.length - 1; i >= 0; i--) {
      const m = G.mines[i];
      m.t += dt;
      const body = { x: m.x, y: m.y + 7, w: 14, h: 14, vx: m.vx, vy: m.vy + GRAV * dt };
      G.moveBody(body, dt);
      m.x = body.x; m.y = body.y - 7; m.vx = body.vx * 0.9; m.vy = body.vy;
      let boom = m.t > 1.3;
      for (const e of G.enemies) if (!e.dead && U.dist2(m.x, m.y, e.x, e.y - e.h / 2) < (e.r + 14) ** 2) boom = true;
      if (G.boss && G.boss.hitTest && G.boss.hitTest(m.x, m.y, 20)) boom = true;
      if (boom) {
        G.mines.splice(i, 1);
        Fx.explode(m.x, m.y, 30, { rgb: "255,150,80" }); A.sfx("boom");
        for (const e of G.enemies) if (!e.dead && U.dist2(m.x, m.y, e.x, e.y - e.h / 2) < (e.r + 70) ** 2) damageEnemy(e, 12, m.x, m.y, "mine");
        if (G.boss && G.boss.hitTest && G.boss.hitTest(m.x, m.y, 70) === "weak") G.boss.damage(10, m.x, m.y);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) hitTileAt(m.x + dx * T, m.y + dy * T, 3);
      }
    }
  }

  /* ---------- Enemies (types live in enemies.js) ---------- */
  G.spawnEnemy = function (type, x, y, o = {}) {
    const def = XA.Enemies.TYPES[type];
    if (!def) return null;
    const diff = G.lv.stage.world;
    const e = Object.assign({ type, def, x, y, vx: 0, vy: 0, t: 0, hp: 1, w: 30, h: 30, r: 18, face: -1, flash: 0, dead: false, score: 100, dmg: 15, st: 0, cd: U.rand(0.5, 2) }, o);
    def.init(e, diff);
    e.hp *= 1 + diff * 0.22;
    e.maxHp = e.hp;
    G.enemies.push(e);
    G.stats.spawned++;
    return e;
  };
  function damageEnemy(e, dmg, x, y, kind) {
    if (e.dead || e.invuln) { if (e.invuln) { Fx.hitSpark(x, y, "200,200,220", 2); A.sfx("clang"); } return; }
    if (e.armor && e.def.armorHit && e.def.armorHit(e, x, y)) { Fx.hitSpark(x, y, "220,220,255", 3); A.sfx("clang"); dmg *= 0.15; }
    e.hp -= dmg;
    e.flash = 0.08;
    if (kind !== "beam" && kind !== "flame") A.sfx("hit");
    if (e.def.onHit) e.def.onHit(e, x, y);
    if (e.hp <= 0) killEnemy(e);
  }
  G.damageEnemy = damageEnemy;
  function killEnemy(e) {
    if (e.dead) return;
    e.dead = true;
    G.stats.killed++;
    G.run.kills++;
    const cy = e.y - e.h / 2;
    const big = e.r > 30;
    Fx.explode(e.x, cy, big ? 48 : Math.max(20, e.r * 1.3), { rgb: e.boomRGB, debris: e.debris });
    if (big) Fx.chain(e.x, cy, e.w, e.h, 5, 0.5, 28, { rgb: e.boomRGB });
    A.sfx(big ? "boomBig" : "boom");
    G.addScore(e.score, e.x, cy - 20);
    if (e.def.onDeath) e.def.onDeath(e);
    if (e.spawn) e.spawn.state = "dead";
    // drops
    const roll = Math.random();
    if (e.drop) dropItem(e.drop, e.x, cy, 0, -380);
    else if (roll < 0.06) dropItem("diamond", e.x, cy, U.rand(-60, 60), -380);
    else if (roll < 0.075) dropItem("health", e.x, cy, 0, -380);
  }
  G.killEnemy = killEnemy;
  G.eshoot = function (x, y, vx, vy, o = {}) {
    G.eb.push(Object.assign({ x, y, vx, vy, t: 0, life: 4, r: 6, dmg: 10 + G.lv.stage.world * 2, kind: "orb", g: 0 }, o));
  };
  G.aimAt = function (x, y, speed, spread = 0) {
    const p = G.player, a = Math.atan2(p.y - 30 - y, p.x - x) + U.rand(-spread, spread);
    return [Math.cos(a) * speed, Math.sin(a) * speed, a];
  };

  function updateEnemies(dt) {
    const cam = G.cam;
    // activate spawns near the camera
    for (const s of G.spawns) {
      if (s.state !== "idle") continue;
      if (s.x > cam.x - 120 && s.x < cam.x + W + 160 && s.y > cam.y - 200 && s.y < cam.y + H + 200) {
        if (s.x > cam.x - 40 && s.x < cam.x + W + 40 && s.y > cam.y && s.y < cam.y + H && !(XA.Enemies.TYPES[s.type] && XA.Enemies.TYPES[s.type].popIn)) continue; // never pop in on screen
        const e = G.spawnEnemy(s.type, s.x, s.y, { spawn: s, role: s.role });
        if (e) s.state = "alive";
      }
    }
    const p = G.player;
    const pb = playerBox();
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (e.dead) { G.enemies.splice(i, 1); continue; }
      e.t += dt; e.flash = Math.max(0, e.flash - dt);
      e.def.update(e, dt, G);
      if (e.dead) continue;
      // despawn when far away
      if (e.x < cam.x - 900 || e.x > cam.x + W + 900 || e.y > G.lv.h * T + 200 || e.y < cam.y - 1100 || e.y > cam.y + H + 1100) {
        if (e.spawn) e.spawn.state = "idle";
        G.enemies.splice(i, 1); continue;
      }
      // contact damage
      if (p.dead <= 0 && !e.harmless) {
        const ey = e.y - e.h / 2;
        const cx = U.clamp(ey, pb.y0, pb.y1), cxx = U.clamp(e.x, pb.x0, pb.x1);
        if (U.dist2(cxx, cx, e.x, ey) < (e.r * 0.85) ** 2) {
          if (p.gyro > 0) { if (!(e.gyroCd > 0)) { e.gyroCd = 0.25; damageEnemy(e, 6, e.x, ey, "gyro"); p.vx = -Math.sign(e.x - p.x) * 200; } }
          else hurtPlayer(e.dmg, e.x);
        }
      }
      if (e.gyroCd > 0) e.gyroCd -= dt;
    }
    // flying waves from the screen edges
    if (G.phase === "play" && !G.arena) {
      G.waveT -= dt;
      if (G.waveT <= 0) {
        const diff = G.lv.stage.world;
        G.waveT = U.rand(9, 14) - diff;
        const side = Math.random() < 0.75 ? 1 : -1;
        const pool = G.lv.world.pool.air;
        const type = pool[Math.floor(Math.random() * pool.length)] === "bomber" ? "bomber" : "swarm";
        const n = type === "bomber" ? 1 : 3 + Math.floor(diff / 2);
        const y0 = cam.y + U.rand(80, H * 0.45);
        for (let k = 0; k < n; k++) G.spawnEnemy(type, side > 0 ? cam.x + W + 40 + k * 60 : cam.x - 40 - k * 60, y0 + k * 18, { dir: -side, idx: k });
      }
    }
  }

  function updateEBullets(dt) {
    const L = G.eb, p = G.player, pb = playerBox();
    for (let i = L.length - 1; i >= 0; i--) {
      const b = L[i];
      b.t += dt; b.life -= dt;
      if (b.g) b.vy += b.g * dt;
      if (b.homing && b.t < b.homing) {
        const a0 = Math.atan2(b.vy, b.vx), sp = Math.hypot(b.vx, b.vy);
        const a = a0 + U.clamp(U.angDiff(Math.atan2(p.y - 30 - b.y, p.x - b.x), a0), -2.2 * dt, 2.2 * dt);
        b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp;
        if (Math.random() < dt * 30) Fx.add({ k: "smoke", x: b.x, y: b.y, vx: 0, vy: 0, size: 3, size2: 10, life: 0.5, drag: 1 });
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.life <= 0) { L.splice(i, 1); continue; }
      if (!b.ghost && G.solidAt(b.x, b.y)) {
        if (b.kind === "bomb" || b.kind === "missile" || b.kind === "fire") { Fx.explode(b.x, b.y, 18); A.sfx("boom"); }
        else Fx.hitSpark(b.x, b.y, b.rgb || "255,120,200", 2);
        L.splice(i, 1); continue;
      }
      if (p.dead <= 0) {
        const cx = U.clamp(b.x, pb.x0, pb.x1), cy = U.clamp(b.y, pb.y0, pb.y1);
        if (U.dist2(cx, cy, b.x, b.y) < b.r * b.r) {
          if (p.gyro > 0 || p.shield > 0) { Fx.hitSpark(b.x, b.y, "160,220,255", 4); L.splice(i, 1); continue; }
          if (p.inv <= 0 || G.cheat) {
            if (b.kind === "bomb" || b.kind === "missile") Fx.explode(b.x, b.y, 22);
            hurtPlayer(b.dmg, b.x);
            L.splice(i, 1); continue;
          }
        }
      }
    }
  }

  /* ---------- Items ---------- */
  function dropItem(type, x, y, vx = 0, vy = -380) {
    G.items.push({ type, x, y, vx, vy, p: U.rand(TAU), fixed: false, life: type === "diamond" ? 12 : 18, delay: 0.3 });
  }
  G.dropItem = dropItem;
  function collect(it) {
    const run = G.run, p = G.player;
    const sayN = (s) => A.say(s, { gap: 350 });
    switch (it.type) {
      case "diamond": run.diamonds++; G.addScore(100); A.sfx("diamond"); Fx.glow(it.x, it.y, 6, 26, "140,240,255", 0.3, { hot: true });
        if (run.diamonds % 100 === 0) G.extraLife(); break;
      case "bigdiamond": run.diamonds += 10; G.addScore(1000, it.x, it.y); A.sfx("power"); sayN("Big diamond!");
        if (Math.floor((run.diamonds - 10) / 100) < Math.floor(run.diamonds / 100)) G.extraLife(); break;
      case "w_spread": case "w_laser": case "w_bounce": case "w_flame": case "w_homing": {
        const w = it.type.slice(2);
        if (run.weapon === w) {
          if (run.power < 4) { run.power++; A.sfx("power"); sayN(run.power === 4 ? "Maximum power!" : "Power up!"); }
          else { G.addScore(2000, it.x, it.y); A.sfx("power"); sayN("Maximum power!"); }
        } else { run.weapon = w; A.sfx("pickup"); sayN({ spread: "Spread shot!", laser: "Laser!", bounce: "Rebound!", flame: "Flamer!", homing: "Homing missiles!" }[w]); }
        G.addScore(500, it.x, it.y - 10);
        break;
      }
      case "power": if (run.power < 4) { run.power++; sayN(run.power === 4 ? "Maximum power!" : "Power up!"); } else { G.addScore(2000, it.x, it.y); sayN("Maximum power!"); } A.sfx("power"); break;
      case "health": run.energy = Math.min(MAX_E, run.energy + 50); A.sfx("energy"); sayN("Energy!"); break;
      case "life": G.extraLife(); break;
      case "shield": p.shield = 12; A.sfx("shield"); sayN("Shield!"); break;
      case "line": run.lines = Math.min(9, run.lines + 1); A.sfx("pickup"); sayN("Power line!"); break;
      case "gyro": run.gyros = Math.min(9, run.gyros + 1); A.sfx("pickup"); sayN("Gyroscope!"); break;
      case "time": G.time += 60; A.sfx("pickup"); sayN("Time bonus!"); break;
    }
    if (it.type !== "diamond") Fx.explode(it.x, it.y, 10, { rgb: "255,255,200" });
  }
  function updateItems(dt) {
    const p = G.player, pb = playerBox();
    for (let i = G.items.length - 1; i >= 0; i--) {
      const it = G.items[i];
      if (!it.fixed) {
        it.delay -= dt;
        it.life -= dt;
        if (it.life <= 0) { G.items.splice(i, 1); continue; }
        const body = { x: it.x, y: it.y + 14, w: 22, h: 26, vx: it.vx, vy: it.vy + 1500 * dt };
        const r = G.moveBody(body, dt);
        it.x = body.x; it.y = body.y - 14; it.vy = body.vy; it.vx = body.vx * (r.ground ? 0.8 : 0.99);
        if (r.ground) it.vx *= 0.9;
        if (it.y > G.lv.h * T) { G.items.splice(i, 1); continue; }
      }
      if (p.dead > 0 || it.delay > 0) continue;
      if (it.x > pb.x0 - 18 && it.x < pb.x1 + 18 && it.y > pb.y0 - 18 && it.y < pb.y1 + 14) { collect(it); G.items.splice(i, 1); }
    }
  }

  /* ---------- Movers, crushers, checkpoints ---------- */
  function updateWorld(dt) {
    for (const m of G.movers) {
      m.t += dt;
      const ox = m.x, oy = m.yy;
      if (m.axis === "x") { const f = 0.5 - 0.5 * Math.cos((m.t * m.speed) / Math.max(40, m.x1 - m.x0) * Math.PI); m.x = U.lerp(m.x0, m.x1, f); }
      else { const f = 0.5 - 0.5 * Math.cos((m.t * m.speed) / Math.max(40, m.y1 - m.y0) * Math.PI); m.yy = U.lerp(m.y0, m.y1, f); m.x = m.x0; }
      m.dx = m.x - ox; m.dy = m.yy - oy;
    }
    const p = G.player, pb = playerBox();
    for (const c of G.crushers) {
      c.st -= dt;
      const dist = c.floor - c.top;
      if (c.state === "up" && c.st <= 0) { c.state = "warn"; c.st = 0.6; }
      else if (c.state === "warn" && c.st <= 0) { c.state = "down"; }
      else if (c.state === "down") { c.h = Math.min(dist, c.h + 1800 * dt); if (c.h >= dist) { c.state = "hold"; c.st = 0.35; A.sfx("crusher"); Fx.shake = Math.max(Fx.shake, 5); Fx.dust(c.x + c.w / 2, c.floor, 10); } }
      else if (c.state === "hold" && c.st <= 0) { c.state = "rise"; }
      else if (c.state === "rise") { c.h = Math.max(0, c.h - 300 * dt); if (c.h <= 0) { c.state = "up"; c.st = 1.4; } }
      // damage when moving down onto the player
      if (p.dead <= 0 && c.h > 10 && pb.x1 > c.x + 4 && pb.x0 < c.x + c.w - 4 && pb.y0 < c.top + c.h && pb.y1 > c.top) {
        if (c.state === "down" || c.state === "hold") { hurtPlayer(35, 0, true); p.x += (p.x < c.x + c.w / 2 ? -1 : 1) * 30; }
      }
    }
    for (const cp of G.checkpoints) {
      cp.t += dt;
      if (!cp.on && p.dead <= 0 && p.x > cp.x - 30) {
        cp.on = true; G.cp = { x: cp.x, y: cp.y };
        A.sfx("checkpoint"); A.say("Checkpoint", { gap: 400 });
        Fx.glow(cp.x, cp.y - 60, 30, 90, "120,255,160", 0.6, { a: 0.6 });
      }
    }
  }

  /* ---------- Stage flow ---------- */
  G.progress = () => U.clamp(G.player.x / ((G.lv.w - 10) * T), 0, 1);
  function updateFlow(dt) {
    const lv = G.lv, p = G.player;
    G.phaseT += dt;
    if (G.phase === "intro" && G.phaseT > 1.6) { G.phase = "play"; G.phaseT = 0; }
    if (G.phase === "play" || G.phase === "boss") {
      if (p.dead <= 0 && !G.bossDone) {
        const before = G.time;
        G.time -= dt;
        if (G.time < 30 && Math.floor(before) !== Math.floor(G.time)) A.sfx("timeWarn");
        if (G.time <= 0) {
          if (G.cheat) G.time = 60;
          else { G.time = 0; A.say("Time out!", { force: true }); killPlayer(false); }
        }
      }
      // exit teleporter
      if (lv.exit && p.dead <= 0 && Math.abs(p.x - lv.exit.x) < 50 && p.y > lv.exit.y - 120 && p.y <= lv.exit.y + 4) {
        G.phase = "clear"; G.phaseT = 0; A.sfx("portal"); A.jingle("clear"); A.say("Stage clear!", { force: true });
        stageBonus();
      }
      // boss arena
      if (lv.arena && !G.arena && p.x > lv.arena.x0 + 4 * T && p.dead <= 0) {
        G.arena = Object.assign({ locked: true }, lv.arena);
        G.phase = "warning"; G.phaseT = 0;
        A.stopMusic(); A.sfx("alarm");
        G.enemies.forEach((e) => { if (e.x < G.arena.x0 - 20) { e.dead = true; if (e.spawn) e.spawn.state = "dead"; } });
        G.boss = XA.Bosses.create(lv.arena.boss, G.arena);
        A.say(`Warning! ${G.boss.name.toLowerCase()} approaching!`, { force: true, rate: 0.95, pitch: 0.6 });
      }
    }
    if (G.phase === "warning" && G.phaseT > 3) { G.phase = "boss"; G.phaseT = 0; A.playSong(lv.stage.boss === "overmind" ? "final" : "boss"); }
    if (G.boss && G.boss.dead && !G.bossDone) {
      G.bossDone = true; G.phase = "bossdown"; G.phaseT = 0;
      A.stopMusic();
    }
    if (G.phase === "bossdown" && G.phaseT > 4.5) {
      G.phase = "clear"; G.phaseT = 0; A.jingle("boss"); A.say("Stage clear!", { force: true });
      G.eb.length = 0;
      stageBonus();
    }
  }
  function stageBonus() {
    const s = G.stats;
    G.clearBonus = {
      time: Math.floor(Math.max(0, G.time)) * 20,
      boss: G.boss ? G.boss.score : 0,
      ratio: s.spawned ? Math.min(1, s.killed / s.spawned) : 0,
    };
    G.addScore(G.clearBonus.time);
    if (G.clearBonus.boss) G.addScore(G.clearBonus.boss);
    G.eb.length = 0;
  }

  /* ---------- Update ---------- */
  G.update = function (dt) {
    G.t += dt;
    if (G.gameOverT > 0) { G.gameOverT -= dt; if (G.gameOverT <= 0 && G.onGameOver) G.onGameOver(); }
    updateFlow(dt);
    updateWorld(dt);
    updatePlayer(dt);
    updatePBullets(dt);
    updateLines(dt);
    updateEnemies(dt);
    if (G.boss) G.boss.update(dt);
    updateEBullets(dt);
    updateItems(dt);
    updateCamera(dt);
    Theme.ambient(G.ambient, G.th, G.cam.x, G.cam.y, dt);
    Fx.update(dt);
  };

  /* ---------- Draw ---------- */
  G.draw = function (ctx) {
    const cam = G.cam, lv = G.lv, th = G.th, t = G.t;
    const cx = Math.round(cam.x), cy = Math.round(cam.y);
    Theme.drawBackground(ctx, th, cx, cy, t, lv.variant, lv.h * T);
    Theme.drawAmbient(ctx, G.ambient, th, cx, cy);
    ctx.save();
    ctx.translate(-cx, -cy);
    // checkpoints and exit (behind the tiles)
    for (const cp of G.checkpoints) drawCheckpoint(ctx, cp, t);
    if (lv.exit) drawExit(ctx, lv.exit, t);
    if (G.boss && G.boss.drawBack) G.boss.drawBack(ctx);
    ctx.restore();
    Theme.drawTiles(ctx, th, lv, cx, cy, t);
    ctx.save();
    ctx.translate(-cx, -cy);
    for (const m of G.movers) drawMover(ctx, m, th, t);
    for (const c of G.crushers) drawCrusher(ctx, c, th, t);
    for (const it of G.items) if (it.x > cx - 40 && it.x < cx + W + 40 && it.y > cy - 40 && it.y < cy + H + 40) Spr.item(ctx, it, t);
    for (const e of G.enemies) if (e.x > cx - 200 && e.x < cx + W + 200) e.def.draw(ctx, e, t);
    if (G.boss) G.boss.draw(ctx);
    drawPlayer(ctx);
    for (const m of G.mines) Spr.pbullet(ctx, Object.assign({ kind: "mine" }, m));
    for (const b of G.pb) Spr.pbullet(ctx, b);
    for (const b of G.eb) Spr.ebullet(ctx, b);
    Fx.draw(ctx);
    ctx.restore();
    Theme.drawLiquid(ctx, th, lv, cx, cy, t);
    ctx.save();
    ctx.translate(-cx, -cy);
    const p = G.player;
    if (p.beam && p.beam.x0 !== undefined) {
      const b = p.beam;
      Gfx.bolt(ctx, b.x0, b.y0, b.x1, b.y1, "120,200,255", 3, 16, b.seed || 0.5);
      Gfx.bolt(ctx, b.x0, b.y0, b.x1, b.y1, "200,160,255", 1.5, 26, (b.seed || 0.5) * 0.7 + 0.1);
      Gfx.glowAt(ctx, "140,210,255", b.x1, b.y1, 40, 0.8, true);
    }
    for (const l of G.lines) drawLine(ctx, l);
    ctx.restore();
  };

  function drawPlayer(ctx) {
    const p = G.player;
    if (p.dead > 0) return;
    if (p.inv > 0 && p.shield <= 0 && Math.floor(G.t * 18) % 2 && G.phase !== "intro") return;
    let beamOut = 1;
    if (G.phase === "clear" && G.lv.exit) {
      // the suit is beamed away by the exit teleporter
      beamOut = Math.max(0, 1 - G.phaseT / 1.2);
      Gfx.glowAt(ctx, "160,250,255", p.x, p.y - 40, 70 * (1.4 - beamOut), 0.8);
      if (beamOut <= 0) return;
    }
    ctx.save(); ctx.globalAlpha = beamOut;
    const state = p.gyro > 0 ? "gyro" : !p.onGround ? "jump" : p.crouch ? "crouch" : Math.abs(p.vx) > 30 ? "run" : "idle";
    Spr.player(ctx, p.x, p.y, { face: p.face, state, t: G.t, aim: p.aim, run: p.runPh, muzzle: p.muzzle, muzzleRGB: p.muzzleRGB, roll: p.roll, flash: p.hurtT > 0.15 });
    if (p.shield > 0) {
      const a = p.shield < 2 ? (Math.floor(G.t * 10) % 2 ? 0.3 : 0.8) : 0.8;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = "rgba(140,190,255,0.9)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(p.x, p.y - 30, 34, 40, 0, 0, TAU); ctx.stroke();
      ctx.restore();
      Gfx.glowAt(ctx, "120,170,255", p.x, p.y - 30, 52, 0.35 * a);
    }
    ctx.restore();
  }
  function drawCheckpoint(ctx, cp, t) {
    const x = cp.x, y = cp.y;
    ctx.fillStyle = "#30343e"; ctx.fillRect(x - 3, y - 90, 6, 90);
    ctx.fillStyle = "#555b68"; ctx.fillRect(x - 10, y - 8, 20, 8);
    const rgb = cp.on ? "100,255,150" : "255,90,70";
    Gfx.glowAt(ctx, rgb, x, y - 92, 22 + 4 * Math.sin(t * 6), 0.9, true);
    ctx.fillStyle = `rgb(${rgb})`; ctx.beginPath(); ctx.arc(x, y - 92, 5, 0, TAU); ctx.fill();
    if (cp.on) { ctx.fillStyle = "rgba(100,255,150,0.25)"; ctx.beginPath(); ctx.moveTo(x + 3, y - 86); ctx.lineTo(x + 34 + 4 * Math.sin(t * 5), y - 76); ctx.lineTo(x + 3, y - 64); ctx.fill(); }
  }
  function drawExit(ctx, ex, t) {
    const x = ex.x, y = ex.y;
    ctx.fillStyle = "#2a2e38"; ctx.fillRect(x - 46, y - 12, 92, 12);
    ctx.fillStyle = "#3a404c"; ctx.fillRect(x - 40, y - 150, 10, 140); ctx.fillRect(x + 30, y - 150, 10, 140);
    ctx.fillStyle = "#4a5260"; ctx.fillRect(x - 46, y - 162, 92, 14);
    const g = ctx.createLinearGradient(0, y - 150, 0, y);
    g.addColorStop(0, "rgba(120,240,255,0)"); g.addColorStop(1, `rgba(120,240,255,${0.45 + 0.15 * Math.sin(t * 6)})`);
    ctx.fillStyle = g; ctx.fillRect(x - 30, y - 150, 60, 138);
    for (let i = 0; i < 4; i++) { const yy = y - ((t * 90 + i * 35) % 140); Gfx.glowAt(ctx, "160,250,255", x + Math.sin(t * 3 + i) * 18, yy, 8, 0.8, true); }
    ctx.font = "700 14px Orbitron, Arial"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(200,250,255,0.9)";
    ctx.fillText("EXIT", x, y - 172);
  }
  function drawMover(ctx, m, th, t) {
    const [c1, c2] = th.metal;
    const g = ctx.createLinearGradient(0, m.yy, 0, m.yy + 16);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(m.x, m.yy, m.w, 16);
    ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(m.x, m.yy, m.w, 2);
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(m.x, m.yy + 14, m.w, 2);
    for (let i = 0; i < 2; i++) Gfx.glowAt(ctx, "255,180,80", m.x + 16 + i * (m.w - 32), m.yy + 20, 14 + 4 * Math.sin(t * 20 + i), 0.8, true);
  }
  function drawCrusher(ctx, c, th, t) {
    const x = c.x, top = c.top, h = c.h;
    ctx.fillStyle = "#24262c"; ctx.fillRect(x + c.w / 2 - 8, top - 40, 16, 40 + h);
    ctx.fillStyle = "#4a4e58"; ctx.fillRect(x + c.w / 2 - 4, top - 40, 8, 40 + h);
    const y = top + h - 30;
    const g = ctx.createLinearGradient(0, y, 0, y + 30);
    g.addColorStop(0, "#9aa0aa"); g.addColorStop(1, "#3a3e46");
    ctx.fillStyle = g; ctx.fillRect(x, y, c.w, 30);
    ctx.fillStyle = "#ffd040";
    for (let k = 0; k < c.w; k += 16) { ctx.beginPath(); ctx.moveTo(x + k, y + 30); ctx.lineTo(x + k + 8, y + 30); ctx.lineTo(x + k + 2, y + 22); ctx.lineTo(x + k - 6 < x ? x : x + k - 6, y + 22); ctx.fill(); }
    ctx.fillStyle = "#1a1c20";
    for (let k = 4; k < c.w; k += 10) ctx.fillRect(x + k, y + 30, 4, 6);
    if (c.state === "warn") Gfx.glowAt(ctx, "255,60,40", x + c.w / 2, y + 12, 26, Math.floor(t * 12) % 2 ? 0.9 : 0.3, true);
  }
  function drawLine(ctx, l) {
    const f = Math.min(1, l.t * 3) * Math.max(0, 1 - (l.t - 1) / 0.4);
    const y0 = G.cam.y - 20, y1 = G.cam.y + H + 20;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(l.x - 40 * l.d, 0, l.x, 0);
    g.addColorStop(0, "rgba(80,255,255,0)"); g.addColorStop(1, `rgba(160,255,255,${0.8 * f})`);
    ctx.fillStyle = g;
    ctx.fillRect(Math.min(l.x - 60 * l.d, l.x), y0, 60, y1 - y0);
    ctx.fillStyle = `rgba(255,255,255,${f})`; ctx.fillRect(l.x - 3, y0, 6, y1 - y0);
    ctx.restore();
    for (let k = 0; k < 3; k++) Gfx.bolt(ctx, l.x, y0 + U.rand(0, H), l.x - l.d * U.rand(20, 60), y0 + U.rand(0, H), "120,255,255", 1.2, 10);
  }
})(window.XA);
