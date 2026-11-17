/* Mole Mayhem: the simulation of one match – teams and turns, mole movement and physics,
   weapons, projectiles, explosions, barrels, mines, crates, water and sudden death */
"use strict";

(function (MM) {
  const { U, T } = MM;
  const G = (MM.G = { on: null });
  const emit = (type, d) => { if (G.on) G.on(type, d); };

  const GRAV = (G.GRAV = 430);
  const WALK = 46, STEP_UP = 6;

  /* ---------- weapons ---------- */
  const W = (G.WEAPONS = {
    bazooka: { name: "Bazooka", aim: true, charge: true, count: Infinity, wind: true },
    homing: { name: "Homing Missile", aim: true, charge: true, target: true, count: 1 },
    grenade: { name: "Grenade", aim: true, charge: true, fuse: true, count: Infinity },
    cluster: { name: "Cluster Bomb", aim: true, charge: true, fuse: true, count: 3 },
    shotgun: { name: "Shotgun", aim: true, count: Infinity, shots: 2 },
    bat: { name: "Baseball Bat", aim: true, count: 2 },
    dynamite: { name: "Dynamite", count: 1 },
    mine: { name: "Mine", count: 2 },
    airstrike: { name: "Air Strike", target: true, count: 1 },
    drill: { name: "Drill", count: 2 },
    torch: { name: "Blowtorch", aim: true, count: 2 },
    girder: { name: "Girder", target: true, count: 2 },
    teleport: { name: "Teleport", target: true, count: 2 },
    jetpack: { name: "Jetpack", count: 1, free: true },
    rope: { name: "Grappling Hook", aim: true, count: 5, free: true },
    skip: { name: "Skip Turn", count: Infinity },
    surrender: { name: "Surrender", count: Infinity },
  });
  G.WEAPON_ORDER = ["bazooka", "homing", "grenade", "cluster", "shotgun", "bat", "dynamite", "mine", "airstrike", "drill", "torch", "girder", "teleport", "jetpack", "rope", "skip", "surrender"];
  const CRATE_LOOT = ["homing", "cluster", "cluster", "dynamite", "mine", "airstrike", "girder", "teleport", "jetpack", "drill", "torch", "bat"];

  /* ---------- match setup ---------- */
  G.start = function (cfg) {
    const t = T.generate({ seed: cfg.seed, theme: cfg.theme, style: cfg.style });
    const s = {
      cfg, t, teams: [], moles: [], objs: [], fx: [], texts: [], water: T.SEA, wind: 0,
      phase: "start", phaseT: 0, turnT: 0, turnN: 0, round: 0, cur: null, team: -1, weapon: "bazooka",
      aim: -0.3, power: 0, charging: false, fuse: 3, shotsLeft: 0, used: false, over: null, focus: null, shake: 0, time: 0,
      tool: null, sudden: false, nextId: 1,
    };
    G.s = s;
    const rnd = U.rng(cfg.seed * 7 + 1);
    const spots = surfaceSpots(t, s, rnd, 70);
    const nM = cfg.moles || 4;
    const names = U.shuffle(MOLE_NAMES.slice());
    let ni = 0;
    cfg.teams.forEach((tc, ti) => {
      const team = { id: ti, col: tc.col, name: tc.name, ctrl: tc.ctrl, level: tc.level, moles: [], inv: {}, idx: -1, alive: true };
      for (const k of G.WEAPON_ORDER) team.inv[k] = W[k].count;
      s.teams.push(team);
    });
    // spread the moles: teams take turns picking spots
    for (let k = 0; k < nM; k++) for (const team of s.teams) {
      const sp = spots.length ? spots.splice(Math.floor(rnd() * spots.length), 1)[0] : { x: 200 + rnd() * 2000, y: 100 };
      const m = { id: s.nextId++, team: team.id, col: team.col, name: names[ni++ % names.length], x: sp.x, y: sp.y, vx: 0, vy: 0, hp: cfg.hp || 100, dir: rnd() < 0.5 ? 1 : -1,
        st: "air", t: 0, dmg: 0, dead: false, shown: cfg.hp || 100, fallVy: 0 };
      team.moles.push(m); s.moles.push(m);
      // keep other spots away from this one
      for (let i = spots.length - 1; i >= 0; i--) if (Math.hypot(spots[i].x - sp.x, spots[i].y - sp.y) < 70) spots.splice(i, 1);
    }
    // barrels and mines
    const nB = cfg.barrels !== undefined ? cfg.barrels : 6, nMi = cfg.mines ? 7 : 0;
    for (let k = 0; k < nB + nMi && spots.length; k++) {
      const sp = spots.splice(Math.floor(rnd() * spots.length), 1)[0];
      if (s.moles.some((m) => Math.hypot(m.x - sp.x, m.y - sp.y) < 50)) continue;
      if (k < nB) s.objs.push({ id: s.nextId++, type: "barrel", x: sp.x, y: sp.y, vx: 0, vy: 0, hp: 30, rest: false });
      else s.objs.push({ id: s.nextId++, type: "mine", x: sp.x, y: sp.y, vx: 0, vy: 0, armed: true, fuseT: -1, rest: false });
    }
    s.wind = randWind(rnd);
    nextTurn(s, true);
    return s;
  };
  const MOLE_NAMES = ["Digby", "Mo", "Clod", "Burrows", "Nibs", "Tunnel", "Molly", "Pip", "Rufus", "Soot", "Velvet", "Grub", "Bramble", "Truffle", "Loam", "Clay",
    "Pebble", "Dusty", "Spade", "Root", "Mossy", "Basil", "Hazel", "Flint", "Gravel", "Cocoa", "Patch", "Wiggles", "Snout", "Biscuit", "Mudge", "Tater"];
  function randWind(rnd = Math.random) { return Math.round((rnd() * 2 - 1) ** 3 * 100); }
  G.windAccel = () => G.s.wind * 1.4;

  // places to stand: ground with free space above, above the water, away from the edges
  function surfaceSpots(t, s, rnd, gap) {
    const out = [];
    for (let k = 0; k < 1400 && out.length < 120; k++) {
      const x = 80 + Math.floor(rnd() * (t.w - 160));
      // pick a random free point and drop down
      let y = 40 + Math.floor(rnd() * (s.water - 120));
      if (T.solid(t, x, y)) continue;
      while (y < s.water - 30 && !T.solid(t, x, y + 1)) y++;
      if (y >= s.water - 40) continue;
      if (!T.free(t, x, y - 12, 9) || T.solid(t, x, y - 26)) continue;
      if (out.some((p) => Math.hypot(p.x - x, p.y - y) < gap)) continue;
      out.push({ x, y });
    }
    return out;
  }

  /* ---------- turns ---------- */
  function nextTurn(s, first) {
    s.turnN++;
    if (!first) { s.wind = randWind(); }
    // sudden death: the sea rises
    if (s.cfg.sudden && s.turnN > s.cfg.sudden * s.teams.length + 1) {
      if (!s.sudden) { s.sudden = true; emit("sudden"); }
      s.water -= 14;
    }
    // next team with living moles
    for (let k = 0; k < s.teams.length; k++) {
      s.team = (s.team + 1) % s.teams.length;
      const team = s.teams[s.team];
      if (team.moles.some((m) => !m.dead)) break;
    }
    const team = s.teams[s.team];
    for (let k = 0; k < team.moles.length; k++) {
      team.idx = (team.idx + 1) % team.moles.length;
      if (!team.moles[team.idx].dead) break;
    }
    s.cur = team.moles[team.idx];
    s.phase = "start"; s.phaseT = 0; s.turnT = s.cfg.turnTime || 45; s.used = false; s.charging = false; s.power = 0;
    s.shotsLeft = 0; s.tool = null; s.target = null;
    if (!team.inv[s.weapon] || s.weapon === "skip" || s.weapon === "surrender") s.weapon = "bazooka";
    s.focus = s.cur;
    for (const m of s.moles) m.dmg = 0;
    // a crate drops now and then
    if (!first && Math.random() < 0.45) dropCrate(s);
    emit("turn", { team, mole: s.cur });
  }
  function dropCrate(s) {
    for (let k = 0; k < 30; k++) {
      const x = 100 + Math.random() * (s.t.w - 200);
      let y = 10;
      while (y < s.water - 20 && !T.solid(s.t, x, y + 1)) y++;
      if (y >= s.water - 30) continue;
      const kind = Math.random() < 0.4 ? "health" : "weapon";
      s.objs.push({ id: s.nextId++, type: "crate", kind, x, y: -30, vx: 0, vy: 0, chute: true, rest: false });
      emit("crate");
      return;
    }
  }

  /* ---------- the main step ---------- */
  G.update = function (dt) {
    const s = G.s;
    s.time += dt;
    s.shake = Math.max(0, s.shake - dt * 3);
    for (const tx of s.texts) { tx.t += dt; tx.y -= 22 * dt; }
    s.texts = s.texts.filter((x) => x.t < 2.2);
    updateFx(s, dt);
    if (s.over) { physics(s, dt); return; }
    s.phaseT += dt;
    if (s.phase === "start") {
      physics(s, dt);
      if (s.phaseT > 1.0 && quiet(s)) s.phase = "play";
      return;
    }
    if (s.phase === "play" || s.phase === "retreat") {
      s.turnT -= dt;
      if (s.turnT <= 5 && s.turnT + dt > 5 && s.phase === "play") emit("hurry");
      if (s.turnT <= 0) {
        if (s.charging) release(s);
        endTurn(s);
      }
    }
    if (s.tool) updateTool(s, dt);
    physics(s, dt);
    // the active mole fell into the sea or was hurt enough: the turn ends
    if ((s.phase === "play" || s.phase === "retreat") && (s.cur.dead || s.cur.st === "drown")) endTurn(s);
    if (s.phase === "settle") {
      if (s.phaseT > 0.6 && quiet(s)) settle(s);
    }
  };
  function endTurn(s) {
    if (s.phase === "settle") return;
    s.charging = false;
    if (s.tool) stopTool(s);
    s.phase = "settle"; s.phaseT = 0;
  }
  G.endTurn = () => endTurn(G.s);
  // nothing moving any more
  function quiet(s) {
    if (s.objs.some((o) => !o.rest && o.type !== "crate" || (o.type === "mine" && o.fuseT >= 0) || (o.type === "dynamite") || (o.type === "barrel" && o.burn >= 0))) return false;
    if (s.moles.some((m) => !m.dead && (m.st === "air" || m.st === "drown" || m.st === "rope" || m.st === "jet"))) return false;
    return true;
  }
  function settle(s) {
    // losers explode one after another
    const dying = s.moles.find((m) => !m.dead && m.hp <= 0);
    if (dying) {
      dying.dead = true; dying.hp = 0;
      emit("die", dying);
      explode(s, dying.x, dying.y - 10, 22, 12, null, true);
      s.focus = dying;
      s.phaseT = 0;
      return;
    }
    for (const m of s.moles) m.shown = m.hp;
    for (const team of s.teams) team.alive = team.moles.some((m) => !m.dead);
    const alive = s.teams.filter((tm) => tm.alive);
    if (alive.length <= 1) {
      s.over = { winner: alive.length ? alive[0] : null };
      s.phase = "over";
      emit("over", s.over);
      return;
    }
    nextTurn(s);
  }

  /* ---------- player actions ---------- */
  const canAct = () => { const s = G.s; return s.phase === "play" || s.phase === "retreat"; };
  G.canFire = () => G.s.phase === "play" && !G.s.used && G.s.cur.st === "stand";
  G.walk = function (dir, dt) {
    const s = G.s, m = s.cur;
    if (!canAct() || s.charging) return;
    if (m.st === "rope") { m.ropeSwing = dir; return; }
    if (m.st === "jet") { m.jetX = dir; return; }
    if (m.st !== "stand" && m.st !== "walk") return;
    if (dir !== m.dir) { m.dir = dir; m.walkAcc = 0; return; }
    m.st = "walk"; m.walking = true;
    m.walkAcc = (m.walkAcc || 0) + WALK * dt;
    while (m.walkAcc >= 1) { m.walkAcc -= 1; if (!stepWalk(s, m)) { m.walkAcc = 0; break; } }
  };
  function stepWalk(s, m) {
    const nx = m.x + m.dir;
    if (!blocked(s, nx, m.y)) {
      m.x = nx;
      let d = 0;
      while (d < 5 && !feetHit(s, m.x, m.y + 1 + d)) d++;
      if (d >= 5) { m.st = "air"; m.vx = m.dir * 20; m.vy = 0; m.fallY = m.y; }
      else m.y += d;
      pickCrates(s, m);
      return true;
    }
    for (let up = 1; up <= STEP_UP; up++) if (!blocked(s, nx, m.y - up)) { m.x = nx; m.y -= up; pickCrates(s, m); return true; }
    return false;
  }
  G.jump = function (back) {
    const s = G.s, m = s.cur;
    if (!canAct() || s.charging) return;
    if (m.st === "rope") { m.st = "air"; m.fallY = m.y; s.rope = null; emit("rope"); return; }
    if (m.st !== "stand" && m.st !== "walk") return;
    m.st = "air"; m.fallY = m.y;
    if (back) { m.vx = -m.dir * 55; m.vy = -330; } else { m.vx = m.dir * 115; m.vy = -215; }
    m.y -= 2;
    emit("jump", m);
  };
  G.aimBy = function (d) { const s = G.s; if (!canAct()) return; s.aim = U.clamp(s.aim + d, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02); };
  G.setWeapon = function (k) {
    const s = G.s, team = s.teams[s.team];
    if (!canAct() || s.used || s.charging || !(team.inv[k] > 0)) return false;
    if (s.cur.st === "rope" || s.cur.st === "jet") return false;
    s.weapon = k; s.target = null;
    return true;
  };
  G.setTarget = function (x, y) {
    const s = G.s;
    if (!G.canFire()) return false;
    const w = s.weapon;
    if (w === "teleport") {
      if (!T.free(s.t, x, y - 12, 11) || y > s.water - 10) return false;
      use(s);
      emit("teleport", { from: { x: s.cur.x, y: s.cur.y }, to: { x, y } });
      s.cur.x = Math.round(x); s.cur.y = Math.round(y); s.cur.st = "air"; s.cur.vx = 0; s.cur.vy = 0; s.cur.fallY = s.cur.y;
      endTurn(s);
      return true;
    }
    if (w === "girder") {
      const m = s.cur, a = s.girderAng || 0, L = 46;
      if (Math.hypot(x - m.x, y - m.y) > 260) return false;
      const x0 = x - Math.cos(a) * L, y0 = y - Math.sin(a) * L, x1 = x + Math.cos(a) * L, y1 = y + Math.sin(a) * L;
      if (s.moles.some((q) => !q.dead && distSeg(q.x, q.y - 11, x0, y0, x1, y1) < 16)) return false;
      use(s);
      T.girder(s.t, x0, y0, x1, y1, 9);
      emit("girder");
      retreat(s);
      return true;
    }
    if (w === "airstrike") {
      use(s);
      const dir = x < s.cur.x ? -1 : 1;
      for (let k = 0; k < 5; k++) s.objs.push({ id: s.nextId++, type: "airbomb", x: x - dir * 300 + (k - 2) * 26 - dir * 40, y: -40 - k * 6, vx: dir * 190, vy: 60, rest: false, age: 0 });
      emit("airstrike");
      s.focus = { x, y: Math.min(y, 300) };
      retreat(s);
      return true;
    }
    if (w === "homing") { s.target = { x, y }; emit("target"); return true; }
    return false;
  };
  function distSeg(px, py, x0, y0, x1, y1) {
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy;
    const t = U.clamp(((px - x0) * dx + (py - y0) * dy) / l2, 0, 1);
    return Math.hypot(x0 + dx * t - px, y0 + dy * t - py);
  }
  function use(s) {
    const team = s.teams[s.team];
    if (team.inv[s.weapon] !== Infinity) team.inv[s.weapon]--;
    s.used = true;
  }
  function retreat(s) { s.phase = "retreat"; s.turnT = Math.min(s.turnT, s.cfg.retreat || 4); }

  // fire button: press starts charging (or fires at once), release fires
  G.firePress = function () {
    const s = G.s, w = W[s.weapon], m = s.cur;
    if (m.st === "jet") { m.st = "air"; m.fallY = m.y; return; }
    if (m.st === "rope") return;
    if (!G.canFire()) return;
    if (w.target && s.weapon !== "homing") return; // those need a click on the map
    if (s.weapon === "homing" && !s.target) { emit("needTarget"); return; }
    if (w.charge) { s.charging = true; s.power = 0; return; }
    fireNow(s);
  };
  G.fireRelease = function () { const s = G.s; if (s.charging) release(s); };
  G.chargeTick = function (dt) {
    const s = G.s;
    if (!s.charging) return;
    s.power = Math.min(1, s.power + dt / 1.25);
    if (s.power >= 1) release(s);
  };
  function aimVec(s) {
    const a = s.aim, m = s.cur;
    return { x: Math.cos(a) * m.dir, y: Math.sin(a) };
  }
  G.aimVec = () => aimVec(G.s);
  function release(s) {
    s.charging = false;
    const m = s.cur, v = aimVec(s), p = Math.max(0.08, s.power), sp = 60 + 640 * p;
    const ox = m.x + v.x * 16, oy = m.y - 12 + v.y * 16;
    const k = s.weapon;
    use(s);
    if (k === "bazooka" || k === "homing") {
      s.objs.push({ id: s.nextId++, type: k === "homing" ? "missile" : "rocket", x: ox, y: oy, vx: v.x * sp, vy: v.y * sp, rest: false, age: 0, target: s.target, owner: m.id });
      emit("launch");
    } else {
      s.objs.push({ id: s.nextId++, type: k, x: ox, y: oy, vx: v.x * sp * 0.85, vy: v.y * sp * 0.85, rest: false, age: 0, fuseT: s.fuse, owner: m.id, spin: 0 });
      emit("throw");
    }
    s.focus = s.objs[s.objs.length - 1];
    retreat(s);
  }
  function fireNow(s) {
    const k = s.weapon, m = s.cur, v = aimVec(s);
    if (k === "skip") { endTurn(s); return; }
    if (k === "surrender") {
      for (const q of s.teams[s.team].moles) if (!q.dead) q.hp = 0;
      emit("surrender");
      endTurn(s);
      return;
    }
    if (k === "shotgun") {
      if (!s.shotsLeft) { s.shotsLeft = 2; }
      shoot(s, m, v);
      s.shotsLeft--;
      if (s.shotsLeft <= 0) { use(s); retreat(s); }
      return;
    }
    if (k === "bat") {
      use(s);
      emit("whack");
      let hit = false;
      for (const q of s.moles) {
        if (q === m || q.dead) continue;
        const dx = q.x - m.x, dy = (q.y - 10) - (m.y - 10);
        if (Math.abs(dy) < 22 && dx * m.dir > -4 && Math.abs(dx) < 30) {
          hurt(s, q, 30);
          const sp = 560;
          q.st = "air"; q.vx = v.x * sp; q.vy = v.y * sp - 40; q.fallY = q.y; q.y -= 2;
          hit = true;
          s.focus = q;
        }
      }
      if (hit) s.shake = 0.5;
      retreat(s);
      return;
    }
    if (k === "dynamite" || k === "mine") {
      use(s);
      const o = { id: s.nextId++, type: k, x: m.x + m.dir * 10, y: m.y - 6, vx: m.dir * 30, vy: -40, rest: false, age: 0, fuseT: k === "dynamite" ? 5 : -1, armT: k === "mine" ? 2.5 : 0, armed: k !== "mine" };
      s.objs.push(o);
      emit("throw");
      retreat(s);
      return;
    }
    if (k === "drill" || k === "torch") {
      use(s);
      s.tool = { kind: k, t: 0, acc: 0, dir: m.dir, ang: k === "torch" ? U.clamp(s.aim, -0.8, 0.8) : Math.PI / 2 };
      emit(k);
      return;
    }
    if (k === "jetpack") {
      use(s);
      m.st = "jet"; m.fuel = 6; m.vx = 0; m.vy = -60; m.y -= 3; m.fallY = m.y;
      emit("jet");
      return;
    }
    if (k === "rope") {
      // shoot a hook along the aim and hang on where it bites
      let x = m.x, y = m.y - 14;
      for (let d = 0; d < 340; d += 2) {
        x += v.x * 2; y += v.y * 2;
        if (T.solid(s.t, x, y)) {
          use(s); s.used = false; // the hook does not end the turn
          s.rope = { x, y, len: Math.max(24, Math.hypot(x - m.x, y - (m.y - 12))) };
          m.st = "rope"; m.vx *= 0.5; m.vy *= 0.5; m.fallY = m.y;
          emit("rope");
          return;
        }
      }
      emit("deny");
    }
  }
  function shoot(s, m, v) {
    emit("shot");
    let x = m.x + v.x * 14, y = m.y - 12 + v.y * 14;
    for (let d = 0; d < 900; d += 2) {
      x += v.x * 2; y += v.y * 2;
      const q = s.moles.find((q) => q !== m && !q.dead && Math.hypot(q.x - x, q.y - 11 - y) < 11);
      if (q) {
        hurt(s, q, 25);
        q.st = "air"; q.vx += v.x * 220; q.vy += v.y * 220 - 90; q.fallY = q.y; q.y -= 1;
        T.carve(s.t, x, y, 8);
        addBoom(s, x, y, 10);
        s.focus = q;
        return;
      }
      const o = s.objs.find((o) => (o.type === "barrel" || o.type === "mine" || o.type === "crate") && Math.hypot(o.x - x, o.y - 10 - y) < 11);
      if (o) { damageObj(s, o, 30); addBoom(s, x, y, 8); return; }
      if (T.solid(s.t, x, y) || y > s.water) {
        explode(s, x, y, 14, 10, null);
        return;
      }
    }
  }

  /* ---------- drill, blowtorch ---------- */
  function updateTool(s, dt) {
    const tl = s.tool, m = s.cur;
    tl.t += dt; tl.acc += dt;
    if (m.st !== "stand" && m.st !== "walk") { stopTool(s); return; }
    while (tl.acc >= 0.06) {
      tl.acc -= 0.06;
      if (tl.kind === "drill") {
        T.carve(s.t, m.x, m.y - 4, 11);
        if (!blocked(s, m.x, m.y + 2)) m.y += 2;
        if (Math.random() < 0.5) emit("drillTick");
      } else {
        const vx = Math.cos(tl.ang) * tl.dir, vy = Math.sin(tl.ang);
        T.carve(s.t, m.x + vx * 10, m.y - 11 + vy * 10, 12);
        const nx = m.x + vx * 2.2, ny = m.y + vy * 2.2;
        if (!blocked(s, Math.round(nx), Math.round(ny))) { m.x = nx; m.y = ny; }
        if (Math.random() < 0.4) emit("torchTick");
      }
    }
    m.x = Math.round(m.x * 10) / 10;
    if (tl.t > (tl.kind === "drill" ? 3.2 : 4)) { stopTool(s); retreat(s); }
  }
  function stopTool(s) { s.tool = null; s.cur.x = Math.round(s.cur.x); s.cur.y = Math.round(s.cur.y); }
  G.stopTool = () => { const s = G.s; if (s.tool) { stopTool(s); retreat(s); } };

  /* ---------- physics ---------- */
  function blocked(s, x, y) {
    const t = s.t;
    return T.solid(t, x, y) || T.solid(t, x, y - 20) || T.solid(t, x - 6, y - 10) || T.solid(t, x + 6, y - 10) || T.solid(t, x - 4, y - 3) || T.solid(t, x + 4, y - 3);
  }
  G.blocked = blocked;
  function physics(s, dt) {
    for (const m of s.moles) {
      if (m.dead) continue;
      m.t += dt;
      if (m.st === "drown") {
        m.y += 30 * dt; m.sink = (m.sink || 0) + dt;
        if (m.sink > 1.6) { m.dead = true; m.hp = 0; m.shown = 0; }
        continue;
      }
      if (m.st === "rope") { ropePhysics(s, m, dt); continue; }
      if (m.st === "jet") { jetPhysics(s, m, dt); continue; }
      if (m.st === "air") { airPhysics(s, m, dt); }
      else {
        if (!m.walking && m.st === "walk") m.st = "stand";
        m.walking = false;
        // ground gone? start to fall
        let d = 0;
        while (d < 3 && !feetHit(s, m.x, m.y + 1 + d)) d++;
        if (d >= 3) { m.st = "air"; m.vx = 0; m.vy = 0; m.fallY = m.y; }
        else if (d > 0) m.y += d;
        // buried by a girder or the like: push up
        let k = 0;
        while (k < 30 && (T.solid(s.t, m.x, m.y) || T.solid(s.t, m.x, m.y - 12))) { m.y--; k++; }
      }
      if (m.y > s.water && m.st !== "drown") { m.st = "drown"; m.sink = 0; emit("splash", m); if (m === s.cur) s.focus = m; }
      if (m.x < -60 || m.x > s.t.w + 60) { m.st = "drown"; m.y = Math.max(m.y, s.water); emit("splash", m); }
    }
    for (const o of s.objs) stepObj(s, o, dt);
    s.objs = s.objs.filter((o) => !o.gone);
  }
  // collision of a flying mole: the sides and the head for sideways moves, the feet for falling
  const sideHit = (s, x, y) => { const t = s.t; return T.solid(t, x - 6, y - 10) || T.solid(t, x + 6, y - 10) || T.solid(t, x - 5, y - 4) || T.solid(t, x + 5, y - 4) || T.solid(t, x, y - 20); };
  const feetHit = (s, x, y) => { const t = s.t; return T.solid(t, x, y) || T.solid(t, x - 4, y - 1) || T.solid(t, x + 4, y - 1); };
  function airPhysics(s, m, dt) {
    m.vy += GRAV * dt;
    const steps = Math.max(1, Math.ceil((Math.abs(m.vx) + Math.abs(m.vy)) * dt / 1.5));
    const sx = (m.vx * dt) / steps, sy = (m.vy * dt) / steps;
    for (let i = 0; i < steps; i++) {
      if (sx) {
        const nx = m.x + sx;
        if (sideHit(s, Math.round(nx), Math.round(m.y))) { m.vx *= -0.35; }
        else m.x = nx;
      }
      const ny = m.y + sy;
      if (sy > 0 && feetHit(s, Math.round(m.x), Math.round(ny))) { land(s, m); return; }
      if (sy < 0 && T.solid(s.t, Math.round(m.x), Math.round(ny) - 20)) { m.vy = 0; break; }
      m.y = ny;
    }
  }
  function land(s, m) {
    const v = m.vy;
    m.vy = 0; m.vx = 0; m.st = "stand"; m.x = Math.round(m.x); m.y = Math.round(m.y);
    let up = 0;
    while (T.solid(s.t, m.x, m.y) && up++ < 20) m.y--;
    if (v > 330) {
      const dmg = Math.round((v - 330) / 9);
      if (dmg > 0) { hurt(s, m, dmg); emit("ouch", m); }
    } else if (v > 120) emit("land", m);
    pickCrates(s, m);
  }
  function ropePhysics(s, m, dt) {
    const r = s.rope;
    if (!r) { m.st = "air"; return; }
    // a pendulum: gravity plus swing, then the rope length is enforced
    m.vy += GRAV * dt;
    m.vx += (m.ropeSwing || 0) * 260 * dt;
    m.ropeSwing = 0;
    const steps = 4;
    for (let i = 0; i < steps; i++) {
      const nx = m.x + (m.vx * dt) / steps, ny = m.y + (m.vy * dt) / steps;
      const hx = nx, hy = ny - 12;
      let dx = hx - r.x, dy = hy - r.y, d = Math.hypot(dx, dy);
      let tx = nx, ty = ny;
      if (d > r.len) { tx = r.x + (dx / d) * r.len; ty = r.y + (dy / d) * r.len + 12; }
      if (blocked(s, Math.round(tx), Math.round(ty))) { m.vx *= -0.3; m.vy *= -0.3; break; }
      // velocity along the tangent only
      if (d > r.len) { const nxv = dx / d, nyv = dy / d, vr = m.vx * nxv + m.vy * nyv; if (vr > 0) { m.vx -= vr * nxv; m.vy -= vr * nyv; } }
      m.x = tx; m.y = ty;
    }
    m.vx *= 0.999;
  }
  G.ropeLen = function (d) { const s = G.s; if (s.rope && s.cur.st === "rope") s.rope.len = U.clamp(s.rope.len + d, 20, 380); };
  function jetPhysics(s, m, dt) {
    m.vy += GRAV * 0.45 * dt;
    if (m.jetUp) { m.vy -= 520 * dt; m.fuel -= dt; }
    if (m.jetX) { m.vx += m.jetX * 300 * dt; m.dir = m.jetX; m.fuel -= dt * 0.5; }
    m.jetUp = false; m.jetX = 0;
    m.vx *= 1 - 0.8 * dt; m.vy = U.clamp(m.vy, -220, 260); m.vx = U.clamp(m.vx, -180, 180);
    if (m.fuel <= 0) { m.st = "air"; m.fallY = m.y; return; }
    const steps = 3;
    for (let i = 0; i < steps; i++) {
      const nx = m.x + (m.vx * dt) / steps, ny = m.y + (m.vy * dt) / steps;
      if (blocked(s, Math.round(nx), Math.round(m.y))) m.vx = 0; else m.x = nx;
      if (blocked(s, Math.round(m.x), Math.round(ny))) { if (m.vy > 0) { m.st = "stand"; m.vy = 0; m.vx = 0; m.x = Math.round(m.x); m.y = Math.round(m.y); while (blocked(s, m.x, m.y)) m.y--; return; } m.vy = 0; }
      else m.y = ny;
    }
  }
  G.jetUp = () => { const m = G.s.cur; if (m.st === "jet") m.jetUp = true; };

  function pickCrates(s, m) {
    for (const o of s.objs) {
      if (o.type !== "crate" || o.gone) continue;
      if (Math.hypot(o.x - m.x, o.y - m.y) < 22) {
        o.gone = true;
        if (o.kind === "health") { m.hp += 25; m.shown = m.hp; addText(s, m.x, m.y - 40, "+25", "#7dff7a"); emit("heal", m); }
        else {
          const k = U.pick(CRATE_LOOT), inv = s.teams[m.team].inv;
          if (inv[k] !== Infinity) inv[k]++;
          addText(s, m.x, m.y - 40, W[k].name, "#ffd13a");
          emit("pickup", { m, weapon: k });
        }
      }
    }
  }

  /* ---------- projectiles and objects ---------- */
  function stepObj(s, o, dt) {
    o.age = (o.age || 0) + dt;
    const ty = o.type;
    // fuses
    if (o.fuseT >= 0 && (ty === "grenade" || ty === "cluster" || ty === "dynamite" || ty === "mine")) {
      o.fuseT -= dt;
      if (ty === "dynamite" || ty === "mine") { if (Math.random() < dt * 8) emit("fuse"); }
      if (o.fuseT <= 0) { detonate(s, o); return; }
    }
    if (ty === "mine") {
      if (!o.armed) { o.armT -= dt; if (o.armT <= 0) { o.armed = true; emit("armed"); } }
      else if (o.fuseT < 0 && s.moles.some((m) => !m.dead && Math.hypot(m.x - o.x, m.y - o.y) < 34)) { o.fuseT = 1.2; emit("beep"); }
    }
    if (ty === "barrel" && o.burn >= 0) { o.burn -= dt; if (o.burn <= 0) { detonate(s, o); return; } }
    if (o.rest) {
      // something removed the ground beneath it?
      if (!T.solid(s.t, o.x, o.y + 1) && !T.solid(s.t, o.x - 3, o.y + 1) && !T.solid(s.t, o.x + 3, o.y + 1)) o.rest = false;
      else return;
    }
    if (ty === "crate" && o.chute) {
      o.vy = 70; o.vx = s.wind * 0.3;
    } else if (ty === "missile" && o.age > 0.45 && o.age < 3.5 && o.target) {
      // steer to the target
      const want = Math.atan2(o.target.y - o.y, o.target.x - o.x), cur = Math.atan2(o.vy, o.vx);
      let d = want - cur; while (d > Math.PI) d -= U.TAU; while (d < -Math.PI) d += U.TAU;
      const na = cur + U.clamp(d, -3.2 * dt, 3.2 * dt), sp = 360;
      o.vx = Math.cos(na) * sp; o.vy = Math.sin(na) * sp;
    } else {
      o.vy += GRAV * dt;
      if (ty === "rocket" || ty === "airbomb" || ty === "frag" || (ty === "missile" && o.age <= 0.45)) o.vx += G.windAccel() * dt;
    }
    const steps = Math.max(1, Math.ceil((Math.abs(o.vx) + Math.abs(o.vy)) * dt / 1.5));
    for (let i = 0; i < steps; i++) {
      const nx = o.x + (o.vx * dt) / steps, ny = o.y + (o.vy * dt) / steps;
      const impact = ty === "rocket" || ty === "missile" || ty === "airbomb" || ty === "frag";
      if (impact) {
        // hit a mole?
        if (o.age > 0.06) for (const m of s.moles) {
          if (m.dead || m.st === "drown") continue;
          if (Math.hypot(m.x - nx, m.y - 11 - ny) < 12) { o.x = nx; o.y = ny; detonate(s, o); return; }
        }
        if (T.solid(s.t, nx, ny)) { o.x = nx; o.y = ny; detonate(s, o); return; }
      } else {
        const probe = ty === "crate" || ty === "barrel" ? ny : ny;
        if (T.solid(s.t, nx, probe)) {
          if (ty === "crate" || ty === "barrel" || ty === "mine" || ty === "dynamite") {
            if (o.vy > 0 && T.solid(s.t, o.x, ny)) { o.rest = true; o.vx = 0; o.vy = 0; o.chute = false; if (ty === "crate") emit("crateLand"); return; }
            o.vx *= -0.3; o.vy *= 0.3; break;
          }
          // bounce off the surface
          const n = T.normal(s.t, nx, ny), vn = o.vx * n.x + o.vy * n.y;
          if (vn < 0) {
            const e = 0.48;
            o.vx -= (1 + e) * vn * n.x; o.vy -= (1 + e) * vn * n.y;
            o.vx *= 0.82; o.vy *= 0.82;
            if (Math.abs(vn) > 60) emit("bounce");
          }
          if (Math.hypot(o.vx, o.vy) < 18 && n.y < -0.5) { o.vx = 0; o.vy = 0; o.rest = true; }
          break;
        }
      }
      o.x = nx; o.y = ny;
    }
    if (ty === "rocket" || ty === "missile") { if (Math.random() < 0.7) s.fx.push({ k: "smoke", x: o.x, y: o.y, vx: 0, vy: -10, t: 0, life: 0.8, r: 3 }); }
    if (o.y > s.water) {
      if (ty === "crate" || ty === "barrel" || ty === "mine") { o.gone = true; }
      else if (ty === "dynamite" || ty === "grenade" || ty === "cluster") { o.gone = true; emit("splash", o); }
      else { o.gone = true; emit("splash", o); }
      if (s.focus === o) s.focus = null;
    }
    if (o.x < -300 || o.x > s.t.w + 300) o.gone = true;
  }

  function detonate(s, o) {
    o.gone = true;
    const ty = o.type;
    if (ty === "rocket" || ty === "missile") explode(s, o.x, o.y, 46, 50, o);
    else if (ty === "grenade") explode(s, o.x, o.y, 46, 50, o);
    else if (ty === "cluster") {
      explode(s, o.x, o.y, 30, 25, o);
      for (let k = 0; k < 5; k++) s.objs.push({ id: s.nextId++, type: "frag", x: o.x, y: o.y - 4, vx: (k - 2) * 60 + U.rand(-20, 20), vy: -220 - U.rand(0, 80), rest: false, age: 0 });
    } else if (ty === "frag") explode(s, o.x, o.y, 22, 20, o);
    else if (ty === "dynamite") explode(s, o.x, o.y, 78, 75, o, false, true);
    else if (ty === "mine") explode(s, o.x, o.y, 40, 45, o);
    else if (ty === "airbomb") explode(s, o.x, o.y, 32, 30, o);
    else if (ty === "barrel") { explode(s, o.x, o.y - 10, 50, 40, o); for (let k = 0; k < 8; k++) s.fx.push({ k: "fire", x: o.x + U.rand(-20, 20), y: o.y - U.rand(0, 20), vx: U.rand(-60, 60), vy: U.rand(-160, -60), t: 0, life: U.rand(0.8, 1.6), r: 4 }); }
    if (s.focus === o) s.focus = { x: o.x, y: o.y, hold: 1.2 };
  }
  function damageObj(s, o, dmg) {
    if (o.type === "barrel") { if (!(o.burn >= 0)) o.burn = 0.25; }
    else if (o.type === "mine") { if (o.fuseT < 0) o.fuseT = 0.2; }
    else if (o.type === "crate") { o.gone = true; if (o.kind === "weapon") explode(s, o.x, o.y - 8, 30, 25, o); }
  }
  function hurt(s, m, dmg) {
    if (m.dead || dmg <= 0) return;
    m.hp -= dmg; m.dmg += dmg;
    addText(s, m.x, m.y - 44, "-" + dmg, "#ffffff", MM.D ? MM.D.TEAM[m.col] : "#f00");
    emit("hurt", { m, dmg });
  }
  G.hurt = (m, d) => hurt(G.s, m, d);
  function addText(s, x, y, text, col, oc) { s.texts.push({ x, y, text, col, oc, t: 0 }); }

  function explode(s, x, y, r, dmg, src, quietly, big) {
    T.carve(s.t, x, y, r);
    s.shake = Math.max(s.shake, Math.min(1, r / 50));
    addBoom(s, x, y, r);
    emit(big || r > 60 ? "bigboom" : r < 26 ? "smallboom" : "boom", { x, y, r });
    const reach = r * 1.6;
    for (const m of s.moles) {
      if (m.dead) continue;
      const dx = m.x - x, dy = m.y - 11 - y, d = Math.hypot(dx, dy);
      if (d > reach) continue;
      const f = 1 - d / reach;
      hurt(s, m, Math.round(dmg * f));
      const sp = (110 + 420 * f) * (dmg / 50 + 0.4);
      const ax = d > 0.1 ? dx / d : 0, ay = d > 0.1 ? dy / d : -1;
      m.st = "air"; m.vx = ax * sp; m.vy = ay * sp - 120 * f; m.fallY = m.y; m.y -= 1;
      if (s.rope && m === s.cur) s.rope = null;
    }
    for (const o of s.objs) {
      if (o.gone || o === src) continue;
      const d = Math.hypot(o.x - x, o.y - 8 - y);
      if (d < r * 1.3) {
        if (o.type === "barrel" || o.type === "mine" || o.type === "crate") damageObj(s, o, dmg);
        if (!o.gone && (o.type === "grenade" || o.type === "cluster" || o.type === "dynamite" || o.type === "mine" || o.type === "barrel" || o.type === "crate")) {
          const f = 1 - d / (r * 1.3);
          o.rest = false; o.vx += ((o.x - x) / (d || 1)) * 300 * f; o.vy += -200 * f;
          if (o.type === "crate") o.chute = false;
        }
      }
    }
  }
  G.explode = (x, y, r, dmg) => explode(G.s, x, y, r, dmg, null);
  function addBoom(s, x, y, r) {
    s.fx.push({ k: "flash", x, y, t: 0, life: 0.35, r });
    const n = Math.min(26, 6 + r / 3);
    for (let i = 0; i < n; i++) {
      const a = U.rand(U.TAU), v = U.rand(0.3, 1) * (80 + r * 5);
      s.fx.push({ k: "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, t: 0, life: U.rand(0.4, 0.9), r: U.rand(2, 4) });
    }
    for (let i = 0; i < n / 2; i++) s.fx.push({ k: "smoke", x: x + U.rand(-r / 2, r / 2), y: y + U.rand(-r / 2, r / 2), vx: U.rand(-20, 20), vy: U.rand(-40, -10), t: 0, life: U.rand(0.8, 1.6), r: U.rand(6, 12) });
    for (let i = 0; i < n / 2; i++) { const a = U.rand(U.TAU), v = U.rand(80, 260); s.fx.push({ k: "dirt", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, t: 0, life: 1.2, r: 2 }); }
  }
  function updateFx(s, dt) {
    for (const p of s.fx) {
      p.t += dt;
      if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; }
      if (p.k === "spark" || p.k === "dirt" || p.k === "fire") p.vy += GRAV * 0.8 * dt;
      if (p.k === "smoke") { p.vx *= 0.98; p.r += dt * 6; }
    }
    s.fx = s.fx.filter((p) => p.t < p.life);
    if (s.fx.length > 500) s.fx.splice(0, s.fx.length - 500);
  }

  /* ---------- prediction for the computer players ---------- */
  // flies a projectile without side effects; returns where and when it explodes
  G.predict = function (type, x, y, vx, vy, fuse, target) {
    const s = G.s, dt = 1 / 60;
    const o = { type, x, y, vx, vy, age: 0, target };
    for (let n = 0; n < 60 * 8; n++) {
      o.age += dt;
      if (type === "missile" && o.age > 0.45 && o.age < 3.5 && target) {
        const want = Math.atan2(target.y - o.y, target.x - o.x), cur = Math.atan2(o.vy, o.vx);
        let d = want - cur; while (d > Math.PI) d -= U.TAU; while (d < -Math.PI) d += U.TAU;
        const na = cur + U.clamp(d, -3.2 * dt, 3.2 * dt);
        o.vx = Math.cos(na) * 360; o.vy = Math.sin(na) * 360;
      } else {
        o.vy += GRAV * dt;
        if (type === "rocket" || (type === "missile" && o.age <= 0.45)) o.vx += G.windAccel() * dt;
      }
      if (fuse !== undefined && type !== "rocket" && type !== "missile") { fuse -= dt; if (fuse <= 0) return { x: o.x, y: o.y, t: o.age }; }
      const steps = Math.max(1, Math.ceil((Math.abs(o.vx) + Math.abs(o.vy)) * dt / 2));
      for (let i = 0; i < steps; i++) {
        const nx = o.x + (o.vx * dt) / steps, ny = o.y + (o.vy * dt) / steps;
        if (type === "rocket" || type === "missile") {
          if (o.age > 0.06) for (const m of s.moles) if (!m.dead && Math.hypot(m.x - nx, m.y - 11 - ny) < 12) return { x: nx, y: ny, t: o.age, mole: m };
          if (T.solid(s.t, nx, ny)) return { x: nx, y: ny, t: o.age };
        } else if (T.solid(s.t, nx, ny)) {
          const nn = T.normal(s.t, nx, ny), vn = o.vx * nn.x + o.vy * nn.y;
          if (vn < 0) { o.vx -= 1.48 * vn * nn.x; o.vy -= 1.48 * vn * nn.y; o.vx *= 0.82; o.vy *= 0.82; }
          if (Math.hypot(o.vx, o.vy) < 18 && nn.y < -0.5) { o.vx = 0; o.vy = 0; }
          break;
        }
        o.x = nx; o.y = ny;
      }
      if (o.y > s.water) return { x: o.x, y: o.y, t: o.age, water: true };
      if (o.x < -300 || o.x > s.t.w + 300) return { x: o.x, y: o.y, t: o.age, water: true };
    }
    return { x: o.x, y: o.y, t: 8 };
  };
  G.blastDamage = function (m, x, y, r, dmg) {
    const d = Math.hypot(m.x - x, m.y - 11 - y), reach = r * 1.6;
    return d > reach ? 0 : Math.round(dmg * (1 - d / reach));
  };
})(window.MM);
