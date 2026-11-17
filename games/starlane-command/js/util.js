/* Starlane Command: helpers, input (mouse, touch, keyboard, gamepad) and storage */
"use strict";
window.SL = window.SL || {};

(function (SL) {
  const U = (SL.U = {});
  U.W = 1280;
  U.H = 720;
  U.TAU = Math.PI * 2;
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  U.randi = (a, b) => Math.floor(U.rand(a, b + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.chance = (p) => Math.random() < p;
  U.fmt = (n) => Math.floor(n).toLocaleString("en-US");
  U.ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
  U.shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  U.rng = (seed) => {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  };

  /* ---------- Storage ---------- */
  SL.Store = {
    get(k, d) {
      try { const v = localStorage.getItem("starlane." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem("starlane." + k, JSON.stringify(v)); } catch (e) { /* storage not available */ }
    },
  };

  /* ---------- Input ----------
     Everything works with one pointer: the mouse, a finger, or a cursor
     that the gamepad stick moves.                                            */
  const KEYS = {
    up: ["ArrowUp"], down: ["ArrowDown"], left: ["ArrowLeft"], right: ["ArrowRight"],
    click: ["Enter", "NumpadEnter"],
    back: ["Escape", "Backspace"],
    menu: ["Escape"],
    pause: ["Space", "KeyP"],
    send: ["KeyS"],
    half: ["KeyH"],
    next: ["Tab"],
    faster: ["Equal", "NumpadAdd", "BracketRight", "PageUp"],
    slower: ["Minus", "NumpadSubtract", "BracketLeft", "PageDown"],
  };
  const PAD = { click: [0], back: [1], send: [2], next: [3], slower: [4], faster: [5], half: [6, 7], menu: [9], pause: [8], up: [12], down: [13], left: [14], right: [15] };
  const GAME_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Backspace", "Tab"]);

  const Input = (SL.Input = {
    keys: new Set(), pressed: new Set(), rep: new Set(), typed: [],
    mouse: { x: U.W / 2, y: U.H / 2, down: false, clicked: false, rclicked: false, released: false, moved: false, wheel: 0, inside: true },
    pad: { connected: false, axes: [0, 0], buttons: [], prev: [], pressed: new Set(), dir: new Set(), stick: {} },
    lastDevice: "mouse",
    touch: false,
    onGesture: null,
  });

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey && !/^Control/.test(e.code)) || e.metaKey || e.altKey) return;
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    Input.rep.add(e.code);
    if (!e.repeat) {
      Input.keys.add(e.code);
      Input.pressed.add(e.code);
      if (e.key && e.key.length === 1) Input.typed.push(e.key);
    }
    if (/^Arrow/.test(e.code)) Input.lastDevice = "keyboard";
    if (Input.onGesture) Input.onGesture();
  });
  window.addEventListener("keyup", (e) => Input.keys.delete(e.code));
  window.addEventListener("blur", () => { Input.keys.clear(); Input.mouse.down = false; });

  Input.attachPointer = function (canvas, toLogical) {
    const m = Input.mouse;
    const pos = (cx, cy) => { const p = toLogical(cx, cy); m.x = p.x; m.y = p.y; };
    canvas.addEventListener("pointermove", (e) => {
      pos(e.clientX, e.clientY); m.moved = true; m.inside = true;
      Input.lastDevice = "mouse"; Input.touch = e.pointerType === "touch";
    });
    canvas.addEventListener("pointerdown", (e) => {
      pos(e.clientX, e.clientY);
      Input.touch = e.pointerType === "touch";
      Input.lastDevice = "mouse";
      if (e.button === 2) m.rclicked = true;
      else { m.down = true; m.clicked = true; }
      if (canvas.setPointerCapture) try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (Input.onGesture) Input.onGesture();
      e.preventDefault();
    });
    window.addEventListener("pointerup", (e) => { if (e.button !== 2 && m.down) { m.down = false; m.released = true; } });
    canvas.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") m.inside = false; });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("wheel", (e) => { m.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
  };

  Input.poll = function (dt) {
    const pad = Input.pad;
    pad.pressed.clear();
    pad.dir.clear();
    let gp = null;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) if (p && p.connected) { gp = p; break; }
    if (!gp) { pad.connected = false; pad.axes = [0, 0]; pad.buttons = []; }
    else {
      pad.connected = true;
      const b = gp.buttons.map((x) => x.pressed || x.value > 0.5);
      for (let i = 0; i < b.length; i++) if (b[i] && !pad.prev[i]) pad.pressed.add(i);
      pad.prev = b;
      pad.buttons = b;
      let ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      const l = Math.hypot(ax, ay);
      if (l < 0.2) { ax = 0; ay = 0; }
      pad.axes = [ax, ay];
      const rx = gp.axes[2] || 0;
      pad.rx = Math.abs(rx) > 0.25 ? rx : 0;
      const dirs = { left: b[14], right: b[15], up: b[12], down: b[13] };
      for (const d in dirs) {
        const s = pad.stick[d];
        if (dirs[d]) {
          if (s === undefined || s < 0) { pad.dir.add(d); pad.stick[d] = 0.35; }
          else { pad.stick[d] = s - dt; if (pad.stick[d] <= 0) { pad.dir.add(d); pad.stick[d] = 0.12; } }
        } else pad.stick[d] = -1;
      }
      if (pad.pressed.size || l > 0.3) {
        Input.lastDevice = "pad";
        if (pad.pressed.size && Input.onGesture) Input.onGesture();
      }
      // the stick moves the cursor freely
      if (l > 0.2) {
        const sp = 1100 * Math.min(1, l) * Math.min(1, l);
        Input.mouse.x = U.clamp(Input.mouse.x + ax * sp * dt, 0, U.W);
        Input.mouse.y = U.clamp(Input.mouse.y + ay * sp * dt, 0, U.H);
        Input.mouse.moved = true;
      }
    }
    if (Input.hitAction("click")) { Input.mouse.clicked = true; Input.mouse.released = true; }
  };

  Input.hitAction = function (a) {
    const ks = KEYS[a];
    const isDir = a === "up" || a === "down" || a === "left" || a === "right";
    if (ks) for (const k of ks) if ((isDir ? Input.rep : Input.pressed).has(k)) return true;
    const pb = PAD[a], pad = Input.pad;
    if (pb) for (const i of pb) if (pad.pressed.has(i)) return true;
    if (isDir && pad.dir.has(a)) return true;
    return false;
  };
  Input.hit = Input.hitAction;
  Input.held = function (a) {
    const ks = KEYS[a];
    if (ks) for (const k of ks) if (Input.keys.has(k)) return true;
    const pb = PAD[a], pad = Input.pad;
    if (pb && pad.connected) for (const i of pb) if (pad.buttons[i]) return true;
    return false;
  };
  // a cursor is drawn when the pointer is moved by keys or gamepad
  Input.showCursor = () => Input.lastDevice !== "mouse";

  Input.endFrame = function () {
    Input.pressed.clear();
    Input.rep.clear();
    Input.typed.length = 0;
    const m = Input.mouse;
    m.clicked = m.rclicked = m.released = m.moved = false;
    m.wheel = 0;
  };
})(window.SL);
