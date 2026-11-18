/* STARHAUL: the cockpit HUD drawn on a 2D canvas over the 3D view – 3D scanner, gauges, compass, target brackets,
   messages, countdowns and warnings. */
import * as THREE from "three";
import { G, sys, shipDef, cargoUsed, cargoCap, fuelMax } from "./state.js";
import { galaxy, dist, legalName, rankOf } from "./galaxy.js";
import { LASERS } from "./ships.js";
const { U } = window.XA;
const I = window.XA.Input;

export const FONT = "Orbitron, 'Segoe UI', Arial, sans-serif";
export const BODY = "Rajdhani, 'Segoe UI', Arial, sans-serif";
export const CY = "#5ad8ff", CY2 = "rgba(90,216,255,";

export function text(g, s, x, y, size, color = "#fff", align = "left", font = BODY, weight = 600) {
  g.font = `${weight} ${size}px ${font}`; g.textAlign = align; g.textBaseline = "middle";
  g.fillStyle = color; g.fillText(s, x, y);
}
// a cheap glow (canvas shadowBlur is far too slow for a HUD): two soft strokes under the text
export function glowText(g, s, x, y, size, color, align = "center", font = FONT) {
  g.save();
  g.font = `700 ${size}px ${font}`; g.textAlign = align; g.textBaseline = "middle"; g.lineJoin = "round";
  g.strokeStyle = color;
  g.globalAlpha *= 0.12; g.lineWidth = size * 0.55; g.strokeText(s, x, y);
  g.globalAlpha /= 0.12; g.globalAlpha *= 0.22; g.lineWidth = size * 0.25; g.strokeText(s, x, y);
  g.globalAlpha /= 0.22;
  g.fillStyle = color; g.fillText(s, x, y);
  g.restore();
}
function bar(g, x, y, w, h, v, col, label, warn) {
  g.fillStyle = "rgba(10,20,40,0.7)"; g.fillRect(x, y, w, h);
  const blink = warn && v < 0.25 && Math.floor(performance.now() / 250) % 2;
  g.fillStyle = blink ? "#ff4040" : col; g.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * U.clamp(v, 0, 1)), h - 2);
  g.strokeStyle = CY2 + "0.5)"; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  text(g, label, x - 8, y + h / 2 + 1, 13, CY, "right", FONT, 700);
}
const ROLE_COL = { pirate: "#ff5050", alien: "#60ff90", police: "#6aa0ff", trader: "#ffe060", hunter: "#ff9a40", rock: "#b0a090", cargo: "#ffb040", missile: "#ffffff" };
const roleCol = (e) => (e.hostile && e.role !== "police" ? "#ff5050" : ROLE_COL[e.role] || "#fff");

const _v = new THREE.Vector3();
export function drawHUD(g, W, H, F, t) {
  const p = F.p, c = G.cmdr, cam = F.w.camera;
  if (!p) return;
  const dead = !!F.dead, pod = !!F.pod;
  // damage flash and heat glow
  if (p.flash > 0) { const gr = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8); gr.addColorStop(0, "rgba(255,0,0,0)"); gr.addColorStop(1, `rgba(255,30,10,${p.flash * 0.6})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  if (p.cabinT > 60) { g.fillStyle = `rgba(255,120,30,${Math.min(0.35, (p.cabinT - 60) / 400)})`; g.fillRect(0, 0, W, H); }
  if (F.bombFlash > 0) { F.bombFlash -= 1 / 60; g.fillStyle = `rgba(255,255,255,${F.bombFlash})`; g.fillRect(0, 0, W, H); }
  if (dead || pod || F.mode === "jump") { drawMessages(g, W, H); if (F.mode === "jump") glowText(g, "HYPERSPACE", W / 2, H * 0.18, 30, CY); return; }

  // target brackets on ships in view
  for (const e of F.ents) {
    if (!e.alive) continue;
    const d = e.pos.distanceTo(F.player.position);
    if (d > 16000) continue;
    _v.copy(e.pos).project(cam);
    if (_v.z > 1 || Math.abs(_v.x) > 1.1 || Math.abs(_v.y) > 1.1) continue;
    const x = (_v.x + 1) / 2 * W, y = (1 - _v.y) / 2 * H;
    const sz = U.clamp((e.r * H) / (d * 0.9) , 10, 120);
    const col = roleCol(e), locked = p.lock === e;
    g.strokeStyle = col; g.lineWidth = locked ? 2.5 : 1.5; g.globalAlpha = locked ? 1 : 0.75;
    const k = sz * 0.35;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { g.beginPath(); g.moveTo(x + sx * sz, y + sy * sz - sy * k); g.lineTo(x + sx * sz, y + sy * sz); g.lineTo(x + sx * sz - sx * k, y + sy * sz); g.stroke(); }
    if (locked) { g.beginPath(); g.moveTo(x, y - sz - 12); g.lineTo(x + 8, y - sz - 4); g.lineTo(x - 8, y - sz - 4); g.closePath(); g.fillStyle = "#ff4040"; g.fill(); }
    if (locked || d < 4000) { text(g, e.def.name, x + sz + 6, y - 8, 14, col); text(g, `${(d / 1000).toFixed(1)} km`, x + sz + 6, y + 8, 13, col); }
    // shield/energy bar for the locked target
    if (locked && e.role !== "cargo") { const v = (e.energy + e.shields) / (e.eMax + e.def.shields || 1); g.fillStyle = "rgba(0,0,0,0.5)"; g.fillRect(x - sz, y + sz + 6, sz * 2, 4); g.fillStyle = col; g.fillRect(x - sz, y + sz + 6, sz * 2 * U.clamp(v, 0, 1), 4); }
    g.globalAlpha = 1;
  }
  // station marker
  const st = F.S.station.position; _v.copy(st).project(cam);
  if (_v.z < 1 && Math.abs(_v.x) < 1 && Math.abs(_v.y) < 1) { const x = (_v.x + 1) / 2 * W, y = (1 - _v.y) / 2 * H, d = st.distanceTo(F.player.position); g.strokeStyle = "#ffffff"; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 14, 0, U.TAU); g.stroke(); text(g, `STATION ${(d / 1000).toFixed(1)} km`, x + 20, y, 14, "#ffffff"); }

  // reticle
  if (F.view !== 4) {
    const cx = W / 2, cy = H / 2, laser = F.view === 1 ? c.lasers.rear : F.view === 0 ? c.lasers.front : null;
    g.strokeStyle = laser ? CY : "rgba(90,216,255,0.35)"; g.lineWidth = 1.5;
    for (const a of [0, 1, 2, 3]) { const ang = a * Math.PI / 2; g.beginPath(); g.moveTo(cx + Math.cos(ang) * 10, cy + Math.sin(ang) * 10); g.lineTo(cx + Math.cos(ang) * 26, cy + Math.sin(ang) * 26); g.stroke(); }
    g.beginPath(); g.arc(cx, cy, 2, 0, U.TAU); g.fillStyle = CY; g.fill();
    if (F.view !== 0) glowText(g, ["", "REAR VIEW", "LEFT VIEW", "RIGHT VIEW"][F.view], cx, 70, 18, CY);
  }
  // mouse steering indicator
  if (I.lastDevice === "mouse" && I.mouse.inside) { g.strokeStyle = "rgba(255,220,120,0.8)"; g.lineWidth = 1.5; g.beginPath(); g.arc(I.mouse.x, I.mouse.y, 8, 0, U.TAU); g.stroke(); g.beginPath(); g.arc(W / 2, H / 2, H * 0.05 * 0.5 / 0.5 * 0.5, 0, U.TAU); g.strokeStyle = "rgba(255,220,120,0.25)"; g.stroke(); }

  // console
  const bw = Math.min(W, 1280), bx = (W - bw) / 2, by = H - 170;
  const gr = g.createLinearGradient(0, by, 0, H); gr.addColorStop(0, "rgba(5,12,25,0)"); gr.addColorStop(0.25, "rgba(5,12,25,0.65)"); gr.addColorStop(1, "rgba(5,12,25,0.9)");
  g.fillStyle = gr; g.fillRect(bx, by, bw, 170);
  // gauges left
  const lx = bx + 70, gw = 170;
  bar(g, lx, by + 40, gw, 12, p.shF / p.shMax, "#40a0ff", "FS");
  bar(g, lx, by + 58, gw, 12, p.shA / p.shMax, "#40a0ff", "AS");
  bar(g, lx, by + 76, gw, 12, c.fuel / fuelMax(), "#ffd040", "FU");
  bar(g, lx, by + 94, gw, 12, (p.cabinT - 20) / 180, "#ff7040", "CT");
  bar(g, lx, by + 112, gw, 12, p.laserT / 100, p.overheat ? "#ff2020" : "#ff9040", "LT");
  bar(g, lx, by + 130, gw, 12, Math.min(1, p.alt / (F.S.R * 2)), "#60ff90", "AL", true);
  // missiles
  for (let i = 0; i < shipDef().missiles; i++) { const x = lx + i * 22, y = by + 152; g.fillStyle = i < c.missiles ? (p.lock && i === c.missiles - 1 ? "#ff4040" : "#60ff90") : "rgba(90,216,255,0.15)"; g.fillRect(x, y, 16, 8); }
  // gauges right
  const rx = bx + bw - 70 - gw;
  bar(g, rx, by + 40, gw, 12, p.speed / p.max, "#60ff90", "SP");
  rateBar(g, rx, by + 58, gw, 12, p.rate.r, "RL");
  rateBar(g, rx, by + 76, gw, 12, p.rate.p, "DC");
  for (let k = 0; k < 4; k++) bar(g, rx, by + 94 + k * 18, gw, 12, U.clamp((p.energy / p.eMax) * 4 - (3 - k), 0, 1), "#40ff90", `${4 - k}`, k === 3);
  // scanner
  const scx = W / 2, scy = by + 98, srw = 210, srh = 64;
  g.save();
  g.fillStyle = "rgba(10,40,60,0.45)"; g.beginPath(); g.ellipse(scx, scy, srw, srh, 0, 0, U.TAU); g.fill();
  g.strokeStyle = CY2 + "0.6)"; g.lineWidth = 1.5; g.stroke();
  g.strokeStyle = CY2 + "0.25)"; g.lineWidth = 1;
  g.beginPath(); g.ellipse(scx, scy, srw * 0.5, srh * 0.5, 0, 0, U.TAU); g.stroke();
  g.beginPath(); g.moveTo(scx - srw, scy); g.lineTo(scx + srw, scy); g.moveTo(scx, scy - srh); g.lineTo(scx, scy + srh); g.stroke();
  g.beginPath(); g.moveTo(scx, scy); g.lineTo(scx - srw * 0.7, scy - srh * 0.7); g.moveTo(scx, scy); g.lineTo(scx + srw * 0.7, scy - srh * 0.7); g.stroke();
  const R = 16000;
  for (const o of F.scanner()) {
    const kx = o.x / R, kz = o.z / R;
    if (kx * kx + kz * kz > 1.2 && !o.station) continue;
    const sx = scx + U.clamp(kx, -1.1, 1.1) * srw, sy = scy + U.clamp(kz, -1.1, 1.1) * srh, hy = U.clamp(o.y / R, -1.4, 1.4) * srh * 1.3;
    const col = o.station ? "#ffffff" : roleCol(o.e);
    g.strokeStyle = col; g.lineWidth = 1.5; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx, sy - hy); g.stroke();
    g.fillStyle = col;
    if (o.station) { g.fillRect(sx - 5, sy - hy - 5, 10, 10); }
    else if (o.e.role === "missile") { g.fillRect(sx - 1.5, sy - hy - 1.5, 3, 3); }
    else { g.fillRect(sx - 4, sy - hy - 2, 8, 4); if (p.lock === o.e) { g.strokeStyle = "#ff4040"; g.strokeRect(sx - 7, sy - hy - 5, 14, 10); } }
  }
  g.restore();
  // compass
  const cp = F.compass(), ccx = scx + srw + 52, ccy = by + 60;
  g.strokeStyle = CY2 + "0.7)"; g.lineWidth = 1.5; g.beginPath(); g.arc(ccx, ccy, 22, 0, U.TAU); g.stroke();
  const dx = U.clamp(cp.x, -1, 1) * 18, dy = U.clamp(-cp.y, -1, 1) * 18;
  g.beginPath(); g.arc(ccx + dx, ccy + dy, 4, 0, U.TAU);
  if (cp.z < 0) { g.fillStyle = cp.station ? "#ffffff" : "#ffd040"; g.fill(); } else { g.strokeStyle = cp.station ? "#ffffff" : "#ffd040"; g.stroke(); }
  text(g, cp.station ? "STN" : "PLN", ccx, ccy + 34, 12, CY, "center", FONT, 700);
  // status indicators
  const lbl = (s, x, y, on, col = "#60ff90") => { g.fillStyle = on ? col : "rgba(90,216,255,0.15)"; g.font = `700 12px ${FONT}`; g.textAlign = "center"; g.fillText(s, x, y); };
  const sx0 = scx - srw - 52;
  lbl("JUMP", sx0, by + 40, p.jump, "#6aa0ff");
  lbl("ECM", sx0, by + 58, !!c.equip.ecm, "#60ff90");
  lbl("DOCK", sx0, by + 76, !!p.dc, "#ffd040");
  lbl("SAFE", sx0, by + 94, F.player.position.distanceTo(F.S.station.position) < 30000, "#60ff90");
  lbl("BOMB", sx0, by + 112, !!c.equip.bomb, "#ff9040");
  lbl(legalName(c.legal).toUpperCase(), sx0, by + 130, c.legal > 0, c.legal >= 50 ? "#ff4040" : "#ff9040");
  // top line
  const s = sys();
  text(g, `${s.name.toUpperCase()}`, 20, 22, 20, "#ffffff", "left", FONT, 700);
  text(g, `${Math.round(p.jump ? p.max * 26 : p.speed)} m/s · ${rankOf(c.killPts)}`, 20, 46, 15, CY);
  const tg = c.target >= 0 && c.target !== c.si ? galaxy(c.gi)[c.target] : null;
  text(g, tg ? `→ ${tg.name}  ${dist(s, tg).toFixed(1)} ly` : "No destination (Tab)", W - 20, 22, 16, tg ? "#ffd040" : "rgba(255,255,255,0.5)", "right", FONT, 700);
  text(g, `Fuel ${c.fuel.toFixed(1)} ly · Cargo ${cargoUsed()}/${cargoCap()} t`, W - 20, 46, 15, CY, "right");
  if (G.cheat) { g.fillStyle = "#ffd040"; g.beginPath(); g.arc(W - 12, H - 12, 4, 0, U.TAU); g.fill(); }
  // countdowns and warnings
  if (p.hyper) glowText(g, `${p.hyper.galactic ? "GALACTIC JUMP" : "HYPERSPACE"} ${Math.ceil(p.hyper.t)}`, W / 2, H * 0.28, 40, "#ffd040");
  if (p.dc) glowText(g, "DOCKING COMPUTER", W / 2, H * 0.2, 22, "#60ff90");
  if (p.alt < F.S.R * 0.05 && Math.floor(t * 3) % 2) glowText(g, "ALTITUDE WARNING", W / 2, H * 0.36, 26, "#ff4040");
  if (p.energy < p.eMax * 0.25 && Math.floor(t * 3) % 2) glowText(g, "ENERGY LOW", W / 2, H * 0.4, 24, "#ff4040");
  drawMessages(g, W, H);
}
function rateBar(g, x, y, w, h, v, label) {
  g.fillStyle = "rgba(10,20,40,0.7)"; g.fillRect(x, y, w, h);
  g.strokeStyle = CY2 + "0.5)"; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  g.fillStyle = "rgba(90,216,255,0.3)"; g.fillRect(x + w / 2 - 0.5, y, 1, h);
  g.fillStyle = "#ffd040"; g.fillRect(x + w / 2 + v * (w / 2 - 4) - 3, y + 1, 6, h - 2);
  text(g, label, x - 8, y + h / 2 + 1, 13, CY, "right", FONT, 700);
}
export function drawMessages(g, W, H) {
  const list = G.msgs;
  list.forEach((m, i) => {
    const a = Math.min(1, (m.dur - m.t) * 2, m.t * 8);
    g.globalAlpha = Math.max(0, a);
    glowText(g, m.text, W / 2, 110 + i * 30, 20, m.color, "center", BODY);
    g.globalAlpha = 1;
  });
}
export function updateMessages(dt) { for (const m of G.msgs) m.t += dt; G.msgs = G.msgs.filter((m) => m.t < m.dur); }
