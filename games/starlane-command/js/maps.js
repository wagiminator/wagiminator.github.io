/* Starlane Command: the campaign operations and the skirmish map generator */
"use strict";

(function (SL) {
  const { U } = SL;

  // compact system notation: "key x y type owner troops extras…"
  // type: ind res rep out · owner: - (neutral) or 0..3 · extras: sh st B3 S1 I4 cap8
  function sys(line) {
    const [k, x, y, t, o, tr, ...ex] = line.trim().split(/\s+/);
    const d = { k, n: NAMES[k] || k, x: +x, y: +y, t, o: o === "-" ? -1 : +o };
    if (tr !== undefined && tr !== "-") d.tr = +tr;
    for (const e of ex) {
      if (e === "sh") d.sh = 1;
      else if (e === "st") d.st = 1;
      else if (/^cap\d+$/.test(e)) d.cap = +e.slice(3);
      else if (/^[BSI]\d+$/.test(e)) { d.f = d.f || {}; d.f[e[0]] = +e.slice(1); }
    }
    return d;
  }
  const lanes = (s) => s.trim().split(/\s+/).map((p) => p.split("-"));
  const NAMES = {};
  const STARS = ["Achernar", "Adhara", "Alcor", "Aldhibah", "Alhena", "Alkaid", "Alnair", "Alphard", "Alrami", "Altair", "Ankaa", "Arneb", "Ascella", "Atria", "Avior",
    "Bellatrix", "Caph", "Castor", "Chara", "Cursa", "Dabih", "Deneb", "Diphda", "Elnath", "Eltanin", "Enif", "Fomalhaut", "Gacrux", "Gienah", "Hadar", "Hamal",
    "Izar", "Kochab", "Lesath", "Maia", "Markab", "Menkar", "Merak", "Miaplac", "Mintaka", "Mira", "Mirach", "Muphrid", "Naos", "Nashira", "Nunki", "Peacock",
    "Phact", "Polaris", "Pollux", "Rasalas", "Regor", "Rigel", "Ruchbah", "Sabik", "Sadr", "Saiph", "Scheat", "Shaula", "Sirius", "Spica", "Suhail", "Talitha",
    "Tarazed", "Thuban", "Unuk", "Vega", "Wezen", "Zaniah", "Zosma", "Acrux", "Albireo", "Algol", "Arcturus", "Capella", "Denebola", "Electra", "Mizar"];

  /* ================= campaign ================= */
  const M = [];

  // 1 – learn invasion: take every system of a quiet sector
  M.push({
    id: "first-light", name: "First Light", song: "ops3",
    brief: "Your first command. The Halcyon sector is unclaimed – only local militias hold its worlds.\n" +
      "Invasion fleets (stripe at the base) land troops and take systems whose garrison is beaten. Battle fleets (stripe at the tip) protect them.\n" +
      "Drag from your shipyard to a neighbouring system to send your fleets. Take all six systems.",
    hint: "Drag from Halcyon to Vega to send your fleets.",
    players: 1, bank: 4,
    systems: [
      "HAL 150 380 ind 0 12 I5 B2",
      "VEG 330 250 out - 3",
      "RHO 340 510 res - 3",
      "KEP 540 300 out - 4",
      "TAU 560 540 res - 4",
      "LYR 780 400 ind - 6",
    ].map(sys),
    lanes: lanes("HAL-VEG HAL-RHO VEG-RHO VEG-KEP RHO-TAU KEP-TAU KEP-LYR TAU-LYR"),
    names: { HAL: "Halcyon", VEG: "Vega", RHO: "Rho Ceti", KEP: "Kepler", TAU: "Tau Ori", LYR: "Lyra" },
    goal: { type: "ownAll" },
  });

  // 2 – supply and siege: pirate stations guard the mines
  M.push({
    id: "supply-lines", name: "Supply Lines", song: "ops1",
    brief: "Mining colonies ship supply along your lanes to the nearest shipyard. Supply builds ships and defences.\n" +
      "Pirates have fortified two mines with battle stations. Siege fleets (stripe in the middle) tear down stations and shields.\n" +
      "Deliver 40 supply to your shipyards.",
    hint: "Siege fleets break stations. Invade the mines and keep the lanes open.",
    players: 1, bank: 4,
    systems: [
      "ARC 130 360 ind 0 12 B3 S2 I4",
      "NAO 300 220 out - 3",
      "MIR 300 520 res - 4",
      "SPI 480 140 res - 5 st",
      "CAS 500 380 out - 4",
      "POL 480 600 res - 5 st",
      "WEZ 690 260 out - 4",
      "ZOS 690 500 rep - 4",
      "DEN 850 380 res - 6 st sh",
    ].map(sys),
    lanes: lanes("ARC-NAO ARC-MIR NAO-SPI NAO-CAS MIR-CAS MIR-POL SPI-WEZ CAS-WEZ CAS-ZOS POL-ZOS WEZ-DEN ZOS-DEN"),
    names: { ARC: "Arcadia", NAO: "Naos", MIR: "Mirach", SPI: "Spica", CAS: "Castor", POL: "Pollux", WEZ: "Wezen", ZOS: "Zosma", DEN: "Deneb" },
    goal: { type: "collect", n: 40 },
  });

  // 3 – first enemy
  M.push({
    id: "contact", name: "Contact", song: "ops1",
    brief: "Red Hegemony scouts have crossed into the Orion gap. Their shipyard lies across the sector.\n" +
      "Battle fleets win fights between fleets. Your shipyards build the type you select in the system panel.\n" +
      "Destroy the Hegemony presence in the sector.",
    hint: "Select your shipyard to choose what it builds. Mix battle and invasion fleets.",
    players: 2, ai: ["easy"], bank: [6, 4],
    systems: [
      "ORI 120 380 ind 0 12 B3 I3 S1",
      "AL1 270 230 res - 4",
      "AL2 270 530 out - 3",
      "BE1 450 180 out - 4",
      "BE2 460 380 rep - 5",
      "BE3 450 590 res - 4",
      "GA1 640 230 out - 3",
      "GA2 640 530 res - 4",
      "RED 800 380 ind 1 12 B3 I3 S1",
    ].map(sys),
    lanes: lanes("ORI-AL1 ORI-AL2 AL1-BE1 AL1-BE2 AL2-BE2 AL2-BE3 BE1-GA1 BE2-GA1 BE2-GA2 BE3-GA2 GA1-RED GA2-RED"),
    names: { ORI: "Orion Gate", AL1: "Alnair", AL2: "Ankaa", BE1: "Bellatrix", BE2: "Betelgeuse", BE3: "Saiph", GA1: "Gienah", GA2: "Gacrux", RED: "Rasalas" },
    goal: { type: "elim" },
  });

  // 4 – defend a choke point
  M.push({
    id: "bottleneck", name: "Bottleneck", song: "ops2",
    brief: "The Hegemony is massing its fleets. Everything they send must pass the Thuban Narrows.\n" +
      "Hold Thuban for four minutes. It already has a battle station; more stations and shields, bought with supply, make a system hard to crack.\n" +
      "Do not lose your capital, Sirius.",
    hint: "Select Thuban and buy a station and a shield. Keep battle fleets in orbit.",
    players: 2, ai: ["normal"], bank: [12, 4],
    systems: [
      "SIR 110 380 ind 0 12 B4 I2 S1 sh",
      "W1 250 220 res 0 8",
      "W2 250 540 res 0 8",
      "W3 400 380 rep 0 8",
      "THU 560 380 out 0 8 st B2",
      "E1 700 220 res 1 8",
      "E2 700 540 res 1 8",
      "E3 760 380 out 1 6 B1",
      "HEG 880 380 ind 1 12 B4 I2 S1",
      "N1 560 160 out - 5",
      "N2 560 600 out - 5",
    ].map(sys),
    lanes: lanes("SIR-W1 SIR-W2 W1-W3 W2-W3 W3-THU THU-E3 E1-E3 E2-E3 E1-HEG E2-HEG E3-HEG W1-N1 N1-E1 W2-N2 N2-E2"),
    names: { SIR: "Sirius", W1: "Wega", W2: "Wasat", W3: "Wolf Dock", THU: "Thuban", E1: "Eltanin", E2: "Enif", E3: "Errai", HEG: "Hegemon", N1: "Nunki", N2: "Nashira" },
    goal: { type: "hold", sys: "THU", time: 240, keep: "SIR" },
  });

  // 5 – raze the enemy mines
  M.push({
    id: "scorched-earth", name: "Scorched Earth", song: "ops2",
    brief: "The Hegemony fleet is too strong to fight head on – but it runs on supply from three mining colonies.\n" +
      "Siege fleets can raze a system: select a hostile system where your siege fleet sits, switch on Raze, and once its defences are down the world is destroyed for good.\n" +
      "Raze Shaula, Sabik and Lesath.",
    hint: "Raze needs siege fleets in orbit and no working defences. Battle fleets keep them alive.",
    players: 2, ai: ["easy"], bank: [10, 10],
    systems: [
      "HOM 120 600 ind 0 14 B5 S5 I2 sh",
      "P1 280 480 res 0 8",
      "P2 140 400 out 0 6",
      "R1 300 280 out - 4",
      "R2 460 560 out - 4",
      "R3 470 380 rep - 5",
      "SHA 420 140 res 1 8 st",
      "SAB 650 300 res 1 8",
      "LES 800 560 res 1 8 sh",
      "C1 640 460 out 1 6",
      "HQ 820 160 ind 1 14 B4 I2 S1 st",
      "C2 860 360 out 1 6",
    ].map(sys),
    lanes: lanes("HOM-P1 HOM-P2 P1-P2 P2-R1 P1-R2 P1-R3 R1-R3 R1-SHA R3-SAB R2-C1 R3-C1 SHA-HQ SAB-HQ SAB-C1 C1-LES LES-C2 C2-HQ SAB-C2 R2-LES"),
    names: { HOM: "Homestead", P1: "Procyon", P2: "Phact", R1: "Regor", R2: "Rigel", R3: "Ruchbah Dock", SHA: "Shaula", SAB: "Sabik", LES: "Lesath", C1: "Chara", HQ: "Hegemony Prime", C2: "Cursa" },
    goal: { type: "raze", sys: ["SHA", "SAB", "LES"] },
  });

  // 6 – two enemies
  M.push({
    id: "two-fronts", name: "Two Fronts", song: "ops1",
    brief: "You hold the centre of the Draco reach. The Hegemony attacks from the west, the Amber Syndicate from the east – and they are no friends of each other.\n" +
      "Let them bleed, then strike. Defeat both.",
    hint: "Fortify the side you cannot attack yet. Enemy convoys passing your fleets are seized.",
    players: 3, ai: ["easy", "easy"], bank: [8, 6, 6],
    systems: [
      "CEN 480 380 ind 0 14 B6 I3 S2 sh",
      "C1 480 200 res - 5", "C2 480 560 res - 5",
      "W1 320 280 out - 4", "W2 320 480 out - 4",
      "E1 640 280 out - 4", "E2 640 480 out - 4",
      "WR 170 200 res - 5", "WM 160 380 ind 1 12 B4 I3 S1", "WS 170 560 res - 5",
      "ER 790 200 res - 5", "EM 800 380 ind 2 12 B4 I3 S1", "ES 790 560 res - 5",
      "N 480 90 rep - 6", "S 480 660 rep - 6",
    ].map(sys),
    lanes: lanes("CEN-C1 CEN-C2 CEN-W1 CEN-W2 CEN-E1 CEN-E2 C1-W1 C1-E1 C2-W2 C2-E2 W1-WR W1-WM W2-WM W2-WS E1-ER E1-EM E2-EM E2-ES WR-WM WS-WM ER-EM ES-EM C1-N C2-S N-WR N-ER S-WS S-ES"),
    names: { CEN: "Draco Core", C1: "Caph", C2: "Capella", W1: "Wezen", W2: "Wasat", E1: "Electra", E2: "Enif", WR: "Rigel", WM: "Hegemony Yard", WS: "Saiph", ER: "Arneb", EM: "Syndicate Yard", ES: "Avior", N: "North Dock", S: "South Dock" },
    goal: { type: "elim" },
  });

  // 7 – take the shipyards
  M.push({
    id: "gauntlet", name: "The Gauntlet", song: "ops2",
    brief: "The Hegemony and the Violet Covenant have joined forces. Their shipyards, Hadar and Merak, lie at the end of a long run of fortified systems.\n" +
      "Capture both shipyards. Keep Altair, your capital.",
    hint: "Stations stop fleets passing through. Bring siege to break them.",
    players: 3, ai: ["normal", "easy"], bank: [12, 8, 8], colors: [0, 1, 3],
    systems: [
      "ALT 100 380 ind 0 14 B5 I4 S2 sh",
      "A1 230 250 res 0 8", "A2 230 510 res 0 8",
      "B1 380 180 out - 6 st", "B2 380 380 rep - 6", "B3 380 580 out - 6 st",
      "C1 540 250 res - 6", "C2 540 510 res - 6",
      "D1 680 150 out 1 8 st", "D2 680 380 out - 7 st sh", "D3 680 610 out 2 8 st",
      "HAD 850 230 ind 1 14 B5 I3 S2 sh", "MER 850 530 ind 2 14 B5 I3 S2 sh",
      "E1 820 380 res - 6",
    ].map(sys),
    lanes: lanes("ALT-A1 ALT-A2 A1-B1 A1-B2 A2-B2 A2-B3 B1-C1 B2-C1 B2-C2 B3-C2 C1-D1 C1-D2 C2-D2 C2-D3 D1-HAD D2-E1 E1-HAD E1-MER D3-MER"),
    names: { ALT: "Altair", A1: "Albireo", A2: "Algol", B1: "Bellatrix", B2: "Becrux Dock", B3: "Biham", C1: "Canopus", C2: "Cebalrai", D1: "Diphda", D2: "Dschubba", D3: "Dabih", HAD: "Hadar", MER: "Merak", E1: "Elnath" },
    goal: { type: "capture", sys: ["HAD", "MER"], keep: "ALT" },
  });

  // 8 – the final battle, generated with a fixed seed
  M.push({
    id: "crown", name: "Crown of Stars", song: "ops4",
    brief: "Three powers stand between you and the Crown cluster. Each has a fleet as strong as yours.\n" +
      "Defeat all of them.",
    hint: "Watch for enemies attacking each other – a weakened shipyard is an open door.",
    gen: { seed: 9119, n: 30, players: 4, ai: ["normal", "easy", "easy"], bank: [10, 8, 8, 8] },
    goal: { type: "elim" },
  });

  M.forEach((m) => { if (m.names) for (const s of m.systems) if (m.names[s.k]) s.n = m.names[s.k]; });

  /* ================= map generator ================= */
  // spreads systems with a minimum distance, links them by short lanes that never cross,
  // and places the players far apart with a shipyard, a mine and an outpost each
  function generate(opt) {
    const rnd = U.rng(opt.seed || (Math.random() * 1e9) | 0);
    const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const np = opt.players, n = opt.n;
    const X0 = 70, X1 = 890, Y0 = 90, Y1 = 660, cx = (X0 + X1) / 2, cy = (Y0 + Y1) / 2;
    for (let attempt = 0; attempt < 40; attempt++) {
      const pts = [];
      const a0 = rnd() * U.TAU;
      for (let i = 0; i < np; i++) {
        const a = a0 + (i * U.TAU) / np;
        pts.push({ x: cx + Math.cos(a) * (X1 - X0) * 0.43, y: cy + Math.sin(a) * (Y1 - Y0) * 0.42, start: i });
      }
      let tries = 0;
      const minD = Math.sqrt(((X1 - X0) * (Y1 - Y0)) / n) * 0.78;
      while (pts.length < n && tries++ < 6000) {
        const p = { x: X0 + rnd() * (X1 - X0), y: Y0 + rnd() * (Y1 - Y0) };
        if (pts.every((q) => Math.hypot(p.x - q.x, p.y - q.y) > minD)) pts.push(p);
      }
      if (pts.length < n * 0.85) continue;
      // lanes: shortest first, no crossings, at most four per system
      const cand = [];
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) cand.push([i, j, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)]);
      cand.sort((a, b) => a[2] - b[2]);
      const E = [], deg = new Array(pts.length).fill(0);
      const cross = (a, b, c, d) => {
        if (a === c || a === d || b === c || b === d) return false;
        const P = pts, o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
        return o(P[a], P[b], P[c]) !== o(P[a], P[b], P[d]) && o(P[c], P[d], P[a]) !== o(P[c], P[d], P[b]);
      };
      // keep lanes away from systems they pass by
      const nearPt = (a, b) => pts.some((p, k) => {
        if (k === a || k === b) return false;
        const A = pts[a], B = pts[b], dx = B.x - A.x, dy = B.y - A.y, l2 = dx * dx + dy * dy;
        const t = U.clamp(((p.x - A.x) * dx + (p.y - A.y) * dy) / l2, 0, 1);
        return Math.hypot(A.x + dx * t - p.x, A.y + dy * t - p.y) < 34;
      });
      const maxLen = minD * 2.1;
      for (const [i, j, l] of cand) {
        if (l > maxLen || deg[i] >= 4 || deg[j] >= 4) continue;
        if (E.some(([a, b]) => cross(i, j, a, b)) || nearPt(i, j)) continue;
        E.push([i, j]); deg[i]++; deg[j]++;
      }
      // connect all components
      const comp = () => {
        const id = new Array(pts.length).fill(-1); let c = 0;
        for (let i = 0; i < pts.length; i++) {
          if (id[i] >= 0) continue;
          const st = [i]; id[i] = c;
          while (st.length) { const u = st.pop(); for (const [a, b] of E) { const v = a === u ? b : b === u ? a : -1; if (v >= 0 && id[v] < 0) { id[v] = c; st.push(v); } } }
          c++;
        }
        return { id, c };
      };
      let cc = comp(), guard = 0;
      while (cc.c > 1 && guard++ < 50) {
        const e = cand.find(([i, j]) => cc.id[i] !== cc.id[j] && !E.some(([a, b]) => cross(i, j, a, b)));
        if (!e) break;
        E.push([e[0], e[1]]); deg[e[0]]++; deg[e[1]]++;
        cc = comp();
      }
      if (cc.c > 1) continue;
      if (pts.some((p, i) => deg[i] === 0)) continue;
      // types and owners
      const names = STARS.slice();
      for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [names[i], names[j]] = [names[j], names[i]]; }
      const systems = pts.map((p, i) => ({ k: "S" + i, n: names[i % names.length], x: Math.round(p.x), y: Math.round(p.y), t: "out", o: -1 }));
      const taken = new Set();
      const nb = (i) => E.filter(([a, b]) => a === i || b === i).map(([a, b]) => (a === i ? b : a));
      for (let i = 0; i < np; i++) {
        const s = systems[i];
        s.t = "ind"; s.o = i; s.tr = 12; s.f = { B: 3, I: 3, S: 1 };
        taken.add(i);
        const near = nb(i).filter((j) => !taken.has(j)).sort((a, b) => Math.hypot(pts[a].x - pts[i].x, pts[a].y - pts[i].y) - Math.hypot(pts[b].x - pts[i].x, pts[b].y - pts[i].y));
        if (near[0] !== undefined) { systems[near[0]].t = "res"; systems[near[0]].tr = 3; taken.add(near[0]); }
        if (near[1] !== undefined) { systems[near[1]].t = "out"; systems[near[1]].tr = 3; taken.add(near[1]); }
      }
      const rest = [];
      for (let i = 0; i < systems.length; i++) if (!taken.has(i)) rest.push(i);
      // shuffle with the seeded generator
      for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
      rest.forEach((i, k) => {
        const f = k / rest.length, s = systems[i];
        s.t = f < 0.32 ? "res" : f < 0.42 ? "ind" : f < 0.52 ? "rep" : "out";
        const dmin = Math.min(...systems.slice(0, np).map((q) => Math.hypot(q.x - s.x, q.y - s.y)));
        s.tr = Math.round(U.clamp(3 + dmin / 70, 3, 9));
        if (s.t === "ind") s.tr = Math.min(10, s.tr + 2);
        if (opt.stations !== false && dmin > 300 && rnd() < 0.3) s.st = 1;
      });
      return {
        players: np, ai: opt.ai, bank: opt.bank !== undefined ? opt.bank : 6,
        systems, lanes: E.map(([a, b]) => ["S" + a, "S" + b]),
      };
    }
    throw new Error("map generation failed");
  }
  SL.generateMap = generate;

  // expand a mission into a playable definition
  SL.buildMission = function (m) {
    let def = Object.assign({}, m);
    if (m.gen) Object.assign(def, generate(m.gen));
    def.systems = def.systems.map((s) => Object.assign({}, s));
    return def;
  };
  SL.skirmish = function (opt) {
    const sizes = { small: 16, medium: 24, large: 32 };
    const def = generate({ seed: opt.seed, n: sizes[opt.size] || 24, players: opt.players, ai: new Array(opt.players - 1).fill(opt.level), bank: [10].concat(new Array(opt.players - 1).fill(6)) });
    def.id = "skirmish"; def.name = "Skirmish"; def.song = U.pick(["ops1", "ops2", "ops3"]);
    def.goal = { type: "elim" };
    def.brief = "Defeat every rival command.";
    return def;
  };
  SL.MISSIONS = M;
})(window.SL);
