/* Garden Siege: the board – plants, zombies, shots, sun and coins, waves, special modes, play input and drawing */
"use strict";

(function (GS) {
  const { U, D, Store } = GS;
  const A = GS.Audio, I = GS.Input;
  const W = U.W, H = U.H;
  const P = GS.PLANTS, Z = GS.ZOMBIES;
  const G = (GS.G = {});

  /* ---------- layout of the top bar ---------- */
  const BANK = { x: 8, y: 6, px: 100, pw: 62, ph: 86, gap: 4 };
  const MENU_BTN = { x: 1150, y: 8, w: 120, h: 44, label: "Menu" };
  G.MENU_BTN = MENU_BTN;
  const packetRect = (i) => ({ x: BANK.px + i * (BANK.pw + BANK.gap), y: BANK.y + 4, w: BANK.pw, h: BANK.ph });
  const IZ_COST = { walker: 50, cone: 75, pole: 75, bucket: 125, football: 175, miner: 125, ladder: 150, giant: 300, pogo: 200, dancer: 350, balloon: 150, imp: 50, door: 100, jack: 100 };
  GS.IZ_COST = IZ_COST;

  G.sfx = (n) => A.sfx(n);
  G.say = (t, o) => A.say(t, o);

  /* ================= setup ================= */
  G.prepare = function (spec) {
    G.spec = spec;
    G.area = spec.area;
    G.A = GS.AREAS[spec.area];
    G.night = G.A.night;
    G.geo = GS.Geo.get(spec.rows || G.A.rows, spec.area);
    const rows = G.geo.rows;
    G.active = [];
    for (let r = 0; r < rows; r++) G.active.push(!spec.activeRows || spec.activeRows.includes(r));
    G.cells = [];
    for (let r = 0; r < rows; r++) { const row = []; for (let c = 0; c < 9; c++) row.push({ base: null, main: null, shell: null, extra: null, grave: false, crater: 0, vase: null }); G.cells.push(row); }
    G.plants = []; G.zombies = []; G.shots = []; G.items = []; G.parts = []; G.texts = [];
    G.sun = spec.startSun ?? 50;
    G.t = 0; G.skyT = 5;
    G.tool = null; G.kc = { r: Math.floor(rows / 2), c: 2, b: 0 };
    G.ice = new Array(rows).fill(Infinity); G.iceT = new Array(rows).fill(0);
    G.fogCols = spec.fogCols || 0; G.fogClear = 0;
    G.boss = null; G.belt = null; G.result = null; G.lost = null; G.banner = null;
    G.wave = 0; G.round = 0; G.flagsDone = 0; G.waveT = spec.firstWave || 18; G.hugeShown = false; G.sinceWave = 0; G.waveHp0 = 1; G.lastRows = [];
    G.totalWaves = spec.rounds !== undefined && spec.roundWaves ? spec.roundWaves : spec.waves || 0;
    G.roundBreak = false; G.lastKill = null; G.award = null; G.coinsGot = 0; G.coinShow = 0;
    G.shake = 0; G.flashA = 0; G.flashRGB = "255,255,255"; G.storm = 0; G.stormT = 3;
    G.mowers = [];
    const mk = G.A.mower;
    for (let r = 0; r < rows; r++) {
      let kind = G.geo.water[r] ? "pool" : mk;
      let has = spec.mowers !== false && G.active[r];
      if (kind === "pool" && !GS.Save.owns("poolCleaner")) has = false;
      if (kind === "roof" && !GS.Save.owns("roofCleaner")) has = false;
      G.mowers.push({ state: has ? "ready" : "none", x: G.geo.x0 - 60, kind });
    }
    // graves
    if (spec.graves) for (let i = 0; i < spec.graves; i++) G.addGrave(4, 8);
    if (spec.prePots) for (let r = 0; r < rows; r++) for (let c = 0; c < spec.prePots; c++) if (G.active[r]) G.addPlant("pot", r, c, { silent: true });
    if (spec.vase) G.setupVases();
    if (spec.izombie) G.setupIZombie();
    G.preview = [];
    if (!spec.izombie && !spec.vase && spec.pool) {
      const kinds = spec.pool.filter((z) => z !== "bungee" || true);
      for (let i = 0; i < 9; i++) G.preview.push({ id: kinds[i % kinds.length], x: U.rand(1190, 1260), y: U.rand(200, 690), age: U.rand(9) });
      G.preview.sort((a, b) => a.y - b.y);
    }
    G.seeds = [];
    G.started = false;
    G.slot = null; G.streak = 0; G.rainT = undefined; G.malletT = 0; G.intro = 0; G.continueBtn = null;
    if (!spec.izombie) G.brains = null;
  };

  G.begin = function (seedIds) {
    const spec = G.spec;
    G.seeds = (seedIds || []).map((id) => {
      const d = P[id];
      const cd = d.recharge >= 50 ? 35 : d.recharge >= 30 ? 20 : 0;
      return { id, cd, max: cd || d.recharge };
    });
    if (spec.izombie) G.seeds = spec.izombie.zombies.map((id) => ({ id, zombie: true, cd: 0, max: 1 }));
    if (spec.conveyor) G.belt = { items: [], t: 1, list: spec.conveyor };
    if (spec.slots) G.slot = { reels: ["pea", "sunbloom", "nut"], spin: 0, cool: 0, res: null };
    if (spec.boss) G.boss = GS.Boss.create(G, spec.bossHp || 40000);
    G.started = true;
    G.hintT = spec.hint ? 24 : 0;
    G.intro = 2.4;
    G.banner = { text: "Ready…", t: 0 };
    A.say("Ready. Set. Plant!", { rate: 1.1 });
    A.playSong(spec.boss ? "boss" : spec.mode === "mini" && !spec.survival ? "minigame" : G.A.song);
  };

  // survival / last stand: next round of flags
  G.nextRound = function (seedIds) {
    if (seedIds) {
      const old = {};
      for (const s of G.seeds) old[s.id] = s;
      G.seeds = seedIds.map((id) => old[id] || { id, cd: 0, max: P[id].recharge });
    }
    G.round++; G.wave = 0; G.waveT = 12; G.hugeShown = false; G.roundBreak = false;
    G.banner = { text: G.spec.endless ? `Flag ${G.flagsDone + 1}` : `Round ${G.round + 1}`, t: 0 };
  };

  /* ================= geometry ================= */
  G.colX = (c) => G.geo.x0 + c * G.geo.cw + G.geo.cw / 2;
  G.rowY = (r) => G.geo.y0 + (r + 1) * G.geo.ch - 16 * G.geo.scale;
  G.rowOk = (r) => r >= 0 && r < G.geo.rows && G.active[r];
  G.isWater = (r) => !!G.geo.water[r];
  G.cellAt = function (x, y) {
    const g = G.geo;
    const c = Math.floor((x - g.x0) / g.cw), r = Math.floor((y - g.y0) / g.ch);
    if (c < 0 || c > 8 || r < 0 || r >= g.rows) return null;
    return { r, c };
  };
  const rowOfY = (y) => U.clamp(Math.floor((y - G.geo.y0 - 1) / G.geo.ch), 0, G.geo.rows - 1);

  /* ================= plants ================= */
  G.canPlace = function (id, r, c) {
    const d = P[id];
    if (!d || !G.rowOk(r) || c < 0 || c > 8) return false;
    const spec = G.spec, cell = G.cells[r][c];
    if (spec.plantCols && c >= spec.plantCols) return false;
    if (spec.izombie) return false;
    if (cell.vase) return false;
    if (G.iceAt(r, c) || cell.crater > 0) return false;
    if (d.onGrave) return cell.grave && !cell.main;
    if (cell.grave) return false;
    const water = G.isWater(r), roof = G.geo.roof;
    if (id === "coffee") return !!(cell.main && cell.main.def.mushroom && cell.main.asleep && !cell.extra);
    if (d.upgradeOf) {
      if (d.wide) {
        if (c > 7) return false;
        const a = cell.main, b = G.cells[r][c + 1].main;
        return !!(a && b && a.def.id === "corn" && b.def.id === "corn" && a !== b);
      }
      if (id === "cattail") return !!(cell.base && cell.base.def.id === "lily" && !cell.main);
      return !!(cell.main && cell.main.def.id === d.upgradeOf);
    }
    if (d.layer === "base") {
      if (cell.base || cell.main) return false;
      if (id === "lily") return water;
      return !water;
    }
    if (d.layer === "shell") {
      if (cell.shell) return false;
      if ((water || roof) && !cell.base) return false;
      if (cell.main && cell.main.def.wide) return false;
      return true;
    }
    if (cell.main) return false;
    if (d.waterOnly) return water && !cell.base;
    if (water) return !!cell.base && !d.ground;
    if (roof) return !!cell.base && !d.ground;
    return true;
  };

  G.addPlant = function (id, r, c, o = {}) {
    const d = P[id], cell = G.cells[r][c];
    const p = { def: d, id, row: r, col: c, x: G.colX(c), y: G.rowY(r), hp: d.hp, maxHp: d.hp, age: 0, t: 0, anim: 0, layer: d.layer };
    p.asleep = !!d.mushroom && !G.night;
    if (d.upgradeOf) {
      if (d.wide) { G.removePlant(cell.main, true); G.removePlant(G.cells[r][c + 1].main, true); p.x = G.colX(c); }
      else if (id !== "cattail") G.removePlant(cell.main, true);
    }
    if (d.init) d.init(p, G);
    if (p.layer === "base") cell.base = p;
    else if (p.layer === "shell") cell.shell = p;
    else if (p.layer === "extra") cell.extra = p;
    else { cell.main = p; if (d.wide) G.cells[r][c + 1].main = p; }
    G.plants.push(p);
    if (!o.silent) {
      A.sfx(G.isWater(r) ? "splash" : "plant");
      G.dirt(p.x, p.y, G.isWater(r) ? "#9ad8ff" : null);
    }
    return p;
  };
  G.removePlant = function (p, silent) {
    if (!p || p.dead) return;
    p.dead = true;
    const cell = G.cells[p.row][p.col];
    for (const k of ["base", "main", "shell", "extra"]) if (cell[k] === p) cell[k] = null;
    if (p.def.wide && G.cells[p.row][p.col + 1].main === p) G.cells[p.row][p.col + 1].main = null;
    // a plant on a pot or lily keeps the base; removing the base drops what is on it
    if (p.layer === "base") { if (cell.main) G.removePlant(cell.main, true); if (cell.shell) G.removePlant(cell.shell, true); if (cell.extra) G.removePlant(cell.extra, true); }
    if (p.layer === "main" && cell.extra) G.removePlant(cell.extra, true);
    if (G.spec.izombie && !silent && !p.shoveled) G.izPlantLost(p);
  };
  G.topPlant = function (r, c) {
    if (!G.cells[r] || !G.cells[r][c]) return null;
    const cell = G.cells[r][c];
    return cell.shell || cell.main || cell.base || null;
  };
  // the plant a zombie bites in this cell (spikes cannot be eaten)
  function biteTarget(r, c) {
    const cell = G.cells[r][c];
    if (cell.shell) return cell.shell;
    if (cell.main && !cell.main.def.spiky) return cell.main;
    if (cell.main && cell.main.def.spiky) return null;
    return cell.base;
  }
  G.plantsInRow = (r) => G.plants.filter((p) => !p.dead && p.row === r);
  G.crushPlant = function (p) { if (p && !p.dead) { G.removePlant(p); A.sfx("squash"); G.puff(p.x, p.y - 20, "#7a5a3a", 8); } };
  G.crushCell = function (r, c) {
    if (!G.cells[r] || !G.cells[r][c]) return;
    const cell = G.cells[r][c];
    for (const k of ["extra", "shell", "main", "base"]) if (cell[k]) G.crushPlant(cell[k]);
  };
  G.addCrater = (r, c) => { G.cells[r][c].crater = 180; };
  G.addGrave = function (c0, c1) {
    for (let k = 0; k < 40; k++) {
      const r = U.randi(0, G.geo.rows - 1), c = U.randi(c0, c1);
      if (!G.rowOk(r) || G.isWater(r)) continue;
      const cell = G.cells[r][c];
      if (cell.grave || cell.main || cell.base || cell.vase) continue;
      cell.grave = true; cell.graveRise = 1;
      return { r, c };
    }
    return null;
  };
  G.removeGrave = (r, c) => { G.cells[r][c].grave = false; G.puff(G.colX(c), G.rowY(r) - 30, "#8b8f99", 10); };
  G.iceAt = (r, c) => G.ice[r] < G.colX(c) + 40;
  G.setIce = (r, x) => { if (x < G.ice[r]) G.ice[r] = Math.max(G.geo.x0 - 50, x); G.iceT[r] = 30; };
  G.iceX = (r) => G.ice[r];
  G.umbrellaCovers = function (r, c) {
    return G.plants.some((p) => !p.dead && p.def.umbrella && !p.asleep && Math.abs(p.row - r) <= 1 && Math.abs(p.col - c) <= 1);
  };
  G.umbrellaBlock = function (r, c) {
    for (const p of G.plants) if (!p.dead && p.def.umbrella && Math.abs(p.row - r) <= 1 && Math.abs(p.col - c) <= 1) { p.anim = 0.5; break; }
  };

  /* ================= zombies ================= */
  G.spawnZombie = function (id, row, x, o = {}) {
    const d = Z[id];
    if (!d) return null;
    const spec = G.spec;
    const mul = (spec.fast ? 2 : 1) * (spec.hard ? 1.1 : 1);
    const z = {
      def: d, id, row, x, y: G.rowY(row), hp: d.hp, bodyMax: d.hp,
      armor: d.armor ? { kind: d.armor.kind, hp: d.armor.hp, max: d.armor.hp } : null,
      shield: d.shield ? { kind: d.shield.kind, hp: d.shield.hp, max: d.shield.hp } : null,
      mul, speed: d.speed * U.rand(0.88, 1.12) * mul, dir: -1, state: "walk", age: 0, walk: U.rand(6),
      wave: o.wave ?? -1, scale: (d.scale || 1) * (spec.tiny ? 0.55 : 1) * G.geo.scale, slowT: 0, freezeT: 0, butterT: 0, eatMul: 1,
    };
    z.maxHp = z.hp + (z.armor ? z.armor.hp : 0) + (z.shield ? z.shield.hp : 0);
    if (d.init) d.init(z, G);
    if (o.rise) { z.rise = 1.2; }
    if (o.air) { z.airT = o.air.T; z.airT0 = o.air.T; z.airFrom = o.air.from; z.airTo = x; z.airborne = true; z.x = o.air.from; }
    G.zombies.push(z);
    return z;
  };

  G.targetable = function (z, kind) {
    if (z.dead || z.escaped || z.drowning || z.blown) return false;
    if (z.def.targetable && !z.def.targetable(z)) return false;
    if (z.underground || z.emerge > 0 || z.rise > 0.6) return false;
    if (z.submerged) return kind === "kelp";
    if (z.flying) return kind === "spike" || kind === "homing" || kind === "explode" || kind === "blow";
    if (z.airborne) return kind === "explode";
    if (kind === "kelp") return G.isWater(z.row);
    return true;
  };
  const ON_SCREEN = 1230;
  function hostile(z) { return !z.hypno && !z.dead && !z.escaped; }
  G.anyAhead = function (row, x, range, kind) {
    for (const z of G.zombies) if (z.row === row && hostile(z) && z.x >= x - 20 && z.x <= x + range && z.x < ON_SCREEN && G.targetable(z, kind)) return true;
    const b = G.boss;
    if (b && !b.dead && b.state !== "intro" && x + range >= 1000) return true;
    return false;
  };
  G.anyBehind = function (row, x) {
    for (const z of G.zombies) if (z.row === row && hostile(z) && z.x < x - 10 && z.x > 0 && G.targetable(z, "straight")) return true;
    return false;
  };
  G.firstInRange = function (row, x0, x1, kind) {
    let best = null;
    for (const z of G.zombies) if (z.row === row && hostile(z) && z.x >= x0 && z.x <= x1 && G.targetable(z, kind)) if (!best || z.x < best.x) best = z;
    return best;
  };
  G.lobTarget = function (row, x) {
    let best = null;
    for (const z of G.zombies) if (z.row === row && hostile(z) && z.x > x - 10 && z.x < ON_SCREEN && G.targetable(z, "lob")) if (!best || z.x < best.x) best = z;
    if (!best && G.boss && !G.boss.dead && G.boss.state !== "intro") return { boss: true, x: 1060, y: G.rowY(row), row };
    return best;
  };
  G.anyTarget = function (preferFlying) {
    let best = null, fly = null;
    for (const z of G.zombies) {
      if (!hostile(z) || z.x > ON_SCREEN) continue;
      if (z.flying && G.targetable(z, "homing")) { if (!fly || z.x < fly.x) fly = z; }
      else if (G.targetable(z, "homing") && (!best || z.x < best.x)) best = z;
    }
    if (preferFlying && fly) return fly;
    if (best || fly) return best || fly;
    if (G.boss && !G.boss.dead && G.boss.state !== "intro") return { boss: true, x: 1060, y: 400, row: 2 };
    return null;
  };
  G.starSees = function (p) {
    const cw = G.geo.cw, ch = G.geo.ch;
    for (const z of G.zombies) {
      if (!hostile(z) || z.x > ON_SCREEN || !G.targetable(z, "straight")) continue;
      const dx = (z.x - p.x) / cw, dr = z.row - p.row;
      if (dr === 0 && dx < 0) return true;
      if (Math.abs(dx) < 0.6) return true;
      if (dx > 0 && Math.abs(Math.abs(dr) * ch / cw * 1.73 - dx) < 0.8) return true;
    }
    return !!(G.boss && !G.boss.dead && G.boss.state !== "intro");
  };
  G.plantAhead = function (z) {
    for (const p of G.plants) if (!p.dead && p.row === z.row && p.x < z.x && p.x > G.geo.x0 - 20 && !p.def.spiky) return true;
    return false;
  };

  // damage
  const METAL = new Set(["bucket", "helmet", "door", "ladder", "minerhat"]);
  G.hurt = function (z, dmg, kind, o = {}) {
    if (z.dead) return;
    if (z.def.boss) return;
    z.hitT = 0.1;
    if (z.flying && (kind === "spike" || kind === "homing" || kind === "blow")) {
      if (z.armor) { z.armor = null; A.sfx("pop"); G.puff(z.x + 10, z.y - 210, "#e83040", 8); }
      return;
    }
    let d = dmg;
    const full = kind === "explode" || kind === "squash" || kind === "eat" || kind === "spike" || kind === "roll";
    if (z.shield && (full || kind === "fume" || (kind === "straight" && (o.fromX === undefined || o.fromX < z.x)))) {
      z.shield.hp -= d;
      if (kind === "straight") { if (z.shield.hp <= 0) loseShield(z); A.sfx("metal"); return; }
      if (z.shield.hp <= 0) { const over = -z.shield.hp; loseShield(z); d = full ? over : d; } else if (full) return;
    }
    if (z.armor && z.armor.kind !== "balloon") {
      z.armor.hp -= d;
      A.sfx(METAL.has(z.armor.kind) ? "metal" : z.armor.kind === "cone" ? "cone" : "splat");
      if (z.armor.hp <= 0) { d = -z.armor.hp; loseArmor(z); } else return;
    } else if (kind !== "eat") A.sfx("splat");
    z.hp -= d;
    if (!z.armLost && z.hp < z.bodyMax * 0.5 && !z.def.vehicle && !z.def.noArms) { z.armLost = true; G.part({ x: z.x - 30, y: z.y - 80, vx: -40, vy: -150, kind: "arm", life: 1.2 }); }
    if (z.hp <= 0) G.killZombie(z, kind);
  };
  function loseShield(z) {
    const k = z.shield.kind;
    z.shield = null;
    G.part({ x: z.x - 30, y: z.y - 70, vx: -60, vy: -120, kind: "item", item: k, life: 1.2 });
  }
  function loseArmor(z) {
    const k = z.armor.kind;
    z.armor = null;
    if (k === "sled") return;
    const item = k === "helmet" ? "helmet" : k === "bucket" ? "bucket" : null;
    if (item) G.part({ x: z.x, y: z.y - 140, vx: 60, vy: -160, kind: "item", item, life: 1.2 });
    else if (k === "cone") G.part({ x: z.x, y: z.y - 140, vx: 60, vy: -160, kind: "cone", life: 1.2 });
    else if (k === "paper") G.puff(z.x - 30, z.y - 80, "#f0ece0", 10);
    else if (k === "nut") G.puff(z.x, z.y - 120, "#c8913f", 10);
  }
  G.killZombie = function (z, kind) {
    if (z.dead) return;
    z.dead = true;
    z.dying = 1.2;
    z.ash = kind === "explode" || kind === "burn";
    if (z.ash) { G.puff(z.x, z.y - 60, "#222", 14); }
    else if (!z.def.vehicle) G.part({ x: z.x - 4, y: z.y - 114, vx: U.rand(-40, 40), vy: -120, kind: "head", life: 1.4, skin: z.hypno });
    if (z.def.vehicle) { G.boomFx(z.x, z.y - 40, 0.8, "120,120,120"); z.dying = 0.5; }
    G.lastKill = { x: z.x, y: z.y };
    if (G.spec.whack && U.chance(0.3)) G.addSun(z.x, z.y - 60, 25, { pop: true });
    if (z.id === "yeti") { G.addCoin(z.x, z.y - 40, "diamond"); G.addCoin(z.x + 20, z.y - 50, "diamond"); }
    else if (!G.spec.izombie) {
      const r = Math.random();
      if (r < 0.004) G.addCoin(z.x, z.y - 40, "diamond");
      else if (r < 0.025) G.addCoin(z.x, z.y - 40, "gold");
      else if (r < 0.085) G.addCoin(z.x, z.y - 40, "silver");
    }
  };
  G.swallow = function (z) { z.dead = true; z.gone = true; G.lastKill = { x: z.x, y: z.y }; };
  G.drown = function (z) { z.drowning = 1.0; z.dead = true; z.dying = 1.0; G.lastKill = { x: z.x, y: z.y }; };
  G.popVehicle = function (z) { A.sfx("pop"); G.killZombie(z, "pop"); };
  G.blowAway = function () {
    A.sfx("wind");
    for (const z of G.zombies) if (z.flying && !z.dead && !z.hypno) { z.blown = true; z.dead = true; z.dying = 1.2; G.lastKill = { x: z.x, y: z.y }; }
    if (G.fogCols) G.fogClear = 30;
    for (let i = 0; i < 30; i++) G.part({ x: U.rand(260, 1100), y: U.rand(150, 700), vx: U.rand(600, 900), vy: 0, kind: "wind", life: 0.8 });
  };
  G.freezeAll = function () {
    A.sfx("freeze");
    G.flash("190,230,255", 0.7);
    for (const z of G.zombies) if (!z.dead && !z.hypno && !z.submerged) { z.freezeT = U.rand(4, 6); z.slowT = 20; G.hurt(z, 20, "explode"); }
    if (G.boss) { if (!GS.Boss.counter(G.boss, "freeze")) G.boss.frozen = 4; }
  };
  G.burnRow = function (row) {
    A.sfx("fire");
    G.shakeIt(5);
    for (let x = G.geo.x0 - 20; x < W; x += 40) G.part({ x: x + U.rand(-10, 10), y: G.rowY(row) - 10, vx: 0, vy: -U.rand(60, 160), kind: "fire", life: U.rand(0.6, 1.1), r: U.rand(16, 30) });
    for (const z of G.zombies) if (z.row === row && !z.dead && !z.hypno && G.targetable(z, "explode")) { z.slowT = 0; z.freezeT = 0; G.hurt(z, 1800, "burn"); }
    G.ice[row] = Infinity;
    if (G.boss) { if (!GS.Boss.counter(G.boss, "burn", row)) GS.Boss.hurt(G.boss, G, 1800); }
  };
  G.blast = function (x, y, rx, span, dmg, kind = "explode") {
    const r0 = rowOfY(y), dr = Math.floor(span);
    for (const z of G.zombies) {
      if (z.dead || z.hypno || Math.abs(z.row - r0) > dr || Math.abs(z.x - x) > rx) continue;
      if (!G.targetable(z, "explode") && !(z.def.id === "bungee" && z.phase === "grab")) continue;
      G.hurt(z, dmg, kind);
    }
    if (G.boss && x + rx >= 1000 && kind !== "squash") GS.Boss.hurt(G.boss, G, dmg);
    if (kind === "explode") A.sfx("boom");
  };
  G.fume = function (row, x0, x1, dmg) {
    for (const z of G.zombies) if (z.row === row && !z.hypno && z.x >= x0 - 20 && z.x <= x1 && G.targetable(z, "fume")) G.hurt(z, dmg, "fume");
    if (G.boss && x1 >= 1000) GS.Boss.hurt(G.boss, G, dmg);
  };
  G.inGloom = (p, z) => hostile(z) && Math.abs(z.row - p.row) <= 1 && Math.abs(z.x - p.x) <= 160 && G.targetable(z, "fume");
  G.magnetPull = function (p) {
    const cw = G.geo.cw;
    let best = null, bd = 99;
    for (const z of G.zombies) {
      if (!hostile(z) || z.x > ON_SCREEN) continue;
      const dist = Math.hypot((z.x - p.x) / cw, z.row - p.row);
      if (dist > 2.6 || dist >= bd) continue;
      if ((z.armor && METAL.has(z.armor.kind)) || (z.shield && METAL.has(z.shield.kind)) || z.pogo || z.box || z.pick) { best = z; bd = dist; }
    }
    if (best) {
      const z = best;
      if (z.armor && METAL.has(z.armor.kind)) { const k = z.armor.kind; z.armor = null; return k === "minerhat" ? "helmet" : k; }
      if (z.shield && METAL.has(z.shield.kind)) { const k = z.shield.kind; z.shield = null; z.speed = Math.min(z.speed, Z[z.id].speed * z.mul); return k; }
      if (z.pogo) { z.pogo = false; z.hop = 0; return "pogo"; }
      if (z.box) { z.box = false; return "jack"; }
      if (z.pick) { z.pick = false; return "pick"; }
    }
    // ladders on plants
    for (const q of G.plants) if (!q.dead && q.ladder && Math.hypot((q.x - p.x) / cw, q.row - p.row) <= 2.6) { q.ladder = false; return "ladder"; }
    return null;
  };
  G.magnetCoin = function () {
    const it = G.items.find((i) => i.type === "coin" && !i.collect);
    if (it) collectItem(it);
  };
  G.summonDancers = function (z) {
    z.backups = z.backups || [];
    z.backups = z.backups.filter((b) => !b.dead);
    const spots = [[z.row - 1, z.x], [z.row + 1, z.x], [z.row, z.x - 100], [z.row, z.x + 100]];
    let any = false;
    for (const [r, x] of spots) {
      if (!G.rowOk(r) || G.isWater(r)) continue;
      if (z.backups.some((b) => b.row === r && Math.abs(b.x - x) < 60)) continue;
      const b = G.spawnZombie("backup", r, x, { wave: z.wave, rise: true });
      if (z.hypno) { b.hypno = true; b.hypnoSet = true; b.dir = 1; }
      z.backups.push(b); any = true;
      G.puff(x, G.rowY(r), "#6a4a2a", 8);
    }
    return any;
  };
  G.jackBoom = function (z) {
    const c0 = Math.floor((z.x - G.geo.x0) / G.geo.cw);
    for (let r = z.row - 1; r <= z.row + 1; r++) for (let c = c0 - 1; c <= c0 + 1; c++) if (G.rowOk(r) && c >= 0 && c <= 8) G.crushCell(r, c);
    G.boomFx(z.x, z.y - 40, 1.4, "255,120,40");
    A.sfx("boom"); G.shakeIt(10);
    z.dead = true; z.gone = true;
  };
  G.throwImp = function (z) {
    z.thrown = true;
    const tx = Math.max(G.geo.x0 + 60, Math.min(z.x - 300, G.geo.x0 + G.geo.cw * U.rand(0.8, 3)));
    const imp = G.spawnZombie("imp", z.row, tx, { wave: z.wave, air: { from: z.x, T: 1 } });
    if (z.hypno) { imp.hypno = true; imp.hypnoSet = true; imp.dir = 1; }
    A.sfx("lob");
  };
  G.splitSled = function (z) {
    z.dead = true; z.gone = true;
    for (let i = 0; i < 4; i++) G.spawnZombie("sledder", z.row, z.x - 36 + i * 26, { wave: z.wave });
    G.puff(z.x, z.y - 10, "#ddd", 10);
  };
  G.basketball = function (z) {
    let target = null;
    for (const p of G.plants) if (!p.dead && p.row === z.row && p.x < z.x && (!target || p.x < target.x) && p.layer !== "extra") target = p;
    if (!target) return false;
    target = G.topPlant(target.row, target.col) || target;
    if (G.umbrellaCovers(target.row, target.col)) { G.umbrellaBlock(target.row, target.col); A.sfx("bonk"); return true; }
    G.shots.push({ kind: "ball", lob: true, x0: z.x - 60, y0: z.y - 90, x: z.x - 60, y: z.y - 90, t: 0, T: 1.2, target, tp: true, dmg: 75 });
    return true;
  };
  G.bungeeTarget = function (z) {
    if (z.deliver) {
      for (let k = 0; k < 30; k++) { const r = U.randi(0, G.geo.rows - 1), c = U.randi(3, 7); if (G.rowOk(r) && !G.isWater(r)) return { row: r, col: c }; }
      return { row: G.active.indexOf(true), col: 5 };
    }
    const ps = G.plants.filter((p) => !p.dead && p.layer !== "extra");
    if (ps.length) { const p = U.pick(ps); return { row: p.row, col: p.col }; }
    for (let k = 0; k < 30; k++) { const r = U.randi(0, G.geo.rows - 1); if (G.rowOk(r)) return { row: r, col: U.randi(0, 8) }; }
    return { row: 0, col: 4 };
  };

  /* ================= shots ================= */
  const DMG = { pea: 20, snow: 20, fire: 40, spore: 20, needle: 20, star: 20, homing: 20, zpea: 20 };
  G.shoot = function (kind, x, y, row, o = {}) {
    const dir = o.dir || 1;
    const b = { kind, x, y, row, vx: o.vx ?? 330 * dir, vy: o.vy || 0, dmg: DMG[kind] || 20, dist: 0, life: o.life || 3000, target: o.target, startCol: Math.floor((x - G.geo.x0) / G.geo.cw) };
    if (o.fromY !== undefined) { b.ty = G.rowY(row) - 56 * G.geo.scale; }
    if (kind === "star") b.free = true;
    if (kind === "homing") { b.free = true; b.vx = 0; b.vy = -380; }
    G.shots.push(b);
    if (kind === "snow") A.sfx("snow"); else if (kind !== "zpea") A.sfx("shoot");
    return b;
  };
  const LOB_DMG = { cabbage: 40, kernel: 20, butter: 40, melon: 80, wmelon: 80 };
  G.lob = function (kind, p, z) {
    const x0 = p.x - 24 * G.geo.scale, y0 = p.y - 70 * G.geo.scale;
    const T = 0.55 + Math.abs((z.x || 1060) - x0) / 900;
    G.shots.push({ kind, lob: true, x0, y0, x: x0, y: y0, t: 0, T, target: z, row: p.row, dmg: LOB_DMG[kind] || 40, tx: z.x, ty: z.boss ? 300 : z.y - 60 * G.geo.scale });
  };
  function updateShot(b, dt) {
    if (b.lob) return updateLob(b, dt);
    if (b.kind === "roll") return updateRoll(b, dt);
    if (b.kind === "cob") return updateCob(b, dt);
    if (b.free) {
      if (b.kind === "homing") {
        let z = b.target;
        if (!z || (z.dead && !z.boss) || (z.boss && (!G.boss || G.boss.dead))) z = b.target = G.anyTarget(true);
        if (z) {
          const tx = z.x, ty = z.boss ? 400 : z.y - 60 * z.scale - (z.lift || 0) - (z.flying ? 150 * z.scale : 0);
          const a = Math.atan2(ty - b.y, tx - b.x), cur = Math.atan2(b.vy, b.vx);
          let da = a - cur; while (da > Math.PI) da -= U.TAU; while (da < -Math.PI) da += U.TAU;
          const na = cur + U.clamp(da, -6 * dt, 6 * dt);
          b.vx = Math.cos(na) * 400; b.vy = Math.sin(na) * 400;
          if (Math.hypot(tx - b.x, ty - b.y) < 30) {
            if (z.boss) GS.Boss.hurt(G.boss, G, b.dmg); else G.hurt(z, b.dmg, "homing");
            return false;
          }
        }
      }
      b.x += b.vx * dt; b.y += b.vy * dt; b.dist += 400 * dt;
      if (b.kind === "star") {
        for (const z of G.zombies) {
          if (!hostile(z) || !G.targetable(z, "straight")) continue;
          if (Math.abs(z.x - b.x) < 26 && Math.abs(z.y - 60 * z.scale - b.y) < 55 * z.scale) { G.hurt(z, b.dmg, "straight", { fromX: b.x - b.vx }); return false; }
        }
        if (G.boss && !G.boss.dead && b.x > 1010) { GS.Boss.hurt(G.boss, G, b.dmg); return false; }
      }
      return b.x > -40 && b.x < W + 40 && b.y > -40 && b.y < H + 40 && b.dist < 2500;
    }
    // straight shots, bound to a row
    b.x += b.vx * dt; b.dist += Math.abs(b.vx) * dt;
    if (b.ty !== undefined) b.y += (b.ty - b.y) * Math.min(1, dt * 7);
    if (b.kind === "zpea") {
      for (const p of G.plants) {
        if (p.dead || p.row !== b.row || p.def.spiky || Math.abs(p.x - b.x) > 30) continue;
        const t = G.topPlant(p.row, p.col) || p;
        t.hp -= b.dmg; A.sfx("splat");
        if (t.hp <= 0) G.removePlant(t);
        return false;
      }
      return b.x > -20;
    }
    if (b.dist > b.life) return false;
    if ((b.kind === "pea" || b.kind === "snow") && b.vx > 0) {
      for (const p of G.plants) if (!p.dead && p.def.torch && p.row === b.row && Math.abs(p.x - b.x) < 16 && b.torched !== p) {
        b.torched = p;
        if (b.kind === "snow") b.kind = "pea"; else { b.kind = "fire"; b.dmg = 40; }
      }
    }
    if (G.geo.roof && b.vx > 0 && b.startCol <= 3 && b.x > G.geo.x0 + 5 * G.geo.cw) { G.puff(b.x, b.y, "#a8583a", 4); return false; }
    const kind = b.kind === "needle" ? "spike" : "straight";
    let hit = null;
    for (const z of G.zombies) {
      if (z.row !== b.row || !hostile(z) || !G.targetable(z, kind)) continue;
      const dz = z.x - b.x;
      if ((b.vx > 0 && dz > -20 && dz < 18) || (b.vx < 0 && dz < 20 && dz > -18)) { if (!hit || (b.vx > 0 ? z.x < hit.x : z.x > hit.x)) hit = z; }
    }
    if (hit) {
      G.hurt(hit, b.dmg, kind === "spike" && hit.flying ? "spike" : "straight", { fromX: b.x - b.vx * 0.05 });
      if (b.kind === "snow" && !hit.dead) hit.slowT = 10;
      if (b.kind === "fire") {
        hit.slowT = 0;
        for (const z of G.zombies) if (z !== hit && z.row === b.row && hostile(z) && Math.abs(z.x - hit.x) < 70 && G.targetable(z, "straight")) G.hurt(z, 13, "lob");
        G.part({ x: b.x, y: b.y, vx: 0, vy: 0, kind: "burst", col: "#ff9a1a", life: 0.3 });
      } else G.part({ x: b.x, y: b.y, vx: 0, vy: 0, kind: "burst", col: b.kind === "snow" ? "#bfefff" : b.kind === "needle" ? "#e8f0c0" : b.kind === "spore" ? "#d8a0ff" : "#9fe060", life: 0.25 });
      return false;
    }
    if (G.boss && !G.boss.dead && b.vx > 0 && b.x > 1010) { GS.Boss.hurt(G.boss, G, b.dmg); return false; }
    return b.x < W + 30 && b.x > -30;
  }
  function updateLob(b, dt) {
    b.t += dt;
    const k = Math.min(1, b.t / b.T);
    const z = b.target;
    if (z && !b.tp && !z.boss && !z.dead) { b.tx = z.x; b.ty = z.y - 50 * z.scale; }
    if (b.tp && z && !z.dead) { b.tx = z.x; b.ty = z.y - 30; }
    b.x = U.lerp(b.x0, b.tx, k);
    b.y = U.lerp(b.y0, b.ty, k) - Math.sin(k * Math.PI) * (b.kind === "cob" ? 600 : 160);
    if (k < 1) return true;
    // impact
    if (b.kind === "ball") {
      if (z && !z.dead) { z.hp -= b.dmg; A.sfx("bonk"); if (z.hp <= 0) G.removePlant(z); }
      return false;
    }
    if (z && z.boss) { if (G.boss) GS.Boss.hurt(G.boss, G, b.dmg); splat(b); return false; }
    let hitZ = null;
    if (z && !z.dead && G.targetable(z, "lob") && Math.abs(z.x - b.x) < 70) hitZ = z;
    else hitZ = G.firstInRange(b.row, b.x - 50, b.x + 50, "lob");
    if (hitZ) {
      G.hurt(hitZ, b.dmg, "lob");
      if (b.kind === "butter" && !hitZ.dead && !hitZ.def.vehicle) hitZ.butterT = 4;
      if (b.kind === "wmelon" && !hitZ.dead) hitZ.slowT = 10;
      if (b.kind === "melon" || b.kind === "wmelon") {
        for (const o of G.zombies) if (o !== hitZ && hostile(o) && Math.abs(o.row - hitZ.row) <= 1 && Math.abs(o.x - hitZ.x) < 110 && G.targetable(o, "lob")) { G.hurt(o, 26, "lob"); if (b.kind === "wmelon") o.slowT = 10; }
      }
    }
    splat(b);
    return false;
  }
  function splat(b) {
    const col = { cabbage: "#8fd85a", kernel: "#ffe680", butter: "#ffe680", melon: "#4fae38", wmelon: "#9ad8ff" }[b.kind] || "#fff";
    G.puff(b.x, b.y, col, b.kind === "melon" || b.kind === "wmelon" ? 10 : 5);
  }
  // corn cannon shot
  G.fireCob = function (p, x, y) {
    p.ready = false; p.t = 35;
    A.sfx("cannon");
    G.shots.push({ kind: "cob", x: p.x + 40, y: p.y - 60, t: 0, tx: x, ty: y });
  };
  function updateCob(b, dt) {
    b.t += dt;
    if (b.t < 0.8) { b.y -= 900 * dt; return true; }
    if (b.t < 1.6) { b.x = b.tx; b.y = U.lerp(-60, b.ty - 40, (b.t - 0.8) / 0.8); return true; }
    G.blast(b.tx, b.ty, 150, 1, 1800);
    G.boomFx(b.tx, b.ty - 40, 1.3, "255,200,60");
    G.shakeIt(10);
    return false;
  }
  // bowling nuts
  function updateRoll(b, dt) {
    b.x += 230 * dt;
    b.rot += dt * 7;
    if (b.toRow !== undefined) {
      const ty = G.rowY(b.toRow);
      b.y += Math.sign(ty - b.y) * 230 * dt;
      if (Math.abs(ty - b.y) < 6) { b.y = ty; b.row = b.toRow; b.toRow = undefined; }
      if (b.y < G.rowY(0) - 1 || b.y > G.rowY(G.geo.rows - 1) + 1) { b.y = U.clamp(b.y, G.rowY(0), G.rowY(G.geo.rows - 1)); }
    }
    const r = b.toRow !== undefined ? rowOfY(b.y + 20) : b.row;
    for (const z of G.zombies) {
      if (z.row !== r || !hostile(z) || !G.targetable(z, "ground") || Math.abs(z.x - b.x) > (b.nut === "gnut" ? 60 : 38)) continue;
      if (b.hitSet && b.hitSet.has(z)) continue;
      if (b.nut === "bnut") { G.blast(b.x, G.rowY(r), 150, 1, 1800); G.boomFx(b.x, G.rowY(r) - 30, 1.1, "255,90,40"); return false; }
      if (b.nut === "gnut") { (b.hitSet = b.hitSet || new Set()).add(z); G.hurt(z, 1800, "roll"); A.sfx("bowl"); continue; }
      G.hurt(z, 460, "roll");
      A.sfx("bowl");
      b.hits = (b.hits || 0) + 1;
      if (b.hits >= 2) { G.floatText(b.hits + " COMBO", b.x, b.y - 80, "#ffe070"); G.addCoin(b.x, b.y - 60, b.hits >= 4 ? "gold" : "silver"); }
      // bounce into a neighbouring lane
      const rows = [r - 1, r + 1].filter((q) => G.rowOk(q));
      b.toRow = rows.length === 2 ? (b.lastDir ? (b.lastDir > 0 ? r + 1 : r - 1) : U.pick(rows)) : rows[0];
      if (b.toRow === undefined) b.toRow = r;
      b.lastDir = b.toRow - r;
      if (rows.length === 1) b.lastDir = rows[0] - r;
      b.row = r;
      b.hitSet = new Set([z]);
      break;
    }
    return b.x < W + 60;
  }

  /* ================= sun, coins, packets ================= */
  G.addSun = function (x, y, value, o = {}) {
    const it = { type: "sun", x, y, value, t: 0, life: 9 };
    if (o.sky) { it.vy = 60; it.gy = o.gy; }
    else { it.vx = U.rand(-40, 40); it.vy = -160; it.gy = y + U.rand(30, 60); }
    G.items.push(it);
    if (GS.Main && GS.Main.autoCollect) setTimeout(() => collectItem(it), 700);
    return it;
  };
  G.addCoin = function (x, y, kind) {
    const it = { type: "coin", kind, x, y, vx: U.rand(-60, 60), vy: -220, gy: Math.min(H - 20, y + U.rand(40, 80)), t: 0, life: 12, value: kind === "diamond" ? 1000 : kind === "gold" ? 50 : 10 };
    G.items.push(it);
    if (GS.Main && GS.Main.autoCollect) setTimeout(() => collectItem(it), 900);
  };
  G.addPacketItem = function (id, x, y, o = {}) {
    G.items.push({ type: "packet", id, x, y, vx: 0, vy: o.fall ? 70 : -120, gy: o.gy || y + 20, t: 0, life: o.life || 14, fall: o.fall });
  };
  function collectItem(it) {
    if (it.collect || it.gone) return;
    it.collect = true; it.t = 0; it.cx = it.x; it.cy = it.y;
    if (it.type === "sun") A.sfx("sun");
    else if (it.type === "coin") A.sfx(it.kind === "diamond" ? "diamond" : "coin");
  }
  function updateItem(it, dt) {
    it.t += dt;
    if (it.collect) {
      const tx = it.type === "sun" ? 48 : 70, ty = it.type === "sun" ? 36 : H - 30;
      const k = Math.min(1, it.t / 0.5);
      it.x = U.lerp(it.cx, tx, U.ease(k)); it.y = U.lerp(it.cy, ty, U.ease(k));
      if (k >= 1) {
        if (it.type === "sun") { G.sun = Math.min(9990, G.sun + it.value); if (G.spec.slots && G.sun >= G.spec.sunGoal) G.dropAward(W / 2, H / 2); }
        else { GS.Save.addCoins(it.value); GS.Save.save(); G.coinsGot += it.value; G.coinShow = 4; }
        return false;
      }
      return true;
    }
    if (it.type === "award") { it.bob = Math.sin(it.t * 3) * 6; return true; }
    if (it.vy !== undefined && it.y < it.gy) {
      if (it.type === "sun" && it.vx === undefined) it.y = Math.min(it.gy, it.y + it.vy * dt);
      else { it.vy += 500 * dt; it.x += (it.vx || 0) * dt; it.y = Math.min(it.gy, it.y + it.vy * dt); if (it.fall) it.vy = 70; }
    } else {
      it.life -= dt;
      if (it.life <= 0) return false;
    }
    return true;
  }
  G.dropAward = function (x, y) {
    if (G.award) return;
    const a = G.spec.award || "money";
    G.award = { type: "award", kind: a, x: U.clamp(x, 300, 1100), y: U.clamp(y - 40, 200, 600), t: 0, life: 9999 };
    G.items.push(G.award);
    G.state = "awardDrop";
  };
  function collectAward() {
    if (G.result) return;
    G.result = "won";
    A.sfx("award");
    A.jingle("clear");
  }
  G.bossDefeated = function () { G.dropAward(900, 400); };

  /* ================= effects ================= */
  G.part = (p) => { p.max = p.life; G.parts.push(p); };
  G.puff = function (x, y, col, n = 6) {
    for (let i = 0; i < n; i++) G.part({ x, y, vx: U.rand(-90, 90), vy: U.rand(-140, 20), r: U.rand(4, 9), col, kind: "dot", life: U.rand(0.3, 0.7), grav: 300 });
  };
  G.dirt = (x, y, col) => G.puff(x, y - 4, col || "#7a5230", 5);
  G.boomFx = function (x, y, size, rgb, big) {
    G.part({ x, y, kind: "ring", r: 30 * size, rgb, life: 0.5 });
    for (let i = 0; i < 18 * size; i++) G.part({ x, y, vx: U.rand(-300, 300) * size, vy: U.rand(-300, 200) * size, r: U.rand(8, 22) * size, col: `rgb(${rgb})`, kind: "dot", life: U.rand(0.3, 0.8), grav: 100 });
    if (big) G.part({ x, y: y - 40, kind: "cloud", r: 120, life: 1.6 });
    G.shakeIt(6 * size);
  };
  G.floatText = (s, x, y, col = "#fff") => G.texts.push({ s, x, y, col, t: 0 });
  G.shakeIt = (v) => { G.shake = Math.max(G.shake, v); };
  G.flash = (rgb, a) => { G.flashRGB = rgb; G.flashA = a; };

  /* ================= special modes ================= */
  G.setupVases = function () {
    const v = G.spec.vase;
    const cells = [];
    for (let r = 0; r < G.geo.rows; r++) for (let c = v.cols[0]; c <= v.cols[1]; c++) cells.push([r, c]);
    U.shuffle(cells);
    const n = Math.min(cells.length, v.plantVases + v.zombieVases);
    for (let i = 0; i < n; i++) {
      const [r, c] = cells[i];
      const plant = i < v.plantVases;
      const content = plant ? U.pick(v.plants) : U.pick(v.zombies);
      const mark = plant ? (U.chance(0.35) ? "plant" : "plain") : U.chance(0.25) ? "zombie" : "plain";
      G.cells[r][c].vase = { kind: plant ? "plant" : "zombie", content, mark };
    }
  };
  function breakVase(r, c) {
    const cell = G.cells[r][c], v = cell.vase;
    if (!v) return;
    cell.vase = null;
    A.sfx("vase");
    G.puff(G.colX(c), G.rowY(r) - 40, v.mark === "plant" ? "#7fc7ff" : v.mark === "zombie" ? "#9a8fa8" : "#d9a464", 12);
    if (v.kind === "plant") G.addPacketItem(v.content, G.colX(c), G.rowY(r) - 40, { life: 9999 });
    else {
      let id = v.content;
      if (G.isWater(r) && !Z[id].water && !Z[id].swim) id = "floatie";
      if (!G.isWater(r) && Z[id].water) id = "walker";
      const z = G.spawnZombie(id, r, G.colX(c), { wave: 0 }); z.pause = 0.6;
    }
  }
  G.setupIZombie = function () {
    const iz = G.spec.izombie;
    for (let r = 0; r < G.geo.rows; r++) {
      for (let c = 0; c < iz.cols; c++) {
        let sum = 0; for (const [, w] of iz.plants) sum += w;
        let x = Math.random() * sum, id = iz.plants[0][0];
        for (const [pid, w] of iz.plants) { x -= w; if (x <= 0) { id = pid; break; } }
        const p = G.addPlant(id, r, c, { silent: true });
        if (p.def.id === "mine") { p.armed = true; p.t = 0; }
      }
    }
    G.brains = new Array(G.geo.rows).fill(true);
  };
  G.izPlantLost = function (p) {
    if (p.def.sun) { G.addSun(p.x, p.y - 40, 25, { pop: true }); G.addSun(p.x + 10, p.y - 50, 25, { pop: true }); }
  };
  const SLOT_SYMBOLS = ["pea", "sunbloom", "nut", "cherry", "frost", "snap", "sun", "diamond"];
  G.slotRect = { x: 540, y: 104, w: 200, h: 34 };
  function spinSlot() {
    const s = G.slot;
    if (s.spin > 0 || s.cool > 0) return;
    if (G.sun < 25) { A.sfx("deny"); return; }
    G.sun -= 25;
    s.spin = 1.6; s.res = null;
    A.sfx("tick");
  }
  function slotResult() {
    const s = G.slot;
    const r = [0, 1, 2].map(() => U.pick(SLOT_SYMBOLS));
    if (Math.random() < 0.35) r[1] = r[0];
    s.reels = r;
    const counts = {};
    r.forEach((x) => (counts[x] = (counts[x] || 0) + 1));
    for (const k in counts) {
      const n = counts[k];
      if (n < 2) continue;
      if (k === "sun") { for (let i = 0; i < (n === 3 ? 8 : 2); i++) G.addSun(U.rand(500, 780), 140, 25, { pop: true }); }
      else if (k === "diamond") G.addCoin(640, 150, n === 3 ? "diamond" : "gold");
      else for (let i = 0; i < (n === 3 ? 3 : 1); i++) G.addPacketItem(k, U.rand(450, 830), 170, { life: 20 });
      A.sfx("award");
    }
    s.cool = 0.4;
  }

  /* ================= waves ================= */
  function waveHp() {
    let s = 0;
    for (const z of G.zombies) if (z.wave === G.wave - 1 && !z.dead) s += z.hp + (z.armor ? z.armor.hp : 0) + (z.shield ? z.shield.hp : 0);
    return s;
  }
  function spawnRow(id) {
    const d = Z[id];
    const rows = [];
    for (let r = 0; r < G.geo.rows; r++) {
      if (!G.rowOk(r)) continue;
      const w = G.isWater(r);
      if (d.water && !w) continue;
      if (w && !d.water && !d.swim && !d.flying && id !== "balloon") continue;
      if (id === "bobsled" && G.ice[r] === Infinity) continue;
      rows.push(r);
    }
    if (!rows.length) return -1;
    // avoid sending everything into the same lane
    let best = rows[0], bw = -1;
    for (const r of rows) { const w = Math.random() / (1 + G.lastRows.filter((q) => q === r).length); if (w > bw) { bw = w; best = r; } }
    G.lastRows.push(best); if (G.lastRows.length > 6) G.lastRows.shift();
    return best;
  }
  function spawnWave() {
    const spec = G.spec;
    const w = GS.makeWave(spec, G.wave, G.totalWaves, G.round);
    const idx = G.wave + G.round * 100;
    let i = 0;
    for (let id of w.list) {
      if (id === "bobsled" && !G.ice.some((x) => x < Infinity)) id = "zamboni";
      if (id === "yeti" && Math.random() > 0.3) id = "walker";
      const r = spawnRow(id);
      if (r < 0) continue;
      const x = 1210 + U.rand(0, 50) + (id === "flag" ? 0 : i * 6);
      if (spec.whack) {
        const g = pickGrave();
        if (g) { G.spawnZombie(id, g.r, G.colX(g.c), { wave: idx, rise: true }); i++; continue; }
      }
      if (spec.bungeeDrop && id !== "flag" && U.chance(0.35)) { const b = G.spawnZombie("bungee", r, 600, { wave: idx }); b.deliver = id; i++; continue; }
      if (id === "bungee") { G.spawnZombie("bungee", r, 600, { wave: idx }); i++; continue; }
      G.spawnZombie(id, r, x, { wave: idx });
      i++;
    }
    // graves release zombies on big waves
    if (w.flag || spec.graveGrow) {
      for (let r = 0; r < G.geo.rows; r++) for (let c = 0; c < 9; c++) if (G.cells[r][c].grave && (w.flag || U.chance(0.4)) && !spec.whack) G.spawnZombie(U.pick(["walker", "cone", "bucket"]), r, G.colX(c), { wave: idx, rise: true });
    }
    if (spec.graveGrow) { G.addGrave(4, 8); if (U.chance(0.5)) G.addGrave(5, 8); }
    if (w.final && G.totalWaves > 3) { G.banner = { text: "FINAL WAVE", t: 0, big: true }; A.say("Final wave!", { force: true }); }
    A.sfx("groan");
    G.wave++;
    G.sinceWave = 0;
    G.waveHp0 = Math.max(1, waveHp());
    G.waveT = spec.survival ? U.rand(20, 24) : U.rand(25, 31);
    G.hugeShown = false;
    if (w.flag) G.flagsDone++;
  }
  function pickGrave() {
    const gs = [];
    for (let r = 0; r < G.geo.rows; r++) for (let c = 0; c < 9; c++) if (G.cells[r][c].grave) gs.push({ r, c });
    if (gs.length < 3 + Math.floor(G.wave / 4)) { const g = G.addGrave(3, 8); if (g) gs.push(g); }
    return gs.length ? U.pick(gs) : null;
  }
  function updateWaves(dt) {
    const spec = G.spec;
    if (G.roundBreak || G.result || G.award) return;
    if (G.wave < G.totalWaves) {
      G.waveT -= dt;
      G.sinceWave += dt;
      if (G.wave > 0 && G.waveT > 4 && G.sinceWave > 8 && waveHp() < G.waveHp0 * 0.45) G.waveT = Math.min(G.waveT, 3);
      const nextFlag = (G.wave + 1) % 10 === 0 || G.wave === G.totalWaves - 1;
      if (nextFlag && G.totalWaves > 3 && !G.hugeShown && G.waveT <= 5) {
        G.hugeShown = true;
        G.banner = { text: "A huge wave of zombies is approaching!", t: 0, big: true, red: true };
        A.sfx("huge"); A.say("A huge wave of zombies is approaching!", { force: true });
      }
      if (G.waveT <= 0) spawnWave();
    }
  }
  function remainingHostiles() {
    return G.zombies.some((z) => !z.dead && !z.hypno && !z.escaped);
  }
  function checkEnd() {
    if (G.result || G.lost) return;
    const spec = G.spec;
    if (G.award) return;
    if (spec.izombie) {
      if (G.brains.every((b) => !b)) G.dropAward(G.lastKill ? G.lastKill.x : 640, 400);
      else if (!G.zombies.some((z) => !z.dead) && G.seeds.every((s) => G.sun < IZ_COST[s.id]) && !G.items.some((i) => i.type === "sun")) G.lose("You ran out of sun!");
      return;
    }
    if (spec.vase) {
      const any = G.cells.some((row) => row.some((c) => c.vase));
      if (!any && !remainingHostiles()) {
        if (spec.endless) { G.streak = (G.streak || 0) + 1; G.banner = { text: `Streak: ${G.streak}`, t: 0 }; A.sfx("award"); G.items = G.items.filter((i) => i.type !== "packet"); G.tool = null; G.setupVases(); }
        else G.dropAward(G.lastKill ? G.lastKill.x : 700, G.lastKill ? G.lastKill.y : 400);
      }
      return;
    }
    if (spec.slots || spec.boss) return;
    if (G.wave >= G.totalWaves && G.totalWaves > 0 && !remainingHostiles()) {
      if (spec.rounds !== undefined && spec.roundWaves && (spec.rounds === 0 || G.round + 1 < spec.rounds)) {
        if (!G.roundBreak) { G.roundBreak = true; A.jingle("clear"); G.banner = { text: "Flag complete!", t: 0 }; }
        return;
      }
      const k = G.lastKill || { x: 800, y: 400 };
      G.dropAward(k.x, k.y);
    }
  }
  G.lose = function (why) {
    if (G.lost) return;
    G.lost = why || "brains";
    A.stopMusic();
  };

  /* ================= update ================= */
  G.update = function (dt) {
    if (!G.started) return;
    G.t += dt;
    if (G.intro > 0) {
      G.intro -= dt;
      const t = 2.4 - G.intro;
      G.banner = { text: t < 0.8 ? "Ready…" : t < 1.6 ? "Set…" : "PLANT!", t: 0, big: true, keep: true };
      if (G.intro <= 0) G.banner = null;
    }
    if (G.banner && !G.banner.keep) { G.banner.t += dt; if (G.banner.t > 3.5) G.banner = null; }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 30);
    if (G.flashA > 0) G.flashA = Math.max(0, G.flashA - dt * 1.5);
    if (G.coinShow > 0) G.coinShow -= dt;
    if (G.fogClear > 0) G.fogClear -= dt;
    if (G.hintT > 0) G.hintT -= dt;
    const spec = G.spec;
    if (G.lost) { for (const z of G.zombies) if (z.lostWalk) { z.x -= 30 * dt; z.walk += dt * 6; } return; }
    // sky sun
    if (spec.sky && !spec.izombie && !G.result) {
      G.skyT -= dt;
      if (G.skyT <= 0) { G.skyT = U.rand(8, 11); G.addSun(U.rand(G.geo.x0 + 20, G.geo.x1 - 40), -30, 25, { sky: true, gy: U.rand(G.geo.y0 + 60, H - 40) }); }
    }
    // seeds recharge
    for (const s of G.seeds) if (s.cd > 0) s.cd = Math.max(0, s.cd - dt);
    // conveyor
    if (G.belt) {
      const b = G.belt;
      b.t -= dt;
      if (b.t <= 0 && b.items.length < 9) {
        b.t = spec.special === "bowling" ? U.rand(2.2, 3.4) : U.rand(3.5, 6);
        let id = U.pick(b.list);
        const cnt = b.items.filter((i) => i.id === id).length;
        if (cnt >= 3) id = U.pick(b.list);
        b.items.push({ id, x: 770 });
      }
      b.items.forEach((it, i) => { const tx = BANK.px + i * (BANK.pw + BANK.gap); it.x = Math.max(tx, it.x - 60 * dt); });
    }
    // slot machine
    if (G.slot) {
      const s = G.slot;
      if (s.spin > 0) { s.spin -= dt; s.reels = s.reels.map(() => U.pick(SLOT_SYMBOLS)); if (Math.random() < dt * 12) A.sfx("tick"); if (s.spin <= 0) slotResult(); }
      if (s.cool > 0) s.cool -= dt;
    }
    // raining seeds
    if (spec.raining && !G.award) {
      G.rainT = (G.rainT ?? 3) - dt;
      if (G.rainT <= 0) { G.rainT = U.rand(4, 7); const pool = ["pea", "double", "frost", "nut", "squash", "lily", "lily", "kelp", "cherry", "pepper", "torch", "tall", "trio", "spike"]; G.addPacketItem(U.pick(pool), U.rand(G.geo.x0 + 40, G.geo.x1 - 40), -40, { fall: true, gy: U.rand(G.geo.y0 + 60, H - 60), life: 14 }); }
    }
    // storm
    if (spec.storm) { G.stormT -= dt; if (G.stormT <= 0) { G.stormT = U.rand(4, 8); G.storm = 1; A.sfx("zap"); } if (G.storm > 0) G.storm = Math.max(0, G.storm - dt * 0.6); }
    updateWaves(dt);
    // plants
    for (const p of G.plants) {
      if (p.dead) continue;
      p.age += dt;
      if (p.anim > 0 && !p.def.update) p.anim -= dt;
      if (p.asleep) continue;
      if (spec.izombie && p.def.sun) continue;
      if (p.def.update) { if (p.anim > 0 && p.def.id !== "fume" && p.def.id !== "gloom" && p.def.id !== "umbrella" && !p.def.lobber) p.anim -= dt; p.def.update(p, G, dt); }
      if (p.def.tick) p.def.tick(p, G, dt);
    }
    // zombies
    for (const z of G.zombies) stepZombie(z, dt);
    // boss
    if (G.boss) GS.Boss.update(G.boss, G, dt);
    // shots
    G.shots = G.shots.filter((b) => updateShot(b, dt));
    // mowers
    for (let r = 0; r < G.mowers.length; r++) {
      const m = G.mowers[r];
      if (m.state !== "run") continue;
      m.x += 520 * dt;
      for (const z of G.zombies) if (z.row === r && !z.dead && !z.hypno && !z.flying && !z.underground && Math.abs(z.x - m.x) < 50 && !(z.def.id === "bungee")) { z.mowed = true; G.killZombie(z, "mow"); z.dying = 0.6; }
      if (m.x > W + 80) m.state = "gone";
    }
    // items and effects
    G.items = G.items.filter((it) => updateItem(it, dt));
    for (const p of G.parts) { p.life -= dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; if (p.grav) p.vy += p.grav * dt; if (p.kind === "head" || p.kind === "arm" || p.kind === "item" || p.kind === "cone") p.vy += 600 * dt; }
    G.parts = G.parts.filter((p) => p.life > 0);
    if (G.parts.length > 700) G.parts.splice(0, G.parts.length - 700);
    for (const t of G.texts) t.t += dt;
    G.texts = G.texts.filter((t) => t.t < 1.4);
    // cleanup
    G.plants = G.plants.filter((p) => !p.dead);
    G.zombies = G.zombies.filter((z) => !(z.gone || z.escaped || (z.dead && z.dying <= 0)));
    for (let r = 0; r < G.geo.rows; r++) {
      if (G.ice[r] < Infinity) { G.iceT[r] -= dt; if (G.iceT[r] <= 0 && !G.zombies.some((z) => z.row === r && z.id === "zamboni" && !z.dead)) G.ice[r] = Infinity; }
      for (let c = 0; c < 9; c++) { const cell = G.cells[r][c]; if (cell.crater > 0) cell.crater -= dt; if (cell.graveRise > 0) cell.graveRise -= dt; }
    }
    checkEnd();
    if (G.award && G.award.collected && !G.result) collectAward();
  };

  /* ---------- zombie step ---------- */
  function stepZombie(z, dt) {
    z.age += dt;
    if (z.hitT > 0) z.hitT -= dt;
    if (z.dead) {
      if (z.dying > 0) z.dying -= dt;
      if (z.blown) { z.x += 600 * dt; z.lift = (z.lift || 60) + 200 * dt; }
      return;
    }
    if (z.hypno && !z.hypnoSet) { z.hypnoSet = true; z.dir = -(z.dir || -1); z.state = "walk"; z.eatTarget = null; z.submerged = false; }
    if (z.rise > 0) { z.rise -= dt; return; }
    if (z.airT > 0) {
      z.airT -= dt;
      const k = 1 - Math.max(0, z.airT) / z.airT0;
      z.x = U.lerp(z.airFrom, z.airTo, k); z.hop = Math.sin(k * Math.PI) * 220;
      if (z.airT <= 0) { z.airborne = false; z.hop = 0; }
      return;
    }
    if (z.freezeT > 0) { z.freezeT -= dt; z.moving = false; return; }
    if (z.butterT > 0) { z.butterT -= dt; z.moving = false; return; }
    if (z.pause > 0) { z.pause -= dt; z.moving = false; return; }
    let m = 1;
    if (z.slowT > 0) { z.slowT -= dt; m = 0.5; }
    z.moving = false;
    if (z.def.update && z.def.update(z, G, dt * m) === true) { checkHouse(z); return; }
    // garlic: change lane
    if (z.divert) {
      const d = z.divert;
      d.t += dt * m;
      const k = Math.min(1, d.t / 1.2);
      z.y = U.lerp(G.rowY(d.from), G.rowY(d.to), k);
      z.x += z.dir * z.speed * m * dt * 0.6;
      z.walk += dt * m * 5; z.moving = true;
      if (k >= 1) { z.row = d.to; z.divert = null; z.state = "walk"; }
      return;
    }
    if (z.garlicT > 0 && z.state === "eat") {
      z.garlicT -= dt;
      if (z.garlicT <= 0) {
        const opts = [z.row - 1, z.row + 1].filter((r) => G.rowOk(r) && G.isWater(r) === G.isWater(z.row));
        if (opts.length) { z.divert = { from: z.row, to: U.pick(opts), t: 0 }; z.state = "walk"; z.eatTarget = null; A.sfx("menuBack"); return; }
      }
    }
    if (z.climb) {
      const c = z.climb;
      c.t += dt * m;
      const k = Math.min(1, c.t / 0.9);
      z.x = U.lerp(c.x0, c.x1, k); z.hop = Math.sin(k * Math.PI) * 70;
      if (k >= 1) { z.climb = null; z.hop = 0; z.airborne = false; }
      return;
    }
    if (z.state === "eat") {
      const t = z.eatTarget;
      const valid = t && !t.dead && (t.def && t.def.boss ? false : true) && (t.row === z.row) && (t.layer ? true : !t.dead && (t.hypno !== z.hypno));
      if (!valid) { z.state = "walk"; z.eatTarget = null; }
      else {
        const dmg = 100 * m * (z.eatMul || 1) * dt;
        if (t.layer) {
          if (t.def.onBite && !t.bitten) { t.bitten = true; if (t.def.onBite(t, G, z)) { z.state = "walk"; z.eatTarget = null; return; } }
          if (t.def.id === "mine" && t.armed) return;
          t.hp -= dmg; t.chewed = 0.1;
          if (Math.random() < dt * 4) A.sfx("chomp");
          if (t.hp <= 0) { G.removePlant(t); A.sfx("gulp"); z.state = "walk"; z.eatTarget = null; }
        } else {
          G.hurt(t, dmg, "eat");
          if (Math.random() < dt * 4) A.sfx("chomp");
        }
        return;
      }
    }
    // walking: is there something to eat?
    const tgt = findTarget(z);
    if (tgt) {
      if (tgt.layer && tgt.ladder && !z.def.noClimb && !z.hypno && z.dir < 0 && !(z.id === "ladder" && z.shield)) { z.climb = { t: 0, x0: z.x, x1: z.x - 110 }; z.airborne = true; return; }
      if (tgt.layer && z.def.onPlant && z.def.onPlant(z, G, tgt)) return;
      if (!z.def.noEat || !tgt.layer) {
        if (z.def.noEat && !tgt.layer) { /* giants and vehicles ignore hypnotized zombies */ }
        else { z.state = "eat"; z.eatTarget = tgt; return; }
      }
    }
    z.x += z.dir * z.speed * m * dt;
    z.walk += dt * m * (z.speed / 18) * 4;
    z.moving = true;
    checkHouse(z);
  }
  function findTarget(z) {
    if (z.flying || z.underground || z.airborne || z.def.noEat && !z.def.onPlant) {
      if (!(z.def.noEat && z.def.onPlant)) return null;
    }
    const mouth = z.x + z.dir * 28 * Math.max(0.6, z.scale);
    // zombies fighting hypnotized zombies
    for (const o of G.zombies) {
      if (o === z || o.dead || o.row !== z.row || o.hypno === z.hypno || o.flying || o.underground || o.airborne) continue;
      if (z.dir < 0 ? o.x <= z.x && o.x >= mouth - 30 : o.x >= z.x && o.x <= mouth + 30) return o;
    }
    if (z.hypno) return null;
    const c = Math.floor((mouth - G.geo.x0) / G.geo.cw);
    if (c < 0 || c > 8) return null;
    const p = biteTarget(z.row, c);
    if (!p || p.def.id === "mine" && p.armed) return null;
    if (p.def.id === "kelp" || p.def.id === "squash" && p.state) return null;
    return p;
  }
  function checkHouse(z) {
    if (z.hypno) { if (z.x > W + 60) z.escaped = true; return; }
    if (z.dead || z.dir > 0) return;
    const g = G.geo;
    if (G.spec.izombie) {
      if (z.x < g.x0 - 30) {
        if (G.brains[z.row]) { G.brains[z.row] = false; A.sfx("gulp"); G.floatText("BRAINS!", g.x0 - 60, z.y - 80, "#f4a6b5"); z.lastX = z.x; G.lastKill = { x: 600, y: z.y }; }
        z.escaped = true;
      }
      return;
    }
    const m = G.mowers[z.row];
    if (m && m.state === "ready" && z.x < g.x0 - 10 && !z.flying && !z.underground && z.def.id !== "bungee") { m.state = "run"; A.sfx("mower"); }
    if (z.x < 150 && !z.flying && !z.underground) { z.lostWalk = true; G.lose("brains"); }
    if (z.flying && z.x < 120) { z.lostWalk = true; G.lose("brains"); }
  }

  /* ================= play input ================= */
  G.input = function (dt) {
    if (!G.started || G.lost || G.result) return;
    const m = I.mouse;
    // keyboard / D-pad: cell cursor
    let moved = false;
    const kc = G.kc, nb = bankCount();
    if (I.hit("up")) { if (kc.r === -1) {} else if (kc.r === 0) { kc.r = -1; kc.b = Math.min(kc.b, nb - 1); } else kc.r--; moved = true; }
    if (I.hit("down")) { if (kc.r === -1) kc.r = 0; else kc.r = Math.min(G.geo.rows - 1, kc.r + 1); moved = true; }
    if (I.hit("left")) { if (kc.r === -1) kc.b = Math.max(0, kc.b - 1); else kc.c = Math.max(0, kc.c - 1); moved = true; }
    if (I.hit("right")) { if (kc.r === -1) kc.b = Math.min(nb - 1, kc.b + 1); else kc.c = Math.min(8, kc.c + 1); moved = true; }
    if (moved) {
      A.sfx("menuMove");
      if (kc.r === -1) { const r = bankRect(kc.b); m.x = r.x + r.w / 2; m.y = r.y + r.h / 2; }
      else { m.x = G.colX(kc.c); m.y = G.geo.y0 + kc.r * G.geo.ch + G.geo.ch * 0.6; }
    } else if (m.moved) {
      const cell = G.cellAt(m.x, m.y);
      if (cell) { kc.r = cell.r; kc.c = cell.c; }
    }
    // number keys pick packets
    for (let i = 0; i < 10; i++) if (I.pressed.has("Digit" + ((i + 1) % 10)) || I.pressed.has("Numpad" + ((i + 1) % 10))) selectPacket(i);
    if (I.hit("shovel")) { G.tool = G.tool && G.tool.kind === "shovel" ? null : { kind: "shovel" }; A.sfx("shovel"); }
    if (I.hit("collect")) { for (const it of G.items) if (it.type === "sun" || it.type === "coin") collectItem(it); }
    if (I.hit("prev") || I.hit("next")) {
      const n = G.seeds.length || (G.belt ? G.belt.items.length : 0);
      if (n) {
        let i = G.tool && G.tool.kind === "seed" ? G.tool.idx : G.tool && G.tool.kind === "belt" ? G.tool.idx : -1;
        for (let k = 0; k < n; k++) { i = (i + (I.hit("next") ? 1 : -1) + n) % n; if (selectPacket(i, true)) break; }
      }
    }
    if (m.rclicked || (I.hit("back") && G.tool)) { if (G.tool) { G.tool = null; A.sfx("menuBack"); } return "consumed"; }
    if (m.clicked) click(m.x, m.y);
    return null;
  };
  function bankCount() { return (G.belt ? 9 : G.seeds.length) + (G.spec.izombie ? 0 : 1); }
  function bankRect(i) {
    const n = G.belt ? 9 : G.seeds.length;
    if (i >= n) return shovelRect();
    return packetRect(i);
  }
  function shovelRect() {
    const n = G.belt ? 10 : G.seeds.length;
    return { x: BANK.px + n * (BANK.pw + BANK.gap) + 8, y: BANK.y + 4, w: 80, h: BANK.ph };
  }
  G.shovelRect = shovelRect;
  function selectPacket(i, quiet) {
    if (G.belt) {
      const it = G.belt.items[i];
      if (!it) return false;
      G.tool = { kind: "belt", idx: i, id: it.id };
      if (!quiet) A.sfx("select");
      return true;
    }
    const s = G.seeds[i];
    if (!s) return false;
    if (G.tool && G.tool.kind === "seed" && G.tool.idx === i) { G.tool = null; return true; }
    const cost = s.zombie ? IZ_COST[s.id] : P[s.id].cost;
    if (s.cd > 0 || G.sun < cost) { if (!quiet) A.sfx("deny"); return false; }
    G.tool = { kind: "seed", idx: i, id: s.id, zombie: !!s.zombie };
    A.sfx("select");
    return true;
  }
  const inR = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  function click(x, y) {
    // award
    if (G.award && !G.award.collected && Math.hypot(x - G.award.x, y - G.award.y) < 60) { G.award.collected = true; return; }
    // sun and coins first
    for (let i = G.items.length - 1; i >= 0; i--) {
      const it = G.items[i];
      if ((it.type === "sun" || it.type === "coin") && !it.collect && Math.hypot(x - it.x, y - it.y) < (it.type === "sun" ? 42 : 30)) { collectItem(it); return; }
    }
    // slot lever
    if (G.slot && inR(x, y, G.slotRect)) { spinSlot(); return; }
    // packets on the lawn
    for (let i = G.items.length - 1; i >= 0; i--) {
      const it = G.items[i];
      if (it.type === "packet" && Math.abs(x - it.x) < 34 && Math.abs(y - it.y) < 44) { G.tool = { kind: "held", id: it.id, item: it }; A.sfx("select"); return; }
    }
    // the bank
    const nb = G.belt ? 9 : G.seeds.length;
    for (let i = 0; i < nb; i++) if (inR(x, y, packetRect(i))) { selectPacket(i); return; }
    if (!G.spec.izombie && inR(x, y, shovelRect())) { G.tool = G.tool && G.tool.kind === "shovel" ? null : { kind: "shovel" }; A.sfx("shovel"); return; }
    // board
    const cell = G.cellAt(x, y);
    const t = G.tool;
    if (t && t.kind === "cob") {
      if (y > G.geo.y0 - 20) { G.fireCob(t.p, x, y); G.tool = null; }
      return;
    }
    if (!cell) return;
    const { r, c } = cell;
    if (t && (t.kind === "seed" || t.kind === "belt" || t.kind === "held") && !t.zombie) {
      if (G.spec.special === "bowling") { if (c < G.spec.plantCols && G.rowOk(r)) { G.shots.push({ kind: "roll", nut: t.id, x: G.colX(c), y: G.rowY(r), row: r, rot: 0 }); A.sfx("bowl"); consumeTool(t); } else A.sfx("deny"); return; }
      const cols = G.spec.columns ? [...Array(G.geo.rows).keys()] : [r];
      let placed = false;
      for (const rr of cols) if (G.canPlace(t.id, rr, c)) { G.addPlant(t.id, rr, c); placed = true; }
      if (placed) consumeTool(t); else A.sfx("deny");
      return;
    }
    if (t && t.zombie) {
      if (c >= 9 - (G.spec.izombie.cols >= 5 ? 3 : 4) && G.rowOk(r)) {
        G.sun -= IZ_COST[t.id];
        G.spawnZombie(t.id, r, Math.max(G.colX(c), G.geo.x0 + 5.6 * G.geo.cw), { wave: 0 });
        A.sfx("groan");
        if (G.sun < IZ_COST[t.id]) G.tool = null;
      } else A.sfx("deny");
      return;
    }
    if (t && t.kind === "shovel") {
      const cellO = G.cells[r][c];
      const p = cellO.extra || cellO.shell || cellO.main || cellO.base;
      if (p) { p.shoveled = true; G.removePlant(p, true); A.sfx("shovel"); G.dirt(p.x, p.y); }
      G.tool = null;
      return;
    }
    // no tool: vases, corn cannon, mallet
    if (G.cells[r][c].vase) { breakVase(r, c); return; }
    const main = G.cells[r][c].main;
    if (main && main.def.id === "cob" && main.ready) { G.tool = { kind: "cob", p: main }; A.sfx("select"); return; }
    if (G.spec.whack) {
      let hit = null;
      for (const z of G.zombies) if (!z.dead && !z.hypno && Math.abs(z.x - x) < 45 && y > z.y - 140 * z.scale && y < z.y + 10 && (!hit || z.x < hit.x)) hit = z;
      G.malletT = 0.25; G.malletX = x; G.malletY = y;
      A.sfx("whack");
      if (hit) G.hurt(hit, 460, "explode");
    }
  }
  function consumeTool(t) {
    if (t.kind === "seed") {
      const s = G.seeds[t.idx];
      G.sun -= P[s.id].cost;
      s.cd = s.max = P[s.id].recharge;
    } else if (t.kind === "belt") G.belt.items.splice(t.idx, 1);
    else if (t.kind === "held") { t.item.gone = true; G.items = G.items.filter((i) => i !== t.item); }
    G.tool = null;
  }

  /* ================= drawing ================= */
  G.dummyPlant = (id) => ({ def: P[id], id, age: performance.now() / 1000, hp: P[id].hp, maxHp: P[id].hp, preview: true, anim: 0 });
  G.dummyZombie = function (id, age = 0) {
    const d = Z[id];
    const z = { def: d, id, age, walk: age * 4, state: "walk", hp: d.hp, bodyMax: d.hp, maxHp: d.hp, dir: -1, scale: 1, moving: true, mul: 1, speed: d.speed,
      armor: d.armor ? { kind: d.armor.kind, hp: d.armor.hp } : null, shield: d.shield ? { kind: d.shield.kind, hp: d.shield.hp } : null };
    if (d.init) d.init(z, G);
    if (id === "balloon") z.lift = 0;
    if (id === "miner") z.underground = false;
    return z;
  };
  G.drawPlantIcon = function (c, id, x, y, s, zombie) {
    c.save(); c.translate(x, y); c.scale(s, s);
    if (zombie) { const z = G.dummyZombie(id, performance.now() / 1000); z.moving = false; Z[id].draw(c, z); }
    else P[id].draw(c, G.dummyPlant(id));
    c.restore();
  };
  D.packet = function (c, id, x, y, o = {}) {
    const w = o.w || BANK.pw, h = o.h || BANK.ph;
    const enabled = o.enabled !== false;
    c.save();
    if (o.selected) { c.translate(0, -6); }
    D.packetFrame(c, x, y, w, h, enabled);
    c.save(); c.beginPath(); c.rect(x + 4, y + 4, w - 8, h - 26); c.clip();
    if (o.zombie) G.drawPlantIcon(c, id, x + w / 2, y + h - 16, 0.38, true);
    else G.drawPlantIcon(c, id, x + w / 2, y + h - 26, P[id].wide ? 0.28 : 0.42);
    c.restore();
    if (o.cost !== false) D.text(c, String(o.cost ?? P[id].cost), x + w / 2, y + h - 11, 15, enabled ? "#2a2a1a" : "#5a5a4a", "center", { outline: false, font: D.FONT2, weight: 900 });
    if (o.cd > 0) { c.fillStyle = "rgba(0,0,0,0.45)"; c.fillRect(x + 2, y + 2, w - 4, (h - 4) * o.cd); }
    if (!enabled && !(o.cd > 0)) { c.fillStyle = "rgba(0,0,0,0.25)"; c.fillRect(x + 2, y + 2, w - 4, h - 4); }
    if (o.selected) D.rr(c, x - 2, y - 2, w + 4, h + 4, 8, null, "#fff", 3);
    c.restore();
  };

  function drawZombie(c, z) {
    const g = G.geo;
    let alpha = 1;
    if (z.dead && z.dying !== undefined) alpha = U.clamp(z.dying / 0.4, 0, 1);
    if (z.gone) return;
    const water = G.isWater(z.row) && !z.airborne && !z.flying;
    c.save();
    c.translate(z.x, z.y);
    if (!water && !z.underground) D.shadow(c, 0, -2, 30 * z.scale / g.scale * g.scale, 0.22);
    if (G.spec.invisible && !z.dead) { c.restore(); return; }
    if (z.underground) {
      D.ellipse(c, 0, -4, 26, 8, "#6a4a2a", D.OUT, 2);
      c.restore(); return;
    }
    c.globalAlpha = alpha;
    let sink = 0;
    if (water) {
      sink = z.submerged ? 112 : z.dolphin ? 10 : 46;
      if (z.drowning) sink += (1 - z.dying) * 120;
      c.beginPath(); c.rect(-120, -400, 240, 400 - 6); c.clip();
    }
    if (z.rise > 0) { c.beginPath(); c.rect(-120, -400, 240, 396); c.clip(); sink = Math.max(sink, z.rise / 1.2 * 140); }
    c.translate(0, sink - (z.hop || 0) - (z.lift || 0));
    if (z.dead && !z.drowning && !z.blown && !z.ash) { const k = 1 - U.clamp(z.dying / 1.2, 0, 1); c.rotate(k * 1.35 * (z.dir < 0 ? 1 : -1)); }
    if (z.ash && z.dead) { c.globalAlpha = alpha * 0.9; D.ellipse(c, 0, -10, 26, 10, "#222", null, 0); for (let i = 0; i < 5; i++) D.circle(c, -14 + i * 7, -14 - (i % 2) * 8, 6, "#333", null, 0); c.restore(); return; }
    const s = z.scale;
    c.scale(s * (z.dir > 0 ? -1 : 1), s);
    z.def.draw(c, z);
    if (z.freezeT > 0) { c.globalAlpha = 0.4 * alpha; D.rr(c, -36, -150, 72, 150, 10, "#bfefff", "#fff", 2); }
    c.restore();
    if (water && !z.submerged && !z.drowning && (z.def.swim || z.id === "floatie")) {
      c.save(); c.translate(z.x, z.y); c.globalAlpha = alpha;
      D.ellipse(c, 0, -8, 34 * z.scale, 10 * z.scale, "#ffd23a", D.OUT, 2.5);
      c.restore();
    } else if (water && z.submerged) {
      c.save(); c.translate(z.x - 8, z.y - 10); D.line(c, 0, 0, 0, -26, "#f0a020", 5); c.restore();
    }
  }
  function drawPlant(c, p) {
    c.save();
    let ox = 0, oy = 0;
    if (p.def.drawOffset) [ox, oy] = p.def.drawOffset(p);
    const water = G.isWater(p.row);
    const lift = p.layer === "main" || p.layer === "shell" || p.layer === "extra" ? (G.cells[p.row][p.col].base ? (water ? 12 : 30) * G.geo.scale : 0) : 0;
    c.translate(p.x + ox, p.y + oy - lift + (water && p.layer === "base" ? 6 : 0));
    const s = G.geo.scale;
    c.scale(s, s);
    if (p.chewed > 0) { p.chewed -= 1 / 60; c.translate(U.rand(-1.5, 1.5), 0); }
    if (!water && p.layer !== "extra") D.shadow(c, 0, -2, 30, 0.18);
    p.def.draw(c, p);
    if (p.ladder) GS.drawItem(c, "ladder", 26, -50, 0.8);
    c.restore();
  }
  function drawShot(c, b) {
    const k = b.kind;
    if (k === "roll") {
      c.save(); c.translate(b.x, b.y - 36); c.rotate(b.rot);
      const s = b.nut === "gnut" ? 1.8 : 1;
      D.ellipse(c, 0, 0, 34 * s, 34 * s, b.nut === "bnut" ? "#d8463a" : "#c8913f", D.OUT, 3);
      D.eyes(c, 6 * s, -8 * s, 7 * s, 1);
      c.restore(); return;
    }
    if (k === "cob") { D.rr(c, b.x - 12, b.y - 26, 24, 52, 10, "#ffd84a", D.OUT, 3); return; }
    if (k === "pea" || k === "zpea") { D.circle(c, b.x, b.y, 9, "#7ad83a", D.OUT, 2.5); D.circle(c, b.x - 3, b.y - 3, 3, "rgba(255,255,255,0.5)", null, 0); return; }
    if (k === "snow") { D.circle(c, b.x, b.y, 9, "#9ae4ff", D.OUT, 2.5); D.circle(c, b.x - 3, b.y - 3, 3, "#fff", null, 0); return; }
    if (k === "fire") { D.circle(c, b.x - 8, b.y, 10, "rgba(255,120,20,0.5)", null, 0); D.circle(c, b.x, b.y, 11, "#ff8a1a", "#a83a00", 2.5); D.circle(c, b.x + 2, b.y - 2, 5, "#ffe060", null, 0); return; }
    if (k === "spore") { D.circle(c, b.x, b.y, 7, "#d8a0ff", "#7a3ab8", 2); return; }
    if (k === "needle" || k === "homing") { c.save(); c.translate(b.x, b.y); c.rotate(Math.atan2(b.vy || 0, b.vx || 1)); D.poly(c, [-12, -3, 12, 0, -12, 3], "#e8f0c0", D.OUT, 1.5); c.restore(); return; }
    if (k === "star") { c.save(); c.translate(b.x, b.y); c.rotate(G.t * 8); const pts = []; for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5, r = i % 2 ? 4 : 10; pts.push(Math.cos(a) * r, Math.sin(a) * r); } D.poly(c, pts, "#ffd23a", D.OUT, 1.5); c.restore(); return; }
    if (k === "cabbage") { D.circle(c, b.x, b.y, 12, "#8fd85a", D.OUT, 2.5); return; }
    if (k === "kernel") { D.rr(c, b.x - 7, b.y - 6, 14, 12, 3, "#ffe680", D.OUT, 2); return; }
    if (k === "butter") { D.rr(c, b.x - 12, b.y - 8, 24, 16, 3, "#ffe680", D.OUT, 2.5); return; }
    if (k === "melon") { D.ellipse(c, b.x, b.y, 16, 13, "#4fae38", D.OUT, 2.5); return; }
    if (k === "wmelon") { D.ellipse(c, b.x, b.y, 16, 13, "#9ad8ff", D.OUT, 2.5); return; }
    if (k === "ball") { D.circle(c, b.x, b.y, 11, "#f08a20", D.OUT, 2.5); return; }
  }
  function drawItem(c, it) {
    if (it.type === "sun") {
      const fade = !it.collect && it.life < 2 ? 0.4 + 0.6 * Math.abs(Math.sin(it.t * 8)) : 1;
      c.globalAlpha = fade; D.sun(c, it.x, it.y, it.value < 25 ? 18 : 26, G.t, it.value < 25); c.globalAlpha = 1;
    } else if (it.type === "coin") D.coin(c, it.x, it.y, it.kind, G.t);
    else if (it.type === "packet") {
      const fade = it.life < 3 ? 0.4 + 0.6 * Math.abs(Math.sin(it.t * 8)) : 1;
      c.globalAlpha = fade;
      D.packet(c, it.id, it.x - 31, it.y - 43, { cost: false });
      c.globalAlpha = 1;
    } else if (it.type === "award") {
      const y = it.y + (it.bob || 0);
      c.save(); c.translate(it.x, y);
      const gl = 0.5 + 0.5 * Math.sin(it.t * 4);
      D.circle(c, 0, 0, 70 + gl * 10, `rgba(255,250,200,${0.35 + gl * 0.2})`, null, 0);
      if (P[it.kind]) D.packet(c, it.kind, -40, -55, { w: 80, h: 110, cost: false });
      else if (it.kind === "money") { D.ellipse(c, 0, 10, 36, 32, "#c8a050", D.OUT, 3); D.rr(c, -12, -32, 24, 16, 6, "#a88030", D.OUT, 3); D.text(c, "$", 0, 12, 34, "#6a4a10", "center", { outline: false }); }
      else if (it.kind === "note") { D.rr(c, -34, -42, 68, 84, 4, "#fffbe8", D.OUT, 3); for (let i = 0; i < 5; i++) D.line(c, -24, -26 + i * 13, 24, -26 + i * 13, "#9ab", 2); }
      else if (it.kind === "trophy") { D.poly(c, [-30, -40, 30, -40, 20, 0, -20, 0], "#ffd23a", D.OUT, 3); D.rr(c, -6, 0, 12, 22, 2, "#e8b020", D.OUT, 2.5); D.rr(c, -24, 22, 48, 14, 4, "#a87a10", D.OUT, 3); }
      c.restore();
      if (it.t > 1) D.text(c, "Click to collect!", it.x, y + 86, 20, "#fff");
    }
  }
  function drawParts(c) {
    for (const p of G.parts) {
      const a = U.clamp(p.life / p.max, 0, 1);
      c.globalAlpha = a;
      if (p.kind === "dot") D.circle(c, p.x, p.y, p.r * (0.5 + a * 0.5), p.col, null, 0);
      else if (p.kind === "ring") { c.beginPath(); c.arc(p.x, p.y, p.r * (2.5 - a * 1.5), 0, U.TAU); c.lineWidth = 10 * a; c.strokeStyle = `rgba(${p.rgb},1)`; c.stroke(); }
      else if (p.kind === "fire") { D.circle(c, p.x, p.y, p.r * a, a > 0.5 ? "#ffd23a" : "#ff7020", null, 0); }
      else if (p.kind === "cloud") { for (let i = 0; i < 7; i++) D.circle(c, p.x + Math.cos(i) * 70 * (1.6 - a), p.y - (1 - a) * 160 + Math.sin(i * 2) * 30, 60 * (1.4 - a * 0.4), "rgba(80,50,90,0.6)", null, 0); }
      else if (p.kind === "burst") { for (let i = 0; i < 6; i++) { const ang = (i / 6) * U.TAU; D.circle(c, p.x + Math.cos(ang) * 10 * (1.4 - a), p.y + Math.sin(ang) * 10 * (1.4 - a), 4 * a, p.col, null, 0); } }
      else if (p.kind === "head") { c.save(); c.translate(p.x, Math.min(p.y, p.y0 || (p.y0 = p.y + 90))); D.ellipse(c, 0, 0, 18, 20, p.skin ? "#c9a2dc" : "#a9bb8e", D.OUT, 2.5); D.circle(c, -8, -2, 5, "#fff", D.OUT, 1.5); c.restore(); }
      else if (p.kind === "arm") { D.line(c, p.x, Math.min(p.y, p.y0 || (p.y0 = p.y + 70)), p.x - 16, Math.min(p.y, p.y0) + 8, "#a9bb8e", 7); }
      else if (p.kind === "item") GS.drawItem(c, p.item, p.x, Math.min(p.y, p.y0 || (p.y0 = p.y + 120)), 0.8);
      else if (p.kind === "cone") { c.save(); c.translate(p.x, Math.min(p.y, p.y0 || (p.y0 = p.y + 120))); D.poly(c, [-14, 0, 14, 0, 0, -40], "#f07a20", D.OUT, 2.5); c.restore(); }
      else if (p.kind === "wind") { D.line(c, p.x, p.y, p.x - 60, p.y, "rgba(255,255,255,0.6)", 3); }
    }
    c.globalAlpha = 1;
  }

  G.drawBoard = function (c, o = {}) {
    const g = G.geo, spec = G.spec;
    D.background(c, G.area, g.rows);
    // inactive rows are bare soil
    for (let r = 0; r < g.rows; r++) if (!G.active[r]) { c.fillStyle = G.night ? "#3a2e22" : "#9a7444"; c.fillRect(g.x0, g.y0 + r * g.ch, 9 * g.cw, g.ch); c.fillStyle = "rgba(0,0,0,0.1)"; for (let k = 0; k < 9; k++) c.fillRect(g.x0 + k * g.cw + 20, g.y0 + r * g.ch + 40, 60, 6); }
    // ice
    for (let r = 0; r < g.rows; r++) if (G.ice[r] < Infinity) { c.fillStyle = "rgba(220,245,255,0.75)"; c.fillRect(G.ice[r], g.y0 + r * g.ch + g.ch * 0.25, W - G.ice[r], g.ch * 0.6); }
    // bowling line / I, Zombie line
    if (spec.plantCols) { c.fillStyle = "#d83030"; c.fillRect(g.x0 + spec.plantCols * g.cw - 3, g.y0, 6, g.rows * g.ch); }
    if (spec.izombie) {
      const lc = 9 - (spec.izombie.cols >= 5 ? 3 : 4);
      c.fillStyle = "#d83030"; c.fillRect(g.x0 + lc * g.cw - 3, g.y0, 6, g.rows * g.ch);
      for (let r = 0; r < g.rows; r++) if (G.brains && G.brains[r]) D.brain(c, g.x0 - 50, G.rowY(r) - 30);
    }
    // craters, graves
    for (let r = 0; r < g.rows; r++) for (let col = 0; col < 9; col++) {
      const cell = G.cells[r][col];
      if (cell.crater > 0) D.crater(c, G.colX(col), G.rowY(r), Math.min(1, cell.crater / 10));
    }
    // per row: graves, vases, plants, zombies, mowers, straight shots
    for (let r = 0; r < g.rows; r++) {
      for (let col = 0; col < 9; col++) {
        const cell = G.cells[r][col];
        if (cell.grave) { c.save(); const k = cell.graveRise > 0 ? cell.graveRise : 0; c.beginPath(); c.rect(G.colX(col) - 50, G.rowY(r) - 120, 100, 124); c.clip(); c.translate(0, k * 80); D.grave(c, G.colX(col), G.rowY(r)); c.restore(); }
        if (cell.vase) D.vase(c, G.colX(col), G.rowY(r), cell.vase.mark);
      }
      const ps = G.plants.filter((p) => p.row === r && !p.dead);
      for (const layer of ["base", "main", "extra", "shell"]) for (const p of ps) if (p.layer === layer) drawPlant(c, p);
      const m = G.mowers[r];
      if (m && (m.state === "ready" || m.state === "run")) D.mower(c, m.x, G.rowY(r) + 4, m.kind);
      const zs = G.zombies.filter((z) => z.row === r && !z.flying && !z.divert).sort((a, b) => b.x - a.x);
      for (const z of zs) drawZombie(c, z);
      for (const b of G.shots) if (!b.lob && !b.free && b.row === r && b.kind !== "cob") drawShot(c, b);
    }
    for (const z of G.zombies) if (z.flying || z.divert) drawZombie(c, z);
    for (const b of G.shots) if (b.lob || b.free || b.kind === "cob") drawShot(c, b);
    if (G.boss) GS.Boss.draw(c, G.boss, G);
    // zombies waiting on the street while choosing seeds
    if (o.preview) for (const pz of G.preview) { c.save(); c.translate(pz.x, pz.y); c.scale(G.geo.scale * 0.95, G.geo.scale * 0.95); const z = G.dummyZombie(pz.id, G.t + pz.age); z.moving = false; Z[pz.id].draw(c, z); c.restore(); }
    D.fog(c, G, G.t);
    if (spec.storm) { c.fillStyle = `rgba(5,5,20,${0.9 * (1 - G.storm)})`; c.fillRect(164, g.y0 - 30, W, H); }
    for (const it of G.items) if (it.type !== "award") drawItem(c, it);
    drawParts(c);
    for (const t of G.texts) D.text(c, t.s, t.x, t.y - t.t * 40, 30, t.col);
  };

  G.drawHud = function (c) {
    const spec = G.spec, m = I.mouse;
    // top bar
    D.rr(c, 4, 2, (G.belt ? 10 : Math.max(G.seeds.length, 1)) * (BANK.pw + BANK.gap) + 196 + (spec.izombie ? -80 : 0), 100, 12, "#7a4a22", D.OUT, 3);
    // sun counter
    D.rr(c, BANK.x + 2, BANK.y + 4, 84, 86, 10, "#f2e6b7", "#5a4520", 2.5);
    D.sun(c, BANK.x + 44, BANK.y + 34, 22, G.t);
    D.rr(c, BANK.x + 8, BANK.y + 62, 72, 24, 6, "#fffbe8", "#5a4520", 2);
    D.text(c, String(G.sun), BANK.x + 44, BANK.y + 75, 20, "#2a2a1a", "center", { outline: false, font: D.FONT2, weight: 900 });
    if (G.belt) {
      c.fillStyle = "#3a3a3a"; c.fillRect(BANK.px - 4, BANK.y + 10, 10 * (BANK.pw + BANK.gap), BANK.ph - 12);
      c.fillStyle = "#555"; for (let x = BANK.px - 4 + ((G.t * 60) % 30); x < BANK.px + 9.5 * (BANK.pw + BANK.gap); x += 30) c.fillRect(x, BANK.y + 10, 4, BANK.ph - 12);
      G.belt.items.forEach((it, i) => D.packet(c, it.id, it.x, BANK.y + 4, { cost: false, selected: G.tool && G.tool.kind === "belt" && G.tool.idx === i }));
    } else {
      G.seeds.forEach((s, i) => {
        const r = packetRect(i);
        const cost = s.zombie ? IZ_COST[s.id] : P[s.id].cost;
        D.packet(c, s.id, r.x, r.y, { cost, zombie: s.zombie, enabled: G.sun >= cost && s.cd <= 0, cd: s.cd > 0 ? s.cd / s.max : 0, selected: G.tool && G.tool.kind === "seed" && G.tool.idx === i });
        if (i < 10 && !I.touch) D.text(c, String((i + 1) % 10), r.x + 10, r.y + 12, 13, "#fff", "center", { lw: 3 });
      });
    }
    if (!spec.izombie) {
      const r = shovelRect();
      D.rr(c, r.x, r.y, r.w, r.h, 10, G.tool && G.tool.kind === "shovel" ? "#8a6a3a" : "#b08a52", "#5a4520", 2.5);
      if (!(G.tool && G.tool.kind === "shovel")) D.shovel(c, r.x + r.w / 2, r.y + r.h / 2 + 4, 0.9);
    }
    // slot machine
    if (G.slot) {
      const s = G.slot, R = G.slotRect;
      D.rr(c, 400, 104, 480, 92, 14, "#c83030", D.OUT, 3);
      for (let i = 0; i < 3; i++) {
        D.rr(c, 420 + i * 92, 112, 84, 76, 8, "#fffbe8", D.OUT, 2.5);
        const sym = s.reels[i];
        if (sym === "sun") D.sun(c, 462 + i * 92, 150, 18, G.t);
        else if (sym === "diamond") D.coin(c, 462 + i * 92, 150, "diamond", G.t);
        else G.drawPlantIcon(c, sym, 462 + i * 92, 180, 0.42);
      }
      D.button(c, { x: 704, y: 126, w: 160, h: 50, label: s.spin > 0 ? "…" : "Spin (25)" }, inR(m.x, m.y, { x: 704, y: 126, w: 160, h: 50 }), { size: 22 });
      G.slotRect = { x: 704, y: 126, w: 160, h: 50 };
      D.text(c, `Goal: ${spec.sunGoal} sun`, 640, 210, 20, "#fff");
    }
    // menu button
    D.button(c, MENU_BTN, inR(m.x, m.y, MENU_BTN), { size: 24, color: "#8a5a2b" });
    // progress
    if (G.totalWaves > 0 && !G.spec.izombie) {
      const x = 1000, y = H - 34, w = 250, h = 18;
      D.rr(c, x, y, w, h, 9, "#3a2a10", D.OUT, 2.5);
      const prog = U.clamp((G.wave + (1 - Math.max(0, G.waveT) / 30) * (G.wave < G.totalWaves && G.wave > 0 ? 0.6 : 0)) / G.totalWaves, 0, 1);
      D.rr(c, x + w * (1 - prog), y + 3, w * prog - 3, h - 6, 6, "#7ad83a", null, 0);
      for (let i = 9; i < G.totalWaves; i += 10) { const fx = x + w * (1 - (i + 1) / G.totalWaves) + 4; D.line(c, fx, y - 14, fx, y + h, "#6a4a2a", 3); D.rr(c, fx, y - 14, 14, 10, 1, i < G.wave ? "#888" : "#c82828", null, 0); }
      D.circle(c, x + w * (1 - prog), y + h / 2, 10, "#a9bb8e", D.OUT, 2);
      D.text(c, spec.rounds !== undefined && spec.roundWaves ? `${spec.title} · ${spec.endless ? "Flags " + G.flagsDone : "Round " + (G.round + 1) + "/" + spec.rounds}` : spec.title, x - 10, y + h / 2, 18, "#fff", "right");
    } else D.text(c, spec.title + (G.streak ? ` · Streak ${G.streak}` : ""), 1250, H - 25, 18, "#fff", "right");
    if (G.boss) {
      const b = G.boss;
      D.rr(c, 900, H - 40, 350, 24, 10, "#3a1a1a", D.OUT, 3);
      D.rr(c, 904, H - 36, 342 * (b.hp / b.maxHp), 16, 7, "#e83030", null, 0);
      D.text(c, "Dr. Zed", 890, H - 28, 20, "#fff", "right");
    }
    // coins
    if (G.coinShow > 0 || G.items.some((i) => i.type === "coin")) {
      D.rr(c, 10, H - 50, 150, 40, 12, "#f2e6b7", D.OUT, 2.5);
      D.coin(c, 36, H - 30, "gold", 0);
      D.text(c, "$" + U.fmt(GS.Save.d.coins), 96, H - 29, 20, "#2a2a1a", "center", { outline: false, font: D.FONT2, weight: 900 });
    }
    // award on top of everything
    if (G.award) drawItem(c, G.award);
    // tool preview and cursor
    const t = G.tool;
    const cell = G.cellAt(m.x, m.y);
    if (t && (t.kind === "seed" || t.kind === "belt" || t.kind === "held") && !t.zombie) {
      if (cell && G.spec.special !== "bowling" && G.canPlace(t.id, cell.r, cell.c)) {
        c.save(); c.globalAlpha = 0.45;
        const base = G.cells[cell.r][cell.c].base && P[t.id].layer !== "base" ? (G.isWater(cell.r) ? 12 : 30) : 0;
        c.translate(G.colX(cell.c), G.rowY(cell.r) - base); c.scale(G.geo.scale, G.geo.scale); P[t.id].draw(c, G.dummyPlant(t.id)); c.restore();
      }
      c.save(); c.globalAlpha = 0.85; c.translate(m.x, m.y + 30); c.scale(0.7, 0.7); P[t.id].draw(c, G.dummyPlant(t.id)); c.restore();
    } else if (t && t.zombie) {
      c.save(); c.globalAlpha = 0.8; c.translate(m.x, m.y + 60); c.scale(0.6, 0.6); const z = G.dummyZombie(t.id, G.t); Z[t.id].draw(c, z); c.restore();
    } else if (t && t.kind === "shovel") D.shovel(c, m.x + 10, m.y - 10, 1);
    else if (t && t.kind === "cob") { c.save(); c.translate(m.x, m.y); c.beginPath(); c.arc(0, 0, 30, 0, U.TAU); c.moveTo(-44, 0); c.lineTo(44, 0); c.moveTo(0, -44); c.lineTo(0, 44); c.lineWidth = 3; c.strokeStyle = "#ff3030"; c.stroke(); c.restore(); }
    if (G.spec.whack && !t) {
      const k = G.malletT > 0 ? G.malletT / 0.25 : 0;
      if (G.malletT > 0) G.malletT -= 1 / 60;
      c.save(); c.translate(m.x + 30, m.y - 20); c.rotate(-0.4 + k * 0.9);
      D.rr(c, -5, -10, 10, 70, 4, "#a0632c", D.OUT, 2.5); D.rr(c, -26, -34, 52, 30, 8, "#c8432c", D.OUT, 3);
      c.restore();
    }
    // keyboard / gamepad cell highlight
    if (I.showCursor() && G.kc.r >= 0 && G.tool) { const g = G.geo; D.rr(c, g.x0 + G.kc.c * g.cw + 3, g.y0 + G.kc.r * g.ch + 3, g.cw - 6, g.ch - 6, 10, null, "rgba(255,255,255,0.8)", 3); }
    // banners
    if (G.banner) {
      const b = G.banner;
      const a = b.keep ? 1 : U.clamp(Math.min(b.t * 4, (3.5 - b.t) * 2), 0, 1);
      c.globalAlpha = a;
      D.text(c, b.text, W / 2, H / 2, b.big ? (b.text.length > 20 ? 46 : 84) : 54, b.red ? "#ff4a3a" : "#fff");
      c.globalAlpha = 1;
    }
    if (G.hintT > 0 && G.intro <= 0) {
      c.globalAlpha = Math.min(1, G.hintT);
      c.font = `800 20px ${D.FONT2}`;
      const w = Math.min(1100, c.measureText(spec.hint).width + 40);
      D.rr(c, W / 2 - w / 2, H - 120, w, 48, 12, "rgba(20,30,10,0.82)", "#fff", 2);
      D.text(c, spec.hint, W / 2, H - 95, 20, "#fff", "center", { outline: false, font: D.FONT2, weight: 800 });
      c.globalAlpha = 1;
    }
    if (G.roundBreak) {
      D.panel(c, W / 2 - 260, H / 2 - 110, 520, 220);
      D.text(c, spec.endless ? `${G.flagsDone} flags survived!` : `Round ${G.round + 1} of ${spec.rounds} done!`, W / 2, H / 2 - 50, 34, "#fff");
      G.continueBtn = { x: W / 2 - 150, y: H / 2 + 10, w: 300, h: 64, label: spec.laststand ? "Start onslaught" : "Continue" };
      D.button(c, G.continueBtn, inR(m.x, m.y, G.continueBtn));
    } else G.continueBtn = null;
    if (G.flashA > 0) { c.fillStyle = `rgba(${G.flashRGB},${G.flashA})`; c.fillRect(0, 0, W, H); }
  };
})(window.GS);
