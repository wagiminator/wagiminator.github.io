/* STARHAUL: the procedural universe – 8 galaxies with 256 star systems each, their economies, governments,
   descriptions, planet looks and markets. Everything is derived from seeds, so the universe is the same every time. */
const { U } = window.XA;

export const GALAXIES = 8, SYSTEMS = 256, CHART_W = 1024, CHART_H = 512, LY = 12; // chart units per light year

export const ECONOMY = ["Rich Industrial", "Average Industrial", "Poor Industrial", "Mainly Industrial", "Mainly Agricultural", "Rich Agricultural", "Average Agricultural", "Poor Agricultural"];
export const GOV = ["Anarchy", "Feudal", "Multi-Government", "Dictatorship", "Communist", "Confederacy", "Democracy", "Corporate State"];
export const GALAXY_NAMES = ["Cygnus Reach", "The Amber Drift", "Orion Shallows", "Veil of Kesh", "The Iron Spiral", "Lumen Expanse", "Thalassa Cluster", "The Far Rim"];

/* ---------- Commodities ----------
   price = (base + (fluct & mask) + economy * grad) * 0.4   (economy 0 = rich industrial … 7 = poor agricultural)
   stock = (qbase + (fluct & qmask) - economy * grad) clamped to 0..63 */
export const GOODS = [
  { id: "food", name: "Food", unit: "t", base: 19, grad: -2, mask: 0x07, qbase: 6, qmask: 0x0f, legal: 0 },
  { id: "textiles", name: "Textiles", unit: "t", base: 21, grad: -1, mask: 0x07, qbase: 10, qmask: 0x0f, legal: 0 },
  { id: "radio", name: "Radioactives", unit: "t", base: 64, grad: -3, mask: 0x0f, qbase: 2, qmask: 0x07, legal: 0 },
  { id: "droids", name: "Service Droids", unit: "t", base: 39, grad: -5, mask: 0x1f, qbase: 0, qmask: 0x1f, legal: 1 },
  { id: "spirits", name: "Spirits", unit: "t", base: 82, grad: -5, mask: 0x0f, qbase: 18, qmask: 0x0f, legal: 0 },
  { id: "lux", name: "Luxuries", unit: "t", base: 192, grad: 8, mask: 0x03, qbase: 16, qmask: 0x03, legal: 0 },
  { id: "narc", name: "Narcotics", unit: "t", base: 230, grad: 28, mask: 0x78, qbase: 6, qmask: 0x78, legal: 3 },
  { id: "comp", name: "Computers", unit: "t", base: 151, grad: 14, mask: 0x1f, qbase: 54, qmask: 0x07, legal: 0 },
  { id: "mach", name: "Machinery", unit: "t", base: 115, grad: 6, mask: 0x0f, qbase: 40, qmask: 0x07, legal: 0 },
  { id: "alloys", name: "Alloys", unit: "t", base: 77, grad: 1, mask: 0x1f, qbase: 30, qmask: 0x1f, legal: 0 },
  { id: "arms", name: "Firearms", unit: "t", base: 121, grad: 13, mask: 0x07, qbase: 4, qmask: 0x07, legal: 2 },
  { id: "furs", name: "Furs", unit: "t", base: 174, grad: -9, mask: 0x3f, qbase: 2, qmask: 0x1f, legal: 0 },
  { id: "minerals", name: "Minerals", unit: "t", base: 31, grad: -1, mask: 0x03, qbase: 52, qmask: 0x07, legal: 0 },
  { id: "gold", name: "Gold", unit: "kg", base: 95, grad: -1, mask: 0x07, qbase: 6, qmask: 0x1f, legal: 0 },
  { id: "platinum", name: "Platinum", unit: "kg", base: 168, grad: -2, mask: 0x1f, qbase: 3, qmask: 0x0f, legal: 0 },
  { id: "gems", name: "Gemstones", unit: "g", base: 44, grad: -1, mask: 0x0f, qbase: 2, qmask: 0x07, legal: 0 },
  { id: "alien", name: "Alien Artifacts", unit: "t", base: 52, grad: 15, mask: 0x3f, qbase: 0, qmask: 0x00, legal: 0 },
];
export const GOOD_INDEX = Object.fromEntries(GOODS.map((g, i) => [g.id, i]));

/* ---------- Names and descriptions (all original word lists) ---------- */
const SYL = ["za", "ce", "bi", "so", "us", "es", "ar", "ma", "in", "di", "re", "a", "er", "at", "en", "be", "ra", "la", "ve", "ti", "ed", "or", "qu", "an",
  "te", "is", "ri", "on", "lo", "ka", "xe", "vy", "ny", "ur", "ol", "ix", "em", "tho", "ga", "dru", "sel", "op", "ny", "zu", "ha", "mir", "ok", "el"];
function makeName(r) {
  const n = r() < 0.35 ? 2 : r() < 0.85 ? 3 : 4;
  let s = "";
  for (let i = 0; i < n; i++) s += SYL[Math.floor(r() * SYL.length)];
  s = s.slice(0, 9);
  return s[0].toUpperCase() + s.slice(1);
}
const SPECIES_ADJ = ["Large", "Fierce", "Small", "Green", "Red", "Yellow", "Blue", "Black", "Harmless", "Slimy", "Bug-Eyed", "Horned", "Bony", "Fat", "Furry", "Feathered", "Six-Legged", "Crystalline"];
const SPECIES_NOUN = ["Rodents", "Frogs", "Lizards", "Lobsters", "Birds", "Humanoids", "Felines", "Insects", "Molluscs", "Fungoids", "Otters", "Moths"];
const FAMOUS = ["famous", "noted", "well known", "notorious", "celebrated", "infamous", "loved"];
const FOR_THINGS = ["its ancient {X} forests", "its {X} tea ceremonies", "its vast oceans of {X}", "its mad {X} sport", "its exotic {X} cuisine", "its unusual {X} poetry",
  "its endless {X} festivals", "its deadly {X} storms", "its lethargic {X} zoos", "its fabulous {X} night markets", "its spectacular {X} geysers", "its hostile {X} jungles"];
const X = ["moss", "glass", "coral", "jelly", "lava", "crystal", "fungus", "orchid", "salt", "sand", "pepper", "ice"];
const PLAGUE = ["a plague of {S}", "frequent outbreaks of {S}", "a deep fear of {S}", "the unpredictable {S}", "its vicious {S} wrestling", "its love of {S} racing"];
const MISC = ["The locals are said to be extremely polite to visitors.", "Watch out for the customs officers – they are bored.", "Travellers praise the station's noodle bars.",
  "The planet has no moon and is a little sad about it.", "Pilots are advised to avoid the outer asteroid belt.", "Its orbital station is said to smell of cinnamon.",
  "Nobody remembers who built the old ruins here.", "Tourists come for the sunsets and leave for the taxes.", "The local bureaucracy is legendary throughout the sector."];

export const PLANET_TYPES = {
  terran: { pal: [[0, "#123a8a"], [0.47, "#1e5ab0"], [0.5, "#d8c890"], [0.53, "#3a8a3a"], [0.7, "#2a6a2a"], [0.82, "#7a6a4a"], [0.92, "#e8e8f0"]], clouds: 0.6, atmo: "#6ab0ff" },
  ocean: { pal: [[0, "#082a6a"], [0.6, "#1a5ab0"], [0.66, "#e0d8a0"], [0.7, "#4aa04a"], [0.9, "#f0f0f0"]], clouds: 0.7, atmo: "#7ac0ff" },
  desert: { pal: [[0, "#6a3a1a"], [0.35, "#b0703a"], [0.55, "#e0a860"], [0.75, "#c08040"], [0.9, "#f0d8a0"]], clouds: 0.15, atmo: "#ffc080" },
  ice: { pal: [[0, "#3a5a7a"], [0.4, "#8aa8c0"], [0.6, "#bcd0e0"], [1, "#dce6f0"]], clouds: 0.3, atmo: "#a0c8f0" },
  jungle: { pal: [[0, "#0a3a3a"], [0.4, "#1a6a3a"], [0.42, "#3a8a2a"], [0.7, "#2a7a1a"], [0.85, "#5a8a2a"], [1, "#8aa04a"]], clouds: 0.75, atmo: "#80ffb0" },
  volcanic: { pal: [[0, "#ff6a1a"], [0.25, "#a02a0a"], [0.3, "#2a1a1a"], [0.7, "#3a2a2a"], [1, "#6a5a5a"]], clouds: 0.25, atmo: "#ff8040", glow: true },
  toxic: { pal: [[0, "#3a4a0a"], [0.4, "#6a8a1a"], [0.6, "#a0b02a"], [0.8, "#d0c84a"], [1, "#f0e8a0"]], clouds: 0.8, atmo: "#c8ff60" },
  barren: { pal: [[0, "#3a3a3a"], [0.4, "#6a6060"], [0.7, "#9a9088"], [1, "#d0c8c0"]], clouds: 0, atmo: "#a0a0b0" },
};
const STAR_CLASSES = [
  { cls: "M", color: "#ff8a5a", size: 0.7 }, { cls: "K", color: "#ffb870", size: 0.85 }, { cls: "G", color: "#fff2c0", size: 1 },
  { cls: "F", color: "#fffaf0", size: 1.15 }, { cls: "A", color: "#d0e0ff", size: 1.35 }, { cls: "B", color: "#a8c0ff", size: 1.6 },
];

/* ---------- Generation ---------- */
const cache = [];
export function galaxy(gi) {
  if (cache[gi]) return cache[gi];
  const r = U.rng(0x51a7 + gi * 7919);
  const list = [], names = new Set();
  for (let i = 0; i < SYSTEMS; i++) {
    let name; do name = makeName(r); while (names.has(name)); names.add(name);
    // clustered positions: many systems along spiral-like bands, some scattered
    let x, y;
    if (r() < 0.7) {
      const arm = Math.floor(r() * 3), t = r(), ang = arm * 2.1 + t * 3.2 + gi;
      x = CHART_W / 2 + Math.cos(ang) * (60 + t * 420) + (r() - 0.5) * 90;
      y = CHART_H / 2 + Math.sin(ang) * (30 + t * 210) + (r() - 0.5) * 60;
    } else { x = 20 + r() * (CHART_W - 40); y = 20 + r() * (CHART_H - 40); }
    x = U.clamp(x, 16, CHART_W - 16); y = U.clamp(y, 16, CHART_H - 16);
    list.push({ gi, i, name, x, y, r: U.rng(0x9e37 + gi * 100003 + i * 131) });
  }
  // nobody should be stranded: pull isolated systems towards their nearest neighbour
  for (let pass = 0; pass < 3; pass++) for (const s of list) {
    let best = null, bd = 1e9;
    for (const o of list) if (o !== s) { const d = Math.hypot(o.x - s.x, o.y - s.y); if (d < bd) { bd = d; best = o; } }
    if (bd > 6.2 * LY) { const k = (5 * LY) / bd; s.x = best.x + (s.x - best.x) * k; s.y = best.y + (s.y - best.y) * k; }
  }
  for (const s of list) detail(s);
  cache[gi] = list;
  return list;
}

function detail(s) {
  const r = s.r;
  s.gov = Math.floor(r() * 8);
  s.econ = Math.floor(r() * 8);
  if (s.gov <= 1) s.econ = Math.max(s.econ, 2); // anarchies are never rich
  s.tech = U.clamp(Math.floor((7 - s.econ) * 0.9 + s.gov * 0.5 + r() * 4) + 1, 1, 15);
  s.pop = Math.round((s.tech * 4 + s.econ + s.gov + 1 + r() * 4) * 10) / 100; // billions
  s.prod = Math.round(((7 - s.econ) + 3) * (s.gov + 4) * s.pop * 80);
  s.radius = 2500 + Math.floor(r() * 4500);
  s.species = r() < 0.5 ? "Human Colonials" : `${SPECIES_ADJ[Math.floor(r() * SPECIES_ADJ.length)]} ${SPECIES_NOUN[Math.floor(r() * SPECIES_NOUN.length)]}`;
  const fx = () => X[Math.floor(r() * X.length)];
  const t1 = FOR_THINGS[Math.floor(r() * FOR_THINGS.length)].replace("{X}", fx());
  const t2 = r() < 0.5 ? FOR_THINGS[Math.floor(r() * FOR_THINGS.length)].replace("{X}", fx()) : PLAGUE[Math.floor(r() * PLAGUE.length)].replace("{S}", `${SPECIES_NOUN[Math.floor(r() * SPECIES_NOUN.length)].toLowerCase()}`);
  s.desc = `${s.name} is ${FAMOUS[Math.floor(r() * FAMOUS.length)]} for ${t1} and ${t2 === t1 ? "its friendly people" : t2}. ${MISC[Math.floor(r() * MISC.length)]}`;
  // looks
  const agri = s.econ >= 4;
  const pool = agri ? ["terran", "ocean", "jungle", "terran", "ice"] : ["desert", "volcanic", "toxic", "barren", "terran", "ice"];
  s.ptype = pool[Math.floor(r() * pool.length)];
  s.star = STAR_CLASSES[Math.floor(r() * STAR_CLASSES.length)];
  s.rings = r() < 0.25;
  s.moons = Math.floor(r() * 3);
  s.seed = Math.floor(r() * 1e9);
  s.hue = r();
  s.nebula = [r(), r(), r()];
}

export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) / LY;
export const inRange = (from, list, ly) => list.filter((s) => s !== from && dist(from, s) <= ly);

/* ---------- Markets ---------- */
export function market(sys, fluct) {
  return GOODS.map((g) => {
    let price = (g.base + (fluct & g.mask) + sys.econ * g.grad) * 0.4;
    let qty = (g.qbase + (fluct & g.qmask) - sys.econ * g.grad) & 0x3f;
    if (g.id === "alien") qty = 0;
    if (g.legal >= 2 && sys.gov >= 5) qty = 0; // strict governments don't sell weapons or drugs
    return { price: Math.max(0.4, price), qty: U.clamp(qty, 0, 63) };
  });
}

/* ---------- Ranks ---------- */
export const RANKS = [[0, "Harmless"], [4, "Mostly Harmless"], [10, "Poor"], [20, "Average"], [40, "Above Average"], [80, "Competent"], [180, "Dangerous"], [400, "Deadly"], [900, "LEGEND"]];
export function rankOf(kp) { let r = RANKS[0][1]; for (const [k, n] of RANKS) if (kp >= k) r = n; return r; }
export function legalName(l) { return l >= 50 ? "Fugitive" : l > 0 ? "Offender" : "Clean"; }
