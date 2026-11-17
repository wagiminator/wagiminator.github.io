/* STARHAUL: main loop, canvases, scaling, fullscreen, state machine and the glue between flight and station */
import { World } from "./world.js";
import { Flight } from "./flight.js";
import { States, bindUI } from "./ui.js";
import { G, sys, enterMarket, save, msg, illegalCargo, HS, fuelMax, newCommander } from "./state.js";
import { updateMessages } from "./hud.js";
import * as ST from "./state.js";
import * as GX from "./galaxy.js";
const { U, Store } = window.XA;
const I = window.XA.Input, A = window.XA.Audio;

const gl = document.getElementById("gl"), hud = document.getElementById("hud"), g = hud.getContext("2d");
const view = { W: 1280, H: 720, scale: 1, ox: 0, oy: 0, dpr: 1 };
const Main = (window.XA.Main = { state: "boot" });
let cur = States.boot;

// Without WebGL there is no 3D view: explain the problem instead of showing a black screen
function webglFailed(err) {
  const draw = () => {
    const w = (hud.width = window.innerWidth), h = (hud.height = window.innerHeight);
    g.fillStyle = "#02040a"; g.fillRect(0, 0, w, h);
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = "#9ad8ff"; g.font = "700 34px Orbitron, Arial, sans-serif"; g.fillText("STARHAUL", w / 2, h / 2 - 120);
    g.fillStyle = "#ff8a7a"; g.font = "600 24px Rajdhani, Arial, sans-serif"; g.fillText("Your browser could not start WebGL, which this 3D game needs.", w / 2, h / 2 - 60);
    g.fillStyle = "#d8eeff"; g.font = "500 19px Rajdhani, Arial, sans-serif";
    const lines = [
      "Chrome: open chrome://settings/system and switch on \u201cUse graphics acceleration when available\u201d, then restart Chrome.",
      "Then check chrome://gpu \u2013 \u201cWebGL\u201d should say \u201cHardware accelerated\u201d.",
      "If your graphics card is blocked on Linux, try chrome://flags/#ignore-gpu-blocklist (\u201cOverride software rendering list\u201d).",
      "Firefox usually works as well.",
    ];
    lines.forEach((s, i) => g.fillText(s, w / 2, h / 2 + i * 30));
    g.fillStyle = "#7aa8c8"; g.font = "500 15px monospace"; g.fillText(String(err && err.message || err).slice(0, 140), w / 2, h / 2 + 160);
  };
  draw(); window.addEventListener("resize", draw);
}
let world;
try {
  world = new World(gl);
} catch (e) {
  webglFailed(e);
  throw e;
}
const flight = new Flight(world);
const ctx = {
  world, flight, quality: Store.get("quality", 1),
  setState, dockAt, launch, endCareer, setQuality,
};
bindUI(ctx);

function setState(name, arg) { Main.state = name; cur = States[name]; if (cur.enter) cur.enter(arg); }
Main.setState = setState;

/* ---------- sizing ---------- */
function resize() {
  const cw = window.innerWidth, ch = window.innerHeight;
  const q = ctx.quality;
  const dpr = Math.min(window.devicePixelRatio || 1, q === 0 ? 0.75 : q === 1 ? 1.5 : 2);
  world.resize(cw, ch, dpr);
  world.bloom.enabled = q > 0;
  const hdpr = Math.min(window.devicePixelRatio || 1, 2);
  hud.width = Math.round(cw * hdpr); hud.height = Math.round(ch * hdpr);
  hud.style.width = cw + "px"; hud.style.height = ch + "px";
  view.H = 720; view.W = Math.max(1120, Math.round(720 * cw / ch));
  view.scale = Math.min(hud.width / view.W, hud.height / view.H);
  view.ox = (hud.width - view.W * view.scale) / 2; view.oy = (hud.height - view.H * view.scale) / 2;
  view.dpr = hdpr;
}
function setQuality(q) { ctx.quality = q; Store.set("quality", q); resize(); }
window.addEventListener("resize", resize);
resize();
I.attachMouse(hud, (cx, cy) => {
  const x = (cx * view.dpr - view.ox) / view.scale, y = (cy * view.dpr - view.oy) / view.scale;
  return { x, y, nx: (x - view.W / 2) / (view.H / 2), ny: (y - view.H / 2) / (view.H / 2) };
});
I.onGesture = () => A.init();

Main.toggleFullscreen = function () {
  if (document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen(); }
  else { const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen; if (req) { const p = req.call(el, { navigationUI: "hide" }); if (p && p.catch) p.catch(() => {}); } }
};
Main.setCursor = (v) => { hud.style.cursor = v ? "default" : "crosshair"; };
document.addEventListener("visibilitychange", () => { if (document.hidden && Main.state === "flight") States.flight.pause(); });
window.addEventListener("blur", () => { if (Main.state === "flight") States.flight.pause(); });

/* ---------- station and flight glue ---------- */
let loading = null;
function withSystem(then) {
  const s = sys();
  if (world.sys && world.sys.sys === s && world.sys.planet) { then(); return; }
  loading = { t: 0 };
  world.buildSystem(s).then(() => { loading = null; then(); });
}
function dockAt() {
  if (showcaseCleanup) showcaseCleanup();
  withSystem(() => {
    flight.resetPlayer();
    flight.player.visible = true;
    flight.mode = "docked";
    flight.S = world.sys;
    enterMarket();
    setState("docked", { tab: 1 });
  });
}
function showcaseCleanup() { /* the title ship is removed by the docked screen */ }
function launch() {
  const c = G.cmdr;
  const illegal = illegalCargo();
  if (illegal > 0) { c.legal = Math.min(255, c.legal + illegal); msg("Customs logged your illegal cargo", "#ff9040", 4); }
  save("career");
  flight.resetPlayer();
  flight.S = world.sys;
  flight.setView(0);
  flight.begin("launch");
  setState("flight");
}
flight.cb.dock = () => {
  const c = G.cmdr;
  // offenders pay a fine on docking
  if (c.legal > 0 && c.legal < 50) {
    const fine = c.legal * 10;
    if (G.cheat || c.credits >= fine) { if (!G.cheat) c.credits = Math.round((c.credits - fine) * 10) / 10; c.legal = 0; msg(`Fine paid: ${fine} Cr – your record is clean`, "#ffd060", 4); }
  }
  flight.resetPlayer();
  enterMarket();
  save("career");
  setState("docked", { tab: 1 });
};
flight.cb.hyper = (done) => { world.buildSystem(sys()).then(done); };
flight.cb.arrived = () => { msg(`Welcome to ${sys().name}`, "#9ad8ff", 3); };
flight.cb.death = () => { G.cmdr.deaths++; setState("gameover"); };
flight.cb.escape = () => {
  const c = G.cmdr;
  c.ship = "kestrel"; c.cargo = {}; c.cost = {}; c.equip = {}; c.lasers = { front: "pulse", rear: null }; c.missiles = 0; c.legal = 0; c.fuel = 7;
  msg("Your insurance replaced your ship with a Kestrel Mk II", "#ffd060", 5);
  flight.resetPlayer();
  enterMarket();
  save("career");
  setState("docked", { tab: 6 });
};
function endCareer() {
  const c = G.cmdr;
  Store.set("save.career", null);
  if (!c.cheated && !G.cheat && HS.rank(c.score) >= 0) setState("nameentry"); else setState("highscores");
}

/* ---------- secret ---------- */
let typedBuf = "";
const SECRET = [77, 73, 76, 75, 89, 87, 65, 89].map((c) => String.fromCharCode(c)).join("");
const PADSEQ = ["p12", "p12", "p13", "p13", "p14", "p15", "p14", "p15", "p1", "p0"].join(",");
function toggleSecret() {
  G.cheat = !G.cheat;
  if (G.cheat && G.cmdr) G.cmdr.cheated = true;
  A.sfx(G.cheat ? "secret" : "secretOff");
}
function checkSecret() {
  if (Main.state === "nameentry" || Main.state === "newcareer") { typedBuf = ""; return; }
  for (const ch of I.typed) typedBuf = (typedBuf + ch.toUpperCase()).slice(-12);
  if (typedBuf.endsWith(SECRET)) { typedBuf = ""; toggleSecret(); }
  if (I.seq.length >= 10 && I.seq.slice(-10).join(",") === PADSEQ) { I.seq.length = 0; toggleSecret(); }
}
function globalKeys() {
  if (Main.state === "nameentry" || Main.state === "newcareer") return;
  if ((Main.state === "flight" && States.flight.map) || (Main.state === "docked" && States.docked.tab === 4)) return; // typing on the star map
  if (I.pressed.has("KeyF")) Main.toggleFullscreen();
  if (I.pressed.has("KeyN")) A.toggleMute();
}

/* ---------- keep the screen awake in flight (a gamepad does not reset the screen saver) ---------- */
let wakeLock = null, wakeBusy = false, wakeRetryAt = 0, wakeCheck = 0;
function updateWakeLock() {
  if (!navigator.wakeLock || wakeBusy) return;
  if (wakeLock && wakeLock.released) wakeLock = null;
  const want = Main.state === "flight" && !States.flight.paused && !document.hidden;
  if (want && !wakeLock) {
    if (performance.now() < wakeRetryAt) return;
    wakeBusy = true;
    navigator.wakeLock.request("screen").then((l) => {
      wakeLock = l; wakeBusy = false;
      l.addEventListener("release", () => { if (wakeLock === l) wakeLock = null; });
    }).catch(() => { wakeBusy = false; wakeRetryAt = performance.now() + 3000; });
  } else if (!want && wakeLock) {
    const l = wakeLock; wakeLock = null;
    l.release().catch(() => {});
  }
}

/* ---------- loop ---------- */
let last = performance.now(), time = 0;
function step(dt) {
  if (loading) { loading.t += dt; return; }
  if (cur.update) cur.update(dt);
  if (Main.state !== "flight") updateMessages(dt);
}
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000; last = now;
  dt = U.clamp(dt, 0, 0.05);
  time += dt;
  if ((wakeCheck -= dt) <= 0) { wakeCheck = 0.5; updateWakeLock(); }
  I.poll(dt);
  checkSecret();
  globalKeys();
  try {
    if (!loading && cur.input) cur.input(dt, view.W, view.H);
    step(dt);
    render(dt);
  } finally { I.endFrame(); }
}
function render(dt) {
  if (cur.uses3D && ((world.sys && world.sys.planet) || flight.mode === "jump")) {
    world.update(dt, time);
    world.render();
    if (cur.render3D) cur.render3D(world, view.W, view.H, view.scale);
  } else { world.renderer.setClearColor(0x02040a); world.renderer.clear(); }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, hud.width, hud.height);
  g.setTransform(view.scale, 0, 0, view.scale, view.ox, view.oy);
  cur.draw(g, view.W, view.H);
  if (loading) {
    g.fillStyle = "rgba(2,4,10,0.6)"; g.fillRect(0, 0, view.W, view.H);
    g.font = "700 22px Orbitron, Arial"; g.textAlign = "center"; g.fillStyle = "#9ad8ff";
    g.fillText("Charting the system" + ".".repeat(1 + Math.floor(loading.t * 3) % 3), view.W / 2, view.H / 2);
  }
}
// test hook: advance the simulation without rendering
Main.simulate = function (seconds) { const n = Math.round(seconds * 60); for (let i = 0; i < n; i++) { step(1 / 60); time += 1 / 60; if (world.sys && world.sys.planet) world.update(1 / 60, time); } };
Main.ctx = ctx; Main.ST = ST; Main.GX = GX; // test hooks

function start() { setState("boot"); requestAnimationFrame(frame); }
if (document.fonts && document.fonts.load) {
  Promise.race([Promise.all([document.fonts.load("700 20px Orbitron"), document.fonts.load("600 20px Rajdhani")]), new Promise((r) => setTimeout(r, 1500))]).then(start, start);
} else start();
