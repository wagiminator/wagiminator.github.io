/* STARHAUL: helpers, storage and input (keyboard, mouse with optional pointer lock, analog gamepads) */
"use strict";
window.XA = window.XA || {};

(function (XA) {
  const U = (XA.U = {});
  U.TAU = Math.PI * 2;
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  U.randi = (a, b) => Math.floor(U.rand(a, b + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.fmt = (n) => Math.floor(n).toLocaleString("en-US");
  U.cr = (n) => (Math.round(n * 10) / 10).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  U.rng = (seed) => {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  };
  U.hash = (i, seed = 0) => {
    let h = (i * 374761393 + seed * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };

  /* ---------- Storage ---------- */
  XA.Store = {
    get(k, d) { try { const v = localStorage.getItem("starhaul." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("starhaul." + k, JSON.stringify(v)); } catch (e) { /* storage not available */ } },
  };

  /* ---------- Input ---------- */
  const KEYS = {
    up: ["ArrowUp", "KeyW"], down: ["ArrowDown", "KeyS"], left: ["ArrowLeft", "KeyA"], right: ["ArrowRight", "KeyD"],
    confirm: ["Enter", "NumpadEnter", "Space"], back: ["Escape", "Backspace"], pause: ["Escape", "KeyP"],
    // flight
    pitchUp: ["ArrowDown", "KeyS"], pitchDown: ["ArrowUp", "KeyW"], rollL: ["ArrowLeft", "KeyA"], rollR: ["ArrowRight", "KeyD"],
    yawL: ["KeyQ"], yawR: ["KeyE"], faster: ["ShiftLeft", "ShiftRight"], slower: ["KeyX"], fire: ["Space"],
  };
  const PAD = { confirm: [0], back: [1], pause: [9], up: [12], down: [13], left: [14], right: [15] };
  const GAME_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Backspace", "Tab", "F1"]);

  const Input = (XA.Input = {
    keys: new Set(), pressed: new Set(), rep: new Set(), typed: [],
    mouse: { x: 640, y: 360, nx: 0, ny: 0, dx: 0, dy: 0, buttons: 0, clicked: false, rclicked: false, mclicked: false, moved: false, wheel: 0, inside: false, locked: false },
    pad: { connected: false, axes: [0, 0, 0, 0], buttons: [], values: [], prev: [], pressed: new Set(), dir: new Set(), stick: {} },
    lastDevice: "keyboard", onGesture: null, seq: [],
    invert: XA.Store.get("invert", false),
  });

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    Input.rep.add(e.code);
    if (!e.repeat) {
      Input.keys.add(e.code); Input.pressed.add(e.code);
      if (e.key && e.key.length === 1) Input.typed.push(e.key);
    }
    Input.lastDevice = "keyboard";
    if (Input.onGesture) Input.onGesture();
  });
  window.addEventListener("keyup", (e) => Input.keys.delete(e.code));
  window.addEventListener("blur", () => { Input.keys.clear(); Input.mouse.buttons = 0; });

  Input.attachMouse = function (el, toLogical) {
    const m = Input.mouse;
    const pos = (e) => { const p = toLogical(e.clientX, e.clientY); m.x = p.x; m.y = p.y; m.nx = p.nx; m.ny = p.ny; };
    el.addEventListener("mousemove", (e) => {
      if (m.locked) { m.dx += e.movementX; m.dy += e.movementY; } else pos(e);
      m.moved = true; m.inside = true; Input.lastDevice = "mouse";
    });
    el.addEventListener("mouseleave", () => { m.inside = false; });
    el.addEventListener("mousedown", (e) => {
      if (!m.locked) pos(e);
      m.inside = true; m.buttons |= 1 << e.button;
      if (e.button === 0) m.clicked = true;
      if (e.button === 2) m.rclicked = true;
      if (e.button === 1) { m.mclicked = true; e.preventDefault(); }
      Input.lastDevice = "mouse";
      if (Input.onGesture) Input.onGesture();
    });
    window.addEventListener("mouseup", (e) => { m.buttons &= ~(1 << e.button); });
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    el.addEventListener("wheel", (e) => { m.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    el.addEventListener("touchstart", () => { if (Input.onGesture) Input.onGesture(); }, { passive: true });
    document.addEventListener("pointerlockchange", () => { m.locked = document.pointerLockElement === el; m.dx = m.dy = 0; });
  };

  Input.poll = function (dt) {
    const pad = Input.pad;
    pad.pressed.clear(); pad.dir.clear();
    const list = navigator.getGamepads ? [...navigator.getGamepads()].filter((p) => p && p.connected) : [];
    const gp = list[0];
    if (!gp) { pad.connected = false; pad.axes = [0, 0, 0, 0]; pad.values = []; return; }
    pad.connected = true;
    const b = gp.buttons.map((x) => x.pressed || x.value > 0.5);
    pad.values = gp.buttons.map((x) => x.value);
    for (let i = 0; i < b.length; i++) if (b[i] && !pad.prev[i]) { pad.pressed.add(i); Input.seq.push("p" + i); }
    pad.prev = b; pad.buttons = b;
    const dz = (v) => (Math.abs(v) < 0.15 ? 0 : (v - Math.sign(v) * 0.15) / 0.85);
    pad.axes = [dz(gp.axes[0] || 0), dz(gp.axes[1] || 0), dz(gp.axes[2] || 0), dz(gp.axes[3] || 0)];
    const [ax, ay] = pad.axes;
    const dirs = { left: ax < -0.55, right: ax > 0.55, up: ay < -0.55, down: ay > 0.55 };
    for (const d in dirs) {
      const s = pad.stick[d];
      if (dirs[d]) {
        if (s === undefined || s < 0) { pad.dir.add(d); pad.stick[d] = 0.38; }
        else { pad.stick[d] = s - dt; if (pad.stick[d] <= 0) { pad.dir.add(d); pad.stick[d] = 0.11; } }
      } else pad.stick[d] = -1;
    }
    if (pad.pressed.size || Math.abs(ax) > 0.4 || Math.abs(ay) > 0.4 || Math.abs(pad.axes[2]) > 0.4) {
      Input.lastDevice = "pad";
      if (pad.pressed.size && Input.onGesture) Input.onGesture();
    }
  };

  Input.held = function (a) {
    const ks = KEYS[a];
    if (ks) for (const k of ks) if (Input.keys.has(k)) return true;
    const pb = PAD[a], pad = Input.pad;
    if (pb && pad.connected) for (const i of pb) if (pad.buttons[i]) return true;
    return false;
  };
  Input.hit = function (a) {
    const ks = KEYS[a];
    const isDir = a === "up" || a === "down" || a === "left" || a === "right";
    if (ks) for (const k of ks) if ((isDir ? Input.rep : Input.pressed).has(k)) return true;
    const pb = PAD[a], pad = Input.pad;
    if (pb) for (const i of pb) if (pad.pressed.has(i)) return true;
    if (isDir && pad.dir.has(a)) return true;
    return false;
  };
  Input.key = (code) => Input.pressed.has(code);
  Input.padHit = (i) => Input.pad.pressed.has(i);

  Input.endFrame = function () {
    Input.pressed.clear(); Input.rep.clear(); Input.typed.length = 0;
    const m = Input.mouse;
    m.clicked = m.rclicked = m.mclicked = m.moved = false;
    m.wheel = 0; m.dx = 0; m.dy = 0;
    if (Input.seq.length > 20) Input.seq.splice(0, Input.seq.length - 20);
  };
})(window.XA);
