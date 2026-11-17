/* STARHAUL: the commander (career state), markets, money, score, legal status, saving and highscores */
import { galaxy, market, GOODS } from "./galaxy.js";
import { SHIPS, LASERS } from "./ships.js";
const { U, Store } = window.XA;

export const G = (window.XA.G = {
  cheat: false, cmdr: null, market: null, msgs: [], state: "boot", playTime: 0,
});

export function startSystem() {
  // a friendly, high tech system near the middle of the first galaxy
  const list = galaxy(0);
  let best = list[0], bs = -1e9;
  for (const s of list) { const sc = (s.gov >= 5 ? 30 : 0) + s.tech * 2 - Math.hypot(s.x - 512, s.y - 256) / 20 + (s.econ >= 2 && s.econ <= 5 ? 10 : 0); if (sc > bs) { bs = sc; best = s; } }
  return best;
}

export function newCommander(name) {
  const s = startSystem();
  return {
    name: name || "JAMESON", credits: 100, gi: 0, si: s.i, target: -1, ship: "kestrel", fuel: 7,
    cargo: {}, cost: {}, equip: {}, missiles: 3, lasers: { front: "pulse", rear: null },
    legal: 0, killPts: 0, kills: 0, score: 0, visited: [`0:${s.i}`], time: 0, trades: 0, profit: 0, deaths: 0, cheated: false, created: Date.now(),
  };
}
export const sys = () => galaxy(G.cmdr.gi)[G.cmdr.si];
export const shipDef = () => SHIPS[G.cmdr.ship];
export const cargoCap = () => Math.round(shipDef().cargo * (G.cmdr.equip.bay ? 1.5 : 1));
export const cargoUsed = () => Object.entries(G.cmdr.cargo).reduce((s, [id, q]) => s + (GOODS.find((g) => g.id === id).unit === "t" ? q : 0), 0);
export const cargoFree = () => cargoCap() - cargoUsed();
export const fuelMax = () => shipDef().fuel;

/* ---------- money (the secret mode never loses money) ---------- */
export function pay(amount) {
  if (amount <= 0) return true;
  if (G.cheat) return true;
  if (G.cmdr.credits + 1e-6 < amount) return false;
  G.cmdr.credits = Math.round((G.cmdr.credits - amount) * 10) / 10;
  return true;
}
export function canPay(amount) { return G.cheat || G.cmdr.credits + 1e-6 >= amount; }
export function earn(amount) { G.cmdr.credits = Math.round((G.cmdr.credits + amount) * 10) / 10; }
export function addScore(n) {
  if (G.cheat) { G.cmdr.cheated = true; return; }
  G.cmdr.score += Math.round(n);
}

/* ---------- markets ---------- */
export function enterMarket() {
  const s = sys();
  const fluct = Math.floor(Math.random() * 256);
  G.market = { key: `${s.gi}:${s.i}`, list: market(s, fluct) };
}
export function buy(gi, n = 1) {
  const c = G.cmdr, m = G.market.list[gi], g = GOODS[gi];
  let done = 0;
  for (let k = 0; k < n; k++) {
    if (m.qty <= 0) break;
    if (g.unit === "t" && cargoFree() <= 0) break;
    if (!pay(m.price)) break;
    const have = c.cargo[g.id] || 0;
    c.cost[g.id] = ((c.cost[g.id] || 0) * have + m.price) / (have + 1);
    c.cargo[g.id] = have + 1; m.qty--; done++;
  }
  return done;
}
export function sell(gi, n = 1) {
  const c = G.cmdr, m = G.market.list[gi], g = GOODS[gi];
  let done = 0;
  for (let k = 0; k < n; k++) {
    const have = c.cargo[g.id] || 0;
    if (have <= 0) break;
    earn(m.price);
    const profit = m.price - (c.cost[g.id] || m.price * 0.8);
    if (profit > 0) addScore(profit * 2);
    c.profit += profit;
    c.cargo[g.id] = have - 1; m.qty++; done++;
    if (c.cargo[g.id] <= 0) { delete c.cargo[g.id]; delete c.cost[g.id]; }
  }
  if (done) c.trades++;
  return done;
}
export function illegalCargo() { let n = 0; for (const [id, q] of Object.entries(G.cmdr.cargo)) n += GOODS.find((g) => g.id === id).legal * q; return n; }

/* ---------- ship trade-in value ---------- */
export function shipValue() {
  const c = G.cmdr, d = SHIPS[c.ship];
  let v = (d.price || 30000) * 0.6;
  for (const [k, on] of Object.entries(c.equip)) if (on) v += 200;
  if (c.lasers.front) v += LASERS[c.lasers.front].price * 0.5;
  if (c.lasers.rear) v += LASERS[c.lasers.rear].price * 0.5;
  return Math.round(v);
}

/* ---------- messages ---------- */
export function msg(text, color = "#9ad8ff", dur = 3.5) {
  G.msgs.push({ text, color, t: 0, dur });
  if (G.msgs.length > 5) G.msgs.shift();
}

/* ---------- saving ---------- */
export function save(slot = "career") { if (G.cmdr) Store.set("save." + slot, G.cmdr); }
export function load(slot = "career") { const c = Store.get("save." + slot, null); if (!c) return false; G.cmdr = Object.assign(newCommander(c.name), c); return true; }
export const hasSave = (slot = "career") => !!Store.get("save." + slot, null);

/* ---------- highscores ---------- */
const DEFAULT_HS = [["ADA VEX", 60000, "Deadly"], ["KORRIGAN", 42000, "Dangerous"], ["MIRA SOL", 30000, "Competent"], ["T. HAWKE", 21000, "Competent"], ["NULL", 14000, "Above Average"],
  ["OLD JO", 9000, "Average"], ["BIX", 5500, "Average"], ["QUILL", 3000, "Poor"], ["ROOKIE", 1500, "Mostly Harmless"], ["DRIFTER", 600, "Harmless"]]
  .map(([name, score, rank]) => ({ name, score, rank, date: "" }));
export const HS = {
  list() { const l = Store.get("scores", null); return Array.isArray(l) && l.length ? l : DEFAULT_HS.slice(); },
  rank(score) { if (score <= 0) return -1; const l = HS.list(); let i = 0; while (i < l.length && l[i].score >= score) i++; return i < 10 ? i : -1; },
  add(e) { const l = HS.list(); e.date = new Date().toISOString().slice(0, 10); l.push(e); l.sort((a, b) => b.score - a.score); const out = l.slice(0, 10); Store.set("scores", out); return out.indexOf(e); },
};
