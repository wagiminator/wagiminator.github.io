/* Aviation General: the computer commander. It only knows what its own units have spotted,
   defends or attacks the objectives, and plays one unit at a time so the screen can show it.
   It never makes air assaults or parachute drops, and its FARP stays where it is.              */
"use strict";

(function (MG) {
  const { U } = MG;
  const G = MG.G;
  const AI = (MG.AI = {});

  const prio = (t) => {
    const T = t.type;
    if (t.landed) return 2;
    if (T.heli) return 1.6;
    if (T.farp) return 1.5;
    if (T.aaRange && T.air) return 1.4;
    if (T.ind || T.drone || T.mineRemote) return 1.25;
    if (T.uav) return 0.8;
    return 1;
  };
  function attackScore(u, t) {
    const p = G.predict(u, t);
    let g = p.kill * (t.type.cost / 10) * prio(t);
    if (G.S.hex[t.idx].obj) g *= 1.3;
    return g - p.loss * (u.type.cost / 10) * 1.1;
  }
  function bestTarget(u) {
    let best = null, bs = 0;
    for (const t of G.targets(u)) { const s = attackScore(u, t); if (s > bs) { bs = s; best = t; } }
    return best ? { t: best, s: bs } : null;
  }
  // try a hex for a unit without moving it
  function asIf(u, i, f) { const o = u.idx; u.idx = i; try { return f(); } finally { u.idx = o; } }

  function posScore(u, i, side) {
    const h = G.S.hex[i];
    let s = 0;
    if (!h.river && G.TER[h.t].close) s += u.type.armor ? 1.5 : 3;
    s += h.e * 1.2;
    if (h.river) s -= 4;
    if (h.obj && h.obj.owner === side) s += u.type.armor || u.type.mob === "foot" ? 2.5 : 0;
    // keep away from enemies that could shoot us without us shooting back
    for (const e of G.enemiesSeen(side)) {
      const d = G.dist(e.idx, i);
      if (e.type.ind && d <= e.type.ind) s -= 0.4;
      if (d <= Math.max(1, e.type.range) && !e.type.isAir) s -= 0.6;
    }
    return s;
  }
  const objectives = () => G.objectives();
  function nearestObj(i, pred) {
    let b = -1, bd = 1e9;
    for (const o of objectives()) { if (pred && !pred(o)) continue; const d = G.dist(i, o); if (d < bd) { bd = d; b = o; } }
    return b;
  }
  const myFarp = (side) => G.unitsOf(side).filter((u) => u.type.farp);
  const east = (side) => (G.S.scen.dropEdge ? G.S.scen.dropEdge[side] > 0 : side !== G.S.scen.player);
  // flow field: what it costs a running gear to reach the nearest objective the side does not hold yet
  // (rebuilt every turn, so it routes around blown bridges and known minefields to the fords and lanes)
  let FLOW = null;
  function flow(u, side) {
    const T = u.type, key = T.mob + (T.amph ? "a" : "");
    if (!FLOW || FLOW.turn !== G.S.turn || FLOW.side !== side) FLOW = { turn: G.S.turn, side, m: {} };
    if (FLOW.m[key]) return FLOW.m[key];
    const d = new Float32Array(G.N).fill(1e6), h = U.heap();
    for (const o of objectives()) if (G.S.hex[o].obj.owner !== side) { d[o] = 0; h.push(0, o); }
    while (h.size) {
      const [c, i] = h.pop();
      if (c > d[i]) continue;
      for (const j of G.nb(i)) {
        const k = G.stepCost(T, j, i, side);
        if (!isFinite(k)) continue;
        if (c + k < d[j]) { d[j] = c + k; h.push(c + k, j); }
      }
    }
    return (FLOW.m[key] = d);
  }
  AI.flow = flow;

  /* ---------- the plan for one turn: a generator that yields after each action ---------- */
  AI.turn = function* (side) {
    const S = G.S;
    const cfg = (S.scen.ai && S.scen.ai[side]) || { posture: "defend" };
    if (!AI.anchor) AI.anchor = new Map();
    const order = (u) => {
      const T = u.type;
      if (T.aaRange && T.air) return 0;
      if (T.uav) return 1;
      if (T.drone) return 2;
      if (T.ind) return 3;
      if (T.mineRemote) return 4;
      if (T.heli) return 5;
      if (T.engineer || T.mineLay || T.bridge || T.clear) return 6;
      if (T.farp) return 9;
      return 7;
    };
    const units = G.unitsOf(side).sort((a, b) => order(a) - order(b));
    for (const u of units) {
      if (!G.alive(u) || S.over || S.side !== side) continue;
      if (!AI.anchor.has(u.id)) AI.anchor.set(u.id, nearestObj(u.idx) >= 0 && G.dist(u.idx, nearestObj(u.idx)) <= 4 ? nearestObj(u.idx) : u.idx);
      const T = u.type;
      let acted = false;
      if (T.farp) continue;
      if (T.heli) acted = yield* heli(u, side, cfg);
      else if (T.uav) acted = yield* uav(u, side);
      else if (T.drone) acted = yield* drone(u, side);
      else if (T.aaRange && T.air) acted = yield* airDefence(u, side);
      else if (T.ind) acted = yield* artillery(u, side);
      else if (T.mineRemote) acted = yield* remoteMines(u, side);
      else if (T.engineer || T.mineLay || T.bridge || T.clear) acted = yield* engineer(u, side, cfg);
      else acted = yield* ground(u, side, cfg);
      void acted;
    }
  };

  function act(f) { G.beginAction(); return f(); }

  function* airDefence(u, side) {
    const b = bestTarget(u);
    if (b) { act(() => G.attack(u, b.t)); yield "attack"; return true; }
    return yield* maybeSupply(u);
  }
  function* maybeSupply(u) {
    const A = G.actions(u);
    const sup = A.find((a) => a.id === "resupply");
    if (sup && (u.ammo <= u.type.ammo / 3 || u.mines < (u.type.mines || 0))) { act(() => G.doAction(u, "resupply")); yield "supply"; return true; }
    const re = A.find((a) => a.id === "reinforce");
    if (re && u.str <= 5) { act(() => G.doAction(u, "reinforce")); yield "supply"; return true; }
    return false;
  }

  function* artillery(u, side) {
    const b = bestTarget(u);
    if (b && b.s > 0.5) { act(() => G.attack(u, b.t)); yield "fire"; return true; }
    const near = G.enemiesSeen(side).some((e) => !e.type.isAir && G.dist(e.idx, u.idx) <= 2);
    if (near && G.canMove(u)) { // pull back from the front
      const r = G.reach(u);
      let best = -1, bs = -1e9;
      for (const [i, n] of r) { if (n.pass || i === u.idx) continue; let s = 0; for (const e of G.enemiesSeen(side)) s += Math.min(6, G.dist(e.idx, i)); if (s > bs) { bs = s; best = i; } }
      if (best >= 0) { act(() => G.move(u, best)); yield "move"; return true; }
    }
    return yield* maybeSupply(u);
  }

  function* drone(u, side) {
    let best = null, bs = 1;
    for (const t of G.targets(u)) { const s = G.predict(u, t).kill * (t.type.cost / 10) * prio(t); if (s > bs) { bs = s; best = t; } }
    if (best) { act(() => G.attack(u, best)); yield "drone"; return true; }
    return yield* maybeSupply(u);
  }

  function* remoteMines(u, side) {
    const a = G.actions(u).find((x) => x.id === "rmines");
    if (!a) return yield* maybeSupply(u);
    const foes = G.enemiesSeen(side).filter((e) => !e.type.isAir && objectives().some((o) => G.S.hex[o].obj.owner === side && G.dist(o, e.idx) <= 4));
    let best = -1, bs = 0;
    for (const i of a.hexes) {
      let s = 0;
      for (const e of foes) {
        const d = G.dist(e.idx, i);
        if (d !== 1) continue;
        const o = nearestObj(e.idx, (k) => G.S.hex[k].obj.owner === side);
        if (o >= 0 && G.dist(i, o) < G.dist(e.idx, o)) s += 2 + (G.S.hex[i].road ? 1 : 0);
      }
      if (s > bs) { bs = s; best = i; }
    }
    if (best >= 0) { act(() => G.doAction(u, "rmines", best)); yield "mines"; return true; }
    return false;
  }

  function* engineer(u, side, cfg) {
    const A = G.actions(u);
    const foes = G.enemiesSeen(side).filter((e) => !e.type.isAir);
    // blow a bridge when the enemy comes close
    const dem = A.find((a) => a.id === "demolish");
    if (dem && cfg.posture === "defend") {
      for (const i of dem.hexes) if (foes.some((e) => G.dist(e.idx, i) <= 4) && G.S.hex[i].bridge === "fixed") { act(() => G.doAction(u, "demolish", i)); yield "blow"; return true; }
      return false; // stay by the bridge
    }
    const clr = A.find((a) => a.id === "clear");
    if (clr) { act(() => G.doAction(u, "clear", clr.hexes[0])); yield "clear"; return true; }
    const br = A.find((a) => a.id === "bridge");
    if (br && cfg.posture === "attack") {
      const o = nearestObj(u.idx, (k) => G.S.hex[k].obj.owner !== side);
      const tgt = br.hexes.sort((a, b) => G.dist(a, o) - G.dist(b, o))[0];
      act(() => G.doAction(u, "bridge", tgt)); yield "bridge"; return true;
    }
    const mn = A.find((a) => a.id === "mines");
    if (mn && cfg.posture === "defend") {
      let best = -1, bs = 0;
      for (const i of mn.hexes) {
        const h = G.S.hex[i];
        let s = (h.road ? 2 : 0) + (G.nb(i).some((j) => G.S.hex[j].river) ? 2 : 0);
        const o = nearestObj(i, (k) => G.S.hex[k].obj.owner === side);
        if (o >= 0 && G.dist(i, o) <= 2) s += 1.5;
        if (G.S.hex[i].obj) s = 0;
        if (s > bs) { bs = s; best = i; }
      }
      if (best >= 0) { act(() => G.doAction(u, "mines", best)); yield "mines"; return true; }
    }
    if (!G.canMove(u)) return false;
    // move: minelayers walk to the crossings, bridge layers and clearers follow the attack
    const r = G.reach(u);
    let goal;
    if (cfg.posture === "attack") goal = nearestObj(u.idx, (k) => G.S.hex[k].obj.owner !== side);
    else if (u.type.mineLay && u.mines > 0) {
      // the river bank hex nearest to an own objective that has no mines yet
      let gb = -1, gd = 1e9;
      for (let i = 0; i < G.N; i++) {
        const h = G.S.hex[i];
        if (h.river || h.mine || h.t === "water" || !G.nb(i).some((j) => G.S.hex[j].river)) continue;
        const o = nearestObj(i, (k) => G.S.hex[k].obj.owner === side);
        if (o < 0 || G.dist(i, o) > 4) continue;
        if (east(side) ? G.col(i) < G.col(o) - 4 : G.col(i) > G.col(o) + 4) continue;
        const d = G.dist(u.idx, i);
        if (d < gd) { gd = d; gb = i; }
      }
      goal = gb;
    } else return false;
    if (goal < 0) return false;
    const F = cfg.posture === "attack" ? flow(u, side) : null;
    const dd = (i) => (F && F[i] < 1e6 ? F[i] : G.dist(i, goal) + (G.S.hex[i].river ? 3 : 0));
    let best = -1, bs = dd(u.idx);
    for (const [i, n] of r) { if (n.pass || i === u.idx) continue; const d = dd(i); if (d < bs) { bs = d; best = i; } }
    if (best >= 0) { act(() => G.move(u, best)); yield "move"; return true; }
    return false;
  }

  function* uav(u, side) {
    const farps = myFarp(side);
    const fd = farps.length ? Math.min(...farps.map((f) => G.dist(f.idx, u.idx))) : 99;
    if ((u.fuel <= fd + 3 || u.str <= 4) && farps.length) return yield* goRearm(u, side);
    if (!G.canMove(u)) return false;
    // look where the enemy is (or should be), but stay out of known air-defence reach
    const foes = [...G.S.mem[side].values()];
    let tx, ty;
    if (foes.length) { tx = foes.reduce((a, m) => a + G.col(m.idx), 0) / foes.length; ty = foes.reduce((a, m) => a + G.row(m.idx), 0) / foes.length; }
    else { const o = objectives()[0]; tx = east(side) ? 6 : G.W - 6; ty = G.row(o); }
    const r = G.reach(u);
    let best = u.idx, bs = -1e9;
    for (const [i, n] of r) {
      if (n.pass) continue;
      const left = u.fuel - n.cost;
      const back = farps.length ? Math.min(...farps.map((f) => G.dist(f.idx, i))) : 0;
      if (left < back + 2) continue;
      const s = -Math.hypot(G.col(i) - tx, G.row(i) - ty) * 0.6 - G.threat(side, i, 3) * 12;
      if (s > bs) { bs = s; best = i; }
    }
    if (best !== u.idx) { act(() => G.move(u, best)); yield "move"; return true; }
    return false;
  }

  function* goRearm(u, side) {
    const farps = myFarp(side);
    if (!farps.length) return false;
    if (G.farpNear(u)) { const a = G.actions(u).find((x) => x.id === "rearm"); if (a) { act(() => G.doAction(u, "rearm")); yield "rearm"; return true; } return false; }
    if (!G.canMove(u)) return false;
    const r = G.reach(u);
    let best = -1, bs = 1e9;
    for (const [i, n] of r) {
      if (n.pass) continue;
      const d = Math.min(...farps.map((f) => G.dist(f.idx, i)));
      const s = d * 3 + G.threat(side, i, 1.4) * 4;
      if (s < bs) { bs = s; best = i; }
    }
    if (best >= 0 && best !== u.idx) { act(() => G.move(u, best)); yield "move"; }
    if (G.alive(u) && G.farpNear(u)) { const a = G.actions(u).find((x) => x.id === "rearm"); if (a) { act(() => G.doAction(u, "rearm")); yield "rearm"; } }
    return true;
  }

  function* heli(u, side, cfg) {
    if (u.grounded || u.landed) return false;
    if (u.type.cap) return false; // transport helicopters are left to the player
    const farps = myFarp(side);
    const fdist = (i) => (farps.length ? Math.min(...farps.map((f) => G.dist(f.idx, i))) : 0);
    if (u.ammo <= 0 || u.fuel < fdist(u.idx) + 5 || u.str <= 4) return yield* goRearm(u, side);
    // the best place to pop up and fire from
    const r = G.reach(u);
    let best = null, bs = 1.5;
    for (const [i, n] of r) {
      if (n.pass) continue;
      if (u.fuel - n.cost < fdist(i) + 3) continue;
      const risk = G.threat(side, i, 1.4);
      asIf(u, i, () => {
        for (const t of G.enemiesSeen(side)) {
          if (!G.canAttack(u, t)) continue;
          const s = attackScore(u, t) - risk * (u.type.cost / 10) * 0.9;
          if (s > bs) { bs = s; best = { i, t }; }
        }
      });
    }
    if (best) {
      if (best.i !== u.idx) { act(() => G.move(u, best.i)); yield "move"; }
      if (G.alive(u) && G.canAttack(u, best.t)) { act(() => G.attack(u, best.t)); yield "attack"; }
      // duck back into cover with what is left of the move
      if (G.alive(u) && G.canMove(u)) {
        const r2 = G.reach(u);
        let back = -1, bb = G.threat(side, u.idx, 1.4) * 5 + fdist(u.idx) * 0.3;
        for (const [i, n] of r2) { if (n.pass) continue; const s = G.threat(side, i, 1.4) * 5 + fdist(i) * 0.3; if (s < bb - 0.2) { bb = s; back = i; } }
        if (back >= 0) { act(() => G.move(u, back)); yield "move"; }
      }
      return true;
    }
    // nothing worth the risk: wait near the FARP
    if (u.fuel < (u.type.fuel * 2) / 3) return yield* goRearm(u, side);
    return false;
  }

  function* ground(u, side, cfg) {
    const S = G.S;
    if (yield* maybeSupplyQuiet(u)) return true;
    // first choice: shoot from where we stand if it pays
    const here = bestTarget(u);
    const attackPosture = cfg.posture === "attack";
    // the hex this unit guards (or wants), and how far it may stray
    let anchor = AI.anchor.get(u.id), leash = 3;
    const lost = objectives().filter((o) => S.hex[o].obj.owner !== side && G.dist(o, u.idx) <= 5);
    if (attackPosture) { anchor = nearestObj(u.idx, (k) => S.hex[k].obj.owner !== side); leash = 99; if (anchor < 0) anchor = u.idx; }
    else if (lost.length) { anchor = lost.sort((a, b) => G.dist(a, u.idx) - G.dist(b, u.idx))[0]; leash = 6; }
    if (here && here.s > 3 && !attackPosture) { act(() => G.attack(u, here.t)); yield "attack"; return true; }
    if (!G.canMove(u)) { if (here && here.s > 0) { act(() => G.attack(u, here.t)); yield "attack"; } return true; }
    const r = G.reach(u);
    const F = attackPosture ? flow(u, side) : null;
    const far = (i) => (F[i] >= 1e6 ? G.dist(i, anchor) * 3 : F[i]);
    const stay = posScore(u, u.idx, side) + Math.min(2, u.entrench + 1) * 0.8 + (here ? here.s * 0.5 : 0) - (attackPosture ? far(u.idx) * 1.5 : 0);
    let best = { i: u.idx, s: stay, t: here ? here.t : null };
    for (const [i, n] of r) {
      if (n.pass || i === u.idx) continue;
      if (!attackPosture && G.dist(i, anchor) > leash) continue;
      let s = posScore(u, i, side);
      const h = S.hex[i];
      if (h.obj && h.obj.owner !== side) s += 12;
      if (attackPosture) s -= far(i) * 1.5;
      let tgt = null;
      if (!(n.slow && u.type.mob !== "foot")) {
        asIf(u, i, () => {
          let ts = 0;
          for (const t of G.enemiesSeen(side)) { if (!G.canAttack(u, t)) continue; const v = attackScore(u, t); if (v > ts) { ts = v; tgt = t; } }
          s += ts * 0.5;
        });
      }
      if (s > best.s + 0.5) best = { i, s, t: tgt };
    }
    if (best.i !== u.idx) { act(() => G.move(u, best.i)); yield "move"; }
    if (G.alive(u)) {
      const b = bestTarget(u);
      if (b && b.s > (attackPosture ? 0 : 0.5)) { act(() => G.attack(u, b.t)); yield "attack"; }
      else if (!attackPosture && best.i === u.idx && G.actions(u).some((a) => a.id === "digin")) { act(() => G.doAction(u, "digin")); yield "dig"; }
    }
    return true;
  }
  function* maybeSupplyQuiet(u) {
    if (u.ammo <= 1 || (u.str <= 4 && G.S.sides[u.side].prestige > 60)) return yield* maybeSupply(u);
    return false;
  }

  /* ---------- driver used by the screen and by the tests ---------- */
  AI.start = (side) => { AI.gen = AI.turn(side); AI.busy = true; };
  // advance by one action; returns false when the turn is over
  AI.step = function () {
    if (!AI.gen) return false;
    let r;
    try { r = AI.gen.next(); } catch (e) { console.error(e); r = { done: true }; }
    if (r.done) { AI.gen = null; AI.busy = false; return false; }
    return true;
  };
  AI.reset = () => { AI.gen = null; AI.busy = false; AI.anchor = new Map(); };
})(window.MG);
