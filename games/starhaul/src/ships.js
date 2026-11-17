/* STARHAUL: ship classes, equipment and the procedural 3D models (ships, station, asteroids, canisters, missiles).
   All designs and names are original. Models face -Z (like a camera), +Y is up. */
import * as THREE from "three";
const { U } = window.XA;

/* ---------- Equipment ---------- */
export const LASERS = {
  pulse: { name: "Pulse Laser", dmg: 9, cool: 0.24, heat: 4.5, color: 0xff3030, snd: "pulse", price: 400, tech: 1 },
  beam: { name: "Beam Laser", dmg: 7, cool: 0.11, heat: 3.0, color: 0xffd040, snd: "beam", price: 1000, tech: 4 },
  military: { name: "Military Laser", dmg: 11, cool: 0.1, heat: 3.2, color: 0x40ff90, snd: "military", price: 6000, tech: 10 },
  mining: { name: "Mining Laser", dmg: 15, cool: 0.45, heat: 6.5, color: 0x40c8ff, snd: "mining", price: 800, tech: 4, mining: true },
};
export const EQUIP = [
  { id: "fuel", name: "Fuel (refill)", tech: 1, desc: "Fills the tanks. 2 Cr per light year." },
  { id: "missile", name: "Homing Missile", price: 30, tech: 1, desc: "Lock a target with T and launch with M." },
  { id: "laser_f", name: "Front Laser", tech: 1, laser: "front", desc: "Choose the type with left / right." },
  { id: "laser_r", name: "Rear Laser", tech: 3, laser: "rear", desc: "Fires when you look backwards (view 2)." },
  { id: "bay", name: "Large Cargo Bay", price: 400, tech: 1, desc: "Adds 50 % to the cargo capacity." },
  { id: "ecm", name: "E.C.M. System", price: 600, tech: 2, desc: "Destroys all missiles in range (key Z)." },
  { id: "scoop", name: "Fuel Scoops", price: 525, tech: 5, desc: "Scoop cargo canisters and skim fuel from stars." },
  { id: "pod", name: "Escape Pod", price: 1000, tech: 6, desc: "Saves your life and your credits (Delete key)." },
  { id: "bomb", name: "Energy Bomb", price: 900, tech: 7, desc: "Destroys every small ship nearby (key B)." },
  { id: "energy", name: "Extra Energy Unit", price: 1500, tech: 8, desc: "Recharges energy and shields twice as fast." },
  { id: "shield", name: "Shield Booster", price: 2500, tech: 9, desc: "Shields are 50 % stronger." },
  { id: "dock", name: "Docking Computer", price: 1500, tech: 9, desc: "Docks for you (key L)." },
  { id: "galactic", name: "Galactic Hyperdrive", price: 5000, tech: 10, desc: "One jump to the next galaxy (key G). Used up." },
];

/* ---------- Ship classes ---------- */
// speed in units/s, roll/pitch in rad/s, shields/energy in points, fuel in light years
export const SHIPS = {
  kestrel: { name: "Kestrel Mk II", role: "trader", price: 45000, cargo: 20, speed: 320, roll: 2.4, pitch: 1.2, shields: 60, energy: 100, missiles: 4, fuel: 7, size: 42, kill: 1, bounty: 0 },
  wren: { name: "Wren Courier", role: "trader", price: 28000, cargo: 10, speed: 430, roll: 3.0, pitch: 1.5, shields: 45, energy: 80, missiles: 2, fuel: 7, size: 30, kill: 0.6, bounty: 0 },
  mule: { name: "Mule Hauler", role: "trader", price: 62000, cargo: 60, speed: 230, roll: 1.6, pitch: 0.9, shields: 80, energy: 120, missiles: 2, fuel: 7, size: 64, kill: 1, bounty: 0 },
  falcon: { name: "Falcon Interceptor", role: "fighter", price: 96000, cargo: 12, speed: 430, roll: 3.2, pitch: 1.6, shields: 110, energy: 140, missiles: 4, fuel: 7, size: 38, kill: 2, bounty: 0 },
  atlas: { name: "Atlas Freighter", role: "trader", price: 165000, cargo: 140, speed: 200, roll: 1.2, pitch: 0.7, shields: 150, energy: 200, missiles: 3, fuel: 8, size: 110, kill: 2, bounty: 0 },
  vanguard: { name: "Vanguard Gunship", role: "fighter", price: 245000, cargo: 40, speed: 340, roll: 2.5, pitch: 1.3, shields: 190, energy: 230, missiles: 6, fuel: 7, size: 60, kill: 3, bounty: 0 },
  seraph: { name: "Seraph Explorer", role: "fighter", price: 390000, cargo: 70, speed: 390, roll: 2.6, pitch: 1.35, shields: 210, energy: 260, missiles: 5, fuel: 10, size: 72, kill: 3, bounty: 0 },
  // non-player ships
  jackal: { name: "Jackal Raider", role: "pirate", cargo: 4, speed: 400, roll: 3, pitch: 1.6, shields: 40, energy: 70, missiles: 1, size: 32, kill: 1, bounty: 40 },
  raptor: { name: "Raptor Corsair", role: "pirate", cargo: 10, speed: 360, roll: 2.4, pitch: 1.3, shields: 90, energy: 130, missiles: 2, size: 48, kill: 2, bounty: 120 },
  warden: { name: "Warden Patrol", role: "police", cargo: 0, speed: 450, roll: 3, pitch: 1.6, shields: 90, energy: 120, missiles: 2, size: 40, kill: 2, bounty: 0 },
  xyrrid: { name: "Xyrrid Hive Ship", role: "alien", cargo: 0, speed: 260, roll: 1.2, pitch: 0.8, shields: 400, energy: 500, missiles: 0, size: 140, kill: 8, bounty: 600 },
  drone: { name: "Xyrrid Drone", role: "alien", cargo: 0, speed: 460, roll: 3.4, pitch: 1.8, shields: 30, energy: 50, missiles: 0, size: 22, kill: 1, bounty: 60 },
  asteroid: { name: "Asteroid", role: "rock", cargo: 0, speed: 20, roll: 0.3, pitch: 0.3, shields: 0, energy: 120, missiles: 0, size: 90, kill: 0.1, bounty: 0 },
  boulder: { name: "Boulder", role: "rock", cargo: 0, speed: 40, roll: 0.5, pitch: 0.5, shields: 0, energy: 30, missiles: 0, size: 34, kill: 0.05, bounty: 0 },
  canister: { name: "Cargo Canister", role: "cargo", cargo: 0, speed: 0, roll: 1, pitch: 1, shields: 0, energy: 18, missiles: 0, size: 12, kill: 0, bounty: 0 },
  pod: { name: "Escape Pod", role: "cargo", cargo: 0, speed: 60, roll: 1, pitch: 1, shields: 0, energy: 10, missiles: 0, size: 10, kill: 0, bounty: 0 },
  missile: { name: "Missile", role: "missile", cargo: 0, speed: 720, roll: 3, pitch: 2.6, shields: 0, energy: 6, missiles: 0, size: 9, kill: 0.1, bounty: 0 },
};
export const PLAYER_SHIPS = ["wren", "kestrel", "mule", "falcon", "atlas", "vanguard", "seraph"];

/* ---------- Textures ---------- */
const texCache = {};
function panelTexture(base, stripe, seed) {
  const key = base + stripe + seed;
  if (texCache[key]) return texCache[key];
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d"), r = U.rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { const x = r() * 256, y = r() * 256, w = 20 + r() * 80, h = 10 + r() * 50; g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,255,255"},${0.04 + r() * 0.06})`; g.fillRect(x, y, w, h); }
  g.strokeStyle = "rgba(0,0,0,0.45)"; g.lineWidth = 1.5;
  for (let i = 0; i < 18; i++) { const x = Math.floor(r() * 16) * 16, y = Math.floor(r() * 16) * 16; g.strokeRect(x + 0.5, y + 0.5, 32 + Math.floor(r() * 3) * 16, 16 + Math.floor(r() * 3) * 16); }
  g.fillStyle = "rgba(0,0,0,0.5)"; for (let i = 0; i < 120; i++) g.fillRect(Math.floor(r() * 64) * 4, Math.floor(r() * 64) * 4, 1.5, 1.5);
  if (stripe) { g.fillStyle = stripe; g.fillRect(0, 100, 256, 18); g.fillStyle = "rgba(255,255,255,0.6)"; g.fillRect(0, 96, 256, 3); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  texCache[key] = t;
  return t;
}
let glowTex = null;
export function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.2, "rgba(255,255,255,0.8)"); gr.addColorStop(0.45, "rgba(255,255,255,0.25)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
}
export function glowSprite(color, size, opacity = 1) {
  const m = new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
  const s = new THREE.Sprite(m); s.scale.set(size, size, 1);
  return s;
}

/* ---------- Geometry helpers ---------- */
// A hull from a top-view outline [x, z] (nose at -z), extruded to height h, tapered towards the top
function hullGeo(outline, h, taper = 0.35, drop = 0, bevel = 1.2) {
  const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, z)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1 });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, h / 2, 0);
  const p = geo.attributes.position;
  let minZ = 1e9, maxZ = -1e9;
  for (let i = 0; i < p.count; i++) { minZ = Math.min(minZ, p.getZ(i)); maxZ = Math.max(maxZ, p.getZ(i)); }
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), k = (y + h / 2) / h; // 0 bottom … 1 top
    const s = 1 - taper * k;
    p.setX(i, p.getX(i) * s);
    const zn = (p.getZ(i) - minZ) / (maxZ - minZ); // 0 nose … 1 tail
    p.setY(i, y * (0.35 + 0.65 * zn) - drop * (1 - zn));
  }
  geo.computeVertexNormals();
  return geo;
}
function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial(Object.assign({ color, metalness: 0.55, roughness: 0.42, flatShading: true }, opts));
}

/* ---------- Models ---------- */
const MODELS = {
  kestrel: { outline: [[0, -22], [9, -6], [24, 10], [22, 16], [-22, 16], [-24, 10], [-9, -6]], h: 9, taper: 0.45, col: "#d0d4dc", stripe: "#2a6aff", eng: [[-8, 0, 3.2], [8, 0, 3.2]], cock: [0, 3.5, -8, 4], fins: [[0, 4, 12, 7]], glow: 0x40a0ff },
  wren: { outline: [[0, -18], [6, -4], [8, 8], [14, 12], [-14, 12], [-8, 8], [-6, -4]], h: 6, taper: 0.4, col: "#f0e0c0", stripe: "#e0602a", eng: [[0, 0, 3.4]], cock: [0, 2.6, -6, 3.2], wings: [[[8, 2], [20, 10], [20, 13], [8, 11]]], glow: 0xff9040 },
  mule: { outline: [[0, -26], [14, -18], [18, 0], [18, 30], [-18, 30], [-18, 0], [-14, -18]], h: 16, taper: 0.25, col: "#b8b070", stripe: "#3a3a3a", eng: [[-9, -3, 4], [9, -3, 4], [-9, 4, 3], [9, 4, 3]], cock: [0, 7, -16, 4.5], boxes: [[-23, 0, 6, 5, 9, 26], [23, 0, 6, 5, 9, 26]], glow: 0xffd040 },
  falcon: { outline: [[0, -24], [5, -8], [8, 6], [6, 14], [-6, 14], [-8, 6], [-5, -8]], h: 7, taper: 0.4, col: "#c03030", stripe: "#f0f0f0", eng: [[-3.5, 0, 2.8], [3.5, 0, 2.8]], cock: [0, 3, -9, 3.4], wings: [[[7, 0], [26, 12], [26, 15], [6, 12]], [[-7, 0], [-6, 12], [-26, 15], [-26, 12]]], fins: [[-7, 4, 10, 6], [7, 4, 10, 6]], guns: [[-21, 0, 12], [21, 0, 12]], glow: 0xff5030 },
  atlas: { outline: [[0, -50], [18, -36], [26, 0], [26, 56], [-26, 56], [-26, 0], [-18, -36]], h: 24, taper: 0.2, col: "#7a8a9a", stripe: "#ffb020", eng: [[-14, -4, 6], [14, -4, 6], [0, 6, 6]], cock: [0, 10, -34, 6], boxes: [[-34, -2, 0, 8, 14, 70], [34, -2, 0, 8, 14, 70], [0, 16, 14, 18, 6, 50]], glow: 0xffc060 },
  vanguard: { outline: [[0, -32], [10, -14], [16, 4], [22, 20], [-22, 20], [-16, 4], [-10, -14]], h: 12, taper: 0.4, col: "#3a4a3a", stripe: "#d0d040", eng: [[-10, 0, 4], [10, 0, 4], [0, 2, 3]], cock: [0, 5, -14, 4.5], wings: [[[16, 2], [34, 18], [34, 24], [16, 18]], [[-16, 2], [-16, 18], [-34, 24], [-34, 18]]], fins: [[-14, 6, 14, 9], [14, 6, 14, 9]], guns: [[-32, 0, 24], [32, 0, 24], [-6, -3, -26], [6, -3, -26]], glow: 0x80ff60 },
  seraph: { outline: [[0, -38], [7, -20], [12, 0], [20, 22], [10, 30], [-10, 30], [-20, 22], [-12, 0], [-7, -20]], h: 10, taper: 0.5, col: "#e8ecf4", stripe: "#8a3aff", eng: [[-7, 0, 4], [7, 0, 4]], cock: [0, 4.5, -18, 4.5], wings: [[[11, 4], [38, 26], [40, 30], [14, 26]], [[-11, 4], [-14, 26], [-40, 30], [-38, 26]]], fins: [[0, 5, 20, 12]], glow: 0xb060ff },
  jackal: { outline: [[0, -18], [10, 0], [14, 12], [-14, 12], [-10, 0]], h: 6, taper: 0.5, col: "#3a3036", stripe: "#d02a2a", eng: [[-5, 0, 2.6], [5, 0, 2.6]], cock: [0, 2.6, -4, 3], fins: [[-12, 3, 9, 7], [12, 3, 9, 7]], guns: [[-8, -1, -10], [8, -1, -10]], glow: 0xff3030 },
  raptor: { outline: [[0, -28], [8, -12], [24, -4], [26, 6], [12, 20], [-12, 20], [-26, 6], [-24, -4], [-8, -12]], h: 9, taper: 0.45, col: "#4a2a1a", stripe: "#e0a020", eng: [[-7, 0, 3.4], [7, 0, 3.4]], cock: [0, 4, -10, 4], fins: [[-20, 4, 2, 9], [20, 4, 2, 9]], guns: [[-24, 0, -6], [24, 0, -6]], glow: 0xff7020 },
  warden: { outline: [[0, -24], [8, -6], [16, 10], [12, 16], [-12, 16], [-16, 10], [-8, -6]], h: 8, taper: 0.45, col: "#1a2a6a", stripe: "#f0f0f0", eng: [[-5, 0, 3], [5, 0, 3]], cock: [0, 3.4, -8, 3.6], fins: [[0, 4, 10, 8]], guns: [[-14, 0, 0], [14, 0, 0]], lights: true, glow: 0x40a0ff },
  drone: { outline: [[0, -14], [10, -4], [10, 6], [0, 12], [-10, 6], [-10, -4]], h: 6, taper: 0.7, col: "#2a5a3a", stripe: null, eng: [[0, 0, 3]], alien: true, glow: 0x60ff90 },
  xyrrid: { outline: [[0, -70], [50, -50], [70, 0], [50, 50], [0, 70], [-50, 50], [-70, 0], [-50, -50]], h: 30, taper: 0.55, col: "#1a3a2a", stripe: null, eng: [[-30, 0, 8], [30, 0, 8], [0, 0, 10]], alien: true, glow: 0x60ff90 },
  pod: { outline: [[0, -6], [4, -2], [4, 4], [-4, 4], [-4, -2]], h: 4, taper: 0.4, col: "#e0e0e0", stripe: "#ff6020", eng: [[0, 0, 1.4]], glow: 0xffa040 },
};

export function buildShip(type) {
  const g = new THREE.Group();
  const md = MODELS[type];
  if (type === "asteroid" || type === "boulder") return buildRock(SHIPS[type].size * 0.5, Math.random() * 1e6);
  if (type === "canister") return buildCanister();
  if (type === "missile") return buildMissile();
  const tex = panelTexture(md.col, md.stripe, type.length * 977);
  tex.repeat.set(0.04, 0.04);
  const body = mat(0xffffff, { map: tex, metalness: md.alien ? 0.2 : 0.6, roughness: md.alien ? 0.7 : 0.38 });
  const dark = mat(0x22252c, { metalness: 0.7, roughness: 0.5 });
  const hull = new THREE.Mesh(hullGeo(md.outline, md.h, md.taper, md.h * 0.15), body);
  g.add(hull);
  // belly plate
  const belly = new THREE.Mesh(hullGeo(md.outline.map(([x, z]) => [x * 0.8, z * 0.85]), md.h * 0.35, 0.1), dark);
  belly.position.y = -md.h * 0.42; g.add(belly);
  for (const w of md.wings || []) {
    const wg = new THREE.Mesh(hullGeo(w, md.h * 0.22, 0.2, 0, 0.6), body);
    wg.position.y = -md.h * 0.1; g.add(wg);
  }
  for (const b of md.boxes || []) {
    const [x, y, z, w, h, l] = b;
    const bx = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), body); bx.position.set(x, y, z); g.add(bx);
    const ribs = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, h * 0.25, l * 0.95), dark); ribs.position.set(x, y + h * 0.3, z); g.add(ribs);
  }
  for (const f of md.fins || []) {
    // a swept vertical fin standing on the hull
    const [x, y, z, hh] = f;
    const fgeo = new THREE.BoxGeometry(1.4, hh, hh * 1.3);
    const fp = fgeo.attributes.position;
    for (let i = 0; i < fp.count; i++) if (fp.getY(i) > 0) { fp.setZ(i, fp.getZ(i) * 0.45 + hh * 0.55); fp.setX(i, fp.getX(i) * 0.4); }
    fgeo.computeVertexNormals();
    const fg = new THREE.Mesh(fgeo, body);
    fg.position.set(x, Math.min(y, md.h * 0.3) + hh * 0.5, z); g.add(fg);
  }
  const glowCol = new THREE.Color(md.glow);
  g.userData.engines = [];
  const back = Math.max(...md.outline.map((p) => p[1]));
  for (const [x, y, r] of md.eng) {
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.25, r * 2.6, 12, 1, true), dark);
    cyl.rotation.x = Math.PI / 2; cyl.position.set(x, y, back - r * 0.6); g.add(cyl);
    const cap = new THREE.Mesh(new THREE.CircleGeometry(r * 1.1, 16), new THREE.MeshBasicMaterial({ color: glowCol.clone().multiplyScalar(2.2) }));
    cap.position.set(x, y, back + r * 0.65); g.add(cap);
    const spr = glowSprite(md.glow, r * 4.5, 0.85); spr.position.set(x, y, back + r * 1.2); g.add(spr);
    g.userData.engines.push(spr);
  }
  if (md.cock) {
    const [x, y, z, r] = md.cock;
    const glass = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x0a1a3a, metalness: 1, roughness: 0.08, emissive: 0x0a2a5a, emissiveIntensity: 0.6 }));
    glass.scale.set(1, 0.7, 2); glass.position.set(x, y, z); g.add(glass);
  }
  for (const [x, y, z] of md.guns || []) {
    const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 12, 6), dark);
    gun.rotation.x = Math.PI / 2; gun.position.set(x, y, z - 4); g.add(gun);
  }
  // navigation lights
  const wing = Math.max(...md.outline.map((p) => Math.abs(p[0])), ...(md.wings || []).flat().map((p) => Math.abs(p[0])));
  g.userData.navLights = [];
  for (const [sx, col] of [[-1, 0xff2020], [1, 0x20ff40]]) {
    const l = glowSprite(col, Math.max(4, md.h * 0.8), 1); l.position.set(sx * wing * 0.95, 0, back * 0.5); g.add(l); g.userData.navLights.push(l);
  }
  if (md.lights) { const b = glowSprite(0x4080ff, 10, 1); b.position.set(0, md.h * 0.8, back * 0.3); g.add(b); g.userData.siren = b; }
  if (md.alien) {
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(md.h * 0.6, 1), new THREE.MeshStandardMaterial({ color: 0x103020, emissive: 0x40ff80, emissiveIntensity: 1.2, flatShading: true }));
    core.position.y = md.h * 0.3; g.add(core);
    g.userData.core = core;
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  return g;
}

function buildRock(r, seed) {
  const geo = new THREE.IcosahedronGeometry(r, 2);
  const p = geo.attributes.position, rr = U.rng(seed | 0);
  const bumps = Array.from({ length: 6 }, () => [new THREE.Vector3(rr() - 0.5, rr() - 0.5, rr() - 0.5).normalize(), rr() * 0.35]);
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone().normalize();
    let k = 1 + (U.hash(Math.floor((n.x + 2) * 50) * 7 + Math.floor((n.y + 2) * 50) * 131 + Math.floor((n.z + 2) * 50) * 977) - 0.5) * 0.12;
    for (const [d, s] of bumps) k -= Math.max(0, n.dot(d) - 0.7) * s * 2;
    v.multiplyScalar(k); p.setXYZ(i, v.x, v.y * 0.8, v.z);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x6a6058, roughness: 0.95, metalness: 0.05, flatShading: true }));
  const g = new THREE.Group(); g.add(m);
  return g;
}
function buildCanister() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 12, 8), mat(0x8a8a90));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(5.3, 5.3, 2.5, 8), mat(0xff9020, { emissive: 0x401800 }));
  g.add(body, band);
  const l = glowSprite(0xffa030, 10, 0.9); l.position.y = 7; g.add(l);
  return g;
}
function buildMissile() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 12, 8), mat(0xd0d0d0));
  body.rotation.x = Math.PI / 2; g.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4, 8), mat(0xff3020)); nose.rotation.x = -Math.PI / 2; nose.position.z = -8; g.add(nose);
  const fl = glowSprite(0xffa040, 14, 1); fl.position.z = 7; g.add(fl);
  g.userData.engines = [fl];
  return g;
}

/* ---------- The orbital station: a rotating ring with a central hub and a docking slot facing +Z ---------- */
export function buildStation(seed) {
  const g = new THREE.Group(), r = U.rng(seed);
  const hullTex = panelTexture("#7c828c", "#3a6ab0", seed); hullTex.repeat.set(4, 2);
  const hull = mat(0xffffff, { map: hullTex, metalness: 0.5, roughness: 0.5 });
  const dark = mat(0x2a2e36, { metalness: 0.6, roughness: 0.6 });
  // central hub
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(220, 260, 520, 12, 1), hull); hub.rotation.x = Math.PI / 2; g.add(hub);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(225, 225, 20, 12, 1), dark); face.rotation.x = Math.PI / 2; face.position.z = 268; g.add(face);
  // docking slot: a glowing frame with a dark opening
  const slot = new THREE.Mesh(new THREE.BoxGeometry(150, 60, 30), new THREE.MeshBasicMaterial({ color: 0x000000 })); slot.position.z = 272; g.add(slot);
  const frameM = new THREE.MeshBasicMaterial({ color: 0x60c0ff });
  for (const [w, h, x, y] of [[170, 6, 0, 33], [170, 6, 0, -33], [6, 66, 85, 0], [6, 66, -85, 0]]) { const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 6), frameM); f.position.set(x, y, 286); g.add(f); }
  g.userData.slotLights = [];
  for (let i = 0; i < 8; i++) { const l = glowSprite(i % 2 ? 0x60c0ff : 0xffffff, 26, 1); l.position.set(-90 + (i % 4) * 60, i < 4 ? 50 : -50, 290); g.add(l); g.userData.slotLights.push(l); }
  // ring and spokes
  const ring = new THREE.Mesh(new THREE.TorusGeometry(900, 70, 12, 48), hull); g.add(ring);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(900, 74, 4, 48), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffd890, emissiveIntensity: 0.0, wireframe: false }));
  inner.scale.set(1, 1, 0.2); g.add(inner);
  for (let i = 0; i < 4; i++) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(700, 50, 60), dark); const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    sp.position.set(Math.cos(a) * 560, Math.sin(a) * 560, 0); sp.rotation.z = a; g.add(sp);
  }
  // window lights on the ring
  const wm = new THREE.MeshBasicMaterial({ color: 0xffe0a0 });
  const win = new THREE.InstancedMesh(new THREE.BoxGeometry(18, 8, 2), wm, 192);
  const o = new THREE.Object3D();
  let n = 0;
  for (let i = 0; i < 96; i++) for (const z of [72, -72]) { if (r() < 0.25) continue; const a = (i / 96) * Math.PI * 2; o.position.set(Math.cos(a) * 900, Math.sin(a) * 900, z); o.rotation.set(0, 0, a + Math.PI / 2); o.updateMatrix(); win.setMatrixAt(n++, o.matrix); }
  win.count = n;
  g.add(win);
  // antennas and solar panels
  const panelM = new THREE.MeshStandardMaterial({ color: 0x1a2a6a, metalness: 0.8, roughness: 0.25, emissive: 0x050a20 });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(600, 4, 160), panelM); p.position.set(s * 1350, 0, -150); g.add(p); const arm = new THREE.Mesh(new THREE.BoxGeometry(400, 20, 20), dark); arm.position.set(s * 1100, 0, -150); g.add(arm); }
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 500, 6), dark); ant.rotation.x = Math.PI / 2; ant.position.z = -500; g.add(ant);
  const beacon = glowSprite(0xff3030, 80, 1); beacon.position.z = -760; g.add(beacon); g.userData.beacon = beacon;
  return g;
}
