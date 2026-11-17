/* STARHAUL: screens – title, new career, docked station menus (market, outfitting, shipyard, star map, system data,
   commander), flight with pause and map, game over, highscores, name entry, options and controls. */
import * as THREE from "three";
import { G, sys, shipDef, cargoCap, cargoUsed, cargoFree, fuelMax, newCommander, enterMarket, buy, sell, pay, canPay, earn, msg, save, load, hasSave, HS, shipValue, illegalCargo, addScore } from "./state.js";
import { galaxy, dist, GOODS, ECONOMY, GOV, GALAXY_NAMES, CHART_W, CHART_H, LY, legalName, rankOf, RANKS, PLANET_TYPES } from "./galaxy.js";
import { SHIPS, LASERS, EQUIP, PLAYER_SHIPS, buildShip } from "./ships.js";
import { drawHUD, drawMessages, updateMessages, text, glowText, FONT, BODY, CY } from "./hud.js";
const { U, Store } = window.XA;
const I = window.XA.Input, A = window.XA.Audio;

export const States = (window.__S = {});
let M = null; // main context: world, flight, setState, W, H
export function bindUI(main) { M = main; }
const inRect = (m, x, y, w, h) => m.x >= x && m.x <= x + w && m.y >= y && m.y <= y + h;
const SHIP_TECH = { wren: 1, kestrel: 3, mule: 4, falcon: 7, atlas: 8, vanguard: 10, seraph: 12 };

function panel(g, x, y, w, h, a = 0.82) {
  g.fillStyle = `rgba(6,14,30,${a})`; g.fillRect(x, y, w, h);
  g.strokeStyle = "rgba(90,216,255,0.55)"; g.lineWidth = 1.5; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  g.fillStyle = "rgba(90,216,255,0.8)"; g.fillRect(x, y, 18, 3); g.fillRect(x + w - 18, y + h - 3, 18, 3);
}
function wrap(g, s, x, y, maxW, lh, size, col) {
  g.font = `500 ${size}px ${BODY}`; g.textAlign = "left"; g.textBaseline = "middle"; g.fillStyle = col;
  let line = "", yy = y;
  for (const w of s.split(" ")) { const t = line ? line + " " + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, yy); line = w; yy += lh; } else line = t; }
  if (line) g.fillText(line, x, yy);
  return yy + lh;
}
function logo(g, W, y, t) {
  g.save();
  g.font = `900 92px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineJoin = "round"; g.strokeStyle = "#3aa0ff";
  for (const [w, a] of [[26, 0.08], [14, 0.14], [6, 0.25]]) { g.globalAlpha = a; g.lineWidth = w; g.strokeText("STARHAUL", W / 2, y); }
  g.globalAlpha = 1;
  const gr = g.createLinearGradient(0, y - 46, 0, y + 46); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.55, "#9ad8ff"); gr.addColorStop(0.56, "#3a8aff"); gr.addColorStop(1, "#1a3aa0");
  g.fillStyle = gr; g.fillText("STARHAUL", W / 2, y);
  g.restore();
  glowText(g, "TRADE · FIGHT · BECOME A LEGEND", W / 2, y + 66, 18, "#9ad8ff", "center", FONT);
}

/* ---------- menus ---------- */
function makeMenu(items, y, w = 440, h = 44, gap = 8, fx = 0.5) { return { items, sel: 0, y, w, h, gap, fx }; }
function menuInput(m, W) {
  const items = m.items.filter((i) => !i.hidden || !i.hidden());
  const n = items.length;
  if (m.sel >= n) m.sel = 0;
  if (I.hit("up")) { m.sel = (m.sel + n - 1) % n; A.sfx("menuMove"); }
  if (I.hit("down")) { m.sel = (m.sel + 1) % n; A.sfx("menuMove"); }
  let hi = -1;
  const cx = W * m.fx;
  items.forEach((it, i) => { if (inRect(I.mouse, cx - m.w / 2, m.y + i * (m.h + m.gap), m.w, m.h)) hi = i; });
  if (I.mouse.moved && hi >= 0 && hi !== m.sel) { m.sel = hi; A.sfx("menuMove"); }
  const it = items[m.sel];
  if (it.adjust) { if (I.hit("left")) it.adjust(-1); if (I.hit("right")) it.adjust(1); }
  if (I.hit("confirm") || (I.mouse.clicked && hi === m.sel && hi >= 0)) { if (it.action) { A.sfx("menuOk"); it.action(); } else if (it.adjust) it.adjust(1); }
}
function menuDraw(g, m, W, t) {
  const items = m.items.filter((i) => !i.hidden || !i.hidden());
  const cx = W * m.fx;
  items.forEach((it, i) => {
    const y = m.y + i * (m.h + m.gap), sel = i === m.sel;
    g.fillStyle = sel ? `rgba(58,160,255,${0.35 + 0.1 * Math.sin(t * 5)})` : "rgba(6,14,30,0.55)";
    g.fillRect(cx - m.w / 2, y, m.w, m.h);
    g.strokeStyle = sel ? "#9ad8ff" : "rgba(90,216,255,0.25)"; g.lineWidth = 1.5; g.strokeRect(cx - m.w / 2 + 0.5, y + 0.5, m.w - 1, m.h - 1);
    const label = typeof it.label === "function" ? it.label() : it.label;
    text(g, label, cx, y + m.h / 2 + 1, sel ? 19 : 17, sel ? "#ffffff" : "#bfe6ff", "center", FONT, 700);
  });
}

/* ---------- 3D backdrops ---------- */
let showcase = null;
function showcaseShip(type) {
  const w = M.world;
  if (showcase) w.scene.remove(showcase);
  showcase = buildShip(type);
  w.scene.add(showcase);
  return showcase;
}
function orbitStation(dt, t, dist = 3800) {
  const w = M.world, S = w.sys; if (!S) return;
  const cam = w.camera; if (cam.parent !== w.scene) w.scene.attach(cam);
  const st = S.station.position, ax = S.stationAxis;
  const side = new THREE.Vector3().crossVectors(ax, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(side, ax).normalize();
  const a = t * 0.05;
  cam.position.copy(st).addScaledVector(ax, dist * 0.8).addScaledVector(side, Math.cos(a) * dist * 0.7).addScaledVector(up, Math.sin(a) * dist * 0.35 + dist * 0.15);
  cam.up.set(0, 1, 0);
  cam.lookAt(st.clone().addScaledVector(ax, -800));
}

/* ---------- Boot ---------- */
States.boot = {
  t: 0, ready: false,
  enter() { this.t = 0; },
  input() { if (this.t > 0.2 && (I.pressed.size || I.mouse.clicked || I.pad.pressed.size)) { A.init(); M.setState("title"); } },
  update(dt) { this.t += dt; },
  draw(g, W, H) {
    g.fillStyle = "#02040a"; g.fillRect(0, 0, W, H);
    logo(g, W, H * 0.38, this.t);
    if (Math.floor(this.t * 2) % 2 === 0) glowText(g, "PRESS ANY KEY · CLICK · OR PRESS A BUTTON", W / 2, H * 0.68, 18, "#ffd060", "center", FONT);
    text(g, "Best with sound on · F = fullscreen · N = mute", W / 2, H - 30, 16, "#7aa8c8", "center");
  },
  uses3D: false,
};

/* ---------- Title ---------- */
States.title = {
  t: 0, idle: 0,
  menu: makeMenu([
    { label: "CONTINUE CAREER", hidden: () => !hasSave("career"), action: () => { if (load("career")) M.dockAt(true); } },
    { label: "NEW CAREER", action: () => M.setState("newcareer") },
    { label: "LOAD BACKUP SAVE", hidden: () => !hasSave("backup"), action: () => { if (load("backup")) { save("career"); M.dockAt(true); } } },
    { label: "CONTROLS", action: () => M.setState("controls", { back: "title" }) },
    { label: "OPTIONS", action: () => M.setState("options", { back: "title" }) },
    { label: "HIGHSCORES", action: () => M.setState("highscores") },
  ], 300, 380, 44, 8, 0.24),
  enter() {
    this.t = 0; A.playSong("title"); M.flight.mode = "title";
    M.flight.clearEnts(); M.world.setTunnel(0, 0); A.setEngine(-1); G.autopilot = false;
    M.world.sysGroup.visible = true; M.world.skyGroup.visible = true;
    if (!M.world.sys || !this.built) {
      this.built = true;
      const l = galaxy(U.randi(0, 7)); const s = l[U.randi(0, 255)];
      M.world.buildSystem(s);
    }
    this.ship = U.pick(["falcon", "seraph", "vanguard", "kestrel", "raptor", "atlas"]);
    showcaseShip(this.ship);
  },
  show(type) { this.ship = type; showcaseShip(type); }, // test hook
  input(dt, W) { menuInput(this.menu, W); },
  update(dt) {
    this.t += dt;
    const w = M.world, S = w.sys;
    if (!S || !showcase) return;
    const cam = w.camera; if (cam.parent !== w.scene) w.scene.attach(cam);
    // the ship cruises past the planet, the camera circles it
    const base = S.sunDir.clone().multiplyScalar(S.R * 1.6).add(new THREE.Vector3(0, S.R * 0.25, 0));
    showcase.position.copy(base);
    showcase.rotation.set(0.15 * Math.sin(this.t * 0.4), this.t * 0.15, 0.25 * Math.sin(this.t * 0.3));
    const d = SHIPS[this.ship].size * 1.9;
    cam.position.copy(base).add(new THREE.Vector3(Math.cos(this.t * 0.1) * d, d * 0.3, Math.sin(this.t * 0.1) * d));
    cam.up.set(0, 1, 0); cam.lookAt(base);
    cam.translateX(-d * 0.42); // frame the ship on the right, the menu sits on the left
    if (showcase.userData.engines) for (const s of showcase.userData.engines) s.material.opacity = 0.7 + 0.3 * Math.sin(this.t * 20);
  },
  draw(g, W, H) {
    if (!M.world.sys) { g.fillStyle = "#02040a"; g.fillRect(0, 0, W, H); }
    g.save(); g.translate(-W * 0.26, 0); logo(g, W, 150, this.t); g.restore();
    menuDraw(g, this.menu, W, this.t);
    text(g, SHIPS[this.ship].name, W - 24, H - 24, 16, "rgba(190,230,255,0.7)", "right", FONT, 700);
    text(g, "Arrows / W S + Enter · mouse · gamepad", 24, H - 24, 15, "rgba(190,230,255,0.7)", "left");
    if (G.cheat) { g.fillStyle = "#ffd040"; g.beginPath(); g.arc(W - 12, 12, 4, 0, U.TAU); g.fill(); }
  },
  uses3D: true,
};

/* ---------- New career: commander name ---------- */
States.newcareer = {
  t: 0, name: "",
  enter() { this.t = 0; this.name = Store.get("lastName", "JAMESON"); },
  input() {
    for (const ch of I.typed) { const c = ch.toUpperCase(); if (/^[A-Z0-9 .\-']$/.test(c) && this.name.length < 14) { this.name += c; A.sfx("menuMove"); } }
    if (I.pressed.has("Backspace")) { this.name = this.name.slice(0, -1); A.sfx("menuBack"); }
    if (I.pressed.has("Escape") || I.padHit(1)) { M.setState("title"); return; }
    if (I.pressed.has("Enter") || I.pressed.has("NumpadEnter") || I.padHit(0) || I.padHit(9) || I.mouse.clicked) {
      const n = this.name.trim() || "JAMESON"; Store.set("lastName", n);
      G.cmdr = newCommander(n); save("career"); A.sfx("menuOk"); M.dockAt(true);
    }
  },
  update(dt) { this.t += dt; States.title.update(dt); },
  draw(g, W, H) {
    g.fillStyle = "rgba(2,4,10,0.55)"; g.fillRect(0, 0, W, H);
    glowText(g, "NEW CAREER", W / 2, 150, 40, "#9ad8ff");
    wrap(g, "You start with a used Kestrel Mk II, a pulse laser, three missiles, a full tank – and 100 credits. Buy low, sell high, hunt pirates, avoid the police, and make a name for yourself among the stars.", W / 2 - 330, 220, 660, 28, 20, "#d8eeff");
    text(g, "Commander name:", W / 2, 360, 20, CY, "center", FONT, 700);
    panel(g, W / 2 - 240, 385, 480, 64);
    text(g, this.name + (Math.floor(this.t * 2.5) % 2 ? "_" : " "), W / 2, 418, 32, "#ffffff", "center", FONT, 700);
    text(g, "Type a name · Enter / click / A starts · Esc goes back", W / 2, 490, 17, "#7aa8c8", "center");
    text(g, "Starting a new career replaces the current autosave (your backup save stays).", W / 2, 520, 15, "#7aa8c8", "center");
  },
  uses3D: true,
};

/* ---------- Star map (shared by the station and the flight overlay) ---------- */
const Map = {
  cx: 512, cy: 256, zoom: 1, hover: null, search: "", searchT: 0,
  reset() { const s = sys(); this.cx = s.x; this.cy = s.y; const c = G.cmdr; this.hover = c.target >= 0 ? galaxy(c.gi)[c.target] : s; if (this.hover !== s) { this.cx = this.hover.x; this.cy = this.hover.y; } },
  rect(W, H, top = 90, bottom = 40) { const w = Math.min(W - 420, 1100), h = H - top - bottom; return { x: 30, y: top, w, h }; },
  toScreen(R, x, y) {
    const sc = (R.w / CHART_W) * this.zoom;
    const ox = this.zoom === 1 ? CHART_W / 2 : this.cx, oy = this.zoom === 1 ? CHART_H / 2 : this.cy;
    return [R.x + R.w / 2 + (x - ox) * sc, R.y + R.h / 2 + (y - oy) * sc * (this.zoom === 1 ? R.h / R.w * (CHART_W / CHART_H) : 1)];
  },
  input(dt, W, H) {
    const R = this.rect(W, H), list = galaxy(G.cmdr.gi);
    let mx = 0, my = 0;
    if (I.held("left")) mx -= 1; if (I.held("right")) mx += 1; if (I.held("up")) my -= 1; if (I.held("down")) my += 1;
    if (I.pad.connected) { mx += I.pad.axes[0]; my += I.pad.axes[1]; }
    const sp = (this.zoom === 1 ? 300 : 90) * dt;
    if (mx || my) { this.cx = U.clamp(this.cx + mx * sp, 0, CHART_W); this.cy = U.clamp(this.cy + my * sp, 0, CHART_H); this.pickNear(list, this.cx, this.cy); }
    if (I.mouse.wheel || I.key("KeyZ") || I.padHit(3)) { this.zoom = this.zoom === 1 ? 4 : 1; if (this.hover) { this.cx = this.hover.x; this.cy = this.hover.y; } A.sfx("menuMove"); }
    if (inRect(I.mouse, R.x, R.y, R.w, R.h) && (I.mouse.moved || I.mouse.clicked)) {
      let best = null, bd = 30;
      for (const s of list) { const [x, y] = this.toScreen(R, s.x, s.y); const d = Math.hypot(x - I.mouse.x, y - I.mouse.y); if (d < bd) { bd = d; best = s; } }
      if (best) { this.hover = best; if (this.zoom !== 1 && I.mouse.clicked) { /* keep view */ } }
      if (I.mouse.clicked && best) this.select(best);
    }
    // type a name to find a system
    for (const ch of I.typed) if (/^[a-zA-Z]$/.test(ch)) { this.search += ch.toLowerCase(); this.searchT = 1.5; }
    if (this.searchT > 0) { this.searchT -= dt; const f = list.find((s) => s.name.toLowerCase().startsWith(this.search)); if (f) { this.hover = f; this.cx = f.x; this.cy = f.y; } if (this.searchT <= 0) this.search = ""; }
    if ((I.pressed.has("Enter") || I.pressed.has("Space") || I.padHit(0)) && this.hover) this.select(this.hover);
  },
  pickNear(list, x, y) { let b = null, bd = 1e9; for (const s of list) { const d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; b = s; } } this.hover = b; },
  select(s) {
    const c = G.cmdr;
    if (s.i === c.si) { c.target = -1; A.sfx("menuBack"); return; }
    c.target = s.i; A.sfx("lock");
    const d = dist(sys(), s);
    msg(d <= Math.min(c.fuel, fuelMax()) ? `Destination: ${s.name} (${d.toFixed(1)} ly)` : `${s.name} is out of range (${d.toFixed(1)} ly)`, d <= c.fuel ? "#60ff90" : "#ff9040", 2.5);
  },
  draw(g, W, H, t, top = 90) {
    const R = this.rect(W, H, top), c = G.cmdr, list = galaxy(c.gi), cur = sys();
    panel(g, R.x, R.y, R.w, R.h, 0.88);
    g.save(); g.beginPath(); g.rect(R.x, R.y, R.w, R.h); g.clip();
    // grid
    g.strokeStyle = "rgba(90,216,255,0.07)"; g.lineWidth = 1;
    for (let x = 0; x <= CHART_W; x += 64) { const [a] = this.toScreen(R, x, 0); g.beginPath(); g.moveTo(a, R.y); g.lineTo(a, R.y + R.h); g.stroke(); }
    for (let y = 0; y <= CHART_H; y += 64) { const [, b] = this.toScreen(R, 0, y); g.beginPath(); g.moveTo(R.x, b); g.lineTo(R.x + R.w, b); g.stroke(); }
    // fuel range
    const [ux, uy] = this.toScreen(R, cur.x, cur.y), [rx2] = this.toScreen(R, cur.x + c.fuel * LY, cur.y), [rx3] = this.toScreen(R, cur.x + fuelMax() * LY, cur.y);
    g.strokeStyle = "rgba(255,210,80,0.25)"; g.setLineDash([4, 6]); g.beginPath(); g.arc(ux, uy, rx3 - ux, 0, U.TAU); g.stroke(); g.setLineDash([]);
    g.fillStyle = "rgba(90,255,150,0.06)"; g.strokeStyle = "rgba(90,255,150,0.5)"; g.beginPath(); g.arc(ux, uy, rx2 - ux, 0, U.TAU); g.fill(); g.stroke();
    // links to the selected destination
    if (c.target >= 0) { const tg = list[c.target]; const [tx, ty] = this.toScreen(R, tg.x, tg.y); g.strokeStyle = "rgba(255,210,80,0.8)"; g.lineWidth = 2; g.beginPath(); g.moveTo(ux, uy); g.lineTo(tx, ty); g.stroke(); }
    const big = this.zoom > 1;
    for (const s of list) {
      const [x, y] = this.toScreen(R, s.x, s.y);
      if (x < R.x - 10 || x > R.x + R.w + 10 || y < R.y - 10 || y > R.y + R.h + 10) continue;
      const col = `hsl(${120 - (7 - s.econ) * 15 + (s.econ >= 4 ? 0 : -60)},80%,${55 + s.tech * 2}%)`;
      const r = (big ? 4 : 1.6) + s.tech * (big ? 0.35 : 0.12);
      g.fillStyle = s.econ >= 4 ? `hsl(${90 + s.econ * 4},70%,55%)` : `hsl(${20 + s.econ * 8},90%,58%)`;
      g.beginPath(); g.arc(x, y, r, 0, U.TAU); g.fill();
      if (big || s === this.hover || s.i === c.target) text(g, s.name, x + r + 4, y, big ? 14 : 12, s.i === c.target ? "#ffd040" : "rgba(220,240,255,0.85)");
      if (s.i === c.target) { g.strokeStyle = "#ffd040"; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r + 6, 0, U.TAU); g.stroke(); }
    }
    // current system
    g.strokeStyle = "#ffffff"; g.lineWidth = 2; g.beginPath(); g.moveTo(ux - 14, uy); g.lineTo(ux + 14, uy); g.moveTo(ux, uy - 14); g.lineTo(ux, uy + 14); g.stroke();
    // cursor
    if (this.hover) { const [hx, hy] = this.toScreen(R, this.hover.x, this.hover.y); g.strokeStyle = `rgba(90,216,255,${0.6 + 0.4 * Math.sin(t * 6)})`; g.lineWidth = 2; g.strokeRect(hx - 10, hy - 10, 20, 20); }
    g.restore();
    text(g, `${GALAXY_NAMES[c.gi].toUpperCase()} · GALAXY ${c.gi + 1}${this.zoom > 1 ? " · LOCAL CHART" : ""}`, R.x + 12, R.y + 16, 14, CY, "left", FONT, 700);
    if (this.search) text(g, `Search: ${this.search}`, R.x + R.w - 12, R.y + 16, 15, "#ffd040", "right");
    // info panel
    const ix = R.x + R.w + 16, iw = W - ix - 30;
    panel(g, ix, R.y, iw, R.h, 0.88);
    const s = this.hover || cur;
    if (s) {
      let y = R.y + 30;
      text(g, s.name.toUpperCase(), ix + 16, y, 24, "#ffffff", "left", FONT, 700); y += 30;
      const d = dist(cur, s);
      text(g, s === cur ? "Your current location" : `${d.toFixed(1)} light years ${d <= c.fuel ? "· in range" : d <= fuelMax() ? "· needs more fuel" : "· out of range"}`, ix + 16, y, 16, s === cur ? "#60ff90" : d <= c.fuel ? "#60ff90" : "#ff9040"); y += 30;
      for (const [k, v] of [["Economy", ECONOMY[s.econ]], ["Government", GOV[s.gov]], ["Tech level", s.tech], ["Population", `${s.pop.toFixed(1)} billion`], ["Inhabitants", s.species], ["World", `${s.ptype}, ${s.star.cls}-class star`]]) {
        text(g, k, ix + 16, y, 15, "#7aa8c8"); text(g, String(v), ix + iw - 16, y, 15, "#ffffff", "right"); y += 22;
      }
      y += 8;
      wrap(g, s.desc, ix + 16, y, iw - 32, 21, 15, "#bfe6ff");
      drawPlanetIcon(g, ix + iw / 2, R.y + R.h - 80, 52, s, t);
    }
    text(g, "Move: arrows / stick / mouse · Select: Enter / click · Zoom: Z / wheel · Type a name to search", R.x, R.y + R.h + 22, 15, "#7aa8c8");
  },
};
function drawPlanetIcon(g, x, y, r, s, t) {
  const T = PLANET_TYPES[s.ptype], pal = T.pal;
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  gr.addColorStop(0, pal[Math.min(pal.length - 1, 3)][1]); gr.addColorStop(0.6, pal[1][1]); gr.addColorStop(1, "#000");
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, U.TAU); g.fill();
  g.strokeStyle = T.atmo; g.globalAlpha = 0.6; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r + 2, 0, U.TAU); g.stroke(); g.globalAlpha = 1;
  if (s.rings && s.ptype !== "terran") { g.strokeStyle = "rgba(230,210,170,0.7)"; g.lineWidth = 4; g.beginPath(); g.ellipse(x, y, r * 1.8, r * 0.45, -0.3, 0, U.TAU); g.stroke(); }
}

/* ---------- Docked ---------- */
const TABS = ["LAUNCH", "MARKET", "OUTFITTING", "SHIPYARD", "STAR MAP", "SYSTEM", "COMMANDER"];
States.docked = {
  t: 0, tab: 1, row: 0, laserSel: {}, shipSel: 0, confirm: null,
  enter(arg) {
    this.t = 0; this.row = 0; this.confirm = null;
    if (arg && arg.tab !== undefined) this.tab = arg.tab;
    A.playSong("docked"); M.flight.mode = "docked"; XA.Main.setCursor(true);
    Map.reset();
    if (showcase) { M.world.scene.remove(showcase); showcase = null; }
    this.preview = null;
  },
  input(dt, W, H) {
    const c = G.cmdr;
    if (this.confirm) {
      if (I.hit("confirm") || I.key("KeyY") || I.padHit(0)) { const f = this.confirm.yes; this.confirm = null; f(); }
      else if (I.hit("back") || I.key("KeyN") || I.padHit(1)) this.confirm = null;
      return;
    }
    const prevTab = this.tab;
    const letters = this.tab !== 4; // on the star map, letters search for systems
    if ((letters && I.key("KeyQ")) || I.key("PageUp") || I.padHit(4)) this.tab = (this.tab + TABS.length - 1) % TABS.length;
    if ((letters && I.key("KeyE")) || I.key("PageDown") || I.key("Tab") || I.padHit(5)) this.tab = (this.tab + 1) % TABS.length;
    for (let i = 0; i < 7; i++) if (I.key("Digit" + (i + 1)) && this.tab !== 4) this.tab = i;
    // tab bar clicks
    const tw = Math.min(W - 60, 1220) / TABS.length, tx0 = (W - tw * TABS.length) / 2;
    if (I.mouse.clicked) TABS.forEach((n, i) => { if (inRect(I.mouse, tx0 + i * tw, 20, tw - 6, 40)) this.tab = i; });
    if (prevTab !== this.tab) { this.row = 0; A.sfx("menuMove"); if (this.tab === 4) Map.reset(); return; }
    if (I.key("Escape") && this.tab !== 0) { this.tab = 0; A.sfx("menuBack"); return; }
    const tab = TABS[this.tab];
    if (tab === "LAUNCH") { if (I.hit("confirm") || I.padHit(0) || (I.mouse.clicked && inRect(I.mouse, W / 2 - 160, 300, 320, 70))) M.launch(); if (I.key("Escape") || I.padHit(1)) this.confirm = { text: "Quit to the title screen? Your career was saved when you docked.", yes: () => M.setState("title") }; }
    else if (tab === "MARKET") this.marketInput(W, H);
    else if (tab === "OUTFITTING") this.outfitInput(W, H);
    else if (tab === "SHIPYARD") this.shipyardInput(W, H);
    else if (tab === "STAR MAP") Map.input(dt, W, H);
    else if (tab === "COMMANDER") this.cmdrInput(W, H);
  },
  rows(n, W, y0, rh) {
    if (I.hit("up")) { this.row = (this.row + n - 1) % n; A.sfx("menuMove"); }
    if (I.hit("down")) { this.row = (this.row + 1) % n; A.sfx("menuMove"); }
    for (let i = 0; i < n; i++) if (inRect(I.mouse, 40, y0 + i * rh, W - 80, rh) && I.mouse.moved && this.row !== i) { this.row = i; }
  },
  marketInput(W, H) {
    const y0 = 130, rh = 28;
    this.rows(GOODS.length, W, y0, rh);
    const many = I.held("faster") ? 10 : 1;
    const bx = W / 2 + 330;
    let b = 0, s = 0;
    if (I.hit("right") || I.key("NumpadAdd") || I.key("Equal")) b = many;
    if (I.hit("left") || I.key("NumpadSubtract") || I.key("Minus")) s = many;
    if (I.padHit(0)) b = 1; if (I.padHit(2)) s = 1;
    if (I.mouse.clicked) for (let i = 0; i < GOODS.length; i++) {
      const y = y0 + i * rh;
      if (inRect(I.mouse, bx, y + 2, 34, rh - 4)) { this.row = i; s = 1; }
      if (inRect(I.mouse, bx + 40, y + 2, 34, rh - 4)) { this.row = i; b = 1; }
      if (inRect(I.mouse, bx + 80, y + 2, 50, rh - 4)) { this.row = i; b = 99; }
      if (inRect(I.mouse, bx + 136, y + 2, 50, rh - 4)) { this.row = i; s = 999; }
    }
    if (I.key("KeyA") && I.held("faster")) s = 999;
    if (b) { const n = buy(this.row, b); A.sfx(n ? "buy" : "deny"); if (!n) msg(cargoFree() <= 0 ? "Cargo hold full" : !canPay(G.market.list[this.row].price) ? "Not enough credits" : "Sold out", "#ff9040", 1.5); }
    if (s) { const n = sell(this.row, s); A.sfx(n ? "sell" : "deny"); }
  },
  outfitList() {
    const s = sys(), c = G.cmdr;
    return EQUIP.map((e) => {
      const it = Object.assign({}, e), d = shipDef();
      it.ok = s.tech >= e.tech;
      if (e.id === "fuel") { it.price = Math.max(0, (fuelMax() - c.fuel) * 2); it.owned = c.fuel >= fuelMax() - 0.01; it.status = `${c.fuel.toFixed(1)} / ${fuelMax()} ly`; }
      else if (e.id === "missile") { it.owned = c.missiles >= d.missiles; it.status = `${c.missiles} / ${d.missiles}`; }
      else if (e.laser) {
        const types = Object.keys(LASERS).filter((k) => LASERS[k].tech <= s.tech);
        const cur = c.lasers[e.laser];
        let sel = this.laserSel[e.laser] ?? types.indexOf(cur); if (sel < 0) sel = 0; this.laserSel[e.laser] = sel % Math.max(1, types.length);
        const pick = types[this.laserSel[e.laser]];
        it.pick = pick; it.price = pick ? LASERS[pick].price : 0; it.owned = cur === pick; it.status = cur ? LASERS[cur].name : "none";
        it.name = `${e.name}: ◂ ${pick ? LASERS[pick].name : "-"} ▸`;
      } else { it.owned = !!c.equip[e.id]; it.status = it.owned ? "fitted" : ""; }
      return it;
    });
  },
  outfitInput(W, H) {
    const list = this.outfitList(), y0 = 130, rh = 36;
    this.rows(list.length, W, y0, rh);
    const it = list[this.row];
    if (it.laser) {
      const n = Object.keys(LASERS).filter((k) => LASERS[k].tech <= sys().tech).length;
      if (I.hit("left")) { this.laserSel[it.laser] = (this.laserSel[it.laser] + n - 1) % n; A.sfx("menuMove"); }
      if (I.hit("right")) { this.laserSel[it.laser] = (this.laserSel[it.laser] + 1) % n; A.sfx("menuMove"); }
    }
    let go = I.hit("confirm") || I.padHit(0);
    if (I.mouse.clicked && inRect(I.mouse, 40, y0 + this.row * rh, W - 80, rh)) go = true;
    if (go) this.buyEquip(it);
  },
  buyEquip(it) {
    const c = G.cmdr;
    if (!it.ok) { msg(`Needs tech level ${it.tech}`, "#ff9040", 2); A.sfx("deny"); return; }
    if (it.owned) { msg("Already fitted", "#9ad8ff", 1.5); A.sfx("deny"); return; }
    if (it.id === "fuel") { const need = fuelMax() - c.fuel; const afford = G.cheat ? need : Math.min(need, c.credits / 2); if (afford <= 0.05) { A.sfx("deny"); msg("Not enough credits", "#ff9040"); return; } pay(afford * 2); c.fuel = Math.min(fuelMax(), c.fuel + afford); A.sfx("buy"); return; }
    if (!canPay(it.price)) { msg("Not enough credits", "#ff9040", 1.5); A.sfx("deny"); return; }
    pay(it.price);
    if (it.id === "missile") c.missiles++;
    else if (it.laser) { const old = c.lasers[it.laser]; if (old) earn(Math.round(LASERS[old].price * 0.5)); c.lasers[it.laser] = it.pick; }
    else c.equip[it.id] = true;
    A.sfx("buy"); msg(`${it.laser ? LASERS[it.pick].name : it.name} fitted`, "#60ff90", 2);
  },
  shipList() { return PLAYER_SHIPS.filter((id) => SHIP_TECH[id] <= sys().tech + 2); },
  shipyardInput(W, H) {
    const list = this.shipList(), y0 = 130, rh = 52;
    this.rows(list.length, W, y0, rh);
    const id = list[this.row];
    let go = I.hit("confirm") || I.padHit(0);
    if (I.mouse.clicked && inRect(I.mouse, 40, y0 + this.row * rh, 520, rh)) go = true;
    if (go) {
      const c = G.cmdr, d = SHIPS[id];
      if (id === c.ship) { msg("That is your current ship", "#9ad8ff"); A.sfx("deny"); return; }
      if (SHIP_TECH[id] > sys().tech) { msg(`Needs tech level ${SHIP_TECH[id]}`, "#ff9040"); A.sfx("deny"); return; }
      const cost = Math.max(0, d.price - shipValue());
      if (!canPay(cost)) { msg("Not enough credits", "#ff9040"); A.sfx("deny"); return; }
      const cap = Math.round(d.cargo * (c.equip.bay ? 1.5 : 1));
      if (cargoUsed() > cap) { msg("Sell some cargo first – it would not fit", "#ff9040"); A.sfx("deny"); return; }
      this.confirm = { text: `Buy the ${d.name} for ${U.fmt(cost)} Cr (after trade-in)?`, yes: () => { pay(cost); c.ship = id; c.missiles = Math.min(c.missiles, d.missiles); c.fuel = Math.min(c.fuel, d.fuel); A.sfx("sell"); msg(`Welcome aboard your new ${d.name}!`, "#60ff90", 3); save("career"); } };
    }
  },
  cmdrInput(W, H) {
    if (I.mouse.clicked) {
      if (inRect(I.mouse, W - 330, H - 150, 280, 44)) { save("backup"); msg("Backup saved", "#60ff90"); A.sfx("menuOk"); }
      if (inRect(I.mouse, W - 330, H - 96, 280, 44)) this.askRetire();
    }
    if (I.key("KeyS") || I.padHit(2)) { save("backup"); msg("Backup saved", "#60ff90"); A.sfx("menuOk"); }
    if (I.key("KeyR") || I.padHit(3)) this.askRetire();
  },
  askRetire() { this.confirm = { text: "Retire and end this career? Your score goes to the highscore list.", yes: () => M.endCareer("retired") }; },
  update(dt) {
    this.t += dt;
    orbitStation(dt, this.t + 20);
    if (this.preview) { this.preview.rotation.y += dt * 0.5; }
  },
  draw(g, W, H) {
    const c = G.cmdr, t = this.t, s = sys();
    g.fillStyle = "rgba(2,6,14,0.35)"; g.fillRect(0, 0, W, H);
    // header with tabs
    const tw = Math.min(W - 60, 1220) / TABS.length, tx0 = (W - tw * TABS.length) / 2;
    TABS.forEach((n, i) => {
      const x = tx0 + i * tw, sel = i === this.tab;
      g.fillStyle = sel ? "rgba(58,160,255,0.5)" : "rgba(6,14,30,0.75)"; g.fillRect(x, 20, tw - 6, 40);
      g.strokeStyle = sel ? "#9ad8ff" : "rgba(90,216,255,0.3)"; g.strokeRect(x + 0.5, 20.5, tw - 7, 39);
      text(g, n, x + (tw - 6) / 2, 41, 14, sel ? "#ffffff" : "#9ac8e8", "center", FONT, 700);
    });
    text(g, `${s.name.toUpperCase()} STATION`, 30, 82, 16, "#ffffff", "left", FONT, 700);
    text(g, `${U.cr(c.credits)} Cr · Cargo ${cargoUsed()}/${cargoCap()} t · Fuel ${c.fuel.toFixed(1)} ly`, W - 30, 82, 17, "#ffd060", "right", FONT, 700);
    const tab = TABS[this.tab];
    if (tab === "LAUNCH") this.drawLaunch(g, W, H);
    else if (tab === "MARKET") this.drawMarket(g, W, H);
    else if (tab === "OUTFITTING") this.drawOutfit(g, W, H);
    else if (tab === "SHIPYARD") this.drawShipyard(g, W, H);
    else if (tab === "STAR MAP") Map.draw(g, W, H, t, 100);
    else if (tab === "SYSTEM") this.drawSystem(g, W, H);
    else if (tab === "COMMANDER") this.drawCmdr(g, W, H);
    if (tab !== "STAR MAP") text(g, "Q / E, Tab, 1–7, LB / RB or click: switch page", 30, H - 18, 14, "#7aa8c8");
    drawMessages(g, W, H);
    if (this.confirm) {
      g.fillStyle = "rgba(0,0,0,0.6)"; g.fillRect(0, 0, W, H);
      panel(g, W / 2 - 330, H / 2 - 80, 660, 160, 0.95);
      wrap(g, this.confirm.text, W / 2 - 300, H / 2 - 40, 600, 26, 20, "#ffffff");
      text(g, "Y / Enter / A = yes      N / Esc / B = no", W / 2, H / 2 + 50, 17, "#ffd060", "center", FONT, 700);
    }
  },
  drawLaunch(g, W, H) {
    const s = sys(), c = G.cmdr;
    panel(g, W / 2 - 360, 130, 720, 400, 0.75);
    glowText(g, `Docked at ${s.name}`, W / 2, 180, 34, "#9ad8ff");
    text(g, `${GOV[s.gov]} · ${ECONOMY[s.econ]} · Tech ${s.tech}`, W / 2, 225, 18, "#d8eeff", "center");
    g.fillStyle = `rgba(58,160,255,${0.45 + 0.15 * Math.sin(this.t * 4)})`; g.fillRect(W / 2 - 160, 300, 320, 70);
    g.strokeStyle = "#9ad8ff"; g.lineWidth = 2; g.strokeRect(W / 2 - 160, 300, 320, 70);
    text(g, "LAUNCH", W / 2, 336, 30, "#ffffff", "center", FONT, 900);
    text(g, "Enter / click / A", W / 2, 392, 15, "#7aa8c8", "center");
    const tg = c.target >= 0 ? galaxy(c.gi)[c.target] : null;
    text(g, tg ? `Destination: ${tg.name} (${dist(s, tg).toFixed(1)} ly)` : "No hyperspace destination selected – see STAR MAP", W / 2, 450, 18, tg ? "#ffd060" : "#7aa8c8", "center");
    if (illegalCargo() > 0) text(g, "Warning: you carry illegal goods. Customs will notice when you launch.", W / 2, 480, 16, "#ff9040", "center");
    if (c.legal > 0) text(g, `Legal status: ${legalName(c.legal)}`, W / 2, 506, 16, c.legal >= 50 ? "#ff4040" : "#ff9040", "center");
    text(g, "Esc: quit to title", W / 2, H - 50, 14, "#7aa8c8", "center");
  },
  drawMarket(g, W, H) {
    const y0 = 130, rh = 28, c = G.cmdr, bx = W / 2 + 330;
    panel(g, 30, 100, W - 60, H - 150);
    const cols = [[60, "GOOD", "left"], [W / 2 - 160, "UNIT", "center"], [W / 2 - 60, "PRICE", "right"], [W / 2 + 60, "FOR SALE", "right"], [W / 2 + 180, "IN HOLD", "right"], [W / 2 + 290, "PAID", "right"]];
    for (const [x, n, a] of cols) text(g, n, x, 116, 13, "#7aa8c8", a, FONT, 700);
    GOODS.forEach((gd, i) => {
      const m = G.market.list[i], y = y0 + i * rh, sel = i === this.row, have = c.cargo[gd.id] || 0;
      if (sel) { g.fillStyle = "rgba(58,160,255,0.28)"; g.fillRect(40, y, W - 80, rh - 2); }
      const col = gd.legal ? "#ff9a7a" : "#ffffff";
      text(g, gd.name + (gd.legal ? " *" : ""), 60, y + rh / 2, 17, col);
      text(g, gd.unit, W / 2 - 160, y + rh / 2, 16, "#9ac8e8", "center");
      text(g, U.cr(m.price), W / 2 - 60, y + rh / 2, 17, "#ffd060", "right");
      text(g, m.qty ? `${m.qty}` : "-", W / 2 + 60, y + rh / 2, 17, "#ffffff", "right");
      text(g, have ? `${have}` : "", W / 2 + 180, y + rh / 2, 17, "#60ff90", "right");
      if (have && c.cost[gd.id]) { const pr = m.price - c.cost[gd.id]; text(g, U.cr(c.cost[gd.id]), W / 2 + 290, y + rh / 2, 15, pr > 0 ? "#60ff90" : "#ff8a7a", "right"); }
      if (sel || inRect(I.mouse, 40, y, W - 80, rh)) for (const [k, lbl, w] of [[0, "−", 34], [40, "+", 34], [80, "MAX", 50], [136, "ALL", 50]]) {
        g.fillStyle = "rgba(90,216,255,0.2)"; g.fillRect(bx + k, y + 2, w, rh - 4); g.strokeStyle = "rgba(90,216,255,0.6)"; g.strokeRect(bx + k + 0.5, y + 2.5, w - 1, rh - 5);
        text(g, lbl, bx + k + w / 2, y + rh / 2, 14, "#ffffff", "center", FONT, 700);
      }
    });
    text(g, "→ / + buy · ← / − sell · hold Shift for 10 · Shift+A sells all · click the buttons · * = illegal", W / 2, H - 64, 15, "#7aa8c8", "center");
  },
  drawOutfit(g, W, H) {
    const list = this.outfitList(), y0 = 130, rh = 36;
    panel(g, 30, 100, W - 60, H - 150);
    list.forEach((it, i) => {
      const y = y0 + i * rh, sel = i === this.row;
      if (sel) { g.fillStyle = "rgba(58,160,255,0.28)"; g.fillRect(40, y, W - 80, rh - 2); }
      const col = !it.ok ? "rgba(255,255,255,0.3)" : it.owned ? "#60ff90" : "#ffffff";
      text(g, it.name, 60, y + rh / 2 - 6, 18, col);
      text(g, it.desc, 60, y + rh / 2 + 10, 13, "#7aa8c8");
      text(g, it.ok ? (it.price !== undefined ? `${U.fmt(it.price)} Cr` : "") : `tech ${it.tech} needed`, W - 260, y + rh / 2, 17, it.ok ? "#ffd060" : "#ff8a7a", "right");
      text(g, it.status || "", W - 70, y + rh / 2, 15, "#60ff90", "right");
    });
    text(g, "Enter / click / A buys · ← → picks the laser type · replaced lasers are sold back at half price", W / 2, H - 64, 15, "#7aa8c8", "center");
  },
  drawShipyard(g, W, H) {
    const list = this.shipList(), y0 = 130, rh = 52, c = G.cmdr;
    panel(g, 30, 100, 560, H - 150);
    list.forEach((id, i) => {
      const d = SHIPS[id], y = y0 + i * rh, sel = i === this.row, avail = SHIP_TECH[id] <= sys().tech;
      if (sel) { g.fillStyle = "rgba(58,160,255,0.28)"; g.fillRect(40, y, 540, rh - 4); }
      text(g, d.name + (id === c.ship ? "  (yours)" : ""), 60, y + 16, 19, id === c.ship ? "#60ff90" : avail ? "#ffffff" : "rgba(255,255,255,0.35)");
      text(g, avail ? `${U.fmt(Math.max(0, d.price - shipValue()))} Cr after trade-in` : `tech ${SHIP_TECH[id]} needed`, 60, y + 36, 14, avail ? "#ffd060" : "#ff8a7a");
    });
    text(g, `Trade-in value of your ${shipDef().name}: ${U.fmt(shipValue())} Cr`, 60, H - 70, 15, "#7aa8c8");
    // stats and 3D preview
    const id = list[this.row], d = SHIPS[id];
    panel(g, 610, 100, W - 640, H - 150);
    text(g, d.name.toUpperCase(), 630, 130, 22, "#ffffff", "left", FONT, 700);
    const stats = [["Cargo", `${d.cargo} t`, d.cargo / 140], ["Speed", `${d.speed} m/s`, d.speed / 450], ["Agility", `${d.roll.toFixed(1)}`, d.roll / 3.4], ["Shields", `${d.shields}`, d.shields / 220], ["Energy", `${d.energy}`, d.energy / 270], ["Missiles", `${d.missiles}`, d.missiles / 6], ["Hyperdrive", `${d.fuel} ly`, d.fuel / 10]];
    stats.forEach(([k, v, f], i) => { const y = H - 330 + i * 30; text(g, k, 630, y, 16, "#7aa8c8"); text(g, v, 820, y, 16, "#ffffff", "right"); g.fillStyle = "rgba(90,216,255,0.15)"; g.fillRect(840, y - 5, W - 900, 10); g.fillStyle = "#5ad8ff"; g.fillRect(840, y - 5, (W - 900) * Math.min(1, f), 10); });
    text(g, "Enter / click / A buys · cargo, equipment and lasers move over", 630, H - 70, 14, "#7aa8c8");
    this.previewRect = { x: 610, y: 140, w: W - 640, h: H - 500, id };
  },
  drawSystem(g, W, H) {
    const s = sys();
    panel(g, 30, 100, W - 60, H - 150);
    text(g, s.name.toUpperCase(), 60, 140, 34, "#ffffff", "left", FONT, 900);
    text(g, `${GALAXY_NAMES[s.gi]} · Galaxy ${s.gi + 1}`, 60, 178, 16, "#7aa8c8");
    let y = 220;
    for (const [k, v] of [["Economy", ECONOMY[s.econ]], ["Government", GOV[s.gov]], ["Tech level", s.tech], ["Population", `${s.pop.toFixed(1)} billion ${s.species}`], ["Gross productivity", `${U.fmt(s.prod)} MCr`], ["Average radius", `${U.fmt(s.radius)} km`], ["World type", `${s.ptype[0].toUpperCase() + s.ptype.slice(1)}${s.rings && s.ptype !== "terran" ? ", ringed" : ""}${s.moons ? `, ${s.moons} moon${s.moons > 1 ? "s" : ""}` : ""}`], ["Star", `${s.star.cls}-class`]]) {
      text(g, k, 60, y, 17, "#7aa8c8"); text(g, String(v), 300, y, 17, "#ffffff"); y += 30;
    }
    wrap(g, s.desc, 60, y + 20, Math.min(700, W - 520), 26, 19, "#d8eeff");
    drawPlanetIcon(g, W - 260, 330, 130, s, this.t);
    const danger = ["very dangerous", "dangerous", "risky", "moderate", "safe", "safe", "very safe", "very safe"][s.gov];
    text(g, `Pirate activity: ${danger}`, W - 260, 500, 17, s.gov <= 2 ? "#ff8a7a" : "#60ff90", "center");
  },
  drawCmdr(g, W, H) {
    const c = G.cmdr;
    panel(g, 30, 100, W - 60, H - 150);
    text(g, `COMMANDER ${c.name}`, 60, 140, 28, "#ffffff", "left", FONT, 900);
    let y = 190;
    const mins = Math.floor(c.time / 60);
    for (const [k, v, col] of [["Rating", rankOf(c.killPts)], ["Legal status", legalName(c.legal), c.legal >= 50 ? "#ff4040" : c.legal > 0 ? "#ff9040" : "#60ff90"], ["Credits", `${U.cr(c.credits)} Cr`], ["Score", U.fmt(c.score)], ["Ship", shipDef().name], ["Kills", c.kills], ["Systems visited", c.visited.length], ["Trading profit", `${U.cr(c.profit)} Cr`], ["Flight time", `${Math.floor(mins / 60)} h ${mins % 60} min`]]) {
      text(g, k, 60, y, 17, "#7aa8c8"); text(g, String(v), 290, y, 17, col || "#ffffff"); y += 28;
    }
    text(g, "EQUIPMENT", W / 2, 190, 15, "#7aa8c8", "left", FONT, 700);
    const eq = [];
    if (c.lasers.front) eq.push(`Front: ${LASERS[c.lasers.front].name}`);
    if (c.lasers.rear) eq.push(`Rear: ${LASERS[c.lasers.rear].name}`);
    eq.push(`${c.missiles} missile${c.missiles === 1 ? "" : "s"}`);
    for (const e of EQUIP) if (c.equip[e.id]) eq.push(e.name);
    eq.forEach((s, i) => text(g, s, W / 2, 218 + i * 24, 16, "#ffffff"));
    text(g, "CARGO", W / 2 + 280, 190, 15, "#7aa8c8", "left", FONT, 700);
    const cg = Object.entries(c.cargo);
    if (!cg.length) text(g, "empty", W / 2 + 280, 218, 16, "rgba(255,255,255,0.5)");
    cg.forEach(([id, q], i) => { const gd = GOODS.find((x) => x.id === id); text(g, `${q} ${gd.unit} ${gd.name}`, W / 2 + 280, 218 + i * 24, 16, gd.legal ? "#ff9a7a" : "#ffffff"); });
    for (const [lbl, yy] of [["SAVE BACKUP (S)", H - 150], ["RETIRE (R)", H - 96]]) {
      g.fillStyle = inRect(I.mouse, W - 330, yy, 280, 44) ? "rgba(58,160,255,0.5)" : "rgba(58,160,255,0.22)"; g.fillRect(W - 330, yy, 280, 44);
      g.strokeStyle = "#9ad8ff"; g.strokeRect(W - 330 + 0.5, yy + 0.5, 279, 43);
      text(g, lbl, W - 190, yy + 22, 16, "#ffffff", "center", FONT, 700);
    }
    text(g, "Your career is saved automatically every time you dock.", 60, H - 70, 15, "#7aa8c8");
  },
  // a rotating 3D model of the selected ship in the shipyard
  render3D(world, W, H, scale) {
    if (TABS[this.tab] !== "SHIPYARD" || !this.previewRect) return;
    const R = this.previewRect;
    if (!this.pv || this.pv.id !== R.id) {
      const scene = new THREE.Scene();
      scene.environment = world.scene.environment; scene.environmentIntensity = 0.8;
      scene.add(new THREE.AmbientLight(0x8090b0, 1.2));
      const l = new THREE.DirectionalLight(0xffffff, 3); l.position.set(3, 4, 5); scene.add(l);
      const l2 = new THREE.DirectionalLight(0x6aa0ff, 1.5); l2.position.set(-4, -1, -3); scene.add(l2);
      const m = buildShip(R.id); scene.add(m);
      const cam = new THREE.PerspectiveCamera(35, 1, 1, 5000);
      this.pv = { id: R.id, scene, cam, m };
    }
    const pv = this.pv, d = SHIPS[R.id].size;
    pv.m.rotation.y = this.t * 0.6; pv.m.rotation.x = 0.35;
    pv.cam.aspect = R.w / R.h; pv.cam.updateProjectionMatrix();
    pv.cam.position.set(0, d * 0.55, d * 1.75); pv.cam.lookAt(0, 0, 0);
    const r = world.renderer, dpr = r.getPixelRatio();
    const x = R.x * scale, y = (H - R.y - R.h) * scale, w = R.w * scale, h = R.h * scale;
    r.setScissorTest(true); r.setScissor(x / dpr, y / dpr, w / dpr, h / dpr); r.setViewport(x / dpr, y / dpr, w / dpr, h / dpr);
    r.autoClear = false; r.clearDepth();
    r.render(pv.scene, pv.cam);
    r.setScissorTest(false); r.setViewport(0, 0, r.domElement.width / dpr, r.domElement.height / dpr); r.autoClear = true;
  },
  uses3D: true,
};

/* ---------- Flight ---------- */
States.flight = {
  t: 0, paused: false, map: false,
  pauseMenu: makeMenu([
    { label: "RESUME", action: () => { States.flight.paused = false; } },
    { label: "CONTROLS", action: () => M.setState("controls", { back: "flight" }) },
    { label: () => `SOUND: ${A.muted ? "OFF" : "ON"}`, action: () => A.toggleMute() },
    { label: () => `INVERT PITCH: ${I.invert ? "ON" : "OFF"}`, action: () => { I.invert = !I.invert; Store.set("invert", I.invert); } },
    { label: "QUIT TO TITLE (unsaved progress is lost)", action: () => { States.flight.paused = false; M.setState("title"); } },
  ], 260, 520),
  enter(arg) { if (arg && arg.resume) { this.paused = true; return; } this.t = 0; this.paused = false; this.map = false; XA.Main.setCursor(false); },
  pause() { if (!this.paused && M.flight.mode === "fly" && !M.flight.dead) { this.paused = true; this.pauseMenu.sel = 0; XA.Main.setCursor(true); A.setEngine(-1); } },
  input(dt, W, H) {
    if (this.paused) { if ((I.key("Escape") || I.key("KeyP") || I.padHit(9)) && this.t > 0.1) { this.paused = false; XA.Main.setCursor(false); return; } menuInput(this.pauseMenu, W); return; }
    if (I.key("Tab") || I.padHit(8)) { this.map = !this.map; if (this.map) Map.reset(); A.sfx("menuMove"); XA.Main.setCursor(this.map); }
    if (this.map) { Map.input(dt, W, H); if (I.key("Escape") || I.padHit(1)) { this.map = false; XA.Main.setCursor(false); } return; }
    if (I.key("Escape") || I.key("KeyP") || I.padHit(9)) this.pause();
  },
  update(dt) {
    if (this.paused) return;
    this.t += dt;
    G.cmdr.time += dt;
    if (this.map) {
      // keep flying straight while the map is open
      const savedKeys = new Set(I.keys), savedPr = new Set(I.pressed), pad = I.pad.connected, ld = I.lastDevice, pp = new Set(I.pad.pressed), mb = I.mouse.buttons;
      I.keys.clear(); I.pressed.clear(); I.pad.connected = false; I.pad.pressed.clear(); I.lastDevice = "keyboard"; I.mouse.buttons = 0;
      const mc = [I.mouse.clicked, I.mouse.rclicked, I.mouse.mclicked, I.mouse.wheel]; I.mouse.clicked = I.mouse.rclicked = I.mouse.mclicked = false; I.mouse.wheel = 0;
      M.flight.update(dt);
      for (const k of savedKeys) I.keys.add(k); for (const k of savedPr) I.pressed.add(k); for (const k of pp) I.pad.pressed.add(k);
      I.pad.connected = pad; I.lastDevice = ld; I.mouse.buttons = mb; [I.mouse.clicked, I.mouse.rclicked, I.mouse.mclicked, I.mouse.wheel] = mc;
    } else M.flight.update(dt);
    updateMessages(dt);
  },
  draw(g, W, H) {
    drawHUD(g, W, H, M.flight, this.t);
    if (this.map) { g.fillStyle = "rgba(2,6,14,0.6)"; g.fillRect(0, 0, W, H); Map.draw(g, W, H, this.t, 70); glowText(g, "STAR MAP · Tab closes · then press H to jump", W / 2, 36, 18, "#9ad8ff"); }
    if (this.paused) { g.fillStyle = "rgba(2,6,14,0.7)"; g.fillRect(0, 0, W, H); glowText(g, "PAUSED", W / 2, 180, 50, "#9ad8ff"); menuDraw(g, this.pauseMenu, W, performance.now() / 1000); }
  },
  uses3D: true,
};

/* ---------- Game over ---------- */
States.gameover = {
  t: 0, reason: "",
  menu: makeMenu([
    { label: "RELOAD LAST DOCKING SAVE", hidden: () => !hasSave("career"), action: () => { if (load("career")) M.dockAt(true); } },
    { label: "END CAREER (HIGHSCORE)", action: () => M.endCareer("died") },
  ], 470, 460),
  enter(arg) { this.t = 0; this.reason = arg || ""; XA.Main.setCursor(true); A.playSong("void"); },
  input(dt, W) { if (this.t > 1) menuInput(this.menu, W); },
  update(dt) { this.t += dt; const w = M.world; if (w.camera.parent === w.scene) w.camera.rotateY(dt * 0.02); },
  draw(g, W, H) {
    g.fillStyle = "rgba(10,0,0,0.5)"; g.fillRect(0, 0, W, H);
    glowText(g, "GAME OVER", W / 2, 170, 64, "#ff5050");
    const c = G.cmdr;
    text(g, `Commander ${c.name} · ${rankOf(c.killPts)} · Score ${U.fmt(c.score)}`, W / 2, 250, 20, "#ffffff", "center");
    text(g, `${c.kills} kills · ${c.visited.length} systems visited · ${U.cr(c.credits)} Cr`, W / 2, 285, 18, "#d8eeff", "center");
    text(g, "Reloading continues from the last time you docked (with the score you had then).", W / 2, 420, 16, "#7aa8c8", "center");
    if (this.t > 1) menuDraw(g, this.menu, W, this.t);
  },
  uses3D: true,
};

/* ---------- Highscores ---------- */
States.highscores = {
  t: 0, mark: -1,
  enter(arg) { this.t = 0; this.mark = arg && arg.mark !== undefined ? arg.mark : -1; A.playSong("title"); XA.Main.setCursor(true); },
  input() { if (this.t > 0.4 && (I.hit("confirm") || I.hit("back") || I.mouse.clicked)) { A.sfx("menuBack"); M.setState("title"); } },
  update(dt) { this.t += dt; States.title.update(dt); },
  draw(g, W, H) {
    g.fillStyle = "rgba(2,4,10,0.6)"; g.fillRect(0, 0, W, H);
    glowText(g, "HALL OF LEGENDS", W / 2, 80, 44, "#9ad8ff");
    panel(g, W / 2 - 420, 130, 840, 500);
    text(g, "RANK", W / 2 - 360, 160, 14, "#7aa8c8", "center", FONT, 700); text(g, "COMMANDER", W / 2 - 300, 160, 14, "#7aa8c8", "left", FONT, 700); text(g, "RATING", W / 2 + 90, 160, 14, "#7aa8c8", "center", FONT, 700); text(g, "SCORE", W / 2 + 380, 160, 14, "#7aa8c8", "right", FONT, 700);
    HS.list().forEach((e, i) => {
      const y = 200 + i * 42, mk = i === this.mark && Math.floor(this.t * 4) % 2 === 0, col = mk ? "#ffd040" : i === 0 ? "#9ad8ff" : "#ffffff";
      text(g, `${i + 1}.`, W / 2 - 360, y, 20, col, "center", FONT, 700);
      text(g, e.name, W / 2 - 300, y, 22, col, "left", FONT, 700);
      text(g, e.rank || "", W / 2 + 90, y, 17, col, "center");
      text(g, U.fmt(e.score), W / 2 + 380, y, 22, col, "right", FONT, 700);
    });
    text(g, "Press any button", W / 2, H - 40, 16, "#7aa8c8", "center");
  },
  uses3D: true,
};

/* ---------- Name entry for the highscore ---------- */
const KEYS = ["ABCDEFGHIJ", "KLMNOPQRST", "UVWXYZ0123", "456789.-! "];
States.nameentry = {
  t: 0, name: "", sel: 0, rank: 0,
  enter() { this.t = 0; this.name = G.cmdr.name.slice(0, 12); this.sel = 0; this.rank = HS.rank(G.cmdr.score); XA.Main.setCursor(true); },
  cells(W) {
    const out = [];
    KEYS.forEach((row, rr) => [...row].forEach((ch, c) => out.push({ ch, x: W / 2 - 330 + c * 66, y: 320 + rr * 62, w: 58, h: 52 })));
    out.push({ ch: "DEL", x: W / 2 - 330, y: 568, w: 190, h: 52 }); out.push({ ch: "SAVE", x: W / 2 - 124, y: 568, w: 250, h: 52 }); out.push({ ch: "SKIP", x: W / 2 + 142, y: 568, w: 190, h: 52 });
    return out;
  },
  press(ch) {
    if (ch === "DEL") { this.name = this.name.slice(0, -1); A.sfx("menuBack"); }
    else if (ch === "SAVE") this.save();
    else if (ch === "SKIP") { A.sfx("menuBack"); M.setState("highscores"); }
    else if (this.name.length < 12) { this.name += ch; A.sfx("menuMove"); }
  },
  save() {
    const name = this.name.trim() || G.cmdr.name;
    const pos = HS.add({ name, score: G.cmdr.score, rank: rankOf(G.cmdr.killPts) });
    A.sfx("menuOk"); M.setState("highscores", { mark: pos });
  },
  input(dt, W) {
    for (const ch of I.typed) { const c = ch.toUpperCase(); if (/^[A-Z0-9 .\-!]$/.test(c) && this.name.length < 12) { this.name += c; A.sfx("menuMove"); } }
    if (I.pressed.has("Backspace")) { this.name = this.name.slice(0, -1); A.sfx("menuBack"); }
    if (I.pressed.has("Enter") || I.pressed.has("NumpadEnter")) { this.save(); return; }
    if (I.pressed.has("Escape")) { A.sfx("menuBack"); M.setState("highscores"); return; }
    const cells = this.cells(W);
    const nav = (d) => I.rep.has("Arrow" + d[0].toUpperCase() + d.slice(1)) || I.pad.dir.has(d) || I.pad.pressed.has({ up: 12, down: 13, left: 14, right: 15 }[d]);
    const rowOf = (i) => (i >= 40 ? 4 : Math.floor(i / 10)), colOf = (i) => (i >= 40 ? i - 40 : i % 10);
    let s = this.sel;
    if (nav("right")) s = s >= 40 ? 40 + ((s - 40 + 1) % 3) : rowOf(s) * 10 + ((colOf(s) + 1) % 10);
    if (nav("left")) s = s >= 40 ? 40 + ((s - 40 + 2) % 3) : rowOf(s) * 10 + ((colOf(s) + 9) % 10);
    if (nav("down")) s = s >= 40 ? Math.min(9, (s - 40) * 4) : s >= 30 ? 40 + Math.min(2, Math.floor(colOf(s) / 3.4)) : s + 10;
    if (nav("up")) s = s >= 40 ? 30 + (s - 40) * 4 : s < 10 ? 40 + Math.min(2, Math.floor(s / 3.4)) : s - 10;
    if (s !== this.sel) { this.sel = s; A.sfx("menuMove"); }
    let hi = -1; cells.forEach((c, i) => { if (inRect(I.mouse, c.x, c.y, c.w, c.h)) hi = i; });
    if (I.mouse.moved && hi >= 0) this.sel = hi;
    if (I.pad.pressed.has(0) || (I.mouse.clicked && hi >= 0)) this.press(cells[this.sel].ch);
    if (I.pad.pressed.has(1)) this.press("DEL");
    if (I.pad.pressed.has(9)) this.save();
  },
  update(dt) { this.t += dt; },
  draw(g, W, H) {
    g.fillStyle = "rgba(2,4,10,0.75)"; g.fillRect(0, 0, W, H);
    glowText(g, "NEW HIGHSCORE", W / 2, 80, 44, "#ffd040");
    text(g, `Rank ${this.rank + 1} with ${U.fmt(G.cmdr.score)} points`, W / 2, 135, 22, "#ffffff", "center");
    text(g, "Enter your name for the Hall of Legends – or skip it.", W / 2, 168, 18, "#9ac8e8", "center");
    panel(g, W / 2 - 260, 200, 520, 80);
    text(g, this.name + (this.name.length < 12 && Math.floor(this.t * 2.5) % 2 ? "_" : " "), W / 2, 242, 36, "#ffffff", "center", FONT, 700);
    this.cells(W).forEach((c, i) => {
      const sel = i === this.sel;
      g.fillStyle = sel ? "rgba(58,160,255,0.7)" : c.ch.length > 1 ? "rgba(58,160,255,0.3)" : "rgba(6,14,30,0.85)";
      g.fillRect(c.x, c.y, c.w, c.h);
      g.strokeStyle = sel ? "#ffffff" : "rgba(90,216,255,0.4)"; g.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);
      text(g, c.ch === " " ? "␣" : c.ch, c.x + c.w / 2, c.y + c.h / 2 + 1, c.ch.length > 1 ? 16 : 22, "#ffffff", "center", FONT, 700);
    });
    text(g, "Type with the keyboard · Enter saves · Esc skips · Gamepad: A types, B deletes, Start saves", W / 2, H - 30, 16, "#7aa8c8", "center");
  },
  uses3D: true,
};

/* ---------- Options ---------- */
States.options = {
  t: 0, back: "title",
  menu: makeMenu([
    { label: () => `MUSIC  ◂ ${Math.round(A.musicVol * 10)} ▸`, adjust: (d) => { A.setMusicVol(U.clamp(Math.round(A.musicVol * 10 + d) / 10, 0, 1)); A.sfx("menuMove"); } },
    { label: () => `SOUND  ◂ ${Math.round(A.sfxVol * 10)} ▸`, adjust: (d) => { A.setSfxVol(U.clamp(Math.round(A.sfxVol * 10 + d) / 10, 0, 1)); A.sfx("pulse"); } },
    { label: () => `INVERT PITCH  ◂ ${I.invert ? "ON" : "OFF"} ▸`, adjust: () => { I.invert = !I.invert; Store.set("invert", I.invert); A.sfx("menuMove"); } },
    { label: () => `GRAPHICS  ◂ ${["FAST", "NICE", "ULTRA"][M.quality]} ▸`, adjust: (d) => { M.setQuality((M.quality + d + 3) % 3); A.sfx("menuMove"); } },
    { label: "TOGGLE FULLSCREEN", action: () => XA.Main.toggleFullscreen() },
    { label: "BACK", action: () => States.options.leave() },
  ], 200),
  enter(arg) { this.t = 0; this.back = (arg && arg.back) || "title"; this.menu.sel = 0; },
  leave() { if (this.back === "flight") M.setState("flight", { resume: true }); else M.setState(this.back); },
  input(dt, W) { if (I.hit("back")) { A.sfx("menuBack"); this.leave(); return; } menuInput(this.menu, W); },
  update(dt) { this.t += dt; if (this.back === "title") States.title.update(dt); },
  draw(g, W, H) {
    g.fillStyle = "rgba(2,4,10,0.65)"; g.fillRect(0, 0, W, H);
    glowText(g, "OPTIONS", W / 2, 120, 44, "#9ad8ff");
    menuDraw(g, this.menu, W, this.t);
    text(g, "Left / right changes a value · Esc goes back", W / 2, H - 40, 16, "#7aa8c8", "center");
  },
  uses3D: true,
};

/* ---------- Controls ---------- */
States.controls = {
  t: 0, back: "title",
  enter(arg) { this.t = 0; this.back = (arg && arg.back) || "title"; },
  input() { if (this.t > 0.2 && (I.hit("back") || I.hit("confirm") || I.mouse.clicked || I.padHit(0))) { A.sfx("menuBack"); if (this.back === "flight") M.setState("flight", { resume: true }); else M.setState(this.back); } },
  update(dt) { this.t += dt; if (this.back === "title") States.title.update(dt); },
  draw(g, W, H) {
    g.fillStyle = "rgba(2,4,10,0.82)"; g.fillRect(0, 0, W, H);
    glowText(g, "CONTROLS", W / 2, 50, 36, "#9ad8ff");
    const colW = Math.min(420, (W - 80) / 3), x0 = (W - colW * 3) / 2;
    const cols = [
      ["KEYBOARD", [["W / ↑, S / ↓", "dive / climb"], ["A / ←, D / →", "roll"], ["Q / E", "yaw"], ["Shift / X", "faster / slower"], ["Space", "fire laser"], ["T / M", "target lock / missile"], ["Z", "E.C.M."], ["J", "jump drive (in system)"], ["Tab", "star map"], ["H / G", "hyperspace / galactic jump"], ["L", "docking computer"], ["B", "energy bomb"], ["Delete", "escape pod"], ["1–4, 5 / C", "views, chase camera"], ["Esc / P", "pause"], ["F / N", "fullscreen / mute"]]],
      ["MOUSE", [["cursor offset", "steers (pitch, roll, yaw)"], ["left button", "fire laser"], ["right button", "lock + fire missile"], ["middle button", "cycle targets"], ["wheel", "throttle"], ["", ""], ["IN MENUS", ""], ["click", "select, buy, sell"], ["wheel", "zoom the star map"]]],
      ["GAMEPAD", [["left stick", "pitch and roll"], ["right stick", "yaw"], ["RT / LT", "faster / slower"], ["A", "fire laser"], ["B / X", "missile / target"], ["Y", "jump drive"], ["LB", "E.C.M."], ["RB", "chase camera"], ["D-pad ↑", "hyperspace"], ["D-pad ↓", "docking computer"], ["D-pad ←", "energy bomb"], ["D-pad →", "rear view"], ["Back", "star map"], ["Start", "pause"]]],
    ];
    cols.forEach(([title, rows], k) => {
      const x = x0 + k * colW;
      panel(g, x + 8, 85, colW - 16, H - 175);
      text(g, title, x + 24, 108, 15, CY, "left", FONT, 700);
      rows.forEach(([a, b], i) => { text(g, a, x + 24, 140 + i * 27, 16, "#ffd060"); text(g, b, x + colW - 26, 140 + i * 27, 16, "#ffffff", "right"); });
    });
    wrap(g, "Docking by hand: fly to the station, line up with the glowing slot on the hub, roll with the station's spin and fly in slowly. Or buy a docking computer. Hyperspace: open the star map (Tab), pick a system in range, close the map and press H. Fly away from the station before using the jump drive (J).", 40, H - 72, W - 80, 22, 16, "#bfe6ff");
  },
  uses3D: true,
};
