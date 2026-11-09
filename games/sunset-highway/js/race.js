/* SUNSET HIGHWAY: pseudo-3D road, route with forks, traffic, driving physics and the animated convertible */
"use strict";

(function (XA) {
  const { U, Gfx } = XA;
  const A = XA.Audio, I = XA.Input;
  const LW = Gfx.LW, LH = Gfx.LH, TAU = U.TAU;

  const SEG = 200, RW = 1400, RUMBLE = 3, DRAW = 220, CAMH = 1000;
  const DEPTH = 1 / Math.tan((100 / 2) * Math.PI / 180);
  const PZ = CAMH * DEPTH;
  const MAXV = SEG * 60; // 290 km/h
  const SPRK = 0.45; // scenery world size factor
  const CARW = 480 / RW; // player car width in road units

  const R = (XA.R = { segs: [], cars: [], parts: [], critters: [], glows: [], speed: 0, x: 0, pos: 0, gear: 0, time: 0, score: 0 });
  R.SEG = SEG; R.MAXV = MAXV;

  /* ---------- Route: five rows of stages, a fork at the end of each ---------- */
  R.NODES = [
    [{ name: "Palm Beach", theme: "beach", tod: 0 }],
    [{ name: "Cactus Flats", theme: "desert", tod: 0 }, { name: "Pine Valley", theme: "forest", tod: 0 }],
    [{ name: "Red Canyon", theme: "canyon", tod: 0 }, { name: "Windmill Fields", theme: "farm", tod: 0 }, { name: "Glacier Pass", theme: "alps", tod: 0 }],
    [{ name: "Lava Ridge", theme: "volcano", tod: 1 }, { name: "Neon City", theme: "city", tod: 2 }, { name: "Maple Lake", theme: "autumn", tod: 1 }, { name: "Sunset Coast", theme: "coast", tod: 1 }],
    [{ name: "Ember Desert", theme: "desert", tod: 2 }, { name: "Midnight Boulevard", theme: "city", tod: 2 }, { name: "Harvest Moon", theme: "farm", tod: 2 }, { name: "Summit Lodge", theme: "alps", tod: 1 }, { name: "Paradise Bay", theme: "beach", tod: 1 }],
  ];
  const EXTEND = [0, 60, 58, 57, 56];

  /* ---------- Track building ---------- */
  let lastY = 0;
  function addSeg(curve, y, node, extra) {
    const n = R.segs.length;
    R.segs.push(Object.assign({
      index: n, curve, node, theme: node.theme, color: Math.floor(n / RUMBLE) % 2,
      p1: { world: { y: lastY, z: n * SEG }, camera: {}, screen: {} },
      p2: { world: { y, z: (n + 1) * SEG }, camera: {}, screen: {} },
      sprites: [], cars: [], fork: 0, merge: 0,
    }, extra || {}));
    lastY = y;
  }
  const easeIn = (a, b, p) => a + (b - a) * p * p;
  const easeInOut = (a, b, p) => a + (b - a) * (-Math.cos(p * Math.PI) / 2 + 0.5);
  function addRoad(node, enter, hold, leave, curve, hill, extra) {
    const y0 = lastY, y1 = y0 + hill * SEG, total = enter + hold + leave;
    for (let i = 0; i < enter; i++) addSeg(easeIn(0, curve, i / enter), easeInOut(y0, y1, i / total), node, extra && extra(i, total));
    for (let i = 0; i < hold; i++) addSeg(curve, easeInOut(y0, y1, (enter + i) / total), node, extra && extra(enter + i, total));
    for (let i = 0; i < leave; i++) addSeg(easeInOut(curve, 0, i / leave), easeInOut(y0, y1, (enter + hold + i) / total), node, extra && extra(enter + hold + i, total));
  }
  function sprite(i, key, offset, o) { const s = R.segs[i]; if (s) s.sprites.push(Object.assign({ key, offset, t: Math.random() * 5 }, o)); }

  function buildStage(row, col, side) {
    const node = R.NODES[row][col], rng = U.rng(row * 31 + col * 7 + 5), th = Gfx.THEMES[node.theme];
    const start = R.segs.length;
    const hard = 2 + row * 0.6;
    // entry: merge after a fork, start line or checkpoint gate
    if (side) addRoad(node, 0, 150, 0, 0, 0, (i, t) => ({ merge: 1 - i / t, side }));
    addRoad(node, 0, 60, 0, 0, 0);
    const gate = start + (side ? 170 : 20);
    if (row === 0) { R.gateStart = gate; sprite(gate, "startgate", 0, { nocol: true }); sprite(gate - 2, "flagman", -1.25, { nocol: true }); for (const s of [-1, 1]) sprite(gate + 3, "crowd", s * 2.1, { nocol: true }); }
    else { R.checkpoints.push({ seg: gate, row, done: false }); sprite(gate, "cpgate", 0, { nocol: true }); for (const s of [-1, 1]) { sprite(gate - 4, "crowd", s * 2.0, { nocol: true }); sprite(gate + 6, "crowd", s * 2.4, { nocol: true }); } }
    for (const s of [-1, 1]) sprite(gate, "post", s * 1.14);
    // body: random sequence of curves and hills
    const bodyStart = R.segs.length;
    const target = 2300 + row * 220;
    while (R.segs.length - bodyStart < target) {
      const k = rng();
      const len = 40 + Math.floor(rng() * 60);
      const dir = rng() < 0.5 ? -1 : 1;
      const hill = (rng() - 0.45) * (20 + row * 12);
      if (k < 0.18) addRoad(node, 20, len, 20, 0, hill * 0.6);
      else if (k < 0.48) { const c = dir * (2 + rng() * hard); signs(c); addRoad(node, 25, len, 25, c, hill); }
      else if (k < 0.66) { const c = 2 + rng() * hard; signs(dir * c); addRoad(node, 20, len * 0.6 | 0, 20, dir * c, hill * 0.5); signs(-dir * c); addRoad(node, 20, len * 0.6 | 0, 20, -dir * c, -hill * 0.5); }
      else if (k < 0.82) addRoad(node, 30, len, 30, dir * 1.5, (rng() < 0.5 ? 1 : -1) * (30 + row * 10));
      else { for (let j = 0; j < 3; j++) addRoad(node, 12, 16, 12, 0, (j % 2 ? -1 : 1) * (14 + row * 5)); }
    }
    function signs(c) { if (Math.abs(c) < 3.2) return; const i = R.segs.length; for (let k = 0; k < 4; k++) sprite(i - 30 + k * 8, c < 0 ? "curveR" : "curveL", c < 0 ? 1.15 : -1.15); }
    const bodyEnd = R.segs.length;
    // scenery
    const list = th.sprites, tot = list.reduce((a, b) => a + b[1], 0);
    const pick = () => { let r = rng() * tot; for (const [k, w] of list) { if ((r -= w) < 0) return k; } return list[0][0]; };
    for (let i = bodyStart; i < bodyEnd; i += 2 + Math.floor(rng() * 4)) {
      for (const s of [-1, 1]) {
        if (rng() < 0.65) {
          const key = pick(), big = Gfx.SPR[key].ww > 1800;
          sprite(i, key, s * (1.35 + rng() * (big ? 2.5 : 1.6) + (big ? 0.6 : 0)), { flip: !/billboard|neon|skull|hut|curve|warn|deer/.test(key) && rng() < 0.5 });
        }
      }
      if (rng() < 0.03) { const key = pick(); for (let j = 0; j < 8; j++) for (const s of [-1, 1]) sprite(i + j * 4, key, s * 1.4); }
    }
    // traffic
    const nCars = 34 + row * 10, CK = ["car_blue", "car_yellow", "car_white", "car_green", "truck", "van"];
    for (let n = 0; n < nCars; n++) {
      const seg = bodyStart + 40 + Math.floor(rng() * (bodyEnd - bodyStart - 60));
      const lane = [-0.72, -0.24, 0.24, 0.72][Math.floor(rng() * 4)];
      const key = CK[Math.floor(rng() * CK.length)];
      const car = { key, x: lane, z: seg * SEG, zEnd: (bodyEnd - 2) * SEG, speed: MAXV * (0.25 + rng() * 0.3) * (key === "truck" ? 0.8 : 1), w: Gfx.SPR[key].ww * SPRK / RW };
      R.cars.push(car); R.segs[seg].cars.push(car);
    }
    // critters
    R.critterKind = th.critter;
    // end: fork or goal
    if (row < 4) {
      const a = R.NODES[row + 1][col], b = R.NODES[row + 1][col + 1];
      const forkStart = R.segs.length;
      addRoad(node, 0, 380, 0, 0, 0, (i) => ({ fork: Math.min(1, i / 110) }));
      R.forkAt = { start: forkStart, lock: forkStart + 112, end: forkStart + 380, row, col, names: [a.name, b.name] };
      const key = "fork_" + row + "_" + col;
      makeForkSign(key, a.name, b.name);
      sprite(forkStart + 30, key, 0, { nocol: true });
      sprite(forkStart + 140, key, 0);
      for (let i = forkStart + 20; i < forkStart + 380; i += 6) for (const s of [-1, 1]) if (rng() < 0.6) sprite(i, pick(), s * (3.1 + rng() * 1.5));
    } else {
      addRoad(node, 0, 120, 0, 0, 0);
      R.goalSeg = R.segs.length - 40;
      sprite(R.goalSeg, "goalgate", 0, { nocol: true });
      for (const s of [-1, 1]) { sprite(R.goalSeg, "post", s * 1.14); sprite(R.goalSeg + 4, "crowd", s * 2.0, { nocol: true }); sprite(R.goalSeg - 6, "crowd", s * 2.3, { nocol: true }); }
      addRoad(node, 0, 300, 0, 0, 0);
    }
  }

  function makeForkSign(key, a, b) {
    if (Gfx.spr[key]) return;
    const c = document.createElement("canvas"); c.width = 130; c.height = 70;
    const g = c.getContext("2d");
    g.fillStyle = "#555"; g.fillRect(30, 40, 4, 30); g.fillRect(96, 40, 4, 30);
    g.fillStyle = "#1a7a3a"; g.fillRect(0, 0, 130, 42); g.strokeStyle = "#fff"; g.lineWidth = 2; g.strokeRect(3, 3, 124, 36);
    g.fillStyle = "#fff"; g.font = "bold 9px monospace"; g.textAlign = "left";
    g.fillText("◄ " + a.toUpperCase(), 8, 17); g.textAlign = "right"; g.fillText(b.toUpperCase() + " ►", 122, 32);
    c.def = { ww: 2600 };
    Gfx.spr[key] = c;
  }
  function makeGates() {
    const gate = (key, text, colA, colB) => {
      // spans the whole road: the pillars stand just outside the rumble strips
      const GW = 440, c = document.createElement("canvas"); c.width = GW; c.height = 90;
      const g = c.getContext("2d");
      g.fillStyle = "#d8d8d8"; g.fillRect(4, 0, 12, 90); g.fillRect(GW - 16, 0, 12, 90);
      g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(13, 0, 3, 90); g.fillRect(GW - 7, 0, 3, 90);
      g.fillStyle = colA; g.fillRect(0, 0, GW, 28);
      if (key === "goalgate") { for (let x = 0; x < GW; x += 10) for (let y = 0; y < 28; y += 7) { g.fillStyle = ((x / 10 + y / 7) % 2) ? "#111" : "#fff"; g.fillRect(x, y, 10, 7); } g.fillStyle = "rgba(0,0,0,0.6)"; g.fillRect(GW / 2 - 60, 3, 120, 22); }
      else { g.fillStyle = colB; g.fillRect(0, 0, GW, 3); g.fillRect(0, 25, GW, 3); }
      g.fillStyle = colB; g.font = "bold 18px monospace"; g.textAlign = "center"; g.fillText(text, GW / 2, 21);
      for (let i = 0; i < 13; i++) { g.fillStyle = ["#ff4a4a", "#ffd040", "#4a8aff"][i % 3]; g.fillRect(28 + i * 30, 30, 18, 10); }
      c.def = { ww: 7800 };
      Gfx.spr[key] = c;
    };
    gate("startgate", "START", "#e0302a", "#ffffff");
    gate("cpgate", "CHECKPOINT", "#2a6ae0", "#ffe040");
    gate("goalgate", "GOAL", "#111", "#ffe040");
  }

  /* ---------- Race setup ---------- */
  R.newRace = function () {
    makeGates();
    R.segs = []; R.cars = []; R.parts = []; R.critters = []; R.checkpoints = []; lastY = 0;
    R.row = 0; R.col = 0; R.route = [0]; R.side = 0;
    buildStage(0, 0, 0);
    R.pos = (R.gateStart - 6) * SEG - PZ; R.x = -0.36; R.speed = 0; R.gear = 0; R.steer = 0;
    R.time = 75; R.score = 0; R.cheated = XA.G.cheat; R.phase = "countdown"; R.phaseT = 0;
    R.skyX = 0; R.t = 0; R.crash = 0; R.bump = 0; R.bubble = null; R.prevCenter = 0; R.locked = false; R.stage = 0; R.msg = null; R.fade = 0;
    R.prevNode = R.NODES[0][0]; R.curNode = R.NODES[0][0]; R.themeMix = 1;
    R.slap = 0; R.whee = 0; R.offT = 0; R.airT = 0; R.passed = 0;
  };

  const findSeg = (z) => R.segs[Math.min(R.segs.length - 1, Math.max(0, Math.floor(z / SEG)))];
  R.findSeg = findSeg;

  function roadsOf(s) {
    if (s.fork > 0) { const sep = 1.3 * s.fork, w = 1 - 0.42 * s.fork; return [{ c: -sep, w }, { c: sep, w }]; }
    if (s.merge > 0) {
      const w = 1 - 0.42 * s.merge, c = s.side * 1.3 * s.merge, out = [{ c, w }];
      if (s.merge > 0.35) out.push({ c: -s.side * 1.3 * (1 + (1 - s.merge) * 5), w: 0.58 });
      return out;
    }
    return [{ c: 0, w: 1 }];
  }
  function onRoad(s, x) { for (const r of roadsOf(s)) if (Math.abs(x - r.c) < r.w + 0.02) return r; return null; }

  /* ---------- Speech bubbles and gags ---------- */
  function say(text, who = 1, dur = 1.6) { R.bubble = { text, who, t: dur }; }
  R.say = say;

  /* ---------- Update ---------- */
  R.update = function (dt) {
    const G = XA.G;
    R.t += dt; R.phaseT += dt;
    if (G.cheat) R.cheated = true;
    if (R.bubble && (R.bubble.t -= dt) <= 0) R.bubble = null;
    R.slap = Math.max(0, R.slap - dt); R.whee = Math.max(0, R.whee - dt); R.bump = Math.max(0, R.bump - dt);
    if (R.msg && (R.msg.t -= dt) <= 0) R.msg = null;
    R.themeMix = Math.min(1, R.themeMix + dt / 3);

    // input
    let accel = 0, brake = 0, steer = 0;
    const racing = R.phase === "race";
    if (G.autopilot && racing) { const a = G.autopilot(R); accel = a.accel; brake = a.brake; steer = a.steer; }
    else if (racing) {
      if (I.held("accel")) accel = 1;
      if (I.held("brake")) brake = 1;
      if (I.held("left")) steer -= 1;
      if (I.held("right")) steer += 1;
      const pad = I.pad;
      if (pad.connected) { if (Math.abs(pad.axes[0]) > 0.15) steer += pad.axes[0]; accel = Math.max(accel, pad.values[7] || 0, pad.buttons[0] ? 1 : 0); brake = Math.max(brake, pad.values[6] || 0, pad.buttons[1] ? 1 : 0); }
      if (steer || accel || brake) G.mouseMode = I.mouse.buttons !== 0 && G.mouseMode;
      if (I.mouse.moved && I.mouse.inside) G.mouseMode = true;
      if (G.mouseMode) {
        steer = U.clamp((I.mouse.x - U.W / 2) / (U.W * 0.3), -1, 1);
        if (I.mouse.buttons & 1) accel = 1;
        if (I.mouse.buttons & 2) brake = 1;
      }
      steer = U.clamp(steer, -1, 1);
    }
    R.accel = accel; R.brake = brake;
    R.steer = U.lerp(R.steer, steer, Math.min(1, dt * 10));

    const pseg = findSeg(R.pos + PZ);
    const sp = R.speed / MAXV;

    if (R.crash > 0) {
      R.crash -= dt;
      R.speed = Math.max(0, R.speed - MAXV * 2 * dt);
      if (R.crash <= 0) { const r = roadsOf(pseg)[0]; R.x = r.c; say(U.pick(["OUCH!", "MY HAIR!", "NICE ONE...", "WHO PUT THAT THERE?"]), 1, 1.8); R.slap = 0.9; A.sfx("slap"); }
    } else {
      // gears: low up to 190 km/h, high up to 290 km/h
      const auto = XA.Main.autoGear;
      if (auto) { if (R.gear === 0 && sp > 0.6) { R.gear = 1; A.sfx("shift"); } else if (R.gear === 1 && sp < 0.38) { R.gear = 0; A.sfx("shift"); } }
      const top = R.gear ? MAXV : MAXV * 0.66;
      let acc = R.gear ? (sp < 0.35 ? 0.22 : 0.62) : 1.1;
      const onr = onRoad(pseg, R.x);
      if (accel > 0 && racing) R.speed += (MAXV / 5.2) * acc * accel * dt;
      else R.speed -= (MAXV / 6) * dt;
      if (brake > 0) R.speed -= MAXV * 1.1 * brake * dt;
      if (R.speed > top) R.speed = Math.max(top, R.speed - MAXV * 0.6 * dt);
      if (!onr) {
        R.offT += dt;
        if (R.speed > MAXV * 0.3) R.speed -= MAXV * 0.6 * dt;
        if (Math.random() < sp * 2) R.parts.push({ k: "dust", x: LW / 2 + U.rand(-60, 60), y: LH - 20, vx: U.rand(-40, 40), vy: U.rand(-60, -20), life: 0.6, col: Gfx.THEMES[pseg.theme].ground[0] });
        if (R.offT > 0.6 && !R.bubble && Math.random() < 0.02) say(U.pick(["EYES ON THE ROAD!", "THIS IS NOT A ROAD!", "MY SHOES!"]), 1);
      } else R.offT = 0;
      R.speed = U.clamp(R.speed, 0, MAXV);
      // steering and centrifugal force
      const dx = dt * 2.2 * Math.min(1, sp * 1.6 + 0.05);
      if (racing || R.phase === "goal" || R.phase === "timeup") R.x += dx * R.steer;
      R.x -= dx * sp * pseg.curve * 0.28;
      R.x = U.clamp(R.x, -4.5, 4.5);
    }

    // merging road after a fork: carry the car with its road
    if (pseg.merge > 0) { const c = roadsOf(pseg)[0].c; if (R.prevMerge) R.x += c - R.prevCenter; R.prevCenter = c; R.prevMerge = true; }
    else R.prevMerge = false;

    R.pos += R.speed * dt;
    R.skyX += pseg.curve * sp * dt * 60 * 3;
    const npseg = findSeg(R.pos + PZ);

    // collisions with scenery
    if (R.crash <= 0 && !G.cheat) {
      for (const s of npseg.sprites) {
        if (s.nocol) continue;
        const spr = Gfx.spr[s.key];
        const w = (spr.def.ww * SPRK) / RW;
        const sx = s.offset < 0 ? s.offset - w / 2 : s.offset + w / 2;
        if (Math.abs(R.x - sx) < (w * 0.7 + CARW) / 2) {
          if (R.speed > MAXV * 0.15) crash();
          else { R.speed = 0; R.x += R.x < sx ? -0.05 : 0.05; }
          break;
        }
      }
    }
    // traffic
    for (let ci = R.cars.length - 1; ci >= 0; ci--) {
      const c = R.cars[ci];
      const old = findSeg(c.z);
      c.z += c.speed * dt;
      // traffic never drives into a fork or a merge: at the end of its stage it turns off and is gone
      if (c.z >= c.zEnd) { const i = old.cars.indexOf(c); if (i >= 0) old.cars.splice(i, 1); R.cars.splice(ci, 1); continue; }
      const ns = findSeg(c.z);
      if (ns !== old) { const i = old.cars.indexOf(c); if (i >= 0) old.cars.splice(i, 1); ns.cars.push(c); }
      // gentle lane keeping away from the player
      const dz = c.z - (R.pos + PZ);
      if (dz > 0 && dz < SEG * 20 && Math.abs(c.x - R.x) < 0.3 && R.speed > c.speed) c.x += (c.x > R.x ? 1 : -1) * 0.25 * dt;
      c.x = U.clamp(c.x, -0.8, 0.8);
      if (R.crash <= 0 && !G.cheat && c.zEnd - c.z > SEG * 12 && dz > -SEG * 0.3 && dz < SEG * 0.9 && Math.abs(c.x - R.x) < (c.w + CARW) * 0.45 && R.speed > c.speed) {
        const diff = (R.speed - c.speed) / MAXV;
        if (diff > 0.45) crash(true);
        else { R.speed = c.speed * 0.7; R.pos = c.z - PZ - SEG * 0.9; R.bump = 0.3; A.sfx("bump"); say(U.pick(["HEY!", "ROAD HOG!", "BEEP BEEP!"]), 0, 1.2); }
      }
      if (dz < 0 && dz > -SEG && !c.passed) { c.passed = true; R.passed++; }
    }

    // fork: lock the chosen road and build the next stage
    if (R.forkAt && !R.locked && npseg.index >= R.forkAt.lock) {
      R.locked = true;
      const roads = roadsOf(npseg);
      R.side = R.x < 0 ? -1 : 1;
      if (Math.abs(R.x - roads[R.side < 0 ? 0 : 1].c) > 0.8) R.x = roads[R.side < 0 ? 0 : 1].c * 0.9;
      const f = R.forkAt, ncol = f.col + (R.side > 0 ? 1 : 0);
      R.nextNode = { row: f.row + 1, col: ncol };
      R.forkAt = null;
      buildStage(f.row + 1, ncol, R.side);
    }
    // checkpoints
    for (const cp of R.checkpoints) {
      if (!cp.done && npseg.index >= cp.seg) {
        cp.done = true;
        R.row = cp.row; R.col = R.nextNode.col; R.route.push(R.col);
        R.prevNode = R.curNode; R.curNode = R.NODES[R.row][R.col]; R.themeMix = 0;
        R.time += EXTEND[cp.row]; R.locked = false;
        R.msg = { text: "CHECKPOINT!", sub: `EXTENDED TIME +${EXTEND[cp.row]}`, t: 3 };
        A.sfx("checkpoint"); A.sfx("cheer"); setTimeout(() => A.sfx("extend"), 450);
        say(U.pick(["WOO-HOO!", "WE MADE IT!", "TO " + R.curNode.name.toUpperCase() + "!"]), 1, 2);
      }
    }
    // goal
    if (R.phase === "race" && R.goalSeg && npseg.index >= R.goalSeg) { R.phase = "goal"; R.phaseT = 0; A.sfx("goal"); A.sfx("cheer"); say("WE DID IT!!", 1, 3); }

    // phases
    if (R.phase === "countdown") {
      const n = Math.ceil(3 - R.phaseT);
      if (n !== R.lastCount && n > 0) { R.lastCount = n; A.sfx("beep"); }
      if (R.phaseT >= 3) { R.phase = "race"; R.phaseT = 0; A.sfx("beepHi"); say("LET'S GO!", 1, 1.4); }
    } else if (R.phase === "race") {
      R.time -= dt;
      if (R.time <= 10 && Math.floor(R.time + dt) !== Math.floor(R.time) && R.time > 0) A.sfx("tick");
      if (R.time <= 0) { R.time = 0; R.phase = "timeup"; R.phaseT = 0; say("OH NO...", 1, 3); }
      if (!G.cheat) R.score += sp * sp * 1600 * dt;
    } else if (R.phase === "timeup") {
      R.speed = Math.max(0, R.speed - MAXV * 0.35 * dt);
    } else if (R.phase === "goal") {
      R.speed = Math.max(MAXV * 0.15, R.speed - MAXV * 0.25 * dt);
      R.x = U.lerp(R.x, 0, dt);
    }

    // funny bits
    if (racing && R.crash <= 0) {
      const crest = npseg.p2.world.y - npseg.p1.world.y;
      if (R.lastSlope !== undefined && R.lastSlope > 15 && crest < -15 && sp > 0.7 && R.whee <= 0) { R.whee = 1.2; A.sfx("whee"); say("WHEEEE!", 1, 1.1); }
      R.lastSlope = crest;
      if (sp > 0.97 && Math.random() < 0.002 && !R.bubble) say(U.pick(["FASTER!", "I LOVE THIS SONG!", "TOO FAST!", "LOOK, THE SEA!"].filter((s) => s !== "LOOK, THE SEA!" || npseg.theme === "beach" || npseg.theme === "coast")), 1);
      if (Math.abs(pseg.curve) > 4 && sp > 0.8 && Math.random() < 0.004 && !R.bubble) say("HOLD ON!", 1);
    }
    // critters
    critters(dt, npseg);
    // particles
    for (let i = R.parts.length - 1; i >= 0; i--) { const p = R.parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.g) p.vy += p.g * dt; if (p.life <= 0) R.parts.splice(i, 1); }
    if (accel && sp < 0.3 && racing && Math.random() < 0.5) R.parts.push({ k: "smoke", x: LW / 2 + U.pick([-34, 34]), y: LH - 18, vx: U.rand(-10, 10), vy: U.rand(-30, -10), life: 0.8 });
    const squeal = R.crash <= 0 && Math.abs(R.steer) > 0.6 && sp > 0.6 && Math.abs(pseg.curve) > 2 ? 1 : 0;
    if (squeal && Math.random() < 0.6) R.parts.push({ k: "smoke", x: LW / 2 + U.pick([-50, 50]), y: LH - 12, vx: U.rand(-20, 20), vy: -10, life: 0.6 });
    // engine sound
    const rpm = R.gear ? Math.max(0, (sp - 0.25) / 0.75) : sp / 0.66;
    A.engineSet(U.clamp(rpm, 0, 1.05), accel, squeal * 0.8, onRoad(pseg, R.x) ? 0 : Math.min(1, sp * 2), sp);
  };

  function crash(soft) {
    R.crash = soft ? 1.4 : 2.8; R.crashSoft = !!soft; R.crashT = R.crash;
    A.sfx("crash");
    if (!soft) setTimeout(() => A.sfx("boing"), 350);
    say(soft ? "WHOA!" : "AAAAH!", 1, 1);
    for (let i = 0; i < 24; i++) R.parts.push({ k: "spark", x: LW / 2 + U.rand(-40, 40), y: LH - 40, vx: U.rand(-160, 160), vy: U.rand(-200, -40), g: 400, life: U.rand(0.4, 0.9) });
  }
  R.crashFn = crash;

  function critters(dt, seg) {
    const kind = Gfx.THEMES[seg.theme].critter;
    if (kind === "gull" && Math.random() < dt * 0.25) { R.critters.push({ k: "gull", x: -20, y: U.rand(20, 90), vx: U.rand(30, 60), t: 0 }); if (Math.random() < 0.5) A.sfx("gull"); }
    if (kind === "tumble" && Math.random() < dt * 0.15) R.critters.push({ k: "tumble", z: R.pos + PZ + SEG * U.rand(30, 60), x: -3, vx: U.rand(0.8, 1.4), t: 0 });
    if (kind === "cowmoo" && Math.random() < dt * 0.1) A.sfx("moo");
    for (let i = R.critters.length - 1; i >= 0; i--) {
      const c = R.critters[i];
      c.t += dt;
      if (c.k === "gull") { c.x += c.vx * dt; if (c.x > LW + 30) R.critters.splice(i, 1); }
      else { c.x += c.vx * dt; if (c.x > 3.5 || c.z < R.pos) R.critters.splice(i, 1); }
    }
  }

  /* ---------- Rendering ---------- */
  function project(p, cx, cy, cz) {
    p.camera.x = (p.world.x || 0) - cx; p.camera.y = p.world.y - cy; p.camera.z = p.world.z - cz;
    p.screen.scale = DEPTH / p.camera.z;
    p.screen.x = Math.round(LW / 2 + p.screen.scale * p.camera.x * LW / 2);
    p.screen.y = LH / 2 - p.screen.scale * p.camera.y * LH / 2; // not rounded: far segments are thinner than a pixel
    p.screen.w = Math.round(p.screen.scale * RW * LW / 2);
  }
  function quad(g, c, x1, y1, w1, x2, y2, w2) { g.fillStyle = c; g.beginPath(); g.moveTo(x1 - w1, y1); g.lineTo(x2 - w2, y2); g.lineTo(x2 + w2, y2); g.lineTo(x1 + w1, y1); g.closePath(); g.fill(); }

  // Segments are painted from back to front: first all ground strips, then all road surfaces.
  // Far away a segment is thinner than a pixel, so nothing may paint over a road that is already drawn.
  function drawGround(g, s) {
    const th = Gfx.THEMES[s.theme], p1 = s.p1.screen, p2 = s.p2.screen;
    g.fillStyle = th.ground[s.color]; g.fillRect(0, p2.y, LW, Math.min(p1.y, s.clip) - p2.y + 1);
  }
  // layer 0: rumble strips, 1: asphalt, 2: lane markings – each layer for all segments, so that the
  // soft edges of one segment never let the layer below shine through as a seam
  function drawRoad(g, s, layer) {
    const th = Gfx.THEMES[s.theme], c = s.color, p1 = s.p1.screen, p2 = s.p2.screen;
    const hidden = p1.y > s.clip + 0.5; // partly behind a hill crest
    if (hidden) { g.save(); g.beginPath(); g.rect(0, 0, LW, s.clip); g.clip(); }
    const y1 = p1.y + 0.75; // overlap the next nearer segment a little so no seams show between the quads
    for (const r of roadsOf(s)) {
      const x1 = p1.x + r.c * p1.w, x2 = p2.x + r.c * p2.w, w1 = p1.w * r.w, w2 = p2.w * r.w;
      if (layer === 0) quad(g, th.rumble[c], x1, y1, w1 * 1.12, x2, p2.y, w2 * 1.12);
      else if (layer === 1) quad(g, th.road[c], x1, y1, w1, x2, p2.y, w2);
      else if (c === 0) {
        const lanes = r.w > 0.8 ? [-0.5, 0, 0.5] : [0];
        for (const l of lanes) quad(g, th.lane, x1 + l * w1, p1.y, Math.max(0.35, w1 / 50), x2 + l * w2, p2.y, Math.max(0.35, w2 / 50));
      }
    }
    if (hidden) g.restore();
  }

  function drawSprite(g, img, scale, x, y, ww, alignX, clipY, flip) {
    const w = ww * SPRK * scale * LW / 2, h = w * img.height / img.width;
    const dx = x + w * alignX, dy = y - h;
    const clipH = clipY ? Math.max(0, dy + h - clipY) : 0;
    if (clipH >= h || w < 0.5) return null;
    const sh = img.height - (img.height * clipH) / h;
    if (flip) { g.save(); g.translate(dx + w, dy); g.scale(-1, 1); g.drawImage(img, 0, 0, img.width, sh, 0, 0, w, h - clipH); g.restore(); }
    else g.drawImage(img, 0, 0, img.width, sh, dx, dy, w, h - clipH);
    return { x: dx, y: dy, w, h };
  }

  R.render = function (g) {
    const base = findSeg(R.pos), bp = (R.pos % SEG) / SEG;
    const pseg = findSeg(R.pos + PZ), pp = ((R.pos + PZ) % SEG) / SEG;
    const py = U.lerp(pseg.p1.world.y, pseg.p2.world.y, pp);
    const node = R.curNode, prev = R.prevNode;
    // sky with a cross-fade after a checkpoint
    const horizon = LH / 2 + 10;
    if (R.themeMix < 1) Gfx.drawSky(g, prev.theme, prev.tod, horizon, R.skyX, R.t);
    Gfx.drawSky(g, node.theme, node.tod, horizon, R.skyX, R.t, R.themeMix);
    // gulls
    for (const c of R.critters) if (c.k === "gull") {
      const f = Math.sin(c.t * 10) * 3;
      g.strokeStyle = node.tod === 2 ? "#ccc" : "#fff"; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(c.x - 6, c.y - f); g.lineTo(c.x, c.y); g.lineTo(c.x + 6, c.y - f); g.stroke();
    }
    // road
    let maxy = LH, x = 0, dx = -(base.curve * bp);
    const visible = [], painted = [];
    for (let n = 0; n < DRAW; n++) {
      const s = R.segs[base.index + n];
      if (!s) break;
      s.clip = maxy;
      project(s.p1, R.x * RW - x, py + CAMH, R.pos);
      project(s.p2, R.x * RW - x - dx, py + CAMH, R.pos);
      x += dx; dx += s.curve;
      visible.push(s);
      if (s.p1.camera.z <= DEPTH || s.p2.screen.y > s.p1.screen.y || s.p2.screen.y >= maxy) continue;
      painted.push(s);
      maxy = s.p2.screen.y;
    }
    for (let i = painted.length - 1; i >= 0; i--) drawGround(g, painted[i]);
    for (let layer = 0; layer < 3; layer++) for (let i = painted.length - 1; i >= 0; i--) drawRoad(g, painted[i], layer);
    // sprites, traffic and critters from back to front
    R.glows.length = 0;
    for (let n = visible.length - 1; n > 0; n--) {
      const s = visible[n];
      if (s.p1.camera.z <= DEPTH) continue;
      for (const c of s.cars) {
        const pct = (c.z % SEG) / SEG;
        const sc = U.lerp(s.p1.screen.scale, s.p2.screen.scale, pct);
        const sx = U.lerp(s.p1.screen.x, s.p2.screen.x, pct) + sc * c.x * RW * LW / 2;
        const sy = U.lerp(s.p1.screen.y, s.p2.screen.y, pct);
        const img = Gfx.spr[c.key];
        const fade = U.clamp((c.zEnd - c.z) / (SEG * 25), 0, 1); // fades out before the fork
        g.globalAlpha = fade;
        const r = drawSprite(g, img, sc, sx, sy, img.def.ww, -0.5, s.clip);
        g.globalAlpha = 1;
        if (r && node.tod) R.glows.push([r.x + r.w * 0.15, r.y + r.h * 0.57, r.w * 0.2, "255,60,40"], [r.x + r.w * 0.85, r.y + r.h * 0.57, r.w * 0.2, "255,60,40"]);
      }
      for (const sp of s.sprites) {
        const img = Gfx.spr[sp.key];
        if (!img) continue;
        const sc = s.p1.screen.scale, sx = s.p1.screen.x + sc * sp.offset * RW * LW / 2, sy = s.p1.screen.y;
        const align = sp.offset === 0 || Math.abs(sp.offset) < 1.25 && img.def.ww > 3000 ? -0.5 : sp.offset < 0 ? -1 : 0;
        let yy = sy;
        const an = img.def.anim;
        if (an === "crowd") yy -= Math.abs(Math.sin(R.t * 8 + sp.offset)) * sc * 220 * LW / 2 * 0.02 * 10;
        const r = drawSprite(g, img, sc, sx, yy, img.def.ww, align, s.clip, sp.flip);
        if (!r) continue;
        if (an === "mill") {
          const hx = r.x + r.w * 0.5, hy = r.y + r.h * 0.3, L = r.w * 0.55, a0 = R.t * 2;
          g.strokeStyle = "#f0e8d8"; g.lineWidth = Math.max(1, r.w / 18);
          for (let k = 0; k < 4; k++) { const a = a0 + k * Math.PI / 2; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + Math.cos(a) * L, hy + Math.sin(a) * L); g.stroke(); }
        } else if (an === "flag") {
          const fx = r.x + r.w * 0.75, fy = r.y + r.h * (0.1 + 0.1 * Math.sin(R.t * 10));
          g.fillStyle = "#111"; g.fillRect(fx, fy, r.w * 0.06, r.h * 0.3);
          for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) { g.fillStyle = (k + j) % 2 ? "#fff" : "#111"; g.fillRect(fx + r.w * 0.06 + k * r.w * 0.1, fy + j * r.h * 0.07 + Math.sin(R.t * 12 + k) * r.h * 0.02, r.w * 0.1, r.h * 0.07); }
        } else if (an === "cow" && Math.sin(R.t * 3 + sp.t) > 0.8) {
          g.fillStyle = "#fff"; g.font = `${Math.max(6, r.w * 0.3) | 0}px monospace`; g.fillText("MOO", r.x, r.y - 2);
        }
        if (img.def.glow && node.tod) for (const [gx, gy, col, a] of img.def.glow) R.glows.push([r.x + r.w * gx, r.y + r.h * gy, r.w * 0.8 * a, col]);
      }
      for (const c of R.critters) if (c.k === "tumble" && findSeg(c.z) === s) {
        const sc = s.p1.screen.scale, sx = s.p1.screen.x + sc * c.x * RW * LW / 2, rr = sc * 260 * LW / 2;
        g.save(); g.translate(sx, s.p1.screen.y - rr); g.rotate(c.t * 6);
        g.strokeStyle = "#a07a3a"; g.lineWidth = Math.max(1, rr / 6);
        for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(0, 0, rr * (0.5 + k * 0.15), k, k + 4); g.stroke(); }
        g.restore();
      }
      if (s === pseg) drawPlayer(g, pseg);
    }
    if (!visible.includes(pseg)) drawPlayer(g, pseg);
    // particles
    for (const p of R.parts) {
      const a = Math.min(1, p.life * 2);
      if (p.k === "dust") { g.fillStyle = p.col; g.globalAlpha = a; g.fillRect(p.x, p.y, 4, 4); }
      else if (p.k === "smoke") { g.fillStyle = "rgba(220,220,220,0.5)"; g.globalAlpha = a * 0.6; g.beginPath(); g.arc(p.x, p.y, 6 + (1 - p.life) * 10, 0, TAU); g.fill(); }
      else if (p.k === "spark") { g.fillStyle = "#ffd040"; g.globalAlpha = a; g.fillRect(p.x, p.y, 2, 2); }
      else if (p.k === "confetti") { g.fillStyle = p.col; g.globalAlpha = 1; g.fillRect(p.x, p.y, 3, 2); }
    }
    g.globalAlpha = 1;
    // time of day overlay and lights
    if (node.tod) {
      g.globalCompositeOperation = "multiply";
      g.fillStyle = node.tod === 2 ? "#4a4a90" : "#ffc8a0";
      g.globalAlpha = R.themeMix; g.fillRect(0, 0, LW, LH);
      g.globalAlpha = 1;
      g.globalCompositeOperation = "lighter";
      for (const [gx, gy, r, col] of R.glows) { g.globalAlpha = 0.7; g.drawImage(tint(col), gx - r, gy - r, r * 2, r * 2); }
      if (node.tod === 2) { g.globalAlpha = 0.25; g.drawImage(tint("255,240,200"), LW / 2 - 200, LH / 2 + 10, 400, 140); }
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";
    }
    if (Gfx.THEMES[node.theme].ash) { g.fillStyle = "rgba(255,140,60,0.7)"; for (let i = 0; i < 30; i++) g.fillRect((i * 97 + R.t * 40 * (1 + i % 3)) % LW, (i * 53 + R.t * 30) % LH, 1.5, 1.5); }
  };
  const tints = {};
  function tint(col) {
    if (tints[col]) return tints[col];
    const c = document.createElement("canvas"); c.width = c.height = 32;
    const g = c.getContext("2d"), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, `rgba(${col},1)`); gr.addColorStop(0.35, `rgba(${col},0.45)`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    return (tints[col] = c);
  }

  /* ---------- The convertible and its two passengers ---------- */
  function drawPlayer(g, pseg) {
    const sp = R.speed / R.MAXV, off = !onRoad(pseg, R.x);
    const bounce = (off ? Math.sin(R.t * 40) * 2 * sp : 0) + (R.bump > 0 ? Math.sin(R.bump * 40) * 3 : 0) + Math.sin(R.t * 30) * sp * 0.6;
    const slope = U.clamp((pseg.p2.world.y - pseg.p1.world.y) / 60, -1, 1);
    let cx = LW / 2, cy = LH - 10 + bounce;
    if (R.crash > 0) {
      const k = 1 - R.crash / R.crashT;
      if (R.crashSoft) { g.save(); g.translate(cx, cy - 25); g.rotate(k * TAU * 1.5); g.translate(-cx, -(cy - 25)); drawCar(g, cx, cy, 0, 0, true); g.restore(); return; }
      // flip into the air, land, occupants fly out and sit dazed on the road
      const jump = Math.sin(Math.min(1, k * 1.8) * Math.PI) * 70;
      g.save(); g.translate(cx, cy - 30 - jump); g.scale(1, Math.cos(Math.min(1, k * 1.8) * TAU)); g.translate(-cx, -(cy - 30));
      drawCar(g, cx, cy, 0, 0, false, true);
      g.restore();
      for (const who of [0, 1]) {
        const s = who ? 1 : -1, t = Math.min(1, k * 1.4);
        const px = cx + s * (30 + t * 110), pyy = cy - 40 - Math.sin(t * Math.PI) * 110 + (t >= 1 ? 26 : 0);
        drawPerson(g, px, pyy, who, t >= 1 ? "dazed" : "fly", k);
      }
      if (k > 0.55 && Math.floor(R.t * 8) % 2) { g.fillStyle = "#ffe040"; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const a = R.t * 6 + i * 2.1; g.fillRect(cx + s * 140 + Math.cos(a) * 12, cy - 54 + Math.sin(a) * 4, 3, 3); } }
      return;
    }
    drawCar(g, cx, cy, R.steer, slope, false);
    // occupants
    const hair = Math.sin(R.t * 25) * sp;
    const wave = R.phase === "goal" || R.whee > 0;
    drawPerson(g, cx - 18 + R.steer * 3, cy - 46, 0, R.slap > 0 ? "slapped" : sp > 0.95 && R.gear ? "fist" : "drive", hair);
    let pose = "sit";
    if (wave) pose = "cheer"; else if (R.slap > 0) pose = "slap"; else if (off && sp > 0.3) pose = "scared"; else if (R.critters.some((c) => c.k === "gull")) pose = "point";
    drawPerson(g, cx + 18 + R.steer * 3, cy - 45, 1, pose, hair);
    // speech bubble
    if (R.bubble) {
      const b = R.bubble, bx = cx + (b.who ? 50 : -50), by = cy - 92;
      g.font = "bold 9px monospace"; const w = g.measureText(b.text).width + 10;
      g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(bx - w / 2, by - 9, w, 16, 4); g.fill();
      g.beginPath(); g.moveTo(bx + (b.who ? -10 : 10), by + 6); g.lineTo(bx + (b.who ? -20 : 20), by + 16); g.lineTo(bx + (b.who ? -2 : 2), by + 6); g.fill();
      g.fillStyle = "#111"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(b.text, bx, by); g.textAlign = "left"; g.textBaseline = "alphabetic";
    }
  }

  function drawCar(g, cx, cy, steer, slope, spin, flipped) {
    const W = 150, sk = steer * 6;
    const braking = R.brake > 0 || R.phase === "timeup";
    g.save();
    // shadow
    g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.ellipse(cx, cy, 82, 9, 0, 0, TAU); g.fill();
    // tyres
    const tread = Math.floor(R.t * R.speed / 600) % 2;
    for (const s of [-1, 1]) {
      g.fillStyle = "#151515"; g.fillRect(cx + s * 60 - 13 + sk * 0.3, cy - 26, 26, 26);
      g.fillStyle = tread ? "#2a2a2a" : "#202020"; for (let i = 0; i < 4; i++) g.fillRect(cx + s * 60 - 12 + sk * 0.3, cy - 24 + i * 6 + tread * 3, 24, 2);
    }
    // body (convertible, seen from behind)
    const top = cy - 58 - slope * 4;
    const gr = g.createLinearGradient(0, top, 0, cy - 10);
    gr.addColorStop(0, "#ff7a6a"); gr.addColorStop(0.35, "#e0242a"); gr.addColorStop(1, "#7a0a10");
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(cx - W / 2 + sk, cy - 14);
    g.lineTo(cx - W / 2 + 4 + sk, top + 16);
    g.quadraticCurveTo(cx - W / 2 + 8 + sk, top + 6, cx - W / 2 + 22 + sk, top + 4);
    g.lineTo(cx + W / 2 - 22 + sk, top + 4);
    g.quadraticCurveTo(cx + W / 2 - 8 + sk, top + 6, cx + W / 2 - 4 + sk, top + 16);
    g.lineTo(cx + W / 2 + sk, cy - 14);
    g.closePath(); g.fill();
    // cockpit opening
    g.fillStyle = "#3a0a0e"; g.beginPath(); g.roundRect(cx - 52 + sk * 1.2, top - 2, 104, 12, 5); g.fill();
    // windscreen frame
    g.strokeStyle = "rgba(200,230,255,0.7)"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 46 + sk * 1.5, top - 1); g.lineTo(cx - 40 + sk * 1.6, top - 22); g.lineTo(cx + 40 + sk * 1.6, top - 22); g.lineTo(cx + 46 + sk * 1.5, top - 1); g.stroke();
    // highlight, chrome bumper, plate, lights, exhausts
    g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(cx - W / 2 + 22 + sk, top + 6, W - 44, 2);
    g.fillStyle = "#d8dce4"; g.fillRect(cx - W / 2 + 2 + sk, cy - 18, W - 4, 5);
    g.fillStyle = "#f4f0d8"; g.fillRect(cx - 16 + sk, top + 26, 32, 12); g.fillStyle = "#222"; g.font = "bold 8px monospace"; g.textAlign = "center"; g.fillText("SUN 86", cx + sk, top + 35); g.textAlign = "left";
    for (const s of [-1, 1]) {
      for (let i = 0; i < 2; i++) {
        const lx = cx + s * (56 - i * 15) + sk;
        g.fillStyle = "#3a0004"; g.beginPath(); g.arc(lx, top + 22, 7, 0, TAU); g.fill();
        g.fillStyle = braking ? "#ff6a5a" : "#c0141a"; g.beginPath(); g.arc(lx, top + 22, 5, 0, TAU); g.fill();
        if (braking) { g.fillStyle = "#ffe0d0"; g.fillRect(lx - 1, top + 20, 2, 2); }
      }
      g.fillStyle = "#9aa0aa"; g.beginPath(); g.ellipse(cx + s * 30 + sk, cy - 11, 5, 3, 0, 0, TAU); g.fill();
      g.fillStyle = "#222"; g.beginPath(); g.ellipse(cx + s * 30 + sk, cy - 11, 3, 2, 0, 0, TAU); g.fill();
    }
    if (flipped) { g.fillStyle = "#555"; g.fillRect(cx - 40, top - 4, 80, 6); }
    if (braking && R.curNode.tod) { g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.5; for (const s of [-1, 1]) g.drawImage(tint("255,60,40"), cx + s * 48 - 20, top + 2, 40, 40); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; }
    g.restore();
  }

  // who: 0 driver (dark quiff, sunglasses), 1 passenger (big magenta curls, yellow scarf)
  function drawPerson(g, x, y, who, pose, anim) {
    g.save();
    const skin = "#f0c090";
    if (pose === "fly" || pose === "dazed") {
      const rot = pose === "fly" ? anim * 20 : 0;
      g.translate(x, y); g.rotate(rot);
      g.fillStyle = who ? "#40c0ff" : "#ffffff"; g.fillRect(-7, -2, 14, 14);
      g.fillStyle = "#334"; g.fillRect(-7, 12, 5, 8); g.fillRect(2, 12, 5, 8);
      if (pose === "dazed") { g.fillStyle = skin; g.fillRect(-12, 0, 5, 4); g.fillRect(7, 0, 5, 4); }
      else { g.fillStyle = skin; g.fillRect(-13, -6, 6, 3); g.fillRect(7, -8, 6, 3); }
      head(g, 0, -9, who, 0);
      g.restore();
      return;
    }
    // shoulders and back
    g.fillStyle = who ? "#40c0ff" : "#ffffff";
    g.beginPath(); g.roundRect(x - 11, y + 2, 22, 14, 5); g.fill();
    g.fillStyle = skin;
    if (pose === "drive" || pose === "slapped") { g.fillRect(x - 15, y + 6, 4, 8); g.fillRect(x + 11, y + 6, 4, 8); }
    if (pose === "fist") { g.fillRect(x + 10, y - 16, 4, 20); g.fillRect(x + 8, y - 20, 8, 6); g.fillRect(x - 15, y + 6, 4, 8); }
    if (pose === "cheer") { const w = Math.sin(R.t * 14) * 3; g.fillRect(x - 15 + w, y - 18, 4, 22); g.fillRect(x + 11 - w, y - 18, 4, 22); }
    if (pose === "point") { g.fillRect(x + 8, y - 8, 4, 12); g.fillRect(x + 10, y - 14, 4, 8); }
    if (pose === "scared") { g.fillRect(x - 12, y - 14, 4, 14); g.fillRect(x + 8, y - 14, 4, 14); }
    if (pose === "slap") { const a = Math.sin(R.slap * 30); g.fillRect(x - 14 - Math.abs(a) * 10, y - 4, 14, 4); }
    head(g, x, y - 6, who, anim, pose === "slapped");
    g.restore();
  }
  function head(g, x, y, who, anim, slapped) {
    g.fillStyle = "#f0c090"; g.beginPath(); g.ellipse(x, y, 7, 8, 0, 0, TAU); g.fill();
    if (who === 0) {
      g.fillStyle = "#2a1a10"; g.beginPath(); g.ellipse(x, y - 3, 8, 7, 0, Math.PI, TAU); g.fill();
      g.beginPath(); g.ellipse(x + 2 + anim * 2, y - 9, 6, 4, -0.3, 0, TAU); g.fill();
      g.fillRect(x - 8, y - 3, 16, 6);
      g.fillStyle = "#111"; g.fillRect(x - 9, y - 1, 3, 2); g.fillRect(x + 6, y - 1, 3, 2);
      if (slapped) { g.fillStyle = "#ff5a5a"; g.fillRect(x + 4, y + 2, 4, 3); }
    } else {
      g.fillStyle = "#e040a0";
      for (let i = 0; i < 7; i++) { const a = -Math.PI + (i / 6) * Math.PI; g.beginPath(); g.arc(x + Math.cos(a) * 8 + anim * 3, y - 2 + Math.sin(a) * 8, 5, 0, TAU); g.fill(); }
      g.beginPath(); g.ellipse(x + anim * 2, y + 3, 9, 7, 0, 0, TAU); g.fill();
      g.fillStyle = "#ffe040"; g.fillRect(x - 8, y + 6, 16, 3);
      g.beginPath(); g.moveTo(x - 6, y + 8); g.quadraticCurveTo(x - 22, y + 6 + anim * 6, x - 30 - Math.abs(anim) * 6, y + 2 + anim * 8); g.lineTo(x - 28, y + 8 + anim * 6); g.quadraticCurveTo(x - 18, y + 12, x - 4, y + 10); g.fill();
    }
  }
  R.drawCar = drawCar; R.drawPerson = drawPerson;
})(window.XA);
