/* Starlane Command: the computer commanders. Each one looks at the map every second or so,
   sets what its shipyards build, buys defences, answers threats and launches attacks. */
"use strict";

(function (SL) {
  const { U, G } = SL;
  const R = SL.RULES;

  const LEVEL = {
    // grace: seconds at the start in which a commander only claims unowned systems
    easy: { every: 3.2, margin: 2.0, mix: { B: 0.45, S: 0.15, I: 0.4 }, mult: 0.7, defend: 0.3, raze: 0.15, grace: 120 },
    normal: { every: 2.0, margin: 1.6, mix: { B: 0.5, S: 0.2, I: 0.3 }, mult: 0.85, defend: 0.6, raze: 0.35, grace: 60 },
    hard: { every: 1.1, margin: 1.25, mix: { B: 0.5, S: 0.2, I: 0.3 }, mult: 1.05, defend: 0.9, raze: 0.6, grace: 25 },
  };
  const VALUE = { ind: 4, res: 3, rep: 2, out: 1, ruin: 0.3 };
  const STR = { B: 1, S: 0.3, I: 0.25 };

  const AI = (SL.AI = {});
  AI.init = function (s) {
    for (const p of s.players) if (p.ai) {
      const L = LEVEL[p.level] || LEVEL.normal;
      p.L = L; p.mult = L.mult; p.aiT = 1 + p.id * 0.3;
      p.target = null;
    }
  };

  // distances from one system to all others
  function distAll(s, from) {
    const n = s.sys.length, dist = new Array(n).fill(Infinity), done = new Array(n).fill(false);
    dist[from] = 0;
    for (;;) {
      let u = -1, b = Infinity;
      for (let i = 0; i < n; i++) if (!done[i] && dist[i] < b) { b = dist[i]; u = i; }
      if (u < 0) break;
      done[u] = true;
      for (const e of s.adj[u]) if (dist[u] + e.len < dist[e.to]) dist[e.to] = dist[u] + e.len;
    }
    return dist;
  }
  const strength = (u) => u.B * STR.B + u.S * STR.S + u.I * STR.I;
  function hostileStrengthAt(s, sysId, o, incoming = true) {
    let t = 0;
    for (const f of s.fleets) {
      if (f.o === o) continue;
      if (f.at === sysId || (incoming && f.at === null && f.dest === sysId)) t += f.n * STR[f.t];
    }
    return t;
  }

  AI.update = function (dt) {
    const s = G.s;
    if (s.over) return;
    for (const p of s.players) {
      if (!p.ai || !p.alive) continue;
      p.aiT -= dt;
      if (p.aiT > 0) continue;
      p.aiT = p.L.every * U.rand(0.85, 1.15);
      think(s, p);
    }
  };

  function think(s, p) {
    const o = p.id, L = p.L;
    const mine = s.sys.filter((x) => x.owner === o);
    const total = { B: 0, S: 0, I: 0 };
    for (const f of s.fleets) if (f.o === o) total[f.t] += f.n;
    const neighbours = (id) => s.adj[id].map((e) => e.to);
    const frontier = (x) => neighbours(x.id).some((j) => s.sys[j].owner !== o);

    /* 1 – production */
    const enemyDef = s.sys.filter((x) => x.owner !== o && G.defended(x)).length;
    const mix = Object.assign({}, L.mix);
    if (enemyDef > 3) { mix.S += 0.1; mix.B -= 0.1; }
    const sum = total.B + total.S + total.I + 3;
    for (const x of mine) {
      if (x.type !== "ind") continue;
      let best = "B", bd = -Infinity;
      for (const t of ["B", "S", "I"]) { const d = mix[t] * sum - total[t]; if (d > bd) { bd = d; best = t; } }
      x.mode = best;
      total[best] += 0.5; // spread modes over several shipyards
    }

    /* 2 – defences on valuable border systems */
    if (U.chance(L.defend)) {
      const reserve = 4;
      const cands = mine.filter((x) => x.type !== "ruin" && frontier(x)).sort((a, b) => VALUE[b.type] - VALUE[a.type] + (hostileStrengthAt(s, b.id, o) - hostileStrengthAt(s, a.id, o)) * 0.5);
      for (const x of cands) {
        if (VALUE[x.type] < 2 && !hostileStrengthAt(s, x.id, o)) continue;
        if (!x.station && p.bank >= R.COST.station + reserve) { G.buy(o, x.id, "station"); break; }
        if (x.station && !x.shield && p.bank >= R.COST.shield + reserve) { G.buy(o, x.id, "shield"); break; }
      }
    }

    // idle armies per system
    const armies = new Map();
    for (const f of s.fleets) {
      if (f.o !== o || f.at === null) continue;
      if (!armies.has(f.at)) armies.set(f.at, { B: 0, S: 0, I: 0 });
      armies.get(f.at)[f.t] += f.n;
    }

    /* 3 – answer threats */
    const threatened = mine.map((x) => ({ x, t: hostileStrengthAt(s, x.id, o) })).filter((e) => e.t > 0).sort((a, b) => VALUE[b.x.type] * b.t - VALUE[a.x.type] * a.t);
    for (const { x, t } of threatened) {
      const here = armies.get(x.id) || { B: 0, S: 0, I: 0 };
      const def = strength(here) + (x.station ? 3 : 0) + (x.shield ? 1 : 0);
      if (def >= t * 1.1) continue;
      const dist = distAll(s, x.id);
      for (const [sid, a] of armies) {
        if (sid === x.id || !a.B || dist[sid] > 380) continue;
        const own = s.sys[sid];
        if (own.owner === o && hostileStrengthAt(s, sid, o) > 0) continue;
        if (G.order(o, sid, x.id, { B: true, S: false, I: false }, 1)) { a.B = 0; break; }
      }
    }

    /* 4 – attack or gather */
    for (const [sid, a] of armies) {
      if (!a.B && !a.I && !a.S) continue;
      const at = s.sys[sid];
      // fleets in a hostile system are busy fighting there
      if (at.owner !== o && (G.hostileFleetsAt(sid, o) || at.troops > 0 || G.defended(at))) {
        // siege fleets without invaders raze enemy mines and yards
        if (a.S && !a.I && at.owner >= 0 && (at.type === "res" || at.type === "ind") && U.chance(L.raze * 0.3)) G.setRaze(o, sid, true);
        if (a.I) G.setRaze(o, sid, false);
        continue;
      }
      if (hostileStrengthAt(s, sid, o) > 0 && at.owner === o) continue;
      const dist = distAll(s, sid);
      let best = null, bs = 0;
      for (const t of s.sys) {
        if (t.owner === o || t.id === sid || dist[t.id] === Infinity) continue;
        if (t.type === "ruin") continue;
        if (s.t < L.grace && t.owner >= 0) continue;
        const enemyF = hostileStrengthAt(s, t.id, o);
        const needB = (enemyF * L.margin) + (t.station ? 4 : 0);
        const defHp = (t.shield ? t.shield.hp : 0) + (t.station ? t.station.hp : 0);
        const needS = defHp > 0 ? Math.max(1, Math.ceil(defHp / 45)) : 0;
        const needI = Math.max(2, Math.ceil(t.troops / 3) + 1);
        if (a.B < needB || a.S < needS || a.I < needI) continue;
        let v = VALUE[t.type] * (t.owner >= 0 ? 1.3 : 1);
        const sc = v / (1 + dist[t.id] / 160) / (1 + enemyF * 0.1);
        if (sc > bs) { bs = sc; best = t; }
      }
      if (best) {
        // leave some battle ships at home when it is threatened or a valuable border system
        let frac = 1;
        if (at.owner === o && at.type === "ind" && frontier(at) && a.B >= 4) frac = 0.5;
        if (frac < 1) {
          G.order(o, sid, best.id, { B: true }, frac);
          G.order(o, sid, best.id, { S: true, I: true }, 1);
        } else G.order(o, sid, best.id, { B: true, S: true, I: true }, 1);
        continue;
      }
      // gather: armies in the rear move towards the nearest border system
      if (at.owner === o && !frontier(at)) {
        let tgt = null, bd = Infinity;
        for (const x of mine) if (frontier(x) && dist[x.id] < bd) { bd = dist[x.id]; tgt = x; }
        if (tgt && (a.B + a.S + a.I) >= 2) G.order(o, sid, tgt.id, { B: true, S: true, I: true }, 1);
      } else if (at.owner === o) {
        // on the border: join the biggest neighbouring army so forces grow
        let tgt = null, big = strength(a);
        for (const j of s.adj[sid].map((e) => e.to)) {
          const b = armies.get(j);
          if (b && s.sys[j].owner === o && strength(b) > big) { big = strength(b); tgt = j; }
        }
        if (tgt !== null && U.chance(0.5)) G.order(o, sid, tgt, { B: true, S: true, I: true }, 1);
      }
    }
  }
})(window.SL);
