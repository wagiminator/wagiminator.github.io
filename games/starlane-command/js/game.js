/* Starlane Command: the simulation of one operation – systems, lanes, fleets, supply convoys,
   production, combat, invasion and razing. Rendering and input live in play.js. */
"use strict";

(function (SL) {
  const { U } = SL;

  /* ---------- rules ---------- */
  const R = (SL.RULES = {
    UNIT_HP: 10,
    // damage per unit and second against fleets, defences (shield first, then station),
    // ground troops and – for siege fleets ordered to raze – the system itself
    DPS: {
      B: { fleet: 3.0, def: 1.2, ground: 0, raze: 0 },
      S: { fleet: 0.6, def: 4.0, ground: 0.5, raze: 3.0 },
      I: { fleet: 0.5, def: 0, ground: 1.6, raze: 0 },
    },
    COST: { B: 2, S: 3, I: 2, shield: 4, station: 6 },
    SHIELD_HP: 40, SHIELD_REGEN: 2, STATION_HP: 50, STATION_DPS: 5,
    BUILD_TIME: 5, RES_TIME: 8, CONVOY_LOAD: 2, BASE_TIME: 10,
    FLEET_SPEED: 52, CONVOY_SPEED: 78,
    TROOP_CAP: { ind: 12, res: 8, rep: 8, out: 6, ruin: 0 },
    TROOP_REGEN: 0.15, TROOPS_PER_INVADER: 2,
    STRUCT: 100, REPAIR: 3,
  });
  const TYPES = ["B", "S", "I"];
  SL.TYPE_NAME = { B: "Battle", S: "Siege", I: "Invasion" };
  SL.SYS_NAME = { ind: "Shipyard", res: "Mining colony", rep: "Repair dock", out: "Outpost", ruin: "Ruins" };

  const G = (SL.G = { on: null });
  const emit = (type, data) => { if (G.on) G.on(type, data); };

  /* ---------- setup ---------- */
  G.start = function (def) {
    const s = {
      def, t: 0, sys: [], lanes: [], adj: [], fleets: [], convoys: [], fx: [], nextId: 1,
      players: [], over: null, holdT: 0,
      stats: { built: 0, lost: 0, killed: 0, captured: 0, delivered: 0, razed: 0 },
    };
    G.s = s;
    const keyIdx = {};
    def.systems.forEach((d, i) => {
      keyIdx[d.k] = i;
      const type = d.t || "out";
      const sys = {
        id: i, k: d.k, name: d.n || d.k, x: d.x, y: d.y, type, owner: d.o === undefined ? -1 : d.o,
        cap: d.cap !== undefined ? d.cap : R.TROOP_CAP[type], troops: 0, struct: R.STRUCT,
        shield: d.sh ? { hp: R.SHIELD_HP } : null, station: d.st ? { hp: R.STATION_HP } : null,
        mode: d.mode || "B", buildT: 0, resT: U.rand(0, 3), baseT: 0, stock: 0, raze: {}, fight: 0, flash: 0, alertT: 0,
      };
      sys.troops = d.tr !== undefined ? d.tr : sys.cap;
      if (d.tr !== undefined && d.tr > sys.cap) sys.cap = d.tr;
      s.sys.push(sys);
      s.adj.push([]);
    });
    for (const [a, b] of def.lanes) {
      const ia = typeof a === "number" ? a : keyIdx[a], ib = typeof b === "number" ? b : keyIdx[b];
      if (ia === undefined || ib === undefined) throw new Error("bad lane " + a + "-" + b);
      const len = Math.hypot(s.sys[ia].x - s.sys[ib].x, s.sys[ia].y - s.sys[ib].y);
      s.lanes.push({ a: ia, b: ib, len });
      s.adj[ia].push({ to: ib, len });
      s.adj[ib].push({ to: ia, len });
    }
    const np = def.players || 2;
    for (let i = 0; i < np; i++) {
      s.players.push({
        id: i, ai: i > 0, level: (def.ai && def.ai[i - 1]) || "normal",
        bank: def.bank ? (Array.isArray(def.bank) ? def.bank[i] || 0 : def.bank) : 4,
        mult: 1, alive: true, col: def.colors ? def.colors[i] : i,
      });
    }
    // starting fleets
    def.systems.forEach((d, i) => {
      if (!d.f) return;
      for (const t of TYPES) if (d.f[t]) G.addFleet(i, d.fo !== undefined ? d.fo : s.sys[i].owner, t, d.f[t]);
    });
    if (def.keyIdx === undefined) def.keyIdx = keyIdx;
    s.goal = def.goal || { type: "elim" };
    return s;
  };
  G.sysByKey = (k) => G.s.sys[G.s.def.keyIdx[k]];

  /* ---------- fleets ---------- */
  G.addFleet = function (sysId, owner, type, n, hp) {
    const s = G.s;
    const ex = s.fleets.find((f) => f.at === sysId && f.o === owner && f.t === type);
    hp = hp === undefined ? n * R.UNIT_HP : hp;
    if (ex) { ex.n += n; ex.hp += hp; return ex; }
    const f = { id: s.nextId++, o: owner, t: type, n, hp, at: sysId, path: [], from: -1, to: -1, d: 0, len: 0, ang: -Math.PI / 2 };
    s.fleets.push(f);
    return f;
  };
  G.fleetsAt = (sysId) => G.s.fleets.filter((f) => f.at === sysId);
  G.unitsAt = (sysId, owner) => {
    const r = { B: 0, S: 0, I: 0 };
    for (const f of G.s.fleets) if (f.at === sysId && f.o === owner) r[f.t] += f.n;
    return r;
  };
  G.moving = (owner) => G.s.fleets.filter((f) => f.at === null && (owner === undefined || f.o === owner));

  /* ---------- paths (Dijkstra over the lanes) ---------- */
  G.path = function (from, to, allow) {
    const s = G.s, n = s.sys.length;
    if (from === to) return [];
    const dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false);
    dist[from] = 0;
    for (;;) {
      let u = -1, best = Infinity;
      for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
      if (u < 0 || u === to) break;
      done[u] = true;
      for (const e of s.adj[u]) {
        if (allow && e.to !== to && !allow(e.to)) continue;
        const nd = dist[u] + e.len;
        if (nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = u; }
      }
    }
    if (dist[to] === Infinity) return null;
    const p = [];
    for (let v = to; v !== from; v = prev[v]) p.unshift(v);
    p.dist = dist[to];
    return p;
  };
  G.dist = function (from, to) { const p = G.path(from, to); return p ? p.dist : Infinity; };

  /* ---------- orders ---------- */
  // send fleets of the given types from one system to another; frac 0.5 sends half of each fleet
  G.order = function (owner, from, to, types, frac = 1) {
    const s = G.s;
    if (from === to || s.over) return 0;
    const path = G.path(from, to);
    if (!path) return 0;
    let sent = 0;
    for (const f of s.fleets.slice()) {
      if (f.at !== from || f.o !== owner || !types[f.t]) continue;
      let k = frac >= 1 ? f.n : Math.floor(f.n * frac);
      if (k <= 0) continue;
      let mover = f;
      if (k < f.n) {
        const hp = f.hp * (k / f.n);
        f.hp -= hp; f.n -= k;
        mover = { id: s.nextId++, o: owner, t: f.t, n: k, hp, at: from, path: [], from: -1, to: -1, d: 0, len: 0, ang: f.ang };
        s.fleets.push(mover);
      }
      depart(mover, from, path.slice());
      sent += k;
    }
    if (sent) emit("launch", { owner, from, to, n: sent });
    return sent;
  };
  function depart(f, from, path) {
    const s = G.s;
    f.at = null;
    f.from = from;
    f.to = path.shift();
    f.path = path;
    f.d = 0;
    f.len = s.adj[from].find((e) => e.to === f.to).len;
    f.dest = path.length ? path[path.length - 1] : f.to;
    const a = s.sys[from], b = s.sys[f.to];
    f.ang = Math.atan2(b.y - a.y, b.x - a.x);
  }
  G.setMode = function (owner, sysId, mode) {
    const sys = G.s.sys[sysId];
    if (sys.owner !== owner || sys.type !== "ind") return false;
    sys.mode = mode;
    return true;
  };
  G.canBuy = function (owner, sysId, kind) {
    const s = G.s, sys = s.sys[sysId];
    if (sys.owner !== owner || sys.type === "ruin" || s.over) return false;
    if (sys[kind]) return false;
    return s.players[owner].bank >= R.COST[kind];
  };
  G.buy = function (owner, sysId, kind) {
    if (!G.canBuy(owner, sysId, kind)) return false;
    const s = G.s, sys = s.sys[sysId];
    s.players[owner].bank -= R.COST[kind];
    sys[kind] = { hp: kind === "shield" ? R.SHIELD_HP : R.STATION_HP };
    emit(kind, { owner, sys: sysId });
    return true;
  };
  G.setRaze = function (owner, sysId, on) { G.s.sys[sysId].raze[owner] = !!on; };

  /* ---------- helpers ---------- */
  const hostile = (a, b) => a !== b;
  function defended(sys) { return (sys.shield && sys.shield.hp > 0) || (sys.station && sys.station.hp > 0); }
  G.defended = defended;
  function hostileFleetsAt(sysId, owner) { return G.s.fleets.some((f) => f.at === sysId && f.o !== owner); }
  G.hostileFleetsAt = hostileFleetsAt;
  // a system with enemy fleets or an enemy station stops fleets passing through
  function blocks(sys, owner) {
    if (hostileFleetsAt(sys.id, owner)) return true;
    return sys.owner !== owner && sys.station && sys.station.hp > 0;
  }

  /* ---------- simulation step ---------- */
  G.update = function (dt) {
    const s = G.s;
    if (s.over) { updateFx(dt); return; }
    s.t += dt;
    moveFleets(dt);
    moveConvoys(dt);
    combat(dt);
    economy(dt);
    updateFx(dt);
    checkEnd(dt);
  };

  function moveFleets(dt) {
    const s = G.s;
    for (const f of s.fleets) {
      if (f.at !== null) continue;
      f.d += R.FLEET_SPEED * dt;
      if (f.d < f.len) continue;
      const node = f.to, sys = s.sys[node];
      if (!f.path.length || blocks(sys, f.o)) {
        // stop here and join a fleet of the same kind
        f.at = node; f.path = []; f.from = f.to = -1; f.d = 0;
        const ex = s.fleets.find((g) => g !== f && g.at === node && g.o === f.o && g.t === f.t);
        if (ex) { ex.n += f.n; ex.hp += f.hp; f.dead = true; }
        emit("arrive", { owner: f.o, sys: node, type: f.t, blocked: f.dest !== node });
      } else {
        depart(f, node, f.path);
      }
    }
    s.fleets = s.fleets.filter((f) => !f.dead);
  }

  /* ---------- supply ---------- */
  function supplyPath(owner, from) {
    // nearest own shipyard reachable through own systems
    const s = G.s;
    let best = null;
    for (const t of s.sys) {
      if (t.owner !== owner || t.type !== "ind") continue;
      const p = t.id === from ? [] : G.path(from, t.id, (i) => s.sys[i].owner === owner);
      if (p && (!best || (p.dist || 0) < best.dist)) { best = p; best.dist = p.dist || 0; }
    }
    return best;
  }
  function moveConvoys(dt) {
    const s = G.s;
    for (const c of s.convoys) {
      c.d += R.CONVOY_SPEED * dt;
      if (c.d < c.len) continue;
      const node = c.to, sys = s.sys[node];
      // intercepted: an enemy fleet in the system takes the load, a lost system destroys it
      const raider = s.fleets.find((f) => f.at === node && f.o !== c.o);
      if (raider || sys.owner !== c.o) {
        c.dead = true;
        if (raider) { s.players[raider.o].bank += c.load; emit("stolen", { owner: c.o, by: raider.o, sys: node }); }
        else emit("convoyLost", { owner: c.o, sys: node });
        continue;
      }
      if (!c.path.length) {
        c.dead = true;
        s.players[c.o].bank += c.load * s.players[c.o].mult;
        if (c.o === 0) s.stats.delivered += c.load;
        emit("delivered", { owner: c.o, sys: node, load: c.load });
        continue;
      }
      c.from = node; c.to = c.path.shift(); c.d = 0;
      c.len = s.adj[node].find((e) => e.to === c.to).len;
    }
    s.convoys = s.convoys.filter((c) => !c.dead);
  }
  function sendConvoy(sys) {
    const s = G.s, p = supplyPath(sys.owner, sys.id);
    if (!p) return false;
    if (!p.length) { // the mine is itself a shipyard
      s.players[sys.owner].bank += R.CONVOY_LOAD * s.players[sys.owner].mult;
      if (sys.owner === 0) s.stats.delivered += R.CONVOY_LOAD;
      return true;
    }
    const path = p.slice(), to = path.shift();
    s.convoys.push({ o: sys.owner, load: R.CONVOY_LOAD, from: sys.id, to, path, d: 0, len: s.adj[sys.id].find((e) => e.to === to).len });
    return true;
  }

  function economy(dt) {
    const s = G.s;
    for (const sys of s.sys) {
      const o = sys.owner;
      const besieged = o >= 0 ? hostileFleetsAt(sys.id, o) : s.fleets.some((f) => f.at === sys.id);
      // ground troops recover while no enemy is in orbit
      if (!besieged && sys.troops < sys.cap) sys.troops = Math.min(sys.cap, sys.troops + R.TROOP_REGEN * dt);
      if (!besieged && sys.shield && sys.shield.hp < R.SHIELD_HP) sys.shield.hp = Math.min(R.SHIELD_HP, sys.shield.hp + R.SHIELD_REGEN * dt);
      if (!besieged && sys.station && sys.station.hp < R.STATION_HP) sys.station.hp = Math.min(R.STATION_HP, sys.station.hp + 0.5 * dt);
      if (sys.struct < R.STRUCT && !s.fleets.some((f) => f.at === sys.id && f.t === "S" && f.o !== o)) sys.struct = Math.min(R.STRUCT, sys.struct + 2 * dt);
      if (o < 0) continue;
      const pl = s.players[o];
      if (sys.type === "ind") {
        sys.baseT += dt;
        if (sys.baseT >= R.BASE_TIME) { sys.baseT -= R.BASE_TIME; pl.bank += 1; }
        if (sys.mode !== "off") {
          sys.buildT = Math.min(R.BUILD_TIME, sys.buildT + dt);
          const cost = R.COST[sys.mode];
          if (sys.buildT >= R.BUILD_TIME && pl.bank >= cost) {
            pl.bank -= cost; sys.buildT = 0;
            G.addFleet(sys.id, o, sys.mode, 1);
            if (o === 0) s.stats.built++;
            emit("built", { owner: o, sys: sys.id, type: sys.mode });
          }
        }
      } else if (sys.type === "res") {
        if (!besieged) {
          sys.resT += dt;
          if (sys.resT >= R.RES_TIME) { sys.resT -= R.RES_TIME; sys.stock = Math.min(3, sys.stock + 1); }
        }
        if (sys.stock > 0 && !besieged && sendConvoy(sys)) sys.stock--;
      }
      // repair docks (and slowly shipyards) mend damaged ships
      const rate = sys.type === "rep" ? R.REPAIR : sys.type === "ind" ? R.REPAIR * 0.35 : 0;
      if (rate && !besieged) for (const f of s.fleets) if (f.at === sys.id && f.o === o) f.hp = Math.min(f.n * R.UNIT_HP, f.hp + rate * f.n * dt * 0.5);
    }
  }

  /* ---------- combat ---------- */
  function combat(dt) {
    const s = G.s;
    const byS = new Map();
    for (const f of s.fleets) if (f.at !== null) { if (!byS.has(f.at)) byS.set(f.at, []); byS.get(f.at).push(f); }
    for (const sys of s.sys) {
      sys.fight = Math.max(0, sys.fight - dt);
      const here = byS.get(sys.id) || [];
      const stationUp = sys.station && sys.station.hp > 0;
      if (!here.length) continue;
      const dmg = new Map();
      let defDmg = 0, groundDmg = {}, razeDmg = {}, any = false;
      for (const f of here) {
        const D = R.DPS[f.t], u = f.n;
        const foes = here.filter((g) => hostile(g.o, f.o));
        const sysHostile = hostile(sys.owner, f.o);
        if (foes.length && D.fleet) {
          const tot = foes.reduce((a, g) => a + g.hp, 0);
          for (const g of foes) dmg.set(g, (dmg.get(g) || 0) + (D.fleet * u * dt * g.hp) / tot);
          any = true;
        }
        if (sysHostile && defended(sys)) {
          if (D.def && (f.t !== "B" || !foes.length)) { defDmg += D.def * u * dt; any = true; }
        } else if (sysHostile && sys.type !== "ruin") {
          if (f.t === "S" && sys.raze[f.o]) {
            razeDmg[f.o] = (razeDmg[f.o] || 0) + D.raze * u * dt; any = true;
          } else if (D.ground && sys.troops > 0) {
            groundDmg[f.o] = (groundDmg[f.o] || 0) + D.ground * u * dt; any = true;
          }
        }
      }
      // the station fires at every hostile fleet in orbit
      if (stationUp) {
        const foes = here.filter((g) => hostile(g.o, sys.owner));
        const tot = foes.reduce((a, g) => a + g.hp, 0);
        for (const g of foes) dmg.set(g, (dmg.get(g) || 0) + (R.STATION_DPS * dt * g.hp) / tot);
        if (foes.length) any = true;
      }
      if (!any) continue;
      sys.fight = 0.4;
      // apply
      for (const [f, d] of dmg) {
        f.hp -= d;
        const n = Math.max(0, Math.ceil(f.hp / R.UNIT_HP - 1e-6));
        if (n < f.n) {
          const lost = f.n - n;
          if (f.o === 0) s.stats.lost += lost; else s.stats.killed += lost;
          f.n = n;
          emit("unitLost", { owner: f.o, sys: sys.id, n: lost, type: f.t });
          addFx("boom", sys.x + U.rand(-30, 30), sys.y + U.rand(-30, 30), D_col(f.o));
        }
        if (f.n <= 0) { f.dead = true; emit("fleetLost", { owner: f.o, sys: sys.id, type: f.t }); }
      }
      if (defDmg > 0) {
        if (sys.shield && sys.shield.hp > 0) {
          sys.shield.hp -= defDmg;
          if (sys.shield.hp <= 0) { const rest = -sys.shield.hp; sys.shield = null; emit("shieldDown", { sys: sys.id, owner: sys.owner }); if (sys.station) sys.station.hp -= rest; }
        } else if (sys.station) sys.station.hp -= defDmg;
        if (sys.station && sys.station.hp <= 0) { sys.station = null; addFx("bigboom", sys.x, sys.y, D_col(sys.owner)); emit("stationDown", { sys: sys.id, owner: sys.owner }); }
      }
      let gsum = 0;
      for (const o in groundDmg) gsum += groundDmg[o];
      if (gsum > 0) sys.troops = Math.max(0, sys.troops - gsum);
      for (const o in razeDmg) sys.struct -= razeDmg[o];
      s.fleets = s.fleets.filter((f) => !f.dead);
      if (sys.struct <= 0) { razeSystem(sys, +Object.keys(razeDmg)[0]); continue; }
      // invasion: no troops, no defences and no other fleets left
      if (sys.troops <= 0.001 && !defended(sys) && sys.type !== "ruin") {
        const left = s.fleets.filter((f) => f.at === sys.id);
        const owners = new Set(left.map((f) => f.o));
        const inv = left.find((f) => f.t === "I" && f.o !== sys.owner);
        if (inv && owners.size === 1) capture(sys, inv);
      }
    }
  }
  const D_col = (o) => (SL.D ? SL.D.col(o) : "#fff");
  G.colIdx = (o) => (o < 0 ? -1 : G.s && G.s.players[o] ? G.s.players[o].col : o);

  function capture(sys, inv) {
    const s = G.s, old = sys.owner;
    sys.owner = inv.o;
    sys.troops = Math.min(sys.cap, inv.n * R.TROOPS_PER_INVADER);
    sys.raze = {}; sys.buildT = 0; sys.stock = 0; sys.resT = 0; sys.struct = R.STRUCT;
    if (sys.type === "ind") sys.mode = "B";
    // the invasion force lands and becomes the garrison
    inv.dead = true;
    s.fleets = s.fleets.filter((f) => !f.dead);
    if (inv.o === 0) s.stats.captured++;
    addFx("ring", sys.x, sys.y, D_col(inv.o));
    emit("captured", { sys: sys.id, owner: inv.o, from: old });
  }
  function razeSystem(sys, by) {
    const s = G.s, old = sys.owner;
    sys.type = "ruin"; sys.owner = -1; sys.cap = 0; sys.troops = 0; sys.shield = null; sys.station = null;
    sys.struct = R.STRUCT; sys.raze = {}; sys.stock = 0;
    if (by === 0) s.stats.razed++;
    addFx("bigboom", sys.x, sys.y, "#ffb060");
    addFx("ring", sys.x, sys.y, "#ffb060");
    emit("razed", { sys: sys.id, owner: old, by });
  }

  /* ---------- effects (only for the display) ---------- */
  function addFx(kind, x, y, col) { G.s.fx.push({ kind, x, y, col, t: 0, life: kind === "bigboom" ? 1.2 : kind === "ring" ? 1.0 : 0.5 }); }
  G.addFx = addFx;
  function updateFx(dt) {
    const s = G.s;
    for (const f of s.fx) f.t += dt;
    s.fx = s.fx.filter((f) => f.t < f.life);
  }

  /* ---------- victory and defeat ---------- */
  G.alive = function (o) {
    const s = G.s;
    return s.sys.some((x) => x.owner === o) || s.fleets.some((f) => f.o === o);
  };
  G.progress = function () {
    // returns { text, frac } describing the mission goal
    const s = G.s, g = s.goal;
    const own = (k) => G.sysByKey(k).owner === 0;
    switch (g.type) {
      case "ownAll": { const all = s.sys.filter((x) => x.type !== "ruin"); const n = all.filter((x) => x.owner === 0).length; return { text: `Systems held ${n} / ${all.length}`, frac: n / all.length }; }
      case "collect": return { text: `Supply delivered ${s.stats.delivered} / ${g.n}`, frac: s.stats.delivered / g.n };
      case "capture": { const n = g.sys.filter(own).length; return { text: `Targets taken ${n} / ${g.sys.length}`, frac: n / g.sys.length }; }
      case "raze": { const n = g.sys.filter((k) => G.sysByKey(k).type === "ruin").length; return { text: `Targets razed ${n} / ${g.sys.length}`, frac: n / g.sys.length }; }
      case "hold": return { text: `Hold ${G.sysByKey(g.sys).name}: ${fmtT(Math.max(0, g.time - s.holdT))}`, frac: s.holdT / g.time };
      default: { const foes = s.players.filter((p) => p.id > 0); const n = foes.filter((p) => !p.alive).length; return { text: `Enemies defeated ${n} / ${foes.length}`, frac: n / foes.length }; }
    }
  };
  const fmtT = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
  SL.fmtT = fmtT;

  function checkEnd(dt) {
    const s = G.s, g = s.goal;
    for (const p of s.players) if (p.alive && !G.alive(p.id)) { p.alive = false; emit("eliminated", { owner: p.id }); }
    if (!s.players[0].alive) return finish(false, "Your forces have been wiped out.");
    if (g.keep && G.sysByKey(g.keep).owner !== 0) return finish(false, `${G.sysByKey(g.keep).name} has fallen.`);
    if (g.limit && s.t > g.limit) return finish(false, "Time ran out.");
    let won = false;
    switch (g.type) {
      case "ownAll": won = s.sys.every((x) => x.type === "ruin" || x.owner === 0); break;
      case "collect": won = s.stats.delivered >= g.n; break;
      case "capture": won = g.sys.every((k) => G.sysByKey(k).owner === 0); break;
      case "raze": won = g.sys.every((k) => G.sysByKey(k).type === "ruin"); break;
      case "hold":
        if (G.sysByKey(g.sys).owner === 0) s.holdT += dt;
        won = s.holdT >= g.time;
        break;
      default: won = s.players.every((p) => p.id === 0 || !p.alive);
    }
    if (g.type !== "elim" && g.type !== "ownAll" && !won && s.players.length > 1 && s.players.every((p) => p.id === 0 || !p.alive)) won = true;
    if (won) finish(true, "All objectives complete.");
  }
  function finish(win, why) {
    const s = G.s;
    s.over = { win, why, t: s.t };
    emit(win ? "win" : "lose", { why });
  }
})(window.SL);
