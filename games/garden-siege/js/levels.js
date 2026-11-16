/* Garden Siege: board geometry, areas, adventure levels, mini-games, puzzles, survival, wave generator, save game */
"use strict";

(function (GS) {
  const { U, Store } = GS;

  /* ---------- Board geometry ---------- */
  const geoCache = {};
  GS.Geo = {
    get(rows, area) {
      const key = rows + area;
      if (geoCache[key]) return geoCache[key];
      const g = rows === 6 ? { x0: 255, y0: 142, cw: 100, ch: 95, scale: 0.88 } : { x0: 255, y0: 148, cw: 100, ch: 112, scale: 1 };
      g.rows = rows; g.cols = 9;
      g.water = new Array(rows).fill(false);
      if (area === "pool" || area === "fog") g.water[2] = g.water[3] = true;
      g.roof = area === "roof";
      g.x1 = g.x0 + 9 * g.cw;
      return (geoCache[key] = g);
    },
  };

  /* ---------- Areas ---------- */
  GS.AREAS = {
    day: { name: "Front Yard", rows: 5, night: false, sky: true, song: "day", mower: "mower" },
    night: { name: "Night Yard", rows: 5, night: true, sky: false, song: "night", mower: "mower", graves: true },
    pool: { name: "Backyard Pool", rows: 6, night: false, sky: true, song: "pool", mower: "mower" },
    fog: { name: "Foggy Pool", rows: 6, night: true, sky: false, song: "fog", mower: "mower", fog: true },
    roof: { name: "Rooftop", rows: 5, night: false, sky: true, song: "roof", mower: "roof" },
  };
  const AREA_IDS = ["day", "night", "pool", "fog", "roof"];
  GS.AREA_IDS = AREA_IDS;

  /* ---------- Plant awards in adventure ---------- */
  const AWARDS = [
    "sunbloom", "cherry", "nut", "mine", "frost", "snap", "double",
    "puff", "dawn", "fume", "muncher", "swirl", "shy", "icecap", "doom",
    "lily", "squash", "trio", "kelp", "pepper", "spike", "torch", "tall",
    "sea", "lantern", "cactus", "blover", "split", "star", "pumpkin", "magnet",
    "pot", "cabbage", "corn", "coffee", "garlic", "umbrella", "marigold", "melon",
  ];
  GS.AWARDS = AWARDS;
  GS.UPGRADES = ["twinsun", "gatling", "gloom", "cattail", "wmelon", "goldmag", "spikerock", "cob"];

  // zombies introduced by level index (area*10 + n-1)
  const INTRO = {
    0: ["walker"], 2: ["cone"], 5: ["pole"], 7: ["bucket"], 9: ["flag"],
    10: ["paper"], 12: ["door"], 15: ["football"], 17: ["dancer"],
    20: ["floatie"], 22: ["snorkel"], 25: ["zamboni"], 26: ["bobsled"], 27: ["dolphin"],
    30: ["jack"], 32: ["balloon"], 35: ["miner"], 37: ["pogo"], 39: ["yeti"],
    40: ["bungee"], 42: ["ladder"], 45: ["catapult"], 47: ["giant"],
  };
  // zombies that may appear in each area's normal levels
  const AREA_POOL = {
    day: ["walker", "cone", "pole", "bucket"],
    night: ["walker", "cone", "bucket", "paper", "door", "football", "dancer", "pole"],
    pool: ["walker", "cone", "bucket", "pole", "paper", "door", "football", "floatie", "snorkel", "zamboni", "bobsled", "dolphin"],
    fog: ["walker", "cone", "bucket", "football", "dancer", "floatie", "snorkel", "dolphin", "jack", "balloon", "miner", "pogo", "pole", "yeti"],
    roof: ["walker", "cone", "bucket", "pole", "football", "jack", "balloon", "pogo", "bungee", "ladder", "catapult", "giant"],
  };
  function introduced(L) {
    const set = new Set();
    for (const k in INTRO) if (+k <= L) INTRO[k].forEach((z) => set.add(z));
    return set;
  }

  /* ---------- Adventure ---------- */
  const SPECIAL = {
    4: { special: "bowling", title: "Nut Bowling" },
    14: { special: "whack", title: "Whack-a-Zombie" },
    24: { special: "little", title: "Little Big Trouble" },
    34: { special: "vase", title: "Vasebreaker" },
    44: { special: "bungee", title: "Bungee Blitz" },
  };
  const CONVEYOR = {
    day: ["pea", "pea", "nut", "cherry", "frost", "double", "mine", "snap"],
    night: ["puff", "puff", "fume", "fume", "muncher", "swirl", "icecap", "doom", "shy", "nut"],
    pool: ["lily", "lily", "pea", "double", "squash", "kelp", "pepper", "torch", "tall", "spike", "trio"],
    fog: ["lily", "lily", "sea", "cactus", "blover", "lantern", "star", "pumpkin", "magnet", "split", "fume"],
    roof: ["pot", "pot", "cabbage", "corn", "melon", "pepper", "icecap", "coffee", "umbrella"],
  };

  const HINTS = {
    0: "Click the falling sun to collect it. Then pick the Pea Popper packet and click the lawn to plant it.",
    1: "Sunblooms make extra sun. Plant a row of them on the left early on.",
    2: "Cherry Blast clears a crowd: plant it right next to the zombies.",
    3: "Stone Nuts hold zombies back. The shovel removes plants you no longer need.",
    4: "Click a nut on the conveyor, then click a tile left of the red line to roll it.",
    10: "Night: no sun falls from the sky. Mushrooms are awake here, and Puffcaps cost nothing.",
    14: "Whack the zombies with the mallet as they climb out of their graves!",
    20: "Plant Lily Rafts on the water first, then put other plants on top of them.",
    30: "Fog hides the right side of the lawn. Lantern Blooms light it up.",
    34: "Click the vases to break them. Plant what you find and stop the zombies inside.",
    40: "Plants on the roof need Clay Pots. Straight shots from the left half hit the slope.",
    49: "Dr. Zed is here! Freeze his fireballs with Frostcap and melt his iceballs with Fire Pepper.",
  };
  function advSpec(L) {
    const ai = Math.floor(L / 10), n = (L % 10) + 1, area = AREA_IDS[ai];
    const A = GS.AREAS[area];
    const intro = introduced(L);
    const pool = AREA_POOL[area].filter((z) => intro.has(z) && z !== "flag");
    const waves = L === 0 ? 4 : L < 3 ? 8 : n <= 3 ? 10 : 20;
    const s = {
      key: "adv" + L, L, mode: "adventure", area, rows: A.rows, title: `Level ${ai + 1}-${n}`,
      waves, pool, k: 0.26 + L * 0.0105, startSun: 50, sky: A.sky, chooser: true,
      firstWave: L < 3 ? 22 : 18, mowers: true,
      graves: A.graves ? 3 + Math.floor(n / 2) : 0,
      fogCols: A.fog ? (n < 5 ? 4 : 5) : 0,
      newZombie: INTRO[L] ? INTRO[L][0] : null,
    };
    s.hint = HINTS[L];
    if (L === 0) { s.activeRows = [2]; s.chooser = false; s.seeds = ["pea"]; s.startSun = 150; }
    if (L === 1 || L === 2) s.activeRows = [1, 2, 3];
    if (area === "roof") s.prePots = 3;
    // award
    if (n === 10) s.award = L === 49 ? "trophy" : "note";
    else if (n === 5) s.award = "money";
    else {
      const slot = ai * 8 + (n < 5 ? n - 1 : n - 2);
      s.award = AWARDS[slot] || "money";
    }
    const sp = SPECIAL[L];
    if (sp) {
      s.special = sp.special;
      s.title += " · " + sp.title;
      if (sp.special === "bowling") Object.assign(s, { chooser: false, conveyor: ["nut", "nut", "nut", "nut", "bnut", "bnut", "gnut"], plantCols: 3, waves: 12, sky: false, pool: ["walker", "cone", "pole", "bucket"] });
      if (sp.special === "whack") Object.assign(s, { whack: true, chooser: false, seeds: ["sunbloom", "cherry", "nut", "puff"], waves: 16, startSun: 100, sky: true, graves: 0, pool: ["walker", "cone", "bucket"] });
      if (sp.special === "little") Object.assign(s, { tiny: true, chooser: false, conveyor: CONVEYOR.pool, waves: 16 });
      if (sp.special === "vase") Object.assign(s, { chooser: false, vase: { cols: [4, 8], plants: ["pea", "squash", "cherry", "nut", "lily", "sea", "pepper", "magnet", "star"], zombies: ["walker", "cone", "bucket", "pole", "floatie", "football", "jack"], plantVases: 12, zombieVases: 18 }, mowers: true, fogCols: 0, waves: 0, sky: false, startSun: 0 });
      if (sp.special === "bungee") Object.assign(s, { bungeeDrop: true, waves: 18, pool: ["walker", "cone", "bucket", "pole", "football", "pogo", "ladder"] });
    }
    if (n === 10) {
      s.chooser = false; s.conveyor = CONVEYOR[area]; s.title += " · Conveyor";
      if (area === "night") s.graves = 6;
      if (L === 49) { s.boss = true; s.title = "Level 5-10 · Dr. Zed"; s.waves = 0; s.pool = ["walker", "cone", "bucket", "pole", "football", "pogo", "ladder", "jack", "giant"]; }
    }
    return s;
  }
  GS.ADVENTURE = [];
  for (let L = 0; L < 50; L++) GS.ADVENTURE.push(advSpec(L));

  /* ---------- Mini-games ---------- */
  const mini = (id, name, req, area, desc, o) => ({ id, name, req, area, desc, spec: () => Object.assign({
    key: "mini-" + id, mode: "mini", title: name, area, rows: GS.AREAS[area].rows, waves: 20, startSun: 50,
    sky: GS.AREAS[area].sky, chooser: true, firstWave: 15, mowers: true, k: 0.75, award: "money",
    graves: GS.AREAS[area].graves ? 5 : 0, fogCols: GS.AREAS[area].fog ? 5 : 0, prePots: area === "roof" ? 3 : 0,
    pool: AREA_POOL[area].filter((z) => z !== "yeti"),
  }, o) });
  GS.MINIGAMES = [
    mini("bowling", "Nut Bowling", 5, "day", "Roll the nuts! Exploding and giant nuts arrive on the conveyor.", { special: "bowling", chooser: false, conveyor: ["nut", "nut", "nut", "bnut", "bnut", "gnut"], plantCols: 3, waves: 20, sky: false, pool: ["walker", "cone", "pole", "bucket", "paper", "door", "football"] }),
    mini("slots", "Slot Machine", 10, "day", "Pull the lever for plants and collect 2000 sun.", { slots: true, chooser: false, waves: 99, startSun: 200, sky: true, sunGoal: 2000, k: 0.55, pool: ["walker", "cone", "pole", "bucket", "door"] }),
    mini("raining", "Raining Seeds", 12, "pool", "Seed packets fall from the sky. Plant them before they wilt.", { raining: true, chooser: false, sky: false, pool: ["walker", "cone", "bucket", "floatie", "snorkel", "dolphin", "football"] }),
    mini("whack", "Whack-a-Zombie", 15, "night", "Zombies climb out of their graves. Whack them!", { whack: true, chooser: false, seeds: ["dawn", "puff", "cherry", "nut", "icecap"], startSun: 150, waves: 20, graves: 0, pool: ["walker", "cone", "bucket"] }),
    mini("columns", "Column Gardening", 16, "roof", "Every plant fills its whole column.", { columns: true, chooser: false, conveyor: ["pot", "cabbage", "corn", "melon", "garlic", "pepper", "coffee", "icecap", "pumpkin", "doom"], prePots: 0, pool: ["walker", "cone", "bucket", "football", "pole", "jack"] }),
    mini("invis", "Invisi-Ghouls", 18, "fog", "The zombies cannot be seen. Only their shadows give them away.", { invisible: true, fogCols: 0, chooser: false, conveyor: ["lily", "pea", "squash", "star", "fume", "cherry", "nut", "pepper", "pumpkin"], pool: ["walker", "cone", "bucket", "football", "floatie", "snorkel", "pole"] }),
    mini("nimble", "Nimble Zombies, Quick!", 20, "day", "These zombies are twice as fast.", { fast: true, startSun: 150 }),
    mini("botany", "Zombotany", 22, "pool", "Zombies with plant heads: pea-heads shoot back, nut-heads take a beating.", { pool: ["walker", "peahead", "nuthead", "cone", "floatie", "bucket"] }),
    mini("storm", "Dark Stormy Night", 24, "night", "Only the lightning shows what is coming.", { storm: true, chooser: false, conveyor: ["puff", "fume", "squash", "nut", "icecap", "pepper", "doom", "swirl"], graves: 4 }),
    mini("gravedanger", "Grave Danger", 26, "night", "New graves keep rising from the ground.", { graveGrow: true, startSun: 150, pool: ["walker", "cone", "bucket", "door", "football", "paper"] }),
    mini("little", "Little Big Trouble", 28, "pool", "Tiny zombies in big numbers.", { tiny: true, chooser: false, conveyor: CONVEYOR.pool, k: 1.1 }),
    mini("laststand", "Last Stand", 30, "pool", "5000 sun to start, no more sun ever. Survive five flags.", { laststand: true, startSun: 5000, sky: false, noSunPlants: true, waves: 50, rounds: 5, roundWaves: 10, k: 0.5 }),
    mini("bobsled", "Bobsled Bash", 32, "pool", "Ice resurfacers and bobsled teams on every lane.", { chooser: false, conveyor: ["lily", "spike", "spike", "pea", "frost", "squash", "pepper", "torch", "tall"], pool: ["zamboni", "bobsled", "walker", "cone", "floatie"] }),
    mini("digit", "Dig It Up", 36, "fog", "Miners dig in from behind your plants.", { pool: ["miner", "miner", "walker", "cone", "floatie", "balloon"] }),
    mini("airraid", "Air Raid", 38, "fog", "Balloon zombies fill the sky.", { pool: ["balloon", "balloon", "walker", "floatie"], startSun: 150 }),
    mini("bungee", "Bungee Blitz", 44, "roof", "Bungee zombies drop zombies right into your garden.", { bungeeDrop: true, pool: ["walker", "cone", "bucket", "pole", "football", "pogo", "ladder"] }),
    mini("pogo", "Pogo Party", 46, "roof", "Pogo zombies everywhere.", { chooser: false, conveyor: ["pot", "pot", "tall", "melon", "corn", "magnet", "cabbage", "coffee"], pool: ["pogo", "pogo", "walker", "cone"] }),
    mini("revenge", "Dr. Zed's Revenge", 50, "roof", "The doctor is back and angrier.", { boss: true, bossHp: 60000, waves: 0, chooser: false, conveyor: CONVEYOR.roof, pool: ["walker", "cone", "bucket", "pole", "football", "pogo", "ladder", "jack", "giant"] }),
  ];

  /* ---------- Puzzles ---------- */
  GS.PUZZLES = [];
  const VASES = [
    ["Vasebreaker", { plants: ["pea", "cherry", "squash", "nut"], zombies: ["walker", "cone", "bucket"], plantVases: 10, zombieVases: 14 }],
    ["Left Turn", { plants: ["pea", "double", "squash", "nut", "cherry"], zombies: ["walker", "cone", "bucket", "pole"], plantVases: 10, zombieVases: 16, cols: [3, 8] }],
    ["Third Vase", { plants: ["pea", "frost", "squash", "nut", "pepper"], zombies: ["walker", "cone", "bucket", "door", "football"], plantVases: 11, zombieVases: 17 }],
    ["Chain Reaction", { plants: ["cherry", "pepper", "squash", "pea", "doom"], zombies: ["walker", "cone", "bucket", "football", "jack"], plantVases: 10, zombieVases: 18 }],
    ["Metal Detector", { plants: ["magnet", "pea", "squash", "nut", "star"], zombies: ["bucket", "door", "football", "jack", "cone"], plantVases: 11, zombieVases: 17 }],
    ["Scary Potter", { plants: ["pea", "frost", "cherry", "squash", "nut", "pepper"], zombies: ["walker", "cone", "bucket", "giant"], plantVases: 12, zombieVases: 16, cols: [3, 8] }],
    ["Hokey Pokey", { plants: ["star", "pea", "squash", "nut", "cherry", "magnet"], zombies: ["walker", "cone", "bucket", "pogo", "football"], plantVases: 12, zombieVases: 18 }],
    ["Another Chain", { plants: ["cherry", "pepper", "doom", "pea", "squash"], zombies: ["walker", "cone", "bucket", "football", "jack", "door"], plantVases: 11, zombieVases: 20 }],
    ["Ace of Vase", { plants: ["pea", "double", "frost", "squash", "nut", "cherry", "magnet"], zombies: ["walker", "cone", "bucket", "football", "giant", "pole"], plantVases: 13, zombieVases: 20, cols: [2, 8] }],
  ];
  VASES.forEach(([name, v], i) => GS.PUZZLES.push({
    id: "vase" + i, name, group: "vase", req: 20 + i, desc: "Break the vases and defeat everything inside.",
    spec: () => ({ key: "puz-vase" + i, mode: "puzzle", title: name, area: "night", rows: 5, waves: 0, chooser: false, sky: false, startSun: 0, mowers: true, graves: 0, vase: Object.assign({ cols: [4, 8] }, v), award: "money" }),
  }));
  GS.PUZZLES.push({ id: "vaseEndless", name: "Vasebreaker Endless", group: "vase", req: 29, endless: true, desc: "One vase room after the other. How far can you get?",
    spec: () => ({ key: "puz-vaseEndless", mode: "puzzle", title: "Vasebreaker Endless", area: "night", rows: 5, waves: 0, chooser: false, sky: false, startSun: 0, mowers: true, graves: 0, endless: true,
      vase: { cols: [3, 8], plants: ["pea", "double", "frost", "squash", "nut", "cherry", "magnet", "star", "pepper"], zombies: ["walker", "cone", "bucket", "football", "pole", "jack", "door"], plantVases: 12, zombieVases: 18 } }) });

  // I, Zombie: the player sends zombies against a garden
  const IZ = [
    ["I, Zombie", ["walker", "cone", "bucket"], 150, [["sunbloom", 2], ["pea", 1], ["nut", 0.4]]],
    ["I'm a Zombie Too", ["walker", "cone", "bucket", "pole"], 150, [["sunbloom", 1.6], ["pea", 1], ["frost", 0.4], ["nut", 0.3]]],
    ["Can You Dig It?", ["walker", "cone", "miner", "bucket"], 150, [["sunbloom", 1.6], ["pea", 1], ["split", 0.6], ["star", 0.3]]],
    ["Totally Nuts", ["walker", "cone", "ladder", "bucket", "football"], 200, [["sunbloom", 1.5], ["pea", 1], ["nut", 0.8], ["tall", 0.3]]],
    ["Dead Zeppelin", ["walker", "balloon", "bucket", "pole"], 150, [["sunbloom", 1.5], ["pea", 1], ["cactus", 0.6], ["shy", 0.5]]],
    ["Me Smash!", ["walker", "cone", "giant", "bucket"], 300, [["sunbloom", 1.4], ["pea", 1], ["mine", 0.6], ["snap", 0.4], ["double", 0.4]]],
    ["Zombogo", ["walker", "pogo", "bucket", "football"], 200, [["sunbloom", 1.4], ["pea", 1], ["magnet", 0.4], ["tall", 0.3], ["frost", 0.4]]],
    ["Three Hit Wonder", ["walker", "cone", "bucket", "football", "dancer"], 250, [["sunbloom", 1.4], ["trio", 0.6], ["pea", 0.8], ["nut", 0.4]]],
    ["All Your Brainz", ["walker", "cone", "bucket", "football", "giant", "pole", "ladder"], 300, [["sunbloom", 1.4], ["pea", 1], ["double", 0.6], ["frost", 0.5], ["snap", 0.4], ["mine", 0.4], ["nut", 0.3]]],
  ];
  IZ.forEach(([name, zombies, sun, plants], i) => GS.PUZZLES.push({
    id: "iz" + i, name, group: "iz", req: 20 + i, desc: "Send zombies through the garden and eat the five brains.",
    spec: () => ({ key: "puz-iz" + i, mode: "puzzle", title: name, area: "day", rows: 5, waves: 0, chooser: false, sky: false, startSun: sun, mowers: false, graves: 0,
      izombie: { zombies, plants, cols: 4 + (i > 3 ? 1 : 0) }, award: "money" }),
  }));
  GS.PUZZLES.push({ id: "izEndless", name: "I, Zombie Endless", group: "iz", req: 29, endless: true, desc: "Garden after garden. How many can you clear?",
    spec: () => ({ key: "puz-izEndless", mode: "puzzle", title: "I, Zombie Endless", area: "day", rows: 5, waves: 0, chooser: false, sky: false, startSun: 300, mowers: false, graves: 0, endless: true,
      izombie: { zombies: ["walker", "cone", "bucket", "pole", "football", "ladder", "giant", "pogo", "miner", "dancer"], plants: IZ[8][3], cols: 5 } }) });

  /* ---------- Survival ---------- */
  GS.SURVIVAL = [];
  AREA_IDS.forEach((area, i) => {
    const base = { area, rows: GS.AREAS[area].rows, mode: "survival", sky: GS.AREAS[area].sky, chooser: true, startSun: 50, firstWave: 18, mowers: true,
      graves: GS.AREAS[area].graves ? 5 : 0, fogCols: GS.AREAS[area].fog ? 5 : 0, prePots: area === "roof" ? 3 : 0,
      pool: AREA_POOL[area].filter((z) => z !== "yeti" && z !== "flag"), roundWaves: 10, survival: true, award: "money" };
    GS.SURVIVAL.push({ id: "s-" + area, name: "Survival: " + GS.AREAS[area].name, req: 30 + i * 4, area,
      desc: "Survive 5 flags. Choose new plants after each flag.", spec: () => Object.assign({}, base, { key: "surv-" + area, title: "Survival: " + GS.AREAS[area].name, rounds: 5 }) });
  });
  AREA_IDS.forEach((area, i) => {
    const s = GS.SURVIVAL[i];
    GS.SURVIVAL.push({ id: "h-" + area, name: "Survival: " + GS.AREAS[area].name + " (Hard)", req: 40 + i * 2, needs: s.id, area,
      desc: "Survive 10 flags of tougher zombies.", spec: () => { const sp = Object.assign(s.spec(), { key: "survh-" + area, title: "Survival: " + GS.AREAS[area].name + " (Hard)", rounds: 10, hard: true }); if (area === "roof") sp.pool = sp.pool.concat(["redeye"]); return sp; } });
  });
  GS.SURVIVAL.push({ id: "endless", name: "Survival: Endless", req: 50, area: "pool", endless: true,
    desc: "The waves never end. Your flags go into the high score table.",
    spec: () => Object.assign(GS.SURVIVAL[2].spec(), { key: "surv-endless", title: "Survival: Endless", rounds: 0, endless: true, pool: AREA_POOL.pool.concat(["jack", "balloon", "pogo", "ladder", "catapult", "giant", "redeye", "dancer", "miner"]) }) });

  /* ---------- Wave generator ---------- */
  GS.ZCOST = { walker: 1, flag: 1, cone: 2, pole: 2, bucket: 4, paper: 2, door: 4, football: 7, dancer: 5, floatie: 1, snorkel: 3, zamboni: 7, bobsled: 3,
    dolphin: 3, jack: 3, balloon: 2, miner: 4, pogo: 4, yeti: 4, bungee: 3, ladder: 4, catapult: 5, giant: 10, redeye: 18, imp: 1, peahead: 3, nuthead: 4 };
  const ZW = { walker: 4, cone: 3, bucket: 2, floatie: 3, yeti: 0.2, giant: 0.8, redeye: 0.5, zamboni: 0.8, catapult: 0.8 };

  // points for wave i (0-based) of a spec
  function wavePoints(spec, i, round) {
    if (spec.survival || spec.rounds) {
      const g = (round || 0) * 10 + i;
      return 2 + Math.floor(g * (spec.hard ? 0.7 : 0.5) + (round || 0) * (round || 0) * 0.35);
    }
    return 1 + Math.floor(i * (spec.k || 0.5));
  }
  GS.makeWave = function (spec, i, total, round) {
    const flag = (i + 1) % 10 === 0 || i === total - 1;
    let pts = wavePoints(spec, i, round);
    if (flag) pts = Math.ceil(pts * 2.2);
    const pool = spec.pool.slice();
    const list = [];
    if (flag && total > 3) list.push("flag");
    // a newly introduced zombie appears early in its level
    if (spec.newZombie && i === Math.min(2, total - 1) && pool.includes(spec.newZombie)) { list.push(spec.newZombie); pts -= GS.ZCOST[spec.newZombie]; }
    let guard = 0;
    while (pts > 0 && guard++ < 200) {
      const opts = pool.filter((z) => GS.ZCOST[z] <= pts);
      if (!opts.length) break;
      let sum = 0;
      for (const z of opts) sum += ZW[z] ?? 1.5;
      let r = Math.random() * sum, pick = opts[0];
      for (const z of opts) { r -= ZW[z] ?? 1.5; if (r <= 0) { pick = z; break; } }
      list.push(pick);
      pts -= GS.ZCOST[pick];
    }
    if (!list.length) list.push(pool[0] || "walker");
    return { list, flag, final: i === total - 1 };
  };

  /* ---------- Save game ---------- */
  const DEF = { adv: 0, coins: 0, slots: 6, owned: {}, mini: {}, puzzle: {}, surv: {}, best: {}, unlockAll: false, seenNotes: 0 };
  const Save = (GS.Save = {
    d: Object.assign({}, DEF, Store.get("save", {})),
    save() { Store.set("save", Save.d); },
    reset() { Save.d = JSON.parse(JSON.stringify(DEF)); Save.save(); },
    progress() { return Save.d.unlockAll ? 50 : Save.d.adv; },
    plants() {
      const n = Save.d.unlockAll ? AWARDS.length : 0;
      const out = ["pea"];
      for (let L = 0; L < 50; L++) {
        const a = GS.ADVENTURE[L].award;
        if ((L < Save.d.adv || n) && GS.PLANTS[a]) out.push(a);
      }
      if (n) for (const a of AWARDS) if (!out.includes(a)) out.push(a);
      for (const u of GS.UPGRADES) if (Save.d.owned[u] || Save.d.unlockAll) out.push(u);
      return out;
    },
    has(id) { return Save.plants().includes(id); },
    slots() { return Save.d.unlockAll ? 10 : Save.d.slots; },
    addCoins(v) { Save.d.coins = Math.min(999990, Save.d.coins + v); },
    owns(item) { return !!Save.d.owned[item] || (Save.d.unlockAll && item !== "rake"); },
  });
})(window.GS);
