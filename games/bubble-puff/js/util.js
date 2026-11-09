/* helpers, input (keyboard, mouse, gamepad) and storage */
"use strict";
window.XA = window.XA || {};

(function (XA) {
  const U = (XA.U = {});
  U.W = 1280;
  U.H = 720;
  U.TAU = Math.PI * 2;
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  U.randi = (a, b) => Math.floor(U.rand(a, b + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
  U.angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  U.fmt = (n) => Math.floor(n).toLocaleString("en-US");
  U.rng = (seed) => {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  };
  // Deterministic hash of an integer to [0, 1)
  U.hash = (i, seed = 0) => {
    let h = (i * 374761393 + seed * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  // Smooth 1D value noise
  U.noise1 = (seed) => {
    const r = U.rng(seed), vals = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) vals[i] = r();
    return (x) => {
      const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f);
      const a = vals[i & 1023], b = vals[(i + 1) & 1023];
      return a + (b - a) * t;
    };
  };
  U.fbm = (n, x, oct = 3) => {
    let s = 0, a = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) { s += a * n(x * f + i * 31.7); norm += a; a *= 0.5; f *= 2.03; }
    return s / norm;
  };

  /* ---------- Storage ---------- */
  XA.Store = {
    get(k, d) {
      try { const v = localStorage.getItem(XA.PREFIX + "." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem(XA.PREFIX + "." + k, JSON.stringify(v)); } catch (e) { /* storage not available */ }
    },
  };

  /* ---------- Input ---------- */
  const KEYS = {
    up: ["ArrowUp", "KeyW"], down: ["ArrowDown", "KeyS"], left: ["ArrowLeft", "KeyA"], right: ["ArrowRight", "KeyD"],
    jump: ["ArrowUp", "KeyW", "Space", "KeyJ", "KeyZ", "KeyY"],
    fire: ["KeyX", "KeyK", "KeyC", "ShiftLeft", "ShiftRight"],
    confirm: ["Enter", "NumpadEnter", "Space"],
    back: ["Escape", "Backspace"],
    pause: ["Escape", "KeyP"],
    fullscreen: ["KeyF"],
    mute: ["KeyM"],
  };
  const PAD = {
    jump: [0, 3], fire: [1, 2, 5, 7], confirm: [0], back: [1], pause: [9],
    up: [12], down: [13], left: [14], right: [15],
  };
  const GAME_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Backspace", "Tab"]);

  const Input = (XA.Input = {
    keys: new Set(), pressed: new Set(), rep: new Set(), typed: [],
    mouse: { x: U.W / 2, y: U.H / 2, buttons: 0, clicked: false, rclicked: false, mclicked: false, moved: false, wheel: 0, inside: false },
    pad: { connected: false, axes: [0, 0], buttons: [], values: [], prev: [], pressed: new Set(), dir: new Set(), stick: {} },
    lastDevice: "keyboard",
    onGesture: null,
    seq: [], // recent "pressed" events for key sequences
  });

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    Input.rep.add(e.code);
    if (!e.repeat) {
      Input.keys.add(e.code);
      Input.pressed.add(e.code);
      if (e.key && e.key.length === 1) Input.typed.push(e.key);
    }
    Input.lastDevice = "keyboard";
    if (Input.onGesture) Input.onGesture();
  });
  window.addEventListener("keyup", (e) => Input.keys.delete(e.code));
  window.addEventListener("blur", () => { Input.keys.clear(); Input.mouse.buttons = 0; });

  Input.KEYS = KEYS; Input.PAD = PAD; // games may adjust the key bindings

  Input.attachMouse = function (canvas, toLogical) {
    const m = Input.mouse;
    const pos = (e) => { const p = toLogical(e.clientX, e.clientY); m.x = p.x; m.y = p.y; };
    canvas.addEventListener("mousemove", (e) => { pos(e); m.moved = true; m.inside = true; Input.lastDevice = "mouse"; });
    canvas.addEventListener("mouseleave", () => { m.inside = false; });
    canvas.addEventListener("mousedown", (e) => {
      pos(e);
      m.inside = true;
      m.buttons |= 1 << e.button;
      if (e.button === 0) m.clicked = true;
      if (e.button === 2) m.rclicked = true;
      if (e.button === 1) { m.mclicked = true; e.preventDefault(); }
      Input.lastDevice = "mouse";
      if (Input.onGesture) Input.onGesture();
    });
    window.addEventListener("mouseup", (e) => { m.buttons &= ~(1 << e.button); });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("wheel", (e) => { m.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    canvas.addEventListener("touchstart", () => { if (Input.onGesture) Input.onGesture(); }, { passive: true });
  };

  Input.poll = function (dt) {
    const pad = Input.pad;
    pad.pressed.clear();
    pad.dir.clear();
    let gp = null;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) if (p && p.connected) { gp = p; break; }
    if (!gp) { pad.connected = false; pad.axes = [0, 0]; pad.buttons = []; return; }
    pad.connected = true;
    const b = gp.buttons.map((x) => x.pressed || x.value > 0.5);
    for (let i = 0; i < b.length; i++) if (b[i] && !pad.prev[i]) { pad.pressed.add(i); Input.seq.push("p" + i); }
    pad.prev = b;
    pad.buttons = b;
    pad.values = gp.buttons.map((x) => x.value || (x.pressed ? 1 : 0));
    let ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    const l = Math.hypot(ax, ay);
    if (l < 0.22) { ax = 0; ay = 0; }
    pad.axes = [ax, ay];
    // Menu navigation with the stick, with key-repeat behaviour
    const dirs = { left: ax < -0.55, right: ax > 0.55, up: ay < -0.55, down: ay > 0.55 };
    for (const d in dirs) {
      const s = pad.stick[d];
      if (dirs[d]) {
        if (s === undefined || s < 0) { pad.dir.add(d); pad.stick[d] = 0.38; }
        else { pad.stick[d] = s - dt; if (pad.stick[d] <= 0) { pad.dir.add(d); pad.stick[d] = 0.11; } }
      } else pad.stick[d] = -1;
    }
    if (pad.pressed.size || l > 0.5) {
      Input.lastDevice = "pad";
      if (pad.pressed.size && Input.onGesture) Input.onGesture();
    }
  };

  Input.held = function (a) {
    const ks = KEYS[a];
    if (ks) for (const k of ks) if (Input.keys.has(k)) return true;
    const pb = PAD[a], pad = Input.pad;
    if (pb && pad.connected) for (const i of pb) if (pad.buttons[i]) return true;
    if (a === "fire" && (Input.mouse.buttons & 1)) return true;
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

  Input.endFrame = function () {
    Input.pressed.clear();
    Input.rep.clear();
    Input.typed.length = 0;
    const m = Input.mouse;
    m.clicked = m.rclicked = m.mclicked = m.moved = false;
    m.wheel = 0;
    if (Input.seq.length > 20) Input.seq.splice(0, Input.seq.length - 20);
  };
})(window.XA);
