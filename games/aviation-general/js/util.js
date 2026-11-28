/* Aviation General: helpers, input (mouse, touch, keyboard, gamepad) and storage */
"use strict";
window.MG = window.MG || {};

(function (MG) {
  const U = (MG.U = {});
  U.W = 1280;
  U.H = 720;
  U.TAU = Math.PI * 2;
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rand = (a = 1, b) => (b === undefined ? MG.U.random() * a : a + MG.U.random() * (b - a));
  U.randi = (a, b) => Math.floor(U.rand(a, b + 1));
  U.pick = (arr) => arr[Math.floor(U.random() * arr.length)];
  U.chance = (p) => U.random() < p;
  U.ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
  U.rng = (seed) => {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  };
  // the game's dice; tests can swap in a seeded generator
  U.random = Math.random;
  // a binary min-heap of [key, value]
  U.heap = function () {
    const a = [];
    return {
      push(k, v) { a.push([k, v]); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } },
      pop() { const t = a[0], l = a.pop(); if (a.length) { a[0] = l; let i = 0; for (;;) { const x = 2 * i + 1, y = x + 1; let m = i; if (x < a.length && a[x][0] < a[m][0]) m = x; if (y < a.length && a[y][0] < a[m][0]) m = y; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return t; },
      get size() { return a.length; },
    };
  };
  U.seed = (n) => { U.random = n == null ? Math.random : U.rng(n); };
  U.binom = (n, p) => { let k = 0; for (let i = 0; i < n; i++) if (U.random() < p) k++; return k; };

  /* ---------- Storage ---------- */
  MG.Store = {
    get(k, d) {
      try { const v = localStorage.getItem("aviationgeneral." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem("aviationgeneral." + k, JSON.stringify(v)); } catch (e) { /* storage not available */ }
    },
  };

  /* ---------- Input ----------
     Everything works with one pointer: the mouse, a finger, or a cursor
     that the gamepad stick moves.                                            */
  const KEYS = {
    up: ["ArrowUp", "KeyW"], down: ["ArrowDown", "KeyS"], left: ["ArrowLeft", "KeyA"], right: ["ArrowRight", "KeyD"],
    click: ["Enter", "NumpadEnter"],
    back: ["Escape", "Backspace"],
    menu: ["Escape"],
    endturn: ["KeyE"],
    next: ["Tab", "KeyN"],
    zoomin: ["Equal", "NumpadAdd", "PageUp"],
    zoomout: ["Minus", "NumpadSubtract", "PageDown"],
  };
  const PAD = { click: [0], back: [1], next: [3], zoomout: [4], zoomin: [5], endturn: [9], menu: [8], up: [12], down: [13], left: [14], right: [15] };
  const GAME_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Backspace", "Tab"]);

  const Input = (MG.Input = {
    keys: new Set(), pressed: new Set(), rep: new Set(),
    mouse: { x: U.W / 2, y: U.H / 2, down: false, clicked: false, rclicked: false, released: false, moved: false, wheel: 0, inside: true, dragX: 0, dragY: 0 },
    pad: { connected: false, axes: [0, 0], buttons: [], prev: [], pressed: new Set(), dir: new Set(), stick: {}, rx: 0, ry: 0 },
    lastDevice: "mouse",
    touch: false,
    onGesture: null,
  });

  if (typeof window.addEventListener === "function") {
    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey && !/^Control/.test(e.code)) || e.metaKey || e.altKey) return;
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      Input.rep.add(e.code);
      if (!e.repeat) { Input.keys.add(e.code); Input.pressed.add(e.code); }
      if (/^Arrow/.test(e.code)) Input.lastDevice = "keyboard";
      if (Input.onGesture) Input.onGesture();
    });
    window.addEventListener("keyup", (e) => Input.keys.delete(e.code));
    window.addEventListener("blur", () => { Input.keys.clear(); Input.mouse.down = false; });
  }

  Input.attachPointer = function (canvas, toLogical) {
    const m = Input.mouse;
    const pts = new Map(); // active touches for pinch zoom
    let pinch0 = 0;
    const pos = (cx, cy) => { const p = toLogical(cx, cy); m.x = p.x; m.y = p.y; };
    canvas.addEventListener("pointermove", (e) => {
      if (pts.has(e.pointerId)) pts.set(e.pointerId, toLogical(e.clientX, e.clientY));
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch0) m.pinch = (m.pinch || 1) * (d / pinch0);
        pinch0 = d;
        return;
      }
      const ox = m.x, oy = m.y;
      pos(e.clientX, e.clientY); m.moved = true; m.inside = true;
      if (m.down) { m.dragX += m.x - ox; m.dragY += m.y - oy; }
      Input.lastDevice = "mouse"; Input.touch = e.pointerType === "touch";
    });
    canvas.addEventListener("pointerdown", (e) => {
      pts.set(e.pointerId, toLogical(e.clientX, e.clientY));
      if (pts.size === 2) { pinch0 = 0; m.down = false; m.cancel = true; return; }
      pos(e.clientX, e.clientY);
      Input.touch = e.pointerType === "touch";
      Input.lastDevice = "mouse";
      if (e.button === 2) m.rclicked = true;
      else if (e.button === 1) { m.mdown = true; }
      else { m.down = true; m.clicked = true; m.downX = m.x; m.downY = m.y; m.dragDist = 0; }
      if (canvas.setPointerCapture) try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (Input.onGesture) Input.onGesture();
      e.preventDefault();
    });
    const up = (e) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch0 = 0;
      if (e.button === 1) m.mdown = false;
      if (e.button !== 2 && m.down) { m.down = false; m.released = true; }
    };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
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
    if (!gp) { pad.connected = false; pad.axes = [0, 0]; pad.buttons = []; pad.rx = pad.ry = 0; }
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
      const rx = gp.axes[2] || 0, ry = gp.axes[3] || 0;
      pad.rx = Math.abs(rx) > 0.25 ? rx : 0;
      pad.ry = Math.abs(ry) > 0.25 ? ry : 0;
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
      if (l > 0.2) {
        const sp = 900 * Math.min(1, l) * Math.min(1, l);
        Input.mouse.x = U.clamp(Input.mouse.x + ax * sp * dt, 0, U.W);
        Input.mouse.y = U.clamp(Input.mouse.y + ay * sp * dt, 0, U.H);
        Input.mouse.moved = true;
      }
    }
    if (Input.hitAction("click")) { Input.mouse.clicked = true; Input.mouse.released = true; Input.mouse.dragDist = 0; Input.mouse.downX = Input.mouse.x; Input.mouse.downY = Input.mouse.y; }
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
  Input.showCursor = () => Input.lastDevice === "pad";

  Input.endFrame = function () {
    Input.pressed.clear();
    Input.rep.clear();
    const m = Input.mouse;
    m.clicked = m.rclicked = m.released = m.moved = false;
    m.wheel = 0; m.dragX = 0; m.dragY = 0; m.pinch = 1; m.cancel = false;
  };
})(window.MG);
