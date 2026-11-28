/* Aviation General: the rules – hex grid, terrain and mobility (Go / Slow Go / No Go), line of sight,
   spotting, combat, logistics (FARP), mines, bridges, air defence, air assault and turn order.
   Nothing in here draws; the screens read the state and the event list.                         */
"use strict";

(function (MG) {
  const { U } = MG;
  const TY = MG.TYPES;
  const G = (MG.G = { S: null });

  /* ======================= hex grid (flat-top, odd columns shifted down) ======================= */
  const DIRS = [[1, -1, 0], [1, 0, -1], [0, 1, -1], [-1, 1, 0], [-1, 0, 1], [0, -1, 1]];
  let W = 0, H = 0, N = 0, CUBE = [], NB = [];
  G.idx = (c, r) => (c < 0 || r < 0 || c >= W || r >= H ? -1 : r * W + c);
  G.col = (i) => i % W;
  G.row = (i) => (i / W) | 0;
  function toCube(c, r) { const x = c, z = r - ((c - (c & 1)) >> 1); return [x, -x - z, z]; }
  function fromCube(x, z) { const c = x, r = z + ((x - (x & 1)) >> 1); return G.idx(c, r); }
  function initGrid(w, h) {
    W = w; H = h; N = w * h; CUBE = []; NB = [];
    for (let i = 0; i < N; i++) CUBE.push(toCube(i % W, (i / W) | 0));
    for (let i = 0; i < N; i++) {
      const [x, , z] = CUBE[i];
      NB.push(DIRS.map(([dx, , dz]) => fromCube(x + dx, z + dz)).filter((j) => j >= 0));
    }
    G.W = W; G.H = H; G.N = N;
  }
  G.nb = (i) => NB[i];
  G.dist = (a, b) => {
    const p = CUBE[a], q = CUBE[b];
    return Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]), Math.abs(p[2] - q[2]));
  };
  function cubeRound(x, y, z) {
    let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
    const dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
    if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
    return fromCube(rx, rz);
  }
  // the hexes on a straight line; eps nudges the line to one side of exact hex corners
  G.line = (a, b, eps = 1e-6) => {
    const n = G.dist(a, b), p = CUBE[a], q = CUBE[b], out = [];
    for (let k = 0; k <= n; k++) {
      const t = n ? k / n : 0;
      out.push(cubeRound(U.lerp(p[0] + eps, q[0] + eps, t), U.lerp(p[1] + eps * 2, q[1] + eps * 2, t), U.lerp(p[2] - eps * 3, q[2] - eps * 3, t)));
    }
    return out;
  };
  const withinCache = new Map();
  G.within = (i, r) => {
    const key = i * 32 + r;
    let v = withinCache.get(key);
    if (v) return v;
    v = [];
    const [x, , z] = CUBE[i];
    for (let dx = -r; dx <= r; dx++)
      for (let dz = Math.max(-r, -dx - r); dz <= Math.min(r, -dx + r); dz++) {
        const j = fromCube(x + dx, z + dz);
        if (j >= 0) v.push(j);
      }
    withinCache.set(key, v);
    return v;
  };

  /* ======================= terrain ======================= */
  G.TER = {
    clear: { name: "Open ground", obst: 0, close: false },
    forest: { name: "Forest", obst: 1, close: true },
    town: { name: "Town", obst: 1, close: true },
    city: { name: "City", obst: 2, close: true },
    swamp: { name: "Swamp", obst: 0, close: false },
    mountain: { name: "Rocky heights", obst: 0, close: false },
    water: { name: "Lake", obst: 0, close: false },
  };
  // mobility class per terrain and running gear
  const MOB = {
    clear: { track: "go", wheel: "go", foot: "go" },
    forest: { track: "nogo", wheel: "slow", foot: "go" },
    town: { track: "slow", wheel: "go", foot: "go" },
    city: { track: "slow", wheel: "slow", foot: "go" },
    swamp: { track: "slow", wheel: "nogo", foot: "slow" },
    mountain: { track: "nogo", wheel: "nogo", foot: "slow" },
    water: { track: "nogo", wheel: "nogo", foot: "nogo" },
  };
  const RANK = { go: 0, slow: 1, swim: 2, nogo: 3 };
  const worse = (a, b) => (RANK[a] >= RANK[b] ? a : b);

  G.hex = (i) => G.S.hex[i];
  G.elev = (i) => G.S.hex[i].e;
  G.isClose = (i) => { const h = G.S.hex[i]; return !h.river && G.TER[h.t].close; };
  G.terName = (i) => {
    const h = G.S.hex[i];
    if (h.bridge) return h.bridge === "assault" ? "Assault bridge" : "Bridge";
    if (h.ford) return "Ford";
    if (h.river) return "River";
    return G.TER[h.t].name;
  };
  G.roadLink = (a, b) => G.S.links.has(a < b ? a + "," + b : b + "," + a);
  G.SIDES = ["DE", "RU"];
  const enemyOf = (side) => (side === G.SIDES[0] ? G.SIDES[1] : G.SIDES[0]);
  G.enemyOf = enemyOf;

  // the mobility class of a hex for a running gear, without road or slope (for the overlay)
  G.baseClass = function (T, i, side) {
    if (T.isAir) return "go";
    const h = G.S.hex[i], mob = T.mob;
    let c;
    if (h.bridge) c = "go";
    else if (h.river) c = h.ford ? "slow" : T.amph ? "slow" : mob === "foot" ? "swim" : "nogo";
    else if (h.t === "water") c = T.amph ? "slow" : "nogo";
    else c = MOB[h.t][mob];
    if (h.t === "forest" && mob === "track" && h.road && !h.river) c = "slow"; // a forest road
    const m = h.mine;
    if (m && m.side !== side && m.known[side]) c = worse(c, m.lane ? "slow" : mob === "foot" ? "slow" : "nogo");
    return c;
  };
  // the cost of one step; Infinity for No Go
  G.stepCost = function (T, from, to, side) {
    if (T.isAir) return 1;
    let c = G.baseClass(T, to, side);
    if (c === "nogo") return Infinity;
    const road = from >= 0 && G.roadLink(from, to) && T.mob !== "foot";
    const h = G.S.hex[to];
    if (T.mob === "track" && h.t === "forest" && !h.river && !road) return Infinity;
    const m = h.mine;
    const mined = m && m.side !== side && m.known[side];
    if (road && !mined && c !== "swim") return 0.75;
    if (T.mob === "wheel" && from >= 0 && G.elev(to) > G.elev(from)) c = worse(c, "slow");
    return c === "go" ? 1 : c === "slow" ? 2 : c === "swim" ? T.move : Infinity;
  };

  /* ======================= units ======================= */
  G.alive = (u) => u.alive && !u.reserve && u.idx >= 0 && !u.cargoOf;
  G.unitsOf = (side) => G.S.units.filter((u) => u.side === side && G.alive(u));
  G.at = function (i, air) {
    for (const u of G.S.units) if (G.alive(u) && u.idx === i && !!u.type.isAir === !!air) return u;
    return null;
  };
  G.byId = (id) => G.S.units.find((u) => u.id === id);
  G.stars = (u) => Math.min(3, Math.floor(u.exp / 100));
  G.isFlying = (u) => u.type.isAir && !u.landed;
  G.value = (u) => (u.type.cost * u.str) / 10;
  const H_EYE = 0.6, H_HELO = 1.4, H_POP = 2.2, H_UAV = 3.0, H_PLANE = 6; // H_POP: a helicopter popping up over the trees to fire
  G.eyeH = (u) => (G.isFlying(u) ? (u.type.uav ? H_UAV : H_HELO) : H_EYE);
  G.airH = (u) => (u.type.uav ? H_UAV : u.type.heli ? H_HELO : H_PLANE);

  function newUnit(type, side, idx, o = {}) {
    const T = TY[type];
    const u = {
      id: G.S.nextId++, type: T, tid: type, side, idx, alive: true, str: o.str || 10,
      ammo: T.ammo, aam: T.aam, fuel: T.fuel || 0, mines: T.mines || 0, carry: !!T.bridge, exp: o.exp || 0,
      entrench: o.entrench || 0, moved: false, attacked: false, noAttack: false, mpUsed: 0,
      landed: false, grounded: false, cargo: null, cargoOf: 0, revealed: -1, firedAt: new Set(),
      reserve: !!o.reserve, still: true, name: o.name || null,
    };
    G.S.units.push(u);
    return u;
  }
  G.newUnit = newUnit;

  /* ======================= setup ======================= */
  G.setup = function (scen) {
    const S = (G.S = {
      scen, hex: [], links: new Set(), units: [], nextId: 1, turn: 1, maxTurn: scen.maxTurn,
      side: scen.first, first: scen.first, half: 0, log: [], ev: [], clk: 0, over: null,
      sides: {}, vis: {}, spot: {}, mem: {},
    });
    G.SIDES = scen.sides || ["DE", "RU"];
    initGrid(scen.W, scen.H);
    withinCache.clear();
    scen.build(S, G);
    for (const sd of G.SIDES) {
      S.sides[sd] = { prestige: scen.prestige[sd] || 0, ai: sd !== scen.player, captured: new Set() };
      S.mem[sd] = new Map();
    }
    G.updateVis();
    G.log(scen.title + " – turn 1 of " + S.maxTurn, "#ffffff");
    return S;
  };

  /* ======================= saving and loading ======================= */
  G.save = function () {
    const S = G.S;
    return JSON.stringify({
      v: 1, scen: S.scen.id, hex: S.hex, links: [...S.links], nextId: S.nextId, turn: S.turn, side: S.side, half: S.half,
      units: S.units.map((u) => { const o = { ...u }; delete o.type; delete o.firedAt; delete o.anim; delete o.deadT; return o; }),
      sides: Object.fromEntries(Object.entries(S.sides).map(([k, v]) => [k, { ...v, captured: [...v.captured] }])),
      mem: Object.fromEntries(Object.entries(S.mem).map(([k, m]) => [k, [...m]])),
      log: S.log.slice(-30),
    });
  };
  G.load = function (json) {
    try {
      const d = typeof json === "string" ? JSON.parse(json) : json;
      const scen = MG.findScenario(d.scen);
      if (!scen || d.v !== 1) return false;
      G.SIDES = scen.sides || ["DE", "RU"];
      initGrid(scen.W, scen.H); withinCache.clear();
      const S = (G.S = { scen, hex: d.hex, links: new Set(d.links), units: [], nextId: d.nextId, turn: d.turn, maxTurn: scen.maxTurn, side: d.side, first: scen.first, half: d.half, log: d.log || [], ev: [], clk: 0, over: null, sides: {}, vis: {}, spot: {}, mem: {} });
      for (const u of d.units) { u.type = TY[u.tid]; u.firedAt = new Set(); S.units.push(u); }
      for (const k in d.sides) S.sides[k] = { ...d.sides[k], captured: new Set(d.sides[k].captured) };
      for (const k in d.mem) S.mem[k] = new Map(d.mem[k]);
      G.updateVis();
      G.log("Battle resumed – turn " + S.turn + ".", "#ffffff");
      return true;
    } catch (e) { return false; }
  };

  /* ======================= events (read by the screens) ======================= */
  // priv: a private action (laying mines, landing at a FARP …) that the player only learns about if he sees the unit
  G.log = (s, col, priv) => {
    const S = G.S, a = S.actor, me = S.scen.player;
    const hidden = !!(priv && a && a.side !== me && !(S.spot[me] && S.spot[me].has(a.id)));
    S.log.push({ s, col: col || "#d8dee6", half: S.half, hidden });
    if (S.log.length > 200) S.log.shift();
  };
  G.beginAction = () => { G.S.ev = []; G.S.clk = 0; G.S.actor = null; };
  const ev = (o) => { if (o.at === undefined) o.at = G.S.clk; G.S.ev.push(o); };
  // sounds are events too, so the screen can keep hidden enemies quiet
  const sfx = (name) => ev({ type: "sfx", name, u: G.S.actor ? G.S.actor.id : 0 });
  const tick = (s) => { G.S.clk += s; };

  /* ======================= line of sight and spotting ======================= */
  function blocked(path, ha, hb, a, b) {
    const n = path.length - 1;
    const e0 = G.elev(a) + ha, e1 = G.elev(b) + hb;
    for (let k = 1; k < n; k++) {
      const x = path[k], h = G.S.hex[x];
      if (!h) continue; // a nudged line may graze the map edge
      const hx = h.e + (h.river ? 0 : G.TER[h.t].obst);
      if (hx >= e0 + (e1 - e0) * (k / n) - 1e-9) return true;
    }
    return false;
  }
  G.los = function (a, b, ha = H_EYE, hb = H_EYE) {
    if (a === b || G.dist(a, b) <= 1) return true;
    return !blocked(G.line(a, b, 1e-6), ha, hb, a, b) || !blocked(G.line(a, b, -1e-6), ha, hb, a, b);
  };
  const adjacentTo = (i, side) => { for (const j of NB[i]) { const g = G.at(j, false); if (g && g.side === side) return true; } return false; };

  G.updateVis = function () {
    const S = G.S;
    for (const side of G.SIDES) {
      const vis = new Uint8Array(N), own = G.unitsOf(side);
      for (const o of own) {
        const eye = G.eyeH(o), r = o.type.sight + (!G.isFlying(o) && G.elev(o.idx) >= 2 ? 1 : 0);
        for (const j of G.within(o.idx, r)) if (!vis[j] && G.los(o.idx, j, eye, H_EYE)) vis[j] = 1;
      }
      S.vis[side] = vis;
      const spot = new Set();
      for (const e of S.units) {
        if (e.side === side || !G.alive(e)) continue;
        let seen = false;
        if (G.isFlying(e)) {
          for (const o of own) {
            const r = G.isFlying(o) ? o.type.sight : o.type.airSight;
            if (G.dist(o.idx, e.idx) <= r && G.los(o.idx, e.idx, G.eyeH(o), G.airH(e))) { seen = true; break; }
          }
        } else if (vis[e.idx]) seen = !G.isClose(e.idx) || adjacentTo(e.idx, side) || e.revealed >= S.half;
        if (e.revealed >= S.half && !seen && !e.type.isAir) seen = vis[e.idx] === 1;
        if (seen) { spot.add(e.id); S.mem[side].set(e.id, { idx: e.idx, tid: e.tid, half: S.half }); }
      }
      for (const [id, m] of S.mem[side]) { const u = G.byId(id); if (!u || !u.alive) S.mem[side].delete(id); else if (S.half - m.half > 6) S.mem[side].delete(id); }
      S.spot[side] = spot;
      // mines: engineers and reconnaissance find them next door, UAVs from above
      for (const o of own) {
        const finder = o.type.engineer || o.type.recon || o.type.clear;
        if (!finder) continue;
        const r = o.type.uav ? Math.min(3, o.type.sight) : 1;
        for (const j of G.within(o.idx, r)) {
          const m = S.hex[j].mine;
          if (m && m.side !== side && !m.known[side] && G.los(o.idx, j, G.eyeH(o), 0.2)) { m.known[side] = true; if (side === S.scen.player) G.log("Minefield detected.", "#ffd36a"); }
        }
      }
    }
  };
  G.spotted = (side, u) => G.S.spot[side].has(u.id);
  G.enemiesSeen = (side) => G.S.units.filter((e) => e.side !== side && G.alive(e) && G.S.spot[side].has(e.id));

  /* ======================= movement ======================= */
  G.canMove = (u) => {
    if (!G.alive(u) || u.grounded || u.landed) return false;
    if (u.type.isAir) return !u.attackedNoMove && G.mpLeft(u) > 0;
    return !u.moved && !u.attacked;
  };
  G.mpLeft = (u) => {
    if (u.type.isAir) return Math.max(0, Math.min(u.type.move - u.mpUsed, u.fuel));
    return u.moved ? 0 : u.type.move;
  };
  // Dijkstra over the hexes this unit can reach; ZOC stops ground units next to known enemies
  G.reach = function (u) {
    const S = G.S, side = u.side, T = u.type, budget = G.mpLeft(u);
    const best = new Map([[u.idx, { cost: 0, prev: -1, slow: false }]]);
    if (budget <= 0) return best;
    const enemyG = new Set(), zoc = new Set();
    for (const e of G.enemiesSeen(side)) {
      if (!e.type.isAir) { enemyG.add(e.idx); for (const j of NB[e.idx]) zoc.add(j); }
    }
    const enemyA = new Set(G.enemiesSeen(side).filter((e) => e.type.isAir).map((e) => e.idx));
    const open = [u.idx];
    while (open.length) {
      let bi = 0;
      for (let k = 1; k < open.length; k++) if (best.get(open[k]).cost < best.get(open[bi]).cost) bi = k;
      const cur = open.splice(bi, 1)[0], cn = best.get(cur);
      if (!T.isAir && cur !== u.idx && zoc.has(cur)) continue;
      for (const nx of NB[cur]) {
        if (T.isAir ? enemyA.has(nx) : enemyG.has(nx)) continue;
        const c = G.stepCost(T, cur, nx, side);
        if (!isFinite(c)) continue;
        const tot = cn.cost + c;
        if (tot > budget + 1e-9) continue;
        if (T.mob === "foot" && c >= T.move && cur !== u.idx) continue; // swimming takes the whole move
        const old = best.get(nx);
        const slow = cn.slow || (c === 2 && !T.isAir);
        if (!old || tot < old.cost - 1e-9) { best.set(nx, { cost: tot, prev: cur, slow }); open.push(nx); }
      }
    }
    // only hexes with a free slot are destinations
    for (const [i] of best) {
      if (i === u.idx) continue;
      const o = G.at(i, T.isAir);
      if (o) best.get(i).pass = true;
    }
    return best;
  };
  G.pathTo = (reach, i) => { const p = []; let k = i; while (k >= 0) { p.unshift(k); k = reach.get(k).prev; } return p; };

  function capture(u) {
    const h = G.S.hex[u.idx];
    if (!h.obj || u.type.isAir || h.obj.owner === u.side) return;
    h.obj.owner = u.side;
    const sd = G.S.sides[u.side];
    if (!sd.captured.has(u.idx)) { sd.captured.add(u.idx); sd.prestige += 60; }
    G.log(MG.NATIONS[u.side].name + " takes " + h.obj.name + ".", MG.NATIONS[u.side].col);
    ev({ type: "flag", at: 0, i: u.idx });
  }

  function mineStrike(u, i) {
    const m = G.S.hex[i].mine;
    m.known[u.side] = true;
    const d = u.type.armor ? U.randi(2, 4) : U.randi(1, 2);
    ev({ type: "boom", i, size: 0.8 });
    G.log(u.type.name + " runs into a minefield: −" + d + ".", "#ff8a6a");
    sfx("mine");
    damage(u, d);
  }

  G.move = function (u, dest) {
    const S = G.S;
    S.actor = u;
    const reach = G.reach(u);
    const node = reach.get(dest);
    if (!node || node.pass || dest === u.idx) return false;
    const path = G.pathTo(reach, dest);
    const known = new Set(S.spot[u.side]);
    const done = [path[0]];
    let stopped = false;
    u.entrench = 0; u.dug = false;
    for (let k = 1; k < path.length && u.alive; k++) {
      const nx = path[k];
      if (!u.type.isAir) {
        const hid = G.at(nx, false);
        if (hid && hid.side !== u.side) { // ambush: a hidden enemy is in the way
          hid.revealed = Math.max(hid.revealed, S.half);
          G.log(u.type.name + " is stopped by a hidden " + hid.type.name + "!", "#ffb36a");
          stopped = true; break;
        }
      }
      const c = G.stepCost(u.type, path[k - 1], nx, u.side);
      u.idx = nx; done.push(nx);
      if (u.type.isAir) { u.mpUsed += 1; u.fuel -= 1; } else u.mpUsed += c;
      if (c === 2 && !u.type.isAir && u.type.mob !== "foot") u.noAttack = true;
      tick(0.13);
      if (u.type.isAir) {
        G.adReact(u, nx);
        if (!u.alive) break;
      } else {
        const m = S.hex[nx].mine;
        if (m && m.side !== u.side && !m.lane) {
          if (!m.known[u.side]) { mineStrike(u, nx); stopped = true; }
          else if (u.type.mob === "foot") { damage(u, 1); G.log(u.type.name + " crosses a minefield on foot: −1.", "#ff8a6a"); }
          if (!u.alive) break;
        }
        capture(u);
        if (!stopped && k < path.length - 1) {
          G.updateVis();
          for (const j of NB[nx]) {
            const e = G.at(j, false);
            if (e && e.side !== u.side && !known.has(e.id) && S.spot[u.side].has(e.id)) { stopped = true; G.log(u.type.name + " makes contact and halts.", "#ffb36a"); break; }
          }
        }
      }
      if (stopped) break;
    }
    // a stop before the planned hex may leave the unit on an occupied hex: step back
    if (u.alive && G.at(u.idx, u.type.isAir) !== u) {
      while (done.length > 1 && G.S.units.some((o) => o !== u && G.alive(o) && o.idx === u.idx && !!o.type.isAir === !!u.type.isAir)) { done.pop(); u.idx = done[done.length - 1]; }
    }
    if (!u.type.isAir) u.moved = true;
    u.still = false;
    ev({ type: "move", u: u.id, path: done, at: 0, dur: (done.length - 1) * 0.13 });
    G.updateVis();
    G.checkOver();
    return true;
  };

  /* ======================= combat ======================= */
  G.hitProb = (d) => U.clamp(0.3 + 0.045 * d, 0.04, 0.9);
  const airTarget = (t) => G.isFlying(t);
  G.atkValue = (T, t) => (airTarget(t) ? T.air : t.type.armor ? T.hard : T.soft);
  function defValue(t, att, indirect) {
    let d = airTarget(t) ? t.type.airDef : t.type.isAir ? t.type.airDef - 6 : t.type.def;
    d += G.stars(t);
    if (!t.type.isAir) {
      d += t.entrench;
      const h = G.S.hex[t.idx];
      if (!h.river && G.TER[h.t].close) d += t.type.armor ? { forest: 1, town: 1, city: 2 }[h.t] : { forest: 2, town: 3, city: 4 }[h.t];
      if (att && !att.type.isAir && !indirect && G.elev(t.idx) > G.elev(att.idx)) d += 1;
    }
    return d;
  }
  function atkMods(u, t, indirect) {
    let a = G.atkValue(u.type, t) + G.stars(u);
    if (!indirect && !u.type.isAir && !airTarget(t)) {
      if (G.elev(u.idx) > G.elev(t.idx)) a += 2;
      if (G.isClose(u.idx) || G.isClose(t.idx)) { if (u.type.mob === "foot") a += 2; else if (!t.type.armor) a -= 2; }
      if (G.S.hex[u.idx].river) a -= 3;
    }
    return a;
  }
  // the fire geometry: "ind" (indirect), "aa" (at aircraft), "dir" (direct) or null
  function fireMode(u, t) {
    const d = G.dist(u.idx, t.idx);
    if (airTarget(t)) return u.type.air > 0 && u.type.aaRange >= d && G.los(u.idx, t.idx, G.eyeH(u), G.airH(t)) ? "aa" : null;
    if (u.type.ind && d >= 2 && d <= u.type.ind) return "ind";
    if (G.atkValue(u.type, t) <= 0 || !u.type.range) return null;
    let r = u.type.range;
    // in forests and towns direct fire reaches one hex; helicopters look in from above and reach two
    // in forests and towns direct fire from the ground reaches one hex; helicopters look in from above
    if (!u.type.nlos && !u.type.isAir && (G.isClose(t.idx) || G.isClose(u.idx))) r = 1;
    if (d > r) return null;
    if (u.type.nlos) return "dir";
    return G.los(u.idx, t.idx, G.isFlying(u) ? H_POP : G.eyeH(u), t.type.isAir ? (t.landed ? 0.3 : G.airH(t)) : H_EYE) ? "dir" : null;
  }
  G.fireMode = fireMode;
  G.canAttack = function (u, t) {
    if (!G.alive(u) || !G.alive(t) || u.side === t.side) return false;
    if (u.attacked || u.noAttack || u.landed) return false;
    if ((u.type.aam && airTarget(t) ? u.aam : u.ammo) <= 0) return false;
    if (u.type.drone) return G.S.spot[u.side].has(t.id) && !t.type.isAir && G.dist(u.idx, t.idx) <= u.type.drone;
    if (!G.S.spot[u.side].has(t.id)) return false;
    return !!fireMode(u, t);
  };
  G.targets = (u) => G.S.units.filter((t) => G.canAttack(u, t));
  // which sound a unit makes when it fires (see audio.js)
  G.weaponSound = function (u, t, mode) {
    const T = u.type;
    if (mode === "ind") return T.icon === "mlrs" ? "mlrs" : "howitzer";
    if (mode === "aa") {
      if (T.missile) return "sam";
      if (T.aam || T.mob === "foot" || T.isAir) return "manpads";
      return T.icon === "spaag" ? "revolver" : T.icon === "ifv" ? "autocannon" : "mg";
    }
    const armour = t && t.type.armor;
    if (T.isAir) return u.tid === "lkh_rkt" ? "rockets" : T.atgm ? "heliatgm" : "chaingun";
    if (T.icon === "tank") return "tankgun";
    if (T.icon === "spaag") return "revolver";
    if (T.atgm && armour && (T.mob === "foot" || T.icon === "ifv")) return "atgm";
    if (T.icon === "ifv") return "autocannon";
    if (T.icon === "apc" || T.icon === "recon" || T.clear || T.bridge || T.mineLay) return "mg";
    if (T.mob === "foot") return "rifle";
    return "autocannon";
  };
  G.whyNot = function (u, t) {
    if (u.landed) return "on the ground";
    if (u.attacked) return "has already fired this turn";
    if (u.noAttack) return "cannot fire after slow going";
    const air = airTarget(t), d = G.dist(u.idx, t.idx);
    if ((u.type.aam && air ? u.aam : u.ammo) <= 0) return air && u.type.aam ? "no Stinger left" : "out of ammunition";
    if (air) {
      if (!u.type.air) return "no weapon against aircraft";
      if (d > u.type.aaRange) return "out of range (air " + u.type.aaRange + ")";
      return "no line of sight";
    }
    if (G.atkValue(u.type, t) <= 0 && !u.type.ind) return "no weapon against this target";
    const r = !u.type.nlos && !u.type.isAir && (G.isClose(t.idx) || G.isClose(u.idx)) ? 1 : u.type.range;
    if (d > Math.max(r, u.type.ind || 0)) return "out of range (" + r + (r < u.type.range ? " in close terrain" : "") + ")";
    if (u.type.ind && d < 2 && !u.type.range) return "too close for indirect fire";
    return "no line of sight";
  };

  function retalMode(t, u) {
    if (!G.alive(t) || t.landed || t.cargoOf) return null;
    if ((t.type.aam && airTarget(u) ? t.aam : t.ammo) <= 0) return null;
    const m = fireMode(t, u);
    return m === "ind" ? null : m;
  }
  G.predict = function (u, t) {
    if (u.type.drone) {
      const a = (t.type.armor ? u.type.hard : u.type.soft), p = G.hitProb(a - defValue(t, null, true)) * (t.type.aps && t.type.armor ? 0.5 : 1);
      return { kill: Math.min(t.str, (5 + Math.floor(u.str / 4)) * p), loss: 0 };
    }
    const mode = fireMode(u, t), ind = mode === "ind";
    const shots = ind ? Math.ceil(u.str * 0.6) : u.str;
    let p = G.hitProb(atkMods(u, t, ind) - defValue(t, u, ind));
    if (t.type.aps && t.type.armor && u.type.atgm) p *= 0.5;
    const kill = Math.min(t.str, shots * p);
    let loss = 0;
    if (!ind && retalMode(t, u)) {
      const rs = Math.max(0, t.str - kill);
      let q = G.hitProb(atkMods(t, u, false) - defValue(u, t, false));
      if (u.type.aps && u.type.armor && t.type.atgm) q *= 0.5;
      loss = Math.min(u.str, rs * q);
    }
    return { kill, loss, mode };
  };

  function damage(u, k) {
    if (k <= 0 || !u.alive) return;
    u.str -= k;
    if (u.cargo) { const c = G.byId(u.cargo); if (c) { c.str -= k; if (c.str <= 0) { c.alive = false; G.log(c.type.name + " is lost with its helicopter.", "#ff6a6a"); } } }
    if (u.str <= 0) {
      u.str = 0; u.alive = false;
      ev({ type: "boom", i: u.idx, size: 1.3, air: G.isFlying(u) });
      ev({ type: "dead", u: u.id });
      G.log(MG.NATIONS[u.side].name + " " + u.type.name + " destroyed.", u.side === G.S.scen.player ? "#ff6a6a" : "#9fe08a");
      if (u.cargo) { const c = G.byId(u.cargo); if (c && c.alive) { c.alive = false; G.log(c.type.name + " is lost with its helicopter.", "#ff6a6a"); } }
      sfx("explode");
    }
  }
  G.damage = damage;

  G.attack = function (u, t) {
    if (u.type.drone) return G.droneStrike(u, t);
    const S = G.S;
    S.actor = u;
    if (!G.canAttack(u, t)) return false;
    const mode = fireMode(u, t), ind = mode === "ind";
    if (G.isFlying(u)) { G.adReact(u, u.idx, { height: H_POP }); if (!u.alive) { G.updateVis(); G.checkOver(); return true; } }
    u.attacked = true;
    if (u.type.aam && mode === "aa") u.aam -= 1; else u.ammo -= 1;
    if (u.type.isAir) u.attackedNoMove = false;
    u.revealed = S.half + 1;
    const shots = ind ? Math.ceil(u.str * 0.6) : u.str;
    let p = G.hitProb(atkMods(u, t, ind) - defValue(t, u, ind));
    if (t.type.aps && t.type.armor && u.type.atgm) p *= 0.5;
    const kills = Math.min(t.str, U.binom(shots, p));
    ev({ type: "fire", from: u.idx, to: t.idx, kind: ind ? "shell" : mode === "aa" ? "aa" : u.type.atgm || u.type.isAir ? "missile" : "shot", side: u.side, fromAir: G.isFlying(u), toAir: airTarget(t) });
    sfx(G.weaponSound(u, t, mode));
    tick(ind ? 0.6 : 0.35);
    if (ind) sfx("impact");
    let losses = 0;
    if (!ind && retalMode(t, u) && t.str - kills > 0) {
      const rs = t.str - kills;
      let q = G.hitProb(atkMods(t, u, false) - defValue(u, t, false));
      if (u.type.aps && u.type.armor && t.type.atgm) q *= 0.5;
      losses = Math.min(u.str, U.binom(rs, q));
      tick(0.15); { const a0 = S.actor; S.actor = t; sfx(G.weaponSound(t, u, fireMode(t, u))); S.actor = a0; }
      ev({ type: "fire", from: t.idx, to: u.idx, kind: fireMode(t, u) === "aa" ? "aa" : "shot", side: t.side, toAir: airTarget(u) });
    }
    if (kills) ev({ type: "hit", i: t.idx, txt: "−" + kills, air: airTarget(t) });
    if (losses) ev({ type: "hit", i: u.idx, txt: "−" + losses, air: airTarget(u) });
    G.log(u.type.name + " → " + t.type.name + ": " + (kills ? "−" + kills : "no effect") + (losses ? ", return fire −" + losses : ""), u.side === S.scen.player ? "#cfe3ff" : "#ffd0c8");
    u.exp += kills * 8 + 4; t.exp += losses * 8 + 2;
    S.sides[u.side].prestige += kills * 4; S.sides[t.side].prestige += losses * 4;
    if (t.entrench > 0 && kills >= 2) t.entrench -= 1;
    damage(t, kills); damage(u, losses);
    tick(0.3);
    G.updateVis();
    G.checkOver();
    return true;
  };

  /* ======================= air defence ======================= */
  // every air-defence unit (and MANPADS team) that sees an aircraft in its reach fires once per turn at it
  G.adReact = function (target, i, opt = {}) {
    const S = G.S;
    const h = opt.height || G.airH(target), adef = opt.airDef || target.type.airDef;
    for (const a of S.units) {
      if (!G.alive(a) || a.side === target.side || !a.type.aaRange || a.type.air <= 0 || a.landed) continue;
      if ((a.type.aam ? a.aam : a.ammo) <= 0) continue;
      if (a.firedAt.has(target.id)) continue;
      if (G.dist(a.idx, i) > a.type.aaRange) continue;
      if (!G.los(a.idx, i, G.eyeH(a), h)) continue;
      a.firedAt.add(target.id);
      if (a.type.aam) a.aam -= 1; else a.ammo -= a.type.missile || a.type.mob === "foot" ? 1 : 0.5;
      a.revealed = S.half + 1;
      const shots = Math.max(1, Math.round(a.str * 0.5));
      const k = Math.min(target.str, U.binom(shots, G.hitProb(a.type.air + G.stars(a) - adef)));
      ev({ type: "fire", from: a.idx, to: i, kind: "aa", side: a.side, toAir: true });
      sfx(G.weaponSound(a, target, "aa"));
      tick(0.25);
      G.log((opt.label || target.type.name) + " under fire from " + a.type.name + (k ? ": −" + k : ": missed"), a.side === S.scen.player ? "#cfe3ff" : "#ffb0a0");
      if (k) ev({ type: "hit", i, txt: "−" + k, air: true });
      a.exp += k * 6;
      S.sides[a.side].prestige += k * 4;
      damage(target, k);
      if (!target.alive) return;
    }
  };
  // where a side's known air defence can reach (for the overlay and the computer players)
  G.threat = function (side, i, height = H_HELO) {
    let t = 0;
    for (const [id, m] of G.S.mem[side]) {
      const a = G.byId(id);
      if (!a || !a.alive || !a.type.aaRange || a.type.air <= 0) continue;
      if (G.dist(m.idx, i) <= a.type.aaRange && G.los(m.idx, i, H_EYE, height)) t += (a.type.air / 16) * (a.str / 10) * (a.type.mob === "foot" ? 0.5 : 1);
    }
    return t;
  };

  /* ======================= loitering munitions ======================= */
  G.droneStrike = function (u, t) {
    const S = G.S;
    S.actor = u;
    if (!G.canAttack(u, t)) return false;
    u.attacked = true; u.ammo -= 1;
    const path = G.line(u.idx, t.idx);
    sfx("drone");
    const fired = new Set();
    let downed = false;
    const dev = { type: "fire", from: u.idx, to: t.idx, kind: "drone", side: u.side, dur: (path.length - 1) * 0.12 };
    ev(dev);
    for (let k = 1; k < path.length && !downed; k++) {
      tick(0.12);
      for (const a of S.units) {
        if (downed || !G.alive(a) || a.side === u.side || !a.type.aaRange || a.type.air <= 0 || a.landed || (a.type.aam ? a.aam : a.ammo) <= 0 || fired.has(a.id)) continue;
        if (G.dist(a.idx, path[k]) > a.type.aaRange || !G.los(a.idx, path[k], G.eyeH(a), 2.5)) continue;
        fired.add(a.id);
        if (a.type.aam) a.aam -= 1; else a.ammo -= a.type.missile ? 1 : 0.5;
        a.revealed = S.half + 1;
        ev({ type: "fire", from: a.idx, to: path[k], kind: "aa", side: a.side, toAir: true });
        if (U.random() < U.clamp(G.hitProb(a.type.air - 6) * (a.str / 10), 0, 0.85)) {
          downed = true;
          dev.to = path[k]; dev.dur = k * 0.12;
          ev({ type: "boom", i: path[k], size: 0.5, air: true });
          G.log(u.type.name + ": munition shot down by " + a.type.name + ".", u.side === S.scen.player ? "#ffb0a0" : "#cfe3ff");
        }
      }
    }
    if (!downed) {
      tick(0.2);
      const shots = 5 + Math.floor(u.str / 4);
      let p = G.hitProb((t.type.armor ? u.type.hard : u.type.soft) - defValue(t, null, true));
      if (t.type.aps && t.type.armor) p *= 0.5;
      const k = Math.min(t.str, U.binom(shots, p));
      ev({ type: "boom", i: t.idx, size: 0.9 });
      if (k) ev({ type: "hit", i: t.idx, txt: "−" + k });
      G.log(u.type.name + " strikes " + t.type.name + (k ? ": −" + k : ": no effect"), u.side === S.scen.player ? "#cfe3ff" : "#ffd0c8");
      u.exp += k * 8 + 4; S.sides[u.side].prestige += k * 4;
      damage(t, k);
    }
    G.updateVis();
    G.checkOver();
    return true;
  };

  /* ======================= actions besides moving and fighting ======================= */
  const nearEnemy = (u) => NB[u.idx].some((j) => { const e = G.at(j, false); return e && e.side !== u.side && G.S.spot[u.side].has(e.id); });
  const farpNear = (u) => { for (const j of [u.idx, ...NB[u.idx]]) { const f = G.at(j, false); if (f && f.side === u.side && f.type.farp) return f; } return null; };
  G.farpNear = farpNear;
  const lzOK = (i) => { const h = G.S.hex[i]; return !h.river && (h.t === "clear" || [...NB[i]].some((j) => G.roadLink(i, j))) && h.t !== "water" && h.t !== "swamp" && h.t !== "mountain"; };
  G.lzOK = lzOK;
  const mineOK = (i, side) => { const h = G.S.hex[i]; if (h.mine || h.river || h.t === "water") return false; const g = G.at(i, false); return !g || (g.side !== side && !G.S.spot[side].has(g.id)); };
  const reinfCost = (u) => Math.round(u.type.cost / 10) * 2;

  // the actions a unit can take now, with their targets (hex indices or unit ids)
  G.actions = function (u) {
    const S = G.S, A = [];
    if (!G.alive(u) || S.over || u.side !== S.side) return A;
    const T = u.type, fresh = !u.moved && !u.attacked;
    if (!T.isAir) {
      if (T.mob === "foot" && fresh && u.idx >= 0 && !S.hex[u.idx].river && u.entrench < entrenchCap({ ...u, dug: true })) A.push({ id: "digin", label: "Dig in (+2, no move/fire)" });
      if (fresh && !nearEnemy(u) && (u.ammo < T.ammo || u.mines < (T.mines || 0))) A.push({ id: "resupply", label: "Resupply" });
      if (fresh && !nearEnemy(u) && u.str < 10 && S.sides[u.side].prestige >= reinfCost(u)) A.push({ id: "reinforce", label: "Reinforce +2 (" + reinfCost(u) + ")" });
      if (T.mineLay && u.mines > 0 && !u.attacked) { const tg = NB[u.idx].filter((j) => mineOK(j, u.side)); if (tg.length) A.push({ id: "mines", label: "Lay mines (" + u.mines + ")", hexes: tg }); }
      if (T.mineRemote && u.mines > 0 && !u.attacked) {
        const tg = G.within(u.idx, T.mineRemote).filter((j) => G.dist(u.idx, j) >= 2 && mineOK(j, u.side));
        if (tg.length) A.push({ id: "rmines", label: "Scatter mines (" + u.mines + ")", hexes: tg });
      }
      if (T.clear && !u.attacked) { const tg = NB[u.idx].filter((j) => { const m = S.hex[j].mine; return m && m.side !== u.side && m.known[u.side]; }); if (tg.length) A.push({ id: "clear", label: T.clear === "full" ? "Clear mines" : "Breach lane", hexes: tg }); }
      if (T.bridge && u.carry && !u.attacked) { const tg = NB[u.idx].filter((j) => S.hex[j].river && !S.hex[j].bridge && !G.at(j, false)); if (tg.length) A.push({ id: "bridge", label: "Lay bridge", hexes: tg }); }
      if (T.bridge && !u.carry && !u.attacked) { const tg = NB[u.idx].filter((j) => S.hex[j].bridge === "assault" && !G.at(j, false)); if (tg.length) A.push({ id: "retrieve", label: "Recover bridge", hexes: tg }); }
      if (T.engineer && !u.attacked) { const tg = NB[u.idx].filter((j) => S.hex[j].bridge && !G.at(j, false)); if (tg.length) A.push({ id: "demolish", label: "Blow bridge", hexes: tg }); }
    } else {
      const f = farpNear(u);
      if (f && (!u.landed || u.grounded) && (u.fuel < T.fuel || u.ammo < T.ammo || u.aam < T.aam || u.grounded || u.str < 10)) A.push({ id: "rearm", label: u.str < 10 ? "Land: refuel, rearm, repair" : "Land: refuel and rearm" });
      if (f && T.loadout && !u.landed) A.push({ id: "loadout", label: "Land: re-arm " + T.loadoutName });
      if (T.cap && !u.cargo && !u.landed) {
        const tg = [u.idx, ...NB[u.idx]].map((j) => G.at(j, false)).filter((g) => g && g.side === u.side && g.type.airmobile && !g.attacked);
        if (tg.length) A.push({ id: "embark", label: "Pick up infantry", units: tg.map((g) => g.id), hexes: tg.map((g) => g.idx) });
      }
      if (T.cap && u.cargo && !u.landed && !G.at(u.idx, false)) A.push({ id: "disembark", label: lzOK(u.idx) ? "Land troops here" : "No landing zone here", disabled: !lzOK(u.idx) });
    }
    return A;
  };

  G.doAction = function (u, id, target) {
    const S = G.S, T = u.type;
    S.actor = u;
    const act = G.actions(u).find((a) => a.id === id);
    if (!act || act.disabled) return false;
    if (act.hexes && act.hexes.indexOf(target) < 0 && id !== "embark") return false;
    switch (id) {
      case "digin":
        u.dug = true; u.entrench = Math.min(entrenchCap(u), u.entrench + 2);
        u.attacked = true; u.noAttack = true; // it stays put: no move and no fire this turn, but it keeps its entrenchment
        G.log(T.name + " digs in (" + u.entrench + ").", "#cfe3ff", true); sfx("dig");
        break;
      case "resupply":
        u.ammo = T.ammo; u.mines = T.mines || 0; u.moved = u.attacked = true;
        G.log(T.name + " resupplied.", "#cfe3ff", true); sfx("supply");
        break;
      case "reinforce": {
        const c = reinfCost(u); S.sides[u.side].prestige -= c;
        u.str = Math.min(10, u.str + 2); u.moved = u.attacked = true;
        G.log(T.name + " reinforced to " + u.str + ".", "#cfe3ff", true); sfx("supply");
        break;
      }
      case "mines":
        S.hex[target].mine = { side: u.side, remote: false, lane: false, expires: 0, known: { [u.side]: true } };
        u.mines--; u.attacked = true; u.moved = true;
        G.log(T.name + " lays a minefield.", "#cfe3ff", true); sfx("dig");
        break;
      case "rmines":
        S.hex[target].mine = { side: u.side, remote: true, lane: false, expires: S.turn + 4, known: { DE: true, RU: true } };
        u.mines--; u.attacked = true; u.revealed = S.half + 1;
        ev({ type: "fire", from: u.idx, to: target, kind: "shell", side: u.side });
        tick(0.5);
        ev({ type: "boom", i: target, size: 0.5 });
        G.log(T.name + " scatters mines (active for 4 turns).", u.side === S.scen.player ? "#cfe3ff" : "#ffd0c8"); sfx("artillery");
        break;
      case "clear": {
        const m = S.hex[target].mine;
        if (T.clear === "full" && m.lane) { S.hex[target].mine = null; G.log("Minefield cleared.", "#cfe3ff", true); }
        else if (!m.lane) { m.lane = true; G.log("Lane breached through the minefield.", "#cfe3ff", true); }
        else { S.hex[target].mine = null; G.log("Minefield cleared.", "#cfe3ff", true); }
        u.attacked = true; u.moved = true;
        ev({ type: "boom", i: target, size: 0.6 }); sfx("explode");
        break;
      }
      case "bridge":
        S.hex[target].bridge = "assault"; S.hex[target].bridgeSide = u.side; u.carry = false; u.attacked = true; u.moved = true;
        G.log(T.name + " lays an assault bridge.", "#cfe3ff", true); sfx("dig");
        break;
      case "retrieve":
        S.hex[target].bridge = null; u.carry = true; u.attacked = true; u.moved = true;
        G.log(T.name + " recovers its bridge.", "#cfe3ff", true);
        break;
      case "demolish":
        S.hex[target].bridge = null; u.attacked = true; u.moved = true;
        ev({ type: "boom", i: target, size: 1.4 });
        G.log(S.spot[S.scen.player].has(u.id) || u.side === S.scen.player ? "Bridge blown by " + T.name + "!" : "A bridge has been blown!", "#ffb36a"); sfx("explode");
        break;
      case "rearm": {
        const f = farpNear(u);
        u.fuel = T.fuel; u.ammo = T.ammo; u.aam = T.aam; u.grounded = false; u.landed = true;
        if (u.str < 10) { const add = Math.min(2, 10 - u.str); u.str += add; }
        u.attacked = true; u.attackedNoMove = true;
        if (f && f.idx !== u.idx) { ev({ type: "move", u: u.id, path: [u.idx, f.idx, u.idx], at: 0, dur: 0.01 }); }
        G.log(T.name + " lands at the FARP: refuelled and rearmed.", "#cfe3ff", true); sfx("supply");
        break;
      }
      case "loadout":
        u.type = TY[T.loadout]; u.tid = T.loadout; u.ammo = u.type.ammo; u.fuel = u.type.fuel; u.landed = true; u.attacked = true; u.attackedNoMove = true;
        G.log(T.name + " re-armed with " + T.loadoutName + ".", "#cfe3ff", true); sfx("supply");
        break;
      case "embark": {
        const g = G.byId(target);
        if (!g || act.units.indexOf(g.id) < 0) return false;
        u.cargo = g.id; g.cargoOf = u.id; g.moved = g.attacked = true; g.entrench = 0; g.dug = false;
        ev({ type: "move", u: g.id, path: [g.idx, u.idx], at: 0, dur: 0.2 });
        G.log(g.type.name + " boards the " + T.name + ".", "#cfe3ff", true); sfx("steps");
        break;
      }
      case "disembark": {
        const g = G.byId(u.cargo);
        u.cargo = null; g.cargoOf = 0; g.idx = u.idx; g.moved = g.attacked = true; g.noAttack = true; g.still = false;
        u.attackedNoMove = true; u.attacked = true;
        ev({ type: "move", u: g.id, path: [u.idx, u.idx], at: 0, dur: 0.2 });
        G.log(g.type.name + " lands from the " + T.name + ".", "#cfe3ff"); sfx("steps");
        const m = S.hex[u.idx].mine;
        if (m && m.side !== g.side && !m.lane) mineStrike(g, u.idx);
        if (g.alive && nearEnemy(g)) { damage(g, 1); G.log("Hot landing zone: " + g.type.name + " takes fire −1.", "#ffb36a"); }
        if (g.alive) capture(g);
        break;
      }
      default: return false;
    }
    G.updateVis();
    G.checkOver();
    return true;
  };

  /* ======================= parachute drop from an A400M / Il-76 ======================= */
  G.dropTargets = (u) => {
    const out = [];
    for (let i = 0; i < N; i++) { const h = G.S.hex[i]; if (!h.river && h.t !== "water" && !(G.at(i, false) && G.S.spot[u.side].has(G.at(i, false).id)) && !(G.at(i, false) && G.at(i, false).side === u.side)) out.push(i); }
    return out;
  };
  G.paradrop = function (u, target) {
    const S = G.S;
    if (!u.reserve || !u.alive || S.side !== u.side) return false;
    S.actor = u;
    const entry = G.idx(S.scen.dropEdge[u.side], G.row(target));
    const path = G.line(entry, target);
    sfx("plane");
    ev({ type: "plane", path, side: u.side, dur: path.length * 0.1 });
    // air defence along the flight path fires at the aircraft; the losses fall on the paratroopers
    const fired = new Set();
    for (const i of path) {
      tick(0.1);
      for (const a of S.units) {
        if (u.str <= 0) break;
        if (!G.alive(a) || a.side === u.side || !a.type.aaRange || a.type.air <= 0 || a.ammo <= 0 || a.type.mob === "foot" || fired.has(a.id)) continue;
        if (G.dist(a.idx, i) > a.type.aaRange || !G.los(a.idx, i, G.eyeH(a), H_PLANE)) continue;
        fired.add(a.id);
        a.ammo -= a.type.missile ? 1 : 0.5;
        a.revealed = S.half + 1;
        ev({ type: "fire", from: a.idx, to: i, kind: "aa", side: a.side, toAir: true });
        const k = Math.min(u.str, U.binom(Math.max(1, Math.round(a.str * 0.4)), G.hitProb(a.type.air - 6)));
        if (k) { u.str -= k; ev({ type: "hit", i, txt: "−" + k, air: true }); }
        G.log("Transport aircraft under fire from " + a.type.name + (k ? ": −" + k + " paratroopers" : ": missed"), "#ffb0a0");
      }
    }
    if (u.str <= 0) { u.alive = false; u.reserve = false; G.log(u.type.name + " lost before the drop!", "#ff6a6a"); G.checkOver(); return true; }
    // scatter
    let land = target;
    const free = (i) => !S.hex[i].river && S.hex[i].t !== "water" && !G.at(i, false);
    if (U.random() < 0.45 || !free(target)) {
      const opts = NB[target].filter(free);
      if (opts.length) land = U.pick(opts);
      else if (!free(target)) { G.log("No free drop zone – the jump is called off.", "#ffb36a"); return false; }
    }
    u.reserve = false; u.idx = land; u.moved = u.attacked = true; u.noAttack = true; u.still = false;
    tick(0.2);
    ev({ type: "chute", i: land });
    const h = S.hex[land];
    if (G.TER[h.t].close || h.t === "swamp" || h.t === "mountain") { damage(u, 1); G.log("Rough drop zone: −1.", "#ffb36a"); }
    if (u.alive && nearEnemy(u)) { damage(u, 1); G.log("Hot drop zone: −1.", "#ffb36a"); }
    if (u.alive) {
      const m = h.mine;
      if (m && m.side !== u.side && !m.lane) mineStrike(u, land);
    }
    if (u.alive) { capture(u); G.log(u.type.name + " jump" + (land === target ? "" : ", scattered by the wind") + ".", "#cfe3ff"); }
    G.updateVis();
    G.checkOver();
    return true;
  };

  // how deep a unit can dig in where it stands; infantry that digs in on purpose goes two levels deeper
  function entrenchCap(u) {
    const h = G.S.hex[u.idx];
    let cap = h.t === "city" ? 3 : h.t === "forest" || h.t === "town" ? 2 : 1;
    if (h.e >= 2) cap++;
    return Math.min(4, cap + (u.dug ? 2 : 0));
  }
  G.entrenchCap = entrenchCap;

  /* ======================= turns and the end of the battle ======================= */
  function startSide(side) {
    const S = G.S;
    for (const u of S.units) {
      u.firedAt.clear();
      if (u.side !== side || !u.alive) continue;
      if (!u.type.isAir && !u.reserve && u.idx >= 0) {
        if (u.still) u.entrench = Math.min(entrenchCap(u), u.entrench + 1);
        else { u.entrench = 0; u.dug = false; }
      }
      u.moved = u.attacked = u.noAttack = false; u.attackedNoMove = false; u.mpUsed = 0; u.still = true;
      if (u.landed && !u.grounded) u.landed = false;
    }
    for (let i = 0; i < N; i++) {
      const m = S.hex[i].mine;
      if (m && m.remote && m.side === side && m.expires <= S.turn) { S.hex[i].mine = null; if (side === S.scen.player) G.log("Scattered mines have self-neutralised.", "#aab4c0"); }
    }
  }
  G.endTurn = function () {
    const S = G.S;
    if (S.over) return;
    G.beginAction();
    const side = S.side;
    for (const u of S.units) {
      if (u.side !== side || !G.alive(u)) continue;
      if (u.type.isAir && !u.landed) {
        if (u.mpUsed === 0) u.fuel -= 2;
        if (u.fuel <= 0) { u.fuel = 0; u.landed = true; u.grounded = true; if (side === S.scen.player) G.log(u.type.name + " is out of fuel and makes an emergency landing!", "#ffb36a"); }
      }
      if (u.moved || u.mpUsed > 0) u.still = false;
    }
    if (side === S.scen.attacker && G.objectivesHeld(side)) { G.finish(side, "All objectives taken."); return; }
    S.side = enemyOf(side);
    S.half++;
    if (S.side === S.first) {
      S.turn++;
      if (S.turn > S.maxTurn) { G.finish(enemyOf(S.scen.attacker), "Time is up – the defence held."); return; }
      G.log("— Turn " + S.turn + " of " + S.maxTurn + " —", "#ffffff");
    }
    startSide(S.side);
    G.updateVis();
  };
  G.objectives = () => G.S.hex.map((h, i) => (h.obj ? i : -1)).filter((i) => i >= 0);
  G.objectivesHeld = (side) => G.objectives().every((i) => G.S.hex[i].obj.owner === side);
  G.finish = function (winner, why) {
    const S = G.S;
    S.over = { winner, why, turn: S.turn };
    G.log((winner === S.scen.player ? "VICTORY: " : "DEFEAT: ") + why, winner === S.scen.player ? "#9fe08a" : "#ff6a6a");
  };
  G.checkOver = function () {
    const S = G.S;
    if (S.over) return;
    for (const sd of G.SIDES) {
      const ground = S.units.some((u) => u.side === sd && u.alive && !u.type.farp && !u.type.isAir && (u.reserve || u.idx >= 0 || u.cargoOf));
      if (!ground) { G.finish(enemyOf(sd), MG.NATIONS[sd].name + " has no ground forces left."); return; }
    }
    // a defence also ends when the computer's attack has nothing left on the ground that could take an objective
    const att = S.scen.attacker;
    if (att !== S.scen.player) {
      const MANOEUVRE = ["tank", "ifv", "apc", "inf", "para", "eng", "recon"];
      const can = S.units.some((u) => u.side === att && u.alive && !u.reserve && !u.type.isAir && MANOEUVRE.includes(u.type.icon) && (u.idx >= 0 || u.cargoOf));
      if (!can) G.finish(S.scen.player, MG.NATIONS[att].name + " has no ground forces left to attack with.");
    }
  };
})(window.MG);
