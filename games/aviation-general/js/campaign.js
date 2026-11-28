/* Aviation General: the campaigns – a map generator (rivers, ridges, forests, towns, roads and
   bridges from a seed), the four armies' eight battles each, the orders of battle and the
   player's progress. Every battle is built from a fixed seed, so it is the same every time.  */
"use strict";

(function (MG) {
  const { U } = MG;
  const C = (MG.Campaign = {});

  C.ARMIES = ["DE", "RU", "US", "CN"];
  C.ENEMY = { DE: "RU", RU: "DE", US: "CN", CN: "US" };
  const SIZES = (C.SIZES = [[27, 18], [28, 18], [29, 19], [30, 19], [31, 20], [32, 21], [34, 22], [36, 23]]);

  // battle titles and modes; "defend" means the computer attacks
  C.BATTLES = {
    DE: [["Border Watch", "defend"], ["The Mill Valley", "attack"], ["Hold the Ridge", "defend"], ["Forest Road", "attack"], ["Twin Bridges", "attack"], ["Counterstroke", "defend"], ["The Long River", "attack"], ["Gates of the Capital", "attack"]],
    RU: [["Recon in Force", "attack"], ["Marsh Road", "attack"], ["The Bend", "defend"], ["Hill Country", "attack"], ["Night Bridge", "attack"], ["Rearguard", "defend"], ["Breakthrough", "attack"], ["Last Line", "attack"]],
    US: [["Beachhead Valley", "attack"], ["Route Iron", "attack"], ["Hold the Pass", "defend"], ["River of Hills", "attack"], ["Air Cavalry", "attack"], ["Firebase", "defend"], ["Highland Push", "attack"], ["The Citadel", "attack"]],
    CN: [["First Contact", "attack"], ["Terraced Hills", "attack"], ["Hold the Crossing", "defend"], ["Valley Thrust", "attack"], ["Lightning Bridges", "attack"], ["The Dam Road", "defend"], ["Mountain Gate", "attack"], ["Decisive Battle", "attack"]],
  };
  const NAMES = {
    eu: ["Altdorf", "Birkenau", "Dannberg", "Eichhof", "Feldmark", "Grünau", "Hasel", "Immenrode", "Kalkhorst", "Lindow", "Moorbach", "Neuhof", "Oberried", "Pfahl", "Quellen", "Rotwasser", "Sandau", "Tannfeld", "Unterbach", "Vogelsang", "Weidenau", "Zollhaus", "Bärental", "Steinkirch", "Wolfsgrund", "Ostrava", "Belaya", "Krasnoe", "Lesnoy", "Sosnovka"],
    pac: ["Port Arlen", "Kessin", "Maro Bay", "Talun", "Hollis Ridge", "Senja", "Corran", "Ivo Point", "Lakeside", "Varro", "Nessa", "Halden", "Ostrell", "Brightwater", "Kaimo", "Redfern", "Tamsin", "Coldspring", "Mirren", "Westgate", "Sanlo", "Dunmore", "Ashby", "Pinecrest", "Kerrow", "Lomond", "Fairhaven", "Stonebridge", "Elden", "Marrow Hill"],
  };

  /* ---------------- progress ---------------- */
  const blank = () => ({ tut: false, camp: { DE: { next: 0, prestige: 0 }, RU: { next: 0, prestige: 0 }, US: { next: 0, prestige: 0 }, CN: { next: 0, prestige: 0 } } });
  C.progress = () => { const p = MG.Store.get("progress", null) || blank(); for (const a of C.ARMIES) if (!p.camp[a]) p.camp[a] = { next: 0, prestige: 0 }; return p; };
  C.saveProgress = (p) => MG.Store.set("progress", p);
  // called when a battle ends
  C.finished = function (scen, won, prestige) {
    const p = C.progress();
    if (scen.tutorial) p.tut = true;
    if (scen.camp && won) {
      const c = p.camp[scen.camp.army];
      c.next = Math.max(c.next, scen.camp.index + 1);
      c.prestige = Math.min(2000, Math.round(prestige * 0.5));
    }
    C.saveProgress(p);
    return p;
  };

  /* ---------------- scenario description ---------------- */
  C.byId = function (id) {
    const m = /^camp-(\w\w)-(\d)$/.exec(id || "");
    return m ? C.scenario(m[1], +m[2]) : null;
  };
  MG.findScenario = (id) => MG.SCENARIOS.find((s) => s.id === id) || C.byId(id);

  C.scenario = function (army, index) {
    const enemy = C.ENEMY[army];
    const [W, H] = SIZES[index];
    const [title, mode] = C.BATTLES[army][index];
    const attack = mode === "attack";
    const d = index / 7; // difficulty 0 … 1
    const maxTurn = attack ? 14 + index : 12 + Math.round(index * 0.6);
    const prog = C.progress().camp[army];
    const seed = 1000 + C.ARMIES.indexOf(army) * 100 + index * 7;
    const nObj = Math.min(5, 3 + Math.floor(index / 3));
    const N = MG.NATIONS;
    const sc = {
      id: "camp-" + army + "-" + index, camp: { army, index }, title, year: 2031, photo: "assets/maps/camp-" + army + "-" + index + ".webp",
      W, H, maxTurn, player: army, sides: [army, enemy], first: attack ? army : enemy, attacker: attack ? army : enemy,
      prestige: { [army]: 250 + index * 40 + (prog ? prog.prestige : 0), [enemy]: 150 },
      dropEdge: { [army]: 0, [enemy]: W - 1 },
      ai: { [enemy]: { posture: attack ? "defend" : "attack", farpFixed: true, noAirAssault: true } },
      seed, difficulty: d, nObj, theme: army === "US" || army === "CN" ? "pac" : "eu",
    };
    sc.briefing = (attack
      ? `Battle ${index + 1} of 8. ${N[enemy].adj} forces hold the east of the map. Take all ${nObj} objectives within ${maxTurn} turns.`
      : `Battle ${index + 1} of 8. ${N[enemy].adj} forces are attacking from the east. Hold your ${nObj} objectives until the end of turn ${maxTurn} – if the enemy takes them all, the battle is lost.`) +
      `\n\nThe map is ${W} × ${H} hexes. ` + (index < 3 ? (attack ? "Expect a light screen of infantry and tanks with some air defence." : "Expect a probing attack by tanks and infantry with some air defence and attack helicopters.") : index < 6 ? "The enemy is stronger now: layered air defence, artillery, minefields and attack helicopters." : "This is a major battle against a strong, well-equipped enemy with dense air defence.") +
      " Your helicopters are your trump card – keep them out of sight of air defence and keep them fed from your FARPs.";
    sc.hints = [
      "Scout first: reconnaissance vehicles and UAVs find hidden units and minefields.",
      "Fly low behind hills and forests – air defence only fires at what it can see.",
      "Tracked vehicles cannot drive through forests, only along forest roads.",
      attack ? "Bridges may be blown – bring a bridge layer, or cross at a ford." : "Dig in on hills and in towns, and keep a mobile reserve.",
    ];
    sc.build = (S, G) => C.build(sc, S, G);
    return sc;
  };

  /* ---------------- the map generator ---------------- */
  const heap = U.heap;
  // cheapest path between two sets of hexes; cost(i) Infinity = impassable
  function path(G, from, to, cost) {
    const N = G.N, dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), goal = new Set(to), h = heap();
    for (const s of from) { dist[s] = 0; h.push(0, s); }
    while (h.size) {
      const [dd, i] = h.pop();
      if (dd > dist[i]) continue;
      if (goal.has(i)) { const p = []; for (let k = i; k >= 0; k = prev[k]) p.unshift(k); return p; }
      for (const j of G.nb(i)) { const c = cost(j); if (!isFinite(c)) continue; const nd = dd + c; if (nd < dist[j]) { dist[j] = nd; prev[j] = i; h.push(nd, j); } }
    }
    return null;
  }

  function generate(sc, S, G, rnd) {
    const W = sc.W, H = sc.H, N = W * H;
    S.hex = []; S.links = new Set();
    for (let i = 0; i < N; i++) S.hex.push({ t: "clear", e: 0, road: false, river: false, ford: false, bridge: null, mine: null, obj: null, v: (i * 7919) % 13 });
    const hx = S.hex, idx = G.idx, col = G.col, row = G.row;
    const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
    const area = W * H;
    // heights: overlapping bumps, some stretched into ridges
    const field = new Float32Array(N);
    const bumps = Math.round(area / 55) + 2;
    for (let k = 0; k < bumps; k++) {
      const c0 = ri(0, W - 1), r0 = ri(0, H - 1), rad = 1.5 + rnd() * 3.5, amp = 1.2 + rnd() * 2.4;
      const c1 = c0 + ri(-4, 4), r1 = r0 + ri(-3, 3);
      for (let i = 0; i < N; i++) {
        const dx0 = col(i) - c0, dy0 = row(i) - r0, dx1 = col(i) - c1, dy1 = row(i) - r1;
        const dd = Math.min(Math.hypot(dx0, dy0), Math.hypot(dx1, dy1));
        field[i] += amp * Math.exp(-(dd * dd) / (2 * rad * rad));
      }
    }
    // heights by share of the map: about 35 % low ground, 33 % level 1, 20 % level 2, 12 % hill tops
    const sorted = Array.from(field).sort((x, y) => x - y), q = (f) => sorted[Math.floor(f * (N - 1))];
    const t1 = q(0.35), t2 = q(0.68), t3 = q(0.88);
    for (let i = 0; i < N; i++) hx[i].e = field[i] >= t3 ? 3 : field[i] >= t2 ? 2 : field[i] >= t1 ? 1 : 0;
    // river from north to south through the middle
    let river = [];
    if (rnd() < 0.85) {
      let c = ri(Math.floor(W * 0.42), Math.ceil(W * 0.58)), r = 0;
      river.push(idx(c, 0));
      while (row(river[river.length - 1]) < H - 1 || (col(river[river.length - 1]) & 1) === 0 && false) {
        const cur = river[river.length - 1], cc = col(cur), rr = row(cur);
        const opts = [];
        if (rr + 1 < H) opts.push(idx(cc, rr + 1), idx(cc, rr + 1));
        for (const dc of [-1, 1]) {
          const nc = cc + dc;
          if (nc < W * 0.3 || nc > W * 0.7) continue;
          const nr = rr + (cc & 1);
          if (nr < H && nr > rr - 1) opts.push(idx(nc, nr));
        }
        const nx = pick(opts.filter((j) => j >= 0 && G.nb(cur).includes(j) && !river.includes(j)));
        if (nx === undefined) break;
        river.push(nx);
        if (river.length > H * 3) break;
      }
      for (const i of river) { hx[i].river = true; hx[i].e = 0; for (const j of G.nb(i)) if (!hx[j].river) hx[j].e = Math.min(hx[j].e, 1); }
    }
    const free = (i) => !hx[i].river && hx[i].t === "clear";
    // lake
    if (rnd() < 0.55) {
      const corner = pick([[W - 3, H - 3], [W - 3, 2], [2, H - 3], [3, 2]]);
      let i = idx(corner[0], corner[1]);
      for (let k = 0, n = ri(3, 6); k < n; k++) { if (free(i)) { hx[i].t = "water"; hx[i].e = 0; } i = pick(G.nb(i)); }
    }
    // forests
    const blob = (t, n, ok) => {
      let i = ri(0, N - 1);
      for (let k = 0; k < n; k++) { if (ok(i)) hx[i].t = t; const nb = G.nb(i); i = nb[Math.floor(rnd() * nb.length)]; }
    };
    for (let k = 0, n = Math.round(area / 40); k < n; k++) blob("forest", ri(3, 9), free);
    // swamp by the river
    if (river.length) for (let k = 0; k < 1 + (area > 500); k++) {
      const s = pick(river);
      for (const j of G.nb(s)) if (free(j) && rnd() < 0.7) hx[j].t = "swamp";
    }
    // rocky heights
    // rocky tops: only where the whole neighbourhood is high ground
    for (let i = 0; i < N; i++) if (hx[i].e === 3 && free(i) && G.nb(i).every((j) => hx[j].e >= 2) && rnd() < 0.45) hx[i].t = "mountain";
    // towns, away from each other and from the edges
    const towns = [];
    const nTowns = Math.round(area / 45) + 2;
    for (let tries = 0; towns.length < nTowns && tries < 400; tries++) {
      const i = idx(ri(1, W - 2), ri(1, H - 2));
      if (!free(i) && hx[i].t !== "forest") continue;
      if (hx[i].river || hx[i].e >= 3) continue;
      if (towns.some((t) => G.dist(t, i) < 4)) continue;
      towns.push(i); hx[i].t = "town"; hx[i].e = Math.min(hx[i].e, 1);
      if (rnd() < 0.4) { const j = pick(G.nb(i).filter((j) => !hx[j].river && hx[j].t !== "water")); if (j !== undefined) { hx[j].t = "town"; hx[j].e = hx[i].e; } }
    }
    // a city in the defender's half on the larger maps
    const defEast = sc.attacker === sc.player;
    if (sc.camp.index >= 3) {
      const cands = towns.filter((t) => (defEast ? col(t) > W * 0.6 : col(t) < W * 0.4));
      if (cands.length) { const c = pick(cands); hx[c].t = "city"; for (const j of G.nb(c)) if (!hx[j].river && hx[j].t !== "water" && rnd() < 0.6) { hx[j].t = "city"; hx[j].e = hx[c].e; } }
    }
    // roads: two or three east–west routes through towns, then every town to the network
    const cost = (j) => {
      const h = hx[j];
      if (h.t === "water" || h.t === "mountain") return Infinity;
      return (h.river ? 6 : 1) + (h.t === "forest" ? 1.5 : h.t === "swamp" ? 5 : h.t === "town" || h.t === "city" ? 0.2 : 0) + h.e * 0.6 + rnd() * 0.3;
    };
    const addPath = (p) => { if (!p) return; for (let k = 0; k < p.length; k++) { hx[p[k]].road = true; if (k) { const a = p[k - 1], b = p[k]; S.links.add(a < b ? a + "," + b : b + "," + a); } } };
    const routes = H >= 17 ? 3 : 2;
    for (let k = 0; k < routes; k++) {
      const r0 = Math.round(((k + 0.5) / routes) * (H - 1));
      const west = []; const east = [];
      for (let r = Math.max(0, r0 - 2); r <= Math.min(H - 1, r0 + 2); r++) { west.push(idx(0, r)); east.push(idx(W - 1, r)); }
      // through the nearest town in the middle band
      const mid = towns.filter((t) => Math.abs(row(t) - r0) <= 3).sort((a, b) => Math.abs(col(a) - W / 2) - Math.abs(col(b) - W / 2))[0];
      if (mid !== undefined) { addPath(path(G, west, [mid], cost)); addPath(path(G, [mid], east, cost)); }
      else addPath(path(G, west, east, cost));
    }
    for (const t of towns) {
      if (hx[t].road) continue;
      const net = []; for (let i = 0; i < N; i++) if (hx[i].road) net.push(i);
      if (net.length) addPath(path(G, [t], net, cost));
    }
    for (let i = 0; i < N; i++) if (hx[i].river && hx[i].road) { hx[i].bridge = "fixed"; hx[i].bridge0 = true; }
    const fords = river.filter((i) => !hx[i].bridge && row(i) > 1 && row(i) < H - 2);
    if (fords.length) hx[pick(fords)].ford = true;
    // names
    const names = NAMES[sc.theme].slice();
    for (let k = names.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [names[k], names[j]] = [names[j], names[k]]; }
    for (const t of towns) hx[t].name = names.pop();
    for (let i = 0; i < N; i++) if (hx[i].t === "city" && !G.nb(i).some((j) => hx[j].name && hx[j].t === "city")) { if (!hx[i].name) hx[i].name = names.pop(); }
    return { towns, river };
  }

  // can tracked vehicles get from the attacker's start zone to (next to) every objective?
  function connected(sc, S, G, startCols, objs) {
    const T = MG.TYPES[MG.ROLES[sc.attacker].mbt], N = G.N, seen = new Uint8Array(N), q = [];
    for (let i = 0; i < N; i++) if (startCols(G.col(i)) && isFinite(G.stepCost(T, -1, i, sc.attacker))) { seen[i] = 1; q.push(i); }
    while (q.length) { const i = q.pop(); for (const j of G.nb(i)) if (!seen[j] && isFinite(G.stepCost(T, i, j, sc.attacker))) { seen[j] = 1; q.push(j); } }
    return objs.every((o) => seen[o] || G.nb(o).some((j) => seen[j]));
  }

  /* ---------------- orders of battle ---------------- */
  function forces(sc) {
    const i = sc.camp.index, attack = sc.attacker === sc.player;
    const P = [], E = [];
    const n = (k) => Math.max(0, Math.round(k));
    // the player's force
    P.push("mbt", "mbt", "ifv", "inf", "recon", "arty", "shorad", "atk", "atk2", "trans", "farp", "eng", "uav");
    if (i >= 1) P.push("mlrs", "para*");
    if (i >= 2) P.push("inf", "lm", "clear");
    if (i >= 3) P.push("mbt2", "sam", "farp", "atk2");
    if (i >= 4) P.push("ifv", "apc", "trans");
    if (i >= 5) P.push("mbt2", "atk", "inf");
    if (i >= 6) P.push("mbt", "arty", "shorad", "atk2", "para*");
    if (i >= 7) P.push("ifv", "mlrs", "inf");
    if (attack) P.push("bridge"); else P.push("mlayer", "inf");
    // the enemy's force
    const d = 1 + i * 0.5;
    if (attack) { // enemy defends
      for (let k = 0; k < n(3 + i * 0.6); k++) E.push("inf");
      for (let k = 0; k < n(2 + i * 0.5); k++) E.push(k % 2 ? "mbt2" : "mbt");
      for (let k = 0; k < n(1 + i * 0.35); k++) E.push("ifv");
      for (let k = 0; k < n(0.6 + i * 0.3); k++) E.push("arty");
      for (let k = 0; k < n(1 + i * 0.3); k++) E.push("shorad");
      E.push("atk", "farp"); // every battle has helicopters on both sides
      if (i >= 1) E.push("apc", "mlayer");
      if (i >= 2) E.push("sam", "mlrs", "lm", "eng");
      if (i >= 3) E.push("rmine", "recon");
      if (i >= 3) E.push("atk");
      if (i >= 5) E.push("sam", "lm");
      E.push("uav");
    } else { // enemy attacks
      for (let k = 0; k < n(3 + i * 0.6); k++) E.push(k % 2 ? "mbt2" : "mbt");
      for (let k = 0; k < n(3 + i * 0.4); k++) E.push("ifv");
      for (let k = 0; k < n(2 + i * 0.4); k++) E.push("inf");
      E.push("apc", "arty", "shorad", "atk", "farp", "uav", "eng", "bridge");
      if (i >= 2) E.push("mlrs", "lm", "sam", "recon");
      if (i >= 3) E.push("atk");
      if (i >= 5) E.push("mbt", "ifv", "clear", "arty");
    }
    void d;
    return { P, E };
  }

  /* ---------------- building the battle ---------------- */
  C.build = function (sc, S, G) {
    const W = sc.W, H = sc.H, N = W * H, me = sc.player, en = C.ENEMY[me];
    const attack = sc.attacker === me;
    let seed = sc.seed, gen = null, objs = null;
    for (let tries = 0; tries < 30; tries++, seed += 101) {
      const rnd = U.rng(seed);
      gen = generate(sc, S, G, rnd);
      // objectives in the defender's half: towns first, then hills
      const inDef = (i) => (attack ? G.col(i) >= Math.floor(W * 0.55) : G.col(i) <= Math.ceil(W * 0.45));
      let cands = [];
      for (let i = 0; i < N; i++) if (inDef(i) && (S.hex[i].t === "city" || S.hex[i].t === "town") && S.hex[i].name) cands.push(i);
      const hills = []; for (let i = 0; i < N; i++) if (inDef(i) && S.hex[i].e >= 2 && S.hex[i].t === "clear" && !S.hex[i].river) hills.push(i);
      cands.sort((a, b) => (S.hex[b].t === "city") - (S.hex[a].t === "city") || rnd() - 0.5);
      objs = [];
      for (const c of [...cands, ...hills]) { if (objs.length >= sc.nObj) break; if (objs.every((o) => G.dist(o, c) >= 3)) objs.push(c); }
      if (objs.length < sc.nObj) continue;
      const attStart = attack ? (c) => c <= 2 : (c) => c >= W - 3;
      if (!connected(sc, S, G, attStart, objs)) continue;
      break;
    }
    const defender = attack ? en : me;
    let hillN = 1;
    for (const o of objs) {
      const h = S.hex[o];
      if (!h.name) h.name = "Hill " + (200 + 37 * hillN++ + S.hex[o].e * 10);
      h.obj = { name: h.name, owner: defender };
    }
    // deployment
    const rnd = U.rng(seed + 7);
    const taken = new Set();
    // the largest area each running gear can drive around in; units are only placed there, so none is boxed in
    // by forest, rocks, marsh or the map edge
    const regions = {};
    const region = (T, side) => {
      const key = T.mob + (T.amph ? "a" : "");
      if (regions[key]) return regions[key];
      let best = new Set();
      const done = new Uint8Array(N);
      for (let s0 = 0; s0 < N; s0++) {
        if (done[s0] || !isFinite(G.stepCost(T, -1, s0, side))) continue;
        const seen = new Set([s0]), q = [s0];
        while (q.length) { const i = q.pop(); for (const j of G.nb(i)) if (!seen.has(j) && isFinite(G.stepCost(T, i, j, side))) { seen.add(j); q.push(j); } }
        for (const i of seen) done[i] = 1;
        if (seen.size > best.size) best = seen;
      }
      return (regions[key] = best);
    };
    const okFor = (T, i, side) => {
      const h = S.hex[i];
      if (!T.isAir && !region(T, side).has(i)) return false;
      if (h.river || h.t === "water" || h.t === "mountain") return false;
      if (T.mob === "track" && h.t === "forest" && !h.road) return false;
      if (T.mob === "wheel" && h.t === "swamp") return false;
      return !taken.has(i + (T.isAir ? "a" : "g"));
    };
    const place = (tid, side, zone, o = {}) => {
      const T = MG.TYPES[tid];
      if (o.reserve) return G.newUnit(tid, side, -1, o);
      const c = []; for (let i = 0; i < N; i++) if (zone(i) && okFor(T, i, side)) c.push(i);
      if (!c.length) return null;
      c.sort((a, b) => (o.score ? o.score(b) - o.score(a) : 0) + (rnd() - 0.5) * (o.jitter == null ? 3 : o.jitter));
      const i = c[0];
      taken.add(i + (T.isAir ? "a" : "g"));
      return G.newUnit(tid, side, i, o);
    };
    const roleOf = (side, role) => MG.ROLES[side][role];
    const westZone = (k) => (i) => G.col(i) <= k;
    const eastZone = (k) => (i) => G.col(i) >= W - 1 - k;
    const { P, E } = forces(sc);
    const myZone = attack ? westZone(Math.max(3, Math.floor(W * 0.2))) : (i) => G.col(i) <= Math.floor(W * 0.45);
    const enZone = attack ? (i) => G.col(i) >= Math.floor(W * 0.5) : eastZone(Math.max(3, Math.floor(W * 0.2)));
    const nearObj = (i) => -Math.min(...objs.map((o) => G.dist(o, i)));
    // FARPs first (helicopters sit on or next to them)
    const farps = { [me]: [], [en]: [] };
    const placeSide = (side, list, zone, defending) => {
      // the player's force spreads over its zone; the enemy's rear units keep to the rear
      const rear = side === me ? (i) => -G.col(i) * 0.35 - Math.abs(G.row(i) - H / 2) * 0.1 : (i) => G.col(i);
      for (const r of list.filter((r) => r === "farp")) { const f = place("farp", side, zone, { score: rear, jitter: 6 }); if (f) farps[side].push(f.idx); }
      for (const r0 of list) {
        if (r0 === "farp") continue;
        const reserve = r0.endsWith("*"), r = r0.replace("*", "");
        const tid = roleOf(side, r), T = MG.TYPES[tid];
        if (reserve) { place(tid, side, zone, { reserve: true }); continue; }
        let score = defending ? nearObj : rear, jitter = 4;
        if (T.isAir && T.heli && farps[side].length) { const f = farps[side][Math.floor(rnd() * farps[side].length)]; score = (i) => -G.dist(i, f) * 3; jitter = 1; }
        else if (T.ind || T.mineRemote || T.aaRange >= 4) score = rear;
        else if (defending && (r === "inf" || r === "eng")) score = (i) => nearObj(i) * 2 + (G.isClose(i) ? 2 : 0);
        const o = { score, jitter };
        if (defending && side === en && !T.isAir) o.entrench = Math.min(2, Math.floor(sc.difficulty * 2 + rnd()));
        place(tid, side, zone, o);
      }
    };
    placeSide(me, P, myZone, !attack);
    placeSide(en, E, enZone, attack);
    // hidden minefields at the crossings on the defender's side
    if (attack) {
      const want = 1 + Math.floor(sc.camp.index / 2);
      const spots = [];
      for (let i = 0; i < N; i++) {
        const h = S.hex[i];
        if (h.river || h.t === "water" || h.obj || G.col(i) < W * 0.5) continue;
        if (G.at(i, false)) continue;
        if (G.nb(i).some((j) => S.hex[j].bridge || S.hex[j].ford)) spots.push(i);
      }
      for (let k = 0; k < want && spots.length; k++) {
        const i = spots.splice(Math.floor(rnd() * spots.length), 1)[0];
        S.hex[i].mine = { side: en, remote: false, lane: false, expires: 0, known: { [en]: true } };
      }
    }
  };

  /* ---------------- the tutorial ---------------- */
  const tut = MG.SCENARIOS[0];
  tut.tutorial = true;
  tut.title = "Tutorial: Operation Brückenkopf";
})(window.MG);
