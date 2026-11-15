/* Ironfall: worlds, stages and the segment-based level builder.
   Levels are generated from a fixed seed, so every stage always looks the same. */
"use strict";

(function (XA) {
  const { U, Theme } = XA;
  const T = Theme.T, TL = Theme.TL;
  const Levels = (XA.Levels = {});

  /* ---------- Worlds and stages ---------- */
  const WORLDS = [
    { key: "frontier", name: "Alien Frontier", music: "level1", indoor: false,
      pool: { ground: ["walker", "hopper", "roller", "crawler", "walker", "hopper"], air: ["wasp", "wasp", "wasp", "bomber"], fixed: ["turret", "spawner"], ceiling: ["dropper"], liquid: ["jumper"] },
      seg: { hills: 5, pit: 3, pool: 3, platforms: 3, climb: 2, drop: 1, cave: 2, tower: 2, spikes: 1 } },
    { key: "crystal", name: "Crystal Caverns", music: "level2", indoor: true,
      pool: { ground: ["crawler", "hopper", "worm", "crawler"], air: ["wasp", "orb", "orb"], fixed: ["turret", "spawner"], ceiling: ["dropper", "dropper"], liquid: ["jumper"] },
      seg: { hills: 3, pit: 2, pool: 2, platforms: 3, climb: 3, drop: 3, crack: 3, spikes: 2, tower: 1 } },
    { key: "hive", name: "Bio Hive", music: "level3", indoor: true,
      pool: { ground: ["hopper", "worm", "crawler", "hopper"], air: ["wasp", "wasp", "orb"], fixed: ["spawner", "spitter", "spawner"], ceiling: ["dropper", "dropper"], liquid: ["jumper"] },
      seg: { hills: 3, pit: 2, pool: 4, platforms: 3, climb: 2, drop: 3, crack: 2, spikes: 2 } },
    { key: "factory", name: "Steel Foundry", music: "level4", indoor: true,
      pool: { ground: ["walker", "soldier", "roller", "spider", "soldier"], air: ["bomber", "jetpack", "jetpack"], fixed: ["turret", "missiler", "turret"], ceiling: ["dropper"], liquid: ["jumper"] },
      seg: { hills: 2, pit: 3, pool: 3, platforms: 3, climb: 2, drop: 2, crush: 4, tower: 3, spikes: 2, mover: 3 } },
    { key: "core", name: "Machine Core", music: "level5", indoor: true,
      pool: { ground: ["soldier", "spider", "walker", "roller"], air: ["jetpack", "orb", "bomber", "wasp"], fixed: ["turret", "missiler", "spawner"], ceiling: ["dropper"], liquid: ["jumper"] },
      seg: { hills: 2, pit: 3, pool: 2, platforms: 3, climb: 3, drop: 2, crush: 3, tower: 2, spikes: 2, mover: 4, crack: 1 } },
  ];
  const STAGES = [
    { world: 0, name: "Landing Zone", sub: "The suit hits the ground. Find the way through the canyons.", seed: 1101, len: 360 },
    { world: 0, name: "Sunset Ridge", sub: "Something huge is waiting at the end of the ridge.", seed: 1202, len: 380, boss: "fist" },
    { world: 1, name: "Crystal Descent", sub: "Deep below the surface the rocks begin to glow.", seed: 2101, len: 380 },
    { world: 1, name: "Prism Depths", sub: "The webs get thicker. Watch the ceiling.", seed: 2202, len: 400, boss: "widow" },
    { world: 2, name: "Hive Gate", sub: "The walls are alive – and they are hungry.", seed: 3101, len: 400 },
    { world: 2, name: "Brood Chamber", sub: "The heart of the swarm beats somewhere ahead.", seed: 3202, len: 420, boss: "hivemind" },
    { world: 3, name: "Steel Foundry", sub: "Robots, presses and molten steel. Keep moving.", seed: 4101, len: 420 },
    { world: 3, name: "Assembly Line", sub: "The factory builds its biggest war machine.", seed: 4202, len: 440, boss: "titan" },
    { world: 4, name: "Core Access", sub: "The last defence line of the machine.", seed: 5101, len: 440 },
    { world: 4, name: "The Overmind", sub: "End it.", seed: 5202, len: 460, boss: "overmind" },
  ];
  Levels.WORLDS = WORLDS;
  Levels.STAGES = STAGES;

  const LH = 48;           // level height in tiles
  const G_MIN = 13, G_MAX = 44;

  /* ---------- Builder ---------- */
  function Builder(st) {
    const wd = WORLDS[st.world];
    const r = U.rng(st.seed);
    const w = st.len + 160;
    const b = {
      st, wd, r, w, h: LH,
      ground: new Int16Array(w).fill(LH),
      ceil: new Int16Array(w).fill(-1),
      ceilTop: new Int16Array(w).fill(0),
      liq: new Int16Array(w).fill(-1),
      over: [], carve: [], spawns: [], items: [], prizes: [], checkpoints: [], movers: [], crushers: [], noSpawn: new Uint8Array(w),
      x: 0, g: 34, roof: wd.indoor ? 10 : 0,
    };
    b.ri = (a, c) => a + Math.floor(r() * (c - a + 1));
    b.pick = (arr) => arr[Math.floor(r() * arr.length)];
    b.chance = (p) => r() < p;
    return b;
  }
  function setCol(b, x, g) {
    if (x < 0 || x >= b.w) return;
    b.ground[x] = g;
    if (b.wd.indoor) b.ceil[x] = Math.max(-1, Math.min(g, LH) - b.roof - 1);
  }
  function put(b, x, y, id) { if (x >= 0 && x < b.w && y >= 0 && y < LH) b.over.push([x, y, id]); }
  function item(b, type, x, y) { b.items.push({ type, x: x * T + T / 2, y: y * T + T / 2 }); }
  function diamondsArc(b, x0, x1, y, h) {
    const n = x1 - x0;
    for (let i = 0; i <= n; i++) {
      const f = n ? i / n : 0.5;
      b.items.push({ type: "diamond", x: (x0 + i) * T + T / 2, y: (y - Math.sin(f * Math.PI) * h) * T + T / 2 });
    }
  }
  function prizeRow(b, x, y, n) {
    for (let i = 0; i < n; i++) b.prizes.push({ x: x + i, off: b.g - y, item: prizeItem(b) });
  }
  function prizeItem(b) {
    const roll = b.r();
    if (roll < 0.34) return b.pick(["w_spread", "w_laser", "w_bounce", "w_flame", "w_homing"]);
    if (roll < 0.52) return "power";
    if (roll < 0.62) return "health";
    if (roll < 0.72) return "diamonds";
    if (roll < 0.8) return "line";
    if (roll < 0.87) return "gyro";
    if (roll < 0.93) return "shield";
    if (roll < 0.97) return "time";
    return "life";
  }

  /* ---------- Segments ---------- */
  const SEG = {
    flat(b, n) {
      for (let i = 0; i < n; i++) setCol(b, b.x + i, b.g);
      if (n >= 8 && b.chance(0.45)) prizeRow(b, b.x + b.ri(2, n - 4), b.g - 4, b.ri(1, 2));
      b.x += n;
    },
    hills(b) {
      const n = b.ri(12, 22);
      let left = n;
      while (left > 0) {
        const run = Math.min(left, b.ri(3, 6));
        for (let i = 0; i < run; i++) setCol(b, b.x + i, b.g);
        if (run >= 4 && b.chance(0.25)) diamondsArc(b, b.x, b.x + run - 1, b.g - 2, 1.5);
        b.x += run; left -= run;
        if (left > 0) b.g = U.clamp(b.g + b.pick([-2, -1, -1, 1, 1, 2]), G_MIN + 4, G_MAX - 2);
      }
      if (b.chance(0.5)) prizeRow(b, b.x - b.ri(4, 8), b.g - 4, 1);
    },
    pit(b) {
      SEG.flat(b, 3);
      const n = b.ri(2, 4);
      for (let i = 0; i < n; i++) { setCol(b, b.x + i, LH); if (b.wd.indoor) b.ceil[b.x + i] = b.g - b.roof - 1; }
      diamondsArc(b, b.x - 1, b.x + n, b.g - 2, 2);
      b.x += n;
      b.g = U.clamp(b.g + b.pick([0, 0, 1, -1]), G_MIN + 4, G_MAX - 2);
      SEG.flat(b, 3);
    },
    spikes(b) {
      SEG.flat(b, 2);
      const n = b.ri(3, 5);
      for (let i = 0; i < n; i++) { setCol(b, b.x + i, b.g + 2); put(b, b.x + i, b.g + 1, TL.SPIKE); }
      // a platform above the middle for longer stretches
      if (n >= 5) put(b, b.x + 2, b.g - 1, TL.PLAT);
      diamondsArc(b, b.x, b.x + n - 1, b.g - 2, 1.5);
      b.x += n;
      SEG.flat(b, 2);
    },
    pool(b) {
      SEG.flat(b, 2);
      const n = b.ri(7, 13);
      const mover = b.wd.seg.mover && b.chance(0.5);
      for (let i = 0; i < n; i++) { setCol(b, b.x + i, b.g + 4); b.liq[b.x + i] = b.g + 1; }
      if (mover) {
        b.movers.push({ x0: (b.x + 1) * T, x1: (b.x + n - 3) * T, y: (b.g - 1) * T, w: 3 * T, axis: "x", speed: 110 });
      } else {
        for (let i = 1; i < n - 1; i += b.ri(3, 4)) { put(b, b.x + i, b.g - 1, TL.PLAT); put(b, b.x + i + 1, b.g - 1, TL.PLAT); }
      }
      if (b.chance(0.7)) b.spawns.push({ role: "liquid", x: b.x + Math.floor(n / 2), y: b.g + 1 });
      diamondsArc(b, b.x + 1, b.x + n - 2, b.g - 3, 1);
      b.x += n;
      SEG.flat(b, 2);
    },
    platforms(b) {
      SEG.flat(b, 2);
      const liquid = b.chance(0.5);
      const start = b.x;
      let y = b.g, x = b.x + b.ri(1, 2);
      const end = b.x + b.ri(14, 22);
      const plats = [];
      while (x < end) {
        const pw = b.ri(2, 4);
        y = U.clamp(y + b.pick([-2, -1, 0, 1, 1, 2]), b.g - 4, b.g + 2);
        plats.push([x, y, pw]);
        x += pw + b.ri(2, 3);
      }
      const span = x - b.x;
      for (let i = 0; i < span; i++) {
        if (liquid) { setCol(b, b.x + i, b.g + 6); b.liq[b.x + i] = b.g + 3; } else setCol(b, b.x + i, LH);
        if (b.wd.indoor) b.ceil[b.x + i] = Math.min(b.g, ...plats.map((p) => p[1])) - b.roof - 1;
      }
      for (const [px, py, pw] of plats) {
        const solid = b.chance(0.4);
        for (let k = 0; k < pw; k++) put(b, px + k, py, solid ? TL.METAL : TL.PLAT);
        if (b.chance(0.45)) item(b, "diamond", px + Math.floor(pw / 2), py - 1);
      }
      if (b.wd.seg.mover && b.chance(0.4)) {
        // a vertical mover in the middle
        const p = plats[Math.floor(plats.length / 2)];
        if (p) b.movers.push({ x0: p[0] * T, x1: p[0] * T, y0: (p[1] - 3) * T, y1: (p[1] + 1) * T, y: (p[1] - 1) * T, w: p[2] * T, axis: "y", speed: 70 });
      }
      for (let i = 0; i < 2; i++) b.spawns.push({ role: "air", x: start + 4 + Math.floor(b.r() * span), y: b.g - 5 });
      const last = plats[plats.length - 1];
      b.x += span;
      b.g = U.clamp(last ? last[1] + b.pick([0, 1, -1]) : b.g, G_MIN + 4, G_MAX - 2);
      SEG.flat(b, 3);
    },
    climb(b) {
      const h = Math.min(b.ri(8, 15), b.g - G_MIN);
      if (h < 6) { SEG.drop(b); return; }
      const sw = 9, x0 = b.x, g0 = b.g, top = g0 - h;
      for (let i = 0; i < sw; i++) { setCol(b, x0 + i, g0); if (b.wd.indoor) b.ceil[x0 + i] = top - 9; }
      const n = Math.ceil(h / 3), s = h / n;
      for (let k = 1; k < n; k++) {
        const row = Math.round(g0 - s * k), right = k % 2 === 1;
        const px = right ? x0 + 5 : x0 + 1;
        for (let q = 0; q < 3; q++) put(b, px + q, row, TL.PLAT);
        if (b.chance(0.3)) item(b, "diamond", px + 1, row - 1);
      }
      // make sure the last platform is next to the wall
      if (n % 2 === 0 || n === 1) for (let q = 0; q < 3; q++) put(b, x0 + 5 + q, Math.round(g0 - s * (n - 1)) || g0 - 3, TL.PLAT);
      b.spawns.push({ role: "air", x: x0 + 4, y: g0 - Math.floor(h / 2) });
      if (b.chance(0.5)) b.spawns.push({ role: "fixed", x: x0 + sw + 2, y: top });
      // secret ledge above the shaft
      if (b.chance(0.4) && top - 6 > 3) {
        for (let q = 0; q < 3; q++) put(b, x0 + 1 + q, top - 3, TL.PLAT);
        for (let q = 0; q < 3; q++) item(b, "diamond", x0 + 1 + q, top - 4);
        if (b.chance(0.5)) item(b, b.pick(["bigdiamond", "power", "life", "gyro"]), x0 + 2, top - 5);
        if (b.wd.indoor) for (let i = 0; i < sw; i++) b.ceil[x0 + i] = top - 10;
      }
      b.x += sw; b.g = top;
      for (let i = 0; i < 3; i++) { setCol(b, b.x + i, b.g); }
      b.x += 3;
    },
    drop(b) {
      const d = Math.min(b.ri(5, 11), G_MAX - 2 - b.g);
      SEG.flat(b, 3);
      if (d < 3) return;
      // ledge with goodies on the side of the drop
      b.g += d;
      for (let i = 0; i < 4; i++) setCol(b, b.x + i, b.g);
      if (b.wd.indoor) for (let i = -3; i < 4; i++) b.ceil[b.x + i] = Math.min(b.ceil[b.x + i], b.g - d - b.roof - 1);
      diamondsArc(b, b.x, b.x + 3, b.g - 3, 0);
      b.x += 4;
    },
    cave(b) {
      const n = b.ri(14, 22), hh = b.ri(6, 7);
      for (let i = 0; i < n; i++) {
        setCol(b, b.x + i, b.g);
        b.ceil[b.x + i] = b.g - hh;
        b.ceilTop[b.x + i] = Math.max(0, b.g - hh - b.ri(2, 3));
        if (b.chance(0.12)) put(b, b.x + i, b.g - hh + 1, TL.SPIKE);
      }
      b.spawns.push({ role: "ceiling", x: b.x + Math.floor(n * 0.3), y: b.g - hh + 1 });
      b.spawns.push({ role: "ceiling", x: b.x + Math.floor(n * 0.7), y: b.g - hh + 1 });
      if (n > 14 && b.chance(0.6)) SEG._tunnel(b, b.x + 3, Math.min(10, n - 6));
      b.x += n;
    },
    crack(b) {
      SEG.flat(b, 3);
      const hh = b.wd.indoor ? b.roof : 4;
      for (let i = 0; i < 2; i++) for (let y = 1; y <= Math.min(hh, 5); y++) put(b, b.x + i, b.g - y, TL.CRACK);
      if (!b.wd.indoor) for (let i = 0; i < 2; i++) setCol(b, b.x + i, b.g);
      else for (let i = 0; i < 2; i++) { setCol(b, b.x + i, b.g); b.ceil[b.x + i] = b.g - 6; }
      b.x += 2;
      item(b, b.pick(["diamond", "health", "power"]), b.x + 1, b.g - 1);
      SEG.flat(b, 3);
    },
    tower(b) {
      SEG.flat(b, 3);
      const hh = b.ri(2, 3);
      for (let i = 0; i < 2; i++) { setCol(b, b.x + i, b.g); for (let y = 1; y <= hh; y++) put(b, b.x + i, b.g - y, TL.METAL); }
      b.spawns.push({ role: "fixed", x: b.x, y: b.g - hh, force: "turret" });
      b.x += 2;
      SEG.flat(b, 4);
    },
    crush(b) {
      if (!b.wd.indoor) { SEG.flat(b, 6); return; }
      const n = b.ri(10, 16);
      for (let i = 0; i < n; i++) setCol(b, b.x + i, b.g);
      for (let i = 2; i < n - 2; i += b.ri(4, 5)) b.crushers.push({ x: (b.x + i) * T, top: (b.g - b.roof) * T, floor: b.g * T, w: 2 * T, phase: b.r() * 3 });
      b.x += n;
    },
    mover(b) {
      SEG.flat(b, 2);
      const n = b.ri(9, 13);
      for (let i = 0; i < n; i++) { setCol(b, b.x + i, LH); if (b.wd.indoor) b.ceil[b.x + i] = b.g - b.roof - 1; }
      b.movers.push({ x0: b.x * T, x1: (b.x + n - 3) * T, y: (b.g - 1) * T, w: 3 * T, axis: "x", speed: 120 });
      b.spawns.push({ role: "air", x: b.x + Math.floor(n / 2), y: b.g - 5 });
      b.x += n;
      SEG.flat(b, 2);
    },
    _tunnel(b, x0, n) {
      // hidden tunnel for the gyroscope: 1 tile high, 2 tiles below the ground
      const y = b.g + 2;
      if (y + 2 >= LH) return;
      for (let i = 0; i < n; i++) b.carve.push([x0 + i, y]);
      b.carve.push([x0, b.g], [x0, b.g + 1], [x0 + n - 1, b.g], [x0 + n - 1, b.g + 1]);
      for (let i = 1; i < n - 1; i++) item(b, i === Math.floor(n / 2) ? "bigdiamond" : "diamond", x0 + i, y);
      if (n > 6) item(b, b.pick(["life", "power", "line", "gyro"]), x0 + n - 2, y);
    },
  };

  function checkpoint(b) {
    b.checkpoints.push({ x: (b.x + 1) * T + T / 2, y: b.g * T });
    for (let i = -3; i < 5; i++) if (b.x + i >= 0 && b.x + i < b.w) b.noSpawn[b.x + i] = 1;
  }

  /* ---------- Build a stage ---------- */
  Levels.build = function (index) {
    const st = STAGES[index], b = Builder(st), wd = b.wd;
    // start platform
    b.g = 30;
    SEG.flat(b, 14);
    for (let i = 0; i < 14; i++) b.noSpawn[i] = 1;
    const weights = Object.entries(wd.seg);
    const total = weights.reduce((s, [, v]) => s + v, 0);
    let lastCp = 0, last = "";
    const diff = st.world;
    while (b.x < st.len) {
      if (b.x - lastCp > 55) { SEG.flat(b, 4); b.x -= 4; checkpoint(b); b.x += 4; lastCp = b.x; }
      let k, guard = 0;
      do {
        let roll = b.r() * total;
        for (const [name, v] of weights) { roll -= v; if (roll <= 0) { k = name; break; } }
        guard++;
      } while ((k === last || (k === "climb" && b.g - G_MIN < 8) || (k === "drop" && G_MAX - b.g < 8)) && guard < 20);
      last = k;
      const x0 = b.x;
      SEG[k](b);
      // fill segment with enemies
      const span = b.x - x0;
      let nEn = Math.round(span / U.lerp(7, 4.8, diff / 4));
      for (let i = 0; i < nEn; i++) b.spawns.push({ role: b.chance(0.65) ? "ground" : b.chance(0.6) ? "air" : "fixed", x: x0 + Math.floor(b.r() * span), y: null });
      if (b.chance(0.25)) SEG.flat(b, b.ri(3, 6));
      if (b.chance(0.15) && !wd.indoor) SEG.flat(b, 2);
      // tunnels on flat stretches
      if (b.chance(0.12) && span > 0) { const g = b.g; SEG.flat(b, 12); b.x -= 12; if (b.g === g) SEG._tunnel(b, b.x + 1, 10); b.x += 12; }
    }
    // end
    const lv = { index, stage: st, world: wd, w: b.w, h: LH };
    SEG.flat(b, 6);
    checkpoint(b);
    if (st.boss) {
      // boss arena: flat, closed by walls when the fight starts
      SEG.flat(b, 4);
      // walk up or down in small steps to the height of the arena
      while (b.g > 36) { b.g = Math.max(36, b.g - 2); SEG.flat(b, 3); }
      while (b.g < 26) { b.g = Math.min(26, b.g + 3); SEG.flat(b, 3); }
      const ax0 = b.x, aw = 32;
      if (wd.indoor) b.roof = 15;
      for (let i = 0; i < aw; i++) setCol(b, b.x + i, b.g);
      if (!wd.indoor) for (let i = 0; i < aw; i++) b.ceil[b.x + i] = -1;
      b.x += aw;
      for (let i = 0; i < 6; i++) { setCol(b, b.x + i, b.g - 16); b.ceil[b.x + i] = -1; }
      lv.arena = { x0: ax0 * T, x1: (ax0 + aw) * T, floor: b.g * T, boss: st.boss };
      for (let i = ax0 - 4; i < b.x; i++) if (i >= 0) b.noSpawn[i] = 1;
      b.x += 6;
    } else {
      SEG.flat(b, 14);
      lv.exit = { x: (b.x - 6) * T, y: b.g * T };
      for (let i = b.x - 16; i < b.x; i++) b.noSpawn[i] = 1;
    }
    for (let i = b.x; i < b.w; i++) setCol(b, i, b.g - (st.boss ? 16 : 0));
    lv.w = b.w = Math.min(b.w, b.x + 1);
    // write tiles
    const tiles = new Uint8Array(lv.w * LH);
    for (let x = 0; x < lv.w; x++) {
      const g = b.ground[x];
      for (let y = Math.max(0, g); y < LH; y++) tiles[y * lv.w + x] = TL.ROCK;
      for (let y = b.wd.indoor ? 0 : b.ceilTop[x]; y <= b.ceil[x] && y < LH; y++) tiles[y * lv.w + x] = TL.ROCK;
      if (b.liq[x] >= 0) for (let y = b.liq[x]; y < g; y++) tiles[y * lv.w + x] = y === b.liq[x] ? TL.LIQTOP : TL.LIQ;
      if (wd.indoor) tiles[x] = TL.ROCK; // caves are always closed at the top
    }
    for (const [x, y, id] of b.over) if (x < lv.w) tiles[y * lv.w + x] = id;
    b.prizes = b.prizes.filter((p) => p.x < lv.w && b.ground[p.x] < LH && b.liq[p.x] < 0);
    for (const p of b.prizes) p.y = b.ground[p.x] - p.off;
    b.prizes = b.prizes.filter((p) => p.y > 0 && !tiles[p.y * lv.w + p.x] && !tiles[(p.y - 1) * lv.w + p.x] && !Theme.solid(tiles[(p.y + 1) * lv.w + p.x]) && !Theme.solid(tiles[(p.y + 2) * lv.w + p.x]));
    for (const p of b.prizes) tiles[p.y * lv.w + p.x] = TL.PRIZE;
    for (const [x, y] of b.carve) if (x < lv.w) tiles[y * lv.w + x] = TL.EMPTY;
    lv.tiles = tiles;
    lv.prizes = new Map();
    for (const p of b.prizes) lv.prizes.set(p.y * lv.w + p.x, { item: p.item, hp: 3 });
    lv.blockHp = new Map();
    lv.ground = b.ground;
    lv.start = { x: 3 * T + T / 2, y: 30 * T };
    lv.checkpoints = b.checkpoints;
    lv.items = b.items.filter((it) => !Theme.solid(tileAtPx(lv, it.x, it.y)));
    lv.movers = b.movers;
    lv.crushers = b.crushers;
    lv.spawns = placeSpawns(b, lv);
    lv.time = Math.round(180 + st.len * 0.9);
    lv.theme = wd.key;
    lv.variant = index % 2;
    computeMasks(lv);
    return lv;
  };

  function tileAtPx(lv, px, py) {
    const x = Math.floor(px / T), y = Math.floor(py / T);
    if (x < 0 || x >= lv.w || y < 0 || y >= lv.h) return 0;
    return lv.tiles[y * lv.w + x];
  }
  Levels.tileAtPx = tileAtPx;

  function placeSpawns(b, lv) {
    const out = [], pool = b.wd.pool;
    const used = new Set();
    for (const s of b.spawns) {
      const x = s.x;
      if (x < 0 || x >= lv.w - 2 || b.noSpawn[x]) continue;
      let role = s.role, y = s.y;
      if (role === "ceiling" && b.ceil[x] < 0) role = "ground";
      const g = b.ground[x];
      if (role === "ground" || role === "fixed") {
        if (y === null || y === undefined) {
          if (g >= LH || b.liq[x] >= 0) { role = "air"; y = null; }
          else y = g;
          // ground spot must be free above
          if (y !== null && (Theme.solid(lv.tiles[(y - 1) * lv.w + x]) || Theme.solid(lv.tiles[(y - 2) * lv.w + x]))) continue;
        }
      }
      if (role === "air" && (y === null || y === undefined)) {
        let gg = g < LH ? g : b.g;
        if (b.liq[x] >= 0) gg = b.liq[x];
        y = gg - b.ri(4, 6);
        if (b.ceil[x] >= 0) y = Math.max(y, b.ceil[x] + 2);
      }
      if (role === "ceiling") y = b.ceil[x] + 1;
      const key = x + ":" + role;
      if (used.has(key)) continue;
      used.add(key);
      const type = s.force || b.pick(pool[role]);
      out.push({ type, x: x * T + T / 2, y: y * T, role });
    }
    return out;
  }

  const isRockish = (id) => id === 1 || id === 7;
  function computeMasks(lv) {
    lv.mask = new Uint8Array(lv.w * lv.h);
    lv.depth = new Uint8Array(lv.w * lv.h);
    for (let y = 0; y < lv.h; y++) for (let x = 0; x < lv.w; x++) updateMask(lv, x, y);
    computeDepth(lv);
  }
  function updateMask(lv, x, y) {
    const i = y * lv.w + x, t = lv.tiles;
    if (t[i] !== 1) { lv.mask[i] = 0; return; }
    const at = (xx, yy) => (xx < 0 || xx >= lv.w || yy < 0 || yy >= lv.h ? 1 : t[yy * lv.w + xx]);
    let m = 0;
    if (!isRockish(at(x, y - 1))) m |= 1;
    if (!isRockish(at(x + 1, y))) m |= 2;
    if (!isRockish(at(x, y + 1))) m |= 4;
    if (!isRockish(at(x - 1, y))) m |= 8;
    lv.mask[i] = m;
  }
  // distance of every rock tile to the nearest open tile (chamfer distance transform)
  function computeDepth(lv) {
    const w = lv.w, h = lv.h, t = lv.tiles, d = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) d[i] = isRockish(t[i]) ? 99 : 0;
    const A = 1, D = 1.4;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!d[i]) continue;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + A);
      if (y > 0) { v = Math.min(v, d[i - w] + A); if (x > 0) v = Math.min(v, d[i - w - 1] + D); if (x < w - 1) v = Math.min(v, d[i - w + 1] + D); }
      d[i] = v;
    }
    for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x; if (!d[i]) continue;
      let v = d[i];
      if (x < w - 1) v = Math.min(v, d[i + 1] + A);
      if (y < h - 1) { v = Math.min(v, d[i + w] + A); if (x < w - 1) v = Math.min(v, d[i + w + 1] + D); if (x > 0) v = Math.min(v, d[i + w - 1] + D); }
      d[i] = v;
    }
    for (let i = 0; i < w * h; i++) lv.depth[i] = Math.min(250, Math.round(d[i] * 10));
  }
  Levels.setTile = function (lv, x, y, id) {
    if (x < 0 || x >= lv.w || y < 0 || y >= lv.h) return;
    lv.tiles[y * lv.w + x] = id;
    for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) if (xx >= 0 && xx < lv.w && yy >= 0 && yy < lv.h) updateMask(lv, xx, yy);
    computeDepth(lv);
  };
})(window.XA);
